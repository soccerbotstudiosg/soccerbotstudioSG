import { expect, test } from "vitest";
import { catalogueSchema } from "@/domain/catalog";
import { draftSchema, blankDraft } from "@/domain/booking";
function catalogue() {
  return catalogueSchema.parse({
    binding: {
      accountId: "synthetic",
      environmentId: "developer",
      companyLogin: "synthetic",
    },
    observedAtMs: Date.now(),
    complete: true,
    services: [
      {
        id: "12",
        name: "Session",
        active: true,
        durationMinutes: 40,
        recurring: false,
        priceMinor: 8800,
        currency: "SGD",
        instructorIds: ["14", "15"],
      },
    ],
    instructors: [
      { id: "14", name: "Same Name", active: true },
      { id: "15", name: "Same Name", active: true },
    ],
  });
}
test("shared catalogue schema accepts stable provider IDs without preview aliases", () => {
  const value = catalogue();
  expect(value.instructors.map((instructor) => instructor.id)).toEqual([
    "14",
    "15",
  ]);
  expect(
    catalogueSchema.safeParse({
      ...value,
      binding: { ...value.binding, environmentId: "production" },
    }).success,
  ).toBe(true);
  expect(
    catalogueSchema.safeParse({
      ...value,
      binding: { ...value.binding, environmentId: "unknown" },
    }).success,
  ).toBe(false);
  expect(
    catalogueSchema.safeParse({
      ...value,
      instructors: [{ id: "faisal", name: "Preview", active: true }],
    }).success,
  ).toBe(false);
  expect(draftSchema.parse(blankDraft())).toEqual(blankDraft());
});
test("shared catalogue schema rejects incomplete data and duplicate provider identities", () => {
  const value = catalogue();
  expect(catalogueSchema.safeParse({ ...value, complete: false }).success).toBe(
    false,
  );
  expect(
    catalogueSchema.safeParse({
      ...value,
      instructors: [value.instructors[0], value.instructors[0]],
    }).success,
  ).toBe(false);
  expect(
    catalogueSchema.safeParse({
      ...value,
      services: [{ ...value.services[0], instructorIds: ["14", "14"] }],
    }).success,
  ).toBe(false);
});
