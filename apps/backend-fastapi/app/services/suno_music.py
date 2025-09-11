import os
import requests

SUNO_API_BASE_URL = os.getenv("SUNO_API_BASE_URL", "https://api.sunoapi.org/api/v1")
SUNO_API_KEY = os.getenv("SUNO_API_KEY")

if not SUNO_API_KEY:
    raise EnvironmentError("SUNO_API_KEY not set in environment variables")

print("[Suno] Music Service Loaded")

HEADERS = {
    "Authorization": f"Bearer {SUNO_API_KEY}",
    "Content-Type": "application/json"
}


def generate_music(prompt: str, style: str = "Hip-Hop", use_ai_lyrics: bool = True) -> dict:
    """
    Submit a music generation task to the Suno API.
    """
    print(f"[Suno] Generating music with prompt: {prompt} | Style: {style} | AI Lyrics: {use_ai_lyrics}")

    payload = {
        "prompt": f"{prompt} in the style of {style}",
        "customMode": True,
        "instrumental": not use_ai_lyrics,
        "model": "V3_5",
        "callBackUrl": "https://dummy.gangsta.ai/callback"  # Still required
    }

    try:
        response = requests.post(f"{SUNO_API_BASE_URL}/generate", headers=HEADERS, json=payload)
        response.raise_for_status()
        data = response.json()
        print("[Suno] Generation response:", data)
        return data
    except Exception as e:
        print("[Suno] Error generating music:", e)
        return {"code": 500, "msg": str(e), "data": None}


def get_download_url(track_id: str) -> str | None:
    """
    Fetch the download URL for a completed music track.
    """
    if not track_id:
        print("[Suno] Invalid track_id passed to get_download_url")
        return None

    try:
        print(f"[Suno] Fetching download URL for track ID: {track_id}")
        response = requests.get(f"{SUNO_API_BASE_URL}/download/{track_id}", headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        print("[Suno] Download URL response:", data)
        return data.get("download_url")
    except Exception as e:
        print("[Suno] Error fetching download URL:", e)
        return None


def get_lyrics(track_id: str) -> str | None:
    """
    Fetch the AI-generated lyrics for a music track.
    """
    if not track_id:
        print("[Suno] Invalid track_id passed to get_lyrics")
        return None

    try:
        print(f"[Suno] Fetching lyrics for track ID: {track_id}")
        response = requests.get(f"{SUNO_API_BASE_URL}/lyrics/{track_id}", headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        print("[Suno] Lyrics response:", data)
        return data.get("lyrics", "")
    except Exception as e:
        print("[Suno] Error fetching lyrics:", e)
        return None
    
def get_track_status(task_id: str):
    print(f"[Suno] Checking status for task {task_id}")
    try:
        response = requests.get(f"{SUNO_API_BASE_URL}/record-info/{task_id}", headers=HEADERS)
        print(f"[Suno] Status check response: {response}")
        if response.status_code != 200:
            print(f"[Suno] Status check returned {response.status_code}, retrying...")
            return {}
        return response.json()
    except requests.RequestException as e:
        print(f"[Suno] Error checking status: {e}")
        return {}


