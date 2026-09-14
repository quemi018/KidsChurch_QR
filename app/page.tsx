import Link from "next/link";

import { AppHeader } from "@/components/ui/app-header";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Victory Caloocan Kids Church
          </h1>
          <p className="text-lg text-slate-600">Child registration and QR check-in.</p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-6 py-5 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-2 border-slate-300 bg-white px-6 py-5 text-lg font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300"
          >
            Log In
          </Link>
        </div>

        <Link href="/admin" className="text-sm text-slate-500 underline-offset-4 hover:underline">
          Admin
        </Link>
      </main>
    </>
  );
}
