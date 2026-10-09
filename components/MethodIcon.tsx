// Minimal line icons for the method steps, drawn on a 24 px grid in the accent colour.
const PATHS: Record<string, React.ReactNode> = {
  satellite: (
    <>
      <rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" />
      <path d="M4.5 9.5l3-3 3 3-3 3zM13.5 18.5l3-3 3 3-3 3z" />
      <path d="M18 3.5a3 3 0 0 1 2.5 2.5M17.5 6.5a.8.8 0 0 1 .5.5" />
    </>
  ),
  layers: (
    <>
      <path d="M12 4l8 4-8 4-8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  chart: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>
  ),
};

export default function MethodIcon({ name }: { name: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
