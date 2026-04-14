#!/usr/bin/env bash
# Start SERAi in local dev mode (no Docker needed)
# Prerequisites: Python 3.11+, Node 18+, Ollama running on port 11434

set -e

echo ""
echo "  ███████╗███████╗██████╗  █████╗ ██╗"
echo "  ██╔════╝██╔════╝██╔══██╗██╔══██╗██║"
echo "  ███████╗█████╗  ██████╔╝███████║██║"
echo "  ╚════██║██╔══╝  ██╔══██╗██╔══██║██║"
echo "  ███████║███████╗██║  ██║██║  ██║██║"
echo "  ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝"
echo "  Social Engineering Risk Analyzer — Dev Mode"
echo ""

# Backend
echo "[1/2] Starting FastAPI backend on http://localhost:8000 ..."
cd backend
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "  Created Python venv"
fi
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
pip install -q -r requirements.txt
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
echo "[2/2] Starting Vite frontend on http://localhost:3000 ..."
cd frontend
npm install --silent
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "  ✓ Backend:  http://localhost:8000  (API docs: /docs)"
echo "  ✓ Frontend: http://localhost:3000"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" INT TERM
wait
