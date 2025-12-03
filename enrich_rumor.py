import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from kafka import KafkaConsumer, KafkaProducer
import json
from pymongo import MongoClient
import copy
from transformers import pipeline

KAFKA_BOOTSTRAP = "localhost:9092"
CONSUME_TOPIC = "social_posts_anomaly"
PRODUCE_TOPIC = "social_posts_rumor"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="rumor-detector",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
rumor_coll = db["rumor"]

print("Running ML-based rumor detection (zero-shot)...")

# HuggingFace zero-shot pipeline with CPU only
classifier = pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli",
    device=-1,
)
# For a lighter model, you can use: model="valhalla/distilbart-mnli-12-6"

rumor_labels = ["rumor", "not rumor"]

for msg in consumer:
    event = msg.value
    text = event.get("text", "")

    # Ensure post_id is present (should come from previous stages)
    post_id = event.get("post_id")
    if post_id is None:
        author = event.get("author", "unknown")
        created_at = event.get("created_at", "unknown")
        post_id = f"{author}:{created_at}"
        event["post_id"] = post_id

    is_rumor = False
    rumor_score = 0.0

    if text.strip():
        result = classifier(text, rumor_labels)
        # result['labels'] is ordered by descending score
        is_rumor = result["labels"][0] == "rumor"
        rumor_score = float(result["scores"][0])

    event["is_rumor"] = is_rumor
    event["rumor_score"] = rumor_score

    print(f"Rumor={is_rumor} | Score={rumor_score:.2f} | {text[:60]}")

    # Upsert into MongoDB using post_id as unique key
    rumor_coll.update_one(
        {"post_id": event["post_id"]},
        {"$set": copy.deepcopy(event)},
        upsert=True,
    )

    # Send only the original (no _id) to Kafka
    producer.send(PRODUCE_TOPIC, value=event)
    producer.flush()
