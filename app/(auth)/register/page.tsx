import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser, homePathFor } from "@/lib/auth/session";
import { requireStation } from "@/lib/auth/station";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create Account" };

export default async function RegisterPage() {
  await requireStation();

  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.profile.role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="mt-1 text-slate-600">
          Register once. You will add your children and receive a QR code for each one.
        </p>
      </div>

      <RegisterForm />

      <p className="text-sm text-slate-600">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-700 underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
