# Use the official Python image as a base, this ensures all dependencies are available.
FROM python:3.11-slim

# Set the working directory inside the container to '/app'.
WORKDIR /app

# Copy the requirements file into the container and install all dependencies.
# The `--no-cache-dir` flag saves space by not storing the downloaded packages.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all the application files from your local 'backend-fastapi' directory into the container's '/app' directory.
COPY . .

# Expose the port that the API will run on.
EXPOSE 3002

# The default command to run the API server. This is the entry point for this image.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]
