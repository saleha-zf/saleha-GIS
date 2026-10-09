import type { Metadata } from "next";
import { profile } from "../content";

export const metadata: Metadata = {
  title: `CV | ${profile.name}`,
  description: `Curriculum vitae of ${profile.name}, ${profile.title}.`,
};

export default function CV() {
  return (
    <>
      <nav aria-label="Main" className="glass fixed inset-x-0 top-0 z-40 border-b border-white/[0.06]">
        <ul className="mx-auto flex h-12 max-w-6xl items-center justify-end gap-8 px-5 text-[13px] text-white/75 md:px-8">
          <li><a className="press hover:text-white" href="/#work">Work</a></li>
          <li><a className="press hover:text-white" href="/#contact">Contact</a></li>
          <li><a className="press text-white" href="/cv" aria-current="page">CV</a></li>
        </ul>
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Curriculum vitae</p>
            <h1 className="mt-3 text-[2rem] font-medium leading-[1.1] tracking-[-0.03em] md:text-[2.75rem]">{profile.name}</h1>
            <p className="mt-2 text-[15px] text-muted">{profile.role}</p>
          </div>
          <a
            href={profile.cv}
            download
            className="press inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[14px] font-medium text-bg hover:bg-white"
          >
            Download PDF <span aria-hidden="true">↓</span>
          </a>
        </div>

        {/* Rendered inline on desktop; phones get the open/download links below, since most mobile browsers can't embed PDFs. */}
        <div className="mt-10 overflow-hidden rounded-[14px] border border-line bg-white max-md:hidden">
          <iframe src={`${profile.cv}#view=FitH&toolbar=0`} title={`CV of ${profile.name}`} className="block h-[80vh] min-h-[640px] w-full" />
        </div>
        <p className="mt-6 text-[14px] text-muted md:hidden">
          <a href={profile.cv} className="text-accent underline-offset-4 hover:underline">Open the CV</a> in your browser, or use Download PDF above.
        </p>
      </main>
    </>
  );
}
