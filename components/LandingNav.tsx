"use client";

import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/lib/auth-context";

export default function LandingNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut(auth);
    await new Promise((r) => setTimeout(r, 200));
    router.refresh();
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/70 backdrop-blur border-b border-zinc-900">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Repflow
        </Link>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-24 bg-zinc-900 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/clients"
                className="text-zinc-400 hover:text-white transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="bg-white text-black px-4 py-2 rounded-full font-medium hover:opacity-90 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-zinc-400 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                href="/sign-in"
                className="bg-white text-black px-4 py-2 rounded-full font-medium hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}