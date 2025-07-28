# apps/backend-fastapi/app/ai/author_fingerprint.py

from typing import List, Dict
import random

IDEOLOGICAL_SOURCES = [
    "Neoconservative Think Tank",
    "Progressive Academic",
    "Populist Commentator",
    "Corporate PR Department",
    "Foreign Propaganda Unit",
    "Grassroots Activist",
]

def fingerprint_author(text: str) -> Dict[str, float]:
    """
    Analyze the text and return probabilities of ideological authorship.
    Currently uses mock data for demonstration.
    """
    # TODO: Replace this with real ML/NLP logic
    scores = {source: round(random.uniform(0, 1), 2) for source in IDEOLOGICAL_SOURCES}
    
    # Normalize scores to sum to 1
    total = sum(scores.values())
    normalized = {k: round(v / total, 2) for k, v in scores.items()}
    return normalized
