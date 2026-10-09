"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { addBoundaries, startPulse, baseStyle, findPlace, flyToBox, formatCoord, loadGeo, PAKISTAN_BBOX, setFocus } from "./geo";

type Props = {
  /** Where the camera lands. Leave out to land on the whole country. */
  target?: { kind: "district" | "province"; name: string };
  label: string;
  coord: [number, number];
};

export default function LocatorMap({ target, label, coord }: Props) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current) return;
    let map: maplibregl.Map | undefined;
    let cancelled = false;
    let ready = false;
    let seen = false;
    let fly = () => {};
    let inView = false;
    let stopPulse = () => {};

    // The map is only created once it is close to the viewport, to keep the page light.
    const init = () => {
      if (map || !el.current) return;
      let m: maplibregl.Map;
      try {
        m = new maplibregl.Map({
          container: el.current,
          style: baseStyle,
          center: [69.4, 30.4],
          zoom: 0.6,
          maxPitch: 70,
          attributionControl: false,
          cooperativeGestures: true,
        });
      } catch {
        return;
      }
      map = m;
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      m.once("style.load", async () => {
        const geo = await loadGeo();
        if (cancelled) return;
        addBoundaries(m, geo);
        stopPulse = startPulse(m, () => inView);
        const place = target && findPlace(target.kind === "district" ? geo.districts : geo.provinces, target.name);
        if (target?.kind === "district") setFocus(m, target.name);
        if (target?.kind === "province") setFocus(m, "", target.name);
        // Camera zooms in from the globe when the map scrolls into view.
        fly = () =>
          flyToBox(m, place ? place.bbox : PAKISTAN_BBOX, {
            padding: target?.kind === "district" ? 60 : 24,
            pitch: target?.kind === "district" ? 45 : 0,
            bearing: target?.kind === "district" ? -12 : 0,
            duration: 5000,
          });
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
      stopPulse();
      io.disconnect();
      near.disconnect();
      map?.remove();
    };
  }, [target?.kind, target?.name]);

  return (
    <figure className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <div className="relative aspect-[4/3] w-full bg-black">
        <div ref={el} className="h-full w-full" role="application" aria-label={`Interactive map locating ${label}`} />
        <p className="pointer-events-none absolute bottom-1 left-2 font-mono text-[9px] text-white/50">Esri, Maxar. geoBoundaries</p>
      </div>
      <figcaption className="flex justify-between gap-4 border-t border-line px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
        <span>{label}</span>
        <span>{formatCoord(coord[0], coord[1])}</span>
      </figcaption>
    </figure>
  );
}
