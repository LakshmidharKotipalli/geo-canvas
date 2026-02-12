import io
import base64
from typing import Optional

import torch
import numpy as np
from PIL import Image
from diffusers import (
    ControlNetModel,
    StableDiffusionXLControlNetPipeline,
    AutoencoderKL,
)

from app.config import settings
from app.services.preprocessing import image_from_base64

# Lazy-loaded pipeline
_pipeline = None


def _get_pipeline():
    """Load SDXL + ControlNet pipeline (lazy singleton).

    Uses multi-ControlNet with both depth and canny conditioning.
    """
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    device = settings.DEVICE

    # Load ControlNet models
    controlnet_depth = ControlNetModel.from_pretrained(
        settings.CONTROLNET_DEPTH_ID,
        torch_dtype=torch.float16,
        variant="fp16",
    )
    controlnet_canny = ControlNetModel.from_pretrained(
        settings.CONTROLNET_CANNY_ID,
        torch_dtype=torch.float16,
        variant="fp16",
    )

    # Load VAE
    vae = AutoencoderKL.from_pretrained(
        "madebyollin/sdxl-vae-fp16-fix",
        torch_dtype=torch.float16,
    )

    # Load SDXL pipeline with multi-ControlNet
    _pipeline = StableDiffusionXLControlNetPipeline.from_pretrained(
        settings.SDXL_MODEL_ID,
        controlnet=[controlnet_depth, controlnet_canny],
        vae=vae,
        torch_dtype=torch.float16,
        variant="fp16",
    )

    _pipeline.to(device)

    # Enable memory optimizations
    _pipeline.enable_model_cpu_offload()
    try:
        _pipeline.enable_xformers_memory_efficient_attention()
    except Exception:
        pass  # xformers not available, fall back to default attention

    return _pipeline


def _prepare_controlnet_image(image: Image.Image, target_size: tuple) -> Image.Image:
    """Resize and prepare an image for ControlNet conditioning."""
    return image.resize(target_size, Image.LANCZOS)


def generate_image(
    prompt: str,
    depth_map_b64: str,
    edge_map_b64: str,
    negative_prompt: Optional[str] = None,
    num_inference_steps: int = settings.DEFAULT_STEPS,
    guidance_scale: float = settings.DEFAULT_GUIDANCE_SCALE,
    controlnet_conditioning_scale: Optional[list[float]] = None,
    seed: Optional[int] = None,
    width: int = 1024,
    height: int = 1024,
) -> dict:
    """Generate an image using SDXL + multi-ControlNet (depth + canny).

    Args:
        prompt: The creative text prompt describing the desired output.
        depth_map_b64: Base64-encoded depth map for spatial conditioning.
        edge_map_b64: Base64-encoded edge map for structural conditioning.
        negative_prompt: Things to avoid in the generation.
        num_inference_steps: Number of denoising steps.
        guidance_scale: Classifier-free guidance scale.
        controlnet_conditioning_scale: Strength per ControlNet [depth, canny].
        seed: Random seed for reproducibility.
        width: Output image width (must be multiple of 8).
        height: Output image height (must be multiple of 8).

    Returns:
        Dict with generated image as base64 and generation parameters.
    """
    pipe = _get_pipeline()

    if negative_prompt is None:
        negative_prompt = (
            "blurry, low quality, distorted, deformed, ugly, "
            "bad anatomy, watermark, text, signature"
        )

    if controlnet_conditioning_scale is None:
        controlnet_conditioning_scale = [
            settings.DEFAULT_CONTROLNET_SCALE,
            settings.DEFAULT_CONTROLNET_SCALE * 0.6,
        ]

    # Prepare conditioning images
    target_size = (width, height)
    depth_image = image_from_base64(depth_map_b64).convert("L")
    depth_image = _prepare_controlnet_image(depth_image, target_size)
    # Convert to RGB for the pipeline
    depth_rgb = Image.merge("RGB", [depth_image] * 3)

    edge_image = image_from_base64(edge_map_b64).convert("L")
    edge_image = _prepare_controlnet_image(edge_image, target_size)
    edge_rgb = Image.merge("RGB", [edge_image] * 3)

    # Set up generator for reproducibility
    generator = None
    if seed is not None:
        generator = torch.Generator(device=settings.DEVICE).manual_seed(seed)

    # Run generation
    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=[depth_rgb, edge_rgb],
        num_inference_steps=num_inference_steps,
        guidance_scale=guidance_scale,
        controlnet_conditioning_scale=controlnet_conditioning_scale,
        generator=generator,
        width=width,
        height=height,
    )

    generated_image = result.images[0]

    # Encode result
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
        "controlnet_scale": controlnet_conditioning_scale,
        "seed": seed,
    }
