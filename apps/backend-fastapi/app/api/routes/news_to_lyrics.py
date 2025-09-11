import os
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional
from supabase import create_client
from app.ai.lyrics_generator import generate_lyrics
from app.ai.tts_generator import generate_vocals
from app.services.audio_mixer import mix_audio

router = APIRouter()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

class LyricsRequest(BaseModel):
    news_id: str
    genre: str = "gangsta rap"

@router.post("/news-to-song")
async def news_to_song(
    news_id: Optional[str] = Query(None),
    genre: Optional[str] = Query("gangsta rap"),
    body: Optional[LyricsRequest] = Body(None)
):
    # Pick from JSON if query empty
    if body:
        news_id = news_id or body.news_id
        genre = body.genre or genre

    if not news_id:
        raise HTTPException(status_code=400, detail="Missing news_id")

    print("Generating WAV song for:", news_id)

    # Fetch news item
    news_item = supabase.table("smart_news").select("*").eq("id", news_id).single().execute()
    if not news_item.data:
        raise HTTPException(status_code=404, detail="News not found")

    title = news_item.data["title"]
    summary = news_item.data["summary"]

    # Generate lyrics & vocals
    lyrics = generate_lyrics(title, summary, genre)
    vocals_path = generate_vocals(lyrics)  # This can remain MP3 or WAV

    # Mix with beat -> output as WAV for mobile reliability
    beat_path = "app/data/beats/beat1.mp3"
    output_path = f"app/tmp/songs/{news_id}_song.wav"
    mix_audio(vocals_path, beat_path, output_path)

    # Save to Supabase history
    supabase.table("news_songs").insert({
        "news_id": news_id,
        "genre": genre,
        "lyrics": lyrics,
        "song_url": f"/songs/{news_id}_song.wav"
    }).execute()

    return {
        "news_id": news_id,
        "genre": genre,
        "lyrics": lyrics,
        "song_url": f"/songs/{news_id}_song.wav"
    }
