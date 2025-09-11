import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger("post_truth_scanner")

# Initialize the Supabase client
def get_supabase_client() -> Client:
    """Creates and returns a Supabase client instance."""
    try:
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise ValueError("Supabase URL or Key not found in environment variables.")
        
        supabase_client: Client = create_client(url, key)
        logger.info("Successfully connected to Supabase.")
        return supabase_client
    except Exception as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        raise

def save_scan_result_to_supabase(scan_id: str, results: dict):
    """
    Saves the analysis results to a Supabase table.
    
    Args:
        scan_id (str): The unique ID of the scan.
        results (dict): The analysis results to save.
    """
    try:
        supabase_client = get_supabase_client()
        
        # We'll use a table named 'scan_results'
        # Adjust this if your table has a different name
        data_to_insert = {
            "id": scan_id,
            "results": results
        }
        
        # This inserts a new row into the 'scan_results' table
        response = supabase_client.table('scan_results').insert(data_to_insert).execute()
        
        # Check for errors in the response
        if response.data and response.data[0]['id'] == scan_id:
            logger.info(f"Scan result {scan_id} successfully saved to Supabase.")
        else:
            logger.error(f"Failed to save scan result {scan_id} to Supabase: {response.data}")

    except Exception as e:
        logger.error(f"An error occurred while saving to Supabase: {e}")
        raise
