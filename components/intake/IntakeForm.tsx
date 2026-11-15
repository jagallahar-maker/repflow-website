"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CONTACT_TIMES,
  EXPERIENCE,
  GOALS,
  HEALTH_PRIVACY_PATH,
  HOME_EQUIPMENT,
  INJURY_AREAS,
  INTAKE_CONSENT_VERSION,
  LIMITS,
  MIN_AGE,
  PLACES,
  PRIVACY_PATH,
  SCOPES,
  SCREENING,
  SESSION_MINUTES,
  aiConsentText,
  consentLead,
  doctorNote,
  minorMessage,
  parseIntake,
} from "@/lib/intake-format";
import { intakeError, startAppCheck, submitIntake } from "@/lib/intake-client";

/**
 * The coach intake form (app/c/[handle]/start). Six short steps with a
 * progress bar; each step checks its own answers with the same
 * parseIntake the server runs (lib/intake-format.ts =
 * functions/src/intakeFormat.ts). Unsent answers stay in this browser
 * (localStorage, never the consent boxes) and are cleared once sent.
 * Under 18 stops at step 1 and nothing is sent. A hidden "website" field
 * and the time since the page loaded tell bots apart (submitIntake).
 */

type Answers = {
  name: string;
  email: string;
  phone: string;
  contactTime: string | null;
  contactNote: string;
  age: string;
  goals: string[];
  goalText: string;
  experience: string | null;
  scope: string | null;
  diet: { weightLb: string; goalWeightLb: string; restrictions: string };
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  place: string | null;
  owned: string[];
  injuryAreas: string[];
  injuriesNone: boolean;
  injuryDetails: string;
  screening: (boolean | null)[];
  notes: string;
};

const EMPTY: Answers = {
  name: "",
  email: "",
  phone: "",
  contactTime: null,
  contactNote: "",
  age: "",
  goals: [],
  goalText: "",
  experience: null,
  scope: null,
  diet: { weightLb: "", goalWeightLb: "", restrictions: "" },
  daysPerWeek: null,
  sessionMinutes: null,
  place: null,
  owned: [],
  injuryAreas: [],
  injuriesNone: false,
  injuryDetails: "",
  screening: SCREENING.map(() => null),
  notes: "",
};

const STEPS = [
  { title: "About you", fields: ["name", "email", "phone", "age"] },
  { title: "Your goals", fields: ["goals", "experience", "scope", "weightLb", "goalWeightLb"] },
  { title: "Schedule and equipment", fields: ["daysPerWeek", "sessionMinutes", "place"] },
  { title: "Injuries", fields: ["injuryAreas"] },
  { title: "Health screening", fields: ["screening"] },
  { title: "Last step", fields: ["consent"] },
];

const input =
  "mt-1 w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-3 text-base text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500";
const chip = (on: boolean) =>
  `min-h-11 px-4 py-2 rounded-full border text-sm transition ${
    on ? "border-[#9EFD06] text-[#9EFD06] bg-[#9EFD06]/10" : "border-zinc-800 text-zinc-300 hover:border-zinc-600"
  }`;

/** The answers as parseIntake / submitIntake read them. */
function payload(a: Answers) {
  return {
    ...a,
    age: a.age.trim(),
    diet: a.scope === "training_diet" ? a.diet : undefined,
    owned: a.place === "home" ? a.owned : [],
    injuryAreas: a.injuriesNone ? [] : a.injuryAreas,
  };
}

function Field({ label, error, hint, children }: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-300">{label}</span>
      {children}
      {hint && !error && <span className="block mt-1 text-xs text-zinc-500">{hint}</span>}
      {error && <span role="alert" className="block mt-1 text-xs text-red-400">{error}</span>}
    </label>
  );
}

