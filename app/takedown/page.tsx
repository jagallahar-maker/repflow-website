import Link from "next/link";
import type { Metadata } from "next";
import TakedownForm from "./takedown-form";

export const metadata: Metadata = {
  title: "Request removal — Repflow",
  description:
    "Ask Repflow to remove an intimate image shared without consent, or send a copyright notice.",
};

export default function TakedownPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-2"
        >
          <span aria-hidden>←</span> Back to Repflow
        </Link>

        <h1 className="mt-8 text-4xl sm:text-5xl font-black tracking-tight">
          Request removal
        </h1>
        <p className="mt-4 text-zinc-400 text-lg leading-relaxed">
          Use this form to ask us to remove an intimate image or video of you
          shared on Repflow without your consent, or to send a copyright
          notice. You don&apos;t need a Repflow account. Repflow members can
          also report any post, comment or profile in the app (⋯ → Report).
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4">
            <div className="font-semibold text-white">Intimate images</div>
            <p className="mt-1 text-zinc-400">
              Removed, with identical copies we can find, within 48 hours of a
              valid request.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4">
            <div className="font-semibold text-white">Copyright</div>
            <p className="mt-1 text-zinc-400">Reviewed within 24 hours.</p>
          </div>
        </div>

        <div className="mt-10">
          <TakedownForm />
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          Can&apos;t use the form? Email{" "}
          <a
            href="mailto:repflowtraining@gmail.com"
            className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
          >
            repflowtraining@gmail.com
          </a>{" "}
          with the same information.
        </p>
      </div>
    </main>
  );
}
