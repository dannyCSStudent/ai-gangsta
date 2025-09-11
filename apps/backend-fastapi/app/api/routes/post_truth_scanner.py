import os
import shutil
import tempfile
import uuid
import logging
import json
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

# --- Import and setup RQ for job queueing ---
from redis import Redis
from rq import Queue
from rq.job import Job

# Import the background task function directly
from app.services.tasks import perform_analysis_job_sync

# --- Supabase Imports ---
from supabase.client import create_client, Client

# Initialize environment variables
load_dotenv()

# --- Configuration and Initialization ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
REDIS_URL = os.getenv("REDIS_URL")

# Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

logger = logging.getLogger("post_truth_scanner")

router = APIRouter()

# --- Redis Setup for RQ ---
redis_conn = Redis.from_url(REDIS_URL)
q = Queue('analysis_queue', connection=redis_conn)

async def save_upload_to_temp(upload: UploadFile) -> Path:
    """Saves an uploaded file to a temporary location and returns the path."""
    suffix = Path(upload.filename).suffix or ""
    tmp_dir = Path(tempfile.mkdtemp(prefix="post_scan_"))
    out_path = tmp_dir / (str(uuid.uuid4()) + suffix)
    
    # Using aiofiles for robust async file operations
    import aiofiles
    async with aiofiles.open(out_path, 'wb') as f:
        while content := await upload.read(1024 * 1024):
            await f.write(content)
    logger.info(f"Saved upload to {out_path}")
    return out_path

@router.post("/analyze-post")
async def analyze_post_endpoint(caption: str = Form(...), media: UploadFile = File(...)):
    """
    Submits a post for analysis to a background worker.
    Returns a scan ID immediately.
    """
    # Create the unique scan ID here, which will be used for the database result
    scan_id = str(uuid.uuid4())
    media_path = await save_upload_to_temp(media)
    
    try:
        # Enqueue the job using RQ's built-in method
        # Pass the generated scan_id to the worker function
        job = q.enqueue(
            perform_analysis_job_sync, 
            caption, 
            str(media_path), 
            scan_id
        )
        logger.info(f"Submitted job {job.id} to Redis queue.")

        # IMPORTANT: Return the unique scan_id, NOT the job.id
        # The frontend needs this ID to poll for the result in the database
        return JSONResponse(status_code=202, content={"message": "Analysis job submitted.", "scan_id": scan_id})

    except Exception as e:
        logger.exception("Failed to submit job to queue")
        # Ensure temporary file is cleaned up on failure
        if media_path.parent.exists():
            shutil.rmtree(media_path.parent)
        raise HTTPException(status_code=500, detail="Failed to submit analysis job.")

@router.get("/scan-results/{scan_id}")
async def get_scan_results(scan_id: str):
    """
    Retrieves the status and result of a completed analysis job by checking the database.
    """
    try:
        # Check Supabase for the scan result using the provided scan_id
        response = supabase.table("scan_results").select("*").eq("scan_id", scan_id).execute()
        
        if response.data:
            # If data is found, the job is complete. Return the result.
            result = response.data[0]
            return JSONResponse(status_code=200, content=result)
        else:
            # If no data is found, the job is likely still in progress or the ID is invalid.
            # We can check the RQ job status for a more accurate response.
            job: Job = q.fetch_job(scan_id)
            if job and job.get_status() == 'failed':
                 raise HTTPException(status_code=500, detail="Analysis job failed.")
            
            # This is the expected response while the job is running
            return JSONResponse(status_code=202, content={"status": "Analysis in progress. Keep polling."})
            
    except Exception as e:
        logger.error(f"Failed to retrieve scan results: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve scan results from database.")

@router.get("/post-scans")
async def get_all_scans():
    """
    Retrieves the full history of all past analysis results from the database.
    """
    try:
        response = supabase.table("scan_results").select("*").order("created_at", desc=True).execute()
        return JSONResponse(status_code=200, content=response.data)
    except Exception as e:
        logger.error(f"Failed to retrieve all scan results: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve scan history from database.")
