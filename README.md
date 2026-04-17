# GeoCanvas

**Pick any location on Earth. Describe what you want. Get an AI-generated image grounded in that real place.**

GeoCanvas fetches a Google Street View image for the coordinates you choose, extracts a depth map and edge map from it, then feeds all three into a Stable Diffusion XL pipeline with dual ControlNet conditioning — so the generated image preserves the real spatial structure of the location.

---

## How It Works

1. **Pick a location** on the interactive map (or search by name / paste coordinates)
2. **Write a prompt** — the location name is pre-filled automatically, edit freely
3. **Click Generate** — the app runs three stages in sequence:
   - Fetches a Street View image for the coordinates
   - Extracts a MiDaS depth map and Canny edge map
   - Generates the final image using SDXL + dual ControlNet

```
Map coordinates → Street View → Depth + Edge maps → SDXL + ControlNet → Generated image
```

---

## Tech Stack

### AI / Computer Vision
- **Stable Diffusion XL** — image generation
- **ControlNet (Depth + Canny)** — structural conditioning so generated images respect real-world geometry
- **MiDaS (DPT-Large)** — monocular depth estimation
- **OpenCV** — Canny edge detection
- **HuggingFace Diffusers** — pipeline orchestration

### Web
- **FastAPI** — Python backend
- **Next.js 15 / React 19** — frontend
- **TypeScript** — end-to-end type safety
- **Tailwind CSS** — styling
- **Leaflet** — interactive maps
- **Nominatim** — reverse geocoding for automatic location-aware prompts

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- NVIDIA GPU with 12GB+ VRAM (recommended for SDXL)

### 1. Clone

```bash
git clone https://github.com/LakshmidharKotipalli/geo-canvas.git
cd geo-canvas
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # optionally add GOOGLE_MAPS_API_KEY
```

### 3. Frontend

```bash
cd ../frontend
npm install
```

### 4. Run

```bash
# Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Demo mode**: The app works without a Google Maps API key — Street View falls back to a demo image so you can test the full pipeline.

---

## Project Structure

```
geo-canvas/
├── backend/
│   ├── app/               # FastAPI routes and ML pipeline services
│   └── requirements.txt
├── frontend/
│   ├── src/app/           # Next.js app router
│   └── src/components/    # MapPicker, PromptPanel, GeneratedResult
└── README.md
```

---

## License

MIT — see `LICENSE`.

---

*Built by [Lakshmidhar Kotipalli](https://github.com/LakshmidharKotipalli)*
