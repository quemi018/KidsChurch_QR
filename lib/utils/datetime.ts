/** Display formatting in the church's time zone (spec §28). */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Manila";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const timeWithSecondsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/** 09/20/2026 */
export function formatDate(value: DateInput): string {
  return dateFormatter.format(toDate(value));
}

/** 9:15 AM */
export function formatTime(value: DateInput): string {
  return timeFormatter.format(toDate(value));
}

/** 9:15:32 AM */
export function formatTimeWithSeconds(value: DateInput): string {
  return timeWithSecondsFormatter.format(toDate(value));
}

/** Sep 20, 2026, 9:15 AM */
export function formatDateTime(value: DateInput): string {
  return dateTimeFormatter.format(toDate(value));
}
