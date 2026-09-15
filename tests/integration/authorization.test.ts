import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cleanupUsers,
  createAdmin,
  createMember,
  hasSupabaseEnv,
  seedChild,
  serviceClient,
  type Db,
  type TestUser,
} from "../support/supabase";

/**
 * Spec §49 — Authentication/Authorization, enforced by RLS + triggers.
 * Every call below runs as a real signed-in user through the public API,
 * exactly as the browser would.
 */
describe.skipIf(!hasSupabaseEnv)("authorization (RLS)", () => {
  let service: Db;
  let memberA: TestUser;
  let memberB: TestUser;
  let admin: TestUser;
  let childA: { id: string; qr_token: string };

  beforeAll(async () => {
    service = serviceClient();
    memberA = await createMember(service, {
      full_name: "Member A",
      guardian_relationship: "Mother",
    });
    memberB = await createMember(service, {
      full_name: "Member B",
      guardian_relationship: "Father",
    });
    admin = await createAdmin(service);
    childA = await seedChild(service, memberA.id, {
      full_name: "Child A",
      gender: "Male",
      birthday: "2021-03-15",
    });
  });

  afterAll(async () => {
    await cleanupUsers(service, [memberA, memberB, admin]);
  });

  it("member reads only their own profile", async () => {
    const { data } = await memberA.client.from("profiles").select("id");
    expect(data?.map((p) => p.id)).toEqual([memberA.id]);
  });

  it("member cannot read another guardian", async () => {
    const { data } = await memberB.client.from("profiles").select("id").eq("id", memberA.id);
    expect(data).toEqual([]);
  });

  it("member cannot read another guardian's children", async () => {
    const { data } = await memberB.client.from("children").select("id");
    expect(data).toEqual([]);
    const { data: byToken } = await memberB.client
      .from("children")
      .select("id")
      .eq("qr_token", childA.qr_token);
    expect(byToken).toEqual([]);
  });

  it("member cannot read attendance", async () => {
    const { data, error } = await memberA.client.from("attendance").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("member cannot promote themselves to admin", async () => {
    const { error } = await memberA.client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", memberA.id);
    expect(error?.message).toMatch(/protected server operation/i);
    const { data } = await service.from("profiles").select("role").eq("id", memberA.id).single();
    expect(data?.role).toBe("member");
  });

  it("member cannot deactivate or reactivate accounts", async () => {
    const { error } = await memberA.client
      .from("profiles")
      .update({ is_active: false })
      .eq("id", memberA.id);
    expect(error?.message).toMatch(/only an admin/i);
  });

  it("member update of another profile affects zero rows", async () => {
    const { data } = await memberA.client
      .from("profiles")
      .update({ full_name: "Hacked" })
      .eq("id", memberB.id)
      .select("id");
    expect(data).toEqual([]);
    const { data: b } = await service
      .from("profiles")
      .select("full_name")
      .eq("id", memberB.id)
      .single();
    expect(b?.full_name).toBe("Member B");
  });

  it("admin reads every guardian and child", async () => {
    const { data: profiles } = await admin.client
      .from("profiles")
      .select("id")
      .in("id", [memberA.id, memberB.id]);
    expect(profiles).toHaveLength(2);
    const { data: children } = await admin.client.from("children").select("id").eq("id", childA.id);
    expect(children).toHaveLength(1);
  });

  it("admin cannot promote directly either — role changes are server-only", async () => {
    const { error } = await admin.client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", memberB.id);
    expect(error?.message).toMatch(/protected server operation/i);
  });

  it("anonymous key without a session sees nothing", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
    const { data, error } = await anon.from("children").select("id");
    // anon has no table privileges at all: either an error or an empty set, never rows.
    expect(data ?? []).toEqual([]);
    expect(error === null || typeof error.message === "string").toBe(true);
  });
});
