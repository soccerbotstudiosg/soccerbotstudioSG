import { expect, test } from "vitest";
import {
  contactErrors,
  validatedContactSchema,
  contactProfileInputSchema,
  emailSchema,
  validEmail,
  normalizeContact,
  journalContactSchema,
} from "./contact";
import { nativePrepareSchema } from "./native-checkout";
const contact = {
  name: "José O’Neill 王",
  email: "test@example.com",
  phone: "+65 (8123) 4567",
  contactMethod: "email",
  academy: "",
};
const longEmail = `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(57)}.com`;
test("contact methods reject inherited properties while accepting every supported option", () => {
  for (const method of ["email", "phone", "sms", "whatsapp"])
    expect(
      validatedContactSchema.safeParse({ ...contact, contactMethod: method })
        .success,
    ).toBe(true);
  for (const method of ["constructor", "toString", "__proto__", "fax", ""])
    expect(
      contactErrors({ ...contact, contactMethod: method }).contactMethod,
    ).toBe("Select a contact method.");
});
test("contact writes trim outer whitespace and reject embedded controls without restricting international names", () => {
  expect(
    validatedContactSchema.parse({
      ...contact,
      name: `  ${contact.name}  `,
      email: " Test+Tag@Example.COM ",
    }),
  ).toEqual({
    ...contact,
    email: "test+tag@example.com",
    phone: "+6581234567",
  });
  for (const character of ["\n", "\r", "\t", "\0", "\u007f", "\u0085"]) {
    for (const field of ["name", "phone"] as const) {
      const changed = {
        ...contact,
        [field]:
          field === "name"
            ? `Test${character}Customer`
            : `8123${character}4567`,
      };
      expect(contactErrors(changed)[field]).toBeTruthy();
      expect(validatedContactSchema.safeParse(changed).success).toBe(false);
      expect(
        contactProfileInputSchema.safeParse({
          name: changed.name,
          phone: changed.phone,
          email: changed.email,
        }).success,
      ).toBe(false);
    }
  }
  expect(
    validatedContactSchema.safeParse({ ...contact, phone: "00000000" }).success,
  ).toBe(false);
  // Overseas numbers are not limited to today's country-specific numbering plan.
  for (const phone of [
    "+44 12345",
    "+44 123456",
    "+44 1234567890123",
    "+1 2345678",
  ]) {
    expect(
      validatedContactSchema.safeParse({ ...contact, phone }).success,
    ).toBe(true);
    expect(
      contactProfileInputSchema.safeParse({
        email: contact.email,
        name: contact.name,
        phone,
      }).success,
    ).toBe(true);
    expect(journalContactSchema.safeParse({ ...contact, phone }).success).toBe(
      true,
    );
  }
  for (const phone of [
    "+44 12345678901234",
    "+999 123456789",
    "+44 1234x5678",
  ]) {
    expect(
      validatedContactSchema.safeParse({ ...contact, phone }).success,
    ).toBe(false);
  }
  expect(
    journalContactSchema.safeParse({ ...contact, phone: "00000000" }).success,
  ).toBe(true);
});
test("email validation shares the 254 character boundary and preserves distinct aliases", () => {
  expect(longEmail).toHaveLength(254);
  for (const email of [contact.email, longEmail, " Test+Tag@Example.COM "]) {
    expect(validEmail(email)).toBe(true);
    expect(
      validatedContactSchema.safeParse({ ...contact, email }).success,
    ).toBe(true);
    expect(
      contactProfileInputSchema.safeParse({
        email,
        name: contact.name,
        phone: contact.phone,
      }).success,
    ).toBe(true);
  }
  for (const email of [
    longEmail.replace(".com", "d.com"),
    "a..b@example.com",
    "x@example",
    "x\ny@example.com",
  ]) {
    expect(validEmail(email)).toBe(false);
    expect(emailSchema.safeParse(email).success).toBe(false);
    expect(
      validatedContactSchema.safeParse({ ...contact, email }).success,
    ).toBe(false);
    expect(
      contactProfileInputSchema.safeParse({
        email,
        name: contact.name,
        phone: contact.phone,
      }).success,
    ).toBe(false);
  }
  expect(
    normalizeContact({ ...contact, email: "A.B+Tag@Example.COM" }).email,
  ).toBe("a.b+tag@example.com");
});
test("checkout request validation rejects invalid contacts before accepting a booking selection", () => {
  const input = {
    key: "00000000-0000-4000-8000-000000000001",
    accepted: true,
    contact,
    sessions: [
      {
        serviceId: "2",
        instructorId: "14",
        startMs: 1800000000000,
        players: 1,
        totalMinor: 10800,
      },
    ],
  };
  expect(nativePrepareSchema.safeParse(input).success).toBe(true);
  for (const patch of [
    { contactMethod: "constructor" },
    { phone: "8123\n4567" },
    { name: "Test\tCustomer" },
    { email: "a..b@example.com" },
  ])
    expect(
      nativePrepareSchema.safeParse({
        ...input,
        contact: { ...contact, ...patch },
      }).success,
    ).toBe(false);
});
