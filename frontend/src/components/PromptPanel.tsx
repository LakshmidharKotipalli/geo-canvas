"use client";

import { useState } from "react";

const STYLE_PRESETS = [
  { label: "Photorealistic", value: "photorealistic, ultra detailed, 8k, professional photography" },
  { label: "Cyberpunk", value: "cyberpunk style, neon lights, futuristic, blade runner aesthetic" },
  { label: "Watercolor", value: "watercolor painting, soft brushstrokes, artistic, delicate colors" },
  { label: "Oil Painting", value: "oil painting, rich textures, classical art style, museum quality" },
  { label: "Anime", value: "anime style, studio ghibli, vibrant colors, detailed illustration" },
  { label: "Pixel Art", value: "pixel art, retro 16-bit style, nostalgic, colorful pixels" },
  { label: "Sketch", value: "architectural sketch, pencil drawing, detailed linework" },
  { label: "Fantasy", value: "fantasy art, magical atmosphere, ethereal lighting, enchanted" },
];

const WEATHER_MODIFIERS = [
  { label: "Clear", value: "" },
  { label: "Rain", value: "rainy weather, wet streets, rain drops, reflections on wet ground" },
  { label: "Snow", value: "snowy weather, snow covered, winter wonderland, frost" },
  { label: "Fog", value: "foggy atmosphere, misty, mysterious, low visibility" },
  { label: "Storm", value: "dramatic storm, dark clouds, lightning, intense atmosphere" },
];

const TIME_MODIFIERS = [
  { label: "Day", value: "" },
  { label: "Dawn", value: "golden hour, sunrise, warm orange light, early morning" },
  { label: "Sunset", value: "sunset, dramatic sky, golden light, warm colors" },
  { label: "Night", value: "nighttime, city lights, moonlight, dark sky with stars" },
  { label: "Blue Hour", value: "blue hour, twilight, deep blue sky, ambient city glow" },
];

interface PromptPanelProps {
  onGenerate: (params: {
    prompt: string;
    negativePrompt: string;
    steps: number;
    guidanceScale: number;
    depthScale: number;
    cannyScale: number;
    seed: number | null;
  }) => void;
  isGenerating: boolean;
  isFetching: boolean;
  isPreprocessing: boolean;
  hasStreetView: boolean;
  onFetchStreetView: (heading: number, pitch: number, fov: number) => void;
}

export default function PromptPanel({
  onGenerate,
  isGenerating,
  isFetching,
  isPreprocessing,
  hasStreetView,
  onFetchStreetView,
}: PromptPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(
    "blurry, low quality, distorted, deformed, ugly, watermark, text"
  );
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedWeather, setSelectedWeather] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [steps, setSteps] = useState(30);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [depthScale, setDepthScale] = useState(0.8);
  const [cannyScale, setCannyScale] = useState(0.5);
  const [seedInput, setSeedInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Street view camera controls
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [fov, setFov] = useState(90);

  const buildFullPrompt = () => {
    const parts = [prompt];
    if (selectedStyle) parts.push(selectedStyle);
    if (selectedWeather) parts.push(selectedWeather);
    if (selectedTime) parts.push(selectedTime);
    return parts.filter(Boolean).join(", ");
  };

  const handleGenerate = () => {
    const fullPrompt = buildFullPrompt();
    if (!fullPrompt.trim()) return;

    onGenerate({
      prompt: fullPrompt,
      negativePrompt,
      steps,
      guidanceScale,
      depthScale,
      cannyScale,
      seed: seedInput ? parseInt(seedInput, 10) : null,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Fetch Street View */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Camera Controls
        </h3>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div>
            <label className="text-[11px] text-zinc-500">Heading</label>
            <input
              type="range"
              min="0"
              max="360"
              value={heading}
              onChange={(e) => setHeading(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <span className="text-[11px] text-zinc-500 font-mono">{heading}°</span>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">Pitch</label>
            <input
              type="range"
              min="-90"
              max="90"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <span className="text-[11px] text-zinc-500 font-mono">{pitch}°</span>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500">FOV</label>
            <input
              type="range"
              min="30"
              max="120"
              value={fov}
              onChange={(e) => setFov(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <span className="text-[11px] text-zinc-500 font-mono">{fov}°</span>
          </div>
        </div>
        <button
          onClick={() => onFetchStreetView(heading, pitch, fov)}
          disabled={isFetching}
          className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-200 text-sm rounded-lg transition-colors"
        >
          {isFetching ? "Fetching..." : "Fetch Street View"}
        </button>
      </div>

      {/* Prompt */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Creative Prompt
        </h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your vision... e.g., 'a beautiful sunset scene with warm golden light'"
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
        />
      </div>

      {/* Style Presets */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Style
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((style) => (
            <button
              key={style.label}
              onClick={() =>
                setSelectedStyle(selectedStyle === style.value ? "" : style.value)
              }
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                selectedStyle === style.value
                  ? "bg-violet-600 border-violet-500 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Weather
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {WEATHER_MODIFIERS.map((w) => (
            <button
              key={w.label}
              onClick={() =>
                setSelectedWeather(selectedWeather === w.value ? "" : w.value)
              }
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                selectedWeather === w.value
                  ? "bg-cyan-600 border-cyan-500 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time of Day */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Time of Day
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {TIME_MODIFIERS.map((t) => (
            <button
              key={t.label}
              onClick={() =>
                setSelectedTime(selectedTime === t.value ? "" : t.value)
              }
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                selectedTime === t.value
                  ? "bg-amber-600 border-amber-500 text-white"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced Settings
        </button>

        {showAdvanced && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500">Steps</label>
              <input
                type="number"
                min={10}
                max={50}
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500">Guidance Scale</label>
              <input
                type="number"
                min={1}
                max={20}
                step={0.5}
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500">Depth ControlNet</label>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={depthScale}
                onChange={(e) => setDepthScale(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <span className="text-[11px] text-zinc-500 font-mono">{depthScale}</span>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500">Canny ControlNet</label>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={cannyScale}
                onChange={(e) => setCannyScale(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <span className="text-[11px] text-zinc-500 font-mono">{cannyScale}</span>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500">Negative Prompt</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 resize-none col-span-2"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500">Seed (optional)</label>
              <input
                type="text"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="Random"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || isPreprocessing || !hasStreetView || !buildFullPrompt().trim()}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 text-white font-semibold rounded-lg transition-all text-sm"
      >
        {isPreprocessing
          ? "Preprocessing..."
          : isGenerating
          ? "Generating..."
          : !hasStreetView
          ? "Fetch Street View First"
          : "Generate"}
      </button>
    </div>
  );
}
