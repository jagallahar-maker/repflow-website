"use client";

import { useEffect, useState } from "react";
import { aiBuildCoachDraft, coachDraftsLeft, errorText } from "@/lib/coach-library-client";
import type { AiPlanJson } from "@/lib/ai-draft";
import type { DraftClient } from "@/lib/coach-library-data";
import { WEEKDAYS } from "@/lib/routine-format";

const GOALS: Record<string, string> = {
  strength: "Strength",
  hypertrophy: "Muscle",
  general: "General fitness",
  fat_loss: "Fat loss",
  endurance: "Endurance",
};
const MUSCLES = ["chest", "back", "shoulders", "arms", "quads", "hamstrings", "glutes", "calves", "core"];
const EQUIPMENT: Record<string, string> = {
  full_gym: "Full gym",
  home_gym: "Home",
  dumbbells_only: "Dumbbells",
  bodyweight_only: "Bodyweight",
};
const INJURIES: Record<string, string> = {
  shoulder: "Shoulder", knee: "Knee", lower_back: "Lower back", neck: "Neck",
  elbow: "Elbow", wrist: "Wrist", hip: "Hip", ankle: "Ankle",
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/**
 * Build with AI for the coach's routine / program builder
 * (aiBuildCoachDraft). The result opens in the builder as a draft;
 * nothing is saved or assigned here. A client's data is used only when
 * one is picked and their AI summaries switch is on.
 */
export default function AiDraftDialog({
  mode,
  clients,
  onResult,
  onClose,
}: {
  mode: "routine" | "program";
  clients: DraftClient[];
  onResult: (plan: AiPlanJson, note: string) => void;
  onClose: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [weeks, setWeeks] = useState(8);
  const [days, setDays] = useState<string[]>(["monday", "wednesday", "friday"]);
  const [goal, setGoal] = useState("hypertrophy");
  const [minutes, setMinutes] = useState(60);
  const [focus, setFocus] = useState<string[]>([]);
  const [equipment, setEquipment] = useState("full_gym");
  const [injuries, setInjuries] = useState<string[]>([]);
  const [avoid, setAvoid] = useState("");
  const [notes, setNotes] = useState("");
  const [left, setLeft] = useState<{ left: number | null; cap: number | null; enabled: boolean } | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    coachDraftsLeft().then(setLeft).catch(() => setLeft(null));
  }, []);

  const client = clients.find((c) => c.id === clientId) ?? null;
  const dataNote = !client
    ? "No client picked: the AI sees only what you type here."
    : client.aiSummaries
      ? `Uses what ${client.name} shares with you (${client.shares.join(", ") || "nothing"}): age range, ` +
        "training, body and nutrition summaries. No name, no injuries. Logged in their access history."
      : `${client.name} has AI summaries off, so none of their data is used: only what you type here.`;

  const toggle = (list: string[], v: string, set: (x: string[]) => void, max = 9) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : list.length < max ? [...list, v] : list);

  async function build() {
    if (mode === "program" && days.length === 0) {
      setError("Pick at least one training day.");
      return;
    }
    setBuilding(true);
    setError(null);
    try {
      const res = await aiBuildCoachDraft({
        mode, weeks, days, goal, sessionMinutes: minutes, focus, equipment,
        injuries, avoid, notes, clientId: clientId || null,
      });
      onResult(
        res.plan,
        res.usedClientData && client
          ? `Built with AI from ${client.name}'s shared data.`
          : "Built with AI from your request only.",
      );
    } catch (err) {
      setError(errorText(err));
      setBuilding(false);
    }
  }

  const chip = (on: boolean) =>
    `text-xs px-2.5 py-1 rounded-full border ${
      on ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10" : "border-zinc-800 text-zinc-400 hover:text-white"
    }`;
  const section = "text-xs uppercase tracking-wider text-zinc-500 mt-4 mb-1.5";
  const noneLeft = left?.left != null && left.left <= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Build with AI">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <h2 className="font-semibold">✨ Build {mode === "program" ? "a program" : "a routine"} with AI</h2>
          <button onClick={onClose} disabled={building} className="text-sm text-zinc-400 hover:text-white">Close</button>
        </div>
        {building ? (
          <div className="p-10 text-center text-sm text-zinc-400">
            Building{mode === "program" ? " the program (about a minute)" : " (20–40 seconds)"}…
          </div>
        ) : (
          <div className="overflow-y-auto px-5 pb-5">
            <div className={section}>For client (optional)</div>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-1.5 text-sm"
            >
              <option value="">No specific client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.aiSummaries ? "" : " (AI summaries off)"}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500 mt-1.5">{dataNote}</p>

            {mode === "program" && (
              <>
                <div className={section}>Length</div>
                <div className="flex items-center gap-3">
                  <button aria-label="Fewer weeks" disabled={weeks <= 1} onClick={() => setWeeks(weeks - 1)} className="w-8 h-8 rounded-full border border-zinc-800 disabled:opacity-30">−</button>
                  <span className="w-20 text-center text-[#9EFD06] font-semibold">{weeks} weeks</span>
                  <button aria-label="More weeks" disabled={weeks >= 16} onClick={() => setWeeks(weeks + 1)} className="w-8 h-8 rounded-full border border-zinc-800 disabled:opacity-30">+</button>
                </div>
                <div className={section}>Training days ({days.length} a week)</div>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d) => (
                    <button key={d} className={chip(days.includes(d))} onClick={() => toggle(days, d, setDays, 7)}>
                      {cap(d).slice(0, 3)}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className={section}>Goal</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(GOALS).map(([k, v]) => (
                <button key={k} className={chip(goal === k)} onClick={() => setGoal(k)}>{v}</button>
              ))}
            </div>
            <div className={section}>Session length</div>
            <div className="flex flex-wrap gap-1.5">
              {[30, 45, 60, 75, 90].map((m) => (
                <button key={m} className={chip(minutes === m)} onClick={() => setMinutes(m)}>{m} min</button>
              ))}
            </div>
            <div className={section}>Focus muscles (optional)</div>
            <div className="flex flex-wrap gap-1.5">
              {MUSCLES.map((m) => (
                <button key={m} className={chip(focus.includes(m))} onClick={() => toggle(focus, m, setFocus, 5)}>{cap(m)}</button>
              ))}
            </div>
            <div className={section}>Equipment</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(EQUIPMENT).map(([k, v]) => (
                <button key={k} className={chip(equipment === k)} onClick={() => setEquipment(k)}>{v}</button>
              ))}
            </div>
            {equipment === "home_gym" && (
              <p className="text-xs text-zinc-500 mt-1">
                {client?.aiSummaries
                  ? `Uses ${client.name}'s saved home equipment if they set it, else dumbbells, kettlebells and bands.`
                  : "Dumbbells, kettlebells and bands (no barbell, machines or cables)."}
              </p>
            )}
            <div className={section}>Protect (injuries)</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(INJURIES).map(([k, v]) => (
                <button key={k} className={chip(injuries.includes(k))} onClick={() => toggle(injuries, k, setInjuries)}>{v}</button>
              ))}
            </div>
            <div className={section}>Anything to avoid</div>
            <input value={avoid} maxLength={300} onChange={(e) => setAvoid(e.target.value)} placeholder="e.g. no deadlifts"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm outline-none focus:border-zinc-600" />
            <div className={section}>Notes</div>
            <textarea value={notes} maxLength={600} rows={3} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. returning after 3 months off, wants a bigger upper back"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm outline-none focus:border-zinc-600" />
            <p className="text-xs text-zinc-600 mt-3">
              Sent to Anthropic (Claude). Exercises come from the Repflow library. The draft opens here for
              you to check and edit; nothing is saved or assigned until you do.
            </p>
            {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          </div>
        )}
        {!building && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-zinc-900">
            <span className="text-xs text-zinc-500">
              {left?.enabled === false
                ? "AI is paused right now."
                : noneLeft
                  ? `You've used all ${left?.cap ?? ""} AI drafts this month. They reset on the 1st.`
                  : left?.left != null
                    ? `${left.left} AI draft${left.left === 1 ? "" : "s"} left this month`
                    : ""}
            </span>
            <button
              disabled={noneLeft || left?.enabled === false}
              onClick={build}
              className="rounded-full bg-[#9EFD06] text-black font-semibold text-sm px-5 py-2 disabled:opacity-40"
            >
              ✨ Build {mode}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
