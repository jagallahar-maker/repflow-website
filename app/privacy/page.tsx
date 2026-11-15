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
          Effective date: May 3, 2026 · Last updated: November 14, 2026
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
            If you grant access, Repflow reads your steps, walking and
            running distance, heart rate, workouts, active energy, and
            cycling distance from Apple Health, and writes your finished
            strength and cardio workouts (with their duration, calories, and
            distance) to Apple Health. Repflow does not read your body
            weight from Apple Health.
          </p>
          <p>
            Some of this is saved to your Repflow account: your daily steps
            (for your dashboard and, if you join it, the leaderboard) and
            the heart rate recorded during a cardio workout (stored with
            that session). Apple Health data is never sold, never used for
            advertising, and never shared with third parties for their own
            purposes. You can revoke access at any time in the Health app
            (your profile → Apps → Repflow).
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

          <SubHeading>Posts, comments, and your profile</SubHeading>
          <p>
            If you use Repflow&apos;s social features, the posts, photos,
            videos, comments, and profile details you choose to share
            (name, username, bio, profile photo, and banner) are stored in
            your account and shown to other users according to your
            visibility settings (public or friends only). Workouts you
            attach to a post share the summary shown on the post. Progress
            photos and videos stay private unless you choose to share them
            with your coach.
          </p>

          <SubHeading>Reports, blocks, and moderation</SubHeading>
          <p>
            You can report posts, comments, and profiles, and block other
            users. When you report something, we store the report (what was
            reported, the reason, any details you add, your account, and
            the time) so we can review it, and we email ourselves an alert.
            Reports are not shown to the person you report. Blocks are
            stored in your account so the blocked person&apos;s content can
            be hidden from you and yours from them. When we act on a report
            (for example removing content or suspending an account) we keep
            a record of the action and a copy of the removed content, which
            we may keep longer where the law requires it. Our Community
            Guidelines explain what isn&apos;t allowed.
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

          <SubHeading>Coach intake forms</SubHeading>
          <p>
            If you fill in a coach&apos;s intake form on repflowcoach.com
            (you don&apos;t need a Repflow account for it), section 6
            explains what it collects, who sees it, and how long it&apos;s
            kept.
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
              and weekly workout statistics.
            </li>
            <li>
              <strong className="text-white">
                With a coach you connect to:
              </strong>{" "}
              coaching is for users 18 and over, and starts only when you
              enter a coach&apos;s invite code in the app. While you&apos;re
              connected, your coach always sees your name, email, username
              and age, and can write you notes. Everything else follows your
              switches in &quot;What your coach can see&quot; (shown when you
              connect, and any time under Account → Coach):{" "}
              <strong className="text-white">Workouts</strong> (sessions,
              sets, reps, weights, time, distance, program and PRs),{" "}
              <strong className="text-white">Body</strong> (weigh-ins, goal
              weight, measurements, body fat),{" "}
              <strong className="text-white">Nutrition</strong> (your food log
              and Strategy targets; off unless you turn it on),{" "}
              <strong className="text-white">Progress photos</strong> and{" "}
              <strong className="text-white">videos</strong> (only items you
              mark &quot;Share with coach&quot;), check-ins, and AI summaries
              (off unless you turn it on). Switching something off hides it
              from your coach right away. Each time your coach opens your
              data we record it, and the app shows when your coach last
              viewed it. Check-ins you send (weight, sleep, energy, stress,
              training and nutrition adherence, your notes, and any photos you
              attach, which are shared with your coach) are stored in your
              account. Messages between you and your coach are text only,
              stored by Repflow, checked by an automatic language filter, and
              kept read-only after coaching ends, for safety; we review a
              message only if it&apos;s reported. Coaches never see your social
              activity or your conversations with other users.
              You can disconnect any time, and a coach can end the
              connection; either way the coach loses access to your data
              right away. Disconnecting doesn&apos;t delete anything from
              your account.
            </li>
            <li>
              <strong className="text-white">
                With the coach whose intake form you fill in:
              </strong>{" "}
              see section 6.
            </li>
            <li>
              <strong className="text-white">With service providers:</strong>{" "}
              Google (Firebase) for storage and authentication. Mapbox for
              rendering maps of your cardio routes — your route data is
              sent to Mapbox tile servers solely to render the visible map
              area; Mapbox does not retain it.{" "}
              <strong className="text-white">Anthropic</strong> (the Claude
              AI model) for Ask Repflow, only if you turn it on (ages 18
              and up): when you ask a question, we send your question, the
              conversation so far, and a short summary of your own Repflow
              data (age, sex, height, experience, goals, equipment,
              injuries you entered, recent workouts and personal records,
              weight trend, Strategy targets and logged intake, program,
              goals, and Insights). We never send your name, email,
              username, photos, videos, posts, friends, or Apple Health
              data. Anthropic processes this to produce the answer and
              doesn&apos;t use it to train its models; it keeps it only for
              a limited time under its commercial terms. TODO(legal):
              confirm Anthropic&apos;s retention period and data processing
              terms.
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

        <Section id="intake" title="6. Coach intake forms">
          <p>
            A coach on Repflow can share an intake form (a link or QR code
            to a page on repflowcoach.com) with people who want to train
            with them. You don&apos;t need a Repflow account to fill one in,
            and it&apos;s for adults 18 and over. This section covers those
            forms.
          </p>

          <SubHeading>What the form asks</SubHeading>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Contact:</strong> your name and
              email, and optionally a phone number, the best time to reach
              you, and a short note.
            </li>
            <li>
              <strong className="text-white">About you:</strong> your age,
              your goals (and, if you like, in your own words), your
              training experience, and whether you want training only or
              training and diet.
            </li>
            <li>
              <strong className="text-white">Training:</strong> days a week
              and session length, where you train, and the equipment you
              have. For training and diet, also your weight, goal weight and
              any food restrictions (all optional).
            </li>
            <li>
              <strong className="text-white">Health:</strong> body areas to
              protect (injuries), with optional details, and 7 yes/no health
              screening questions (for example about heart conditions, chest
              pain, dizziness, or medication for a chronic condition). A yes
              tells the coach that medical clearance is recommended, and we
              suggest you check with your doctor before training.
            </li>
            <li>Anything else you want your coach to know (optional).</li>
          </ul>
          <p>
            The health answers, injuries and weights are health data. Please
            don&apos;t write more health detail in the text boxes than your
            coach needs to plan your training. Our{" "}
            <Link
              href="/consumer-health-privacy"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              Consumer Health Data Privacy Policy
            </Link>{" "}
            explains your rights over health data.
          </p>

          <SubHeading>Who sees your answers</SubHeading>
          <p>
            Only the coach whose form you filled in, in their coach portal.
            Repflow stores your answers for that coach (in Google Firebase,
            see section 3) and doesn&apos;t use them for anything else: they
            aren&apos;t sold, used for advertising, or shown to other coaches
            or users. Repflow looks at a form only to run the service, fix a
            problem, or when the law requires it. Coaches are independent
            (see section 8 of our Terms of Service): a coach agrees to use
            your answers only to talk with you about coaching and to coach
            you, and is responsible for how they use them.
          </p>

          <SubHeading>Emails</SubHeading>
          <p>
            We email you a confirmation with a link to delete your answers
            (and, if you answered yes to a health question, a reminder to
            check with your doctor). We email the coach that a form arrived,
            with your first name only. Your answers are never put in an
            email.
          </p>

          <SubHeading>AI, only if you allow it</SubHeading>
          <p>
            The form has a separate, optional box that lets your coach use
            Repflow&apos;s AI (Anthropic&apos;s Claude) to draft a training
            plan from your form. If you tick it and your coach uses it, we
            send Anthropic your goals, experience, schedule, equipment, the
            areas to protect and their details, your notes, and an age range
            (for example &quot;30s&quot;). We never send your name, contact
            details, health screening answers, weights or food restrictions.
            Anthropic processes this only to produce the draft and
            doesn&apos;t use it to train its models. If you don&apos;t tick
            the box, your coach can&apos;t use AI on your form.
          </p>

          <SubHeading>Protection against spam</SubHeading>
          <p>
            The form uses Google reCAPTCHA Enterprise (through Firebase App
            Check), which checks your browser and device to tell people from
            bots. Google&apos;s{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              Terms of Service
            </a>{" "}
            apply to it. To limit how many forms can be sent, we keep one-way
            hashes (not the originals) of your IP address and email address
            with the times forms were sent.
          </p>

          <SubHeading>How long we keep them</SubHeading>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              If you don&apos;t become a client: 180 days after the last
              activity on your form, or 30 days after the coach archives it.
              Then it&apos;s deleted automatically.
            </li>
            <li>
              You can delete your answers at any time with the link in your
              confirmation email, or by emailing us. The coach can also
              delete your form.
            </li>
            <li>
              If you join the coach on Repflow with their invite code, your
              answers move into your client record with that coach and the
              form itself is deleted. Your coach can see them only while you
              are their client. They&apos;re deleted when you delete your
              Repflow account, or sooner if you email us.
            </li>
          </ul>

          <SubHeading>Your choices</SubHeading>
          <p>
            The form is optional, and so are the phone, details and notes
            fields. The health questions are required, because they help your
            coach plan safely; if you&apos;d rather not answer them, contact
            the coach directly instead. To change your answers, send the
            form again with the same email within 24 hours, or ask your
            coach. To see, correct or delete your answers, email{" "}
            <a
              href="mailto:repflowtraining@gmail.com"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              repflowtraining@gmail.com
            </a>{" "}
            from the email you put on the form.
          </p>
        </Section>

        <Section title="7. Your rights and choices">
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
          <p>
            Health data (for example under Washington&apos;s My Health My
            Data Act): see our{" "}
            <Link
              href="/consumer-health-privacy"
              className="text-lime-400 hover:text-lime-300 underline underline-offset-2"
            >
              Consumer Health Data Privacy Policy
            </Link>
            .
          </p>
        </Section>

        <Section title="8. Children">
          <p>
            Repflow is not intended for children under 13. We do not
            knowingly collect personal information from anyone under 13.
            Coaching and coach intake forms are for adults 18 and over.
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

        <Section title="9. Data retention">
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
          <p>
            Ask Repflow conversations are stored in your account so you can
            read them again. You can delete one or all of them in the app,
            and a conversation is deleted automatically 12 months after its
            last message. Erase all data and account deletion remove them.
            Usage counts (how many questions you asked this month) are kept
            to apply monthly limits, and answers that our safety checks
            flag, or that you report, are kept for up to 90 days for review.
          </p>
          <p>Coach intake forms: see section 6.</p>
        </Section>

        <Section title="10. Security">
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

        <Section title="11. Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes
            will be communicated via the app or email, and the
            &quot;Effective date&quot; at the top will be updated.
            Continued use of Repflow after a change indicates acceptance
            of the updated policy.
          </p>
        </Section>

        <Section title="12. Contact">
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
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-8">
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