function Group({ legend, error, hint, children }: {
  legend: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-sm text-zinc-300">{legend}</legend>
      {hint && <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
      {error && <p role="alert" className="mt-1 text-xs text-red-400">{error}</p>}
    </fieldset>
  );
}

export default function IntakeForm({
  coach,
  source,
}: {
  /** name: the title and consent boxes; firstName: every other line. */
  coach: { handle: string; name: string; firstName: string };
  source: "link" | "qr";
}) {
  const storeKey = `repflow_intake_${coach.handle}`;
  const [a, setA] = useState<Answers>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [minor, setMinor] = useState(false);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<{ clearance: boolean } | null>(null);
  const [verifyReady, setVerifyReady] = useState(true);
  const startedAt = useRef(0); // set when the form opens (below)
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    // Browser-only (App Check, saved answers), so read after the page loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVerifyReady(startAppCheck());
    try {
      const saved = window.localStorage.getItem(storeKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Answers>;
        setA({
          ...EMPTY,
          ...parsed,
          diet: { ...EMPTY.diet, ...(parsed.diet ?? {}) },
          // One slot per current question, whatever was saved before.
          screening: SCREENING.map((_, i) =>
            typeof parsed.screening?.[i] === "boolean" ? (parsed.screening[i] as boolean) : null),
        });
      }
    } catch {
      // No storage (private window): start empty.
    }
  }, [storeKey]);

  useEffect(() => {
    if (done) return;
    try {
      window.localStorage.setItem(storeKey, JSON.stringify(a));
    } catch {
      // Ignore.
    }
  }, [a, done, storeKey]);

  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((x) => ({ ...x, [k]: v }));
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function scrollTop() {
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** This step's errors (parseIntake checks everything; keep this step's). */
  function stepErrors(i: number): Record<string, string> {
    const r = parseIntake(payload(a));
    const out: Record<string, string> = {};
    if (!r.ok) {
      for (const f of STEPS[i].fields) if (r.errors[f]) out[f] = r.errors[f];
    }
    if (i === STEPS.length - 1 && !consent) out.consent = "Please check this box to send the form.";
    return out;
  }

  function next() {
    if (step === 0) {
      const age = Number(a.age.trim());
      if (Number.isInteger(age) && age > 0 && age < MIN_AGE) {
        setMinor(true);
        return;
      }
    }
    const e = stepErrors(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => s + 1);
    scrollTop();
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
    scrollTop();
  }

  async function send() {
    const e = stepErrors(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    setProblem(null);
    try {
      const res = await submitIntake({
        coach: coach.handle,
        answers: { ...payload(a), aiConsent },
        consent: true,
        consentVersion: INTAKE_CONSENT_VERSION,
        startedAt: startedAt.current,
        website,
        source,
      });
      try {
        window.localStorage.removeItem(storeKey);
      } catch {
        // Ignore.
      }
      setDone({ clearance: res.clearanceRecommended === true });
      scrollTop();
    } catch (err) {
      const x = intakeError(err);
      if (x.reason === "minor") {
        setMinor(true);
      } else if (x.reason === "invalid" && Object.keys(x.errors).length) {
        const first = STEPS.findIndex((s) => s.fields.some((f) => x.errors[f]));
        setErrors(x.errors);
        if (first >= 0) setStep(first);
        setProblem("Some answers need a fix.");
      } else if (x.reason === "outdated") {
        setProblem("This form was updated. Reload the page and send it again (your answers are kept).");
      } else if (x.code === "resource-exhausted") {
        setProblem("Too many forms were sent from here. Please try again later.");
      } else if (x.code === "not-found") {
        setProblem(`This form isn't available anymore. Please contact ${coach.firstName} directly.`);
      } else if (x.code === "unauthenticated" || x.code === "permission-denied") {
        setProblem("We couldn't verify this browser. Reload the page and try again.");
      } else {
        setProblem("Something went wrong. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  if (minor) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-zinc-200">{minorMessage(coach.firstName)}</p>
        <button onClick={() => { setMinor(false); set("age", ""); }} className="mt-4 text-sm text-zinc-400 hover:text-white">
          ← I entered my age wrong
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div ref={top} className="rounded-2xl border border-[#9EFD06]/30 bg-[#9EFD06]/5 p-6 space-y-3">
        <h2 className="text-xl font-bold">Thanks, {coach.firstName} has your answers</h2>
        <p className="text-zinc-300">{coach.firstName} will contact you to set up your first session.</p>
        {done.clearance && (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
            {doctorNote(coach.firstName)}
          </p>
        )}
        <p className="text-sm text-zinc-500">
          We emailed you a confirmation with a link to delete your answers anytime.
        </p>
      </div>
    );
  }

  const last = step === STEPS.length - 1;
  const answered = a.screening.filter((x) => x !== null).length;

  return (
    <div ref={top} className="scroll-mt-6">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          Step {step + 1} of {STEPS.length} · {STEPS[step].title}
        </span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-zinc-900 overflow-hidden" aria-hidden>
        <div className="h-full bg-[#9EFD06] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <form
        className="mt-6 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (last) void send();
          else next();
        }}
        noValidate
      >
        {/* Bots fill every field; people never see this one. */}
        <div aria-hidden className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        {step === 0 && (
          <>
            <p className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400">
              Your answers go only to {coach.firstName} and are stored by Repflow. Step 5 asks {SCREENING.length} yes/no
              health questions so {coach.firstName} can plan your training safely.{" "}
              <Link href={PRIVACY_PATH} target="_blank" rel="noopener" className="text-zinc-300 underline">
                How your answers are handled
              </Link>
            </p>
            <Field label="Your name" error={errors.name}>
              <input className={input} value={a.name} maxLength={LIMITS.name} autoComplete="name"
                onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className={input} type="email" inputMode="email" autoComplete="email" value={a.email}
                maxLength={LIMITS.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone (optional)" error={errors.phone}>
              <input className={input} type="tel" inputMode="tel" autoComplete="tel" value={a.phone}
                maxLength={LIMITS.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Age" error={errors.age} hint="Coaching on Repflow is for adults (18+).">
              <input className={`${input} max-w-32`} inputMode="numeric" value={a.age} maxLength={3}
                onChange={(e) => set("age", e.target.value.replace(/\D/g, ""))} />
            </Field>
            <Group legend="Best time to reach you (optional)">
              {CONTACT_TIMES.map((c) => (
                <button key={c.id} type="button" aria-pressed={a.contactTime === c.id} className={chip(a.contactTime === c.id)}
                  onClick={() => set("contactTime", a.contactTime === c.id ? null : c.id)}>
                  {c.label}
                </button>
              ))}
            </Group>
            <Field label="Anything about contacting you? (optional)">
              <input className={input} value={a.contactNote} maxLength={LIMITS.contactNote} placeholder="e.g. text first"
                onChange={(e) => set("contactNote", e.target.value)} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Group legend="What do you want from training?" hint="Pick any that fit." error={errors.goals}>
              {GOALS.map((g) => (
                <button key={g.id} type="button" aria-pressed={a.goals.includes(g.id)} className={chip(a.goals.includes(g.id))}
                  onClick={() => set("goals", toggle(a.goals, g.id))}>
                  {g.label}
                </button>
              ))}
            </Group>
            <Field label="In your own words (optional)">
              <textarea className={input} rows={3} value={a.goalText} maxLength={LIMITS.goalText}
                placeholder="e.g. feel strong again after having a baby"
                onChange={(e) => set("goalText", e.target.value)} />
            </Field>
            <fieldset>
              <legend className="text-sm text-zinc-300">Your experience</legend>
              <div className="mt-2 grid gap-2">
                {EXPERIENCE.map((x) => (
                  <button key={x.id} type="button" aria-pressed={a.experience === x.id}
                    onClick={() => set("experience", x.id)}
                    className={`text-left rounded-xl border px-4 py-3 ${a.experience === x.id ? "border-[#9EFD06] bg-[#9EFD06]/10" : "border-zinc-800 hover:border-zinc-600"}`}>
                    <div className={`font-semibold ${a.experience === x.id ? "text-[#9EFD06]" : ""}`}>{x.label}</div>
                    <div className="text-xs text-zinc-400">{x.hint}</div>
                  </button>
                ))}
              </div>
              {errors.experience && <p role="alert" className="mt-1 text-xs text-red-400">{errors.experience}</p>}
            </fieldset>
            <Group legend={`What do you want from ${coach.firstName}?`} error={errors.scope}>
              {SCOPES.map((s) => (
                <button key={s.id} type="button" aria-pressed={a.scope === s.id} className={chip(a.scope === s.id)}
                  onClick={() => set("scope", s.id)}>
                  {s.label}
                </button>
              ))}
            </Group>
            {a.scope === "training_diet" && (
              <div className="rounded-2xl border border-zinc-800 p-4 space-y-4">
                <p className="text-xs text-zinc-500">For your diet plan. All optional.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Current weight (lb)" error={errors.weightLb}>
                    <input className={input} inputMode="decimal" value={a.diet.weightLb} maxLength={5}
                      onChange={(e) => set("diet", { ...a.diet, weightLb: e.target.value.replace(/[^\d.]/g, "") })} />
                  </Field>
                  <Field label="Goal weight (lb)" error={errors.goalWeightLb}>
                    <input className={input} inputMode="decimal" value={a.diet.goalWeightLb} maxLength={5}
                      onChange={(e) => set("diet", { ...a.diet, goalWeightLb: e.target.value.replace(/[^\d.]/g, "") })} />
                  </Field>
                </div>
                <Field label="Food restrictions or allergies">
                  <input className={input} value={a.diet.restrictions} maxLength={LIMITS.restrictions}
                    onChange={(e) => set("diet", { ...a.diet, restrictions: e.target.value })} />
                </Field>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Group legend="Days a week you can train" error={errors.daysPerWeek}>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button key={n} type="button" aria-pressed={a.daysPerWeek === n} className={`${chip(a.daysPerWeek === n)} w-12 px-0`}
                  onClick={() => set("daysPerWeek", n)}>
                  {n}
                </button>
              ))}
            </Group>
            <Group legend="Time per session" error={errors.sessionMinutes}>
              {SESSION_MINUTES.map((m) => (
                <button key={m} type="button" aria-pressed={a.sessionMinutes === m} className={chip(a.sessionMinutes === m)}
                  onClick={() => set("sessionMinutes", m)}>
                  {m >= 90 ? "90+ min" : `${m} min`}
                </button>
              ))}
            </Group>
            <fieldset>
              <legend className="text-sm text-zinc-300">Where you&apos;ll train</legend>
              <div className="mt-2 grid gap-2">
                {PLACES.map((p) => (
                  <button key={p.id} type="button" aria-pressed={a.place === p.id} onClick={() => set("place", p.id)}
                    className={`text-left rounded-xl border px-4 py-3 ${a.place === p.id ? "border-[#9EFD06] bg-[#9EFD06]/10" : "border-zinc-800 hover:border-zinc-600"}`}>
                    <span className={`font-semibold ${a.place === p.id ? "text-[#9EFD06]" : ""}`}>{p.label}</span>
                    {p.hint && <span className="text-xs text-zinc-400"> · {p.hint}</span>}
                  </button>
                ))}
              </div>
              {errors.place && <p role="alert" className="mt-1 text-xs text-red-400">{errors.place}</p>}
            </fieldset>
            {a.place === "home" && (
              <Group legend="What you have at home" hint="Pick everything you can use.">
                {HOME_EQUIPMENT.map((h) => (
                  <button key={h.id} type="button" aria-pressed={a.owned.includes(h.id)} className={chip(a.owned.includes(h.id))}
                    onClick={() => set("owned", toggle(a.owned, h.id))}>
                    {h.label}
                  </button>
                ))}
              </Group>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Group legend="Any injuries or areas to protect?" hint="Pick the areas, or None." error={errors.injuryAreas}>
              <button type="button" aria-pressed={a.injuriesNone} className={chip(a.injuriesNone)}
                onClick={() => setA((x) => ({ ...x, injuriesNone: !x.injuriesNone, injuryAreas: [] }))}>
                None
              </button>
              {INJURY_AREAS.map((i) => (
                <button key={i.id} type="button" aria-pressed={a.injuryAreas.includes(i.id)} className={chip(a.injuryAreas.includes(i.id))}
                  onClick={() => setA((x) => ({ ...x, injuriesNone: false, injuryAreas: toggle(x.injuryAreas, i.id) }))}>
                  {i.label}
                </button>
              ))}
            </Group>
            {!a.injuriesNone && (
              <Field label="Tell us more (optional)">
                <textarea className={input} rows={3} value={a.injuryDetails} maxLength={LIMITS.injuryDetails}
                  placeholder="e.g. left knee surgery in 2022, fine for most things"
                  onChange={(e) => set("injuryDetails", e.target.value)} />
              </Field>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-sm text-zinc-400">
              A standard health check before starting a new exercise program. If you answer yes to any
              question, check with your doctor before you start. {coach.firstName} will see your answers.
            </p>
            <ol className="space-y-3">
              {SCREENING.map((q, i) => (
                <li key={i} className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-sm text-zinc-200">
                    {i + 1}. {q}
                  </p>
                  <div className="mt-3 flex gap-2" role="radiogroup" aria-label={`Question ${i + 1}`}>
                    {[true, false].map((v) => (
                      <button key={String(v)} type="button" role="radio" aria-checked={a.screening[i] === v}
                        className={`${chip(a.screening[i] === v)} w-20`}
                        onClick={() => set("screening", a.screening.map((x, j) => (j === i ? v : x)))}>
                        {v ? "Yes" : "No"}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-xs text-zinc-500">{answered} of {SCREENING.length} answered</p>
            {errors.screening && <p role="alert" className="text-xs text-red-400">{errors.screening}</p>}
          </>
        )}

        {step === 5 && (
          <>
            <Field label="Anything else your coach should know? (optional)">
              <textarea className={input} rows={4} value={a.notes} maxLength={LIMITS.notes}
                placeholder="e.g. I work night shifts twice a week"
                onChange={(e) => set("notes", e.target.value)} />
            </Field>
            <div className="space-y-3">
              <label className="flex gap-3 items-start rounded-xl border border-zinc-800 p-4">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[#9EFD06]" checked={consent}
                  onChange={(e) => setConsent(e.target.checked)} />
                <span className="text-sm text-zinc-200">
                  {/* consentText (intake-format.ts) with its two links. */}
                  {consentLead(coach.name)} the{" "}
                  <Link href={PRIVACY_PATH} target="_blank" rel="noopener" className="text-[#9EFD06] underline">
                    Privacy Policy
                  </Link>{" "}
                  and the{" "}
                  <Link href={HEALTH_PRIVACY_PATH} target="_blank" rel="noopener" className="text-[#9EFD06] underline">
                    Consumer Health Data Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.consent && <p role="alert" className="text-xs text-red-400">{errors.consent}</p>}
              <label className="flex gap-3 items-start rounded-xl border border-zinc-800 p-4">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[#9EFD06]" checked={aiConsent}
                  onChange={(e) => setAiConsent(e.target.checked)} />
                <span className="text-sm text-zinc-300">
                  <span className="text-xs text-zinc-500 block mb-0.5">Optional</span>
                  {aiConsentText(coach.name)}
                </span>
              </label>
            </div>
            {!verifyReady && (
              <p className="text-xs text-amber-300">This form can&apos;t be sent right now. Please try again later.</p>
            )}
          </>
        )}

        {problem && (
          <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {problem}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          {step > 0 && (
            <button type="button" onClick={back} disabled={sending}
              className="min-h-12 px-5 rounded-full border border-zinc-800 text-zinc-300 hover:text-white">
              Back
            </button>
          )}
          <button type="submit" disabled={sending || (last && !verifyReady)}
            className="flex-1 min-h-12 rounded-full bg-[#9EFD06] text-black font-bold disabled:opacity-50">
            {last ? (sending ? "Sending…" : `Send to ${coach.firstName}`) : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}
