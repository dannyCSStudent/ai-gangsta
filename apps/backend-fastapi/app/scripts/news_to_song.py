# apps/backend-fastapi/scripts/news_to_song.py

from services.suno_music import generate_music, get_download_url, get_lyrics

def generate_song_from_news(summary: str, style: str = "Hip-Hop"):
    generation = generate_music(prompt=summary, style=style)
    track_id = generation.get("track_id")
    download_url = get_download_url(track_id)
    lyrics = get_lyrics(track_id)

    print("🎵 Download:", download_url)
    print("🎤 Lyrics:\n", lyrics)

    return {
        "summary": summary,
        "lyrics": lyrics,
        "download_url": download_url
    }
