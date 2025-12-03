from kafka import KafkaConsumer, KafkaProducer
import json
import spacy
import pytextrank
from pymongo import MongoClient
import copy

KAFKA_BOOTSTRAP = "localhost:9092"
CONSUME_TOPIC = "social_posts_rumor"
PRODUCE_TOPIC = "social_posts_summary"

nlp = spacy.load("en_core_web_sm")
nlp.add_pipe("textrank")

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="summarizer",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
summary_coll = db["summaries"]

print("Running extractive summarization...")

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

    if text.strip():
        doc = nlp(text)
        # For short posts, summary == post itself or key phrase
        summary = " ".join(
            str(sent)
            for sent in doc._.textrank.summary(limit_phrases=2, limit_sentences=1)
        )
        event["summary"] = summary
        print(f"Summary: {summary}")

        # Upsert into MongoDB using post_id as unique key
        summary_coll.update_one(
            {"post_id": event["post_id"]},
            {"$set": copy.deepcopy(event)},
            upsert=True,
        )

        # Send only the original (without _id) to Kafka
        producer.send(PRODUCE_TOPIC, value=event)
        producer.flush()
