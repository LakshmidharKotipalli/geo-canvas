# GeoCanvas

**Pick any location on Earth. Describe what you want. Get an AI-generated image.**

Drop a pin anywhere on the map, write a prompt (or use the auto-suggested one), and GeoCanvas generates an image using Stable Diffusion XL. Quick-pick scenarios for Paris, New York, Tokyo, and London are included to get started instantly.

---

## How It Works

1. **Pick a location** — click the map, drag the pin, or search by name
2. **Write a prompt** — auto-filled from the location via reverse geocoding, fully editable
3. **Click Generate** — SDXL runs and returns the generated image

```
Location → Prompt → SDXL → Generated image
```

---

## Tech Stack

### AI
- **Stable Diffusion XL** — text-to-image generation
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

---

## Project Structure

```
geo-canvas/
├── backend/
│   ├── app/               # FastAPI routes and SDXL generation service
│   └── requirements.txt
├── frontend/
│   ├── src/app/           # Next.js app router
│   └── src/components/    # MapPicker, PromptPanel, GeneratedResult
├── demo/
│   ├── demo.html          # Self-contained HTML demo
│   └── images/            # Sample generated images
└── README.md
```


---

*Built by [Lakshmidhar Kotipalli](https://github.com/LakshmidharKotipalli)*
