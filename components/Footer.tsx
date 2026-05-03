import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-900 bg-black text-zinc-400">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm">
          <span className="font-bold text-white">Repflow</span>
          <span className="ml-3 text-zinc-600">© {year}</span>
        </div>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/privacy"
            className="hover:text-lime-400 transition"
          >
            Privacy
          </Link>
          <Link
            href="/support"
            className="hover:text-lime-400 transition"
          >
            Support
          </Link>
        </nav>
      </div>
    </footer>
  );
}