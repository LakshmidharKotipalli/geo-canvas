#!/bin/bash

# GeoCanvas - Start both backend and frontend

trap 'kill 0' EXIT

echo "Starting GeoCanvas..."
echo ""

# Backend
echo "[Backend] Starting FastAPI on http://localhost:8000"
cd "$(dirname "$0")/backend"
uvicorn app.main:app --reload --port 8000 &

# Frontend
echo "[Frontend] Starting Next.js on http://localhost:3000"
cd "$(dirname "$0")/frontend"
npm run dev &

echo ""
echo "Both servers starting. Press Ctrl+C to stop all."
wait
