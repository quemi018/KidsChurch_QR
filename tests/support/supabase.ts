import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type Db = SupabaseClient<Database>;

export const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = () => process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const serviceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Service-role client: bypasses RLS. Used only to seed and clean up. */
export function serviceClient(): Db {
  return createClient<Database>(url(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** A client signed in as a real user, so every query runs under that user's RLS. */
export async function userClient(phone: string, password: string): Promise<Db> {
  const client = createClient<Database>(url(), publishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ phone, password });
  if (error) throw new Error(`sign-in failed for ${phone}: ${error.message}`);
  return client;
}

export type TestUser = { id: string; phone: string; password: string; client: Db };

const PASSWORD = "IntegrationTest-9Q1";

/** Unique PH mobile per call so parallel/failed runs never collide. */
let counter = 0;
function uniquePhone(): string {
  const digits = `${Date.now()}${counter++}`.slice(-8);
  return `+6399${digits}`;
}

export async function createMember(
  service: Db,
  meta: { full_name: string; guardian_relationship?: string; home_city?: string; email?: string },
): Promise<TestUser> {
  const phone = uniquePhone();
  const { data, error } = await service.auth.admin.createUser({
    phone,
    password: PASSWORD,
    phone_confirm: true,
    user_metadata: meta,
  });
  if (error || !data.user) throw new Error(`createMember failed: ${error?.message}`);
  return { id: data.user.id, phone, password: PASSWORD, client: await userClient(phone, PASSWORD) };
}

export async function createAdmin(service: Db, fullName = "Test Admin"): Promise<TestUser> {
  const phone = uniquePhone();
  const { data, error } = await service.auth.admin.createUser({
    phone,
    password: PASSWORD,
    phone_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) throw new Error(`createAdmin failed: ${error?.message}`);
  return { id: data.user.id, phone, password: PASSWORD, client: await userClient(phone, PASSWORD) };
}

export async function seedChild(
  service: Db,
  guardianId: string,
  child: { full_name: string; gender: "Male" | "Female"; birthday: string; is_active?: boolean },
) {
  const { data, error } = await service
    .from("children")
    .insert({
      guardian_id: guardianId,
      full_name: child.full_name,
      gender: child.gender,
      birthday: child.birthday,
      is_active: child.is_active ?? true,
      archived_at: child.is_active === false ? new Date().toISOString() : null,
    })
    .select("id, qr_token")
    .single();
  if (error || !data) throw new Error(`seedChild failed: ${error?.message}`);
  return data;
}

export async function openSession(service: Db, adminId: string, sessionDate: string) {
  const { data, error } = await service
    .from("church_sessions")
    .insert({
      name: "Integration Test Session",
      session_date: sessionDate,
      status: "open",
      opened_by: adminId,
      opened_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(`openSession failed: ${error?.message}`);
  return data.id;
}

/** Removes everything the given users touched, then the users themselves. */
export async function cleanupUsers(service: Db, users: TestUser[]) {
  const ids = users.map((u) => u.id);
  if (!ids.length) return;
  const { data: kids } = await service.from("children").select("id").in("guardian_id", ids);
  const kidIds = (kids ?? []).map((k) => k.id);
  const { data: sessions } = await service
    .from("church_sessions")
    .select("id")
    .in("opened_by", ids);
  const sessionIds = (sessions ?? []).map((s) => s.id);

  if (sessionIds.length) await service.from("attendance").delete().in("session_id", sessionIds);
  if (kidIds.length) await service.from("attendance").delete().in("child_id", kidIds);
  await service.from("registration_stations").delete().in("activated_by", ids);
  const entityIds = [...ids, ...kidIds, ...sessionIds];
  await service
    .from("audit_logs")
    .delete()
    .or(`actor_id.in.(${ids.join(",")}),entity_id.in.(${entityIds.join(",")})`);
  if (kidIds.length) await service.from("children").delete().in("id", kidIds);
  if (sessionIds.length) await service.from("church_sessions").delete().in("id", sessionIds);
  for (const id of ids) await service.auth.admin.deleteUser(id);
}
