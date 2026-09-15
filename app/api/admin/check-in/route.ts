import { NextResponse } from "next/server";

import { checkInByPayload } from "@/lib/attendance/check-in";
import type { CheckInResult } from "@/lib/attendance/types";

/**
 * POST /api/admin/check-in  { "qrPayload": "vckc:..." }   (spec §26)
 *
 * Admin-only. Business outcomes are returned with HTTP 200 and a `status`
 * discriminator so the scanner UI can render them uniformly; only
 * authentication and malformed requests use error codes.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid_qr" } satisfies CheckInResult, { status: 400 });
  }

  const qrPayload =
    body && typeof body === "object" && "qrPayload" in body
      ? (body as { qrPayload: unknown }).qrPayload
      : undefined;
  if (typeof qrPayload !== "string" || qrPayload.length > 200) {
    return NextResponse.json({ status: "invalid_qr" } satisfies CheckInResult, { status: 400 });
  }

  const result = await checkInByPayload(qrPayload);
  const httpStatus = result.status === "unauthorized" ? 401 : result.status === "error" ? 500 : 200;

  return NextResponse.json(result, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
}
