"use client";

import { GenerateResponse, StreetViewResponse } from "@/lib/api";

interface GeneratedResultProps {
  result: GenerateResponse | null;
  isGenerating: boolean;
  error: string | null;
  streetViewResult: StreetViewResponse | null;
  isFetchingStreetView: boolean;
}

export default function GeneratedResult({
  result,
  isGenerating,
  error,
  streetViewResult,
  isFetchingStreetView,
}: GeneratedResultProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Street View Preview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-zinc-300">Street View</h2>
          {streetViewResult?.demo && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Demo Mode
            </span>
          )}
        </div>
        <div className="aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800/50 relative">
          {isFetchingStreetView ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 border-3 border-cyan-500/30 rounded-full" />
                <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
              </div>
              <p className="text-xs text-zinc-400">Fetching street view...</p>
            </div>
          ) : streetViewResult ? (
            <img
              src={`data:image/png;base64,${streetViewResult.image_base64}`}
              alt="Google Street View"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
              Select a location to load street view
            </div>
          )}
        </div>
        {streetViewResult && !isFetchingStreetView && (
          <p className="mt-1.5 text-[11px] text-zinc-500">
            {streetViewResult.lat.toFixed(5)}, {streetViewResult.lng.toFixed(5)}
            {streetViewResult.demo ? " · No API key configured" : " · Google Street View"}
          </p>
        )}
      </div>

      {/* Generated Result */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Generated Result</h2>
        <div className="aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800/50 relative">
          {isGenerating ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-violet-500/30 rounded-full" />
                <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
              </div>
              <div className="text-center">
                <p className="text-sm text-zinc-300">Generating image...</p>
                <p className="text-xs text-zinc-500 mt-1">
                  This may take 30-60 seconds depending on your GPU
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full h-full flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-sm text-red-400 mb-1">Generation Failed</p>
                <p className="text-xs text-zinc-500">{error}</p>
              </div>
            </div>
          ) : result ? (
            <img
              src={`data:image/png;base64,${result.image_base64}`}
              alt="Generated result"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
              No image generated yet
            </div>
          )}
        </div>

        {result && !isGenerating && (
          <div className="mt-3">
            <button
              onClick={() => {
                const link = document.createElement("a");
                link.href = `data:image/png;base64,${result.image_base64}`;
                link.download = "geocanvas-result.png";
                link.click();
              }}
              className="bg-violet-600/20 text-violet-400 text-[11px] px-3 py-1.5 rounded hover:bg-violet-600/30 transition-colors cursor-pointer"
            >
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
