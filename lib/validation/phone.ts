/**
 * Philippine mobile number handling (spec §8, §35).
 *
 * Accepted input forms (spaces, dashes, dots and parentheses are ignored):
 *   09171234567   +639171234567   639171234567   9171234567
 *
 * Canonical storage/auth form is E.164: +639171234567
 */

const PH_E164 = /^\+639\d{9}$/;

/** Normalizes a PH mobile number to E.164, or returns null when it is not one. */
export function normalizePhilippineMobile(input: string): string | null {
  const digits = input.replace(/[\s\-.()]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;

  let candidate: string;
  if (digits.startsWith("+63")) candidate = digits;
  else if (digits.startsWith("63")) candidate = `+${digits}`;
  else if (digits.startsWith("0")) candidate = `+63${digits.slice(1)}`;
  else if (digits.startsWith("9")) candidate = `+63${digits}`;
  else return null;

  return PH_E164.test(candidate) ? candidate : null;
}

export function isE164PhilippineMobile(value: string): boolean {
  return PH_E164.test(value);
}

/** Formats +639171234567 as 0917 123 4567 for display. Non-PH values are returned as-is. */
export function formatPhilippineMobile(e164: string | null | undefined): string {
  if (!e164) return "";
  if (!PH_E164.test(e164)) return e164;
  const local = `0${e164.slice(3)}`; // 09171234567
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
