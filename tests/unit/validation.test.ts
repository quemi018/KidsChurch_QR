import { describe, expect, it } from "vitest";

import { buildSearchTerms } from "@/lib/admin/search";
import {
  guardianRegistrationSchema,
  loginSchema,
  optionalEmailSchema,
  withPasswordMismatch,
} from "@/lib/validation/auth";
import { openSessionSchema } from "@/lib/validation/sessions";

describe("loginSchema", () => {
  it("normalises the phone and requires a password", () => {
    const ok = loginSchema.safeParse({ phone: "0917 123 4567", password: "x" });
    expect(ok.success && ok.data.phone).toBe("+639171234567");
    expect(loginSchema.safeParse({ phone: "0917 123 4567", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ phone: "123", password: "x" }).success).toBe(false);
  });
});

describe("optionalEmailSchema", () => {
  it("treats blank as null and lowercases valid input", () => {
    expect(optionalEmailSchema.parse("")).toBeNull();
    expect(optionalEmailSchema.parse("  ")).toBeNull();
    expect(optionalEmailSchema.parse("Maria@Example.COM")).toBe("maria@example.com");
    expect(optionalEmailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("guardianRegistrationSchema", () => {
  const base = {
    fullName: "Maria Dela Cruz",
    guardianRelationship: "Mother",
    guardianRelationshipOther: "",
    phone: "09171234567",
    homeCity: "Caloocan",
    email: "",
    password: "TestPass123",
    confirmPassword: "TestPass123",
  };

  it("accepts a complete guardian", () => {
    expect(guardianRegistrationSchema.safeParse(base).success).toBe(true);
  });

  it("enforces the password minimum and confirmation", () => {
    expect(
      guardianRegistrationSchema.safeParse({ ...base, password: "short", confirmPassword: "short" })
        .success,
    ).toBe(false);
    const mismatch = guardianRegistrationSchema.safeParse({
      ...base,
      confirmPassword: "Different1",
    });
    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(mismatch.error.issues.some((i) => i.path[0] === "confirmPassword")).toBe(true);
    }
  });

  it("rejects an unknown relationship", () => {
    expect(
      guardianRegistrationSchema.safeParse({ ...base, guardianRelationship: "Neighbour" }).success,
    ).toBe(false);
  });
});

describe("withPasswordMismatch", () => {
  it("adds the mismatch alongside other field errors", () => {
    const fd = new FormData();
    fd.append("password", "abc12345");
    fd.append("confirmPassword", "different");
    expect(withPasswordMismatch({ phone: "bad" }, fd)).toEqual({
      phone: "bad",
      confirmPassword: "Passwords do not match.",
    });
  });
  it("leaves matching passwords alone", () => {
    const fd = new FormData();
    fd.append("password", "abc12345");
    fd.append("confirmPassword", "abc12345");
    expect(withPasswordMismatch({}, fd)).toEqual({});
  });
});

describe("openSessionSchema", () => {
  it("accepts an optional time and validates the date", () => {
    expect(
      openSessionSchema.safeParse({
        name: "Sunday Kids Church",
        sessionDate: "2026-09-20",
        serviceTime: "",
      }).success,
    ).toBe(true);
    const withTime = openSessionSchema.safeParse({
      name: "X",
      sessionDate: "2026-09-20",
      serviceTime: "09:00",
    });
    expect(withTime.success && withTime.data.serviceTime).toBe("09:00");
    expect(
      openSessionSchema.safeParse({ name: "X", sessionDate: "2026-02-30", serviceTime: "" })
        .success,
    ).toBe(false);
    expect(
      openSessionSchema.safeParse({ name: "", sessionDate: "2026-09-20", serviceTime: "" }).success,
    ).toBe(false);
  });
});

describe("buildSearchTerms", () => {
  it("matches names and rewrites local phone prefixes", () => {
    expect(buildSearchTerms("Maria")).toEqual({
      text: "Maria",
      namePattern: "%Maria%",
      phonePattern: null,
    });
    expect(buildSearchTerms("0917 123")).toMatchObject({
      phonePattern: "%63917123%",
      namePattern: null,
    });
    expect(buildSearchTerms("+639171")).toMatchObject({ phonePattern: "%639171%" });
  });
  it("strips characters that would alter the PostgREST filter", () => {
    expect(buildSearchTerms("a,b(c)%")).toMatchObject({ namePattern: "%abc%" });
    expect(buildSearchTerms("   ")).toEqual({ text: "", namePattern: null, phonePattern: null });
  });
});
