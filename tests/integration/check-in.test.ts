import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { performCheckIn } from "@/lib/attendance/check-in-core";
import { buildQrPayload } from "@/lib/qr/payload";

import {
  cleanupUsers,
  createAdmin,
  createMember,
  hasSupabaseEnv,
  openSession,
  seedChild,
  serviceClient,
  type Db,
  type TestUser,
} from "../support/supabase";

/** Spec §49 — QR + Attendance, through the real pipeline against the real database. */
describe.skipIf(!hasSupabaseEnv)("check-in pipeline", () => {
  let service: Db;
  let guardian: TestUser;
  let admin: TestUser;
  let active: { id: string; qr_token: string };
  let sibling: { id: string; qr_token: string };
  let archived: { id: string; qr_token: string };
  let sessionId: string;
  const SESSION_DATE = "2026-09-15";

  const deps = () => ({ supabase: admin.client, adminUserId: admin.id });

  beforeAll(async () => {
    service = serviceClient();
    guardian = await createMember(service, {
      full_name: "Maria Dela Cruz",
      guardian_relationship: "Other",
    });
    await service
      .from("profiles")
      .update({ guardian_relationship_other: "Aunt" })
      .eq("id", guardian.id);
    admin = await createAdmin(service);
    // Birthday 5 days after the session date: age must be 6, not 7.
    active = await seedChild(service, guardian.id, {
      full_name: "Ana",
      gender: "Female",
      birthday: "2019-09-20",
    });
    sibling = await seedChild(service, guardian.id, {
      full_name: "Juan",
      gender: "Male",
      birthday: "2021-03-15",
    });
    archived = await seedChild(service, guardian.id, {
      full_name: "Archived",
      gender: "Male",
      birthday: "2018-01-01",
      is_active: false,
    });
  });

  afterAll(async () => {
    await cleanupUsers(service, [guardian, admin]);
  });

  it("rejects malformed payloads before touching the database", async () => {
    expect(await performCheckIn(deps(), "hello")).toEqual({ status: "invalid_qr" });
    expect(await performCheckIn(deps(), "")).toEqual({ status: "invalid_qr" });
  });

  it("rejects an unknown token", async () => {
    expect(await performCheckIn(deps(), buildQrPayload("0".repeat(48)))).toEqual({
      status: "unknown_qr",
    });
  });

  it("rejects an archived child", async () => {
    expect(await performCheckIn(deps(), buildQrPayload(archived.qr_token))).toEqual({
      status: "inactive_child",
    });
  });

  it("refuses to check in when no session is open", async () => {
    expect(await performCheckIn(deps(), buildQrPayload(active.qr_token))).toEqual({
      status: "no_open_session",
    });
  });

  it("creates attendance with timestamp, snapshots and age as of the session date", async () => {
    sessionId = await openSession(service, admin.id, SESSION_DATE);

    const result = await performCheckIn(deps(), buildQrPayload(active.qr_token));
    expect(result.status).toBe("checked_in");
    if (result.status !== "checked_in") return;

    expect(result.child).toEqual({ name: "Ana", age: 6, gender: "Female" });
    expect(result.guardian).toEqual({
      name: "Maria Dela Cruz",
      relationship: "Other (Aunt)",
      contact: guardian.phone,
    });
    expect(Date.parse(result.checkedInAt)).toBeGreaterThan(Date.now() - 60_000);

    const { data: row } = await service
      .from("attendance")
      .select("*")
      .eq("id", result.attendanceId)
      .single();
    expect(row).toMatchObject({
      session_id: sessionId,
      child_id: active.id,
      guardian_id: guardian.id,
      checked_in_by: admin.id,
      child_name_snapshot: "Ana",
      child_gender_snapshot: "Female",
      child_age_snapshot: 6,
      guardian_name_snapshot: "Maria Dela Cruz",
      guardian_relationship_snapshot: "Other (Aunt)",
      guardian_contact_snapshot: guardian.phone,
    });
  });

  it("reports a duplicate scan without creating or updating a row", async () => {
    const { data: before } = await service
      .from("attendance")
      .select("checked_in_at")
      .eq("child_id", active.id)
      .single();
    const result = await performCheckIn(deps(), buildQrPayload(active.qr_token));
    expect(result.status).toBe("already_checked_in");
    if (result.status === "already_checked_in")
      expect(result.checkedInAt).toBe(before!.checked_in_at);

    const { count } = await service
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("child_id", active.id);
    expect(count).toBe(1);
  });

  it("concurrent scans of the same child yield exactly one row", async () => {
    const payload = buildQrPayload(sibling.qr_token);
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => performCheckIn(deps(), payload)));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses.filter((s) => s === "checked_in")).toHaveLength(1);
    expect(statuses.filter((s) => s === "already_checked_in")).toHaveLength(4);

    const { count } = await service
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("child_id", sibling.id);
    expect(count).toBe(1);
  });

  it("snapshots survive later edits to the child and guardian", async () => {
    await service.from("children").update({ full_name: "Ana Renamed" }).eq("id", active.id);
    await service.from("profiles").update({ full_name: "Maria Renamed" }).eq("id", guardian.id);
    const { data: row } = await service
      .from("attendance")
      .select("child_name_snapshot, guardian_name_snapshot")
      .eq("child_id", active.id)
      .single();
    expect(row).toEqual({ child_name_snapshot: "Ana", guardian_name_snapshot: "Maria Dela Cruz" });
  });

  it("a member cannot run the pipeline against another family's child", async () => {
    // RLS hides the child from a member who is not its guardian.
    const outsider = await createMember(service, { full_name: "Outsider" });
    try {
      const result = await performCheckIn(
        { supabase: outsider.client, adminUserId: outsider.id },
        buildQrPayload(active.qr_token),
      );
      expect(result).toEqual({ status: "unknown_qr" });
    } finally {
      await cleanupUsers(service, [outsider]);
    }
  });

  it("a member cannot insert attendance even with the service-visible ids", async () => {
    const { error } = await guardian.client.from("attendance").insert({
      session_id: sessionId,
      child_id: active.id,
      guardian_id: guardian.id,
      checked_in_by: guardian.id,
      child_name_snapshot: "x",
      child_gender_snapshot: "Female",
      child_age_snapshot: 6,
      guardian_name_snapshot: "y",
      guardian_contact_snapshot: "z",
    });
    expect(error?.message).toMatch(/row-level security/i);
  });

  it("closed session rejects new attendance — in the app and in the database", async () => {
    await service
      .from("church_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: admin.id })
      .eq("id", sessionId);

    const viaPipeline = await performCheckIn(
      deps(),
      buildQrPayload(archived.qr_token === active.qr_token ? active.qr_token : sibling.qr_token),
    );
    expect(viaPipeline.status).toBe("no_open_session");

    // Even a privileged direct insert into a closed session is refused by the trigger.
    const { error } = await service.from("attendance").insert({
      session_id: sessionId,
      child_id: sibling.id,
      guardian_id: guardian.id,
      checked_in_by: admin.id,
      child_name_snapshot: "Juan",
      child_gender_snapshot: "Male",
      child_age_snapshot: 5,
      guardian_name_snapshot: "Maria",
      guardian_contact_snapshot: guardian.phone,
    });
    expect(error?.message).toMatch(/open session/i);
  });
});
