"use client";

import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { errorText } from "@/lib/coach-library-client";
import { setIntakeEnabled } from "@/lib/coach-leads-client";

/** Always the live site, so a printed QR code works from anywhere. */
const SITE = "https://repflowcoach.com";

/**
 * "Your intake form" (New clients): the on / off switch
 * (coaches/{c}.intakeEnabled via setIntakeEnabled), the link with Copy,
 * the QR code (?src=qr) with a PNG download, and Preview.
 */
export default function IntakeShareCard({ handle, enabled }: { handle: string; enabled: boolean }) {
  const router = useRouter();
  const link = `${SITE}/c/${handle}/start`;
  const qrLink = `${link}?src=qr`;
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(qrLink, { width: 600, margin: 2, errorCorrectionLevel: "M" })
      .then(setQr)
      .catch(() => setQr(null));
  }, [qrLink]);

  async function toggle() {
    const next = !on;
    if (
      next &&
      !window.confirm(
        "Turn on your intake form? Anyone with the link can send you their goals, schedule, injuries and " +
          "health screening answers before their first session. You get an email for each one.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setIntakeEnabled({ enabled: next });
      setOn(next);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
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
