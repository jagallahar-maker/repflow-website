import Link from "next/link";
import RepflowMark from "@/components/brand/RepflowMark";

export default function HomePage() {
  return (
    // The viewport under the site header (h-16).
    <main className="min-h-[calc(100svh-4rem)] bg-black text-white flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl text-center">
        <RepflowMark className="mx-auto h-24 w-auto text-brand sm:h-32" />
        <h1 className="mt-8 text-5xl font-black tracking-tight">Repflow</h1>
        <p className="mt-4 text-zinc-400">
          The fitness app for serious lifters.
        </p>
        <div className="mt-8">
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center bg-brand text-black px-8 py-4 rounded-full font-bold hover:opacity-90 transition"
          >
            Coach sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
