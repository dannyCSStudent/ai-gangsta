import os
import subprocess
import tempfile
import time
import soundfile as sf
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter(prefix="/api", tags=["Stem Splitter"])

@router.post("/split-stems")
async def split_stems(file: UploadFile = File(...)):
    """Split a song into stems using Demucs (vocals, bass, drums, other)."""
    tmp_path = None
    try:
        # ✅ Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        output_dir = "app/tmp/stems"
        os.makedirs(output_dir, exist_ok=True)

        # ✅ Measure start time
        start_time = time.time()

        # ✅ Run Demucs
        cmd = ["demucs", "-n", "mdx_extra_q", "-o", output_dir, tmp_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)

        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"Demucs failed:\n{result.stdout}\n{result.stderr}"
            )

        # ✅ Find directory that actually contains stems (recursively)
        track_dir = None
        for root, dirs, files in os.walk(output_dir):
            wavs = [f for f in files if f.endswith(".wav")]
            if wavs:
                track_dir = root
                break

        if not track_dir:
            raise HTTPException(status_code=500, detail="Demucs did not produce any stems")

        # ✅ Collect stems and move them to /app/tmp/songs
        stems = [f for f in os.listdir(track_dir) if f.endswith(".wav")]
        songs_dir = "app/tmp/songs"
        os.makedirs(songs_dir, exist_ok=True)

        urls = {}
        for stem in stems:
            src = os.path.join(track_dir, stem)
            dst = os.path.join(songs_dir, stem)
            os.replace(src, dst)
            urls[stem.replace(".wav", "")] = f"/songs/{stem}"

        # ✅ Measure audio duration (seconds)
        try:
            f = sf.SoundFile(tmp_path)
            duration_seconds = len(f) / f.samplerate
            f.close()
        except Exception:
            duration_seconds = None  # fallback if soundfile can't read it

        # ✅ Measure total processing time
        processing_time_seconds = round(time.time() - start_time, 2)

        # ✅ Return enhanced response
        return {
            "status": "ok",
            "model": "Demucs",
            "num_stems": len(stems),
            "duration_seconds": duration_seconds,
            "processing_time_seconds": processing_time_seconds,
            "stems": urls
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demucs failed: {e}")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
