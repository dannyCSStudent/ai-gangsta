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
import aiofiles

# The fix: Import the pre-initialized Supabase client instance
from app.supabase import supabase

from app.services.media_analysis import analyze_media_with_gemini, is_video, transcribe_audio_from_video
from app.services.claim_validation import extract_claims_with_groq, compare_claims_with_groq
from app.services.database_layer import save_scan_result

print("Starting the page truth scanner service...")
logger = logging.getLogger("post_truth_scanner")

# --- Groq API Setup for Text Analysis ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# --- Function to call the AI model for structured text analysis ---
def call_groq_api_for_analysis(text: str):
    """
    Sends a text to the Groq API for detailed analysis and returns the structured JSON response.
    """
    if not GROQ_API_KEY:
        logger.critical("GROQ_API_KEY environment variable is not set. Please set it before running the worker.")
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
                "content": """You are an advanced intelligence platform for truth analysis. Your task is to analyze a given text and provide a structured JSON response.

                The response MUST contain the following fields:
                - "summary": A concise, one-paragraph summary of the text.
                - "sentiment": Classify the overall sentiment of the text as "Positive", "Negative", or "Neutral".
                - "intent": Classify the primary intent as "Informational", "Opinion", "Promotion", or "Disinformation".
                - "entities": A JSON object containing lists of named entities. Each list should be empty if no entities of that type are found.
                    - "persons": A list of full names of people mentioned.
                    - "organizations": A list of organizations mentioned.
                    - "locations": A list of locations (cities, countries, landmarks) mentioned.
                - "mismatch_reason": A brief reason for any potential factual inconsistencies. If the text appears to be fact-based and verifiable, please state, "N/A - See summary".
                - "score": An integer score from 0 to 100, where 100 is highly accurate and 0 is completely false or misleading.
                
                Ensure the response is a single, valid JSON object and nothing else."""
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
        
        # Parse the JSON from the model's response
        analysis_data = response.json()['choices'][0]['message']['content']
        return json.loads(analysis_data)
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Groq API: {e}")
        return None
    except (KeyError, json.JSONDecodeError) as e:
        logger.error(f"Error parsing Groq API response: {e}")
        return None

# Your existing synchronous wrapper for media analysis
def perform_analysis_job_sync(caption: str, media_path: str, scan_id: str):
    """
    Synchronous wrapper to run the asynchronous media analysis pipeline.
    This function is executed by the RQ worker.
    """
    print(f"Starting media analysis job {scan_id} with media {media_path}")
    asyncio.run(perform_analysis_job_async(caption, media_path, scan_id))

# Your existing asynchronous function for media analysis
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
        
        save_scan_result(supabase, scan_id, final_results)
        
        logger.info(f"Successfully completed analysis for job {scan_id}.")

    except Exception as e:
        logger.error(f"Failed to process job {scan_id}: {e}", exc_info=True)
    finally:
        # Always clean up the temporary media file
        if media_path_obj.parent.exists():
            shutil.rmtree(media_path_obj.parent)

# The new synchronous wrapper for text analysis
def perform_text_analysis_job(text: str, scan_id: str):
    """
    Synchronous wrapper to run the asynchronous text analysis pipeline.
    This function is executed by the RQ worker.
    """
    print(f"Starting text analysis job {scan_id}")
    asyncio.run(perform_text_analysis_job_async(text, scan_id))

# The new asynchronous function for text analysis
async def perform_text_analysis_job_async(text: str, scan_id: str):
    """
    Performs the text analysis pipeline using an LLM.
    """
    try:
        # Call the LLM to get enriched analysis
        analysis_data = call_groq_api_for_analysis(text)
        
        if not analysis_data:
            logger.error(f"LLM analysis failed for job {scan_id}.")
            return {"error": "LLM analysis failed"}
        
        # Log the raw data from the API to confirm what we received
        logger.info(f"Received analysis data from Groq API for job {scan_id}: {analysis_data}")
            
        # The database layer expects a flat structure, so we prepare the data this way
        data_to_save = {
            "truth_summary": analysis_data.get("summary", ""),
            "score": analysis_data.get("score", 0),
            "mismatch_reason": analysis_data.get("mismatch_reason", "N/A - See truth_summary"),
            "entities": analysis_data.get("entities", {})
        }
        
        # Save the structured result to the database
        if not save_scan_result(supabase, scan_id, text, data_to_save):
            logger.error(f"Failed to save analysis for job {scan_id}.")
            return {"error": "Failed to save analysis"}
            
        logger.info(f"Successfully completed text analysis for job {scan_id}.")
        return data_to_save
    except Exception as e:
        logger.error(f"Text analysis job {scan_id} failed: {e}", exc_info=True)
        return {"error": "Analysis failed"}
