"use client";

import { useEffect, useState } from "react";
import { api, HealthResponse } from "@/lib/api";

export default function Header() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold">
          G
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
          GeoCanvas
        </h1>
        <span className="text-xs text-zinc-500 hidden sm:inline">
          Street View to AI Art
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {health ? (
          <>
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                health.cuda_available ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="text-zinc-400">
              {health.cuda_available
                ? health.gpu_name || "GPU"
                : "CPU mode"}
            </span>
          </>
        ) : (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            <span className="text-zinc-500">Backend offline</span>
          </>
        )}
      </div>
    </header>
  );
}
