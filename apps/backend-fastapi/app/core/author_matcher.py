from typing import Dict, List
import yaml
import os
import json
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client

FINGERPRINTS_PATH = "app/data/author_fingerprints.yaml"

# Load Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not set. Did you forget to load the .env file?")

SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not set. Check your .env.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_fingerprints() -> Dict[str, Dict[str, List[str] | str]]:
    """Load author fingerprints from YAML file."""
    with open(FINGERPRINTS_PATH, "r") as f:
        return yaml.safe_load(f)

def extract_features(text: str) -> str:
    """Basic text preprocessing for similarity."""
    return text.lower()

def match_author(text: str, fingerprints: Dict[str, Dict[str, List[str] | str]]) -> Dict:
    """Match text to the most likely author fingerprint."""
    all_texts = []
    labels = []

    for author, data in fingerprints.items():
        samples = data.get("samples", [])
        all_texts.extend(samples)
        labels.extend([author] * len(samples))

    if not all_texts:
        return {
            "error": "No author fingerprints available",
            "saved": False
        }

    # Add input text to compare
    all_texts.append(extract_features(text))
    labels.append("input_text")

    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(all_texts)

    input_vec = vectors[-1]
    other_vecs = vectors[:-1]

    similarities = cosine_similarity(input_vec, other_vecs)[0]

    # Aggregate scores per author
    author_scores: Dict[str, List[float]] = {}
    for score, label in zip(similarities, labels[:-1]):
        author_scores.setdefault(label, []).append(score)

    avg_scores = {k: sum(v) / len(v) for k, v in author_scores.items()}
    best_match, best_score = max(avg_scores.items(), key=lambda x: x[1])

    result = {
        "author": best_match,
        "confidence": round(best_score, 4),
        "raw_scores": avg_scores,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # Save match result to Supabase
    try:
        db_res = supabase.table("author_matches").insert({
            "transcript": text,
            "matched_author": best_match,
            "confidence": best_score,
            "raw_response": result
        }).execute()

        if db_res.data:
            result["saved"] = True
            result["id"] = db_res.data[0].get("id")
        else:
            result["saved"] = False
            result["save_error"] = db_res.error if hasattr(db_res, "error") else "Unknown insert result"

    except Exception as e:
        result["saved"] = False
        result["save_error"] = str(e)

    return result
