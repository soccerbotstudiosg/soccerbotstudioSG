import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { blankDraft, type Booking } from "@/domain/booking";
import { BookingConfirmation } from "./confirmation-step";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const booking: Booking = {
  reference: "synthetic-confirmation",
  createdAt: "2026-11-13T00:00:00Z",
  draft: { ...blankDraft(), players: 2 },
  totalCents: 10800,
  slots: [
    {
      date: "2026-11-20",
      start: "15:20",
      studio: "Apex @ Henderson",
      instructor: "2",
      native: {
        serviceId: "3",
        serviceName: "Synthetic session",
        instructorName: "Synthetic Trainer",
        priceMinor: 10800,
        currency: "SGD",
      },
    },
  ],
};
test("confirmed booking copies a formatted paid summary and reports clipboard failures honestly", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  const view = render(
    <BookingConfirmation booking={booking} onAgain={() => {}} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Copy booking confirmation" }),
  );
  expect(await screen.findByText("Booking confirmation copied.")).toBeVisible();
  const message = writeText.mock.calls[0][0];
  expect(message).toContain("Booking confirmed · Paid\n");
  expect(message).toContain(
    "15:20–16:00 SGT\nSynthetic session\nTrainer: Synthetic Trainer",
  );
  expect(message).toContain("Players: 2");
  expect(message).toContain("Total paid: SGD $108.00");
  expect(message).not.toContain("synthetic-confirmation");
  writeText.mockRejectedValueOnce(new Error("clipboard denied"));
  fireEvent.click(screen.getByRole("button", { name: "Copied" }));
  expect(await screen.findByText(/Couldn’t copy/)).toBeVisible();
  view.rerender(
    <BookingConfirmation booking={booking} preview onAgain={() => {}} />,
  );
  expect(
    screen.queryByRole("button", { name: "Copy booking confirmation" }),
  ).toBeNull();
});
