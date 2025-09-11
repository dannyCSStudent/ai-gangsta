import logging
import shutil
import asyncio
from pathlib import Path

# The fix: Import the pre-initialized Supabase client instance
from app.supabase import supabase

from app.services.media_analysis import analyze_media_with_gemini, is_video, transcribe_audio_from_video
from app.services.claim_validation import extract_claims_with_groq, compare_claims_with_groq
from app.services.database_layer import save_scan_result
print("Starting the page truth scanner service...")
logger = logging.getLogger("post_truth_scanner")

# This is the new wrapper function that RQ will call.
# It is a synchronous function that will run the asynchronous job.
def perform_analysis_job_sync(caption: str, media_path: str, scan_id: str):
    """
    Synchronous wrapper to run the asynchronous analysis pipeline.
    This function is executed by the RQ worker.
    """
    # We use asyncio.run() to start the event loop and execute our
    # asynchronous function.
    print(f"Starting job {scan_id} with media {media_path}")
    asyncio.run(perform_analysis_job_async(caption, media_path, scan_id))

# This is the asynchronous function that contains the analysis logic.
# It is now called by the synchronous wrapper.
async def perform_analysis_job_async(caption: str, media_path: str, scan_id: str):
    """
    Performs the full analysis pipeline on a given post.
    """
    try:
        media_path_obj = Path(media_path)
        logger.info(f"Starting analysis for job {scan_id} with media {media_path_obj}")
        
        # --- Step 1: Media Analysis with Gemini ---
        media_analysis_results = await analyze_media_with_gemini(media_path_obj, caption)
        
        # --- Step 2: Audio Transcription for video
        transcription = ""
        if is_video(media_path_obj):
            transcription = await transcribe_audio_from_video(media_path_obj)
        
        # --- Step 3: Claim Extraction ---
        extracted_claims = await extract_claims_with_groq(caption + " " + transcription)
        
        # --- Step 4: Claim Comparison & Fact-Checking ---
        comparison_results = await compare_claims_with_groq(extracted_claims, media_analysis_results)
        
        # --- Step 5: Save Results to Database ---
        final_results = {
            "media_path": media_path,
            "caption": caption,
            "media_analysis": media_analysis_results,
            "transcription": transcription,
            "claims": extracted_claims,
            "comparison_results": comparison_results
        }
        
        # The corrected line: pass the imported 'supabase' object
        save_scan_result(supabase, scan_id, final_results)
        
        logger.info(f"Successfully completed analysis for job {scan_id}.")

    except Exception as e:
        logger.error(f"Failed to process job {scan_id}: {e}", exc_info=True)
    finally:
        # Always clean up the temporary media file
        if media_path_obj.parent.exists():
            shutil.rmtree(media_path_obj.parent)
