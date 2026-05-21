#!/bin/bash
# easycompute Backend Startup Script
# ---------------------------------
# This script initializes the database schema and launches the FastAPI server.
set -e

# 1. Initialize Database Schema (Tables and Relationships)
echo "Initializing database..."
python init.py

# 2. Start the FastAPI server
# If PORT is not set, default to 8000
PORT=${PORT:-8000}
echo "Starting FastAPI server on port $PORT..."
uvicorn main:app --host 0.0.0.0 --port $PORT
