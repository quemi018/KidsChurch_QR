import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireMember } from "@/lib/auth/session";
import { resendQrEmailAction } from "@/lib/member/actions";
import { qrDataUrl } from "@/lib/qr/image";
import { buildQrPayload } from "@/lib/qr/payload";
import { createClient } from "@/lib/supabase/server";

import { DevScanHelper } from "@/components/qr/dev-scan-helper";
import { PrintButton } from "@/components/qr/print-button";
import { QrDisplay } from "@/components/qr/qr-display";
import { SendQrEmailButton } from "@/components/qr/send-qr-email-button";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Child QR Code" };

export default async function ChildQrPage({ params }: PageProps<"/member/children/[childId]/qr">) {
  const user = await requireMember();
  const { childId } = await params;

  // RLS: only the guardian's own children are visible. The token never leaves
  // the server except inside the QR image itself.
  const supabase = await createClient();
  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, gender, birthday, qr_token, is_active")
    .eq("id", childId)
    .maybeSingle();
  if (!child) notFound();
  if (!child.is_active) redirect(`/member/children/${child.id}`);

  const dataUrl = await qrDataUrl(child.qr_token);
  const hasEmail = Boolean(user.profile.email);
  const resend = resendQrEmailAction.bind(null, child.id);
  const showDevHelper = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          href={`/member/children/${child.id}`}
          className="text-sm text-blue-700 underline-offset-4 hover:underline"
        >
          ← {child.full_name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">QR Code</h1>
        <p className="mt-1 text-slate-600">
          Present this at Kids Church check-in. It is permanent — the same code works every week.
        </p>
      </div>

      <QrDisplay dataUrl={dataUrl} child={child} />

      <div className="space-y-4 print:hidden">
        <FormAlert tone="info" title="Save it now">
          Take a photo or screenshot of the QR code above so you have it on your phone.
          {hasEmail ? " You can also send it to your email." : ""}
        </FormAlert>

        <div className="flex flex-wrap items-start gap-3">
          <PrintButton />
          {hasEmail ? <SendQrEmailButton action={resend} variant="primary" /> : null}
        </div>

        {!hasEmail ? (
          <p className="text-sm text-slate-600">
            No email address on file. You can display this QR and take a photo/screenshot for future
            use, or add an email under{" "}
            <Link
              href="/member/profile"
              className="text-blue-700 underline-offset-4 hover:underline"
            >
              My Profile
            </Link>
            .
          </p>
        ) : null}

        {showDevHelper ? <DevScanHelper payload={buildQrPayload(child.qr_token)} /> : null}

        <p className="text-xs text-slate-500">
          Privacy: the QR contains only a random code, not your child&apos;s details. Please do not
          post it publicly.
        </p>
      </div>
    </div>
  );
}
