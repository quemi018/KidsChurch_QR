import "server-only";

import { Resend } from "resend";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  /** When set, the attachment is inline and referenced in HTML as `cid:<contentId>`. */
  contentId?: string;
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
};

export type SendResult =
  { ok: true; id: string | null } | { ok: false; reason: "not_configured" | "provider_error" };

/** Transactional email provider (spec §14). Swap implementations here, nowhere else. */
export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<SendResult>;
}

class ResendProvider implements EmailProvider {
  readonly name = "resend";
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage): Promise<SendResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        contentId: a.contentId,
      })),
    });
    if (error) {
      // Never log the recipient or provider payload; the error name is enough to diagnose.
      console.error("[email] resend failed", { name: error.name });
      return { ok: false, reason: "provider_error" };
    }
    return { ok: true, id: data?.id ?? null };
  }
}

/** Used when RESEND_API_KEY / EMAIL_FROM are absent: sends nothing, reports why. */
class UnconfiguredProvider implements EmailProvider {
  readonly name = "unconfigured";

  async send(message: EmailMessage): Promise<SendResult> {
    if (process.env.NODE_ENV === "development") {
      console.warn("[email] not configured — would have sent:", {
        subject: message.subject,
        attachments: message.attachments?.map((a) => a.filename),
      });
    }
    return { ok: false, reason: "not_configured" };
  }
}

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  cached = apiKey && from ? new ResendProvider(apiKey, from) : new UnconfiguredProvider();
  return cached;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
