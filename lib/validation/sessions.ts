import { z } from "zod";

import { isValidYmd } from "@/lib/utils/age";

export const openSessionSchema = z.object({
  name: z.string().trim().min(1, "Session name is required.").max(120, "Session name is too long."),
  sessionDate: z
    .string()
    .trim()
    .min(1, "Session date is required.")
    .refine(isValidYmd, "Enter a valid date."),
  /** HH:MM (24h) from <input type="time">, or empty. */
  serviceTime: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.union([z.null(), z.string().regex(/^\d{2}:\d{2}$/, "Enter a valid time.")])),
});
export type OpenSessionInput = z.infer<typeof openSessionSchema>;
