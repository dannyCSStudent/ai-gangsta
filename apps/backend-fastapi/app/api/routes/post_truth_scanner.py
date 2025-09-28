import os
import shutil
import tempfile
import uuid
import logging
import json
from pathlib import Path
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# --- Import and setup RQ for job queueing ---
from redis import Redis
from rq import Queue
from rq.job import Job

# --- Supabase Imports ---
from supabase.client import create_client, Client
from app.services.supabase_layer import get_supabase_client  # use your centralized client

from app.services import tasks  # make sure tasks.py has __init__.py in folder


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
try:
    redis_conn = Redis.from_url(REDIS_URL)
    # Ping Redis to verify connection
    redis_conn.ping()
    q = Queue('analysis_queue', connection=redis_conn)
    text_analysis_queue = Queue('text_analysis_queue', connection=redis_conn)
    logger.info("Successfully connected to Redis.")
except Exception as e:
    logger.error(f"Failed to connect to Redis at {REDIS_URL}. Error: {e}")
    # This will cause the app to fail at startup if Redis is not available,
    # which is desirable behavior to prevent silent failures.
    raise RuntimeError("Failed to connect to Redis. Check REDIS_URL environment variable and Redis service.")

# --- Define the Pydantic model for the JSON payload ---
class ScanInput(BaseModel):
    text: str
    scan_id: str
    user_id: str  # <-- include user_id in the request payload

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
        # Pass the generated scan_id as the job_id to ensure consistency
        job = q.enqueue(
            tasks.perform_analysis_job_sync,
            caption,
            str(media_path),
            scan_id,        # pass scan_id explicitly
            job_id=scan_id
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

@router.post("/analyze-text")
async def analyze_text_endpoint(data: ScanInput):
    """
    Submits a block of text for analysis.
    Enqueues job with RQ, worker will upsert results.
    """
    try:
        # --- Step 1: Ensure scan_id exists ---
        scan_id = data.scan_id or str(uuid.uuid4())
        logger.info(f"Received text analysis request with scan_id={scan_id} for user {data.user_id}")

        # --- Step 2: Do NOT insert placeholder anymore ---
        # The worker will upsert results directly.

        # --- Step 3: Enqueue text analysis job ---
        job = text_analysis_queue.enqueue(
            tasks.perform_text_analysis_job,
            data.text,             # text to analyze
            scan_id,               # scan_id
            data.user_id,          # user_id
            job_id=scan_id         # use scan_id as RQ job_id for tracking
        )
        logger.info(f"Submitted text analysis job {job.id} with scan_id={scan_id} to Redis queue.")

        # --- Step 4: Respond immediately to client ---
        return JSONResponse(
            status_code=202,
            content={"message": "Analysis job submitted.", "scan_id": scan_id},
        )

    except Exception as e:
        logger.exception("Failed to submit text analysis job")
        raise HTTPException(status_code=500, detail="Failed to submit analysis job.")

    """
    Submits a block of text for analysis.
    Creates a placeholder scan_results row, then enqueues job with RQ.
    """
    try:
        # --- Step 1: Ensure scan_id exists ---
        scan_id = data.scan_id or str(uuid.uuid4())
        logger.info(f"Received text analysis request with scan_id={scan_id} for user {data.user_id}")

        # --- Step 2: Insert placeholder row in scan_results ---
        try:
            placeholder = {
                "scan_id": scan_id,
                "user_id": data.user_id,
                "caption": data.text,
                "truth_summary": None,
                "score": None,
                "mismatch_reason": None,
                "entities": None,
            }

            supabase.table("scan_results").insert(placeholder).execute()
            logger.info(f"Inserted placeholder scan_result row for scan_id={scan_id}")
        except Exception as e:
            logger.warning(f"Failed to insert placeholder row for scan_id={scan_id}: {e}")

        # --- Step 3: Enqueue text analysis job with all required args ---
        job = text_analysis_queue.enqueue(
            tasks.perform_text_analysis_job,
            data.text,             # text to analyze
            scan_id,               # scan_id
            data.user_id,          # user_id              
            job_id=scan_id         # use scan_id as RQ job_id for tracking
        )
        logger.info(f"Submitted text analysis job {job.id} with scan_id={scan_id} to Redis queue.")

        # --- Step 4: Respond immediately to client ---
        return JSONResponse(
            status_code=202,
            content={"message": "Analysis job submitted.", "scan_id": scan_id},
        )

    except Exception as e:
        logger.exception("Failed to submit text analysis job")
        raise HTTPException(status_code=500, detail="Failed to submit analysis job.")

@router.get("/text-scan-results/{scan_id}")
async def get_text_scan_results(scan_id: str):
    """
    Retrieves the results of a completed text analysis job from Supabase.
    This endpoint is polled by the frontend.
    """
    response = supabase.table("scan_results").select("*").eq("scan_id", scan_id).execute()
    
    results = response.data
    if not results:
        # If no results are found, the job is not yet complete.
        # Check RQ job status for a more detailed response
        job = text_analysis_queue.fetch_job(scan_id)
        if job and job.is_failed:
             raise HTTPException(status_code=500, detail="Analysis job failed.")
        
        # This is the expected response while the job is running
        raise HTTPException(status_code=202, detail="Analysis results not yet available. Keep polling.")
    
    result = results[0]

    # --- Parse JSON fields ---
    def safe_parse_json(value, fallback={}):
        if not value:
            return fallback
        if isinstance(value, dict):
            return value
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                # Sometimes Supabase stores as a stringified JSON string
                if isinstance(parsed, str):
                    try:
                        return json.loads(parsed)
                    except json.JSONDecodeError:
                        return fallback
                return parsed
            except json.JSONDecodeError:
                return fallback
        return fallback

    
    # Get the entities and ensure it's a dictionary
    entities_data = safe_parse_json(result.get("entities"), {})
    # if isinstance(entities_data, str):
    #     try:
    #         # If it's a string, attempt to parse it as JSON
    #         entities_data = json.loads(entities_data)
    #     except json.JSONDecodeError:
    #         # If the string is invalid JSON, default to an empty dictionary
    #         entities_data = {}
    # elif not isinstance(entities_data, dict):
    #     # If it's not a string or a dict (e.g., None), default to an empty dictionary
    #     entities_data = {}

    # Create a new, clean dictionary for the response
    results_data = safe_parse_json(result.get("results"), {})

    response_data: Dict[str, Any] = {
        "scan_id": result.get("scan_id", scan_id),
        "caption": result.get("caption", ""),
        "truth_summary": result.get("truth_summary", ""),
        "score": result.get("score", 0),
        "mismatch_reason": result.get("mismatch_reason", "N/A"),
        "entities": entities_data,
        "results": results_data,
    }

    return JSONResponse(content=response_data, status_code=200)