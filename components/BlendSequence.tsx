"use client";

import { useEffect, useRef, useState } from "react";

type Frame = {
  id: string;
  w: number;
  h: number;
  label: string;
  alt: string;
  hold: number;
  group?: string;
  /** Entering this frame zooms the previous view in, so the change reads as diving deeper. */
  dive?: boolean;
  /** Where the outgoing view zooms towards when diving into the next frame. */
  origin?: string;
  /** "contain" for shots with a different shape, shown centred on the dashboard colour. */
  fit?: "cover" | "contain";
};
type Sequence = {
  dir: string;
  aspect: string;
  frames: Frame[];
  groups?: { value: string; text: string }[];
  /** Soften light-themed shots on the dark page. */
  dim?: boolean;
  /** Custom fade duration in ms */
  fadeMs?: number;
};

// Dashboard screenshots, aligned to the same frame so they blend in place.
export const SEQUENCES: Record<string, Sequence> = {
  crop: {
    dir: "/work/crop",
    aspect: "1907 / 974",
    groups: [
      { value: "province", text: "Punjab Province" },
      { value: "district", text: "Jhang District" },
    ],
    frames: [
      { id: "province-rabi", w: 1907, h: 974, group: "province", origin: "34% 58%", label: "Punjab, Rabi 2026", hold: 3800, alt: "Rabi 2026 crop map across Punjab, dominated by wheat" },
      { id: "province-kharif", w: 1907, h: 974, group: "province", origin: "34% 58%", label: "Punjab, Kharif 2026", hold: 3800, alt: "Kharif 2026 crop map across Punjab with crop distribution chart" },
      { id: "jhang-boundary", w: 1907, h: 974, group: "district", dive: true, origin: "40% 50%", label: "Jhang district", hold: 2600, alt: "Jhang district boundary on satellite imagery" },
      { id: "jhang-rabi", w: 1907, h: 974, group: "district", dive: true, label: "Jhang, Rabi 2026", hold: 3800, alt: "Field-level Rabi 2026 crop map of Jhang with crop areas in hectares" },
      { id: "jhang-kharif", w: 1907, h: 974, group: "district", label: "Jhang, Kharif 2026", hold: 3800, alt: "Field-level Kharif 2026 crop map of Jhang with crop areas in hectares" },
    ],
  },
  yield: {
    dir: "/work/yield",
    aspect: "1917 / 983",
    groups: [
      { value: "province", text: "Punjab Province" },
      { value: "district", text: "Sargodha District" },
    ],
    frames: [
      { id: "province-1", w: 1917, h: 983, group: "province", origin: "28% 38%", label: "Punjab, Rabi 2026 wheat yield by district", hold: 3600, alt: "Punjab districts coloured by predicted wheat yield, Rabi 2026" },
      { id: "province-2", w: 1917, h: 983, group: "province", origin: "28% 38%", label: "Sheikhupura: 33.8 mnd/ac, 829 kt", hold: 3000, alt: "Punjab yield map with Sheikhupura district details" },
      { id: "province-3", w: 1917, h: 983, group: "province", origin: "28% 38%", label: "Pakpattan: 38.7 mnd/ac, 527 kt", hold: 3000, alt: "Punjab yield map with Pakpattan district details" },
      { id: "sargodha", w: 1462, h: 995, group: "district", dive: true, fit: "contain", label: "Sargodha, field-level wheat yield", hold: 4400, alt: "Pixel-level wheat yield map of Sargodha with district average and historical trend" },
    ],
  },
  uav: {
    dir: "/work/uav",
    aspect: "1920 / 898",
    dim: true,
    frames: [
      { id: "growth", w: 1920, h: 898, label: "Growth stage of every plot from a drone orthomosaic", hold: 3800, alt: "Drone orthomosaic with each rice plot coloured by growth stage, beside a growth stage distribution chart" },
      { id: "yield", w: 1920, h: 898, label: "Predicted yield, 29.8 maunds per acre", hold: 3800, alt: "The same plots coloured by crop health beside yield analytics showing 29.8 maunds per acre" },
      { id: "advisory", w: 1920, h: 898, label: "Advisory for the flowering stage", hold: 4200, alt: "Plots coloured by growth stage beside a generated advisory for the flowering stage" },
    ],
  },
  flood: {
    dir: "/work/flood",
    aspect: "1917 / 992",
    fadeMs: 700,
    frames: [
      { id: "lodhran-low", w: 1917, h: 992, label: "Weekly flood observation", hold: 800, alt: "Lodhran district imagery with the flood layer faint" },
      { id: "lodhran-high", w: 1917, h: 992, label: "Weekly flood observation", hold: 1600, alt: "Lodhran district with flooded area mapped in blue, flood statistics and weekly trend" },
    ],
  },
};

