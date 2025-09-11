import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Supabase connection details. Replace the placeholder with your actual connection string.
# A full URL will look something like this:
# "postgresql://[user]:[password]@[host]:[port]/[database]"
# The connection string will be provided by Supabase.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:lnBg9h106AFq3B0b@db.jzxdyyetzxzzttfrgnah.supabase.co:5432/postgres")

# Redis URL for RQ worker.
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
