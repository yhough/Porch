"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ITHACA_WARDS } from "@/lib/mockData";

// ─── GeoJSON types ─────────────────────────────────────────────────────────────
type Geometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};
type Feature = {
  id: number;
  geometry: Geometry;
  properties: {
    ward: number; district: number; distName: string;
    pollSite: string; legDist: string; asmDist: number;
  };
};

// ─── Projection ─────────────────────────────────────────────────────────────────
const BBOX: [number, number, number, number] = [-76.527, 42.4182, -76.4700, 42.4670];
const W = 400;
const H = 330;

function project(lon: number, lat: number): [number, number] {
  const [minLon, minLat, maxLon, maxLat] = BBOX;
  return [
    ((lon - minLon) / (maxLon - minLon)) * W,
    ((maxLat - lat) / (maxLat - minLat)) * H,
  ];
}

function geomToPath(geom: Geometry): string {
  const rings: number[][][] =
    geom.type === "Polygon"
      ? (geom.coordinates as number[][][])
      : (geom.coordinates as number[][][][]).flat(1);
  return rings.map((ring) =>
    ring.map((coord, i) => {
      const [x, y] = project(coord[0], coord[1]);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ") + "Z"
  ).join(" ");
}

function wardCentroid(features: Feature[]): [number, number] {
  const pts: [number, number][] = [];
  for (const f of features) {
    const rings: number[][][] =
      f.geometry.type === "Polygon"
        ? (f.geometry.coordinates as number[][][])
        : (f.geometry.coordinates as number[][][][]).flat(1);
    for (const ring of rings) for (const c of ring) pts.push(project(c[0], c[1]));
  }
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

// ─── Resource types ─────────────────────────────────────────────────────────────
type ResourceCategory = "shelters" | "food" | "animals" | "childcare" | "clinics" | "faith";

interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  lat: number;
  lng: number;
  address: string;
  hoursToday?: string;
  isOpenNow?: boolean | null;
  phone?: string | null;
  languages?: string[];
  capacity?: string | null;
}

const RESOURCE_CATS: { id: ResourceCategory; label: string; icon: string; color: string }[] = [
  { id: "shelters",  label: "Shelters",    icon: "🏠", color: "#EF4444" },
  { id: "food",      label: "Food Banks",  icon: "🍎", color: "#F97316" },
  { id: "animals",   label: "Animal Care", icon: "🐾", color: "#EAB308" },
  { id: "childcare", label: "Childcare",   icon: "🧒", color: "#3B82F6" },
  { id: "clinics",   label: "Health",      icon: "🏥", color: "#22C55E" },
  { id: "faith",     label: "Community",   icon: "⛪", color: "#8B5CF6" },
];

// ─── Overlay definitions ─────────────────────────────────────────────────────────
// "District Boundaries" is always visible (the ward fill).
// Add more overlay types here as the app grows.
type OverlayId = "resources";

const OVERLAYS: { id: OverlayId; label: string; icon: string; activeColor: string }[] = [
  { id: "resources", label: "Community Resources", icon: "📍", activeColor: "#5A8060" },
];

// ─── Resource pin (SVG) ───────────────────────────────────────────────────────────
function ResourcePin({
  resource, color, isHovered, isSelected, onClick, onHover, onLeave,
}: {
  resource: Resource; color: string;
  isHovered: boolean; isSelected: boolean;
  onClick: () => void; onHover: () => void; onLeave: () => void;
}) {
  const [x, y] = project(resource.lng, resource.lat);
  // Skip pins outside visible bounding box
  if (x < 0 || x > W || y < 0 || y > H) return null;

  const r = isHovered || isSelected ? 10 : 8;
  return (
    <g
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      {/* Touch target */}
      <circle cx={x} cy={y} r={16} fill="transparent" />
      {/* Pin shadow */}
      <circle cx={x} cy={y + 1} r={r} fill="rgba(0,0,0,0.18)" />
      {/* Pin body */}
      <circle
        cx={x} cy={y} r={r}
        fill={isSelected ? color : isHovered ? color + "EE" : color + "CC"}
        stroke="white"
        strokeWidth={isSelected || isHovered ? 2 : 1.5}
      />
      {/* Icon */}
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
        fontSize={isHovered || isSelected ? "10" : "9"}
        style={{ pointerEvents: "none", userSelect: "none" }}>
        {RESOURCE_CATS.find(c => c.id === resource.category)?.icon ?? "📍"}
      </text>
    </g>
  );
}

// ─── Resource popup (shown in info panel) ────────────────────────────────────────
function ResourcePopup({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const cat = RESOURCE_CATS.find(c => c.id === resource.category);
  const openColor =
    resource.isOpenNow === true  ? "#22C55E" :
    resource.isOpenNow === false ? "#EF4444" : "#9CA3AF";
  const openLabel =
    resource.isOpenNow === true  ? "Open now" :
    resource.isOpenNow === false ? "Closed now" : "Hours vary";

  return (
    <motion.div
      key={resource.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
            style={{ backgroundColor: (cat?.color ?? "#6B7280") + "18" }}>
            {cat?.icon}
          </div>
          <div>
            <div className="text-sm font-extrabold leading-tight" style={{ color: "#1B2A4A" }}>
              {resource.name}
            </div>
            <div className="text-xs" style={{ color: "#9CA3AF" }}>
              {resource.address}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-2"
          style={{ backgroundColor: "#F3F4F6" }}>
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {/* Open status */}
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: openColor + "18", color: openColor }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: openColor }} />
          {openLabel}
        </span>

        {/* Category */}
        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: (cat?.color ?? "#6B7280") + "18", color: cat?.color ?? "#6B7280" }}>
          {cat?.label}
        </span>

        {/* Languages */}
        {resource.languages && resource.languages.length > 0 && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
            🗣 {resource.languages.join(", ")}
          </span>
        )}
      </div>

      {/* Hours + capacity row */}
      <div className="mt-2.5 space-y-1">
        {resource.hoursToday && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#4B5563" }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#9CA3AF" strokeWidth="1.2" />
              <path d="M6 3v3l2 1.5" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {resource.hoursToday}
          </div>
        )}
        {resource.capacity && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#4B5563" }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M4 5a2 2 0 100-4 2 2 0 000 4zM8 5a2 2 0 100-4 2 2 0 000 4zM1 11c0-2.2 1.3-4 3-4M7 11c0-2.2 1.7-4 4-4" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Capacity: {resource.capacity}
          </div>
        )}
        {resource.phone && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#4B5563" }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 2h2.5l1 2.5-1.5 1a6 6 0 003.5 3.5l1-1.5L11 8.5V11a1 1 0 01-1 1A9 9 0 011 3a1 1 0 011-1z" stroke="#9CA3AF" strokeWidth="1.2" />
            </svg>
            <a href={`tel:${resource.phone}`} style={{ color: "#3B82F6" }}>{resource.phone}</a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

// ─── Main WardMap component ───────────────────────────────────────────────────────
export default function WardMap() {
  const [features,      setFeatures]      = useState<Feature[] | null>(null);
  const [hovered,       setHovered]       = useState<number | null>(null);
  const [selected,      setSelected]      = useState<number | null>(null);

  // Pan / zoom
  const svgRef   = useRef<SVGSVGElement>(null);
  const [zoom,   setZoom]   = useState(1);
  const [pan,    setPan]    = useState({ x: 0, y: 0 });
  const dragRef  = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number; x: number; y: number } | null>(null);

  // Overlay state
  const [activeOverlays,   setActiveOverlays]   = useState<Set<OverlayId>>(new Set());
  const [activeCats,       setActiveCats]       = useState<Set<ResourceCategory>>(
    new Set(RESOURCE_CATS.map(c => c.id))
  );
  const [resources,        setResources]        = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [hoveredPin,       setHoveredPin]       = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Load GeoJSON
  useEffect(() => {
    fetch("/ithaca-election-districts.geojson")
      .then(r => r.json())
      .then(d => setFeatures(d.features as Feature[]))
      .catch(() => setFeatures([]));
  }, []);

  // Load resources when overlay first toggled on
  useEffect(() => {
    if (activeOverlays.has("resources") && resources.length === 0 && !resourcesLoading) {
      setResourcesLoading(true);
      fetch("/api/resources")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.resources) setResources(d.resources); })
        .catch(() => {})
        .finally(() => setResourcesLoading(false));
    }
  }, [activeOverlays, resources.length, resourcesLoading]);

  function toggleOverlay(id: OverlayId) {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setSelectedResource(null); }
      else next.add(id);
      return next;
    });
  }

  function toggleCat(id: ResourceCategory) {
    setActiveCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Zoom helpers ────────────────────────────────────────────────────────────
  const clampPan = useCallback((px: number, py: number, z: number) => {
    const maxPx = (W * z - W) / 2 + W * 0.1;
    const maxPy = (H * z - H) / 2 + H * 0.1;
    return { x: Math.max(-maxPx, Math.min(maxPx, px)), y: Math.max(-maxPy, Math.min(maxPy, py)) };
  }, []);

  const zoomAt = useCallback((svgX: number, svgY: number, factor: number) => {
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * factor));
      setPan(p => {
        const nx = svgX - (svgX - p.x) * (next / prev);
        const ny = svgY - (svgY - p.y) * (next / prev);
        return clampPan(nx, ny, next);
      });
      return next;
    });
  }, [clampPan]);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // SVG client → viewBox coords
  const clientToSvg = (clientX: number, clientY: number) => {
    const el = svgRef.current;
    if (!el) return { x: W / 2, y: H / 2 };
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width)  * W,
      y: ((clientY - rect.top)  / rect.height) * H,
    };
  };

  // Mouse wheel zoom
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const { x, y } = clientToSvg(e.clientX, e.clientY);
    zoomAt(x, y, e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  // Mouse drag pan
  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / (svgRef.current?.getBoundingClientRect().width  ?? 1) * W;
    const dy = (e.clientY - dragRef.current.startY) / (svgRef.current?.getBoundingClientRect().height ?? 1) * H;
    setPan(clampPan(dragRef.current.panX + dx, dragRef.current.panY + dy, zoom));
  };
  const onMouseUp = () => { dragRef.current = null; };

  // Touch: pinch zoom + drag
  const onTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom, ...clientToSvg(midX, midY) };
      dragRef.current = null;
    } else if (e.touches.length === 1) {
      dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  };
  const onTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / pinchRef.current.dist;
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchRef.current.zoom * factor));
      setZoom(next);
      setPan(p => {
        const nx = pinchRef.current!.x - (pinchRef.current!.x - p.x) * (next / zoom);
        const ny = pinchRef.current!.y - (pinchRef.current!.y - p.y) * (next / zoom);
        return clampPan(nx, ny, next);
      });
    } else if (e.touches.length === 1 && dragRef.current) {
      const dx = (e.touches[0].clientX - dragRef.current.startX) / (svgRef.current?.getBoundingClientRect().width  ?? 1) * W;
      const dy = (e.touches[0].clientY - dragRef.current.startY) / (svgRef.current?.getBoundingClientRect().height ?? 1) * H;
      setPan(clampPan(dragRef.current.panX + dx, dragRef.current.panY + dy, zoom));
    }
  };
  const onTouchEnd = () => { dragRef.current = null; pinchRef.current = null; };

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
  const wardInfo   = ITHACA_WARDS.find(w => w.ward === activeWard);

  const visibleResources = resources.filter(r => activeCats.has(r.category));
  const resourcesOverlayOn = activeOverlays.has("resources");

  return (
    <div className="rounded-[24px] overflow-hidden" style={{ backgroundColor: "#EDF5FB" }}>

      {/* ── Overlay toggle bar ──────────────────────────────────────────── */}
      <div className="px-4 pt-3.5 pb-2.5 flex items-center gap-2 flex-wrap border-b"
        style={{ borderColor: "rgba(0,0,0,0.06)", backgroundColor: "white" }}>
        <span className="text-[10px] font-extrabold uppercase tracking-wider mr-1"
          style={{ color: "#9CA3AF" }}>
          Layers
        </span>

        {/* District Boundaries — always-on indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: "#1C253408", color: "#1C2534" }}>
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: "#1C2534", opacity: 0.5 }} />
          District Boundaries
        </div>

        {/* Togglable overlays */}
        {OVERLAYS.map(o => {
          const isOn = activeOverlays.has(o.id);
          return (
            <button
              key={o.id}
              onClick={() => toggleOverlay(o.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                backgroundColor: isOn ? o.activeColor + "18" : "#F3F4F6",
                color: isOn ? o.activeColor : "#6B7280",
                border: `1.5px solid ${isOn ? o.activeColor + "44" : "transparent"}`,
              }}>
              {o.icon} {o.label}
              {isOn && resourcesLoading && (
                <span className="inline-block w-3 h-3 rounded-full border-2 animate-spin ml-1"
                  style={{ borderColor: o.activeColor + "44", borderTopColor: o.activeColor }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Category filter row (resources overlay only) ─────────────────── */}
      <AnimatePresence>
        {resourcesOverlayOn && (
          <motion.div
            key="cat-filters"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}>
            <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar border-b"
              style={{ borderColor: "rgba(0,0,0,0.05)", backgroundColor: "#FAFAFA" }}>
              {RESOURCE_CATS.map(cat => {
                const isOn = activeCats.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCat(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all"
                    style={{
                      backgroundColor: isOn ? cat.color + "16" : "#F3F4F6",
                      color: isOn ? cat.color : "#9CA3AF",
                      border: `1.5px solid ${isOn ? cat.color + "44" : "transparent"}`,
                    }}>
                    {cat.icon} {cat.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Map SVG ───────────────────────────────────────────────────────── */}
      <div className="relative">
        {!features ? (
          <div className="animate-pulse"
            style={{ height: "300px", backgroundColor: "#E5EFF8", borderRadius: "0" }} />
        ) : (
          <>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full block"
            style={{ maxHeight: "340px", cursor: dragRef.current ? "grabbing" : zoom > 1 ? "grab" : "default", touchAction: "none" }}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Water/background — outside transform so it always fills */}
            <rect width={W} height={H} fill="#D6EAF8" />

            {/* All zoomable content */}
            <g transform={`translate(${pan.x + W / 2},${pan.y + H / 2}) scale(${zoom}) translate(${-W / 2},${-H / 2})`}>
              {/* Ward polygons */}
              {Object.entries(byWard).map(([wardStr, feats]) => {
                const ward    = parseInt(wardStr);
                const info    = ITHACA_WARDS.find(w => w.ward === ward);
                const color   = info?.color ?? "#9CA3AF";
                const isActive = activeWard === ward;
                return (
                  <g key={ward}
                    onMouseEnter={() => setHovered(ward)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => { setSelected(selected === ward ? null : ward); setSelectedResource(null); }}
                    style={{ cursor: "pointer" }}>
                    {feats.map((feat, i) => (
                      <motion.path key={i} d={geomToPath(feat.geometry)}
                        fill={color}
                        fillOpacity={isActive ? 0.88 : 0.52}
                        stroke="white"
                        strokeWidth={isActive ? 2.5 / zoom : 1.5 / zoom}
                        animate={{ fillOpacity: isActive ? 0.88 : 0.52 }}
                        transition={{ duration: 0.18 }} />
                    ))}
                  </g>
                );
              })}

              {/* Ward number labels */}
              {Object.entries(byWard).map(([wardStr, feats]) => {
                const ward    = parseInt(wardStr);
                const [cx, cy] = wardCentroid(feats);
                const isActive = activeWard === ward;
                const r = (isActive ? 14 : 12) / zoom;
                return (
                  <g key={`label-${ward}`} style={{ pointerEvents: "none" }}>
                    <circle cx={cx} cy={cy} r={r} fill="white" opacity="0.92" />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                      fontSize={`${(isActive ? 13 : 11) / zoom}`} fontWeight="800"
                      fontFamily="Plus Jakarta Sans, system-ui"
                      fill={ITHACA_WARDS.find(w => w.ward === ward)?.color ?? "#1B2A4A"}>
                      {ward}
                    </text>
                  </g>
                );
              })}

              {/* Resource pins */}
              {resourcesOverlayOn && !resourcesLoading && visibleResources.map(r => {
                const cat = RESOURCE_CATS.find(c => c.id === r.category);
                return (
                  <ResourcePin
                    key={r.id}
                    resource={r}
                    color={cat?.color ?? "#6B7280"}
                    isHovered={hoveredPin === r.id}
                    isSelected={selectedResource?.id === r.id}
                    onClick={() => { setSelectedResource(prev => prev?.id === r.id ? null : r); setSelected(null); }}
                    onHover={() => setHoveredPin(r.id)}
                    onLeave={() => setHoveredPin(null)}
                  />
                );
              })}
            </g>

            {/* Loading shimmer overlay — outside transform */}
            {resourcesOverlayOn && resourcesLoading && (
              <rect width={W} height={H} fill="rgba(255,255,255,0.35)" />
            )}
          </svg>

          {/* ── Zoom controls ── */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-1">
            <button
              onClick={() => zoomAt(W / 2, H / 2, 1.4)}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base shadow-md transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: "white", color: "#1B2A4A", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              aria-label="Zoom in">
              +
            </button>
            <button
              onClick={() => zoomAt(W / 2, H / 2, 1 / 1.4)}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-base shadow-md transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: "white", color: "#1B2A4A", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
              aria-label="Zoom out">
              −
            </button>
            {zoom > 1.05 && (
              <button
                onClick={resetView}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-md transition-all hover:scale-110 active:scale-95"
                style={{ backgroundColor: "#1B2A4A", color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                aria-label="Reset view">
                ⊡
              </button>
            )}
          </div>
          </>
        )}
      </div>

      {/* ── Info panel ───────────────────────────────────────────────────── */}
      <div className="p-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <AnimatePresence mode="wait">
          {selectedResource ? (
            <ResourcePopup
              key={selectedResource.id}
              resource={selectedResource}
              onClose={() => setSelectedResource(null)}
            />
          ) : wardInfo ? (
            <motion.div
              key={wardInfo.ward}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                  style={{ backgroundColor: wardInfo.color }}>
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
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: wardInfo.color + "20", color: wardInfo.color }}>
                  Legislative Dist. {wardInfo.legDist}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#F3F4F6", color: "#374151" }}>
                  NY Assembly 125 — Anna Kelles
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>
              {resourcesOverlayOn && visibleResources.length > 0 ? (
                <p className="text-xs font-medium mb-2.5" style={{ color: "#6B7280" }}>
                  {visibleResources.length} resources shown — tap a pin for details
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {ITHACA_WARDS.map(w => (
                  <button key={w.ward}
                    onClick={() => setSelected(w.ward)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform hover:scale-105"
                    style={{ backgroundColor: w.color + "18", color: w.color }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                    Ward {w.ward}
                  </button>
                ))}
                <span className="text-xs self-center font-medium" style={{ color: "#9CA3AF" }}>
                  Tap a ward to explore
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
