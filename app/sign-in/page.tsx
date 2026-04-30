"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase-client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/become-coach";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function waitForCookieSync() {
    // The auth context onIdTokenChanged hook fires after sign-in and POSTs
    // the cookie. We wait briefly to let that round-trip complete before
    // navigating, otherwise the destination's server component won't see us.
    await new Promise((r) => setTimeout(r, 250));
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      await waitForCookieSync();
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(getReadableError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      await waitForCookieSync();
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(getReadableError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          ← Back to site
        </Link>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <h1 className="text-2xl font-bold">
            {mode === "signin" ? "Sign in to Repflow" : "Create your account"}
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            {mode === "signin"
              ? "Sign in to access your coach dashboard."
              : "Create an account to set up your coach profile."}
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="mt-6 w-full bg-white text-black px-4 py-3 rounded-full font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-zinc-500">
            <div className="h-px flex-1 bg-zinc-800" />
            or
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <form onSubmit={handleEmailSubmit} className="grid gap-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600"
            />
            <input
              type="password"
              required
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              placeholder="Password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600"
            />

            <button
              type="submit"
              disabled={busy}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-full font-semibold transition disabled:opacity-50"
            >
              {busy
                ? "Working..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="mt-6 text-sm text-zinc-400 hover:text-white transition"
          >
            {mode === "signin"
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}

function getReadableError(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return "No account found for that email.";
      case "auth/email-already-in-use":
        return "An account already exists for that email.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/popup-closed-by-user":
        return "Sign-in window was closed.";
      case "auth/popup-blocked":
        return "Pop-up was blocked. Allow pop-ups for this site and try again.";
      default:
        return code;
    }
  }
  return "Something went wrong. Please try again.";
}