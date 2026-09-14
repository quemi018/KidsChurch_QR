/** Result shape returned by form Server Actions and consumed by `useActionState`. */
export type FormState =
  | { status: "idle" }
  | {
      status: "error";
      /** Form-level message (e.g. wrong password). */
      message?: string;
      /** Field-level messages keyed by input name. */
      fieldErrors?: Record<string, string>;
      /** Submitted values to re-populate the form (never includes passwords). */
      values?: Record<string, string>;
    }
  | { status: "success"; message?: string };

export const idleFormState: FormState = { status: "idle" };

/** Reads string fields from FormData, dropping anything that is not a string. */
export function formValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
