"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteIntake, intakeError } from "@/lib/intake-client";

/** The button behind the confirmation email's "delete my answers" link. */
export default function DeleteIntake({ c, l, t }: { c: string; l: string; t: string }) {
  const [state, setState] = useState<"ready" | "busy" | "deleted" | "gone" | "error">("ready");
  const [message, setMessage] = useState("");
  const complete = Boolean(c && l && t);

  async function run() {
    setState("busy");
    try {
      const res = await deleteIntake(c, l, t);
      setState(res.alreadyDeleted ? "gone" : "deleted");
    } catch (err) {
      const x = intakeError(err);
      setMessage(
        x.code === "resource-exhausted"
          ? "Too many tries from here. Please try again later."
          : x.message,
      );
      setState("error");
    }
  }

  if (!complete) {
    return (
      <p className="text-zinc-300">
        This link isn&apos;t complete. Use the link in your email, or email{" "}
        <a href="mailto:repflowtraining@gmail.com" className="text-[#9EFD06] underline">repflowtraining@gmail.com</a>.
      </p>
    );
  }
  if (state === "deleted") {
    return <p className="text-zinc-200">Your answers were deleted. Your coach can no longer see them.</p>;
  }
  if (state === "gone") {
    return (
      <p className="text-zinc-300">
        There are no answers to delete with this link: they were already deleted, or you joined Repflow
        and they&apos;re now part of your coaching record (ask your coach, or email{" "}
        <a href="mailto:repflowtraining@gmail.com" className="text-[#9EFD06] underline">repflowtraining@gmail.com</a>).
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-zinc-300">
        This deletes the answers you sent in the coach&apos;s intake form, including your health screening.
        It can&apos;t be undone.
      </p>
      {state === "error" && (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {message}
        </p>
      )}
      <button
        onClick={run}
        disabled={state === "busy"}
        className="min-h-12 px-6 rounded-full bg-red-500 text-white font-bold disabled:opacity-50"
      >
        {state === "busy" ? "Deleting…" : "Delete my answers"}
      </button>
      <p className="text-xs text-zinc-500">
        <Link href="/privacy" className="underline">Privacy Policy</Link>
      </p>
    </div>
  );
}
