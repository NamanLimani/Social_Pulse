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
CONSUME_TOPIC = "social_posts_summary"
PRODUCE_TOPIC = "social_posts_final"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="hf-hate-detector",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
hate_coll = db["toxicity"]

print("Running hate speech detection (HF pipeline)...")
classifier = pipeline("text-classification", model="unitary/toxic-bert", device=-1)
# For a lighter/faster test: model="distilbert-base-uncased-finetuned-sst-2-english"

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

    is_toxic = False
    toxicity_score = 0.0

    if text.strip():
        res = classifier(text)
        # Some models return label as "toxic"/"non-toxic" or "LABEL_1"/"LABEL_0"
        label = res[0]["label"].lower()

        toxicity_score = float(res[0]["score"])
        is_toxic = toxicity_score >= 0.6

    event["toxic"] = is_toxic
    event["toxicity_score"] = toxicity_score

    print(f"Toxic={is_toxic} | Score={toxicity_score:.2f} | {text[:60]}")

    # Upsert into MongoDB using post_id as unique key
    hate_coll.update_one(
        {"post_id": event["post_id"]},
        {"$set": copy.deepcopy(event)},
        upsert=True,
    )

    producer.send(PRODUCE_TOPIC, value=event)
    producer.flush()
