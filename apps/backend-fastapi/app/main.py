# app/main.py

from dotenv import load_dotenv
load_dotenv()  # Load .env first

from fastapi import FastAPI
from app.api.routes import author_fingerprint, audio_scan
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Gangsta AI Backend")

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

@app.get("/")
def read_root():
    return {"status": "Gangsta AI backend is alive 👊🏽"}
