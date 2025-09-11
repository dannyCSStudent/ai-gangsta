import os
import uuid
import subprocess
import tempfile
import base64
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

import aiofiles

# Optional clients
try:
    import google.generativeai as genai
    from google.generativeai.types import HarmCategory, HarmBlockThreshold
except Exception as e:
    genai = None
    print(f"Failed to import Google Generative AI client: {e}")

try:
    import whisper
except Exception as e:
    whisper = None
    print(f"Failed to import Whisper: {e}")

# --- Global Configurations ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Setup Gemini client
gemini_client = None
if genai and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_client = genai
    except Exception as e:
        print(f"Failed to configure Gemini client: {e}")
        gemini_client = None

# Setup Whisper model (lazy load)
whisper_model = None
def get_whisper_model():
    global whisper_model
    if whisper_model is None:
        try:
            whisper_model = whisper.load_model("base")
        except Exception as e:
            logging.error(f"Failed to load Whisper model: {e}")
            return None
    return whisper_model

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("media_analysis_service")

# --- Media helpers ---

def is_video(p: Path) -> bool:
    return p.suffix.lower() in {".mp4",".mov",".mkv",".webm",".avi"}

def is_image(p: Path) -> bool:
    return p.suffix.lower() in {".jpg",".jpeg",".png",".bmp",".webp",".tiff"}

def extract_keyframes(video_path: Path, n_frames: int = 5) -> List[Path]:
    """Extracts keyframes from a video using ffmpeg."""
    out_dir = video_path.parent / (video_path.stem + "_frames")
    out_dir.mkdir(exist_ok=True)
    frame_paths = []
    try:
        cmd = ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(video_path)]
        duration_str = subprocess.check_output(cmd, text=True).strip()
        duration = float(duration_str) if duration_str else 0
    except (subprocess.CalledProcessError, ValueError) as e:
        logger.warning(f"Failed to get video duration with ffprobe: {e}. Falling back to default intervals.")
        duration = 0
    
    intervals = [duration * (i + 1) / (n_frames + 1) for i in range(n_frames)]

    for idx, t in enumerate(intervals):
        frame_file = out_dir / f"frame_{idx:02d}.jpg"
        cmd = ["ffmpeg", "-y", "-ss", str(t), "-i", str(video_path), "-vframes", "1", "-q:v", "2", str(frame_file)]
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if frame_file.exists():
                frame_paths.append(frame_file)
        except Exception as e:
            logger.warning(f"ffmpeg frame extraction failed for frame {idx} at {t}s: {e}")
            
    return frame_paths

def extract_audio_from_video(video_path: Path) -> Path:
    """Extracts audio from a video file using ffmpeg and returns the audio path."""
    audio_path = video_path.parent / (video_path.stem + ".mp3")
    cmd = ["ffmpeg", "-y", "-i", str(video_path), "-q:a", "0", "-map", "a", str(audio_path)]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return audio_path
    except Exception as e:
        logger.error(f"Failed to extract audio from video: {e}")
        return None

def encode_image_to_base64(image_path: Path) -> str:
    """Encodes an image file to a base64 string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

async def analyze_with_gemini(parts: List[Any], model_name: str = "gemini-2.5-flash-preview-05-20") -> str:
    """
    Sends a multimodal request to the specified Gemini model.
    """
    if not gemini_client:
        raise Exception("Gemini client not initialized. Check API key.")
    
    model = genai.GenerativeModel(model_name)
    try:
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: model.generate_content(
                parts,
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini API call failed: {e}")
        return ""

async def analyze_media_with_gemini(media_path: Path, caption: str) -> str:
    """
    Performs a single analysis on an image or a video's keyframes using Gemini.
    Returns a comprehensive text summary.
    """
    if is_video(media_path):
        keyframes = extract_keyframes(media_path)
        if not keyframes:
            return "Video analysis failed: No keyframes extracted."
        
        parts = []
        parts.append(f"Analyze the following video in the context of the caption: '{caption}' and describe the visual content.")
        
        for frame_path in keyframes:
            parts.append({
                "mime_type": "image/jpeg",
                "data": encode_image_to_base64(frame_path)
            })
            
        parts.append("Please provide a combined visual summary.")
        
        summary = await analyze_with_gemini(parts, model_name="gemini-2.5-flash-preview-05-20")
        return summary

    else: # It's an image
        parts = [
            {"mime_type": "image/jpeg", "data": encode_image_to_base64(media_path)},
            f"Analyze this image in the context of the caption: '{caption}'. Provide a detailed description of this image and extract any text you see."
        ]
        summary = await analyze_with_gemini(parts, model_name="gemini-2.5-flash-preview-05-20")
        return summary

async def transcribe_audio_from_video(video_path: Path) -> str:
    """Transcribes audio from a video file using the Whisper model."""
    audio_path = extract_audio_from_video(video_path)
    if not audio_path:
        return ""
    
    model = get_whisper_model()
    if not model:
        return "Whisper model not loaded."

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, lambda: model.transcribe(str(audio_path), fp16=False))
        return result['text']
    except Exception as e:
        logger.error(f"Whisper transcription failed: {e}")
        return ""
    finally:
        if audio_path.exists():
            os.remove(audio_path)
