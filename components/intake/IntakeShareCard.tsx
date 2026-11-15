"use client";

import QRCode from "qrcode";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorText } from "@/lib/coach-library-client";
import { setIntakeEnabled } from "@/lib/coach-leads-client";
import { INTAKE_COACH_TERMS } from "@/lib/intake-format";

/** Always the live site, so a printed QR code works from anywhere. */
const SITE = "https://repflowcoach.com";

/**
 * "Your intake form" (New clients): the on / off switch
 * (coaches/{c}.intakeEnabled via setIntakeEnabled), the link with Copy,
 * the QR code (?src=qr) with a PNG download, and Preview. Turning it on
 * first asks the coach to agree to INTAKE_COACH_TERMS (saved by
 * setIntakeEnabled with acceptTerms); a form that's on without the
 * current agreement shows the same panel with "Agree".
 */
export default function IntakeShareCard({
  handle,
  enabled,
  termsAgreed,
}: {
  handle: string;
  enabled: boolean;
  termsAgreed: boolean;
}) {
  const router = useRouter();
  const link = `${SITE}/c/${handle}/start`;
  const qrLink = `${link}?src=qr`;
  const [on, setOn] = useState(enabled);
  const [agreed, setAgreed] = useState(termsAgreed);
  const [askTerms, setAskTerms] = useState(false);
  const [ticked, setTicked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const showTerms = !agreed && (askTerms || on);

  useEffect(() => {
    QRCode.toDataURL(qrLink, { width: 600, margin: 2, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(null));
  }, [qrLink]);

  async function save(next: boolean, acceptTerms = false) {
    setBusy(true);
    setError(null);
    try {
      await setIntakeEnabled({ enabled: next, ...(acceptTerms ? { acceptTerms: true } : {}) });
      setOn(next);
      if (acceptTerms) {
        setAgreed(true);
        setAskTerms(false);
      }
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    const next = !on;
    if (next && !agreed) {
      setAskTerms(true);
      return;
    }
    if (
      next &&
      !window.confirm(
        "Turn on your intake form? Anyone with the link can send you their goals, schedule, injuries and " +
          "health screening answers before their first session. You get an email for each one.",
      )
    ) {
      return;
    }
    void save(next);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy your intake form link:", link);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Your intake form</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            For people who aren&apos;t on Repflow yet: they answer a few questions before your first session.
          </p>
        </div>
        <button
          role="switch"
          aria-checked={on}
          aria-label="Intake form"
          onClick={toggle}
          disabled={busy}
          className={`shrink-0 relative w-12 h-7 rounded-full transition ${on ? "bg-[#9EFD06]" : "bg-zinc-700"} disabled:opacity-50`}
        >
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-black transition ${on ? "left-6" : "left-1"}`} />
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}

      {showTerms && (
        <div className="mt-4 rounded-xl border border-[#9EFD06]/40 bg-[#9EFD06]/5 p-4 space-y-3">
          <p className="text-sm font-semibold">{on ? "Agree to keep your form on" : "Before you turn it on"}</p>
          <p className="text-sm text-zinc-400">
            People send you their goals, injuries and health screening answers through this form. You agree:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-300">
            {INTAKE_COACH_TERMS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="text-xs text-zinc-500">
            Also in the{" "}
            <Link href="/terms" target="_blank" rel="noopener" className="underline hover:text-zinc-300">
              Terms of Service
            </Link>{" "}
            (8. Coaches). What the form collects and how long it&apos;s kept:{" "}
            <Link href="/privacy#intake" target="_blank" rel="noopener" className="underline hover:text-zinc-300">
              Privacy Policy
            </Link>
            .
          </p>
          <label className="flex items-center gap-2 text-sm text-zinc-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#9EFD06]"
              checked={ticked}
              onChange={(e) => setTicked(e.target.checked)}
            />
            I agree
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!ticked || busy}
              onClick={() => void save(true, true)}
              className="rounded-full bg-[#9EFD06] text-black text-sm font-semibold px-4 py-1.5 disabled:opacity-40"
            >
              {busy ? "Saving…" : on ? "Agree" : "Turn on form"}
            </button>
            {!on && (
              <button
                disabled={busy}
                onClick={() => {
                  setAskTerms(false);
                  setTicked(false);
                }}
                className="rounded-full border border-zinc-700 text-sm px-4 py-1.5 hover:border-zinc-500"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {on ? (
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR code for your intake form" className="w-36 h-36 rounded-lg bg-white p-1 self-start" />
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="rounded-lg bg-black border border-zinc-800 px-3 py-2 text-sm font-mono text-zinc-300 break-all">
              {link}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={copy} className="rounded-full bg-[#9EFD06] text-black text-sm font-semibold px-4 py-1.5">
                {copied ? "Copied" : "Copy link"}
              </button>
              {qr && (
                <a
                  href={qr}
                  download={`repflow-intake-${handle}.png`}
                  className="rounded-full border border-zinc-700 text-sm px-4 py-1.5 hover:border-zinc-500"
                >
                  Download QR
                </a>
              )}
              <a
                href={link}
                target="_blank"
                rel="noopener"
                className="rounded-full border border-zinc-700 text-sm px-4 py-1.5 hover:border-zinc-500"
              >
                Preview ↗
              </a>
            </div>
            <p className="text-xs text-zinc-500">
              The QR code opens the same form. Forms that never become clients are deleted after 180 days.
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">Off: the link shows a not-found page until you turn it on.</p>
      )}
    </section>
  );
}
