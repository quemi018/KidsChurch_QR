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

/** Spec §49 — Children + QR token stability, enforced by RLS + triggers. */
describe.skipIf(!hasSupabaseEnv)("children", () => {
  let service: Db;
  let guardian: TestUser;
  let other: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    service = serviceClient();
    guardian = await createMember(service, {
      full_name: "Guardian",
      guardian_relationship: "Mother",
    });
    other = await createMember(service, { full_name: "Other Guardian" });
    admin = await createAdmin(service);
  });

  afterAll(async () => {
    await cleanupUsers(service, [guardian, other, admin]);
  });

  it("guardian can add a child and receives a permanent 48-hex token", async () => {
    const { data, error } = await guardian.client
      .from("children")
      .insert({
        guardian_id: guardian.id,
        full_name: "Juan",
        gender: "Male",
        birthday: "2021-03-15",
      })
      .select("id, qr_token")
      .single();
    expect(error).toBeNull();
    expect(data?.qr_token).toMatch(/^[0-9a-f]{48}$/);
  });

  it("guardian cannot add a child for someone else", async () => {
    const { error } = await guardian.client
      .from("children")
      .insert({
        guardian_id: other.id,
        full_name: "Not Mine",
        gender: "Female",
        birthday: "2020-01-01",
      });
    expect(error?.message).toMatch(/row-level security/i);
  });

  it("guardian can edit their own child; the QR token does not change", async () => {
    const { data: before } = await guardian.client
      .from("children")
      .select("id, qr_token")
      .limit(1)
      .single();
    const { error } = await guardian.client
      .from("children")
      .update({ full_name: "Juan Dela Cruz", gender: "Male", birthday: "2021-03-16" })
      .eq("id", before!.id);
    expect(error).toBeNull();
    const { data: after } = await guardian.client
      .from("children")
      .select("full_name, qr_token")
      .eq("id", before!.id)
      .single();
    expect(after?.full_name).toBe("Juan Dela Cruz");
    expect(after?.qr_token).toBe(before!.qr_token);
  });

  it("guardian cannot change the QR token", async () => {
    const { data: child } = await guardian.client.from("children").select("id").limit(1).single();
    const { error } = await guardian.client
      .from("children")
      .update({ qr_token: "a".repeat(48) })
      .eq("id", child!.id);
    expect(error?.message).toMatch(/QR token cannot be changed/i);
  });

  it("guardian cannot archive, reassign or delete a child", async () => {
    const { data: child } = await guardian.client.from("children").select("id").limit(1).single();
    const archive = await guardian.client
      .from("children")
      .update({ is_active: false, archived_at: new Date().toISOString() })
      .eq("id", child!.id);
    expect(archive.error?.message).toMatch(/only an admin/i);

    const reassign = await guardian.client
      .from("children")
      .update({ guardian_id: other.id })
      .eq("id", child!.id);
    expect(reassign.error?.message).toMatch(/only an admin/i);

    const del = await guardian.client.from("children").delete().eq("id", child!.id);
    expect(del.error?.message).toMatch(/permission denied/i);
  });

  it("admin can archive and reactivate; guardian then loses edit access while archived", async () => {
    const { data: child } = await guardian.client.from("children").select("id").limit(1).single();

    const archived = await admin.client
      .from("children")
      .update({ is_active: false, archived_at: new Date().toISOString(), archived_by: admin.id })
      .eq("id", child!.id)
      .select("is_active")
      .single();
    expect(archived.data?.is_active).toBe(false);

    // Members may only update ACTIVE children: the row is invisible to the update.
    const edit = await guardian.client
      .from("children")
      .update({ full_name: "Should Not Apply" })
      .eq("id", child!.id)
      .select("id");
    expect(edit.data).toEqual([]);

    const reactivated = await admin.client
      .from("children")
      .update({ is_active: true, archived_at: null, archived_by: null })
      .eq("id", child!.id)
      .select("is_active, full_name")
      .single();
    expect(reactivated.data?.is_active).toBe(true);
    expect(reactivated.data?.full_name).toBe("Juan Dela Cruz");
  });

  it("database rejects a future birthday", async () => {
    const { error } = await guardian.client
      .from("children")
      .insert({
        guardian_id: guardian.id,
        full_name: "Future",
        gender: "Male",
        birthday: "2099-01-01",
      });
    expect(error?.message).toMatch(/children_birthday_check|check constraint/i);
  });
});
