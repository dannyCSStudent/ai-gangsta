FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Preinstall base system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Use PyPI mirror + retries to prevent BrokenPipe
RUN python -m pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir --timeout 120 --retries 10 \
    -i https://pypi.org/simple \
    -r requirements.txt

COPY . .

# Expose FastAPI port
EXPOSE 3002

# Run FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002", "--reload"]
