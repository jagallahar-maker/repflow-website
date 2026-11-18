"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import RepflowLogo from "@/components/brand/RepflowLogo";

type CoachHeaderProps = {
  coachId: string;
  coachDisplayName: string;
};

export default function CoachHeader({
  coachId,
  coachDisplayName,
}: CoachHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut(auth);
    // The auth context will clear the cookie via /api/auth/session DELETE.
    // Push to landing page after a brief delay so the cookie clear lands.
    await new Promise((r) => setTimeout(r, 200));
    router.push("/");
    router.refresh();
  }

  return (
    // Edge to edge over the page padding (px-4, sm:px-6). Phones: the
    // logo and Sign out on top, the section links on their own row.
    <header className="sticky top-0 z-40 -mx-4 sm:-mx-6 mb-6 bg-black/80 backdrop-blur border-b border-zinc-900">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-6 py-3">
        <Link
          href="/clients"
          aria-label="Repflow coach dashboard"
          className="flex items-center gap-3 group rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <RepflowLogo size="md" />
          <span aria-hidden className="hidden lg:inline text-zinc-700">/</span>
          <span aria-hidden className="hidden lg:inline text-zinc-400 group-hover:text-white transition text-sm">
            Coach Dashboard
          </span>
        </Link>

        <nav className="order-last w-full md:order-none md:w-auto flex items-center gap-1 text-sm">
          {[
            ["/clients", "Clients"],
            ["/leads", "New clients"],
            ["/library", "Library"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-full transition ${
                pathname?.startsWith(href)
                  ? "text-white bg-zinc-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm text-white">{coachDisplayName}</span>
            <span className="text-xs text-zinc-500 font-mono">
              @{coachId}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-400 hover:text-white transition border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-full"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}