import os
from dotenv import load_dotenv
load_dotenv()  # Load .env first

from fastapi import FastAPI
from app.api.routes import author_fingerprint, audio_scan, news_to_song, post_truth_scanner
from app.api.routes.truth_scan_results import router as truth_scan_results_router # Corrected import for the new router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Gangsta AI Backend")

os.makedirs("app/tmp/songs", exist_ok=True)
# ✅ Enable CORS once
origins = [
    "http://localhost:3000",   # React Native Web / Next.js dev
    "http://127.0.0.1:3000",
    "http://localhost:19006",  # Expo web
    "http://127.0.0.1:19006",
    "*"  # Wildcard for dev (remove for prod)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include routers AFTER app and middleware are ready
app.include_router(author_fingerprint.router)
app.include_router(audio_scan.router)
app.include_router(news_to_song.router, prefix="/api")
app.mount("/songs", StaticFiles(directory="app/tmp/songs"), name="songs")
app.include_router(post_truth_scanner.router)
# ✅ Include the new router here.
app.include_router(truth_scan_results_router)

@app.get("/")
def read_root():
    return {"status": "Gangsta AI backend is alive 👊🏽"}
