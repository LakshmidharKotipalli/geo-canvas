from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services.streetview_service import fetch_streetview, fetch_streetview_demo

router = APIRouter(tags=["streetview"])


class StreetViewRequest(BaseModel):
    lat: float
    lng: float
    heading: float = 0
    pitch: float = 0
    fov: float = 90


@router.post("/streetview")
async def get_streetview(request: StreetViewRequest):
    """Fetch a Google Street View image for the given coordinates.

    Falls back to a demo placeholder if no API key is configured.
    """
    try:
        if settings.GOOGLE_MAPS_API_KEY:
            result = await fetch_streetview(
                lat=request.lat,
                lng=request.lng,
                heading=request.heading,
                pitch=request.pitch,
                fov=request.fov,
            )
        else:
            result = await fetch_streetview_demo(
                lat=request.lat,
                lng=request.lng,
                heading=request.heading,
                pitch=request.pitch,
                fov=request.fov,
            )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch street view: {e}")
