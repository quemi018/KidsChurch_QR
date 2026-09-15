import { afterEach, describe, expect, it } from "vitest";

import {
  getEmailProvider,
  isEmailConfigured,
  setEmailProviderForTesting,
} from "@/lib/email/provider";
import { buildQrEmail } from "@/lib/email/qr-email";

describe("buildQrEmail (spec §14)", () => {
  const png = Buffer.from("fake-png");
  const message = buildQrEmail({
    to: "maria@example.com",
    childName: "Juan <Dela> & Cruz",
    guardianName: "Maria",
    qrPng: png,
  });

  it("uses the specified subject line", () => {
    expect(message.subject).toBe("Victory Caloocan Kids Church — QR Code for Juan <Dela> & Cruz");
  });

  it("escapes user-entered text in HTML", () => {
    expect(message.html).toContain("Juan &lt;Dela&gt; &amp; Cruz");
    expect(message.html).not.toContain("<Dela>");
  });

  it("includes branding, instructions and the privacy reminder", () => {
    expect(message.html).toContain("Victory Caloocan Kids Church");
    expect(message.html).toMatch(/screenshot/i);
    expect(message.html).toMatch(/privacy reminder/i);
    expect(message.text).toMatch(/privacy reminder/i);
  });

  it("attaches the QR as an inline PNG", () => {
    expect(message.attachments).toHaveLength(1);
    const [attachment] = message.attachments!;
    expect(attachment.contentType).toBe("image/png");
    expect(attachment.content).toBe(png);
    expect(attachment.contentId).toBeTruthy();
    expect(message.html).toContain(`cid:${attachment.contentId}`);
    expect(attachment.filename).toBe("kids-church-qr-juan-dela-cruz.png");
  });
});

describe("email provider selection", () => {
  const saved = { key: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM };
  afterEach(() => {
    process.env.RESEND_API_KEY = saved.key;
    process.env.EMAIL_FROM = saved.from;
    setEmailProviderForTesting(null);
  });

  it("falls back to an unconfigured provider that reports not_configured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    setEmailProviderForTesting(null);
    expect(isEmailConfigured()).toBe(false);
    const provider = getEmailProvider();
    expect(provider.name).toBe("unconfigured");
    await expect(
      provider.send({ to: "a@b.c", subject: "s", html: "<p>h</p>", text: "t" }),
    ).resolves.toEqual({ ok: false, reason: "not_configured" });
  });

  it("selects Resend when both variables are present", () => {
    process.env.RESEND_API_KEY = "re_test_placeholder";
    process.env.EMAIL_FROM = "Kids Church <kids@example.org>";
    setEmailProviderForTesting(null);
    expect(isEmailConfigured()).toBe(true);
    expect(getEmailProvider().name).toBe("resend");
  });
});
