"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * Re-renders the current page's server data whenever a Kids Church session is
 * opened, closed or reopened — on this device or any other — so the current
 * session banner and scanner state never go stale.
 */
export function useSessionChangeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const connect = async () => {
      // Attach the user's token first; RLS on church_sessions is Admin-only.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      channel = supabase
        .channel("church_sessions:status")
        .on("postgres_changes", { event: "*", schema: "public", table: "church_sessions" }, () =>
          router.refresh(),
        )
        .subscribe();
    };
    void connect();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router]);
}
