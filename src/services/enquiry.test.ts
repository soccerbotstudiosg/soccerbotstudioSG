import { expect, test } from "vitest";
import { enquiryErrors } from "@/domain/enquiry";
import { demoEnquiryService } from "@/services/demo/enquiry";
import { todaySG } from "@/domain/dates";
const valid = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+6581234567",
  organisation: "International Sports School",
  purpose: "Corporate booking",
  guests: "12",
  date: todaySG(),
  time: "14:30",
  message: "Hello, team!\nCan we book (12 people)?",
};
test("enquiry fields and submission share strict validation without rejecting ordinary prose", async () => {
  expect(enquiryErrors(valid)).toEqual({});
  await expect(demoEnquiryService.submit(valid)).resolves.toEqual({
    email: valid.email,
    delivered: false,
  });
  for (const patch of [
    { name: "John★" },
    { name: "a".repeat(81) },
    { email: "bad@email" },
    { phone: "+6561234567" },
    { organisation: "School★" },
    { organisation: "a".repeat(121) },
    { purpose: "constructor" },
    { guests: "1.5" },
    { guests: "0" },
    { guests: "1000" },
    { date: "2000-01-01" },
    { date: "2099-02-30" },
    { time: "25:10" },
    { message: "" },
    { message: "a".repeat(2001) },
    { message: "Text\u200bHidden" },
  ]) {
    const input = { ...valid, ...patch };
    expect(Object.keys(enquiryErrors(input))).toContain(Object.keys(patch)[0]);
    await expect(demoEnquiryService.submit(input)).rejects.toThrow();
  }
});
