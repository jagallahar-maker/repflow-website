"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.error || "Something went wrong.");
        return;
      }

      setStatus("You’re on the waitlist.");
      setEmail("");
    } catch {
      setStatus("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="flex-1 bg-black border border-zinc-800 rounded-full px-5 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-zinc-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? "Joining..." : "Join Waitlist"}
        </button>
      </form>

      {status ? (
        <p className="mt-4 text-sm text-zinc-400 text-center">{status}</p>
      ) : null}
    </div>
  );
}