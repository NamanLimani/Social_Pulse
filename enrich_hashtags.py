import os
from kafka import KafkaConsumer
import json
import re
from pymongo import MongoClient
from datetime import datetime

# Configuration
CONSUME_TOPIC = "social_posts_enriched"
KAFKA_BOOTSTRAP = "localhost:9092"

consumer = KafkaConsumer(
    CONSUME_TOPIC,
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    auto_offset_reset="earliest",
    group_id="hashtag-extractor",
    enable_auto_commit=True,
)

# MongoDB connection
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
# We store raw hashtag lists here, not aggregates
hashtag_coll = db["hashtags"] 

print("Extracting Hashtags to MongoDB...")

for msg in consumer:
    event = msg.value
    
    # 1. Filter: Only English
    if event.get("lang") != "en":
        continue

    # 2. Extract Hashtags
    text = event.get("text", "").lower()
    hashtags = re.findall(r"#\w+", text)
    
    # Only save if hashtags exist
    if hashtags:
        # 3. Parse Timestamp for efficient querying
        # (This is the most critical part for the dashboard to work)
        created_at_str = event.get("created_at")
        

        # 4. Save to MongoDB
        # We perform an upsert to avoid duplicates
        hashtag_coll.update_one(
            {"post_id": event.get("post_id")}, 
            {
                "$set": {
                    "post_id": event.get("post_id"),
                    "hashtags": hashtags,  # List: ["#art", "#tech"]
                    "created_at": created_at_str
                }
            },
            upsert=True
        )
        print(f"{created_at_str} | Saved: {hashtags}")