# app/ai/lyrics_generator.py
import os
from groq import Groq

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_lyrics(title: str, summary: str, genre: str = "gangsta rap") -> str:
    """
    Generate song lyrics based on news article summary and desired genre.
    Returns a 2-3 minute style song as text lyrics.
    """
    prompt = f"""
    Turn the following news article into a {genre} song.
    Make it fun, rhythmic, and around 2-3 minutes long.

    Title: {title}
    Summary: {summary}

    Lyrics:
    """

    # Call Groq Chat Completion
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",  # Recommended for long, creative output
        messages=[
            {"role": "system", "content": "You are a creative songwriter AI."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=500,  # ~2-3 minutes of lyrics
        temperature=0.9,  # More creative variation
    )

    # ✅ Access .content instead of dict key
    return response.choices[0].message.content.strip()
