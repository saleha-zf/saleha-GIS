"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { ACCENT, addBoundaries, startPulse, baseStyle, findPlace, flyToBox, formatCoord, loadGeo, PAKISTAN_BBOX, PUNJAB_BBOX, prefersReducedMotion, setFocus } from "./geo";

type Legend = { name: string; color: string; share: number }[];
type Ramp = { min: number; max: number; unit: string; colors: string[]; mean?: number; note?: string };
type LayerMeta = { corners: [number, number][]; image?: string; legend?: Legend; ramp?: Omit<Ramp, "mean" | "note">; mean?: number; note?: string; outline?: object };

// Example monitored fields for the advisory map: [lon, lat, condition 0 (stressed) to 1 (healthy)].
// Illustrative plots placed across Punjab's farm belt, drawn larger than real fields so they read at this zoom.
const FIELDS: [number, number, number][] = [
  [72.35, 33.5, 0.2],
  [72.7, 32.08, 0.62],
  [73.08, 31.42, 0.88],
  [74.12, 31.22, 0.72],
  [71.55, 30.2, 0.94],
  [72.98, 29.95, 0.38],
];
const FIELD_COLORS = ["#d7191c", "#fdae61", "#ffffbf", "#a6d96a", "#1a9641"];

function fieldShapes() {
  return {
    type: "FeatureCollection",
    features: FIELDS.map(([x, y, c], i) => {
      // An irregular four-sided plot, rotated a little differently each time.
      const a = (i * 37 + 12) * (Math.PI / 180);
      // Irregular five-sided plot outlines, like field boundaries seen from above.
      const pts = [
        [-0.17, -0.09],
        [0.05, -0.13],
        [0.18, -0.06],
        [0.14, 0.1],
        [-0.12, 0.12],
      ].map(([dx, dy]) => [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]);
      return { type: "Feature", properties: { c }, geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] } };
    }),
  };
}

type Props = {
  /** Where the camera lands. Leave out to land on the whole country. */
  target?: { kind: "district" | "province"; name: string };
  label: string;
  coord: [number, number];
  /**
   * Base path of a raster layer built from a COG with data/build_layer.py, for example "/layers/jhang-kharif".
   * Loads <path>.json (corners, image name, and a class legend or colour ramp). Leave out for a plain map.
   */
  layer?: string;
  /** Where the zoom-in starts: the whole country, or Punjab for district-level work. */
  from?: "pakistan" | "punjab";
  /** Show example monitored fields, coloured by condition (advisory project). */
  fields?: boolean;
};

