from typing import Dict, List
import yaml
import os
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from supabase import create_client, Client


FINGERPRINTS_PATH = "app/data/author_fingerprints.yaml"

# Load Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")

# here to dedug and maybe delete later
if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not set. Did you forget to load the .env file?")

SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def load_fingerprints() -> Dict[str, Dict[str, List[str] | str]]:
    with open(FINGERPRINTS_PATH, "r") as f:
        return yaml.safe_load(f)

def extract_features(text: str) -> str:
    # Can expand later with more advanced NLP preprocessing
    return text.lower()

def match_author(text: str, fingerprints: Dict[str, Dict[str, List[str] | str]]) -> Dict:
    all_texts = []
    labels = []

    for author, data in fingerprints.items():
        samples = data.get("samples", [])
        all_texts.extend(samples)
        labels.extend([author] * len(samples))

    # Add the new text to compare
    all_texts.append(extract_features(text))
    labels.append("input_text")

    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(all_texts)

    input_vec = vectors[-1]
    other_vecs = vectors[:-1]

    similarities = cosine_similarity(input_vec, other_vecs)[0]
    
    author_scores: Dict[str, List[float]] = {}
    for score, label in zip(similarities, labels[:-1]):
        author_scores.setdefault(label, []).append(score)

    avg_scores = {k: sum(v) / len(v) for k, v in author_scores.items()}
    best_match, best_score = max(avg_scores.items(), key=lambda x: x[1])

    result = {
        "author": best_match,
        "confidence": round(best_score, 4),
        "raw_scores": avg_scores
    }

    # Save match result to Supabase
    try:
        supabase.table("author_matches").insert({
            "transcript": text,
            "matched_author": best_match,
            "confidence": best_score,
            "raw_response": result
        }).execute()
    except Exception as e:
        result["save_error"] = str(e)

    return result
