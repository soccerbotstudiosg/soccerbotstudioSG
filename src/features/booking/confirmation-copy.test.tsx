import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { blankDraft, type Booking } from "@/domain/booking";
import { BookingConfirmation, PendingConfirmation } from "./confirmation-step";

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

test("unresolved post-payment confirmation keeps the receipt layout with a pending badge rather than a pending page", () => {
  const view = render(
    <BookingConfirmation
      booking={booking}
      pending
      pendingLabel="Pending"
      pendingNotice={
        <div role="alert">We couldn’t confirm your booking status.</div>
      }
      onAgain={() => {}}
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "We couldn’t confirm your booking status.",
  );
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  expect(screen.getByText("Pending")).toHaveClass(
    "confirmation-pending-status",
  );
  expect(screen.getByText("View Full Details")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Order Summary" })).toBeVisible();
  expect(screen.getByText("15:20–16:00 SGT")).toBeVisible();
  expect(screen.getByText("Total")).toBeVisible();
  expect(screen.queryByText("Total Paid")).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Copy booking confirmation" }),
  ).toBeNull();
  expect(screen.queryByText("Booking Confirmed")).toBeNull();
  view.rerender(
    <BookingConfirmation
      booking={booking}
      pending
      pendingLabel="Payment received; booking confirmation pending"
      pendingNotice={
        <div role="alert">We couldn’t confirm your booking status.</div>
      }
      onAgain={() => {}}
    />,
  );
  expect(screen.getByText("Pending")).toHaveClass(
    "confirmation-pending-status",
  );
  expect(
    screen.getByText("Payment received; booking confirmation pending").tagName,
  ).toBe("P");
  expect(screen.getByRole("heading", { name: "Order Summary" })).toBeVisible();
  view.rerender(
    <PendingConfirmation
      showSummary
      label="Pending"
      pendingNotice={
        <div role="alert">We couldn’t confirm your booking status.</div>
      }
    >
      <section aria-label="Current booking summary">
        2 players · 1 session
      </section>
    </PendingConfirmation>,
  );
  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  expect(screen.getByRole("heading", { name: "Order Summary" })).toBeVisible();
  expect(screen.getByText("Pending")).toHaveClass(
    "confirmation-pending-status",
  );
  expect(screen.getByLabelText("Current booking summary")).toHaveTextContent(
    "2 players · 1 session",
  );
  expect(screen.queryByText("Loading summary…")).toBeNull();
  view.rerender(
    <BookingConfirmation booking={booking} pending onAgain={() => {}} />,
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByText("Pending")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Order Summary" })).toBeNull();
  expect(screen.getByRole("status")).toHaveAttribute(
    "aria-label",
    "Checking payment…",
  );
});
