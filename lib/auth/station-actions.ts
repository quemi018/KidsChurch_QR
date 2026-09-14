"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";
import { type FormState } from "@/lib/utils/form-state";
import { stationNameSchema } from "@/lib/validation/auth";

import { getActiveUserWithRole } from "./session";
import {
  clearStationCookie,
  generateStationToken,
  getCurrentStation,
  hashStationToken,
  setStationCookie,
} from "./station";

const SETTINGS_PATH = "/admin/settings";

/** Admin-only: turn the current browser into a Registration Station. */
export async function activateStationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await getActiveUserWithRole("admin");
  if (!admin) return { status: "error", message: "Admin sign-in required." };

  const parsed = stationNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { status: "error", fieldErrors: { name: parsed.error.issues[0].message } };
  }

  const token = generateStationToken();
  const supabase = await createClient();
  const { data: station, error } = await supabase
    .from("registration_stations")
    .insert({
      name: parsed.data,
      station_token_hash: hashStationToken(token),
      activated_by: admin.userId,
    })
    .select("id")
    .single();

  if (error || !station) {
    console.error("[station] activate failed", { code: error?.code });
    return { status: "error", message: "Could not activate this station. Please try again." };
  }

  await setStationCookie(token);
  await logAudit(supabase, {
    actorId: admin.userId,
    action: "station_activated",
    entityType: "registration_station",
    entityId: station.id,
    metadata: { name: parsed.data },
  });

  revalidatePath(SETTINGS_PATH);
  return { status: "success", message: `This device is now the "${parsed.data}" station.` };
}

/** Admin-only: revoke a station (any device). Clears the cookie if it is this device. */
export async function deactivateStationAction(formData: FormData): Promise<void> {
  const admin = await getActiveUserWithRole("admin");
  if (!admin) return;

  const stationId = formData.get("stationId");
  if (typeof stationId !== "string" || !stationId) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("registration_stations")
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: admin.userId,
    })
    .eq("id", stationId)
    .eq("is_active", true);

  if (error) {
    console.error("[station] deactivate failed", { code: error.code });
    return;
  }

  const current = await getCurrentStation();
  if (current?.id === stationId) await clearStationCookie();

  await logAudit(supabase, {
    actorId: admin.userId,
    action: "station_deactivated",
    entityType: "registration_station",
    entityId: stationId,
  });

  revalidatePath(SETTINGS_PATH);
}
