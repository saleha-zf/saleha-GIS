"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the hero map pinned while the hero text and About section scroll over it,
 * and sets --hero-dim (0 to 1) so the map darkens as the reader moves on.
 */
export default function ScrollDim({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const dim = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      ref.current?.style.setProperty("--hero-dim", dim.toFixed(3));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
