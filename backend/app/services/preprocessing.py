import io
import base64

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import DPTForDepthEstimation, DPTImageProcessor

from app.config import settings

# Lazy-loaded models
_depth_model = None
_depth_processor = None


def _get_depth_model():
    """Load MiDaS depth estimation model (lazy singleton)."""
    global _depth_model, _depth_processor
    if _depth_model is None:
        _depth_processor = DPTImageProcessor.from_pretrained(settings.DEPTH_MODEL_ID)
        _depth_model = DPTForDepthEstimation.from_pretrained(settings.DEPTH_MODEL_ID)
        _depth_model.to(settings.DEVICE)
        _depth_model.eval()
    return _depth_model, _depth_processor


def image_from_base64(b64_string: str) -> Image.Image:
    """Decode a base64 string into a PIL Image."""
    image_bytes = base64.b64decode(b64_string)
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


def image_to_base64(image: Image.Image) -> str:
    """Encode a PIL Image to a base64 PNG string."""
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def extract_depth_map(image: Image.Image) -> Image.Image:
    """Extract a depth map from the input image using MiDaS (DPT-Large).

    Returns a grayscale depth image where lighter areas are closer.
    """
    model, processor = _get_depth_model()

    inputs = processor(images=image, return_tensors="pt").to(settings.DEVICE)

    with torch.no_grad():
        outputs = model(**inputs)
        predicted_depth = outputs.predicted_depth

    # Interpolate to original size
    prediction = torch.nn.functional.interpolate(
        predicted_depth.unsqueeze(1),
        size=image.size[::-1],  # (H, W)
        mode="bicubic",
        align_corners=False,
    )

    depth = prediction.squeeze().cpu().numpy()

    # Normalize to 0-255
    depth_min = depth.min()
    depth_max = depth.max()
    if depth_max - depth_min > 0:
        depth_normalized = (depth - depth_min) / (depth_max - depth_min) * 255.0
    else:
        depth_normalized = np.zeros_like(depth)

    depth_image = Image.fromarray(depth_normalized.astype(np.uint8))
    return depth_image


def extract_canny_edges(
    image: Image.Image,
    low_threshold: int = 50,
    high_threshold: int = 150,
) -> Image.Image:
    """Extract edges from the input image using Canny edge detection.

    Returns a binary edge map suitable for ControlNet conditioning.
    """
    img_array = np.array(image)
    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 1.4)

    # Canny edge detection
    edges = cv2.Canny(blurred, low_threshold, high_threshold)

    return Image.fromarray(edges)


def preprocess_image(image_b64: str) -> dict:
    """Run the full preprocessing pipeline on a base64-encoded image.

    Returns depth map and edge map as base64 strings.
    """
    image = image_from_base64(image_b64)

    depth_map = extract_depth_map(image)
    edge_map = extract_canny_edges(image)

    return {
        "depth_map_base64": image_to_base64(depth_map),
        "edge_map_base64": image_to_base64(edge_map),
        "width": image.width,
        "height": image.height,
    }
