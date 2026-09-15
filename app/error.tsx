"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Shows a calm message instead of a blank screen; the
 * error itself is reported to the server console/monitoring, never rendered.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", { digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-slate-600">
        The page could not be shown. Try again; if it keeps happening, tell a Kids Church Admin.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
