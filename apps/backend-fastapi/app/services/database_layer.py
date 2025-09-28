import logging
from typing import Dict, Any, Optional
from supabase import Client

logger = logging.getLogger("post_truth_scanner")


def save_scan_result(
    supabase: Client,
    scan_id: str,
    user_id: str,
    caption: str,
    analysis_data: Dict[str, Any]
) -> bool:
    """
    Saves or updates a scan result in the 'scan_results' table.
    Uses upsert on 'scan_id' to ensure a placeholder row is updated or inserted.
    """

    try:
        # Prepare data to persist
        result_to_save = {
            "scan_id": scan_id,
            "user_id": user_id,
            "caption": caption,
            "truth_summary": analysis_data.get("truth_summary", "Analysis failed"),
            "score": analysis_data.get("score", 0),
            "mismatch_reason": analysis_data.get("mismatch_reason", "N/A"),
            "entities": analysis_data.get("entities", {})  # leave as dict for JSONB
        }

        logger.info(
            f"Saving scan result for scan_id={scan_id} | "
            f"caption={caption} | "
            f"truth_summary={result_to_save['truth_summary']} | "
            f"score={result_to_save['score']} | "
            f"mismatch_reason={result_to_save['mismatch_reason']}"
        )

        # Upsert handles both insert and update
        response = supabase.table("scan_results").upsert(
            result_to_save, on_conflict="scan_id"
        ).execute()

        if response.data:
            logger.info("Scan result saved successfully!")
            return True
        else:
            logger.error(f"Failed to save scan result. Supabase response: {response.data}")
            return False

    except Exception as e:
        logger.error(f"Error saving scan result for scan_id={scan_id}: {e}", exc_info=True)
        return False


def get_scan_result(supabase: Client, scan_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a single scan result from the database by scan_id.
    """
    try:
        response = supabase.table("scan_results").select("*").eq("scan_id", scan_id).execute()
        if response.data:
            return response.data[0]
        else:
            logger.warning(f"No scan result found for scan_id: {scan_id}")
            return None
    except Exception as e:
        logger.error(f"Failed to retrieve scan result for scan_id {scan_id}: {e}")
        return None
