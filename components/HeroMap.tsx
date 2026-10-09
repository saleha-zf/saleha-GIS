"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { addBoundaries, ATTRIBUTION, startPulse, baseStyle, findPlace, flyToBox, formatCoord, loadGeo, PAKISTAN_BBOX, prefersReducedMotion, setFocus, type BBox, type Place } from "./geo";

const FEATURED = ["Bahawalnagar", "Faisalabad", "Attock"];

export default function HeroMap() {
  const el = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLSpanElement>(null);
  const reset = useRef<() => void>(() => {});
  const [place, setPlace] = useState("Pakistan");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    const reduced = prefersReducedMotion();
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: el.current,
        style: baseStyle,
        center: [69.4, 30.4],
        zoom: 1.4,
        maxPitch: 70,
        attributionControl: false,
        cooperativeGestures: true,
      });
    } catch {
      setFailed(true);
      return;
    }
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    let cancelled = false;
    let touring = !reduced;
    let visible = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let intro: ReturnType<typeof setTimeout> | undefined;
    let hovered: string | number | undefined;
    let stopPulse = () => {};
    const markers: maplibregl.Marker[] = [];

    const padding = () => {
      const { clientWidth: w, clientHeight: h } = el.current!;
      return w >= 900 ? { left: w * 0.46, right: 70, top: 110, bottom: 70 } : { left: 20, right: 20, top: 80, bottom: h * 0.5 };
    };
    const overview = (duration: number) => {
      setFocus(map, "");
      setPlace("Pakistan");
      flyToBox(map, PAKISTAN_BBOX, { padding: padding(), duration, pitch: 0 });
    };
    const visit = (d: Place, bearing: number) => {
      setFocus(map, d.name);
      setPlace(`${d.name}, ${d.province}`);
      flyToBox(map, d.bbox as BBox, { padding: padding(), pitch: 52, bearing, duration: 5500, maxZoom: 9.2 });
    };
    const stopTour = () => {
      touring = false;
      if (timer) clearInterval(timer);
    };

    map.on("move", () => {
      if (!hud.current) return;
      const c = map.getCenter();
      hud.current.textContent = `${formatCoord(c.lng, c.lat)}  Z${map.getZoom().toFixed(1)}`;
    });
    for (const ev of ["mousedown", "touchstart", "wheel"] as const) map.getCanvas().addEventListener(ev, stopTour, { passive: true });

    map.once("style.load", async () => {
      const geo = await loadGeo();
      if (cancelled) return;
      addBoundaries(map, geo);
      stopPulse = startPulse(map, () => visible);

      const stops = FEATURED.map((n) => findPlace(geo.districts, n)).filter(Boolean) as Place[];
      for (const d of stops) {
        const b = document.createElement("button");
        b.className = "pin";
        b.type = "button";
        b.setAttribute("aria-label", `Zoom to ${d.name}`);
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          stopTour();
          visit(d, 0);
        });
        markers.push(new maplibregl.Marker({ element: b, anchor: "center" }).setLngLat([d.cx!, d.cy!]).addTo(map));
      }

      map.on("mousemove", "district-fill", (e) => {
        const f = e.features?.[0];
        if (!f || f.id === hovered) return;
        if (hovered !== undefined) map.setFeatureState({ source: "districts", id: hovered }, { hover: false });
        hovered = f.id;
        map.setFeatureState({ source: "districts", id: hovered! }, { hover: true });
        map.getCanvas().style.cursor = "pointer";
        setPlace(`${f.properties.name}, ${f.properties.province}`);
      });
      map.on("mouseleave", "district-fill", () => {
        if (hovered !== undefined) map.setFeatureState({ source: "districts", id: hovered }, { hover: false });
        hovered = undefined;
        map.getCanvas().style.cursor = "";
      });
      map.on("click", "district-fill", (e) => {
        const name = e.features?.[0]?.properties.name as string | undefined;
        const d = name && findPlace(geo.districts, name);
        if (!d) return;
        stopTour();
        visit(d, 0);
      });

      reset.current = () => {
        stopTour();
        overview(2500);
      };

      // Opening move: from the globe down to Pakistan, then a tour of the featured districts.
      if (reduced) return overview(0);
      intro = setTimeout(() => overview(5000), 500);
      let i = -1;
      timer = setInterval(() => {
        if (!touring || !visible || document.hidden) return;
        i = (i + 1) % (stops.length + 1);
        if (i === stops.length) overview(5000);
        else visit(stops[i], i % 2 ? 18 : -18);
      }, 10000);
    });

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el.current);

    return () => {
      cancelled = true;
      stopPulse();
      if (timer) clearInterval(timer);
      if (intro) clearTimeout(intro);
      io.disconnect();
      markers.forEach((m) => m.remove());
      map.remove();
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-black">
      <div ref={el} className="h-full w-full" role="application" aria-label="Interactive satellite map of Pakistan. Drag to pan, use the buttons to zoom, select a district to fly to it." />
      {!failed && (
        <div className="pointer-events-none absolute right-4 top-20 z-10 flex flex-col items-end gap-2 font-mono text-[11px] uppercase tracking-[0.08em] md:right-8">
          <p className="text-accent" aria-live="polite">{place}</p>
          <p className="text-white/70 max-md:hidden"><span ref={hud}>30.40°N 69.40°E  Z1.4</span></p>
          <button type="button" onClick={() => reset.current()} className="pointer-events-auto mt-1 rounded border border-line bg-bg/80 px-2 py-1 uppercase tracking-[0.08em] text-white/80 backdrop-blur hover:border-accent hover:text-accent">
            Reset view
          </button>
        </div>
      )}
      <p className="pointer-events-none absolute bottom-1 left-2 z-10 font-mono text-[9px] text-white/60">{ATTRIBUTION}</p>
    </div>
  );
}
