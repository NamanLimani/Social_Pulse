import subprocess
import time

# List your scripts here in the order you want to start them
scripts_to_run = [
    "enrich_hate.py",
    "enrich_summary.py",
    "enrich_rumor.py",
    "enrich_anomaly.py",
    "enrich_topics.py",
    "enrich_entities.py",
    "enrich_sentiment.py",
    "enrich_hashtags.py",
    "enrich_language.py",
    "bluesky_jetstream_to_kafka.py"
]

processes = []

try:
    # Start each process
    for script in scripts_to_run:
        print(f"Starting {script}...")
        proc = subprocess.Popen(["python", script])
        processes.append(proc)
        time.sleep(10)  # small delay to stagger startups

    print("All scripts running. Press Ctrl+C to exit.")

    # Wait indefinitely
    while True:
        time.sleep(10)

except KeyboardInterrupt:
    print("Received exit signal, terminating all processes...")
    for proc in processes:
        proc.terminate()
    print("All processes terminated. Exiting.")
