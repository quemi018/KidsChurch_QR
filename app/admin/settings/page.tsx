import { deactivateStationAction } from "@/lib/auth/station-actions";
import { getCurrentStation } from "@/lib/auth/station";
import { STATION_GATE_ENABLED } from "@/lib/auth/station-policy";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/datetime";

import { StationActivateForm } from "@/components/admin/station-activate-form";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const [currentStation, { data: stations }] = await Promise.all([
    getCurrentStation(),
    supabase
      .from("registration_stations")
      .select("id, name, created_at, last_used_at, activated_by")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-slate-600">Registration Station and system configuration.</p>
      </div>

      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold">Registration Station</h2>
          <p className="mt-1 text-sm text-slate-600">
            Guardians can only create accounts and edit their information on an activated
            Registration Station (the church laptop). Activation applies to this browser on this
            device.
          </p>
        </div>

        {!STATION_GATE_ENABLED ? (
          <FormAlert tone="info">The Registration Station gate is currently disabled.</FormAlert>
        ) : null}

        {currentStation ? (
          <FormAlert tone="success" title={`This device is the "${currentStation.name}" station.`}>
            Activated {formatDateTime(currentStation.activatedAt)}.
          </FormAlert>
        ) : (
          <>
            <FormAlert tone="warning">This device is not a Registration Station.</FormAlert>
            <StationActivateForm />
          </>
        )}

        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Active stations
          </h3>
          {stations && stations.length > 0 ? (
            <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200">
              {stations.map((station) => (
                <li
                  key={station.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {station.name}
                      {station.id === currentStation?.id ? (
                        <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                          This device
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-slate-500">
                      Activated {formatDateTime(station.created_at)}
                      {station.last_used_at
                        ? ` · Last used ${formatDateTime(station.last_used_at)}`
                        : ""}
                    </p>
                  </div>
                  <ConfirmSubmit
                    action={deactivateStationAction}
                    fields={{ stationId: station.id }}
                    label="Deactivate"
                    question={`Deactivate "${station.name}"? Guardians can no longer register on it.`}
                    confirmLabel="Yes, deactivate"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No active stations.</p>
          )}
        </div>
      </section>
    </div>
  );
}
