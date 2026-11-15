import { adminDb } from "@/lib/firebase-admin";
import { intakeTermsCurrent, type IntakeAnswers } from "@/lib/intake-format";

/**
 * Intake leads for the coach portal (New clients), read with the Admin
 * SDK after requireCoach (rules deny clients). Written only by the
 * functions in functions/src/intake.ts and leads.ts. Timestamps become ISO
 * strings so pages can hand them to client components.
 */

export type LeadStatus = "new" | "contacted" | "invited" | "archived";

export type LeadView = {
  id: string;
  status: LeadStatus;
  answers: IntakeAnswers;
  clearanceRecommended: boolean;
  consent: { version: number; at: string | null; ai: boolean };
  source: "link" | "qr";
  submissions: number;
  createdAt: string | null;
  updatedAt: string | null;
  deleteAfter: string | null;
  archivedAt: string | null;
  planProgramId: string | null;
  /** live = not expired when the page was loaded. */
  invite: { code: string; expiresAt: string | null; emailedAt: string | null; live: boolean } | null;
};

export type ClientIntakeView = {
  answers: IntakeAnswers;
  clearanceRecommended: boolean;
  consent: { version: number; at: string | null; ai: boolean };
  submittedAt: string | null;
  joinedAt: string | null;
};

type Raw = Record<string, unknown>;

function iso(v: unknown): string | null {
  const t = v as { toDate?: () => Date } | string | null | undefined;
  if (!t) return null;
  if (typeof t === "string") return t;
  return typeof t.toDate === "function" ? t.toDate().toISOString() : null;
}

function consentOf(v: unknown): LeadView["consent"] {
  const c = (v ?? {}) as Raw;
  return { version: Number(c.version ?? 0), at: iso(c.at), ai: c.ai === true };
}

function leadOf(id: string, d: Raw): LeadView {
  const invite = d.invite as Raw | undefined;
  const expiresAt = invite ? iso(invite.expiresAt) : null;
  return {
    id,
    status: (["new", "contacted", "invited", "archived"].includes(String(d.status))
      ? d.status
      : "new") as LeadStatus,
    answers: d.answers as IntakeAnswers,
    clearanceRecommended: d.clearanceRecommended === true,
    consent: consentOf(d.consent),
    source: d.source === "qr" ? "qr" : "link",
    submissions: Number(d.submissions ?? 1),
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
    deleteAfter: iso(d.deleteAfter),
    archivedAt: iso(d.archivedAt),
    planProgramId: typeof d.planProgramId === "string" ? d.planProgramId : null,
    invite: invite && typeof invite.code === "string"
      ? {
          code: invite.code,
          expiresAt,
          emailedAt: iso(invite.emailedAt),
          live: expiresAt ? new Date(expiresAt).getTime() > Date.now() : false,
        }
      : null,
  };
}

const leads = (coachId: string) =>
  adminDb.collection("coaches").doc(coachId).collection("leads");

/** Newest first (at most 200; older ones are purged after 180 days idle). */
export async function listLeads(coachId: string): Promise<LeadView[]> {
  const snap = await leads(coachId).orderBy("createdAt", "desc").limit(200).get();
  return snap.docs.map((d) => leadOf(d.id, d.data()));
}

export async function getLead(coachId: string, id: string): Promise<LeadView | null> {
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
  const d = await leads(coachId).doc(id).get();
  return d.exists ? leadOf(d.id, d.data() ?? {}) : null;
}

/** Unread leads, for the Clients page link. */
export async function countNewLeads(coachId: string): Promise<number> {
  const snap = await leads(coachId).where("status", "==", "new").count().get();
  return snap.data().count;
}

/**
 * Whether the coach's form is on (coaches/{c}.intakeEnabled) and whether
 * they've agreed to the current coach terms (coaches/{c}.intakeTerms).
 */
export async function intakeSettings(coachId: string): Promise<{ enabled: boolean; termsAgreed: boolean }> {
  const d = await adminDb.collection("coaches").doc(coachId).get();
  return { enabled: d.get("intakeEnabled") === true, termsAgreed: intakeTermsCurrent(d.get("intakeTerms")) };
}

/** The intake a client joined with (linkCoachByInviteCode), if any. */
export async function getClientIntake(coachId: string, clientId: string): Promise<ClientIntakeView | null> {
  const d = await adminDb
    .collection("coaches").doc(coachId)
    .collection("clients").doc(clientId)
    .collection("intake").doc("answers").get();
  if (!d.exists) return null;
  const x = d.data() ?? {};
  if (!x.answers) return null;
  return {
    answers: x.answers as IntakeAnswers,
    clearanceRecommended: x.clearanceRecommended === true,
    consent: consentOf(x.consent),
    submittedAt: iso(x.submittedAt),
    joinedAt: iso(x.joinedAt),
  };
}
