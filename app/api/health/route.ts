import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Lightweight liveness check for deployment smoke tests. Exposes no secrets. */
export function GET() {
  return NextResponse.json({
    status: "ok",
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
