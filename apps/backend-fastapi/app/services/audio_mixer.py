import subprocess

def mix_audio(vocals_path: str, beat_path: str, output_path: str):
    """
    Mix vocals with a background beat using ffmpeg.
    Vocals will be slightly louder than beat.
    """
    cmd = [
        "ffmpeg", "-y",
        "-i", vocals_path,
        "-i", beat_path,
        "-filter_complex", "[0:a]volume=1.2[a0];[1:a]volume=0.5[a1];[a0][a1]amix=inputs=2:duration=longest",
        "-c:a", "mp3",
        output_path
    ]
    subprocess.run(cmd, check=True)
    return output_path
