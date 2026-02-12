"use client";

import { useEffect, useRef, useState } from "react";

interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onLocationChange }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [latInput, setLatInput] = useState(lat.toString());
  const [lngInput, setLngInput] = useState(lng.toString());

  useEffect(() => {
    setLatInput(lat.toString());
    setLngInput(lng.toString());
  }, [lat, lng]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Load Leaflet CSS via link tag (avoids TS module resolution issues)
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const customIcon = L.divIcon({
        html: `<div style="width:24px;height:24px;background:linear-gradient(135deg,#8b5cf6,#06b6d4);border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: "",
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng);
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onLocationChange(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
    }
  }, [lat, lng]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        onLocationChange(newLat, newLng);
      }
    } catch {
      // Search failed silently
    }
  };

  const handleCoordSubmit = () => {
    const newLat = parseFloat(latInput);
    const newLng = parseFloat(lngInput);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      onLocationChange(newLat, newLng);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search location..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-lg overflow-hidden border border-zinc-700"
      />

      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Lat</label>
          <input
            type="text"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={handleCoordSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleCoordSubmit()}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-zinc-500 uppercase tracking-wider">Lng</label>
          <input
            type="text"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={handleCoordSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleCoordSubmit()}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
    </div>
  );
}
