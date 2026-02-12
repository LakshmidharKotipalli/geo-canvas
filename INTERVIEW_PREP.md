# GeoCanvas — Interview Preparation Guide

Use this document to confidently explain GeoCanvas in technical interviews, portfolio reviews, or project walkthroughs.

---

## 1. Elevator Pitch (30 seconds)

> "GeoCanvas is a full-stack application that transforms any real-world location into AI-generated art. You pick a spot on a map, the app fetches the actual Google Street View, extracts depth and edge information from that image, and then uses Stable Diffusion XL with multi-ControlNet conditioning to generate stylized versions — cyberpunk, watercolor, night scenes — while preserving the real spatial structure of that location."

---

## 2. Technical Deep Dive — Key Topics

### A. Why ControlNet? Why not just img2img?

**Question**: "Why did you use ControlNet instead of standard img2img with SDXL?"

**Answer**: img2img works by adding noise to the original image and denoising it, which means the output is tightly coupled to the original colors and textures. ControlNet is fundamentally different — it provides **structural conditioning** through separate control signals (depth maps, edge maps) while letting the diffusion model have full creative freedom over color, texture, and style. This means I can take a photo of a street in New York and generate it as a cyberpunk scene at night, and the buildings, roads, and spatial layout remain accurate because the depth and edge maps guide the geometry, not the pixel values.

### B. Multi-ControlNet Architecture

**Question**: "Explain how you used multiple ControlNets together."

