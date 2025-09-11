import os
import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException
from supabase import create_client, Client

# Initialize the logger for this module
logger = logging.getLogger("truth_scan_results_api")

# Create a new API router for this group of endpoints
router = APIRouter()

# Initialize Supabase client globally to be reused across requests
supabase: Optional[Client] = None
try:
    SUPABASE_URL = os.environ["SUPABASE_URL"]
    SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully.")
except KeyError as e:
    logger.error(f"Missing required environment variable: {e}")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {e}")
    supabase = None

@router.get("/post-scans", response_model=List[Dict[str, Any]])
async def get_post_scans_history():
    """
    Retrieves all past truth scan results from the Supabase database.
    The data is ordered by the creation timestamp in descending order.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service not available.")

    try:
        # Query the 'truth_scan_results' table
        # We order by 'created_at' in descending order to show the latest scans first
        response = supabase.table("truth_scan_results").select("*").order("created_at", desc=True).execute()
        
        # Supabase returns the data in the response object
        data = response.data
        
        logger.info(f"Successfully fetched {len(data)} truth scan results.")
        return data

    except Exception as e:
        logger.error(f"Failed to fetch truth scan results: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve scan history from the database.")
