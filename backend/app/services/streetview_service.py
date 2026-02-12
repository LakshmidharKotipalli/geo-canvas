import io
import base64

import httpx
from PIL import Image

from app.config import settings


async def fetch_streetview(
    lat: float,
    lng: float,
    heading: float = 0,
    pitch: float = 0,
    fov: float = 90,
) -> dict:
    """Fetch a Google Street View image for the given coordinates.

    Returns a dict with the image as base64 and its dimensions.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise ValueError(
            "GOOGLE_MAPS_API_KEY is not set. "
            "Add it to your .env file to fetch real street view images."
        )

    params = {
        "size": settings.STREETVIEW_SIZE,
        "location": f"{lat},{lng}",
        "heading": str(heading),
        "pitch": str(pitch),
        "fov": str(fov),
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(settings.STREETVIEW_BASE_URL, params=params)
        response.raise_for_status()

    image = Image.open(io.BytesIO(response.content)).convert("RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "image_base64": image_b64,
        "width": image.width,
        "height": image.height,
        "lat": lat,
        "lng": lng,
    }


async def fetch_streetview_demo(
    lat: float,
    lng: float,
    heading: float = 0,
    pitch: float = 0,
    fov: float = 90,
) -> dict:
    """Generate a placeholder image when no API key is available.

    Creates a gradient image with coordinate text overlay for development/testing.
    """
    import numpy as np

    width, height = 640, 640
    # Create a gradient image that varies with coordinates
    x = np.linspace(0, 1, width)
    y = np.linspace(0, 1, height)
    xx, yy = np.meshgrid(x, y)

    # Use coordinates to create a unique-looking pattern
    r = np.uint8(128 + 127 * np.sin(lat * 0.1 + xx * 3))
    g = np.uint8(128 + 127 * np.sin(lng * 0.1 + yy * 3))
    b = np.uint8(128 + 127 * np.cos((lat + lng) * 0.05 + (xx + yy) * 2))

    arr = np.stack([r, g, b], axis=-1)
    image = Image.fromarray(arr, "RGB")

    # Add text overlay
    from PIL import ImageDraw, ImageFont

    draw = ImageDraw.Draw(image)
    text = f"Demo Mode\n({lat:.4f}, {lng:.4f})\nHeading: {heading}"
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except (OSError, IOError):
        font = ImageFont.load_default()
    draw.text((20, 20), text, fill=(255, 255, 255), font=font)

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "image_base64": image_b64,
        "width": width,
        "height": height,
        "lat": lat,
        "lng": lng,
        "demo": True,
    }
