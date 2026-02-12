from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.preprocessing import preprocess_image

router = APIRouter(tags=["preprocess"])


class PreprocessRequest(BaseModel):
    image_base64: str


@router.post("/preprocess")
async def preprocess(request: PreprocessRequest):
    """Extract depth map and edge map from a base64-encoded image.

    Uses MiDaS for depth estimation and Canny for edge detection.
    Returns both maps as base64-encoded PNGs.
    """
    try:
        result = preprocess_image(request.image_base64)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {e}")
