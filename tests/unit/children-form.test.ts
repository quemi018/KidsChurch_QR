import { describe, expect, it } from "vitest";

import { childFieldName, childSchema, parseChildrenFromForm } from "@/lib/validation/children";

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe("childSchema", () => {
  it("accepts a valid child and trims the name", () => {
    const result = childSchema.safeParse({
      fullName: "  Juan Dela Cruz ",
      gender: "Male",
      birthday: "2021-03-15",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe("Juan Dela Cruz");
  });

  it("rejects future birthdays, bad dates, and unknown genders", () => {
    expect(
      childSchema.safeParse({ fullName: "A", gender: "Male", birthday: "2099-01-01" }).success,
    ).toBe(false);
    expect(
      childSchema.safeParse({ fullName: "A", gender: "Male", birthday: "2021-02-30" }).success,
    ).toBe(false);
    expect(
      childSchema.safeParse({ fullName: "A", gender: "Other", birthday: "2021-01-01" }).success,
    ).toBe(false);
    expect(
      childSchema.safeParse({ fullName: "", gender: "Male", birthday: "2021-01-01" }).success,
    ).toBe(false);
  });
});

describe("parseChildrenFromForm (registration wizard)", () => {
  it("collects children in row order and ignores fully blank rows", () => {
    const result = parseChildrenFromForm(
      form({
        [childFieldName(2, "fullName")]: "Ana",
        [childFieldName(2, "gender")]: "Female",
        [childFieldName(2, "birthday")]: "2019-09-20",
        [childFieldName(0, "fullName")]: "Juan",
        [childFieldName(0, "gender")]: "Male",
        [childFieldName(0, "birthday")]: "2021-03-15",
        [childFieldName(5, "fullName")]: "",
        [childFieldName(5, "gender")]: "",
        [childFieldName(5, "birthday")]: "",
      }),
    );
    expect(result.fieldErrors).toEqual({});
    expect(result.children.map((c) => c.fullName)).toEqual(["Juan", "Ana"]);
  });

  it("reports errors keyed by the submitted field name", () => {
    const result = parseChildrenFromForm(
      form({
        [childFieldName(0, "fullName")]: "Juan",
        [childFieldName(0, "gender")]: "Male",
        [childFieldName(0, "birthday")]: "2099-01-01",
        [childFieldName(1, "fullName")]: "",
        [childFieldName(1, "gender")]: "Female",
        [childFieldName(1, "birthday")]: "2020-01-01",
      }),
    );
    expect(result.children).toHaveLength(0);
    expect(result.fieldErrors[childFieldName(0, "birthday")]).toMatch(/future/);
    expect(result.fieldErrors[childFieldName(1, "fullName")]).toMatch(/required/);
  });

  it("returns submitted values for repopulating the form", () => {
    const result = parseChildrenFromForm(form({ [childFieldName(3, "fullName")]: "Baby" }));
    expect(result.values[childFieldName(3, "fullName")]).toBe("Baby");
  });

  it("yields no children for an empty form", () => {
    expect(parseChildrenFromForm(form({})).children).toEqual([]);
  });
});
