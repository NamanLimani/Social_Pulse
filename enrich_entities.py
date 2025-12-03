from kafka import KafkaConsumer, KafkaProducer
import spacy
import json
from pymongo import MongoClient
import copy

# Load spaCy English model (expand for other langs if needed)
nlp = spacy.load("en_core_web_sm")

CONSUME_TOPIC = "social_posts_sentiment"
PRODUCE_TOPIC = "social_posts_ner"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="entity-enrich-group",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
ent_coll = db["entities"]

print("Consuming posts, extracting entities...")

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

    # Only process English for demo (spaCy model is English here)
    if event.get("lang") == "en" and text.strip():
        doc = nlp(text)
        entities = [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
    else:
        entities = []

    event["entities"] = entities

    # Upsert into MongoDB using post_id as unique key
    ent_coll.update_one(
        {"post_id": event["post_id"]},
        {"$set": copy.deepcopy(event)},
        upsert=True,
    )

    print(f"Entities found: {entities} | {text[:60]}")
    producer.send(PRODUCE_TOPIC, value=event)
    producer.flush()
