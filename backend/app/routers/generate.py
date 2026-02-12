from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.generation import generate_image

router = APIRouter(tags=["generate"])


class GenerateRequest(BaseModel):
    prompt: str
    depth_map_base64: str
    edge_map_base64: str
    negative_prompt: Optional[str] = None
    num_inference_steps: int = 30
    guidance_scale: float = 7.5
    controlnet_depth_scale: float = 0.8
    controlnet_canny_scale: float = 0.5
    seed: Optional[int] = None
    width: int = 1024
    height: int = 1024


@router.post("/generate")
async def generate(request: GenerateRequest):
    """Generate a stylized image using SDXL + ControlNet.

    Takes a creative prompt along with depth and edge conditioning maps
    extracted from a street view image. The ControlNet ensures the generated
    image maintains the spatial structure of the original location.
    """
    try:
        result = generate_image(
            prompt=request.prompt,
            depth_map_b64=request.depth_map_base64,
            edge_map_b64=request.edge_map_base64,
            negative_prompt=request.negative_prompt,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
            controlnet_conditioning_scale=[
                request.controlnet_depth_scale,
                request.controlnet_canny_scale,
            ],
            seed=request.seed,
            width=request.width,
            height=request.height,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {e}")
