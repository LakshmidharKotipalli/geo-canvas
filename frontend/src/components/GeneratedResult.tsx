"use client";

import { GenerateResponse } from "@/lib/api";

interface GeneratedResultProps {
  result: GenerateResponse | null;
  isGenerating: boolean;
  error: string | null;
}

export default function GeneratedResult({
  result,
  isGenerating,
  error,
}: GeneratedResultProps) {
  return (
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
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
          <span className="bg-zinc-800 px-2 py-1 rounded">
            {result.steps} steps
          </span>
          <span className="bg-zinc-800 px-2 py-1 rounded">
            CFG {result.guidance_scale}
          </span>
          <span className="bg-zinc-800 px-2 py-1 rounded">
            Depth: {result.controlnet_scale[0]} | Canny: {result.controlnet_scale[1]}
          </span>
          {result.seed !== null && (
            <span className="bg-zinc-800 px-2 py-1 rounded">
              Seed: {result.seed}
            </span>
          )}
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = `data:image/png;base64,${result.image_base64}`;
              link.download = "geocanvas-result.png";
              link.click();
            }}
            className="bg-violet-600/20 text-violet-400 px-2 py-1 rounded hover:bg-violet-600/30 transition-colors cursor-pointer"
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
}
