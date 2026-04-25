"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, GeoJSON, Marker, Layer } from "leaflet";

// ─── Council member data (sourced from council.nyc.gov/map-widget/) ──────────
const COUNCIL_MEMBERS: Record<number, string> = {
  1: "Christopher Marte",
  2: "Harvey Epstein",
  3: "Vacant",
  4: "Virginia Maloney",
  5: "Speaker Julie Menin",
  6: "Gale A. Brewer",
  7: "Majority Leader Shaun Abreu",
  8: "Elsie Encarnacion",
  9: "Yusef Salaam",
  10: "Carmen De La Rosa",
  11: "Eric Dinowitz",
  12: "Kevin C. Riley",
  13: "Shirley Aldebol",
  14: "Pierina Ana Sanchez",
  15: "Oswald Feliz",
  16: "Althea Stevens",
  17: "Justin Sanchez",
  18: "Amanda Farías",
  19: "Vickie Paladino",
  20: "Sandra Ung",
  21: "Shanel Thomas-Henry",
  22: "Tiffany Cabán",
  23: "Linda Lee",
  24: "James F. Gennaro",
  25: "Shekar Krishnan",
  26: "Julie Won",
  27: "Deputy Speaker Dr. Nantasha Williams",
  28: "Ty Hankerson",
  29: "Lynn Schulman",
  30: "Phil Wong",
  31: "Selvena N. Brooks-Powers",
  32: "Joann Ariola",
  33: "Lincoln Restler",
  34: "Jennifer Gutiérrez",
  35: "Crystal Hudson",
  36: "Chi Ossé",
  37: "Sandy Nurse",
  38: "Alexa Avilés",
  39: "Shahana Hanif",
  40: "Rita Joseph",
  41: "Darlene Mealy",
  42: "Chris Banks",
  43: "Susan Zhuang",
  44: "Simcha Felder",
  45: "Farah N. Louis",
  46: "Mercedes Narcisse",
  47: "Kayla Santosuosso",
  48: "Inna Vernikov",
  49: "Kamillah Hanks",
  50: "David Carr",
  51: "Frank Morano",
};

// Label pin coordinates extracted from the official NYC Council map widget
const LABEL_COORDS: Record<number, [number, number]> = {
  1:  [40.72072, -74.00047],
  2:  [40.73165, -73.98811],
  3:  [40.74934, -73.99910],
  4:  [40.75558, -73.97438],
  5:  [40.77099, -73.95370],
  6:  [40.77872, -73.97610],
  7:  [40.80419, -73.96477],
  8:  [40.79406, -73.93936],
  9:  [40.81173, -73.94485],
  10: [40.85433, -73.93284],
  11: [40.89327, -73.88855],
  12: [40.87900, -73.84186],
  13: [40.84862, -73.83156],
  14: [40.85849, -73.90915],
  15: [40.85148, -73.88546],
  16: [40.83511, -73.91945],
  17: [40.82368, -73.89679],
  18: [40.82550, -73.85902],
  19: [40.77690, -73.79894],
  20: [40.75454, -73.81920],
  21: [40.75090, -73.85799],
  22: [40.77040, -73.91361],
  23: [40.73789, -73.74092],
  24: [40.72462, -73.80821],
  25: [40.75610, -73.89061],
  26: [40.74257, -73.92426],
  27: [40.70146, -73.75809],
  28: [40.68116, -73.80409],
  29: [40.69730, -73.82950],
  30: [40.72020, -73.88855],
  31: [40.65069, -73.77354],
  32: [40.67543, -73.85044],
  33: [40.73009, -73.95103],
  34: [40.71031, -73.93524],
  35: [40.68793, -73.97026],
  36: [40.68585, -73.94142],
  37: [40.68376, -73.87688],
  38: [40.65356, -74.00185],
  39: [40.66970, -73.97713],
  40: [40.65720, -73.95378],
  41: [40.66606, -73.91739],
  42: [40.66189, -73.88100],
  43: [40.61200, -73.98880],
  44: [40.62125, -73.96820],
  45: [40.63558, -73.94005],
  46: [40.62333, -73.91602],
  47: [40.58789, -73.97987],
  48: [40.59362, -73.95447],
  49: [40.63037, -74.09523],
  50: [40.58736, -74.11205],
  51: [40.54824, -74.18346],
};