**Answer**: I use two ControlNet models simultaneously:
- **Depth ControlNet** (`controlnet-depth-sdxl-1.0`) — conditioned on a MiDaS depth map that captures the 3D spatial relationships (what's near vs. far). This preserves the overall scene geometry.
- **Canny ControlNet** (`controlnet-canny-sdxl-1.0`) — conditioned on Canny edge detection output that captures architectural lines, building edges, and structural boundaries.

The depth ControlNet gets a higher conditioning scale (0.8) because spatial layout is more important, while the Canny ControlNet uses 0.5 to add structural detail without over-constraining the generation. The `StableDiffusionXLControlNetPipeline` from HuggingFace Diffusers accepts a list of ControlNet models and a list of conditioning images, applying them jointly during the denoising process.

### C. Preprocessing Pipeline

**Question**: "Walk me through the image preprocessing pipeline."

**Answer**:
1. **Input**: A 640x640 Street View image from Google Maps API
2. **Depth Estimation**: I use Intel's DPT-Large (a MiDaS model) from HuggingFace Transformers. It's a vision transformer that predicts relative depth per pixel. The output is interpolated to match the original resolution and normalized to 0-255 grayscale.
3. **Edge Detection**: OpenCV's Canny algorithm with Gaussian blur preprocessing (5x5 kernel, sigma 1.4) to reduce noise. Low threshold at 50, high at 150 — tuned for architectural features.
4. Both outputs are converted to RGB (3-channel) images for ControlNet compatibility, resized to the generation resolution (1024x1024).

### D. Backend Architecture

**Question**: "How is the backend structured?"

**Answer**: FastAPI with three separate router modules:
- `/api/streetview` — async HTTP call to Google Maps Street View Static API via `httpx`. Falls back to a procedurally-generated demo image when no API key is configured.
- `/api/preprocess` — runs MiDaS depth estimation (GPU-accelerated with PyTorch) and Canny edge detection (OpenCV). Models are lazy-loaded singletons so they're only initialized on first use.
- `/api/generate` — runs the SDXL + multi-ControlNet pipeline. Also lazy-loaded. Uses FP16 precision, `model_cpu_offload` for memory efficiency, and optional xformers attention.

All heavy computation is in service modules, keeping routers thin. Configuration is centralized in a settings class that reads from environment variables.

### E. Frontend Architecture

**Question**: "What decisions did you make on the frontend?"

**Answer**: Next.js 16 with TypeScript and Tailwind CSS. Key decisions:
- **Leaflet for maps** instead of Google Maps — free, no API key needed for the interactive map, keeps the Google dependency only to Street View data fetching.
- **Dynamic import** for MapPicker — Leaflet requires `window`, so it's loaded client-side only via `next/dynamic` with `ssr: false`.
- **Typed API client** — a single `api.ts` module with TypeScript interfaces matching the backend's Pydantic models, ensuring type safety across the stack.
- **Pipeline state management** — React state tracks each stage (fetching, preprocessing, generating) independently, enabling granular loading UI and error handling.

### F. Prompt Engineering

**Question**: "How do the style presets work?"

**Answer**: The frontend constructs a composite prompt by concatenating:
1. User's free-text prompt
2. Selected style modifier (e.g., "cyberpunk style, neon lights, futuristic, blade runner aesthetic")
3. Weather modifier (e.g., "rainy weather, wet streets, rain drops, reflections on wet ground")
4. Time-of-day modifier (e.g., "nighttime, city lights, moonlight, dark sky with stars")

This is combined with a negative prompt ("blurry, low quality, distorted...") to guide the model away from common artifacts. The ControlNet conditioning ensures spatial accuracy regardless of how creative the prompt gets.

---

## 3. Potential Interview Questions & Answers

### System Design

**Q: How would you scale this for production?**
A:
- Move generation to a GPU-backed task queue (Celery + Redis) since inference takes 30-60 seconds
- Add WebSocket/SSE for real-time progress updates instead of long-polling
- Cache preprocessed depth/edge maps — same street view with same camera angle always produces the same maps
- Use a CDN for generated images instead of base64 in API responses
- Consider batching: queue multiple requests and process them in sequence on the GPU

**Q: What are the latency bottlenecks?**
A:
- Model loading on first request (~30-60s) — solved with lazy singleton pattern, could pre-warm on startup
- Depth estimation: ~2-3s on GPU, ~15-20s on CPU
- SDXL generation: ~15-30s on a good GPU (A100/4090), ~3-5 minutes on CPU
- Street View API: ~200-500ms network latency

**Q: How do you handle memory constraints?**
A:
- FP16 precision halves model memory usage
- `enable_model_cpu_offload()` moves unused model components to CPU between pipeline stages
- xformers memory-efficient attention reduces peak VRAM during self-attention
- Models are loaded lazily, not at startup

### ML/AI

**Q: Why MiDaS for depth instead of training your own model?**
A: MiDaS (specifically DPT-Large) is the standard for monocular depth estimation and was trained on a diverse mix of datasets. It generalizes well to street scenes without fine-tuning. The ControlNet depth model was also trained with MiDaS-generated depth maps, so using the same model ensures consistency in the conditioning signal.

**Q: What happens if the street view image has no clear structure?**
A: If the depth map has low variance (e.g., pointing at a flat wall or sky), the depth ControlNet provides weak conditioning and the output relies more on the Canny edges and the text prompt. The user can adjust the ControlNet scales to compensate — lowering both scales gives the model more creative freedom.

**Q: Why SDXL over SD 1.5?**
A: SDXL generates at 1024x1024 natively (vs 512x512 for SD 1.5), produces significantly more detailed and coherent images, and has better text understanding. The ControlNet variants for SDXL also produce higher fidelity structural adherence.

### Software Engineering

**Q: Why separate the preprocessing and generation into different API endpoints?**
A: Separation of concerns and user experience. The user can preview the depth and edge maps before committing to a generation (which is much slower and more GPU-intensive). It also allows re-generating with different prompts without re-running preprocessing for the same street view image.

**Q: How do you handle the Google Maps API key being absent?**
A: The backend has a demo fallback mode that generates a procedural gradient image with coordinate-based variation and a text overlay. This lets the entire frontend pipeline work end-to-end without any external API dependency during development and demos.

---

## 4. Project Metrics to Mention

- **Full-stack**: Python backend + TypeScript/React frontend
- **14 source files** across backend services, API routes, and React components
- **4 AI models** integrated (SDXL, 2 ControlNets, MiDaS)
- **Multi-ControlNet**: simultaneous depth + edge conditioning
- **Typed end-to-end**: Pydantic on backend, TypeScript interfaces on frontend
- **Zero-config demo mode**: works without any API keys or GPU

---

## 5. Technologies to Highlight on Resume

| Category | Technologies |
|----------|-------------|
| AI/ML | Stable Diffusion XL, ControlNet, MiDaS (DPT), HuggingFace Diffusers, PyTorch |
| Computer Vision | OpenCV (Canny edge detection), monocular depth estimation |
| Backend | FastAPI, Python, async/await, Pydantic |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Leaflet |
| APIs | Google Maps Street View Static API, REST API design |
| DevOps | FP16 optimization, GPU memory management, lazy model loading |

---

## 6. Diffusion Models — Conceptual Understanding

### How does Stable Diffusion work?

Stable Diffusion is a **latent diffusion model**. Instead of operating on raw pixels (which would be computationally prohibitive at high resolution), it works in a compressed **latent space**:

1. **VAE Encoder** compresses a 1024x1024 image into a 128x128 latent representation (8x spatial compression)
2. **Forward diffusion** gradually adds Gaussian noise to the latent over T timesteps until it becomes pure noise
3. **Reverse diffusion (inference)** starts from random noise and iteratively denoises it, guided by a text prompt
4. **VAE Decoder** expands the final denoised latent back to pixel space

The U-Net in the middle does the actual denoising. It receives:
- The noisy latent at timestep t
- The timestep embedding (telling it how noisy the image is)
- Text embeddings from CLIP (telling it what to generate)

### What makes SDXL different from SD 1.5?

| Aspect | SD 1.5 | SDXL |
|--------|--------|------|
| Native resolution | 512x512 | 1024x1024 |
| U-Net parameters | ~860M | ~3.5B |
| Text encoders | 1 (CLIP ViT-L) | 2 (CLIP ViT-L + OpenCLIP ViT-bigG) |
| Architecture | Single-stage | Base + optional refiner |
| Conditioning | Text only | Text + original size + crop coords |

SDXL uses **two text encoders** and concatenates their outputs, giving it much richer text understanding. It also conditions on the target resolution and crop coordinates, which eliminates the artifacts SD 1.5 shows when generating outside 512x512.

### How does ControlNet inject spatial conditioning?

ControlNet creates a **trainable copy** of the U-Net's encoder blocks. The control image (depth map, edge map) is processed through these copied blocks, and their outputs are added to the corresponding layers of the locked original U-Net via zero convolutions (1x1 convolutions initialized to zero). This means:

- At the start of training, ControlNet has zero effect (preserving the pre-trained model)
- It gradually learns to inject spatial signals without destroying the base model's capabilities
- The `controlnet_conditioning_scale` parameter controls how strongly these signals are added

With multi-ControlNet, each control model produces its own set of residuals, which are summed before being added to the U-Net.

### What is Classifier-Free Guidance (CFG)?

During inference, the model runs **two forward passes** at each timestep:
1. **Conditional**: denoising guided by the text prompt
2. **Unconditional**: denoising with an empty prompt

The final prediction is: `output = unconditional + guidance_scale * (conditional - unconditional)`

A higher guidance scale (7-12) means the model follows the prompt more literally. Too high (>15) causes oversaturation and artifacts. In GeoCanvas, the default is 7.5 — a balance between prompt adherence and natural-looking output.

---

## 7. Computer Vision Concepts

### Monocular Depth Estimation (MiDaS / DPT)

**What it does**: Predicts relative depth from a single 2D image (no stereo pair needed).

**How DPT-Large works**:
- Uses a Vision Transformer (ViT) backbone instead of a CNN
- ViT splits the image into 16x16 patches and processes them as a sequence (like tokens in NLP)
- Multi-scale feature extraction: tokens from different transformer layers capture different levels of detail
- A convolutional decoder assembles these multi-scale features into a dense depth prediction
- Outputs **relative depth** (ordinal relationships), not absolute metric depth

**Why it works for ControlNet**: ControlNet doesn't need metric accuracy — it just needs to know "this area is closer than that area" to preserve the 3D layout. MiDaS excels at this relative ordering.

### Canny Edge Detection

**The algorithm** (step by step):
1. **Gaussian Blur** (5x5 kernel, sigma 1.4) — smooths the image to reduce noise
2. **Gradient Computation** — Sobel filters in X and Y directions compute intensity gradients
3. **Non-Maximum Suppression** — thins edges to 1-pixel width by keeping only local maxima along the gradient direction
4. **Double Thresholding** — classifies edge pixels as strong (>150), weak (50-150), or non-edge (<50)
5. **Hysteresis** — weak edges connected to strong edges are kept; isolated weak edges are discarded

**Why these thresholds**: Low=50, High=150 is tuned for architectural scenes. Lower thresholds capture more subtle details (textures, shadows) which can over-constrain the generation. Higher thresholds capture only the strongest structural lines (building outlines, road edges).

---

## 8. API Design & Backend Patterns

### Why FastAPI?

- **Async by default** — `async def` endpoints handle concurrent requests without blocking (critical when one user's generation takes 30s)
- **Pydantic validation** — request bodies are validated and typed automatically from model definitions
- **Auto-generated docs** — Swagger UI at `/docs` and ReDoc at `/redoc` for free
- **Performance** — one of the fastest Python frameworks, comparable to Node.js/Go for I/O-bound work

### Lazy Singleton Pattern (used for ML models)

```python
_model = None

def get_model():
    global _model
    if _model is None:
        _model = load_heavy_model()  # Only loads once
    return _model
```

**Why**: ML models take 10-60s to load and consume gigabytes of VRAM. Loading them at import time would make the server take a minute to start. Loading per-request would be catastrophically slow. The lazy singleton loads on first use and reuses the same instance for all subsequent requests.

**Trade-off**: The first request is slow (cold start). In production, you'd pre-warm models with a startup event or health check.

### Base64 for Image Transfer

**Why base64 instead of file uploads/URLs**:
- Keeps the API stateless — no temp file management or cleanup
- Images stay in memory throughout the pipeline (streetview → preprocess → generate)
- Frontend can display images directly via `data:image/png;base64,...` URLs
- Simpler than managing a file storage system for a prototype

**Trade-off**: Base64 adds ~33% overhead to image size. For production, you'd store images in S3/GCS and pass URLs.

---

## 9. Frontend Patterns & Decisions

### Dynamic Imports for SSR Compatibility

```tsx
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });
```

**Problem**: Leaflet accesses `window` and `document` at import time, which don't exist during server-side rendering in Next.js.

**Solution**: `next/dynamic` with `ssr: false` ensures the component only loads in the browser. The rest of the page still benefits from SSR.

### State Machine for Pipeline Stages

The main page tracks three independent loading states:
- `isFetching` — street view API call in progress
- `isPreprocessing` — depth + edge extraction running
- `isGenerating` — SDXL + ControlNet inference running

This enables:
- Showing the correct spinner/message at each stage
- Disabling buttons appropriately (can't generate without a street view)
- Independent error handling per stage
- The user seeing intermediate results (street view appears immediately, then depth/edge maps appear, then the final generation)

### Controlled vs Uncontrolled Inputs

The coordinate inputs are **controlled components** — their values come from React state and stay in sync with the map marker. When you click the map, it updates state, which updates the inputs. When you type coordinates, it updates state on blur/Enter, which moves the map marker. This bidirectional binding ensures the map and coordinate fields are always consistent.

---

## 10. Behavioral / STAR Format Answers

### "Tell me about a challenging technical problem you solved"

**Situation**: I was building GeoCanvas and needed generated images to preserve the real-world spatial structure of street view locations — buildings in the right places, roads at the correct depth, sky where it should be.

**Task**: Find a way to guide SDXL generation with structural information from real photographs without constraining the artistic style.

**Action**: I implemented a multi-ControlNet pipeline with two complementary control signals. I used MiDaS depth estimation to capture 3D spatial relationships (what's near vs. far) and Canny edge detection to capture architectural lines and boundaries. I tuned the conditioning scales — 0.8 for depth (more important for overall layout) and 0.5 for edges (adds detail without over-constraining). I also built the pipeline so users can adjust these scales in the UI to find the right balance for different scenes.

**Result**: The generated images accurately preserve building positions, road layouts, and spatial relationships while applying completely different artistic styles. A Times Square street view can become a cyberpunk scene, a watercolor painting, or a snowy night scene — and the buildings are still recognizably in the right places.

### "Tell me about a design decision you made and why"

**Situation**: I needed to choose between using img2img (simpler) vs. ControlNet (more complex) for the image generation pipeline.

**Task**: Decide on the right approach that would give users maximum creative freedom while preserving location accuracy.

**Action**: I prototyped both approaches. img2img preserved colors and textures from the original photo, making it hard to do dramatic style changes like "cyberpunk at night" from a daytime photo. ControlNet with depth + edge conditioning preserved only the structural information, giving the diffusion model complete freedom over colors, lighting, and style. I chose ControlNet and added multi-ControlNet to combine depth (global layout) and edges (local detail).

**Result**: Users can apply any artistic style to any location and the spatial structure remains accurate. The separation between structure (ControlNet) and style (text prompt) is clean and intuitive.

### "How do you approach learning new technologies?"

**Situation**: Building GeoCanvas required integrating multiple AI models (SDXL, ControlNet, MiDaS) that I hadn't worked with as a combined pipeline before.

**Task**: Understand how these models interact and build a reliable pipeline.

**Action**: I started by reading the HuggingFace Diffusers documentation and the original ControlNet paper to understand the architecture. I built each component incrementally — first getting SDXL working alone, then adding single ControlNet, then multi-ControlNet. I tested each stage with known inputs (synthetic depth maps, simple edge images) before connecting real street view data. I also read the MiDaS paper to understand why DPT-Large produces depth maps compatible with ControlNet training data.

**Result**: The incremental approach meant each component was verified before integration. When issues arose (like depth map normalization not matching ControlNet's expectations), I could isolate and fix them quickly because I understood each model's input/output format.

---

## 11. Questions to Ask the Interviewer

If the interviewer asks about GeoCanvas, use these to steer the conversation:

- "Would you like me to walk through the data flow from coordinate selection to final image?"
- "I can explain the trade-offs between different ControlNet conditioning types if you're interested in the ML side."
- "The backend uses some interesting patterns for GPU memory management — would you like to hear about those?"

If they ask what you'd improve:
- "I'd add a LoRA fine-tuning pipeline so users could train custom styles on specific architectural datasets"
- "I'd implement progressive generation — showing the image evolve through denoising steps via WebSocket streaming"
- "I'd add a comparison mode where you can generate multiple style variations side by side from the same street view"

---

## 12. Related Concepts You Should Know

### Diffusion Model Ecosystem

| Term | Definition |
|------|-----------|
| **Latent Diffusion** | Diffusion in compressed latent space instead of pixel space (faster, less memory) |
| **U-Net** | The denoising network architecture — encoder-decoder with skip connections |
| **CLIP** | Contrastive Language-Image Pre-training — encodes text prompts into embeddings the U-Net understands |
| **VAE** | Variational Autoencoder — compresses images to/from latent space |
| **LoRA** | Low-Rank Adaptation — lightweight fine-tuning by injecting small trainable matrices into attention layers |
| **Scheduler** | Controls the noise schedule (how much noise at each timestep). Common: DDPM, DDIM, Euler, DPM++ |
| **Negative Prompt** | Text describing what to avoid — processed as the unconditional branch in CFG |
| **Inpainting** | Selectively regenerating parts of an image while keeping the rest fixed |

### Computer Vision Fundamentals

| Term | Definition |
|------|-----------|
| **Convolution** | Sliding a filter kernel over an image to extract features (edges, textures, patterns) |
| **Sobel Filter** | 3x3 kernels that compute horizontal and vertical image gradients (used inside Canny) |
| **Non-Maximum Suppression** | Keeping only local maxima to produce thin, single-pixel edges |
| **Vision Transformer (ViT)** | Treating image patches as tokens and processing them with transformer attention |
| **Monocular Depth** | Estimating depth from a single image (vs. stereo depth from two cameras) |
| **Feature Pyramid** | Multi-scale feature extraction — capturing both fine details and global context |

### Web / API Fundamentals

| Term | Definition |
|------|-----------|
| **CORS** | Cross-Origin Resource Sharing — backend must explicitly allow requests from the frontend's origin |
| **SSR vs CSR** | Server-Side Rendering vs Client-Side Rendering — Next.js does SSR by default, Leaflet needs CSR |
| **Pydantic** | Python library for data validation using type hints — auto-validates FastAPI request bodies |
| **Base64 Encoding** | Binary-to-text encoding that represents images as ASCII strings (33% size overhead) |
| **Async/Await** | Non-blocking I/O pattern — FastAPI handles concurrent requests while one waits on GPU inference |
