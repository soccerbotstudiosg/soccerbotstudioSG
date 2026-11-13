import { z } from "zod";
import {
  validBookingPhone,
  normalizeBookingPhone,
  SINGAPORE_PHONE_ERROR,
  INTERNATIONAL_PHONE_ERROR,
} from "./phone";
import { CONTACT_METHODS } from "./catalog";
export const contactSchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  contactMethod: z.string(),
  academy: z.string(),
});
export type ContactDetails = z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<keyof ContactDetails, string>>;
export const blankContact = (): ContactDetails => ({
  name: "",
  email: "",
  phone: "",
  contactMethod: "email",
  academy: "",
});
export const EMAIL_MAX_LENGTH = 254;
const noControlCharacters = (value: string) =>
  !/[\x00-\x1f\x7f-\x9f]/.test(value);
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(noControlCharacters)
  .pipe(z.email().max(EMAIL_MAX_LENGTH));
export const contactNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .refine(noControlCharacters)
  .regex(/^(?:\p{L}\p{M}*|\p{Nd}|[ ’'-])+$/u)
  .refine((value) => /[\p{L}\p{Nd}]/u.test(value));
export const organisationSchema = z
  .string()
  .trim()
  .max(120)
  .regex(/^(?:\p{L}\p{M}*|\p{Nd}|[ ’'&.,()/+\-])*$/u);
export const contactPhoneSchema = z
  .string()
  .trim()
  .refine(validBookingPhone)
  .transform(normalizeBookingPhone);
export const validEmail = (value: string) =>
  emailSchema.safeParse(value).success;
export const validPhone = (value: string) =>
  contactPhoneSchema.safeParse(value).success;
/** Normalize customer contact fields before validation and storage. */
export function normalizeContact(contact: ContactDetails): ContactDetails {
  return Object.fromEntries(
    Object.entries(contactSchema.parse(contact)).map(([key, value]) => [
      key,
      key === "email"
        ? value.trim().toLowerCase()
        : key === "phone"
          ? normalizeBookingPhone(value)
          : value.trim(),
    ]),
  ) as ContactDetails;
}
/** Validate the required customer and guardian contact fields. */
export function contactErrors(
  contact: ContactDetails,
  verifiedEmail?: string,
): ContactErrors {
  const c = normalizeContact(contact),
    errors: ContactErrors = {};
  if (!contactNameSchema.safeParse(c.name).success)
    errors.name = "Enter the booking contact’s full name.";
  if (!validEmail(c.email)) errors.email = "Enter a valid email address.";
  else if (verifiedEmail && c.email !== verifiedEmail.trim().toLowerCase())
    errors.email = "Enter a valid email address.";
  if (!validPhone(c.phone))
    errors.phone =
      !c.phone.startsWith("+") || c.phone.startsWith("+65")
        ? SINGAPORE_PHONE_ERROR
        : INTERNATIONAL_PHONE_ERROR;
  if (!Object.hasOwn(CONTACT_METHODS, c.contactMethod))
    errors.contactMethod = "Select a contact method.";
  if (c.academy.length > 120)
    errors.academy = "Use no more than 120 characters.";
  else if (!organisationSchema.safeParse(c.academy).success)
    errors.academy = "Remove invalid characters from the organisation name.";
  return errors;
}

// Draft/read shapes remain permissive so existing contact data can be corrected.
// Every new contact write uses the same normalized validation as the forms.
export const validatedContactSchema = contactSchema
  .strict()
  .transform(normalizeContact)
  .superRefine((value, ctx) => {
    for (const [field, message] of Object.entries(contactErrors(value)))
      ctx.addIssue({ code: "custom", path: [field], message });
  });
export const contactProfileInputSchema = z.strictObject({
  email: emailSchema,
  name: contactNameSchema,
  phone: contactPhoneSchema,
});

// Retained journal protocol, not an HTTP input validator. Historical bookings
// must remain recoverable even when their contact predates stricter form rules.
export const journalContactSchema = contactSchema
  .strict()
  .refine(
    (value) =>
      value.name.length >= 2 &&
      value.name.length <= 80 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) &&
      value.email.length <= EMAIL_MAX_LENGTH &&
      (validBookingPhone(value.phone) ||
        (/^\+?[\d\s()-]{8,24}$/.test(value.phone) &&
          value.phone.replace(/\D/g, "").length >= 8 &&
          value.phone.replace(/\D/g, "").length <= 15)) &&
      value.contactMethod in CONTACT_METHODS &&
      value.academy.length <= 120 &&
      Object.values(value).every(
        (text) => text === text.trim() && !/[\x00-\x1f\x7f]/.test(text),
      ),
  );
