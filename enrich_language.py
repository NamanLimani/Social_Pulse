from kafka import KafkaConsumer, KafkaProducer
import json
from langdetect import detect
from pymongo import MongoClient
import copy

CONSUME_TOPIC = "social_posts"
PRODUCE_TOPIC = "social_posts_enriched"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="lang-enrich-group",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
lang_coll = db["language"]

print("Consuming posts, enriching with language detection...")

for msg in consumer:
    event = msg.value

    # Only process commit events for normal posts
    if (
        event.get("kind") == "commit"
        and isinstance(event.get("commit"), dict)
        and event["commit"].get("operation") == "create"
        and event["commit"].get("collection") == "app.bsky.feed.post"
        and "record" in event["commit"]
        and "text" in event["commit"]["record"]
    ):
        author = event.get("did", "unknown")
        text = event["commit"]["record"].get("text", "")
        created_at = event["commit"]["record"].get("createdAt", "unknown time")

        # Reuse post_id from upstream if present
        post_id = event.get("post_id")
        if post_id is None:
            # Fallback: build something deterministic if needed
            did = event.get("did", "unknown")
            time_us = event.get("time_us", "unknown")
            post_id = f"{did}:{time_us}"

        # Detect language
        try:
            lang = detect(text)
        except Exception:
            lang = "und"  # undetermined

        enriched_event = {
            "post_id": post_id,
            "author": author,
            "created_at": created_at,
            "text": text,
            "lang": lang,
        }

        # Upsert into MongoDB using post_id as unique key
        lang_coll.update_one(
            {"post_id": enriched_event["post_id"]},
            {"$set": copy.deepcopy(enriched_event)},
            upsert=True,
        )

        print(f"Lang {lang} | Post: {text[:60]}")
        # Send enriched event (with post_id) to Kafka
        producer.send(PRODUCE_TOPIC, value=enriched_event)
        producer.flush()
