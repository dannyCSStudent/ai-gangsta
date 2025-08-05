# app/api/routes/news_to_lyrics.py
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from pydantic import BaseModel
from supabase import create_client
import os

from app.ai.lyrics_generator import generate_lyrics
from app.ai.tts_generator import generate_vocals
from app.services.audio_mixer import mix_audio

router = APIRouter()

# Supabase client
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

class LyricsRequest(BaseModel):
    news_id: str
    genre: str = "gangsta rap"

@router.post("/news-to-song")
async def news_to_song(
    # Accept both query params and JSON body
    news_id: Optional[str] = Query(None, description="News UUID"),
    genre: Optional[str] = Query("gangsta rap"),
    body: Optional[LyricsRequest] = Body(None)
):
    # Priority: JSON body > query params
    if body:
        news_id = body.news_id
        genre = body.genre

    if not news_id:
        raise HTTPException(status_code=422, detail="Missing news_id")

    # 1. Fetch news from Supabase
    resp = supabase.table("smart_news").select("*").eq("id", news_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="News article not found")

    article = resp.data[0]
    title = article.get("title")
    summary = article.get("summary")

    # 2. Generate lyrics
    lyrics = generate_lyrics(title, summary, genre)

    # 3. Generate vocals
    vocals_path = generate_vocals(lyrics)

    # 4. Mix with beat
    beat_path = "app/data/beats/beat1.mp3"
    output_path = f"app/tmp/songs/{news_id}_song.mp3"
    final_song = mix_audio(vocals_path, beat_path, output_path)
    if not final_song:
        raise HTTPException(status_code=500, detail="Failed to mix audio")
    return {
        "news_id": news_id,
        "genre": genre,
        "lyrics": lyrics,
        "song_url": f"/songs/{news_id}_song.mp3"
    }
