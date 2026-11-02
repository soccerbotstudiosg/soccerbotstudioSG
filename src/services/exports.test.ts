import { expect, test, vi } from "vitest";
import { blankDraft, type Booking } from "@/domain/booking";
import { calendarText, downloadBooking } from "./exports";
const pdf = vi.hoisted(() => ({ text: vi.fn(), save: vi.fn() }));
vi.mock("jspdf", () => ({
  jsPDF: class {
    setFontSize() {}
    splitTextToSize(text: string) {
      return [text];
    }
    text = pdf.text;
    save = pdf.save;
    addPage() {}
  },
}));
/** Build a synthetic export snapshot without provider access. */
function booking(): Booking {
  const draft = blankDraft();
  draft.players = 2;
  draft.contact.name = "Synthetic Customer";
  const slots = [
    {
      date: "2026-11-10",
      start: "12:00",
      instructor: "2",
      studio: "Studio",
      native: {
        serviceId: "3",
        serviceName: "Session",
        instructorName: "Trainer",
        priceMinor: 10800,
        currency: "SGD" as const,
      },
    },
  ];
  return {
    reference: "internal-attempt",
    createdAt: "2026-11-01T00:00:00Z",
    totalCents: 10800,
    draft: { ...draft, slots },
    slots,
    providerReferences: {
      bookingIds: ["internal-booking"],
      invoiceId: "internal-invoice",
      invoiceNumber: "INV-2026-42",
    },
  };
}
test("live booking PDF shows the official document number and WhatsApp contact without internal IDs", async () => {
  pdf.text.mockClear();
  pdf.save.mockClear();
  await downloadBooking(booking(), false);
  const text = pdf.text.mock.calls.map((call) => call[0]).join("\n");
  expect(text).toContain("Invoice number: INV-2026-42");
  expect(text).toContain("Booking details");
  expect(text).toContain("Glenna on WhatsApp: +65 9014 3819");
  expect(text).toContain(
    "Your booking stays unchanged until the studio confirms your request.",
  );
  expect(text).not.toMatch(
    /internal-attempt|internal-booking|internal-invoice|SimplyBook booking IDs|SimplyBook invoice ID/,
  );
  expect(pdf.save).toHaveBeenCalledWith("booking-details.pdf");
  pdf.text.mockClear();
  const legacy = booking();
  delete legacy.providerReferences!.invoiceNumber;
  await downloadBooking(legacy, false);
  expect(pdf.text.mock.calls.map((call) => call[0]).join("\n")).not.toMatch(
    /Invoice number|internal-attempt|internal-invoice/,
  );
});
test("calendar keeps stable event identities when the visible invoice number changes or is absent", () => {
  const value = booking();
  const first = calendarText(value, false);
  expect(first).toContain("Invoice INV-2026-42");
  expect(first).toContain("Glenna on WhatsApp");
  value.providerReferences!.invoiceNumber = "INV-2026-43";
  const second = calendarText(value, false);
  expect(second).toContain("Invoice INV-2026-43");
  expect(first.match(/^UID:.+$/gm)).toEqual(second.match(/^UID:.+$/gm));
  delete value.providerReferences!.invoiceNumber;
  const legacy = calendarText(value, false);
  expect(legacy.match(/^UID:.+$/gm)).toEqual(first.match(/^UID:.+$/gm));
  expect(legacy).toContain("DESCRIPTION:Booking details.");
  expect(legacy).not.toContain("DESCRIPTION:Booking internal-attempt");
});
