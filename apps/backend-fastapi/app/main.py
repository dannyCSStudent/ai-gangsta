# app/main.py

from dotenv import load_dotenv
load_dotenv()  # Must be before any other import that uses os.getenv

from fastapi import FastAPI
from app.api.routes import author_fingerprint

app = FastAPI()
app.include_router(author_fingerprint.router)


@app.get("/")
def read_root():
    return {"status": "Gangsta AI backend is alive 👊🏽"}