const GEOJSON_URL =
  "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_City_Council_Districts/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";

interface Props {
  searchLat?: number;
  searchLng?: number;
}

export default function NycDistrictMap({ searchLat, searchLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const geoLayerRef = useRef<GeoJSON | null>(null);
  const searchMarkerRef = useRef<Marker | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix default marker icon path in webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [40.7128, -74.006],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      mapRef.current = map;

      // Track highlighted layer
      let highlighted: Layer | null = null;

      const defaultStyle = {
        color: "#00008B",
        weight: 2,
        opacity: 0.35,
        fillColor: "#3057A6",
        fillOpacity: 0.06,
      };
      const hoverStyle = {
        color: "#1a56db",
        weight: 2.5,
        opacity: 0.8,
        fillColor: "#3b82f6",
        fillOpacity: 0.2,
      };

      fetch(GEOJSON_URL)
        .then((r) => r.json())
        .then((data) => {
          const geoLayer = L.geoJSON(data, {
            style: defaultStyle,
            onEachFeature(feature, layer) {
              const distNum: number = feature.properties.CounDist;
              const member = COUNCIL_MEMBERS[distNum] ?? "Unknown";

              layer.on("mouseover", () => {
                if (highlighted && highlighted !== layer) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (highlighted as any).setStyle(defaultStyle);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).setStyle(hoverStyle);
                highlighted = layer;
              });

              layer.on("mouseout", () => {
                // Keep highlight if this is the selected district
                // (we don't track selected per-layer here, rely on setSelectedDistrict)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).setStyle(defaultStyle);
                highlighted = null;
              });

              layer.on("click", () => {
                setSelectedDistrict(distNum);
                layer
                  .bindPopup(
                    `<div style="min-width:160px">
                      <div style="font-weight:700;font-size:14px;color:#1e3a5f">District ${distNum}</div>
                      <div style="font-size:13px;margin-top:4px;color:#374151">${member}</div>
                      <a href="https://council.nyc.gov/district-${distNum}/"
                         target="_blank" rel="noopener"
                         style="display:inline-block;margin-top:8px;font-size:12px;color:#3057A6;text-decoration:underline">
                        Council page →
                      </a>
                    </div>`,
                    { maxWidth: 220 }
                  )
                  .openPopup();
              });
            },
          }).addTo(map);

          geoLayerRef.current = geoLayer;

          // Add district number labels
          for (const [numStr, coords] of Object.entries(LABEL_COORDS)) {
            const num = Number(numStr);
            L.marker(coords, {
              icon: L.divIcon({
                className: "",
                html: `<div style="
                  font-size:10px;
                  font-weight:700;
                  color:#1e3a5f;
                  background:rgba(255,255,255,0.75);
                  border-radius:50%;
                  width:18px;height:18px;
                  display:flex;align-items:center;justify-content:center;
                  box-shadow:0 1px 3px rgba(0,0,0,0.18);
                  pointer-events:none;
                ">${num}</div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9],
              }),
              interactive: false,
            }).addTo(map);
          }
        })
        .catch(() => {
          // GeoJSON fetch failed silently — map still renders basemap
        });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Pan/zoom to search location and place marker
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      if (searchLat != null && searchLng != null) {
        const marker = L.marker([searchLat, searchLng], {
          icon: L.divIcon({
            className: "",
            html: `<div style="
              width:14px;height:14px;
              background:#e84855;
              border:2.5px solid #fff;
              border-radius:50%;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          }),
        }).addTo(mapRef.current);
        searchMarkerRef.current = marker;
        mapRef.current.setView([searchLat, searchLng], 14, { animate: true });
      }
    });
  }, [searchLat, searchLng]);

  return (
    <div className="relative rounded-[24px] overflow-hidden" style={{ height: 420 }}>
      {/* Inject Leaflet CSS */}
      <style>{`
        @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        .leaflet-container { font-family: inherit; border-radius: 24px; }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
        .leaflet-popup-tip { display: none; }
      `}</style>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {selectedDistrict && (
        <div
          className="absolute top-3 left-3 z-[1000] rounded-xl px-3 py-2 text-sm font-semibold"
          style={{
            background: "rgba(255,255,255,0.92)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            color: "#1e3a5f",
          }}
        >
          District {selectedDistrict} · {COUNCIL_MEMBERS[selectedDistrict]}
        </div>
      )}
    </div>
  );
}
