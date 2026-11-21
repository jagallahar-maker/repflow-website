import Link from "next/link";
import type { Metadata } from "next";

/**
 * Consumer Health Data Privacy Policy (Washington My Health My Data Act,
 * Nevada SB 370, Connecticut). Linked from the footer on every page, the
 * Privacy Policy, the intake form's consent box and its confirmation
 * email (HEALTH_PRIVACY_PATH in lib/intake-format.ts).
 * A lawyer review is still pending (CLAUDE.md, after launch).
 */

export const metadata: Metadata = {
  title: "Consumer Health Data Privacy Policy — Repflow",
  description:
    "What health data Repflow collects, why, who it's shared with, and how to use your rights over it.",
};

const LINK = "text-lime-400 hover:text-lime-300 underline underline-offset-2";

export default function ConsumerHealthPrivacyPage() {
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
          Consumer Health Data Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Effective date: November 14, 2026 · Last updated: November 20, 2026
        </p>

        <div className="mt-10 space-y-6 text-zinc-300 leading-relaxed">
          <p>
            Some of the information Repflow handles is health data:
            information linked to you that describes your physical health,
            such as injuries, body weight, or answers to health screening
            questions. Washington&apos;s My Health My Data Act, and similar
            laws in Nevada and Connecticut, give you specific rights over it.
            This policy explains what health data we collect, why, where it
            comes from, who we share it with, and how to use your rights. It
            applies to everyone, wherever you live, and adds to our{" "}
            <Link href="/privacy" className={LINK}>
              Privacy Policy
            </Link>
            .
          </p>
          <p className="text-white font-medium">
            In short: we collect health data only for features you choose to
            use, share it with a coach or an AI model only with your
            permission, and never sell it or use it for advertising.
          </p>
        </div>

        <Section title="1. Health data we collect">
          <SubHeading>In the Repflow app, if you use these features</SubHeading>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Workouts and cardio sessions, including heart rate during
              cardio, and the training load and recovery times Repflow works
              out from them
            </li>
            <li>
              Body: weigh-ins, goal weight, body measurements, body fat, and
              progress photos and videos
            </li>
            <li>
              Nutrition: the foods and drinks you log, calories and
              nutrients, water, supplements, and your calorie targets
            </li>
            <li>
              Your age, injuries and training limits you enter, and
              check-ins you send a coach (weight, sleep, energy, stress, and
              how training and nutrition went)
            </li>
            <li>
              Data you let Repflow read from Apple Health (the{" "}
              <Link href="/privacy" className={LINK}>
                Privacy Policy
              </Link>{" "}
              lists exactly which)
            </li>
          </ul>

          <SubHeading>On a coach&apos;s intake form</SubHeading>
          <p>
            Body areas to protect (injuries) and their details, answers to 7
            yes/no health screening questions, your age, and, if you ask for
            training and diet, your weight, goal weight and food
            restrictions. Section 6 of the{" "}
            <Link href="/privacy#intake" className={LINK}>
              Privacy Policy
            </Link>{" "}
            covers the whole form.
          </p>

          <SubHeading>Why we collect it</SubHeading>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              To provide the features you use: logging, progress charts and
              insights, programs and weight suggestions, and calorie targets
            </li>
            <li>
              To share it with a coach, when you choose to (see section 3)
            </li>
            <li>
              For Ask Repflow and AI training plans, only if you turn them on
            </li>
            <li>
              To keep the service secure and working, for example to fix a
              problem you report
            </li>
          </ul>
          <p>
            We don&apos;t use health data for advertising, and we don&apos;t
            sell it.
          </p>
        </Section>

        <Section title="2. Where it comes from">
          <ul className="list-disc pl-6 space-y-2">
            <li>You: what you log, type, or upload</li>
            <li>
              Your iPhone: GPS during outdoor cardio, and photos and videos
              you take or choose
            </li>
            <li>Apple Health, if you connect it</li>
            <li>
              Your coach: programs, notes and messages they write for you
            </li>
            <li>
              Repflow itself: numbers we work out from your data, such as
              weight trends, estimated maximum lifts and calorie targets
            </li>
          </ul>
        </Section>

        <Section title="3. Who we share it with">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Your coach:</strong> only if
              you connect to one in the app, and then only what your
              &quot;What your coach can see&quot; switches allow; or the
              coach whose intake form you fill in.
            </li>
            <li>
              <strong className="text-white">
                Service providers that process it for us:
              </strong>{" "}
              Google (Firebase: storage, sign-in, our servers and email;
              reCAPTCHA on intake forms) and Anthropic (the Claude AI model),
              only if you turn on Ask Repflow, turn on AI summaries for your
              coach, or allow AI on an intake form.
              The Privacy Policy lists what is sent to Anthropic, and what
              never is.
            </li>
            <li>
              <strong className="text-white">People you choose:</strong>{" "}
              posts you share, and weekly stats on leaderboards you join.
            </li>
            <li>
              <strong className="text-white">When the law requires it:</strong>{" "}
              for example a valid court order.
            </li>
          </ul>
          <p>
            We don&apos;t sell health data, and we don&apos;t share it with
            advertisers or data brokers. Repflow has no affiliates.
          </p>
        </Section>

        <Section title="4. Your consent">
          <p>
            We collect health data only when you use a feature that needs it
            (logging something, connecting Apple Health, or filling in an
            intake form, which has its own consent box). We share it beyond
            our service providers only with your separate permission:
            connecting a coach and choosing what they can see, or turning on
            an AI option.
          </p>
          <p>
            You can withdraw your consent at any time: turn off
            Repflow&apos;s access in the Health app, change what your coach
            can see or disconnect from your coach, turn off Ask Repflow, or
            email us. Withdrawing consent doesn&apos;t undo sharing that
            already happened, but stops it from then on.
          </p>
        </Section>

        <Section title="5. Your rights">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-white">Know and access:</strong> ask
              whether we collect or share your health data, get a copy of it,
              and get a list of the third parties and service providers we
              shared it with. In the app, Settings → About → Download my data
              gives you a copy of your account.
            </li>
            <li>
              <strong className="text-white">Delete:</strong> delete entries
              in the app, use Settings → About → Erase all data, or delete
              your account in Settings → Account. For an intake form, use the
              link in your confirmation email. Or email us. We also ask our
              service providers to delete it.
            </li>
            <li>
              <strong className="text-white">Withdraw consent:</strong> see
              section 4.
            </li>
            <li>
              <strong className="text-white">No discrimination:</strong> we
              won&apos;t treat you differently for using these rights.
            </li>
          </ul>
          <p>
            To make a request, email{" "}
            <a href="mailto:repflowtraining@gmail.com" className={LINK}>
              repflowtraining@gmail.com
            </a>{" "}
            from the email on your account (or the one you put on an intake
            form). We may ask you to confirm it&apos;s you. We answer within
            45 days; if we need more time (up to 45 more days), we&apos;ll
            tell you why.
          </p>
          <p>
            If we turn down your request, you can appeal by replying to our
            answer. We&apos;ll decide within 45 days and explain why. If we
            still say no, you can contact your state&apos;s attorney general
            (in Washington, the Washington State Attorney General&apos;s
            Office).
          </p>
        </Section>

        <Section title="6. Changes and contact">
          <p>
            If we change this policy, we&apos;ll update the date at the top,
            and we&apos;ll ask for your consent again before using health
            data in a new way. Questions:{" "}
            <a href="mailto:repflowtraining@gmail.com" className={LINK}>
              repflowtraining@gmail.com
            </a>{" "}
            (Repflow is operated by Justin Gallahar, a sole proprietor in
            Indiana, United States).
          </p>
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
