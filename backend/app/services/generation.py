import io
import base64
from typing import Optional

import torch
from PIL import Image
from diffusers import StableDiffusionXLPipeline, AutoencoderKL

from app.config import settings

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    device = settings.DEVICE

    vae = AutoencoderKL.from_pretrained(
        "madebyollin/sdxl-vae-fp16-fix",
        torch_dtype=torch.float16,
    )

    _pipeline = StableDiffusionXLPipeline.from_pretrained(
        settings.SDXL_MODEL_ID,
        vae=vae,
        torch_dtype=torch.float16,
        variant="fp16",
    )

    _pipeline.to(device)

    _pipeline.enable_model_cpu_offload()
    try:
        _pipeline.enable_xformers_memory_efficient_attention()
    except Exception:
        pass

    return _pipeline


def generate_image(
    prompt: str,
    negative_prompt: Optional[str] = None,
    num_inference_steps: int = settings.DEFAULT_STEPS,
    guidance_scale: float = settings.DEFAULT_GUIDANCE_SCALE,
    seed: Optional[int] = None,
    width: int = 1024,
    height: int = 1024,
) -> dict:
    pipe = _get_pipeline()

    if negative_prompt is None:
        negative_prompt = (
            "blurry, low quality, distorted, deformed, ugly, "
            "bad anatomy, watermark, text, signature"
        )

    generator = None
    if seed is not None:
        generator = torch.Generator(device=settings.DEVICE).manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
        generator=generator,
        width=width,
        height=height,
    )

    generated_image = result.images[0]

    buffer = io.BytesIO()
    generated_image.save(buffer, format="PNG")
    image_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "image_base64": image_b64,
        "width": width,
        "height": height,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "steps": num_inference_steps,
        "guidance_scale": guidance_scale,
        "seed": seed,
    }
