"use client";

import { httpsCallable } from "firebase/functions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { functions } from "@/lib/firebase-client";

const HANDLE_REGEX = /^[a-z][a-z0-9_]{2,19}$/;

type BecomeCoachResult = {
  coachId: string;
  inviteCode: string;
};

export default function BecomeCoachClient({
  defaultDisplayName,
  userEmail,
}: {
  defaultDisplayName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalizedHandle = handle.trim().toLowerCase();
    if (!HANDLE_REGEX.test(normalizedHandle)) {
      setError(
        "Handle must be 3–20 characters, lowercase letters/numbers/underscores, starting with a letter.",
      );
      return;
    }
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }

    setBusy(true);
    try {
      const becomeCoach = httpsCallable<
        { handle: string; displayName: string },
        BecomeCoachResult
      >(functions, "becomeCoach");

      await becomeCoach({
        handle: normalizedHandle,
        displayName: displayName.trim(),
      });

      // Refresh the server component, which will detect the new coach doc and
      // render the success view.
      router.refresh();
    } catch (err) {
      setError(getReadableFunctionError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div>
        <label className="text-sm text-zinc-400 block mb-2">Coach Handle</label>
        <div className="flex items-center bg-black border border-zinc-800 rounded-xl overflow-hidden focus-within:border-zinc-600">
          <span className="pl-4 pr-1 text-zinc-500">@</span>
          <input
            type="text"
            required
            placeholder="justing"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            className="bg-transparent flex-1 px-2 py-3 outline-none font-mono"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          3–20 characters. Lowercase letters, numbers, and underscores. Must
          start with a letter.
        </p>
      </div>

      <div>
        <label className="text-sm text-zinc-400 block mb-2">Display Name</label>
        <input
          type="text"
          required
          placeholder="Justin Gallahar"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-zinc-600"
        />
        <p className="text-xs text-zinc-500 mt-2">
          This is what athletes will see when they connect to you.
        </p>
      </div>

      <div className="text-xs text-zinc-500">
        Signed in as{" "}
        <span className="text-zinc-300">{userEmail || "(no email)"}</span>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="bg-white text-black px-5 py-3 rounded-full font-semibold hover:opacity-90 transition disabled:opacity-50"
      >
        {busy ? "Creating coach account..." : "Create Coach Account"}
      </button>

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </form>
  );
}

function getReadableFunctionError(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    // Firebase Functions errors have a `code` like "functions/already-exists"
    // and a `message` from the server.
    const code = (err as { code?: string }).code ?? "";
    const message = (err as { message?: string }).message ?? "";

    if (code.includes("already-exists")) {
      // Server returns a clean message, prefer it.
      return message || "That handle is already taken.";
    }
    if (code.includes("invalid-argument")) {
      return message || "Invalid input. Check the handle and display name.";
    }
    if (code.includes("unauthenticated")) {
      return "You need to sign in again. Refresh the page.";
    }
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}