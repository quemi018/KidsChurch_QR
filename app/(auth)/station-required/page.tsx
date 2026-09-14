import Link from "next/link";

import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Registration Station Required" };

export default function StationRequiredPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Registration Station Required</h1>
      <FormAlert tone="warning" title="This device is not a Registration Station.">
        Creating an account and updating your family&apos;s information is done at the church
        Registration Laptop. Please ask a Kids Church volunteer for assistance.
      </FormAlert>
      <p className="text-sm text-slate-600">
        Admins: activate this device from{" "}
        <Link
          href="/admin/settings"
          className="font-medium text-blue-700 underline-offset-4 hover:underline"
        >
          Admin → Settings
        </Link>
        .
      </p>
    </div>
  );
}
