import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    DEVICE: str = os.getenv("DEVICE", "cuda")
    STREETVIEW_SIZE: str = "640x640"
    STREETVIEW_BASE_URL: str = "https://maps.googleapis.com/maps/api/streetview"

    # Model IDs
    SDXL_MODEL_ID: str = "stabilityai/stable-diffusion-xl-base-1.0"
    CONTROLNET_DEPTH_ID: str = "diffusers/controlnet-depth-sdxl-1.0"
    CONTROLNET_CANNY_ID: str = "diffusers/controlnet-canny-sdxl-1.0"
    DEPTH_MODEL_ID: str = "Intel/dpt-large"

    # Generation defaults
    DEFAULT_STEPS: int = 30
    DEFAULT_GUIDANCE_SCALE: float = 7.5
    DEFAULT_CONTROLNET_SCALE: float = 0.8


settings = Settings()
