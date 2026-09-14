import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/app";

export type CurrentUser = {
  userId: string;
  profile: {
    id: string;
    role: UserRole;
    full_name: string;
    phone: string | null;
    email: string | null;
    home_city: string | null;
    guardian_relationship: string | null;
    guardian_relationship_other: string | null;
    is_active: boolean;
  };
};

export const DEACTIVATED_PATH = "/deactivated";

/**
 * The signed-in user and their profile, or null. The JWT is verified by
 * `getClaims()`; the role is read from the database (never from the client),
 * which is what every server-side authorization decision uses.
 * Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, role, full_name, phone, email, home_city, guardian_relationship, guardian_relationship_other, is_active",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  return { userId, profile: { ...profile, role: profile.role as UserRole } };
});

/** Where a signed-in user belongs after login. */
export function homePathFor(role: UserRole): string {
  return role === "admin" ? "/admin" : "/member";
}

function loginPath(next?: string): string {
  return next ? `/login?next=${encodeURIComponent(next)}` : "/login";
}

/** Server Components: require a signed-in, active user of the given role. */
async function requireRole(role: UserRole, next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath(next));
  if (!user.profile.is_active) redirect(DEACTIVATED_PATH);
  if (user.profile.role !== role) redirect(homePathFor(user.profile.role));
  return user;
}

export function requireAdmin(next = "/admin"): Promise<CurrentUser> {
  return requireRole("admin", next);
}

export function requireMember(next = "/member"): Promise<CurrentUser> {
  return requireRole("member", next);
}

/**
 * Server Actions: same checks, but returns null instead of redirecting so the
 * action can report a clean error. Callers must treat null as "forbidden".
 */
export async function getActiveUserWithRole(role: UserRole): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user || !user.profile.is_active || user.profile.role !== role) return null;
  return user;
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeNextPath(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
