"use client";

interface ImagePreviewProps {
  streetView: string | null;
  depthMap: string | null;
  edgeMap: string | null;
  isLoading: boolean;
  loadingStage: string;
}

function ImageCard({
  label,
  imageBase64,
  placeholder,
}: {
  label: string;
  imageBase64: string | null;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800/50">
        {imageBase64 ? (
          <img
            src={`data:image/png;base64,${imageBase64}`}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImagePreview({
  streetView,
  depthMap,
  edgeMap,
  isLoading,
  loadingStage,
}: ImagePreviewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-300">Preprocessing Pipeline</h2>
        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-violet-400">{loadingStage}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ImageCard
          label="Street View"
          imageBase64={streetView}
          placeholder="No image"
        />
        <ImageCard
          label="Depth Map"
          imageBase64={depthMap}
          placeholder="Awaiting preprocessing"
        />
        <ImageCard
          label="Edge Map"
          imageBase64={edgeMap}
          placeholder="Awaiting preprocessing"
        />
      </div>
    </div>
  );
}
