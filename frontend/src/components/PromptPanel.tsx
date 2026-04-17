"use client";

import { useState, useEffect } from "react";

interface PromptPanelProps {
  onGenerate: (params: { prompt: string }) => void;
  isGenerating: boolean;
  isFetching: boolean;
  isPreprocessing: boolean;
  locationName?: string;
  promptOverride?: string;
}

export default function PromptPanel({
  onGenerate,
  isGenerating,
  isFetching,
  isPreprocessing,
  locationName,
  promptOverride,
}: PromptPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [promptManuallyEdited, setPromptManuallyEdited] = useState(false);

  useEffect(() => {
    if (!locationName || promptManuallyEdited) return;
    setPrompt(locationName);
  }, [locationName]);

  useEffect(() => {
    if (promptOverride === undefined) return;
    setPrompt(promptOverride);
    setPromptManuallyEdited(false);
  }, [promptOverride]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate({ prompt });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Prompt
        </h3>
        <textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setPromptManuallyEdited(true); }}
          placeholder="Pick a location on the map — a prompt will be suggested automatically"
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || isFetching || isPreprocessing || !prompt.trim()}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-lg transition-all text-sm"
      >
        {isGenerating ? "Generating..." : "Generate from Location"}
      </button>
    </div>
  );
}
