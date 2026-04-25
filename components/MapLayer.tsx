"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock } from "lucide-react";
import { mapPins, MAPBOX_TOKEN, NEIGHBORHOOD } from "@/lib/mockData";

type PinType = "meeting" | "permit" | "resource" | "advocacy";

const layerConfig: Record<PinType, { color: string; label: string; emoji: string }> = {
  meeting: { color: "#E8A020", label: "Upcoming meetings", emoji: "📅" },
  permit: { color: "#E06B5A", label: "Development permits", emoji: "🏗" },
  resource: { color: "#4A7C59", label: "Community resources", emoji: "🤝" },
  advocacy: { color: "#7C5C9A", label: "Advocacy orgs", emoji: "📢" },
};

interface Pin {
  id: string;
  type: PinType;
  title: string;
  description: string;
  deadline: string;
  action: string;
  lat: number;
  lng: number;
}

interface PopupInfo {
  pin: Pin;
  x: number;
  y: number;
}

export default function MapLayer() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [activeLayers, setActiveLayers] = useState<Set<PinType>>(
    new Set<PinType>(["meeting", "permit", "resource", "advocacy"])
  );
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const toggleLayer = (type: PinType) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("mapbox-gl").then((module) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapboxgl: any = module.default || module;
      (mapboxgl as any).accessToken = MAPBOX_TOKEN;

      const map = new (mapboxgl as any).Map({
        container: mapRef.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: NEIGHBORHOOD.center,
        zoom: 13.5,
        pitch: 0,
        bearing: 0,
      });

      mapInstanceRef.current = map;

      map.on("load", () => {
        setMapLoaded(true);

        // Add district boundary layer (mock polygon around Temescal)
        map.addSource("district", {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [-122.278, 37.830],
                [-122.256, 37.830],
                [-122.254, 37.848],
                [-122.278, 37.848],
                [-122.278, 37.830],
              ]],
            },
            properties: {},
          },
        });

        map.addLayer({
          id: "district-fill",
          type: "fill",
          source: "district",
          paint: { "fill-color": "#1B2A4A", "fill-opacity": 0.05 },
        });

        map.addLayer({
          id: "district-outline",
          type: "line",
          source: "district",
          paint: {
            "line-color": "#1B2A4A",
            "line-width": 2,
            "line-dasharray": [4, 3],
            "line-opacity": 0.5,
          },
        });
      });

      // Add markers for pins
      mapPins.forEach(pin => {
        const el = document.createElement("div");
        const cfg = layerConfig[pin.type];
        el.className = "map-pin-marker";
        el.style.cssText = `
          width: 36px;
          height: 36px;
          background-color: ${cfg.color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        `;

        const inner = document.createElement("div");
        inner.style.cssText = `
          transform: rotate(45deg);
          font-size: 14px;
          line-height: 1;
        `;
        inner.textContent = cfg.emoji;
        el.appendChild(inner);

        el.addEventListener("mouseenter", () => {
          el.style.transform = "rotate(-45deg) scale(1.15)";
          el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.35)";
        });
        el.addEventListener("mouseleave", () => {
          el.style.transform = "rotate(-45deg) scale(1)";
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
        });

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const rect = el.getBoundingClientRect();
          const mapRect = mapRef.current!.getBoundingClientRect();
          setPopup({
            pin,
            x: rect.left - mapRect.left + rect.width / 2,
            y: rect.top - mapRect.top,
          });
        });

        const marker = new (mapboxgl as any).Marker(el)
          .setLngLat([pin.lng, pin.lat])
          .addTo(map);

        (marker as any)._pinType = pin.type;
        markersRef.current.push(marker);
      });

      return () => {
        map.remove();
      };
    });
  }, []);

  // Show/hide markers based on active layers
  useEffect(() => {
    markersRef.current.forEach((marker: any) => {
      const el = marker.getElement();
      const pinType = marker._pinType;
      el.style.display = activeLayers.has(pinType) ? "flex" : "none";
    });
  }, [activeLayers]);

  return (
    <div className="relative w-full" style={{ minHeight: 520 }}>
      {/* Layer toggle pills */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
        {/* District boundaries pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-200 text-[#1B2A4A]" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
          <svg width="12" height="8" viewBox="0 0 12 8">
            <line x1="0" y1="4" x2="12" y2="4" stroke="#1B2A4A" strokeWidth="1.5" strokeDasharray="3 2" />
          </svg>
          District boundaries
        </div>
        {(Object.entries(layerConfig) as [PinType, typeof layerConfig[PinType]][]).map(([type, cfg]) => (
          <button
            key={type}
            onClick={() => toggleLayer(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
            style={{
              backgroundColor: activeLayers.has(type) ? cfg.color : "white",
              borderColor: activeLayers.has(type) ? cfg.color : "#E5E7EB",
              color: activeLayers.has(type) ? "white" : "#374151",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
          >
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div ref={mapRef} className="w-full rounded-[12px] overflow-hidden" style={{ height: 540 }} onClick={() => setPopup(null)} />

      {/* Pin popup */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-20 w-72 bg-white rounded-[12px] border border-gray-100 overflow-hidden"
            style={{
              left: Math.min(Math.max(popup.x - 144, 8), (mapRef.current?.offsetWidth || 600) - 296),
              top: popup.y - 10,
              transform: "translateY(-100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="h-1 w-full"
              style={{ backgroundColor: layerConfig[popup.pin.type].color }}
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-bold text-[#1B2A4A] text-sm leading-tight">{popup.pin.title}</div>
                  <div
                    className="text-xs font-medium mt-0.5"
                    style={{ color: layerConfig[popup.pin.type].color }}
                  >
                    {layerConfig[popup.pin.type].label}
                  </div>
                </div>
                <button onClick={() => setPopup(null)} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">{popup.pin.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                <Clock size={11} />
                {popup.pin.deadline}
              </div>
              <button
                className="w-full text-xs font-bold py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: layerConfig[popup.pin.type].color }}
              >
                {popup.pin.action}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FAF9F6] rounded-[12px]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-[#E8A020] border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <span className="text-xs text-gray-400">Loading map…</span>
          </div>
        </div>
      )}
    </div>
  );
}
