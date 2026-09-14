import { APP_TIMEZONE } from "./datetime";

type Ymd = { year: number; month: number; day: number };

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar date (Y-M-D) of an instant in the church's time zone. */
export function toLocalYmd(instant: Date): Ymd {
  const [year, month, day] = ymdFormatter.format(instant).split("-").map(Number);
  return { year, month, day };
}

/** Today's calendar date in the church's time zone as YYYY-MM-DD. */
export function todayYmdString(): string {
  return ymdFormatter.format(new Date());
}

function parseYmd(value: string): Ymd | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const ymd = { year: Number(y), month: Number(m), day: Number(d) };
  // Reject impossible dates such as 2025-02-30.
  const check = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day));
  if (
    check.getUTCFullYear() !== ymd.year ||
    check.getUTCMonth() !== ymd.month - 1 ||
    check.getUTCDate() !== ymd.day
  ) {
    return null;
  }
  return ymd;
}

export function isValidYmd(value: string): boolean {
  return parseYmd(value) !== null;
}

/**
 * Whole years between `birthday` (YYYY-MM-DD) and `asOf` (default: now),
 * evaluated on the calendar in Asia/Manila. Accounts for whether the
 * birthday has occurred yet this year (spec §27) — never year minus year.
 */
export function calculateAge(birthday: string, asOf: Date = new Date()): number {
  const born = parseYmd(birthday);
  if (!born) throw new Error(`Invalid birthday: ${birthday}`);
  const now = toLocalYmd(asOf);

  let age = now.year - born.year;
  const birthdayNotYetThisYear =
    now.month < born.month || (now.month === born.month && now.day < born.day);
  if (birthdayNotYetThisYear) age -= 1;
  return Math.max(0, age);
}
