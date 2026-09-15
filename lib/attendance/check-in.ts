import "server-only";

import { getActiveUserWithRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { performCheckIn } from "./check-in-core";
import type { CheckInResult } from "./types";

/**
 * Next.js entry point for the check-in pipeline: verifies the caller is an
 * active Admin, then runs `performCheckIn` with the caller's own client so
 * every read and the insert are subject to RLS.
 */
export async function checkInByPayload(qrPayload: string): Promise<CheckInResult> {
  const admin = await getActiveUserWithRole("admin");
  if (!admin) return { status: "unauthorized" };

  const supabase = await createClient();
  return performCheckIn({ supabase, adminUserId: admin.userId }, qrPayload);
}
