const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface StreetViewRequest {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  fov?: number;
}

export interface StreetViewResponse {
  image_base64: string;
  width: number;
  height: number;
  lat: number;
  lng: number;
  demo?: boolean;
}

export interface PreprocessResponse {
  depth_map_base64: string;
  edge_map_base64: string;
  width: number;
  height: number;
}

export interface GenerateRequest {
  prompt: string;
  depth_map_base64: string;
  edge_map_base64: string;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  controlnet_depth_scale?: number;
  controlnet_canny_scale?: number;
  seed?: number;
  width?: number;
  height?: number;
}

export interface GenerateResponse {
  image_base64: string;
  width: number;
  height: number;
  prompt: string;
  negative_prompt: string;
  steps: number;
  guidance_scale: number;
  controlnet_scale: number[];
  seed: number | null;
}

export interface HealthResponse {
  status: string;
  cuda_available: boolean;
  device: string;
  gpu_name: string | null;
}

async function apiRequest<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "API request failed");
  }

  return response.json();
}

export const api = {
  health: () => apiRequest<HealthResponse>("/health"),

  fetchStreetView: (params: StreetViewRequest) =>
    apiRequest<StreetViewResponse>("/streetview", params),

  preprocess: (imageBase64: string) =>
    apiRequest<PreprocessResponse>("/preprocess", { image_base64: imageBase64 }),

  generate: (params: GenerateRequest) =>
    apiRequest<GenerateResponse>("/generate", params),
};
