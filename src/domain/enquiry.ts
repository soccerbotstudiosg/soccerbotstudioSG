import { ENQUIRY_TYPES } from "./catalog";
import {
  contactNameSchema,
  organisationSchema,
  validEmail,
  validPhone,
} from "./contact";
import { isDate, todaySG } from "./dates";
export type Enquiry = {
  name: string;
  email: string;
  phone: string;
  organisation: string;
  purpose: string;
  guests: string;
  date: string;
  time: string;
  message: string;
};

/** Apply the same field rules while editing and before enquiry submission. */
export function enquiryErrors(
  value: Enquiry,
): Partial<Record<keyof Enquiry, string>> {
  const errors: Partial<Record<keyof Enquiry, string>> = {};
  if (!contactNameSchema.safeParse(value.name).success)
    errors.name = "Enter your full name.";
  if (!validEmail(value.email)) errors.email = "Enter a valid email address.";
  if (!validPhone(value.phone))
    errors.phone = "Enter a valid mobile number with its country code.";
  if (!organisationSchema.safeParse(value.organisation).success)
    errors.organisation =
      value.organisation.trim().length > 120
        ? "Use no more than 120 characters."
        : "Remove invalid characters from the organisation name.";
  if (!ENQUIRY_TYPES.includes(value.purpose))
    errors.purpose = "Choose an enquiry type.";
  if (
    value.guests &&
    (!/^\d{1,3}$/.test(value.guests) || Number(value.guests) < 1)
  )
    errors.guests = "Enter a guest count from 1 to 999.";
  if (value.date && (!isDate(value.date) || value.date < todaySG()))
    errors.date = "Choose today or a future date.";
  if (value.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time))
    errors.time = "Enter a valid time.";
  if (!value.message.trim() || value.message.length > 2000)
    errors.message = "Enter your requirements using 1–2,000 characters.";
  else if (/[\p{Cc}\p{Cf}]/u.test(value.message.replace(/[\r\n\t]/g, "")))
    errors.message = "Remove invalid characters from your requirements.";
  return errors;
}
