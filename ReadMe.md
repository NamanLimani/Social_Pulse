# Bluesky → Kafka → MongoDB NLP Pipeline

This project builds a real‑time data pipeline that ingests posts from the Bluesky Jetstream “firehose”, processes them through multiple NLP stages, and stores both raw and enriched data in MongoDB. Kafka connects the stages and allows the system to scale and replay data.

## Overview

High-level flow:

1. **Bluesky Jetstream listener**  
   - Connects to Bluesky Jetstream via WebSocket.  
   - Assigns a stable `post_id` to each post.  
   - Upserts raw events into MongoDB (`bigdata.raw_posts`).  
   - Publishes events into Kafka topic `social_posts`.

2. **Language enrichment**  
   - Consumes from `social_posts`.  
   - Detects language of each post with `langdetect`.  
   - Upserts into `bigdata.language`.  
   - Emits to `social_posts_enriched`.

3. **Sentiment enrichment**  
   - Consumes from `social_posts_enriched`.  
   - Uses TextBlob to compute sentiment (positive/negative/neutral for English posts).  
   - Upserts into `bigdata.sentiment`.  
   - Emits to `social_posts_sentiment`.

4. **Entity extraction (NER)**  
   - Consumes from `social_posts_sentiment`.  
   - Uses spaCy (`en_core_web_sm`) to extract named entities.  
   - Upserts into `bigdata.entities`.  
   - Emits to `social_posts_ner`.

5. **Trend aggregation**  
   - Consumes from `social_posts_ner`.  
   - Counts entity mentions and associated sentiments in short time windows.  
   - Every N seconds, writes a leaderboard snapshot into `bigdata.trend_aggregates`.

6. **Topic modeling**  
   - Consumes batches of posts from `social_posts_ner`.  
   - Uses scikit‑learn (`CountVectorizer`, `TfidfTransformer`, `NMF`) to infer topics.  
   - Tags each post with a `topic` id and `topic_keywords`.  
   - Upserts into `bigdata.topics`.  
   - Emits to `social_posts_topics`.

7. **Anomaly detection (topic spikes)**  
   - Consumes from `social_posts_topics`.  
   - Builds topic-frequency windows and runs `IsolationForest` to flag anomalous spikes.  
   - Marks events with `topic_anomaly`.  
   - Upserts into `bigdata.anomalies`.  
   - Emits to `social_posts_anomaly`.

8. **Rumor detection (zero‑shot)**  
   - Consumes from `social_posts_anomaly`.  
   - Uses a Hugging Face zero‑shot model (`facebook/bart-large-mnli`) to classify posts as `rumor` / `not rumor`.  
   - Adds `is_rumor` and `rumor_score`.  
   - Upserts into `bigdata.rumor`.  
   - Emits to `social_posts_rumor`.

9. **Summarization (keyphrase‑based)**  
   - Consumes from `social_posts_rumor`.  
   - Uses spaCy + PyTextRank to generate a short extractive summary or key phrase.  
   - Adds `summary`.  
   - Upserts into `bigdata.summaries`.  
   - Emits to `social_posts_summary`.

10. **Hate / toxicity detection**  
    - Consumes from `social_posts_summary`.  
    - Uses a Hugging Face text‑classification model (`unitary/toxic-bert`) to score toxicity.  
    - Adds `toxic` and `toxicity_score`.  
    - Upserts into `bigdata.toxicity`.  
    - Emits to `social_posts_final`.

A small launcher script (`run_all.py` or similar) starts all the individual enrichment scripts in separate subprocesses so the whole pipeline runs with one command.

## Key Concepts

- **Kafka topics**  
  Each stage reads from one topic and writes to the next:
  - `social_posts` → `social_posts_enriched` → `social_posts_sentiment` → `social_posts_ner` →  
    `social_posts_topics` → `social_posts_anomaly` → `social_posts_rumor` → `social_posts_summary` → `social_posts_final`.

- **Stable `post_id`**  
  All collections in MongoDB use `post_id` as a unique key:
  - Writes use `update_one({"post_id": ...}, {"$set": ...}, upsert=True)`  
  - This makes the pipeline idempotent: reprocessing or replay from Kafka updates the same documents instead of creating duplicates.

