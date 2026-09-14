/** Application-level shared types. Database-generated types are added in Phase 2. */

export type UserRole = "member" | "admin";

export type Gender = "Male" | "Female";

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
