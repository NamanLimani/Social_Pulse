import asyncio
import json
import copy
import time

import websockets
from kafka import KafkaProducer
from pymongo import MongoClient


# Kafka config
KAFKA_TOPIC = "social_posts"
KAFKA_BOOTSTRAP = "localhost:9092"
producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)


# MongoDB config
mongo = MongoClient("mongodb://localhost:27017/")
db = mongo["bigdata"]
raw_coll = db["raw_posts"]
cursor_coll = db["jetstream_cursors"]  # store last cursor here


# Jetstream endpoint (as of Nov 2025)
BASE_JETSTREAM_URI = (
    "wss://jetstream2.us-east.bsky.network/subscribe"
    "?wantedCollections=app.bsky.feed.post"
)


def build_post_id(data: dict) -> str:
    """
    Build a stable ID for each post.
    Uses DID + commit.rev when available; otherwise falls back to did + time_us.
    """
    did = data.get("did", "unknown")
    commit = data.get("commit") or {}
    rev = commit.get("rev")
    time_us = data.get("time_us")

    if rev is not None:
        return f"{did}:{rev}"
    elif time_us is not None:
        return f"{did}:{time_us}"
    else:
        # Last-resort fallback; still deterministic for this message
        return did


def load_last_cursor() -> int | None:
    doc = cursor_coll.find_one({"_id": "jetstream_cursor"})
    if doc and "time_us" in doc:
        try:
            return int(doc["time_us"])
        except Exception:
            return None
    return None


def save_last_cursor(time_us: int) -> None:
    cursor_coll.update_one(
        {"_id": "jetstream_cursor"},
        {"$set": {"time_us": int(time_us)}},
        upsert=True,
    )


async def listen_to_bluesky():
    while True:
        try:
            # Build URI with cursor if available
            # last_cursor = load_last_cursor()
            last_cursor = int(time.time() * 1000)
            uri = BASE_JETSTREAM_URI
            if last_cursor is not None:
                # Small rewind (5 seconds) to be safe against gaps
                rewind = 5_000_000  # microseconds
                start_cursor = max(0, last_cursor - rewind)
                uri = f"{BASE_JETSTREAM_URI}"

            print(f"Connecting to Bluesky Jetstream with cursor={last_cursor}...")
            async with websockets.connect(
                uri,
                ping_interval=20,
                ping_timeout=20,
            ) as websocket:
                while True:
                    message = await websocket.recv()
                    # Optional: trim log output
                    print("Raw from Bluesky:", str(message)[:120])

                    data = json.loads(message)

                    # Add stable post_id
                    data["post_id"] = build_post_id(data)

                    # Upsert into MongoDB using post_id as unique key
                    raw_coll.update_one(
                        {"post_id": data["post_id"]},
                        {"$set": copy.deepcopy(data)},
                        upsert=True,
                    )

                    # Save cursor so we can resume on reconnect/restart
                    if "time_us" in data:
                        save_last_cursor(data["time_us"])

                    # Forward the original (without MongoDB _id) to Kafka
                    producer.send(KAFKA_TOPIC, value=data)
                    producer.flush()

        except asyncio.CancelledError:
            # Task cancelled (shutdown)
            print("listen_to_bluesky task cancelled, shutting down.")
            break
        except Exception as e:
            print("WebSocket error, reconnecting in 5s:", e)
            await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(listen_to_bluesky())
    except KeyboardInterrupt:
        print("Received Ctrl+C, exiting Bluesky listener.")
