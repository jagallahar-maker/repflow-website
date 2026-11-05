"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WEEKDAY_NAMES } from "@/lib/coach-checkins.ts";
import { callableError, setClientCheckinDay } from "@/lib/coach-messages-client";

/** Per-client check-in weekday (setClientCheckinDay; the app reads it too). */
export default function CheckinDaySelect({ clientId, weekday }: { clientId: string; weekday: number }) {
  const router = useRouter();
  const [value, setValue] = useState(weekday);
  const [error, setError] = useState<string | null>(null);

  async function change(next: number) {
    const prev = value;
    setValue(next);
    setError(null);
    try {
      await setClientCheckinDay(clientId, next);
      router.refresh();
    } catch (err) {
      setValue(prev);
      setError(callableError(err, "Couldn't save the day."));
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-400">
      Check-in day
      <select
        value={value}
        onChange={(e) => change(Number(e.target.value))}
        className="bg-black border border-zinc-800 rounded-lg px-2 py-1 text-white"
      >
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <option key={d} value={d}>
            {WEEKDAY_NAMES[d]}
          </option>
        ))}
      </select>
      {error && <span className="text-red-400">{error}</span>}
    </label>
  );
}
