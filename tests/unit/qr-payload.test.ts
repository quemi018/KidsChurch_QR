import { describe, expect, it } from "vitest";

import { buildQrPayload, parseQrPayload, QR_PAYLOAD_PREFIX } from "@/lib/qr/payload";

const token = "0123456789abcdef0123456789abcdef0123456789abcdef";

describe("QR payload (spec §6.2)", () => {
  it("builds vckc:<token> and nothing else", () => {
    const payload = buildQrPayload(token);
    expect(payload).toBe(`${QR_PAYLOAD_PREFIX}${token}`);
    expect(payload).toHaveLength(5 + 48);
  });

  it("round-trips through parse", () => {
    expect(parseQrPayload(buildQrPayload(token))).toBe(token);
  });

  it("tolerates whitespace and an uppercased scan", () => {
    expect(parseQrPayload(`  ${QR_PAYLOAD_PREFIX}${token}\n`)).toBe(token);
    expect(parseQrPayload(`VCKC:${token.toUpperCase()}`)).toBe(token);
  });

  it.each([
    "",
    "hello",
    "https://example.com",
    `${token}`, // missing prefix
    `vckc:${token.slice(0, 47)}`, // too short
    `vckc:${token}0`, // too long
    `vckc:${token.slice(0, 47)}g`, // non-hex
    `xkcd:${token}`,
    `vckc:${token} extra`,
  ])("rejects %j", (input) => {
    expect(parseQrPayload(input)).toBeNull();
  });

  it("refuses to build from a malformed token", () => {
    expect(() => buildQrPayload("short")).toThrow();
    expect(() => buildQrPayload(token.toUpperCase())).toThrow();
  });
});
