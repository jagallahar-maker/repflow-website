import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Repflow",
  description:
    "How Repflow collects, uses, and protects your data. We don't sell your data, don't run ads, and don't use third-party tracking.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Effective date: May 3, 2026
        </p>

        <div className="mt-10 space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Repflow is a fitness tracking app for strength training, cardio,
            and nutrition. This policy explains what data Repflow collects,
            how it&apos;s used, and the choices you have. We try to keep
            this readable. If anything is unclear, email{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              repflowtraining@gmail.com
            </a>
            .
          </p>

          <p className="text-white font-medium">
            In short: Repflow collects only what&apos;s needed to make the
            app work for you. We don&apos;t sell your data. We don&apos;t
            share your data with advertisers. We don&apos;t use third-party
            analytics or tracking SDKs.
          </p>
        </div>

        <Section title="1. Who runs Repflow">
          <p>
            Repflow is operated by Justin Gallahar, a sole proprietor based
            in Indiana, United States. For privacy questions, data deletion
            requests, or anything else covered by this policy, contact:
          </p>
          <ContactBox>
            <strong className="text-white">Email:</strong>{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              repflowtraining@gmail.com
            </a>
          </ContactBox>
        </Section>

        <Section title="2. What we collect">
          <SubHeading>Account information</SubHeading>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Email address</strong> — used
              for sign-in and account recovery.
            </li>
            <li>
              <strong className="text-white">Name and profile photo</strong>{" "}
              — shown to friends on leaderboards and friend lists. Optional.
            </li>
            <li>
              <strong className="text-white">Username</strong> — a public
              handle so friends can find you. Optional.
            </li>
            <li>
              <strong className="text-white">Phone number</strong> — used
              only for friend discovery (see &quot;Contacts and friend
              discovery&quot; below). Optional.
            </li>
          </ul>

          <SubHeading>Workout and fitness data</SubHeading>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Workouts logged (exercises, sets, reps, weights, duration)
            </li>
            <li>Cardio sessions including GPS routes for outdoor activities</li>
            <li>
              Body measurements and progress photos / videos you choose to
              record
            </li>
            <li>
              Nutrition logs (foods, macronutrients, micronutrients, water,
              supplements)
            </li>
            <li>Goals, training preferences, and program selections</li>
          </ul>

          <SubHeading>Apple Health integration (iOS)</SubHeading>
          <p>
            If you grant access, Repflow reads workouts, steps, heart rate,
            and active energy from Apple Health, and writes your completed
            Repflow workouts back to Apple Health. You can revoke this
            access at any time in the iOS Health app under Sources or Apps.
          </p>

          <SubHeading>Location</SubHeading>
          <p>
            Repflow uses your device&apos;s GPS to track outdoor cardio
            (walks, runs, rides). Location is collected only while
            you&apos;re actively tracking a workout. The route is stored
            with that workout in your account. Repflow does not track your
            location in the background outside of an active workout
            session.
          </p>

          <SubHeading>Camera and photos</SubHeading>
          <p>
            The camera is used to take progress photos, scan food barcodes,
            and read nutrition labels. The photo library is used when you
            select an existing photo to upload as a progress photo. Repflow
            doesn&apos;t access your camera or photos outside of these
            features.
          </p>

          <SubHeading>Contacts and friend discovery</SubHeading>
          <p>
            If you tap &quot;Find from Contacts,&quot; Repflow reads your
            phone book to check which contacts are also on Repflow. We do
            this in a privacy-preserving way:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Phone numbers are{" "}
              <strong className="text-white">hashed on your device</strong>{" "}
              using SHA-256 before they ever leave your phone.
            </li>
            <li>
              Only the hashes are sent to our server, which checks them
              against the hashes of users who have added their phone
              numbers to Repflow.
            </li>
            <li>Your raw contact list is never uploaded or stored.</li>
            <li>
              Hashes that don&apos;t match a Repflow user are discarded
              immediately.
            </li>
          </ul>
          <p>
            In other words: Repflow never sees the phone numbers of people
            in your contacts who aren&apos;t already on Repflow.
          </p>

          <SubHeading>Information we do not collect</SubHeading>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not use third-party advertising networks.</li>
            <li>We do not use cross-app tracking SDKs.</li>
            <li>We do not sell or rent your data to anyone.</li>
            <li>We do not require permissions we don&apos;t actually use.</li>
          </ul>
        </Section>

        <Section title="3. How your data is stored">
          <p>
            Repflow uses Google&apos;s Firebase platform (Cloud Firestore,
            Firebase Authentication, Firebase Cloud Storage, Firebase Cloud
            Functions) to store your account data, workouts, and media.
            Firebase is operated by Google LLC and stores data in Google
            data centers in the United States. Firebase is bound by
            Google&apos;s security and privacy commitments, available at{" "}
            <a
              href="https://firebase.google.com/support/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              firebase.google.com/support/privacy
            </a>
            .
          </p>
          <p>
            Data is encrypted in transit (TLS) and at rest (Google-managed
            encryption keys).
          </p>
        </Section>

        <Section title="4. How your data is used">
          <p>We use your data to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Provide the app&apos;s features (logging, tracking, syncing
              across your devices)
            </li>
            <li>Show your data on your own profile and progress screens</li>
            <li>
              Show limited public profile information (name, photo,
              username, weekly stats) to friends you&apos;ve connected with
              and on global leaderboards if you&apos;ve opted in by setting
              a username
            </li>
            <li>
              Send transactional emails via Firebase Authentication
              (sign-in verification, password reset)
            </li>
            <li>
              Diagnose crashes via Firebase Crashlytics (anonymized device
              and app state at the time of crash; no personal data)
            </li>
          </ul>
          <p>
            We do <strong className="text-white">not</strong> use your data
            for advertising, profiling for marketing purposes, or training
            third-party machine learning models.
          </p>
        </Section>

        <Section title="5. Sharing">
          <p>
            We do not sell or rent your personal data. We share data only
            in the following limited circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">
                With other Repflow users you choose:
              </strong>{" "}
              friends on your leaderboard see your name, photo, username,
              and weekly workout statistics. Coaches you&apos;ve explicitly
              linked to via an invite code can see workouts, body weight,
              progress photos, and progress videos you&apos;ve explicitly
              shared with them.
            </li>
            <li>
              <strong className="text-white">With service providers:</strong>{" "}
              Google (Firebase) for storage and authentication. Mapbox for
              rendering maps of your cardio routes — your route data is
              sent to Mapbox tile servers solely to render the visible map
              area; Mapbox does not retain it.
            </li>
            <li>
              <strong className="text-white">For legal reasons:</strong> if
              required by valid legal process (subpoena, court order). We
              commit to challenging overbroad requests.
            </li>
            <li>
              <strong className="text-white">In a business transfer:</strong>{" "}
              if Repflow is acquired, user data would transfer to the
              acquirer subject to this same policy.
            </li>
          </ul>
        </Section>

        <Section title="6. Your rights and choices">
          <SubHeading>Access and export</SubHeading>
          <p>
            You can view all of your data inside the app. To request a
            full export of your account, email{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              repflowtraining@gmail.com
            </a>
            .
          </p>

          <SubHeading>Correction</SubHeading>
          <p>
            You can edit your profile, workouts, measurements, and other
            entries directly in the app at any time.
          </p>

          <SubHeading>Deletion</SubHeading>
          <p>
            You can delete individual workouts, photos, foods, etc. from
            inside the app. To delete your entire account and all
            associated data, email{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              repflowtraining@gmail.com
            </a>{" "}
            from the email address on the account. Account deletion is
            permanent and processed within 30 days.
          </p>

          <SubHeading>Permission controls (iOS)</SubHeading>
          <p>
            Camera, photos, location, contacts, motion, and Apple Health
            access can be revoked at any time in iOS{" "}
            <strong className="text-white">
              Settings → Privacy &amp; Security
            </strong>
            . Repflow features that depend on those permissions will stop
            working, but the app continues to function for everything else.
          </p>

          <SubHeading>California, EU/UK, and other regions</SubHeading>
          <p>
            If you live in California (CCPA/CPRA), the European Union
            (GDPR), the United Kingdom (UK GDPR), or another region with
            data protection laws, you may have additional rights including
            the right to access, port, correct, and erase your personal
            data, and to lodge a complaint with a supervisory authority.
            To exercise these rights, email{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              repflowtraining@gmail.com
            </a>
            .
          </p>
          <p>
            We do not &quot;sell&quot; personal data as defined under the
            CCPA, and we do not process personal data for cross-context
            behavioral advertising.
          </p>
        </Section>

        <Section title="7. Children">
          <p>
            Repflow is not intended for children under 13. We do not
            knowingly collect personal information from anyone under 13.
            If you believe a child under 13 has provided us with personal
            information, please email{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              repflowtraining@gmail.com
            </a>{" "}
            and we will promptly delete it.
          </p>
        </Section>

        <Section title="8. Data retention">
          <p>
            We retain your account data for as long as your account is
            active. When you delete your account, your data is permanently
            removed within 30 days, except where retention is required by
            law (e.g., financial records for tax purposes, which Repflow
            does not currently maintain).
          </p>
          <p>
            Crash logs and diagnostic data collected by Firebase
            Crashlytics are retained for up to 90 days.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We protect your data with industry-standard measures including
            TLS encryption in transit, Google-managed encryption at rest,
            and server-side authorization rules that prevent users from
            reading data belonging to others. No system is perfectly
            secure; if we ever experience a data breach affecting your
            information, we will notify affected users without undue
            delay.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes
            will be communicated via the app or email, and the
            &quot;Effective date&quot; at the top will be updated.
            Continued use of Repflow after a change indicates acceptance
            of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Privacy questions, data requests, or anything else covered by
            this policy:
          </p>
          <ContactBox>
            <div>
              <strong className="text-white">Email:</strong>{" "}
              <a
                href="mailto:repflowtraining@gmail.com"
                className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
              >
                repflowtraining@gmail.com
              </a>
            </div>
            <div className="mt-1">
              <strong className="text-white">Operator:</strong> Justin
              Gallahar, sole proprietor
            </div>
            <div className="mt-1">
              <strong className="text-white">Location:</strong> Indiana,
              United States
            </div>
          </ContactBox>
        </Section>

        <div className="mt-20 pt-8 border-t border-zinc-900 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            ← Back to Repflow
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight border-b border-zinc-900 pb-3">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-zinc-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-white mt-6 mb-2">{children}</h3>
  );
}

function ContactBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 bg-zinc-950 border border-zinc-900 rounded-xl px-5 py-4 text-zinc-300">
      {children}
    </div>
  );
}