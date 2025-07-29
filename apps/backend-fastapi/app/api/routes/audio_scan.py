from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse
from app.core.author_matcher import load_fingerprints, match_author, supabase
from app.core.audio_transcriber import generate_transcription_sync, generate_transcription_stream

router = APIRouter()

@router.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """
    Upload audio for transcription (returns JSON).
    """
    # 1. Get transcript as a string
    transcript = generate_transcription_sync(file.file)

    # 2. Match author
    fingerprints = load_fingerprints()
    result = match_author(transcript, fingerprints)

    # 3. Save to Supabase
    try:
        supabase.table("author_matches").insert({
            "transcript": transcript,
            "matched_author": result["author"],
            "confidence": result["confidence"],
            "raw_response": result
        }).execute()
    except Exception as e:
        result["save_error"] = str(e)

    return {
        "transcript": transcript,
        **result
    }

@router.post("/generate_transcription/stream")
async def stream_transcription(file: UploadFile = File(...)):
    """
    Stream audio transcription in real-time using SSE.
    """
    # Read bytes immediately to avoid 'I/O on closed file'
    file_bytes = await file.read()

    def event_generator(file_bytes: bytes):
        from tempfile import NamedTemporaryFile
        import os
        from app.core.audio_transcriber import generate_transcription_sync
        from app.core.author_matcher import load_fingerprints, match_author

        with NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(file_bytes)
            tmp.flush()
            tmp_path = tmp.name

        try:
            print("Transcribing file:", tmp_path)
            text = generate_transcription_sync(open(tmp_path, "rb"))
            print("Transcript:", text)

            yield f"data: Quick Transcript: {text.strip()}\n\n".encode("utf-8")

            fingerprints = load_fingerprints()
            result = match_author(text, fingerprints)
            print("Author Match:", result)

            yield f"data: Author: {result['author']} ({result['confidence']*100:.1f}%)\n\n".encode("utf-8")
            yield b"data: [DONE]\n\n"

        finally:
            os.remove(tmp_path)

    return StreamingResponse(event_generator(file_bytes), media_type="text/event-stream")

