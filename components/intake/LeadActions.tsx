"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorText } from "@/lib/coach-library-client";
import { createLeadInvite, deleteLead, setLeadPlan, updateLead } from "@/lib/coach-leads-client";

/**
 * The lead page's actions (functions/src/leads.ts): Mark contacted,
 * Archive / Restore, Delete; the plan to assign when they join (a library
 * program, or Build plan in the program builder); Invite (a single-use
 * code, optionally emailed). Every change refreshes the page.
 */

export type LeadActionsProps = {
  id: string;
  status: "new" | "contacted" | "invited" | "archived";
  firstName: string;
  email: string;
  aiConsent: boolean;
  planProgramId: string | null;
  invite: { code: string; expiresAt: string | null; emailedAt: string | null; live: boolean } | null;
  programs: { id: string; name: string }[];
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

export default function LeadActions(p: LeadActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState(p.planProgramId ?? "");
  const [sendEmail, setSendEmail] = useState(true);
  const [copied, setCopied] = useState(false);

  // Worked out on the server when the page loads (every action refreshes it).
  const inviteLive = p.invite?.live ?? false;
  const planName = p.programs.find((x) => x.id === p.planProgramId)?.name ?? null;

  async function run(key: string, fn: () => Promise<unknown>, after?: () => void) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      if (after) after();
      else router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy the invite code:", code);
    }
  }

  const btn = "rounded-full border text-sm px-4 py-1.5 disabled:opacity-50";

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Status */}
      <div className="flex flex-wrap gap-2">
        {p.status === "new" && (
          <button
            disabled={!!busy}
            onClick={() => run("contacted", () => updateLead({ leadId: p.id, action: "contacted" }))}
            className={`${btn} border-[#9EFD06]/60 text-[#9EFD06]`}
          >
            {busy === "contacted" ? "Saving…" : "Mark contacted"}
          </button>
        )}
        {p.status === "archived" ? (
          <button
            disabled={!!busy}
            onClick={() => run("restore", () => updateLead({ leadId: p.id, action: "restore" }))}
            className={`${btn} border-zinc-700`}
          >
            Restore
          </button>
        ) : (
          <button
            disabled={!!busy}
            onClick={() => run("archive", () => updateLead({ leadId: p.id, action: "archive" }))}
            className={`${btn} border-zinc-700`}
          >
            Archive
          </button>
        )}
        <button
          disabled={!!busy}
          onClick={() => {
            if (!window.confirm(`Delete ${p.firstName}'s form? Their answers are deleted for good.`)) return;
            void run("delete", () => deleteLead({ leadId: p.id }), () => {
              router.push("/leads");
              router.refresh();
            });
          }}
          className={`${btn} border-red-500/50 text-red-300`}
        >
          Delete
        </button>
      </div>
      {p.status === "archived" && (
        <p className="text-xs text-zinc-500">Archived forms are deleted 30 days after archiving.</p>
      )}

      {/* Plan */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div>
          <h3 className="font-semibold">Plan</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Assigned to {p.firstName} automatically when they join with their invite code.
          </p>
        </div>
        <p className="text-sm text-zinc-300">{planName ? `Plan: ${planName}` : "No plan yet."}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/library/programs/new?lead=${p.id}`}
            className={`${btn} border-[#9EFD06]/60 text-[#9EFD06]`}
          >
            {p.aiConsent ? "✨ Build plan" : "Build plan"}
          </Link>
          <span className="text-xs text-zinc-500">
            {p.aiConsent ? "AI allowed by them." : `${p.firstName} didn't allow AI: build it by hand.`}
          </span>
        </div>
        {p.programs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Library program"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm max-w-full"
            >
              <option value="">Or pick a library program…</option>
              {p.programs.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <button
              disabled={!!busy || plan === (p.planProgramId ?? "")}
              onClick={() => run("plan", () => setLeadPlan({ leadId: p.id, programId: plan || null }))}
              className={`${btn} border-zinc-700`}
            >
              {busy === "plan" ? "Saving…" : plan ? "Use this plan" : "Remove plan"}
            </button>
          </div>
        )}
      </section>

      {/* Invite */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
        <div>
          <h3 className="font-semibold">Invite to Repflow</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            A one-time code. They install Repflow, then enter it in Settings → Coach → Connect to a coach.
          </p>
        </div>
        {p.invite && inviteLive ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg tracking-widest text-[#9EFD06]">{p.invite.code}</span>
            <button onClick={() => copyCode(p.invite!.code)} className={`${btn} border-zinc-700`}>
              {copied ? "Copied" : "Copy"}
            </button>
            <span className="text-xs text-zinc-500">
              Works once, until {fmt(p.invite.expiresAt)}
              {p.invite.emailedAt ? ` · emailed ${fmt(p.invite.emailedAt)}` : ""}
            </span>
          </div>
        ) : p.invite ? (
          <p className="text-sm text-zinc-400">The last code expired. Make a new one.</p>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#9EFD06]"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
          Email it to {p.email}
        </label>
        <button
          disabled={!!busy || p.status === "archived" || (inviteLive && !sendEmail)}
          onClick={() => run("invite", () => createLeadInvite({ leadId: p.id, sendEmail }))}
          className={`${btn} bg-[#9EFD06] border-[#9EFD06] text-black font-semibold`}
        >
          {busy === "invite" ? "Working…" : inviteLive ? "Email the code again" : "Create invite code"}
        </button>
        {p.status === "archived" && <p className="text-xs text-zinc-500">Restore the form to invite them.</p>}
      </section>
    </div>
  );
}
