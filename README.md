# 🧠 Gangsta AI — Author Fingerprinting API

Welcome to the truth infrastructure.  
This FastAPI backend is part of **Gangsta AI**, the most trusted AI-powered media watchdog and analyzer.  

This module powers **Author Fingerprinting**:  
🕵️‍♂️ It analyzes text and determines who *likely* wrote it — whether a politician, think tank, or speechwriter.

---

## 🚀 Features

- 🔍 **Author Matching** using NLP + TF-IDF cosine similarity
- 🤖 **LLM-Based Analysis** with Groq + LLaMA 3 fallback
- 🧠 **Semantic Fingerprints** stored in YAML format
- 📦 **Supabase Integration** for persistent match history
- ⚡ FastAPI-powered endpoint: `POST /match-author`

---

## 🔧 Tech Stack

- Python 3.11
- [FastAPI](https://fastapi.tiangolo.com/)
- [Supabase](https://supabase.com/)
- [Groq](https://groq.com/) + LLaMA 3 70B
- scikit-learn (TF-IDF)
- dotenv for env management

---

## 📂 Project Structure