- **MongoDB schema** (database `bigdata`)
  - `raw_posts`: full raw Jetstream events.  
  - `language`: `post_id`, `author`, `text`, `lang`.  
  - `sentiment`: language + sentiment label.  
  - `entities`: entities list per post.  
  - `trend_aggregates`: periodic top-entities leaderboard.  
  - `topics`: topic id and keywords for each post.  
  - `anomalies`: anomaly flag for topic spikes.  
  - `rumor`: rumor classification and score.  
  - `summaries`: short summary text per post.  
  - `toxicity`: toxicity classification and score.

- **Cursor-based resume for Jetstream**  
  The Bluesky listener stores the last seen `time_us` in a small Mongo collection (e.g., `jetstream_cursors`). On restart, it reconnects with a `cursor` parameter slightly before the last value and continues streaming, while `post_id` upserts prevent duplicates.

## Running the Pipeline

1. Start infrastructure (Kafka, Zookeeper, Mongo, Metabase) via Docker Compose.
2. Activate the Python virtual environment and install all requirements.
3. Run the launcher script, which:
   - Starts the Jetstream listener.
   - Starts each enrichment/aggregation script as its own process, chained via Kafka.



## Models and libraries used

- **langdetect**: quick language detection.
- **TextBlob**: rule+lexicon-based sentiment for English.[4]
- **spaCy**: NER and text processing.[5]
- **NLTK + scikit-learn (NMF)**: topic modeling and anomaly detection (IsolationForest).[10][5]
- **PyTextRank**: extractive summarization using TextRank graph algorithm.
- **HuggingFace Transformers**:
  - `facebook/bart-large-mnli` for zero-shot rumor detection.[9][8][6]
  - `unitary/toxic-bert` for hate/toxicity detection.[8][6]
- **MongoDB**: central document store for each enrichment layer.[11][5]
- **Kafka (kafka-python)**: streaming backbone for producers/consumers.[13][3][1]

| File                          | Purpose                                                  | Kafka Topic (in)       | Kafka Topic (out)      |
| ----------------------------- | -------------------------------------------------------- | ---------------------- | ---------------------- |
| bluesky_jetstream_to_kafka.py | Streams posts from Bluesky to Kafka (social_posts)       | –                      | social_posts           |
| enrich_language.py            | Detects post language, adds"lang"tag                     | social_posts           | social_posts_enriched  |
| enrich_sentiment.py           | Runs sentiment analysis (TextBlob)                       | social_posts_enriched  | social_posts_sentiment |
| enrich_entities.py            | Extracts entities (spaCy NER)                            | social_posts_sentiment | social_posts_ner       |
| enrich_topics.py              | Clusters posts into topics, adds"topic"&"topic_keywords" | social_posts_ner       | social_posts_topics    |
| enrich_anomaly.py             | Flags topic spikes/anomalies (IsolationForest)           | social_posts_topics    | social_posts_anomaly   |
| enrich_rumor.py               | Tags posts as"is_rumor"(keyword or ML)                   | social_posts_anomaly   | social_posts_rumor     |
| enrich_summary.py             | Summarizes posts (PyTextRank/spaCy)                      | social_posts_rumor     | social_posts_summary   |
| enrich_hate.py                | Detects toxicity/hate speech (Detoxify/HF pipeline)      | social_posts_summary   | social_posts_final     |
| trend_aggregator.py           | Prints top-trending entities over rolling window         | social_posts_ner       | (console/log)          |
| trend_aggregator_to_mongo.py  | Stores trending entities/leaderboards into MongoDB       | social_posts_ner       | MongoDB (aggregator)   |


to launch
1.python bluesky_jetstream_to_kafka.py
2.python enrich_language.py
3.python enrich_sentiment.py
4.python enrich_entities.py
5.python trend_aggregator.py
6.python enrich_topics.py
7.python enrich_anomaly.py
8.python enrich_rumor.py
9.python enrich_summary.py
10.python enrich_hate.py
