import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getPrivateKey(): string {
  // Prefer base64-encoded key when available — survives any env-var
  // text mangling that may corrupt embedded \n escapes (Vercel,
  // Cloud Run, etc.). Fall back to legacy plain-text key for local dev.
  const base64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  if (base64 && base64.length > 0) {
    return Buffer.from(base64, "base64").toString("utf8");
  }

  const plain = process.env.FIREBASE_PRIVATE_KEY;
  if (plain && plain.length > 0) {
    return plain.replace(/\\n/g, "\n");
  }

  throw new Error(
    "Firebase Admin: missing FIREBASE_PRIVATE_KEY_BASE64 or FIREBASE_PRIVATE_KEY env var",
  );
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);