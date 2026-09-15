import { describe, expect, it } from "vitest";

import {
  formatPhilippineMobile,
  isE164PhilippineMobile,
  normalizePhilippineMobile,
} from "@/lib/validation/phone";

describe("normalizePhilippineMobile", () => {
  it.each([
    ["09171234567", "+639171234567"],
    ["0917 123 4567", "+639171234567"],
    ["0917-123-4567", "+639171234567"],
    ["+639171234567", "+639171234567"],
    ["639171234567", "+639171234567"],
    ["9171234567", "+639171234567"],
    ["(0917) 123.4567", "+639171234567"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalizePhilippineMobile(input)).toBe(expected);
  });

  it.each([
    "",
    "12345",
    "0817123456",
    "091712345678", // too long
    "+1 555 123 4567",
    "0917abc4567",
    "+63 8171234567", // landline prefix, not mobile
  ])("rejects %s", (input) => {
    expect(normalizePhilippineMobile(input)).toBeNull();
  });
});

describe("isE164PhilippineMobile", () => {
  it("accepts only canonical +639XXXXXXXXX", () => {
    expect(isE164PhilippineMobile("+639171234567")).toBe(true);
    expect(isE164PhilippineMobile("09171234567")).toBe(false);
    expect(isE164PhilippineMobile("+6391712345678")).toBe(false);
  });
});

describe("formatPhilippineMobile", () => {
  it("renders local display format", () => {
    expect(formatPhilippineMobile("+639171234567")).toBe("0917 123 4567");
  });
  it("passes non-PH values through and handles empty", () => {
    expect(formatPhilippineMobile("+15551234567")).toBe("+15551234567");
    expect(formatPhilippineMobile(null)).toBe("");
    expect(formatPhilippineMobile(undefined)).toBe("");
  });
});
