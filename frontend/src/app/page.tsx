"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef } from "react";
import Header from "@/components/Header";
import PromptPanel from "@/components/PromptPanel";
import GeneratedResult from "@/components/GeneratedResult";
import { api, GenerateResponse, StreetViewResponse } from "@/lib/api";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const SCENARIOS = [
  {
    label: "🗼 Paris",
    name: "Eiffel Tower, Paris",
    lat: 48.8584,
    lng: 2.2945,
    prompt: "Futuristic solarpunk city, lush vertical gardens wrapping around sleek glass skyscrapers, highly detailed cinematic concept art, golden hour lighting",
  },
  {
    label: "🌆 New York",
    name: "Times Square, New York",
    lat: 40.758,
    lng: -73.9855,
    prompt: "Overgrown with lush green jungle plants and vines, highly detailed concept art, cinematic lighting",
  },
  {
    label: "🏯 Tokyo",
    name: "Shibuya Crossing, Tokyo",
    lat: 35.6598,
    lng: 139.7004,
    prompt: "Rainy neo-noir cyberpunk style, glowing neon signs reflecting on wet pavement, high contrast, visually stunning",
  },
  {
    label: "🌁 London",
    name: "Tower Bridge, London",
    lat: 51.5055,
    lng: -0.0754,
    prompt: "Tower bridge spanning across an epic frozen apocalyptic wasteland, snow storms, highly detailed concept art, cinematic dramatic lighting, photorealistic",
  },
];

export default function Home() {
  const [lat, setLat] = useState(40.7484);
  const [lng, setLng] = useState(-73.9857);
  const [locationName, setLocationName] = useState("Empire State Building, New York");
  const [promptOverride, setPromptOverride] = useState<string | undefined>(undefined);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  const [generatedResult, setGeneratedResult] = useState<GenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [streetViewResult, setStreetViewResult] = useState<StreetViewResponse | null>(null);
  const [isFetchingStreetView, setIsFetchingStreetView] = useState(false);
  const streetViewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStreetView = useCallback(async (newLat: number, newLng: number) => {
    setIsFetchingStreetView(true);
    setStreetViewResult(null);
    try {
      const result = await api.streetview({ lat: newLat, lng: newLng });
      setStreetViewResult(result);
    } catch {
      // Street view fetch failure is non-fatal — just clear the preview
      setStreetViewResult(null);
    } finally {
      setIsFetchingStreetView(false);
    }
  }, []);

  useEffect(() => {
    if (streetViewDebounceRef.current) clearTimeout(streetViewDebounceRef.current);
    streetViewDebounceRef.current = setTimeout(() => fetchStreetView(lat, lng), 600);
    return () => {
      if (streetViewDebounceRef.current) clearTimeout(streetViewDebounceRef.current);
    };
  }, [lat, lng, fetchStreetView]);

  const handleLocationChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setActiveScenario(null);
  }, []);

  const handleScenario = useCallback((idx: number) => {
    const s = SCENARIOS[idx];
    setLat(s.lat);
    setLng(s.lng);
    setLocationName(s.name);
    setPromptOverride(s.prompt);
    setActiveScenario(idx);
  }, []);

  const handleGenerate = useCallback(
    async ({ prompt }: { prompt: string }) => {
      setError(null);
      setGeneratedResult(null);
      setIsGenerating(true);
      try {
        const result = await api.generate({
          prompt,
          negative_prompt: "blurry, low quality, distorted, deformed, ugly, watermark, text",
          num_inference_steps: 30,
          guidance_scale: 7.5,
        });
        setGeneratedResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[380px] flex-shrink-0 border-r border-zinc-800 overflow-y-auto p-4 flex flex-col gap-5 pb-20">
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Select Location</h2>
            <MapPicker
              lat={lat}
              lng={lng}
              onLocationChange={handleLocationChange}
              onLocationName={setLocationName}
            />
          </div>

          <div className="h-px bg-zinc-800" />

          <PromptPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            isFetching={isFetchingStreetView}
            isPreprocessing={false}
            locationName={locationName}
            promptOverride={promptOverride}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-6 pb-20">
          <div className="max-w-2xl mx-auto">
            <GeneratedResult
              result={generatedResult}
              isGenerating={isGenerating}
              error={error}
              streetViewResult={streetViewResult}
              isFetchingStreetView={isFetchingStreetView}
            />
          </div>
        </main>
      </div>

      {/* Bottom scenario bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 border-t border-zinc-800 px-6 py-2.5 flex items-center gap-4 z-50 backdrop-blur-sm">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider whitespace-nowrap">
          Try a location &rarr;
        </span>
        <div className="flex gap-2 flex-wrap">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => handleScenario(i)}
              className={`px-3.5 py-1.5 text-xs rounded-md border transition-all whitespace-nowrap ${
                activeScenario === i
                  ? "border-violet-500 text-violet-400 bg-violet-500/12"
                  : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-violet-500 hover:text-violet-400 hover:bg-violet-500/8"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
