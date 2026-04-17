from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.generation import generate_image

router = APIRouter(tags=["generate"])


class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    num_inference_steps: int = 30
    guidance_scale: float = 7.5
    seed: Optional[int] = None
    width: int = 1024
    height: int = 1024


@router.post("/generate")
async def generate(request: GenerateRequest):
    try:
        result = generate_image(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            seed=request.seed,
            width=request.width,
            height=request.height,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")
