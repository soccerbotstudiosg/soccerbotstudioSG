import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/min";
export { getCountries, getCountryCallingCode, type CountryCode };
export const SINGAPORE_PHONE_ERROR =
  "Enter an 8-digit mobile number starting with 8 or 9.";
export const INTERNATIONAL_PHONE_ERROR =
  "Enter a valid mobile number for the selected country.";
const cleanCharacters = (value: string) => /^\+?[\d ()-]+$/.test(value);
/** Parse an explicitly international number, or a Singapore national number. */
function bookingPhone(value: string) {
  const text = value.trim();
  if (!cleanCharacters(text)) return undefined;
  // The whole input already passed the numeric/separator whitelist above.
  return parsePhoneNumberFromString(text, "SG");
}
/** Enforce Singapore mobile rules and a permissive international digit ceiling. */
export function validBookingPhone(value: string) {
  const text = value.trim(),
    phone = bookingPhone(text);
  if (!phone || phone.ext) return false;
  if (phone.countryCallingCode === "65")
    return /^[89]\d{7}$/.test(phone.nationalNumber);
  return (
    text.startsWith("+") &&
    phone.number.length >= 8 &&
    phone.number.length <= 16
  );
}
/** Store valid new numbers in canonical international format. */
export function normalizeBookingPhone(value: string) {
  return validBookingPhone(value) ? bookingPhone(value)!.number : value.trim();
}
/** Infer the country from saved international contact data. */
export function phoneCountry(value: string): CountryCode {
  const parsed = bookingPhone(value);
  if (parsed?.country) return parsed.country;
  if (parsed?.countryCallingCode === "1") return "US";
  return (
    getCountries().find((country) =>
      value.startsWith(`+${getCountryCallingCode(country)}`),
    ) ?? "SG"
  );
}
/** Extract the editable number while preserving invalid characters for feedback. */
export function nationalPhone(value: string, country: CountryCode) {
  const text = value.trim().replace(/[ ()-]/g, "");
  const prefix = `+${getCountryCallingCode(country)}`;
  return text.startsWith(prefix) ? text.slice(prefix.length) : text;
}
/** Keep intermediate input editable, but reject characters and excessive length. */
export function acceptsPhoneEdit(digits: string, country: CountryCode) {
  if (!/^\d*$/.test(digits)) return false;
  if (country === "SG") return digits === "" || /^[89]\d{0,7}$/.test(digits);
  const text = `+${getCountryCallingCode(country)}${digits}`;
  return text.length <= 16;
}
