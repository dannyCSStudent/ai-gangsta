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
    file_bytes = file.read()  # read immediately

    with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(file_bytes)
        tmp.flush()
        tmp_path = tmp.name

    try:
        import whisper
        model = whisper.load_model("base")  # Keep base for speed
        print(f"Streaming transcription for: {tmp_path}")

        # Run transcription with word timestamps
        result = model.transcribe(tmp_path, fp16=(DEVICE=="cuda"), word_timestamps=True)

        # Incrementally stream words
        words_buffer = []
        for segment in result["segments"]:
            for word in segment.get("words", []):
                words_buffer.append(word["word"])
                yield f"data: {' '.join(words_buffer).strip()}\n\n".encode("utf-8")

        # After transcript is done, run author matching
        text = result["text"].strip()
        from app.core.author_matcher import load_fingerprints, match_author
        fingerprints = load_fingerprints()
        match_result = match_author(text, fingerprints)

        yield f"data: Author: {match_result['author']} ({match_result['confidence']*100:.1f}%)\n\n".encode("utf-8")
        yield b"data: [DONE]\n\n"

    finally:
        os.remove(tmp_path)
