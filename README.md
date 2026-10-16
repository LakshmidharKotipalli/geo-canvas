# GeoCanvas

**Pick any location on Earth, describe what you want, and get an AI-generated image.**

Drop a pin anywhere on the map and GeoCanvas auto-writes a location-aware prompt (via reverse geocoding) that you
can edit, then generates the image with Stable Diffusion XL. Quick picks for Paris, New York, Tokyo and London
get you started instantly.

```
Location → Prompt → SDXL → Generated image
```

## Tech stack

- **AI:** Stable Diffusion XL with Hugging Face Diffusers
- **Backend:** FastAPI
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Leaflet maps, Nominatim geocoding

## Getting started

Requires Python 3.10+, Node.js 18+, and an NVIDIA GPU with 12 GB+ VRAM (recommended).

```bash
git clone https://github.com/LakshmidharKotipalli/geo-canvas.git && cd geo-canvas

# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:3000. A self-contained demo with sample images is in `demo/demo.html`.

## Project structure

```
backend/app/            FastAPI routes and SDXL generation service
frontend/src/app/       Next.js app router
frontend/src/components MapPicker, PromptPanel, GeneratedResult
demo/                   Standalone HTML demo and sample images
```