export default function LocatorMap({ target, label, coord, layer, from = "pakistan", fields = false }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [legend, setLegend] = useState<Legend>([]);
  const [ramp, setRamp] = useState<Ramp | null>(null);

  useEffect(() => {
    if (!el.current) return;
    let map: maplibregl.Map | undefined;
    let cancelled = false;
    let ready = false;
    let seen = false;
    let inView = false;
    let touched = false;
    let spin = 0;
    let fly = () => {};
    let stopPulse = () => {};

    // Slow turntable rotation once the camera has landed, until the visitor takes over.
    const startSpin = (m: maplibregl.Map) => {
      if (prefersReducedMotion()) return;
      let last = performance.now();
      const step = (now: number) => {
        spin = requestAnimationFrame(step);
        const dt = now - last;
        last = now;
        if (touched || !inView || document.hidden || m.isMoving()) return;
        m.setBearing(m.getBearing() + dt * 0.004);
      };
      spin = requestAnimationFrame(step);
    };

    // The map is only created once it is close to the viewport, to keep the page light.
    const init = () => {
      if (map || !el.current) return;
      let m: maplibregl.Map;
      try {
        m = new maplibregl.Map({
          container: el.current,
          style: baseStyle,
          bounds: from === "punjab" ? PUNJAB_BBOX : PAKISTAN_BBOX,
          fitBoundsOptions: { padding: 12 },
          maxPitch: 70,
          attributionControl: false,
          cooperativeGestures: true,
        });
      } catch {
        return;
      }
      map = m;
      m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
      for (const ev of ["mousedown", "touchstart", "wheel"] as const)
        m.getCanvas().addEventListener(ev, () => (touched = true), { passive: true });

      m.once("style.load", async () => {
        const geo = await loadGeo();
        if (cancelled) return;
        addBoundaries(m, geo);
        stopPulse = startPulse(m, () => inView);

        if (layer) {
          try {
            const meta = (await fetch(`${layer}.json`).then((r) => r.json())) as LayerMeta;
            if (cancelled) return;
            const dir = layer.slice(0, layer.lastIndexOf("/") + 1);
            m.addSource("layer", { type: "image", url: meta.image ? dir + meta.image : `${layer}.png`, coordinates: meta.corners as never });
            m.addLayer(
              { id: "layer", type: "raster", source: "layer", paint: { "raster-opacity": 0.95, "raster-resampling": "nearest", "raster-fade-duration": 0 } },
              "district-lines",
            );
            m.setPaintProperty("focus-fill", "fill-opacity", 0); // keep the outline, don't tint the data
            if (meta.outline) {
              // The data's own boundary, where it differs from the open boundary dataset.
              m.addSource("layer-outline", { type: "geojson", data: meta.outline as never });
              m.addLayer({ id: "layer-outline", type: "line", source: "layer-outline", paint: { "line-color": ACCENT, "line-width": 1.8 } });
              m.setPaintProperty("focus-line", "line-opacity", 0);
            }
            if (meta.legend) setLegend(meta.legend.filter((c) => c.share >= 0.005).slice(0, 6));
            if (meta.ramp) setRamp({ ...meta.ramp, mean: meta.mean, note: meta.note });
          } catch {
            /* a missing layer leaves the plain map */
          }
        }

        if (fields) {
          m.addSource("fields", { type: "geojson", data: fieldShapes() as never });
          const color = ["interpolate", ["linear"], ["get", "c"], ...FIELD_COLORS.flatMap((col, k) => [k / (FIELD_COLORS.length - 1), col])] as never;
          m.addLayer({ id: "fields-fill", type: "fill", source: "fields", paint: { "fill-color": color, "fill-opacity": 0.22 } });
          m.addLayer({
            id: "fields",
            type: "line",
            source: "fields",
            layout: { "line-join": "round" },
            paint: { "line-color": color, "line-width": 2.2 },
          });
        }

        const place = target && findPlace(target.kind === "district" ? geo.districts : geo.provinces, target.name);
        if (target?.kind === "district") setFocus(m, target.name);
        if (target?.kind === "province") setFocus(m, "", target.name);
        // Camera zooms in from the globe and tilts into 3D when the map scrolls into view.
        const district = target?.kind === "district";
        const tilt = district || fields;
        fly = () => {
          flyToBox(m, place ? place.bbox : PAKISTAN_BBOX, {
            padding: district ? 30 : 24,
            pitch: tilt ? (fields ? 50 : 55) : 0,
            bearing: tilt ? -20 : 0,
            duration: 5000,
          });
          if (tilt) m.once("moveend", () => startSpin(m));
        };
        ready = true;
        if (seen) fly();
      });
    };

    const near = new IntersectionObserver(([e]) => e.isIntersecting && init(), { rootMargin: "600px" });
    near.observe(el.current);
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        if (!e.isIntersecting || seen) return;
        seen = true;
        if (ready) fly();
      },
      { threshold: 0.5 },
    );
    io.observe(el.current);

    return () => {
      cancelled = true;
      cancelAnimationFrame(spin);
      stopPulse();
      io.disconnect();
      near.disconnect();
      map?.remove();
    };
  }, [target?.kind, target?.name, layer, from, fields]);

  return (
    <figure className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="relative aspect-[4/3] w-full bg-black">
        <div ref={el} className="h-full w-full" role="application" aria-label={`Interactive 3D map of ${label}. Drag to pan; use the compass button to rotate and tilt.`} />
        <p className="pointer-events-none absolute bottom-1 left-2 font-mono text-[9px] text-white/50">Esri, Maxar</p>
      </div>
      {ramp && (
        <div className="border-t border-line px-3 py-2.5" aria-label={`Colour scale from ${ramp.min} to ${ramp.max} ${ramp.unit}`}>
          <div className="h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${ramp.colors.join(", ")})` }} />
          <div className="mt-1.5 flex justify-between text-[11px] text-muted">
            <span>
              {ramp.min}
              {ramp.unit.startsWith("%") ? "%" : ` ${ramp.unit}`}
            </span>
            {ramp.mean !== undefined && <span className="text-white/45">district mean {ramp.mean}</span>}
            {ramp.mean === undefined && ramp.note && <span className="text-white/45">{ramp.unit.replace(/^%\s*/, "")}, {ramp.note}</span>}
            <span>{ramp.max}{ramp.unit.startsWith("%") ? "%" : ""}</span>
          </div>
        </div>
      )}
      {fields && (
        <div className="border-t border-line px-3 py-2.5" aria-label="Field condition scale from stressed to healthy">
          <div className="h-1.5 rounded-full" style={{ background: `linear-gradient(90deg, ${FIELD_COLORS.join(", ")})` }} />
          <div className="mt-1.5 flex justify-between text-[11px] text-muted">
            <span>Stressed</span>
            <span className="text-white/45">field condition, example plots</span>
            <span>Healthy</span>
          </div>
        </div>
      )}
      {legend.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line px-3 py-2.5" aria-label="Legend">
          {legend.map((c) => (
            <li key={c.name} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="size-2 rounded-[2px]" style={{ background: c.color }} aria-hidden="true" />
              {c.name}
              <span className="text-white/35">{Math.round(c.share * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
      <figcaption className="flex justify-between gap-4 border-t border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
        <span>{label}</span>
        <span>{formatCoord(coord[0], coord[1])}</span>
      </figcaption>
    </figure>
  );
}
