from kafka import KafkaConsumer, KafkaProducer
import json
import pandas as pd
from sklearn.ensemble import IsolationForest
from pymongo import MongoClient
import copy

KAFKA_BOOTSTRAP = "localhost:9092"
CONSUME_TOPIC = "social_posts_topics"
PRODUCE_TOPIC = "social_posts_anomaly"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="anomaly-detector",
    enable_auto_commit=True,
)

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)

# MongoDB setup
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
anomaly_coll = db["anomalies"]

WINDOW = 200
texts = []
topics = []
events = []

print("Running real-time anomaly detection (topic spike)...")

for msg in consumer:
    event = msg.value

    # Ensure post_id is present (should come from previous stages)
    post_id = event.get("post_id")
    if post_id is None:
        author = event.get("author", "unknown")
        created_at = event.get("created_at", "unknown")
        post_id = f"{author}:{created_at}"
        event["post_id"] = post_id

    if event.get("topic") is not None:
        topics.append(event["topic"])
        texts.append(event.get("text", ""))
        events.append(event)

    if len(topics) >= WINDOW:
        # Build topic count/frame for the batch
        df = pd.DataFrame({"topic": topics})
        topic_counts = df["topic"].value_counts().sort_index()
        topic_counts_sum = topic_counts.values.reshape(-1, 1)

        # Apply anomaly (outlier) detection to topic frequencies
        model = IsolationForest(contamination=0.1, random_state=42)
        preds = model.fit_predict(topic_counts_sum)

        anomalies = set(topic_counts.index[preds == -1])
        for i, event in enumerate(events):
            is_anomaly = event["topic"] in anomalies
            event["topic_anomaly"] = bool(is_anomaly)
            if is_anomaly:
                print(
                    f"⚠️ Anomalous topic spike detected: "
                    f"Topic {event['topic']} | {event['text'][:60]}"
                )

            # Upsert into MongoDB using post_id as unique key
            anomaly_coll.update_one(
                {"post_id": event["post_id"]},
                {"$set": copy.deepcopy(event)},
                upsert=True,
            )

            # Send only the original (no _id) to Kafka
            producer.send(PRODUCE_TOPIC, value=event)

        texts.clear()
        topics.clear()
        events.clear()
        producer.flush()
