"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, className = "", delay }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        // Also show anything already scrolled past, so content is never left hidden.
        if (e.isIntersecting || e.boundingClientRect.top < 0) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-shown={shown}
      style={delay ? ({ "--delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}
