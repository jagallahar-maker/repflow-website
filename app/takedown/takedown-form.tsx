"use client";

import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { functions } from "@/lib/firebase-client";

// Same fields as the app's TakedownRequestScreen; both go to the
// submitTakedownRequest function (functions/src/takedown.ts).
type Kind = "intimate" | "copyright";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600";

export default function TakedownForm() {
  const [kind, setKind] = useState<Kind>("intimate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState<"self" | "authorized">("self");
  const [work, setWork] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [accuracy, setAccuracy] = useState(false);
  const [signature, setSignature] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const intimate = kind === "intimate";

  function missing(): string | null {
    const m = [
      name.trim().length < 2 && "your full name",
      !EMAIL_RE.test(email.trim()) && "a valid email",
      !intimate && work.trim().length < 3 && "the copyrighted work",
      location.trim().length < 3 && "where the content is",
      !goodFaith && "the good-faith statement",
      !intimate && !accuracy && "the accuracy statement",
      signature.trim().length < 2 && "your signature",
    ].filter(Boolean);
    return m.length ? `Please add ${m.join(", ")}.` : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = missing();
    if (m) {
      setError(m);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const submit = httpsCallable<Record<string, unknown>, { reference?: string }>(
        functions,
        "submitTakedownRequest",
      );
      const res = await submit({
        kind,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        description: description.trim(),
        ...(intimate ? { relationship } : { work: work.trim(), accuracy }),
        goodFaith,
        signature: signature.trim(),
        website,
        source: "web",
      });
      setReference(res.data.reference ?? "received");
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "";
      setError(
        message && !message.startsWith("internal")
          ? message
          : "Couldn't send the request. Please email repflowtraining@gmail.com.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (reference) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
        <div className="text-2xl font-bold">Request received</div>
        <p className="mt-3 text-zinc-400">
          {intimate
            ? "We review it right away and remove the image, and identical copies we can find, within 48 hours of a valid request."
            : "We review copyright notices within 24 hours."}{" "}
          We&apos;ll reply to {email.trim()}.
        </p>
        <p className="mt-3 text-sm text-zinc-500">Reference: {reference}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      <fieldset className="flex gap-2">
        <legend className="sr-only">Type of request</legend>
        {(["intimate", "copyright"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setGoodFaith(false);
              setAccuracy(false);
            }}
            className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold border transition ${
              kind === k
                ? "bg-lime-400 text-black border-lime-400"
                : "bg-black text-zinc-300 border-zinc-800 hover:border-zinc-600"
            }`}
          >
            {k === "intimate" ? "Intimate image" : "Copyright"}
          </button>
        ))}
      </fieldset>

      <Section title="Your contact details">
        <input className={inputClass} placeholder="Full name" value={name}
          maxLength={120} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        <input className={inputClass} placeholder="Email" type="email" value={email}
          maxLength={200} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input className={inputClass} placeholder="Phone (optional)" type="tel" value={phone}
          maxLength={40} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      </Section>

      {intimate ? (
        <Section title="You are">
          {(
            [
              ["self", "The person shown"],
              ["authorized", "Authorized to act for them"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 text-zinc-200">
              <input
                type="radio"
                name="relationship"
                checked={relationship === value}
                onChange={() => setRelationship(value)}
                className="accent-lime-400"
              />
              {label}
            </label>
          ))}
        </Section>
      ) : (
        <Section title="Your work">
          <textarea className={inputClass} rows={3} maxLength={2000}
            placeholder="The copyrighted work: what it is, and a link to the original if there is one"
            value={work} onChange={(e) => setWork(e.target.value)} />
        </Section>
      )}

      <Section title="Where it is on Repflow">
        <textarea className={inputClass} rows={3} maxLength={2000}
          placeholder="The @username, which post (date, caption) or comment, or anything that helps us find it"
          value={location} onChange={(e) => setLocation(e.target.value)} />
        <textarea className={inputClass} rows={3} maxLength={2000}
          placeholder={intimate ? "Anything else we should know (optional)" : "Details (optional)"}
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </Section>

      <Section title="Statements">
        <Check checked={goodFaith} onChange={setGoodFaith}>
          {intimate
            ? "I have a good-faith belief that this intimate image was published without the consent of the person shown."
            : "I have a good-faith belief that this use is not authorized by the copyright owner, its agent, or the law."}
        </Check>
        {!intimate && (
          <Check checked={accuracy} onChange={setAccuracy}>
            Under penalty of perjury, the information in this notice is accurate
            and I am the owner, or authorized to act for the owner.
          </Check>
        )}
      </Section>

      <Section title="Signature">
        <input className={inputClass} placeholder="Type your full name as your signature"
          value={signature} maxLength={120} onChange={(e) => setSignature(e.target.value)} />
      </Section>

      {/* Honeypot: hidden from people, filled by bots. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        name="website"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-lime-400 text-black px-6 py-3 rounded-full font-bold hover:bg-lime-300 transition disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-zinc-200 leading-relaxed">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-lime-400"
      />
      <span>{children}</span>
    </label>
  );
}
