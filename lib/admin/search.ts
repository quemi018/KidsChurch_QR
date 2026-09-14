/**
 * Turns a free-text search into PostgREST filter fragments.
 *
 * Name matching is a case-insensitive substring match. If the query contains
 * digits it is also matched against the stored E.164 phone: a leading "0"
 * (local format 09xx…) is rewritten to "63" so "0917" finds "+63917…".
 * Characters that have meaning in PostgREST `or()` filters are stripped.
 */
export function buildSearchTerms(raw: string | undefined): {
  text: string;
  namePattern: string | null;
  phonePattern: string | null;
} {
  const text = (raw ?? "").trim().slice(0, 80);
  const safe = text.replace(/[,()%\\]/g, "").trim();
  if (!safe) return { text, namePattern: null, phonePattern: null };

  const digits = safe.replace(/\D/g, "");
  let phonePattern: string | null = null;
  if (digits.length >= 3) {
    const tail = digits.startsWith("0") ? `63${digits.slice(1)}` : digits;
    phonePattern = `%${tail}%`;
  }

  const hasLetters = /[a-z]/i.test(safe);
  const namePattern = hasLetters ? `%${safe}%` : null;

  return { text, namePattern, phonePattern };
}
