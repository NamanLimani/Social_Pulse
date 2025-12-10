1. Clone the repo

git clone https://github.com/your-username/bluesky-bigdata-pipeline.git

cd bluesky-bigdata-pipeline

2. Start infrastructure (Kafka, Zookeeper, MongoDB, Metabase)

Make sure Docker Desktop is running.

In the project folder:

docker-compose up -d

This will start:

Zookeeper (Kafka’s coordinator)

Kafka broker

MongoDB

Metabase (if you added it in docker-compose)

3. Create and activate Python virtual environment (only first time)

Create venv:

python3 -m venv nlp_venv

Activate venv:

source nlp_venv/bin/activate (on macOS/Linux)

4. Install required Python libraries

Inside the activated venv (prompt should show (nlp_venv)):

Upgrade tools:

pip install --upgrade pip setuptools wheel

Install all dependencies:

pip install kafka-python pymongo torch transformers spacy textblob nltk pytextrank pandas scikit-learn

5. Download language resources (one-time)

spaCy English model:

python -m spacy download en_core_web_sm

NLTK stopwords (in Python REPL or a small script):

python

then inside Python:

import nltk

nltk.download('stopwords')

exit()

6. Run the pipeline scripts

In one terminal (with venv activated):

Start the Bluesky → Kafka ingester:

python bluesky_jetstream_to_kafka.py

In additional terminals (all in project folder, all with venv activated), run the enrichment steps, for example:

python enrich_language.py

python enrich_sentiment.py

python enrich_entities.py

python enrich_topics.py

python enrich_anomaly.py

python enrich_rumor.py

python enrich_summary.py

python enrich_hate.py

python trend_aggregator.py

(Or if you have a master script like script.py that starts them all, run that instead: python script.py.)

7. View data in MongoDB / Metabase

MongoDB:

Connect with MongoDB Compass to mongodb://localhost:27017/

Database: bigdata

Collections: raw_posts, language, sentiment, entities, topics, anomalies, rumor, summaries, toxicity, trend_aggregates.

Metabase:

Go to http://localhost:3000 (or whatever port you mapped).

First time: create admin user.

Add MongoDB database:

Type: MongoDB

Host: mongodb (if Metabase in Docker) or localhost

Port: 27017

Database: bigdata

Build dashboards from the collections.
