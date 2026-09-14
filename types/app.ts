/** Application-level shared types. Row types come from the generated `database.ts`. */
import type { Tables } from "./database";

export type Profile = Tables<"profiles">;
export type Child = Tables<"children">;
export type ChurchSession = Tables<"church_sessions">;
export type Attendance = Tables<"attendance">;
export type RegistrationStation = Tables<"registration_stations">;
export type AuditLog = Tables<"audit_logs">;

export type UserRole = "member" | "admin";

export const GENDERS = ["Male", "Female"] as const;
export type Gender = (typeof GENDERS)[number];

export const GUARDIAN_RELATIONSHIPS = [
  "Mother",
  "Father",
  "Grandmother",
  "Grandfather",
  "Relative",
  "Legal Guardian",
  "Other",
] as const;
export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIPS)[number];

export type SessionStatus = "open" | "closed";

/** QR payload prefix. The QR encodes `vckc:<children.qr_token>` and nothing else. */
export const QR_PAYLOAD_PREFIX = "vckc:";
