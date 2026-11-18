import type { Metadata } from "next";
import DeleteIntake from "@/components/intake/DeleteIntake";

export const metadata: Metadata = {
  title: "Delete your intake answers · Repflow",
  robots: { index: false, follow: false },
};

/**
 * /intake/delete?c={coach}&l={lead}&t={token}: the link in the intake
 * confirmation email (functions/src/intake.ts confirmEmail). Deletes only
 * when the person presses the button: email scanners open links by
 * themselves.
 */
export default async function DeleteIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* The Repflow mark is in the site header above. */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Delete your intake answers</h1>
        <div className="mt-6">
          <DeleteIntake c={one(q.c)} l={one(q.l)} t={one(q.t)} />
        </div>
      </div>
    </main>
  );
}
