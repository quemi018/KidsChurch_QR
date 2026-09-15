import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cleanupUsers,
  createAdmin,
  createMember,
  hasSupabaseEnv,
  serviceClient,
  type Db,
  type TestUser,
} from "../support/supabase";

/** Spec §49 — Session rules, enforced by RLS and the single-open-session index. */
describe.skipIf(!hasSupabaseEnv)("sessions", () => {
  let service: Db;
  let admin: TestUser;
  let member: TestUser;
  let sessionId: string;

  beforeAll(async () => {
    service = serviceClient();
    admin = await createAdmin(service);
    member = await createMember(service, { full_name: "Member" });
  });

  afterAll(async () => {
    await cleanupUsers(service, [admin, member]);
  });

  it("member cannot open a session or read sessions", async () => {
    const { error } = await member.client
      .from("church_sessions")
      .insert({ name: "Hack", session_date: "2026-09-15" });
    expect(error?.message).toMatch(/row-level security/i);
    const { data } = await member.client.from("church_sessions").select("id");
    expect(data).toEqual([]);
  });

  it("admin can open a session", async () => {
    const { data, error } = await admin.client
      .from("church_sessions")
      .insert({
        name: "Sunday Kids Church",
        session_date: "2026-09-15",
        status: "open",
        opened_by: admin.id,
        opened_at: new Date().toISOString(),
      })
      .select("id, status")
      .single();
    expect(error).toBeNull();
    expect(data?.status).toBe("open");
    sessionId = data!.id;
  });

  it("only one session can be open at a time", async () => {
    const { error } = await admin.client.from("church_sessions").insert({
      name: "Second",
      session_date: "2026-09-15",
      status: "open",
      opened_by: admin.id,
      opened_at: new Date().toISOString(),
    });
    expect(error?.code).toBe("23505");
  });

  it("closing requires closed_at and then allows the next session", async () => {
    const bad = await admin.client
      .from("church_sessions")
      .update({ status: "closed", closed_at: null })
      .eq("id", sessionId);
    expect(bad.error?.message).toMatch(/check constraint/i);

    const ok = await admin.client
      .from("church_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: admin.id })
      .eq("id", sessionId)
      .select("status")
      .single();
    expect(ok.data?.status).toBe("closed");

    const next = await admin.client
      .from("church_sessions")
      .insert({
        name: "Next Service",
        session_date: "2026-09-15",
        status: "open",
        opened_by: admin.id,
        opened_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    expect(next.error).toBeNull();
  });

  it("sessions cannot be deleted through the API", async () => {
    const { error } = await admin.client.from("church_sessions").delete().eq("id", sessionId);
    expect(error?.message).toMatch(/permission denied/i);
  });
});
