import {
  CONTACT_TIMES,
  EXPERIENCE,
  GOALS,
  HOME_EQUIPMENT,
  INJURY_AREAS,
  PLACES,
  SCOPES,
  SCREENING,
  type IntakeAnswers,
} from "@/lib/intake-format";

/**
 * Intake answers grouped as on the form, for the lead page and a joined
 * client's page. Health screening "yes" answers are highlighted, with
 * "Medical clearance recommended" on top. Server component (no state).
 */

const label = (list: { id: string; label: string }[], id: string | null) =>
  (id && list.find((c) => c.id === id)?.label) || id || "—";

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2 border-b border-zinc-900 last:border-0 text-sm">
      <dt className="text-zinc-500">{k}</dt>
      <dd className="text-zinc-200 min-w-0 break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-1">{title}</h3>
      <dl>{children}</dl>
    </section>
  );
}

export default function LeadAnswers({
  answers: a,
  clearanceRecommended,
  showContact = true,
}: {
  answers: IntakeAnswers;
  clearanceRecommended: boolean;
  showContact?: boolean;
}) {
  const yes = a.screening.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  return (
    <div className="space-y-5">
      {clearanceRecommended && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-100">
          <div className="font-semibold">Medical clearance recommended</div>
          <div className="text-red-200/80 text-xs mt-0.5">
            Yes to {yes.length} health question{yes.length === 1 ? "" : "s"} (below). Not a diagnosis: ask them to
            check with their doctor before starting.
          </div>
        </div>
      )}

      {showContact && (
        <Block title="Contact">
          <Row k="Name">{a.name}</Row>
          <Row k="Email">
            <a href={`mailto:${a.email}`} className="text-[#9EFD06] hover:underline">{a.email}</a>
          </Row>
          {a.phone && (
            <Row k="Phone">
              <a href={`tel:${a.phone}`} className="text-[#9EFD06] hover:underline">{a.phone}</a>
            </Row>
          )}
          <Row k="Best time">
            {label(CONTACT_TIMES, a.contactTime)}
            {a.contactNote ? ` · ${a.contactNote}` : ""}
          </Row>
          <Row k="Age">{a.age}</Row>
        </Block>
      )}

      <Block title="Goals">
        <Row k="Goals">{a.goals.map((g) => label(GOALS, g)).join(", ")}</Row>
        {a.goalText && <Row k="In their words">{a.goalText}</Row>}
        <Row k="Experience">{label(EXPERIENCE, a.experience)}</Row>
        <Row k="Wants">{label(SCOPES, a.scope)}</Row>
        {a.diet && (
          <>
            <Row k="Weight">
              {a.diet.weightLb != null ? `${a.diet.weightLb} lb` : "—"}
              {a.diet.goalWeightLb != null ? ` → goal ${a.diet.goalWeightLb} lb` : ""}
            </Row>
            {a.diet.restrictions && <Row k="Food">{a.diet.restrictions}</Row>}
          </>
        )}
      </Block>

      <Block title="Schedule and equipment">
        <Row k="Days a week">{a.daysPerWeek}</Row>
        <Row k="Session">{a.sessionMinutes >= 90 ? "90+ min" : `${a.sessionMinutes} min`}</Row>
        <Row k="Trains">
          {label(PLACES, a.place)}
          {a.place === "home" && a.owned.length > 0
            ? `: ${a.owned.map((o) => label(HOME_EQUIPMENT, o)).join(", ")}`
            : ""}
        </Row>
      </Block>

      <Block title="Injuries">
        <Row k="Areas">
          {a.injuryAreas.length ? a.injuryAreas.map((i) => label(INJURY_AREAS, i)).join(", ") : "None"}
        </Row>
        {a.injuryDetails && <Row k="Details">{a.injuryDetails}</Row>}
      </Block>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Health screening</h3>
        <ol className="space-y-1.5">
          {SCREENING.map((q, i) => {
            const v = a.screening[i];
            return (
              <li
                key={i}
                className={`flex gap-3 rounded-lg px-3 py-2 text-sm ${
                  v ? "bg-red-500/10 border border-red-500/40" : "border border-zinc-900"
                }`}
              >
                <span className={`shrink-0 w-8 font-semibold ${v ? "text-red-300" : "text-zinc-500"}`}>
                  {v ? "Yes" : "No"}
                </span>
                <span className={v ? "text-zinc-100" : "text-zinc-400"}>{q}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {a.notes && (
        <Block title="Notes">
          <Row k="Notes">{a.notes}</Row>
        </Block>
      )}
    </div>
  );
}
