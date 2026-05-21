# Use a lightweight Python base image for production
FROM python:3.11-slim

# Set the application root directory
WORKDIR /app

# Install system dependencies:
# - gcc and libpq-dev are required for the psycopg2 PostgreSQL driver.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies separately to optimize build caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend source code into the container
COPY . .

# Create a persistent directory for storing job result artifacts
RUN mkdir -p /app/results

# Inform Docker that the web server listens on port 8000
EXPOSE 8000

# Entry point: run the startup script (initializes DB and starts Uvicorn)
RUN chmod +x start.sh
CMD ["./start.sh"]
