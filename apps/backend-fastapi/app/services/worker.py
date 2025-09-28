import os
import logging
from rq import Queue, Worker
from redis import Redis
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging for the worker process
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("worker")

# --- Import the background task logic ---
# This is the crucial line that tells the worker where to find the job function.
from app.services.tasks import perform_analysis_job

# -----------------
# Main Worker Loop
# -----------------

if __name__ == '__main__':
    # Get Redis connection details from environment variables
    redis_url = os.environ.get("REDIS_URL", "redis://my-redis-db:6379")

    # Connect to Redis
    try:
        redis_conn = Redis.from_url(redis_url)
        # Ping the server to check the connection
        redis_conn.ping()
        logger.info("Successfully connected to Redis.")
    except Exception as e:
        logger.exception(f"Failed to connect to Redis at {redis_url}. Check your Redis server and connection string.")
        exit(1)

    # Tell the worker which queue to listen on
    # This must match the queue name used in your FastAPI app (`post_truth_scanner.py`)
    queue_name = "analysis_queue"
    listen = [queue_name]

    # The Worker class automatically looks up the function from the imported module
    worker = Worker(listen, connection=redis_conn)
    logger.info(f"Worker is listening for jobs on '{queue_name}'...")
    worker.work()
