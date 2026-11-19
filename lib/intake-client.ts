"use client";

import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { httpsCallable } from "firebase/functions";
import { firebaseApp, functions } from "@/lib/firebase-client";

/**
 * Client side of the coach intake form (functions/src/intake.ts).
 *
 * submitIntake enforces App Check, so the form page starts it with
 * reCAPTCHA Enterprise (NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY); the
 * callable then sends the token by itself. Only the intake pages start it:
 * the rest of the site doesn't use App Check. In development (localhost)
 * it uses an App Check debug token instead (printed in the browser console
 * on first load; add it in Firebase → App Check → Manage debug tokens, or
 * set NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN).
 */

let appCheck: AppCheck | null = null;

/** Starts App Check once. False when there's no site key (form can't send). */
export function startAppCheck(): boolean {
  if (appCheck) return true;
  if (typeof window === "undefined") return false;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (process.env.NODE_ENV !== "production") {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean })
      .FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN || true;
  }
  if (!siteKey) return false;
  try {
    appCheck = initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    return true;
  } catch (e) {
    // Already started (e.g. a hot reload in development).
    console.warn("App Check:", e);
    return true;
  }
}

/** code / codeExpiresAt (build 36 functions): the person's single-use
 * coach code, shown on the thank-you page. Missing from older functions. */
export type SubmitIntakeResult = {
  ok: true;
  coachName?: string;
  clearanceRecommended?: boolean;
  code?: string;
  codeExpiresAt?: string;
};

const _submitIntake = httpsCallable<Record<string, unknown>, SubmitIntakeResult>(
  functions, "submitIntake", { timeout: 30000 });
const _deleteIntake = httpsCallable<Record<string, unknown>, { ok: boolean; alreadyDeleted?: boolean }>(
  functions, "deleteIntakeByToken", { timeout: 30000 });

export async function submitIntake(data: Record<string, unknown>): Promise<SubmitIntakeResult> {
  return (await _submitIntake(data)).data;
}

export async function deleteIntake(c: string, l: string, t: string) {
  return (await _deleteIntake({ c, l, t })).data;
}

/** A callable error as {code, reason, errors, message}. */
export function intakeError(err: unknown): {
  code: string;
  reason: string | null;
  errors: Record<string, string>;
  message: string;
} {
  const e = err as { code?: string; message?: string; details?: { reason?: string; errors?: Record<string, string> } };
  return {
    code: (e.code ?? "").replace(/^functions\//, ""),
    reason: e.details?.reason ?? null,
    errors: e.details?.errors ?? {},
    message: e.message ?? "Something went wrong.",
  };
}
