import { setWorkerUrl, type Map as MLMap, type StyleSpecification } from "maplibre-gl";

if (typeof window !== "undefined") setWorkerUrl("/maplibre-gl-worker.mjs");

export type BBox = [number, number, number, number];
export type Place = { name: string; province?: string; cx?: number; cy?: number; bbox: BBox };
type FC = { type: "FeatureCollection"; features: { properties: Record<string, unknown> }[] };

export const ATTRIBUTION = "Imagery: Esri, Maxar, Earthstar Geographics";
export const PAKISTAN_BBOX: BBox = [60.9, 23.7, 77.84, 37.1];
export const PUNJAB_BBOX: BBox = [69.26, 27.7, 75.37, 34.02];
export const ACCENT = "#b9f36b";

// WebGL satellite basemap on a globe. If tiles cannot load, boundaries still draw on a flat sphere.
export const baseStyle: StyleSpecification = {
  version: 8,
  projection: { type: "globe" },
  sources: {
    imagery: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 17,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#161b1c" } },
    {
      id: "imagery",
      type: "raster",
      source: "imagery",
      paint: { "raster-saturation": -0.35, "raster-brightness-max": 0.72, "raster-contrast": 0.15 },
    },
  ],
};

let cache: Promise<{ provinces: FC; districts: FC; country: object }> | null = null;

export function loadGeo() {
  if (!cache) {
    cache = Promise.all([
      fetch("/geo/provinces.json").then((r) => r.json()),
      fetch("/geo/districts.json").then((r) => r.json()),
      fetch("/geo/country.json").then((r) => r.json()),
    ]).then(([provinces, districts, country]) => ({ provinces, districts, country }));
  }
  return cache;
}

export function findPlace(fc: FC, name: string): Place | undefined {
  return fc.features.find((f) => f.properties.name === name)?.properties as Place | undefined;
}

/** Adds every province and district of Pakistan, plus hover and focus layers. */
export function addBoundaries(map: MLMap, geo: { provinces: FC; districts: FC; country: object }) {
  map.addSource("provinces", { type: "geojson", data: geo.provinces as never });
  map.addSource("districts", { type: "geojson", data: geo.districts as never, generateId: true });
  map.addSource("country", { type: "geojson", data: geo.country as never });
  map.addLayer({
    id: "district-pulse",
    type: "fill",
    source: "districts",
    paint: { "fill-color": ACCENT, "fill-opacity": 0.05 },
  });
  map.addLayer({
    id: "district-fill",
    type: "fill",
    source: "districts",
    paint: {
      "fill-color": ACCENT,
      "fill-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.22, 0],
    },
  });
  map.addLayer({
    id: "district-lines",
    type: "line",
    source: "districts",
    paint: { "line-color": "#ffffff", "line-opacity": 0.28, "line-width": 0.5 },
  });
  map.addLayer({
    id: "province-lines",
    type: "line",
    source: "provinces",
    paint: { "line-color": "#ffffff", "line-opacity": 0.75, "line-width": 1.1 },
  });
  // The national border, drawn heavier so Pakistan reads first.
  map.addLayer({
    id: "country-line",
    type: "line",
    source: "country",
    layout: { "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-opacity": 0.95, "line-width": ["interpolate", ["linear"], ["zoom"], 3, 2, 7, 2.8] },
  });
  map.addLayer({
    id: "focus-province",
    type: "line",
    source: "provinces",
    filter: ["==", ["get", "name"], ""],
    paint: { "line-color": ACCENT, "line-width": 1.8 },
  });
  map.addLayer({
    id: "focus-fill",
    type: "fill",
    source: "districts",
    filter: ["==", ["get", "name"], ""],
    paint: { "fill-color": ACCENT, "fill-opacity": 0.16 },
  });
  map.addLayer({
    id: "focus-line",
    type: "line",
    source: "districts",
    filter: ["==", ["get", "name"], ""],
    paint: { "line-color": ACCENT, "line-width": 1.8 },
  });
}

export function setFocus(map: MLMap, district: string, province = "") {
  map.setFilter("focus-fill", ["==", ["get", "name"], district]);
  map.setFilter("focus-line", ["==", ["get", "name"], district]);
  map.setFilter("focus-province", ["==", ["get", "name"], province]);
}

/** Camera move with zoom, tilt and rotation. */
export function flyToBox(
  map: MLMap,
  bbox: BBox,
  opts: { padding?: number | { top: number; bottom: number; left: number; right: number }; pitch?: number; bearing?: number; duration?: number; maxZoom?: number } = {},
) {
  const { padding = 40, pitch = 0, bearing = 0, duration = 4000, maxZoom = 9 } = opts;
  const cam = map.cameraForBounds(bbox, { padding, maxZoom });
  if (!cam) return;
  // A tilted camera sees further towards the horizon, so pull back a little to keep the whole area in view.
  if (pitch > 0 && cam.zoom !== undefined) cam.zoom -= pitch / 120;
  if (prefersReducedMotion() || duration === 0) map.jumpTo({ ...cam, pitch, bearing });
  else map.flyTo({ ...cam, pitch, bearing, duration, curve: 1.5, essential: true });
}

export function formatCoord(lng: number, lat: number) {
  return `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E`;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Districts fade between low and high opacity, each on its own phase and speed,
 * so the country reads as filled and alive. Static under reduced motion.
 */
export function startPulse(map: MLMap, isVisible: () => boolean) {
  if (prefersReducedMotion()) return () => {};
  let raf = 0;
  let last = 0;
  const t0 = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - last < 50 || !isVisible() || document.hidden) return;
    last = now;
    const t = (now - t0) / 1000;
    const wave = ["sin", ["+", ["*", t * 1.4, ["get", "speed"]], ["*", ["get", "seed"], 6.283]]];
    const level = ["^", ["/", ["+", wave, 1], 2], 2];
    map.setPaintProperty("district-pulse", "fill-opacity", ["+", 0.015, ["*", 0.13, level]] as never);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
