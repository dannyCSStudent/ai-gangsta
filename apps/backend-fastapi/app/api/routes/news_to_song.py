from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.suno_music import generate_music, get_download_url, get_lyrics, get_track_status
from supabase import create_client, Client
import os
import time

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Secure this
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter()


class NewsToSongRequest(BaseModel):
    summary: str
    style: str = "Hip-Hop"
    use_ai_lyrics: bool = True


@router.post("/news-to-song")
def news_to_song(request: NewsToSongRequest):
    try:
        # Step 1: Generate music and get task ID
        generation = generate_music(
            prompt=request.summary,
            style=request.style,
            use_ai_lyrics=request.use_ai_lyrics
        )
        print("Music generation response:", generation)

        task_id = generation.get("data", {}).get("taskId")
        if not task_id:
            raise HTTPException(status_code=500, detail="No task ID returned from Suno")

        # Step 2: Poll until track is ready
        print(f"[Suno] Polling for task {task_id}")
        max_wait = 90  # seconds
        start_time = time.time()

        while time.time() - start_time < max_wait:
            status = get_track_status(task_id)
            print(f"[Suno] Poll result: {status}")

            track_list = status.get("data", {}).get("songs", [])
            if track_list:
                track_id = track_list[0].get("id")
                if track_id:
                    break

            time.sleep(2)  # slow down polling to avoid hitting API too hard
        else:
            raise TimeoutError("Suno track generation timed out")

        # Step 3: Fetch download URL and lyrics
        download_url = get_download_url(track_id)
        lyrics = get_lyrics(track_id)

        return {
            "track_id": track_id,
            "download_url": download_url,
            "lyrics": lyrics,
            "style": request.style,
            "summary": request.summary
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
