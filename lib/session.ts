import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase-admin";

export const SESSION_COOKIE_NAME = "rf_session";

export type SessionUser = {
  uid: string;
  email: string | null;
  name: string | null;
};

/**
 * Reads the session cookie and verifies the Firebase ID token server-side.
 * Returns null if no cookie or the token is invalid/expired.
 *
 * Use in any server component or route handler.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Convenience: throw a redirect if not signed in.
 * Call from server components that require auth.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}