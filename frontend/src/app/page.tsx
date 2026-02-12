"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import Header from "@/components/Header";
import PromptPanel from "@/components/PromptPanel";
import ImagePreview from "@/components/ImagePreview";
import GeneratedResult from "@/components/GeneratedResult";
import { api, GenerateResponse } from "@/lib/api";

// Leaflet must be loaded client-side only (no SSR)
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

export default function Home() {
  // Location state — default to Empire State Building
  const [lat, setLat] = useState(40.7484);
  const [lng, setLng] = useState(-73.9857);

  // Image pipeline state
  const [streetViewImage, setStreetViewImage] = useState<string | null>(null);
  const [depthMap, setDepthMap] = useState<string | null>(null);
  const [edgeMap, setEdgeMap] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GenerateResponse | null>(null);

  // Loading states
  const [isFetching, setIsFetching] = useState(false);
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const handleFetchStreetView = useCallback(
    async (heading: number, pitch: number, fov: number) => {
      setIsFetching(true);
      setError(null);
      setDepthMap(null);
      setEdgeMap(null);
      setGeneratedResult(null);
      setLoadingStage("Fetching street view...");

      try {
        const result = await api.fetchStreetView({
          lat,
          lng,
          heading,
          pitch,
          fov,
        });
        setStreetViewImage(result.image_base64);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch street view");
      } finally {
        setIsFetching(false);
        setLoadingStage("");
      }
    },
    [lat, lng]
  );

  const handleGenerate = useCallback(
    async (params: {
      prompt: string;
      negativePrompt: string;
      steps: number;
      guidanceScale: number;
      depthScale: number;
      cannyScale: number;
      seed: number | null;
    }) => {
      if (!streetViewImage) return;

      setError(null);
      setGeneratedResult(null);

      // Step 1: Preprocess
      setIsPreprocessing(true);
      setLoadingStage("Extracting depth map and edges...");

      let depthMapB64: string;
      let edgeMapB64: string;

      try {
        const preprocessResult = await api.preprocess(streetViewImage);
        depthMapB64 = preprocessResult.depth_map_base64;
        edgeMapB64 = preprocessResult.edge_map_base64;
        setDepthMap(depthMapB64);
        setEdgeMap(edgeMapB64);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preprocessing failed");
        setIsPreprocessing(false);
        setLoadingStage("");
        return;
      }

      setIsPreprocessing(false);

      // Step 2: Generate
      setIsGenerating(true);
      setLoadingStage("Generating with SDXL + ControlNet...");

      try {
        const result = await api.generate({
          prompt: params.prompt,
          depth_map_base64: depthMapB64,
          edge_map_base64: edgeMapB64,
          negative_prompt: params.negativePrompt,
          num_inference_steps: params.steps,
          guidance_scale: params.guidanceScale,
          controlnet_depth_scale: params.depthScale,
          controlnet_canny_scale: params.cannyScale,
          seed: params.seed ?? undefined,
        });
        setGeneratedResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setIsGenerating(false);
        setLoadingStage("");
      }
    },
    [streetViewImage]
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Controls */}
        <aside className="w-[380px] flex-shrink-0 border-r border-zinc-800 overflow-y-auto p-4 flex flex-col gap-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">
              Select Location
            </h2>
            <MapPicker
              lat={lat}
              lng={lng}
              onLocationChange={handleLocationChange}
            />
          </div>

          <div className="h-px bg-zinc-800" />

          <PromptPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            isFetching={isFetching}
            isPreprocessing={isPreprocessing}
            hasStreetView={!!streetViewImage}
            onFetchStreetView={handleFetchStreetView}
          />
        </aside>

        {/* Right Panel: Results */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <ImagePreview
              streetView={streetViewImage}
              depthMap={depthMap}
              edgeMap={edgeMap}
              isLoading={isFetching || isPreprocessing}
              loadingStage={loadingStage}
            />

            <div className="h-px bg-zinc-800" />

            <GeneratedResult
              result={generatedResult}
              isGenerating={isGenerating}
              error={error}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
