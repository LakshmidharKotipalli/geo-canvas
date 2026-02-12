# GeoCanvas

Transform any real-world location into AI-generated art. GeoCanvas fetches Google Street View imagery for given coordinates, extracts depth and edge maps, then generates stylized images using Stable Diffusion XL with multi-ControlNet conditioning to preserve spatial structure.

## Architecture

```
geo-canvas/
├── backend/                     # FastAPI Python backend
│   ├── app/
│   │   ├── main.py              # App entry, CORS, route registration
│   │   ├── config.py            # Environment settings and model IDs
│   │   ├── routers/
│   │   │   ├── streetview.py    # POST /api/streetview
│   │   │   ├── preprocess.py    # POST /api/preprocess
│   │   │   └── generate.py     # POST /api/generate
│   │   └── services/
│   │       ├── streetview_service.py  # Google Maps API + demo fallback
│   │       ├── preprocessing.py       # MiDaS depth + Canny edges
│   │       └── generation.py          # SDXL + ControlNet pipeline
│   ├── requirements.txt
│   └── .env.example
├── frontend/                    # Next.js + TypeScript + Tailwind
│   └── src/
│       ├── app/
│       │   ├── page.tsx         # Main page orchestrating the pipeline
│       │   ├── layout.tsx       # Root layout
│       │   └── globals.css      # Global styles + Leaflet dark theme
│       ├── components/
│       │   ├── MapPicker.tsx    # Interactive Leaflet map
│       │   ├── PromptPanel.tsx  # Prompt input, presets, controls
│       │   ├── ImagePreview.tsx # Street view / depth / edge previews
│       │   ├── GeneratedResult.tsx  # Final output display
│       │   └── Header.tsx       # App header with GPU status
│       └── lib/
│           └── api.ts           # Typed API client
├── start.sh                     # Launch both servers
└── README.md
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **NVIDIA GPU with 12GB+ VRAM** (recommended for SDXL + ControlNet)
  - CPU mode works but is significantly slower
- **Google Maps API key** (optional — demo mode works without one)

## Setup

### 1. Clone and navigate

```bash
cd "geo canvas"
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create your `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
GOOGLE_MAPS_API_KEY=your_key_here   # Optional — leave empty for demo mode
DEVICE=cuda                          # Use "cpu" if no GPU available
```

**Google Maps API key setup** (optional):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the **Street View Static API**
4. Create an API key under **Credentials**
5. Paste the key into your `.env` file

### 3. Frontend

```bash
cd frontend
npm install
```

### 4. First run — model downloads

On the first run, the backend will download these models (requires internet):

| Model | Size | Purpose |
|-------|------|---------|
| `Intel/dpt-large` | ~1.3 GB | MiDaS depth estimation |
| `stabilityai/stable-diffusion-xl-base-1.0` | ~6.5 GB | SDXL base model |
| `diffusers/controlnet-depth-sdxl-1.0` | ~2.5 GB | Depth ControlNet |
| `diffusers/controlnet-canny-sdxl-1.0` | ~2.5 GB | Canny ControlNet |
| `madebyollin/sdxl-vae-fp16-fix` | ~335 MB | FP16-safe VAE |

Models are cached in `~/.cache/huggingface/` after the first download.

## Running

### Both servers at once

```bash
./start.sh
```

### Or individually

**Backend** (port 8000):
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Frontend** (port 3000):
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

## Usage

1. **Select a location** — Click on the map, use the search bar, or enter coordinates manually
2. **Adjust camera** — Set heading (0-360°), pitch (-90 to 90°), and field of view
3. **Fetch Street View** — Click the button to retrieve the street view image
4. **Write a prompt** — Describe your creative vision (e.g., "a cyberpunk city at night")
5. **Choose presets** — Pick a style, weather condition, and time of day
6. **Generate** — The pipeline will:
   - Extract a depth map (MiDaS) and edge map (Canny) from the street view
   - Feed both into SDXL with multi-ControlNet conditioning
   - Output a stylized image that preserves the location's spatial structure
7. **Download** — Click the download button on the result

### Advanced settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| Steps | 30 | Denoising steps (higher = more detail, slower) |
| Guidance Scale | 7.5 | Prompt adherence (higher = more literal) |
| Depth ControlNet | 0.8 | Strength of depth conditioning |
| Canny ControlNet | 0.5 | Strength of edge conditioning |
| Seed | Random | Set a seed for reproducible results |
| Negative Prompt | (preset) | Things to exclude from generation |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server status + GPU info |
| `POST` | `/api/streetview` | Fetch street view image for coordinates |
| `POST` | `/api/preprocess` | Extract depth map + edge map from image |
| `POST` | `/api/generate` | Generate image with SDXL + ControlNet |

### Example: fetch street view

```bash
curl -X POST http://localhost:8000/api/streetview \
  -H "Content-Type: application/json" \
  -d '{"lat": 48.8584, "lng": 2.2945, "heading": 180}'
```

### Example: generate

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "cyberpunk city, neon lights, rain",
    "depth_map_base64": "<base64>",
    "edge_map_base64": "<base64>",
    "num_inference_steps": 30
  }'
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CUDA out of memory` | Reduce image size to 768x768, lower steps, or use CPU mode |
| `Backend offline` in header | Ensure the backend is running on port 8000 |
| Street view shows "Demo Mode" | Add a valid `GOOGLE_MAPS_API_KEY` to `.env` |
| Models downloading slowly | First run downloads ~13GB of models — this is expected |
| `xformers` not found | Optional — the app works without it, just uses more VRAM |
| Map not loading | Check internet connection (tiles load from OpenStreetMap) |

## Tech Stack

- **Backend**: FastAPI, PyTorch, HuggingFace Diffusers, Transformers, OpenCV
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS, Leaflet
- **AI Models**: Stable Diffusion XL, ControlNet (depth + canny), MiDaS DPT-Large
