"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RepflowLogo from "@/components/brand/RepflowLogo";

/** Pages with their own top: the coach portal (CoachHeader) and sign-in. */
const OWN_HEADER = ["/sign-in", "/clients", "/leads", "/library"];

/** Pages a coach's client opens (the intake form, its delete link from
 *  the email): the logo only, no sign-in link. */
const CLIENT_FACING = ["/c/", "/intake/"];

function under(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`),
  );
}

/**
 * The site's top bar on every public page (root layout): the lime R and
 * "Repflow", linking home, and Dashboard / Coach sign in on the right.
 */
export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const { user, loading } = useAuth();
  if (under(pathname, OWN_HEADER)) return null;
  const clientFacing = under(pathname, CLIENT_FACING);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-900 bg-black/85 backdrop-blur">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 ${
          clientFacing ? "h-14" : "h-16"
        }`}
      >
        <Link
          href="/"
          aria-label="Repflow home"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          <RepflowLogo size={clientFacing ? "sm" : "md"} />
        </Link>

        {!clientFacing && !loading && (
          <Link
            href={user ? "/clients" : "/sign-in"}
            className="rounded-full border border-zinc-800 px-4 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            {user ? "Dashboard" : "Coach sign in"}
          </Link>
        )}
      </div>
    </header>
  );
}
