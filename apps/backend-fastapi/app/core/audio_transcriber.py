# 

import os
from fastapi import UploadFile
import torch
import whisper
from tempfile import NamedTemporaryFile

# Detect device for Whisper
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_NAME = "base"  # use "small" or "medium" for more accuracy

# Load Whisper model once at startup
model = whisper.load_model(MODEL_NAME, device=DEVICE)

# --- Setup tmp directory inside backend-fastapi ---
BASE_TMP_DIR = os.path.join(os.path.dirname(__file__), "..", "tmp")
os.makedirs(BASE_TMP_DIR, exist_ok=True)


def generate_transcription_sync(file) -> str:
    """
    Fully transcribe an uploaded audio file and return the text as a string.
    """
    with NamedTemporaryFile(delete=False, suffix=".mp3", dir=BASE_TMP_DIR) as tmp:
        tmp.write(file.read())
        tmp.flush()
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path, fp16=(DEVICE == "cuda"))
        return result["text"].strip()
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def generate_transcription_stream(file: UploadFile):
    """
    Generator for SSE streaming. Reads the uploaded file immediately to avoid
    'I/O operation on closed file' errors.
    """
    # Read bytes immediately
    file_bytes = file.read()

    with NamedTemporaryFile(delete=False, suffix=".mp3", dir=BASE_TMP_DIR) as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        tmp_path = tmp.name

    try:
        from app.core.audio_transcriber import generate_transcription_sync
        print("Transcribing file:", tmp_path)
        text = generate_transcription_sync(open(tmp_path, "rb"))
        print("Transcript:", text)

        # Send transcript first
        yield f"data: Quick Transcript: {text.strip()}\n\n".encode("utf-8")

        # Then author match
        from app.core.author_matcher import load_fingerprints, match_author
        fingerprints = load_fingerprints()
        result = match_author(text, fingerprints)
        print("Author Match:", result)

        yield f"data: Author: {result['author']} ({result['confidence']*100:.1f}%)\n\n".encode("utf-8")

        # Signal completion
        yield b"data: [DONE]\n\n"

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
