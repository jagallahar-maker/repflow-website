import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support — Repflow",
  description:
    "Get help with Repflow. Common questions, troubleshooting, and how to contact support.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition inline-flex items-center gap-2"
        >
          <span aria-hidden>←</span> Back to Repflow
        </Link>

        <h1 className="mt-8 text-4xl sm:text-5xl font-black tracking-tight">
          Support
        </h1>
        <p className="mt-4 text-zinc-400 text-lg leading-relaxed">
          Need help with Repflow? Most questions are answered below. If
          you don&apos;t find what you&apos;re looking for, email us
          directly — we read every message.
        </p>

        <div className="mt-8 bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                Contact
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                repflowtraining@gmail.com
              </div>
              <p className="mt-2 text-sm text-zinc-400">
                Typical response time: 1–2 business days.
              </p>
            </div>
            <a
              href="mailto:repflowtraining@gmail.com"
              className="inline-flex items-center justify-center bg-lime-400 text-black px-6 py-3 rounded-full font-bold hover:bg-lime-300 transition whitespace-nowrap"
            >
              Email support
            </a>
          </div>
        </div>

        <SectionHeading>Account</SectionHeading>

        <FAQ question="How do I delete my account?">
          <p>
            Email{" "}
            <SupportLink>repflowtraining@gmail.com</SupportLink> from the
            email address on your account and ask for account deletion.
            Your account and all associated data — workouts, photos,
            measurements, nutrition logs — will be permanently deleted
            within 30 days.
          </p>
        </FAQ>

        <FAQ question="How do I reset my password?">
          <p>
            On the sign-in screen, tap &quot;Forgot password?&quot; and
            enter your email. You&apos;ll get a reset link from Firebase
            Authentication. Check your spam folder if it doesn&apos;t
            arrive within a few minutes.
          </p>
        </FAQ>

        <FAQ question="How do I export my data?">
          <p>
            Email{" "}
            <SupportLink>repflowtraining@gmail.com</SupportLink> from your
            account email and we&apos;ll send you a JSON export of your
            account data. Self-serve export inside the app is on the
            roadmap.
          </p>
        </FAQ>

        <FAQ question="Can I sign in on multiple devices?">
          <p>
            Yes. Repflow syncs your account across iPhone and iPad. Sign
            in with the same email on each device and your data will sync
            automatically.
          </p>
        </FAQ>

        <SectionHeading>Apple Health</SectionHeading>

        <FAQ question="My workouts aren't syncing to Apple Health. What do I do?">
          <p>
            First, check that you granted permission. Go to the iOS{" "}
            <strong className="text-white">Health</strong> app → tap your
            profile picture → <strong className="text-white">Apps</strong>{" "}
            → <strong className="text-white">Repflow</strong>. Make sure
            all the data categories you want synced are toggled on.
          </p>
          <p>
            If permissions look correct but sync is still broken, open
            Repflow → <strong className="text-white">Settings</strong> →{" "}
            <strong className="text-white">Apple Health Integration</strong>{" "}
            and tap <strong className="text-white">Grant Permissions</strong>{" "}
            again. iOS sometimes requires re-prompting after an app
            update.
          </p>
          <p>
            Still stuck? Email us with the device model and iOS version
            and we&apos;ll dig in.
          </p>
        </FAQ>

        <FAQ question="Will Repflow read my entire Apple Health history?">
          <p>
            Repflow only reads recent workouts, steps, heart rate, and
            active energy needed for your current activity feed and
            interval coaching. We don&apos;t bulk-import historical data.
            Your raw Apple Health data never leaves your device — Repflow
            only stores what it needs for the workout you just completed.
          </p>
        </FAQ>

        <SectionHeading>Workouts &amp; tracking</SectionHeading>

        <FAQ question="My GPS route looks wrong / shows weird jumps.">
          <p>
            GPS can be flaky in dense urban areas, indoor spaces, or under
            heavy tree cover. Repflow filters out the worst noise but some
            jumps can slip through. For best accuracy:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              Make sure <strong className="text-white">Location Services</strong>{" "}
              is set to <strong className="text-white">Always</strong> for
              Repflow (iOS Settings → Privacy &amp; Security → Location
              Services → Repflow)
            </li>
            <li>
              Wait until you have a GPS lock (you&apos;ll see your
              position update on the map) before tapping Start
            </li>
            <li>
              Avoid starting a session while your phone is still in your
              pocket — give it a moment to acquire satellites
            </li>
          </ul>
        </FAQ>

        <FAQ question="I lost a workout I just logged. Can I recover it?">
          <p>
            Workouts sync to the cloud as you complete them, so they
            should persist across reinstalls and device changes. If a
            workout is missing, try pulling down to refresh on the
            workout history screen. If it&apos;s still gone, email us
            with the approximate date and time and we can check the
            server-side record.
          </p>
        </FAQ>

        <FAQ question="How do rest timers and audio cues work?">
          <p>
            Rest timers and audio cues run on your device and don&apos;t
            interrupt music — they use haptic feedback so you feel the
            cue without anything pausing. You can fine-tune which cues
            fire (set start, set complete, rest start, rest complete) in{" "}
            <strong className="text-white">Settings</strong> →{" "}
            <strong className="text-white">Audio Cues</strong>.
          </p>
        </FAQ>

        <SectionHeading>Friends &amp; social</SectionHeading>

        <FAQ question="How does &quot;Find from Contacts&quot; work?">
          <p>
            Repflow checks which of your phone contacts are also on
            Repflow without sending us your contact list. Phone numbers
            from your address book are hashed on your device using
            SHA-256, and only the hashes are sent to our server to match
            against existing users. Hashes that don&apos;t match are
            discarded immediately.
          </p>
          <p>
            If you tap &quot;Find from Contacts&quot; and don&apos;t see
            any matches, it just means none of your contacts have set up
            their phone number on Repflow yet.
          </p>
        </FAQ>

        <FAQ question="Why doesn't anyone find me when they search by phone?">
          <p>
            You need to add your phone number in Repflow first. Go to{" "}
            <strong className="text-white">Profile</strong> →{" "}
            <strong className="text-white">Edit Profile</strong> → enter
            your number. Once saved, friends who have you in their
            contacts can find you via the phone discovery flow.
          </p>
          <p>
            Your raw phone number stays on your device only — Repflow
            stores just a hashed version on the server, so other users
            can&apos;t see your actual number.
          </p>
        </FAQ>

        <FAQ question="How do I remove a friend?">
          <p>
            Open the <strong className="text-white">Social</strong> tab →{" "}
            <strong className="text-white">Friends</strong> → tap the menu
            (three dots) next to the friend you want to remove → select{" "}
            <strong className="text-white">Remove friend</strong>. They
            won&apos;t be notified. You can re-add them later if you want.
          </p>
        </FAQ>

        <SectionHeading>Permissions</SectionHeading>

        <FAQ question="Why does Repflow ask for so many permissions?">
          <p>
            Each permission powers a specific feature, and you can deny
            any of them and still use the rest of the app:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>
              <strong className="text-white">Camera</strong> — progress
              photos, food barcode scanning, nutrition label scanning
            </li>
            <li>
              <strong className="text-white">Photo library</strong> —
              importing existing photos as progress photos
            </li>
            <li>
              <strong className="text-white">Location</strong> — outdoor
              cardio GPS routes (only active during a tracked workout)
            </li>
            <li>
              <strong className="text-white">Contacts</strong> — friend
              discovery via &quot;Find from Contacts&quot; (you have to
              tap that button — Repflow never reads contacts in the
              background)
            </li>
            <li>
              <strong className="text-white">Apple Health</strong> —
              workout sync and heart-rate-based interval coaching
            </li>
          </ul>
          <p>
            Any permission can be revoked anytime in iOS{" "}
            <strong className="text-white">
              Settings → Privacy &amp; Security
            </strong>
            .
          </p>
        </FAQ>

        <SectionHeading>App &amp; technical</SectionHeading>

        <FAQ question="The app is crashing or freezing.">
          <p>
            First, force-quit and reopen Repflow. If that doesn&apos;t
            help, restart your device. If the issue persists, please
            email us with:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Device model (e.g., iPhone 15 Pro)</li>
            <li>iOS version (Settings → General → About)</li>
            <li>What you were doing when it crashed</li>
            <li>How often it happens</li>
          </ul>
          <p>
            Repflow uses Firebase Crashlytics to capture crash diagnostics
            automatically (no personal data — just device state at the
            time of crash), so we may already have logs from your session.
          </p>
        </FAQ>

        <FAQ question="How do I update Repflow?">
          <p>
            Open the App Store → tap your profile picture → scroll to
            find Repflow under available updates → tap{" "}
            <strong className="text-white">Update</strong>. Or enable{" "}
            <strong className="text-white">Automatic Updates</strong> in
            App Store settings to get new versions as they ship.
          </p>
        </FAQ>

        <FAQ question="Is Repflow available on Android?">
          <p>
            Not yet. Repflow is currently iOS-only. An Android version
            is on the roadmap but doesn&apos;t have a release date.
          </p>
        </FAQ>

        <SectionHeading>Feedback &amp; bug reports</SectionHeading>

        <FAQ question="I have a feature idea. How do I share it?">
          <p>
            Email{" "}
            <SupportLink>repflowtraining@gmail.com</SupportLink> with the
            subject line starting with &quot;Feature request:&quot;. We
            read every email and your suggestions directly shape the
            roadmap.
          </p>
        </FAQ>

        <FAQ question="I found a bug. How do I report it?">
          <p>
            Email{" "}
            <SupportLink>repflowtraining@gmail.com</SupportLink> with as
            much detail as you can — what you were doing, what happened
            vs. what you expected, your device model, and screenshots if
            relevant. Subject line starting with &quot;Bug:&quot; helps
            us triage faster.
          </p>
        </FAQ>

        <div className="mt-20 pt-8 border-t border-zinc-900 text-center">
          <p className="text-zinc-400">
            Still need help?{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2 font-medium"
            >
              Email us
            </a>
            .
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            ← Back to Repflow
          </Link>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-14 mb-4 text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">
      {children}
    </h2>
  );
}

function FAQ({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group border-b border-zinc-900 py-5">
      <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
        <span className="text-base sm:text-lg font-semibold text-white group-hover:text-lime-400 transition">
          {question}
        </span>
        <span
          aria-hidden
          className="text-zinc-500 text-xl leading-none mt-0.5 select-none transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="mt-4 space-y-3 text-zinc-300 leading-relaxed">
        {children}
      </div>
    </details>
  );
}

function SupportLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href="mailto:repflowtraining@gmail.com"
      className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
    >
      {children}
    </a>
  );
}