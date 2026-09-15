import { describe, expect, it } from "vitest";

import { calculateAge, calculateAgeOn, isValidYmd, toLocalYmd } from "@/lib/utils/age";

describe("calculateAgeOn (spec §27)", () => {
  it("counts a full year only once the birthday has passed", () => {
    expect(calculateAgeOn("2019-09-20", "2026-09-19")).toBe(6);
    expect(calculateAgeOn("2019-09-20", "2026-09-20")).toBe(7);
    expect(calculateAgeOn("2019-09-20", "2026-09-21")).toBe(7);
  });

  it("never approximates with year minus year", () => {
    // Born late in the year, evaluated early the next year: 0, not 1.
    expect(calculateAgeOn("2025-12-31", "2026-01-01")).toBe(0);
  });

  it("handles a leap-day birthday", () => {
    expect(calculateAgeOn("2020-02-29", "2024-02-28")).toBe(3);
    expect(calculateAgeOn("2020-02-29", "2024-02-29")).toBe(4);
    expect(calculateAgeOn("2020-02-29", "2025-03-01")).toBe(5);
  });

  it("clamps to zero for a birthday after the as-of date", () => {
    expect(calculateAgeOn("2026-10-01", "2026-09-15")).toBe(0);
  });

  it("rejects invalid dates", () => {
    expect(() => calculateAgeOn("2025-02-30", "2026-01-01")).toThrow();
    expect(() => calculateAgeOn("not-a-date", "2026-01-01")).toThrow();
  });
});

describe("calculateAge (as of now, Asia/Manila)", () => {
  it("uses the Manila calendar date, not UTC", () => {
    // 2026-09-14T16:30Z is already 2026-09-15 00:30 in Manila.
    const instant = new Date("2026-09-14T16:30:00Z");
    expect(toLocalYmd(instant)).toEqual({ year: 2026, month: 9, day: 15 });
    expect(calculateAge("2020-09-15", instant)).toBe(6);
    expect(calculateAge("2020-09-16", instant)).toBe(5);
  });
});

describe("isValidYmd", () => {
  it("validates calendar dates strictly", () => {
    expect(isValidYmd("2026-02-28")).toBe(true);
    expect(isValidYmd("2026-02-29")).toBe(false);
    expect(isValidYmd("2024-02-29")).toBe(true);
    expect(isValidYmd("2026-13-01")).toBe(false);
    expect(isValidYmd("26-01-01")).toBe(false);
  });
});
