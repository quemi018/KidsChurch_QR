import Link from "next/link";
import { redirect } from "next/navigation";

import { DEACTIVATED_PATH, getCurrentUser, homePathFor, safeNextPath } from "@/lib/auth/session";

import { LoginForm } from "@/components/auth/login-form";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Log In" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(user.profile.is_active ? homePathFor(user.profile.role) : DEACTIVATED_PATH);

  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const justRegistered = params.registered === "1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log In</h1>
        <p className="mt-1 text-slate-600">Use your registered mobile number and password.</p>
      </div>

      {justRegistered ? (
        <FormAlert tone="success">Your account was created. Please log in to continue.</FormAlert>
      ) : null}

      <LoginForm next={next ?? undefined} />

      <p className="text-sm text-slate-600">
        New here?{" "}
        <Link
          href="/register"
          className="font-medium text-blue-700 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>{" "}
        at the church Registration Station.
      </p>
    </div>
  );
}
