import Link from "next/link";
import type { LegalDoc } from "../legal-content";

/** Renders a legal draft (terms, guidelines) in the privacy page's style. */
export default function LegalDocPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-2"
        >
          <span aria-hidden>←</span> Back to Repflow
        </Link>

        <h1 className="mt-8 text-4xl sm:text-5xl font-black tracking-tight">
          {doc.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: {doc.updated}</p>

        <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-sm text-amber-200">
          {doc.draftNotice}
        </div>

        <div className="mt-10 space-y-4 text-zinc-300 leading-relaxed">
          {doc.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-12">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight border-b border-zinc-900 pb-3">
              {s.heading}
            </h2>
            <div className="mt-5 space-y-4 text-zinc-300 leading-relaxed">
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}

        <div className="mt-20 pt-8 border-t border-zinc-900 text-center text-sm text-zinc-500 space-x-6">
          <Link href="/terms" className="hover:text-zinc-300 transition">Terms</Link>
          <Link href="/community-guidelines" className="hover:text-zinc-300 transition">
            Community Guidelines
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300 transition">Privacy</Link>
        </div>
      </div>
    </main>
  );
}
