import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  setEmailProviderForTesting,
  type EmailMessage,
  type EmailProvider,
} from "@/lib/email/provider";
import { sendChildQrEmail } from "@/lib/email/qr-email";

import {
  cleanupUsers,
  createMember,
  hasSupabaseEnv,
  seedChild,
  serviceClient,
  type Db,
  type TestUser,
} from "../support/supabase";

class FakeProvider implements EmailProvider {
  readonly name = "fake";
  sent: EmailMessage[] = [];
  failNext = false;
  async send(message: EmailMessage) {
    if (this.failNext) {
      this.failNext = false;
      return { ok: false as const, reason: "provider_error" as const };
    }
    this.sent.push(message);
    return { ok: true as const, id: `fake-${this.sent.length}` };
  }
}

/** Spec §49 — Email behaviour around the existing child QR. */
describe.skipIf(!hasSupabaseEnv)("QR email delivery", () => {
  let service: Db;
  let withEmail: TestUser;
  let withoutEmail: TestUser;
  let child: { id: string; qr_token: string };
  let orphanChild: { id: string; qr_token: string };
  const fake = new FakeProvider();

  beforeAll(async () => {
    service = serviceClient();
    withEmail = await createMember(service, { full_name: "Maria", email: "maria@example.com" });
    withoutEmail = await createMember(service, { full_name: "No Email" });
    child = await seedChild(service, withEmail.id, {
      full_name: "Juan",
      gender: "Male",
      birthday: "2021-03-15",
    });
    orphanChild = await seedChild(service, withoutEmail.id, {
      full_name: "Ana",
      gender: "Female",
      birthday: "2020-01-01",
    });
    setEmailProviderForTesting(fake);
  });

  afterEach(() => {
    fake.sent = [];
  });

  afterAll(async () => {
    setEmailProviderForTesting(null);
    await cleanupUsers(service, [withEmail, withoutEmail]);
  });

  it("email omitted: no send is attempted and the child still exists", async () => {
    expect(await sendChildQrEmail(orphanChild.id)).toEqual({ status: "no_email" });
    expect(fake.sent).toHaveLength(0);
    const { data } = await service.from("children").select("id").eq("id", orphanChild.id).single();
    expect(data?.id).toBe(orphanChild.id);
  });

  it("valid email: the existing child QR is sent, one email per child", async () => {
    expect(await sendChildQrEmail(child.id)).toEqual({ status: "sent" });
    expect(fake.sent).toHaveLength(1);
    const [message] = fake.sent;
    expect(message.to).toBe("maria@example.com");
    expect(message.subject).toBe("Victory Caloocan Kids Church — QR Code for Juan");
    expect(message.attachments?.[0].contentType).toBe("image/png");
    // PNG magic bytes: the attachment is a real image, not a placeholder.
    expect(message.attachments?.[0].content.subarray(0, 4)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    );
  });

  it("re-sending uses the same token: nothing is regenerated", async () => {
    await sendChildQrEmail(child.id);
    await sendChildQrEmail(child.id);
    expect(fake.sent).toHaveLength(2);
    expect(fake.sent[0].attachments?.[0].content.equals(fake.sent[1].attachments![0].content)).toBe(
      true,
    );
    const { data } = await service.from("children").select("qr_token").eq("id", child.id).single();
    expect(data?.qr_token).toBe(child.qr_token);
  });

  it("provider failure is reported without deleting or invalidating the child", async () => {
    fake.failNext = true;
    expect(await sendChildQrEmail(child.id)).toEqual({
      status: "failed",
      reason: "provider_error",
    });
    const { data } = await service
      .from("children")
      .select("id, is_active, qr_token")
      .eq("id", child.id)
      .single();
    expect(data).toEqual({ id: child.id, is_active: true, qr_token: child.qr_token });
  });

  it("archived child: no email is sent", async () => {
    await service
      .from("children")
      .update({ is_active: false, archived_at: new Date().toISOString() })
      .eq("id", child.id);
    expect(await sendChildQrEmail(child.id)).toEqual({ status: "inactive" });
    expect(fake.sent).toHaveLength(0);
  });
});
