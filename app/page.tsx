import HeroMap from "@/components/HeroMap";
import LocatorMap from "@/components/LocatorMap";
import Reveal from "@/components/Reveal";
import BlendSequence from "@/components/BlendSequence";
import ScrollDim from "@/components/ScrollDim";
import MethodIcon from "@/components/MethodIcon";
import { background, method, profile, projects } from "./content";

const eyebrow = "font-mono text-[11px] uppercase tracking-[0.1em] text-muted";

export default function Home() {
  return (
    <>
      <a href="#work" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-bg">
        Skip to work
      </a>

      <nav aria-label="Main" className="glass fixed inset-x-0 top-0 z-40 border-b border-white/[0.06]">
        <ul className="mx-auto flex h-12 max-w-6xl items-center justify-end gap-8 px-5 text-[13px] text-white/75 md:px-8">
          <li><a className="press hover:text-white" href="#work">Work</a></li>
          <li><a className="press hover:text-white" href="#contact">Contact</a></li>
          <li><a className="press hover:text-white" href="/cv">CV</a></li>
        </ul>
      </nav>

      <ScrollDim className="relative">
        {/* Pinned map: stays put while the hero text and About scroll over it, darkening as they go. */}
        <div className="hero-stage sticky top-0 h-[100dvh] overflow-hidden">
          <HeroMap />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,12,13,0.85)_0%,rgba(10,12,13,0.4)_34%,rgba(10,12,13,0)_55%)] max-md:bg-[linear-gradient(0deg,rgba(10,12,13,0.92)_0%,rgba(10,12,13,0.5)_40%,rgba(10,12,13,0)_65%)]" />
          <div className="pointer-events-none absolute inset-0 z-20 bg-bg" style={{ opacity: "calc(var(--hero-dim, 0) * 0.82)" }} />
        </div>

        <header className="pointer-events-none relative z-30 -mt-[100dvh] flex min-h-[100dvh] flex-col">
          <div className="pointer-events-none relative z-10 mt-auto max-w-xl px-5 pb-14 md:px-8 md:pb-20">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">{profile.title}</p>
            <h1 className="mt-4 text-[1.75rem] font-medium leading-[1.15] tracking-[-0.02em] text-white/95 md:text-[2.4rem]">{profile.statement}</h1>
            <a href="#work" className="press pointer-events-auto mt-6 inline-flex items-center gap-1.5 text-[15px] text-accent hover:text-white">
              See the work <span aria-hidden="true">›</span>
            </a>
          </div>
        </header>

        <section id="about" aria-labelledby="about-h" className="relative z-30 flex min-h-[100dvh] items-center">
          <div className="mx-auto w-full max-w-6xl px-5 py-32 md:px-8">
            <Reveal className="max-w-3xl">
              <h2 id="about-h" className={eyebrow}>About</h2>
              <p className="mt-6 text-[1.6rem] font-medium leading-[1.25] tracking-[-0.02em] md:text-[2.3rem]">{profile.about[0]}</p>
              <p className="mt-6 text-[17px] text-white/85">{profile.role}</p>
              <p className="mt-8 max-w-2xl border-l border-white/20 pl-4 text-[13px] leading-[1.55] text-muted">{profile.affiliation}</p>
            </Reveal>
          </div>
        </section>
      </ScrollDim>

      <main className="mx-auto max-w-6xl px-5 md:px-8">
        <section id="background" aria-labelledby="background-h" className="scroll-mt-16 py-20">
          <h2 id="background-h" className={eyebrow}>Experience & education</h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {background.map((b, i) => (
              <li key={b.what}>
                <Reveal delay={i * 70}>
                  <p className="font-mono text-[11px] tracking-[0.06em] text-white/40">{b.when}</p>
                  <p className="mt-2 text-[15px] font-medium text-white/90">{b.what}</p>
                  {b.whereHref ? (
                    <a
                      href={b.whereHref}
                      target="_blank"
                      rel="noreferrer"
                      className="press mt-1 block text-[13px] leading-[1.5] text-muted hover:text-white"
                    >
                      {b.where} <span className="inline-block text-[11px] text-white/40" aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <p className="mt-1 text-[13px] leading-[1.5] text-muted">{b.where}</p>
                  )}
                  {b.note && (
                    <a href={b.note.href} target="_blank" rel="noreferrer" className="press mt-2 inline-block text-[12px] text-white/50 underline-offset-4 hover:text-accent hover:underline">
                      {b.note.text} <span aria-hidden="true">↗</span>
                    </a>
                  )}
                </Reveal>
              </li>
            ))}
          </ul>
        </section>

        <section id="workflow" aria-labelledby="workflow-h" className="scroll-mt-16 border-t border-line py-32">
          <h2 id="workflow-h" className={eyebrow}>Workflow</h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {method.map((m, i) => (
              <li key={m.step}>
                <Reveal delay={i * 70}>
                  <div className="border-t border-white/20 pt-5">
                    <div className="flex items-center justify-between">
                      <MethodIcon name={m.icon} />
                      <span className="font-mono text-[11px] tracking-[0.1em] text-white/40">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-5 text-[1.25rem] font-medium tracking-[-0.015em]">{m.step}</h3>
                    <p className="mt-2 text-[15px] leading-[1.5] text-muted">{m.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section id="work" aria-labelledby="work-h" className="scroll-mt-16 border-t border-line pt-32">
          <h2 id="work-h" className={eyebrow}>Work</h2>
          {projects.map((p, i) => (
            <article key={p.id} id={p.id} className="scroll-mt-16 border-b border-line py-24 last:border-b-0 md:py-32">
              <div className="grid gap-12 md:grid-cols-12">
                <Reveal className="md:col-span-7">
                  <span className="font-mono text-[11px] tracking-[0.1em] text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-[2rem] font-medium leading-[1.08] tracking-[-0.03em] md:text-[2.75rem]">{p.title}</h3>
                  <p className="mt-6 max-w-xl text-[17px] leading-[1.5] text-muted">{p.body}</p>
                  {p.publication && (
                    <a href={p.publication.href} target="_blank" rel="noreferrer" className="press group mt-10 block max-w-xl border-t border-white/20 pt-5">
                      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">Published · {p.publication.venue}</span>
                      <span className="mt-2 block text-[17px] font-medium leading-[1.4] text-white/90 group-hover:text-white">
                        {p.publication.title} <span aria-hidden="true">↗</span>
                      </span>
                    </a>
                  )}
                  {p.proof && (
                    <div className="mt-10 max-w-xl border-t border-white/20 pt-5">
                      {p.proof.value && <p className="text-[3.5rem] font-medium leading-none tracking-[-0.04em] md:text-[4.5rem]">{p.proof.value}</p>}
                      <p className={p.proof.value ? "mt-3 text-[15px] text-muted" : "text-[17px] text-ink"}>{p.proof.label}</p>
                    </div>
                  )}
                </Reveal>
                <Reveal className="md:col-span-5">
                  {p.map && <LocatorMap {...p.map} />}
                </Reveal>
              </div>
              {p.sequence && (
                <Reveal className="mt-16">
                  <BlendSequence name={p.sequence} />
                </Reveal>
              )}
              {p.shots.length > 0 && (
                <div className={`mt-16 grid items-start gap-6 ${p.shots.length > 1 ? "md:grid-cols-2" : ""}`}>
                  {p.shots.map((s) => (
                    <Reveal key={s.src}>
                      <figure className="card-hover overflow-hidden rounded-[14px] border border-line bg-surface">
                        <a href={s.src} target="_blank" rel="noreferrer" aria-label={`Open full image: ${s.caption}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.src} width={s.w} height={s.h} alt={s.alt} loading="lazy" className="block h-auto w-full" />
                        </a>
                        <figcaption className="border-t border-line px-4 py-3 text-[14px] font-medium text-white/85">{s.caption}</figcaption>
                      </figure>
                    </Reveal>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>

        <section id="contact" aria-labelledby="contact-h" className="scroll-mt-16 border-t border-line py-28 md:py-36">
          <Reveal className="max-w-3xl">
            <h2 id="contact-h" className={eyebrow}>Contact</h2>
            <p className="mt-6 text-[2rem] font-medium leading-[1.1] tracking-[-0.03em] md:text-[3rem]">{profile.contactLine}</p>
            {profile.links.length > 0 && (
              <ul className="mt-10 flex flex-wrap gap-6">
                {profile.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="press inline-flex items-center gap-1.5 text-[15px] text-accent hover:text-white">
                      {l.label} <span aria-hidden="true">›</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 font-mono text-[11px] text-white/50 md:px-8">
          <span>Built with Next.js, MapLibre GL, Esri basemaps & Sentinel EO data</span>
          <span>2026</span>
        </div>
      </footer>
    </>
  );
}
