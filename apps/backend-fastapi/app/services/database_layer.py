import logging
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config import DATABASE_URL

logger = logging.getLogger("post_truth_scanner")

def get_db_session() -> Session:
    """Creates a new database session."""
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        return SessionLocal()
    except Exception as e:
        logger.error(f"Failed to create database session: {e}")
        raise

def save_scan_result(supabase, scan_id: str, results: dict, db: Optional[Session] = None):
    """
    Saves the analysis results to the Supabase database.
    
    Args:
        supabase: The Supabase client instance.
        scan_id (str): The ID of the scan.
        results (dict): A dictionary containing the analysis results.
        db (Session, optional): The SQLAlchemy database session. Not used for Supabase.
    """
    try:
        # Get the nested 'comparison_results' dictionary.
        comparison_results = results.get('comparison_results', {})
        
        # Get the list of individual claim results from the 'results' key.
        # Use an empty list as a default to prevent errors.
        comparison_results_list = comparison_results.get('results', [])

        # --- Derive a single summary and score from the list of claims ---
        supported_count = sum(1 for claim in comparison_results_list if claim.get('status') == 'supported')
        total_claims = len(comparison_results_list)

        # Calculate a score as a percentage of supported claims.
        score = int((supported_count / total_claims) * 100) if total_claims > 0 else 0
        
        # Create a truth summary by joining all the explanations.
        truth_summary = " ".join([claim.get('explanation', '') for claim in comparison_results_list])
        
        # The entities field seems to be missing from the results.
        entities = None

        # --- Now, extract the necessary attributes from the top-level results ---
        caption = results.get('caption')
        
        # Create a dictionary with all the data to be inserted
        data = {
            'scan_id': scan_id, 
            'caption': caption,
            'truth_summary': truth_summary,
            'score': score,
            'mismatch_reason': 'N/A - See truth_summary', # You can set a default value here
            'entities': entities
        }
        
        print(f"Saving scan result for scan_id {scan_id} with caption: {caption}, truth_summary: {truth_summary}, score: {score}, mismatch_reason: {data['mismatch_reason']}, entities: {entities}")

        # Insert the data into the 'scan_results' table.
        supabase.table('scan_results').insert([data]).execute()
        
        logger.info("Scan result saved successfully!")
        return True

    except Exception as e:
        logger.error(f"Failed to save scan result {scan_id}: {e}")
        raise
