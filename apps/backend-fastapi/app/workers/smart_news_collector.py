# app/workers/smart_news_collector.py

import asyncio
import feedparser
import os
import httpx
from datetime import datetime, timezone
from langdetect import detect
from supabase import create_client, Client

# ======================================================
# Initialization
# ======================================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials — check .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    "User-Agent": "GangstaAI-NewsCollector/3.0 (+https://gangsta.ai)"
}

# ======================================================
# Reliable Global RSS Feeds
# ======================================================
RSS_FEEDS = [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://www.npr.org/rss/rss.php?id=1004",
    "https://www.reutersagency.com/feed/?best-topics=world",
]


# ======================================================
# AI — Bias Detection Using Groq
# ======================================================
async def ai_detect_bias(text: str) -> tuple[str, float]:
    """
    Uses Groq LLaMA 3.1 to classify the political/ideological bias of the article.
    Returns: (bias_label, confidence)
    """
    if not GROQ_API_KEY:
        print("⚠️ Missing GROQ_API_KEY — fallback to center")
        return "center", 0.50

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    prompt = f"""
You are a political bias detection AI. 
Classify the ideological bias of this news text:

{text[:4000]}

Return JSON only in this EXACT format:
{{
  "bias": "left" | "right" | "center",
  "confidence": 0.0 to 1.0
}}
"""

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
    }

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            response = data["choices"][0]["message"]["content"].strip()

            import json
            parsed = json.loads(response)

            return parsed.get("bias", "center"), float(parsed.get("confidence", 0.5))

    except Exception as e:
        print(f"⚠️ AI bias detection failed: {e}")
        return "center", 0.5


# ======================================================
# AI Summarization — Groq
# ======================================================
async def summarize_text(text: str) -> str:
    if not GROQ_API_KEY:
        print("⚠️ Missing GROQ_API_KEY, skipping summarization.")
        return text[:350]

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {
                "role": "system",
                "content": "Summarize in under 4 sentences, preserve truth."
            },
            {"role": "user", "content": text[:6000]},
        ],
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"⚠️ Summarizer failure: {e}")
        return text[:350]


# ======================================================
# AI Claim Extraction — Groq
# ======================================================
async def extract_claims(text: str) -> list[dict]:
    """
    Extract claims from text and return a list of:
    { "claim_text": "...", "claim_type": "...", "context": "..." }
    """
    if not GROQ_API_KEY:
        return []

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}

    prompt = f"""
Extract factual claims from this article and return JSON list only:

{text[:5000]}

Response example:
[
  {{"claim_text": "X happened", "claim_type": "factual", "context": "politics"}},
  {{"claim_text": "Y caused Z", "claim_type": "causal", "context": "economy"}}
]
"""

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.0,
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"]

            import json
            return json.loads(raw)
    except Exception as e:
        print(f"⚠️ Claim extraction failed: {e}")
        return []


# ======================================================
# Main Fetch + Store Routine
# ======================================================
async def fetch_and_store_news():
    print("[SmartNewsCollector] 🌍 Fetching global news...")

    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url, request_headers=HEADERS)

            if not feed.entries:
                print(f"⚠️ No entries found for {url}")
                continue

            for entry in feed.entries[:4]:
                title = entry.get("title", "").strip()
                link = entry.get("link", "").strip()
                summary = entry.get("summary", "").strip()
                description = entry.get("description", summary)

                if not title or not link:
                    continue

                # === Duplicate Check ===
                existing = supabase.table("smart_news").select("id").eq("source_url", link).execute()
                if existing.data:
                    continue

                # === Language Detection ===
                try:
                    lang = detect(title + " " + summary)
                except Exception:
                    lang = "en"

                # === Bias via AI ===
                bias, confidence = await ai_detect_bias(summary or description or title)

                # === Summarization ===
                summarized = await summarize_text(summary or description or title)

                # === Insert into smart_news ===
                news_row = {
                    "title": title,
                    "summary": summarized,
                    "source_name": feed.feed.get("title", "Unknown Source"),
                    "source_url": link,
                    "bias": bias,
                    "bias_confidence": confidence,
                    "trust_score": 0.5,
                    "language": lang,
                    "author_fingerprint": None,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "published_at": datetime.now(timezone.utc).isoformat(),
                }

                inserted = supabase.table("smart_news").insert(news_row).execute()

                if inserted.data:
                    article_id = inserted.data[0]["id"]
                    print(f"📰 Added: {title[:60]}")

                    # === Claims Extraction ===
                    claims = await extract_claims(summary or description or title)

                    for c in claims:
                        supabase.table("claims").insert({
                            "article_id": article_id,
                            "claim_text": c.get("claim_text"),
                            "claim_type": c.get("claim_type"),
                            "context": c.get("context"),
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }).execute()

                await asyncio.sleep(2)

        except Exception as e:
            print(f"⚠️ Feed error {url}: {e}")


# ======================================================
# Background Task
# ======================================================
async def start_background_task():
    while True:
        await fetch_and_store_news()
        print("[SmartNewsCollector] Sleeping for 10 minutes...")
        await asyncio.sleep(600)
