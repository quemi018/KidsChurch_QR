"use client";

import { useState } from "react";

import { childFieldName } from "@/lib/validation/children";

import { Button } from "@/components/ui/button";
import { ChildFields } from "@/components/member/child-fields";

type ChildrenFieldsetProps = {
  /** Submitted values keyed by field name (child_<i>_<field>), for repopulation. */
  values: Record<string, string>;
  /** Field errors keyed the same way, plus an optional "children" form-level error. */
  errors: Record<string, string>;
  maxBirthday: string;
};

/** Row ids submitted last time, so the form re-mounts with the same rows. */
function rowIdsFromValues(values: Record<string, string>): number[] {
  const ids = new Set<number>();
  for (const key of Object.keys(values)) {
    const match = /^child_(\d+)_/.exec(key);
    if (match) ids.add(Number(match[1]));
  }
  return ids.size ? [...ids].sort((a, b) => a - b) : [0];
}

/**
 * "Children" section of the registration wizard (spec §10):
 * one child form per row, "+ Add Another Child", remove for extra rows.
 * Row ids only ever grow so removing a middle row never re-keys the others.
 */
export function ChildrenFieldset({ values, errors, maxBirthday }: ChildrenFieldsetProps) {
  const [rows, setRows] = useState<number[]>(() => rowIdsFromValues(values));
  const nextId = () => (rows.length ? Math.max(...rows) + 1 : 0);

  return (
    <fieldset className="space-y-5">
      <legend className="text-lg font-semibold">Children</legend>
      <p className="text-sm text-slate-600">
        Add every child you will bring to Kids Church. Each child receives their own QR code.
      </p>

      {errors.children ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {errors.children}
        </p>
      ) : null}

      {rows.map((id, position) => {
        const names = {
          fullName: childFieldName(id, "fullName"),
          gender: childFieldName(id, "gender"),
          birthday: childFieldName(id, "birthday"),
        };
        return (
          <div key={id} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Child {position + 1}</h3>
              {rows.length > 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => setRows((current) => current.filter((row) => row !== id))}
                  aria-label={`Remove child ${position + 1}`}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            <ChildFields
              names={names}
              values={{
                fullName: values[names.fullName],
                gender: values[names.gender],
                birthday: values[names.birthday],
              }}
              errors={{
                fullName: errors[names.fullName],
                gender: errors[names.gender],
                birthday: errors[names.birthday],
              }}
              maxBirthday={maxBirthday}
            />
          </div>
        );
      })}

      <Button variant="secondary" onClick={() => setRows((current) => [...current, nextId()])}>
        + Add Another Child
      </Button>
    </fieldset>
  );
}
