from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import streetview, preprocess, generate

app = FastAPI(
    title="GeoCanvas API",
    description="Transform street view locations into AI-generated art using SDXL + ControlNet",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(streetview.router, prefix="/api")
app.include_router(preprocess.router, prefix="/api")
app.include_router(generate.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    import torch

    return {
        "status": "ok",
        "cuda_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }
