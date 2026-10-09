"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { addBoundaries, startPulse, baseStyle, findPlace, flyToBox, formatCoord, loadGeo, PAKISTAN_BBOX, prefersReducedMotion, setFocus, type BBox, type Place } from "./geo";

const FEATURED = ["Bahawalnagar", "Faisalabad", "Attock"];

// Floating layers over Pakistan, a visual cue for stacked analysis (not a legend).
const STACK = ["#4ade80", "#fbbf24", "#38bdf8"];
// Sections of the page, listed in the collapsible panel on the right of the hero.
const SECTIONS = [
  { name: "About", href: "#about" },
  { name: "Experience & education", href: "#background" },
  {
    name: "Work",
    href: "#work",
    children: [
      { name: "UAV-based plant growth tracking", href: "#uav" },
      { name: "Crop detection", href: "#crop-mapping" },
      { name: "Yield prediction", href: "#yield" },
      { name: "Flood mapping", href: "#flood" },
      { name: "Field-level advisories", href: "#advisory" },
    ],
  },
  { name: "Contact", href: "#contact" },
  { name: "CV", href: "/cv" },
];
const SLAB = { base: 50000, gap: 45000, thick: 4000 }; // metres above ground
const SLAB_OPACITY = 0.12;
const EDGE_OPACITY = 0.85;

export default function HeroMap() {
  const el = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLSpanElement>(null);
  const reset = useRef<() => void>(() => {});

  const [place, setPlace] = useState("Pakistan");
  const [failed, setFailed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

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
    let stackShown = false;
    let floatRaf = 0;
    const slabOpacity = () => (stackShown ? SLAB_OPACITY : 0);
    const edgeOpacity = () => (stackShown ? EDGE_OPACITY : 0);
    const paintStack = () => {
      if (!map.getLayer("slab-0")) return;
      STACK.forEach((_, i) => {
        map.setPaintProperty(`slab-${i}`, "fill-extrusion-opacity", slabOpacity());
        map.setPaintProperty(`edge-${i}`, "fill-extrusion-opacity", edgeOpacity());
      });
    };
    const showStack = (on: boolean) => {
      stackShown = on;
      paintStack();
    };
    const markers: maplibregl.Marker[] = [];

    const padding = () => {
      const { clientWidth: w, clientHeight: h } = el.current!;
      return w >= 900 ? { left: w * 0.34, right: 240, top: h * 0.34, bottom: 50 } : { left: 20, right: 20, top: h * 0.2, bottom: h * 0.5 };
    };
    const overview = (duration: number) => {
      setFocus(map, "");
      setPlace("Pakistan");
      showStack(true);
      // Tilted so the floating layers read as a stack above the country.
      flyToBox(map, PAKISTAN_BBOX, { padding: padding(), duration, pitch: 50, bearing: -8 });
    };
    const visit = (d: Place, bearing: number) => {
      setFocus(map, d.name);
      showStack(false);
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

      // Translucent copies of Pakistan floating at different heights, one per layer of analysis.
      const [shape, edge] = await Promise.all([
        fetch("/geo/country-shape.json").then((r) => r.json()),
        fetch("/geo/country-edge.json").then((r) => r.json()),
      ]);
      if (cancelled) return;
      map.addSource("stack", { type: "geojson", data: shape });
      map.addSource("stack-edge", { type: "geojson", data: edge });
      STACK.forEach((color, i) => {
        map.addLayer({
          id: `slab-${i}`,
          type: "fill-extrusion",
          source: "stack",
          paint: {
            "fill-extrusion-color": color,
            "fill-extrusion-base": SLAB.base + i * SLAB.gap,
            "fill-extrusion-height": SLAB.base + i * SLAB.gap + SLAB.thick,
            "fill-extrusion-opacity": 0,
            "fill-extrusion-opacity-transition": { duration: 900, delay: 0 },
            "fill-extrusion-vertical-gradient": false,
          },
        });
        // A brighter rim so each floating layer reads as its own plane.
        map.addLayer({
          id: `edge-${i}`,
          type: "fill-extrusion",
          source: "stack-edge",
          paint: {
            "fill-extrusion-color": color,
            "fill-extrusion-base": SLAB.base + i * SLAB.gap,
            "fill-extrusion-height": SLAB.base + i * SLAB.gap + SLAB.thick,
            "fill-extrusion-opacity": 0,
            "fill-extrusion-opacity-transition": { duration: 900, delay: 0 },
            "fill-extrusion-vertical-gradient": false,
          },
        });
      });
      // Gentle float: each layer drifts up and down on its own phase while the stack is shown.
      if (!reduced) {
        let last = 0;
        const float = (now: number) => {
          floatRaf = requestAnimationFrame(float);
          if (!stackShown || !visible || document.hidden || now - last < 40) return;
          last = now;
          const t = now / 1000;
          STACK.forEach((_, i) => {
            const b = SLAB.base + i * SLAB.gap + Math.sin(t * 0.8 + i * 0.9) * 4500;
            for (const id of [`slab-${i}`, `edge-${i}`]) {
              map.setPaintProperty(id, "fill-extrusion-base", b);
              map.setPaintProperty(id, "fill-extrusion-height", b + SLAB.thick);
            }
          });
        };
        floatRaf = requestAnimationFrame(float);
      }

      const stops = FEATURED.map((n) => findPlace(geo.districts, n)).filter(Boolean) as Place[];
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
      cancelAnimationFrame(floatRaf);
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
        <div className="hero-hud pointer-events-none absolute right-4 top-20 z-10 flex flex-col items-end gap-2 font-mono text-[11px] uppercase tracking-[0.08em] md:right-8">
          <p className="text-accent" aria-live="polite">{place}</p>
          <p className="text-white/70 max-md:hidden"><span ref={hud}>30.40°N 69.40°E  Z1.4</span></p>
          <button type="button" onClick={() => reset.current()} className="pointer-events-auto mt-1 rounded border border-line bg-bg/80 px-2 py-1 uppercase tracking-[0.08em] text-white/80 backdrop-blur hover:border-accent hover:text-accent">
            Reset view
          </button>
        </div>
      )}
      {!failed && (
        // Edge drawer: collapses to a slim tab against the right edge, like a side sheet.
        <nav
          aria-label="Page sections"
          className="hero-hud absolute right-0 top-1/2 z-10 flex items-stretch transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none max-md:hidden"
          style={{ transform: `translate(${panelOpen ? "0px" : "calc(100% - 34px)"}, -50%)` }}
        >
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            aria-controls="hero-sections"
            aria-label={panelOpen ? "Hide sections" : "Show sections"}
            className="group press glass flex w-[34px] shrink-0 flex-col items-center justify-center gap-2 rounded-l-xl border border-r-0 border-white/10 text-white/60 hover:text-white"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="transition-transform duration-300 group-hover:text-white" style={{ transform: panelOpen ? "rotate(0deg)" : "rotate(180deg)" }}>
              <path d="M3.5 2l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11px] font-medium tracking-[0.06em] text-white/70 transition-colors group-hover:text-white [writing-mode:vertical-rl]">Sections</span>
          </button>
          <div id="hero-sections" className="glass border border-white/10 py-2 pl-2 pr-6 transition-opacity duration-300" style={{ opacity: panelOpen ? 1 : 0 }} inert={!panelOpen}>
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.name}>
                  <a href={s.href} className="press block rounded-md px-2 py-1 text-[13px] text-white/90 hover:bg-white/[0.08] hover:text-white">
                    {s.name}
                  </a>
                  {s.children && (
                    <ul className="mb-1 ml-2 border-l border-white/10 pl-2">
                      {s.children.map((c) => (
                        <li key={c.name}>
                          <a href={c.href} className="press block rounded-md px-2 py-0.5 text-[12px] text-white/60 hover:bg-white/[0.08] hover:text-white">
                            {c.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
