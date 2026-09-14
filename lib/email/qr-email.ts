import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { qrPngBuffer } from "@/lib/qr/image";

import { getEmailProvider, type EmailMessage } from "./provider";

const CHURCH_NAME = "Victory Caloocan Kids Church";
const QR_CID = "kids-church-qr";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function safeFilename(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `kids-church-qr-${slug || "child"}.png`;
}

/** Builds the QR email for one child (spec §14). */
export function buildQrEmail(input: {
  to: string;
  childName: string;
  guardianName: string;
  qrPng: Buffer;
}): EmailMessage {
  const child = escapeHtml(input.childName);
  const guardian = escapeHtml(input.guardianName);
  const subject = `${CHURCH_NAME} — QR Code for ${input.childName}`;

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">${CHURCH_NAME}</p>
      <h1 style="margin:0 0 16px;font-size:22px;">QR Code for ${child}</h1>
      <p style="margin:0 0 16px;line-height:1.5;">Hi ${guardian},</p>
      <p style="margin:0 0 16px;line-height:1.5;">
        Here is <strong>${child}</strong>'s Kids Church QR code. Please save this image or take a
        screenshot, and present it at the Kids Church check-in on your next visit.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <img src="cid:${QR_CID}" width="280" height="280" alt="QR code for ${child}" style="display:inline-block;border:8px solid #ffffff;" />
        <p style="margin:8px 0 0;font-weight:bold;font-size:18px;">${child}</p>
      </div>
      <p style="margin:0 0 16px;line-height:1.5;">
        The QR code is also attached to this email as an image file.
      </p>
      <p style="margin:0;padding:12px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;font-size:14px;line-height:1.5;">
        <strong>Privacy reminder:</strong> this QR code identifies your child at check-in. Please keep it
        private and do not share it publicly.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#64748b;">
        This code is permanent — you do not need a new one each week. If it is lost, log in at the
        church Registration Station to view it again.
      </p>
    </div>
  </body>
</html>`.trim();

  const text = [
    CHURCH_NAME,
    "",
    `Hi ${input.guardianName},`,
    "",
    `Attached is ${input.childName}'s Kids Church QR code. Save the image and present it at Kids Church check-in on your next visit.`,
    "",
    "Privacy reminder: this QR code identifies your child at check-in. Keep it private and do not share it publicly.",
    "",
    "This code is permanent. If it is lost, log in at the church Registration Station to view it again.",
  ].join("\n");

  return {
    to: input.to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: safeFilename(input.childName),
        content: input.qrPng,
        contentType: "image/png",
        contentId: QR_CID,
      },
    ],
  };
}

export type QrEmailOutcome =
  | { status: "sent" }
  | { status: "no_email" }
  | { status: "not_found" }
  | { status: "inactive" }
  | { status: "failed"; reason: "not_configured" | "provider_error" };

/**
 * Sends (or re-sends) the EXISTING QR for one child to the guardian's email.
 * Idempotent with respect to the token: nothing is generated or changed.
 * Never throws — callers decide how to surface the outcome. Uses the
 * service-role client because it runs after registration (before the
 * guardian's session exists) as well as from member/admin actions, which
 * have already authorised the caller.
 */
export async function sendChildQrEmail(childId: string): Promise<QrEmailOutcome> {
  const admin = createAdminClient();
  const { data: child } = await admin
    .from("children")
    .select(
      "id, full_name, qr_token, is_active, guardian:profiles!children_guardian_id_fkey(full_name, email)",
    )
    .eq("id", childId)
    .maybeSingle();

  if (!child) return { status: "not_found" };
  if (!child.is_active) return { status: "inactive" };
  const email = child.guardian?.email;
  if (!email) return { status: "no_email" };

  try {
    const qrPng = await qrPngBuffer(child.qr_token);
    const message = buildQrEmail({
      to: email,
      childName: child.full_name,
      guardianName: child.guardian?.full_name ?? "there",
      qrPng,
    });
    const result = await getEmailProvider().send(message);
    if (result.ok) return { status: "sent" };
    return { status: "failed", reason: result.reason };
  } catch (error) {
    console.error("[email] QR email build/send threw", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return { status: "failed", reason: "provider_error" };
  }
}

/** Sends one email per child (spec §46). Returns per-child outcomes in order. */
export async function sendQrEmailsForChildren(childIds: string[]): Promise<QrEmailOutcome[]> {
  const outcomes: QrEmailOutcome[] = [];
  for (const id of childIds) outcomes.push(await sendChildQrEmail(id));
  return outcomes;
}
