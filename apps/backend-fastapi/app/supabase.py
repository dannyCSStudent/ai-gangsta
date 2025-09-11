import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set up logging
logger = logging.getLogger("post_truth_scanner")

# Initialize the Supabase client as a single, global instance
# We do this at the module level so it's created only once when imported
try:
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError("Supabase URL or Key not found in environment variables.")
    
    # Create the client instance
    supabase: Client = create_client(url, key)
    logger.info("Successfully created Supabase client.")

except Exception as e:
    logger.error(f"Failed to create Supabase client: {e}")
    # Re-raise the exception to prevent the application from starting with a bad connection
    raise

# This file now exports the 'supabase' object directly, which can be imported
# by other modules like `tasks.py`.
