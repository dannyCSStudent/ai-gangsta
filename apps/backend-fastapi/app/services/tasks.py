import os
import shutil
import tempfile
import uuid
import logging
import json
import asyncio
from pathlib import Path
from typing import Optional

import requests

# --- Supabase ---
from app.supabase import supabase
from app.services.supabase_layer import get_supabase_client

# --- Media & Claim Services ---
from app.services.media_analysis import analyze_media_with_gemini, is_video, transcribe_audio_from_video
from app.services.claim_validation import extract_claims_with_groq, compare_claims_with_groq
from app.services.database_layer import save_scan_result

# --- Logging ---
logger = logging.getLogger("post_truth_scanner")
logging.basicConfig(level=logging.INFO)

print("Starting the post truth scanner service...")

# --- Groq API Configuration ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def call_groq_api_for_analysis(text: str) -> Optional[dict]:
    """
    Sends text to Groq API for structured analysis and returns JSON.
    """
    if not GROQ_API_KEY:
        logger.critical("GROQ_API_KEY is not set.")
        return None

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an advanced intelligence platform for truth analysis. "
                    "Analyze the text and return a single JSON with the following keys: "
                    "summary, sentiment, intent, entities (persons, organizations, locations), "
                    "mismatch_reason, score."
                )
            },
            {
                "role": "user",
                "content": f"Analyze the following text:\n\n{text}"
            }
        ],
        "temperature": 0.5,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        analysis_data = response.json()['choices'][0]['message']['content']
        return json.loads(analysis_data)
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Groq API: {e}")
        return None
    except (KeyError, json.JSONDecodeError) as e:
        logger.error(f"Error parsing Groq API response: {e}")
        return None


async def perform_analysis_job_async(caption: str, media_path: str, scan_id: str):
    """
    Async pipeline for media + text analysis.
    """
    media_path_obj = Path(media_path)
    try:
        logger.info(f"Starting analysis for job {scan_id} with media {media_path_obj}")

        # --- Step 1: Media Analysis ---
        media_analysis_results = await analyze_media_with_gemini(media_path_obj, caption)

        # --- Step 2: Audio Transcription for video ---
        transcription = ""
        if is_video(media_path_obj):
            transcription = await transcribe_audio_from_video(media_path_obj)

        # --- Step 3: Claim Extraction ---
        extracted_claims = await extract_claims_with_groq(caption + " " + transcription)

        # --- Step 4: Claim Comparison & Fact-Checking ---
        comparison_results = await compare_claims_with_groq(extracted_claims, media_analysis_results)

        # --- Step 5: Save Results ---
        final_results = {
            "media_path": str(media_path_obj),
            "caption": caption,
            "media_analysis": media_analysis_results,
            "transcription": transcription,
            "claims": extracted_claims,
            "comparison_results": comparison_results
        }

        save_scan_result(supabase, scan_id, final_results)
        logger.info(f"Successfully completed analysis for job {scan_id}")

    except Exception as e:
        logger.error(f"Failed to process job {scan_id}: {e}", exc_info=True)
    finally:
        # --- Cleanup temporary media files ---
        if media_path_obj.parent.exists():
            shutil.rmtree(media_path_obj.parent)


# --- Synchronous Wrapper for Text Analysis ---
def perform_text_analysis_job(text: str, scan_id: str, user_id: str):
    """
    Entry point for RQ worker to run text analysis.
    """
    supabase_client = get_supabase_client()
    asyncio.run(perform_text_analysis_job_async(text, scan_id, user_id, supabase_client))


# --- Asynchronous Text Analysis Pipeline ---
async def perform_text_analysis_job_async(text: str, scan_id: str, user_id: str, supabase_client):
    try:
        logger.info(f"Starting async text analysis for scan_id={scan_id}, user_id={user_id}")

        analysis_result = call_groq_api_for_analysis(text)
        if not analysis_result:
            logger.warning(f"No analysis result for scan_id={scan_id}")
            return

        truth_summary = analysis_result.get("summary") or ""
        mismatch_reason = analysis_result.get("mismatch_reason") or "N/A"
        entities = analysis_result.get("entities") or {"persons": [], "organizations": [], "locations": []}

        raw_score = analysis_result.get("score")
        if isinstance(raw_score, dict):
            score = float(raw_score.get("accuracy", 0))
        elif raw_score is None:
            score = 0.0
        else:
            score = float(raw_score)

        upsert_payload = {
            "scan_id": scan_id,
            "user_id": user_id,
            "caption": text,
            "truth_summary": truth_summary,
            "mismatch_reason": mismatch_reason,
            "entities": json.dumps(entities),
            "score": score,
            "results": json.dumps(analysis_result),
        }

        supabase_client.table("scan_results") \
            .upsert(upsert_payload, on_conflict="scan_id") \
            .execute()

        logger.info(f"Upserted analysis results for scan_id={scan_id}")

    except Exception as e:
        logger.error(f"Error in text analysis job (scan_id={scan_id}): {e}", exc_info=True)
        raise
