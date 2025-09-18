import json
import logging
from typing import Dict, Any, Optional
from supabase import Client

logger = logging.getLogger("post_truth_scanner")

def save_scan_result(
    supabase: Client, 
    scan_id: str, 
    caption: str, 
    analysis_data: Dict[str, Any]
) -> bool:
    """
    Saves the final scan result, including a complete analysis, to the Supabase database.
    This function now expects a flat dictionary for the analysis data.
    """
    try:
        # Prepare the data for insertion
        result_to_save = {
            "scan_id": scan_id,
            "caption": caption,
            "truth_summary": analysis_data.get("truth_summary", "Analysis failed"),
            "score": analysis_data.get("score", 0),
            "mismatch_reason": analysis_data.get("mismatch_reason", "N/A"),
            "entities": json.dumps(analysis_data.get("entities", {})) # Entities should be a JSON string
        }
        
        logger.info(f"Saving scan result for scan_id {scan_id} with caption: {caption}, truth_summary: {result_to_save.get('truth_summary')}, score: {result_to_save.get('score')}, mismatch_reason: {result_to_save.get('mismatch_reason')}, entities: {result_to_save.get('entities')}")

        # The core Supabase insert operation
        response = supabase.table("scan_results").insert(result_to_save).execute()
        
        if response.data:
            logger.info("Scan result saved successfully!")
            return True
        else:
            logger.error(f"Failed to save scan result. Supabase response: {response.data}")
            return False

    except Exception as e:
        logger.error(f"An unexpected error occurred while saving to Supabase: {e}", exc_info=True)
        return False

def get_scan_result(supabase: Client, scan_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single scan result from the database by scan_id.
    """
    try:
        response = supabase.table("scan_results").select("*").eq("scan_id", scan_id).execute()
        
        if response.data:
            # The result is a list, so we take the first item
            return response.data[0]
        else:
            logger.warning(f"No scan result found for scan_id: {scan_id}")
            return None
    except Exception as e:
        logger.error(f"Failed to retrieve scan result for scan_id {scan_id}: {e}")
        return None
