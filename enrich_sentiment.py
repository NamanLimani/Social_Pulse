from kafka import KafkaConsumer, KafkaProducer
import json
from textblob import TextBlob
from pymongo import MongoClient
import copy

CONSUME_TOPIC = "social_posts_enriched"
PRODUCE_TOPIC = "social_posts_sentiment"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="sentiment-enrich-group",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
sent_coll = db["sentiment"]

print("Consuming enriched posts, adding sentiment scores...")

for msg in consumer:
    event = msg.value
    text = event.get("text", "")
    lang = event.get("lang", "und")

    # Ensure post_id is present (should come from previous stage)
    post_id = event.get("post_id")
    if post_id is None:
        author = event.get("author", "unknown")
        created_at = event.get("created_at", "unknown")
        post_id = f"{author}:{created_at}"
        event["post_id"] = post_id

    # Apply sentiment only to English (for this demo)
    if lang == "en" and text.strip():
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        if polarity > 0.1:
            sentiment = "positive"
        elif polarity < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"
    else:
        sentiment = "unknown"

    event["sentiment"] = sentiment

    # Upsert into MongoDB using post_id as unique key
    sent_coll.update_one(
        {"post_id": event["post_id"]},
        {"$set": copy.deepcopy(event)},
        upsert=True,
    )

    print(f"Sentiment {sentiment} | Lang {lang} | {text[:60]}")
    producer.send(PRODUCE_TOPIC, value=event)
    producer.flush()