const DEFAULT_FADE_MS = 1800;
const EASE = "cubic-bezier(0.45, 0, 0.55, 1)"; // symmetric sinusoidal ease-in-out, zero start/stop jerk

export default function BlendSequence({ name }: { name: keyof typeof SEQUENCES }) {
  const { dir, aspect, frames, groups, dim, fadeMs } = SEQUENCES[name];
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [tick, setTick] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const visible = useRef(false);

  const isTwoFrameOverlay = frames.length === 2 && !frames[0].dive && !frames[1].dive;
  const currentFade = reduced ? 400 : (fadeMs ?? DEFAULT_FADE_MS);

  const go = (next: number) => {
    setIndex((cur) => {
      if (cur !== next) setPrev(cur);
      return next;
    });
  };

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting), { threshold: 0.3 });
    if (stage.current) io.observe(stage.current);
    return () => io.disconnect();
  }, []);

  // Advance through the sequence while it is on screen, looping back to the start.
  useEffect(() => {
    const t = setTimeout(() => {
      if (visible.current && !document.hidden) go((index + 1) % frames.length);
      else setTick((n) => n + 1); // off screen: wait and check again
    }, frames[index].hold);
    return () => clearTimeout(t);
  }, [index, tick, frames]);

  const current = frames[index];
  const diving = prev !== null && !!current.dive && !reduced;

  return (
    <figure className="card-hover overflow-hidden rounded-[14px] border border-line bg-surface">
      <div ref={stage} className="relative w-full overflow-hidden bg-[#14161a]" style={{ aspectRatio: aspect, filter: dim ? "brightness(0.9) contrast(0.97)" : undefined }}>
        {frames.map((f, i) => {
          let opacity = 0;
          let zIndex = 0;

          if (isTwoFrameOverlay) {
            // For 2-frame overlay loops: base image is always visible underneath; overlay fades smoothly in and out
            if (i === 0) {
              opacity = 1;
              zIndex = 1;
            } else {
              opacity = index === 1 ? 1 : 0;
              zIndex = 2;
            }
          } else {
            const active = i === index;
            const outgoing = i === prev && !active;
            opacity = active || outgoing ? 1 : 0;
            zIndex = active ? 2 : outgoing ? 1 : 0;
          }

          const scale = isTwoFrameOverlay ? 1 : (prev === i && diving ? 1.1 : 1);

          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={f.id}
              src={`${dir}/${f.id}.webp`}
              srcSet={`${dir}/${f.id}-1200.webp ${Math.min(1200, f.w)}w, ${dir}/${f.id}.webp ${f.w}w`}
              sizes="(min-width: 1200px) 1100px, 100vw"
              width={f.w}
              height={f.h}
              alt={f.alt}
              aria-hidden={index !== i}
              loading={i < 2 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full ${f.fit === "contain" ? "bg-[#14161a] object-contain" : "object-cover"}`}
              style={{
                opacity,
                transform: `scale(${scale}) translateZ(0)`,
                transformOrigin: f.origin ?? "50% 50%",
                transition: `opacity ${currentFade}ms ${EASE}, transform ${currentFade + 400}ms ${EASE}`,
                willChange: "opacity, transform",
                zIndex,
              }}
            />
          );
        })}
      </div>

      <figcaption className="flex min-h-[3.25rem] flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <span className="text-[14px] font-medium text-white/85">{current.label}</span>
        {groups && (
          <div role="group" aria-label="View" className="flex rounded-lg border border-line bg-white/[0.03] p-0.5">
            {groups.map((o) => {
              const on = current.group === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => !on && go(frames.findIndex((f) => f.group === o.value))}
                  className={`press rounded-md px-3 py-1 text-[12px] transition-colors ${on ? "bg-white/[0.12] text-white" : "text-white/60 hover:text-white"}`}
                >
                  {o.text}
                </button>
              );
            })}
          </div>
        )}
      </figcaption>
    </figure>
  );
}
