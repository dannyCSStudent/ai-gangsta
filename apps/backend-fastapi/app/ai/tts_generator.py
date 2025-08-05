import os
import wave
from google import genai
from google.genai import types

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def wave_file(filename, pcm, channels=1, rate=24000, sample_width=2):
    """Save raw PCM audio to a WAV file."""
    with wave.open(filename, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm)

def generate_vocals(lyrics: str, voice_name: str = "Kore") -> str:
    """
    Generate vocals for the given lyrics and save as a WAV file using Gemini 2.5 TTS.
    Returns the path to the generated WAV file.
    """
    # File path
    output_path = "app/tmp/songs/news_song.wav"

    # Generate audio from text
    response = client.models.generate_content(
        model="gemini-2.5-flash-preview-tts",  # TTS model
        contents=f"Sing/rap these lyrics in a cool, {voice_name} style:\n{lyrics}",
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=voice_name
                    )
                )
            ),
        )
    )

    # Extract audio data
    pcm_data = response.candidates[0].content.parts[0].inline_data.data

    # Save as WAV
    wave_file(output_path, pcm_data)

    return output_path
