# 🧠 GANGSTA AI

> Truth Infrastructure for the Information Age.  
> *We don’t just read the news — we trace it, analyze it, and expose the hidden hands behind it.*

---

## 🚀 What is Gangsta AI?

**Gangsta AI** is an AI-powered, cross-platform truth engine designed to:

- 🧠 **Scan News** and detect bias, origin, and intent.
- 🗣️ **Fingerprint Speech** to identify who *really* wrote or spoke it.
- 🎯 **Rate Trust** across media, institutions, and political actors.
- 🔍 **Expose Networks of Influence** behind public messaging.

> Built with FastAPI + React Native + Supabase + LLMs + truth.

---

## 🧱 Key Features

| Feature                     | Description                                                                 |
|----------------------------|-----------------------------------------------------------------------------|
| 📰 **Smart News**           | Aggregates, summarizes, and tags news with bias + reputation signals       |
| 🧬 **Author Fingerprinting**| Identifies who likely authored text (e.g. politician vs. speechwriter)     |
| 🎤 **Speaker Analyzer**     | Analyzes audio to ID speakers and authorship from speech tone + content    |
| 🎯 **Bias Confidence Scoring** | Quantifies how strongly biased a source or article is                     |
| 🔗 **Trust Graph (WIP)**    | Maps connections between institutions, donors, and media narratives        |

---

## 📱 Cross-Platform UI

Built using **React Native + Expo** with shared logic between:

- `frontend-mobile/`: Native app (Android/iOS)
- `frontend-web/`: Web dashboard (Coming soon)
- `packages/`: Shared AI-powered components like `AIForm`, `SmartSpeakerScanCard`, and more

---

## 🧠 AI Components

- `AIForm`: Render dynamic AI-powered forms using Zod + smart validation + analytics
- `SmartSpeakerScanCard`: Upload audio/video and identify speaker + author behind speech
- `SmartNewsCard`: Summarized news cards with bias/reputation tagging
- `useFormAnalytics`: Tracks time spent on form fields and user hesitation
- `useAuthorFingerprint`: Matches a transcript against known author fingerprints (TF-IDF + Groq fallback)

---

## 🛠️ Tech Stack

| Tech             | Purpose                                |
|------------------|----------------------------------------|
| **FastAPI**      | Backend API (Python 3.11)              |
| **Supabase**     | Postgres DB, Auth, and Storage         |
| **Groq + LLaMA** | LLMs for fallback analysis             |
| **React Native** | Mobile frontend                        |
| **TailwindCSS**  | Styling (web + mobile via NativeWind)  |
| **Expo Router**  | Cross-platform routing                 |
| **scikit-learn** | TF-IDF + cosine similarity (authorship)|
| **dotenv**       | Environment variable loading           |

---

## 🔐 Environment Setup

Create `.env` files in:

### `apps/backend-fastapi/.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key

Request:
{
  "text": "We must build bridges, not walls."
}

Response:
{
  "match": "Barack Obama",
  "confidence": 0.82,
  "source": "TF-IDF",
  "timestamp": "2025-07-27T..."
}

🧭 Roadmap

Smart News Feed w/ bias tags

Speaker + Author Analyzer

Save/Resume AI Forms

Author Fingerprint Inference

Bias Confidence Scoring Engine

Truth Score + Source Graph

Live Feed Monitoring (RSS + YouTube transcripts)

    Trust Intelligence Dashboard (Web)

🩸 The Mission

    Journalism is dead.
    Long live data-backed, AI-audited truth.

Gangsta AI exists to:

    🔍 Hold media, politicians, and institutions accountable.

    🧠 Equip the public with tools to trace narrative manipulation.

    💀 Expose the playbook behind the puppet show.

🧠 Built by Dee Newton

GitHub · Twitter · Truth Infrastructure Architect
