"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ITHACA_WARDS } from "@/lib/mockData";

type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};

type Feature = {
  id: number;
  geometry: Geometry;
  properties: {
    ward: number;
    district: number;
    distName: string;
    pollSite: string;
    legDist: string;
    asmDist: number;
  };
};

// City of Ithaca tight bounding box (from extracted GeoJSON)
const BBOX: [number, number, number, number] = [-76.527, 42.4182, -76.4700, 42.4670];
const W = 400;
const H = 330;

function project(lon: number, lat: number): [number, number] {
  const [minLon, minLat, maxLon, maxLat] = BBOX;
  const x = ((lon - minLon) / (maxLon - minLon)) * W;
  // Flip Y — SVG y=0 is top, but lat increases upward
  const y = ((maxLat - lat) / (maxLat - minLat)) * H;
  return [x, y];
}

function geomToPath(geom: Geometry): string {
  const rings: number[][][] =
    geom.type === "Polygon"
      ? (geom.coordinates as number[][][])
      : (geom.coordinates as number[][][][]).flat(1);

  return rings
    .map((ring) =>
      ring
        .map((coord, i) => {
          const [x, y] = project(coord[0], coord[1]);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ") + "Z"
    )
    .join(" ");
}

// Compute centroid of a ward's features for label placement
function wardCentroid(features: Feature[]): [number, number] {
  const allPoints: [number, number][] = [];
  for (const feat of features) {
    const rings: number[][][] =
      feat.geometry.type === "Polygon"
        ? (feat.geometry.coordinates as number[][][])
        : (feat.geometry.coordinates as number[][][][]).flat(1);
    for (const ring of rings) {
      for (const coord of ring) {
        allPoints.push(project(coord[0], coord[1]));
      }
    }
  }
  const cx = allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length;
  const cy = allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length;
  return [cx, cy];
}

export default function WardMap() {
  const [features, setFeatures] = useState<Feature[] | null>(null);
  const [hovered, setHovered]   = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch("/ithaca-election-districts.geojson")
      .then((r) => r.json())
      .then((d) => setFeatures(d.features as Feature[]))
      .catch(() => setFeatures([]));
  }, []);

  // Group features by ward
  const byWard: Record<number, Feature[]> = {};
  if (features) {
    for (const f of features) {
      const w = f.properties.ward;
      if (!byWard[w]) byWard[w] = [];
      byWard[w].push(f);
    }
  }

  const activeWard = selected ?? hovered;
  const wardInfo   = ITHACA_WARDS.find((w) => w.ward === activeWard);

  return (
    <div className="rounded-[24px] overflow-hidden" style={{ backgroundColor: "#EDF5FB" }}>
      {/* Map SVG */}
      <div className="relative">
        {!features ? (
          <div
            className="animate-pulse"
            style={{ height: "300px", backgroundColor: "#E5EFF8", borderRadius: "24px 24px 0 0" }}
          />
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full block"
            style={{ maxHeight: "340px" }}
          >
            {/* Water / background */}
            <rect width={W} height={H} fill="#D6EAF8" />

            {/* Ward polygons */}
            {Object.entries(byWard).map(([wardStr, feats]) => {
              const ward  = parseInt(wardStr);
              const info  = ITHACA_WARDS.find((w) => w.ward === ward);
              const color = info?.color ?? "#9CA3AF";
              const isActive = activeWard === ward;

              return (
                <g
                  key={ward}
                  onMouseEnter={() => setHovered(ward)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(selected === ward ? null : ward)}
                  style={{ cursor: "pointer" }}
                >
                  {feats.map((feat, i) => (
                    <motion.path
                      key={i}
                      d={geomToPath(feat.geometry)}
                      fill={color}
                      fillOpacity={isActive ? 0.88 : 0.52}
                      stroke="white"
                      strokeWidth={isActive ? 2.5 : 1.5}
                      animate={{ fillOpacity: isActive ? 0.88 : 0.52 }}
                      transition={{ duration: 0.18 }}
                    />
                  ))}
                </g>
              );
            })}

            {/* Ward number labels */}
            {Object.entries(byWard).map(([wardStr, feats]) => {
              const ward = parseInt(wardStr);
              const [cx, cy] = wardCentroid(feats);
              const isActive = activeWard === ward;
              return (
                <g key={`label-${ward}`} style={{ pointerEvents: "none" }}>
                  <circle cx={cx} cy={cy} r={isActive ? 14 : 12} fill="white" opacity="0.92" />
                  <text
                    x={cx} y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isActive ? "13" : "11"}
                    fontWeight="800"
                    fontFamily="Plus Jakarta Sans, system-ui"
                    fill={ITHACA_WARDS.find((w) => w.ward === ward)?.color ?? "#1B2A4A"}
                  >
                    {ward}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Info panel */}
      <div className="p-5 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        {wardInfo ? (
          <motion.div
            key={wardInfo.ward}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                style={{ backgroundColor: wardInfo.color }}
              >
                {wardInfo.ward}
              </div>
              <div>
                <div className="text-base font-extrabold" style={{ color: "#1B2A4A" }}>
                  {wardInfo.name}
                </div>
                <div className="text-sm" style={{ color: "#6B7280" }}>{wardInfo.description}</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: wardInfo.color + "20", color: wardInfo.color }}
              >
                Legislative Dist. {wardInfo.legDist}
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
              >
                NY Assembly 125 — Anna Kelles
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ITHACA_WARDS.map((w) => (
              <button
                key={w.ward}
                onClick={() => setSelected(w.ward)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform hover:scale-105"
                style={{ backgroundColor: w.color + "18", color: w.color }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: w.color }}
                />
                Ward {w.ward}
              </button>
            ))}
            <span className="text-xs self-center font-medium" style={{ color: "#9CA3AF" }}>
              Tap a ward to explore
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
