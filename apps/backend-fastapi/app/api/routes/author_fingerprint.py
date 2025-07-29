from fastapi import APIRouter, Body
from app.core.author_matcher import load_fingerprints, match_author

router = APIRouter()

@router.post("/match-author")
def match(text: str = Body(..., embed=True)):
    fingerprints = load_fingerprints()
    result = match_author(text, fingerprints)
    return result
