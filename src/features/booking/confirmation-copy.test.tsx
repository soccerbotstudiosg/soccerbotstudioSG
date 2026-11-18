import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { blankDraft, type Booking } from "@/domain/booking";
import { BookingConfirmation, PendingConfirmation } from "./confirmation-step";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
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
test("payment continuation shows only its intended status and instruction beside the spinner", () => {
  const message = "Continue to pay. If already paid, please wait...";
  const continuation = <a href="https://example.test/pay">Continue payment</a>;
  const view = render(
    <PendingConfirmation
      label="Checking payment…"
      message={message}
      showSummary
    >
      {continuation}
    </PendingConfirmation>,
  );
  const check = () => {
    expect(
      screen.getByText("Checking payment…", { exact: true }),
    ).toBeVisible();
    expect(screen.getByText(message, { exact: true })).toBeVisible();
    expect(screen.queryByText("Loading...", { exact: true })).toBeNull();
    expect(
      screen.getByRole("status", { name: "Checking payment…" }).textContent,
    ).toBe("");
    expect(
      screen.getByRole("link", { name: "Continue payment" }),
    ).toBeVisible();
  };
  check();
  view.rerender(
    <BookingConfirmation
      booking={booking}
      pending
      pendingLabel="Checking payment…"
      pendingMessage={message}
      pendingAction={continuation}
      onAgain={() => {}}
    />,
  );
  check();
});
test("confirmed booking copies a formatted paid summary and reports clipboard failures honestly", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  const view = render(
    <BookingConfirmation booking={booking} onAgain={() => {}} />,
  );
  const button = screen.getByRole("button", {
    name: "Copy booking confirmation",
  });
  expect(button.textContent).toBe("");
  expect(button.querySelector("svg rect")).not.toBeNull();
  const details = document.querySelector(".confirmation-full-details")!;
  expect(button.closest("summary")).toBeNull();
  const paid = screen.getByText("Paid");
  expect(button.closest(".confirmation-paid-actions")).toBe(paid.parentElement);
  expect(paid.closest(".review-head")).toBe(
    screen.getByRole("heading", { name: "Your booking" }).parentElement,
  );
  expect(details.tagName).toBe("DIV");
  expect(screen.getByText("Booking Contact")).toBeVisible();
  expect(
    paid.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await act(async () => {
    fireEvent.click(button);
  });
  expect(screen.getByRole("status")).toHaveTextContent("Copied");
  expect(details.tagName).toBe("DIV");
  expect(screen.getByText("Booking Contact")).toBeVisible();
  const message = writeText.mock.calls[0][0];
  expect(message).toBe(
    [
      "SOCCERBOTSTUDIO Singapore",
      "Booking confirmed · Paid",
      "",
      "Date: Fri, 20 Nov 2026",
      "Time: 15:20–16:00 SGT",
      "Session: Synthetic session",
      "Trainer: Synthetic Trainer",
      "",
      "Players: 2",
      "",
      "Location",
      "Apex @ Henderson",
      "201 Henderson Road, #05-01",
      "Singapore 159545",
      "",
      "Total paid: SGD $108.00",
    ].join("\n"),
  );
  expect(message).not.toContain("synthetic-confirmation");
  await act(async () => {
    vi.advanceTimersByTime(2999);
  });
  expect(screen.getByText("Copied")).toBeVisible();
  await act(async () => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.queryByText("Copied")).toBeNull();
  await act(async () => {
    fireEvent.click(button);
  });
  await act(async () => {
    vi.advanceTimersByTime(2000);
  });
  await act(async () => {
    fireEvent.click(button);
  });
  await act(async () => {
    vi.advanceTimersByTime(2999);
  });
  expect(screen.getByText("Copied")).toBeVisible();
  await act(async () => {
    vi.advanceTimersByTime(1);
  });
  expect(screen.queryByText("Copied")).toBeNull();
  writeText.mockRejectedValueOnce(new Error("clipboard denied"));
  await act(async () => {
    fireEvent.click(button);
  });
  expect(screen.getByRole("status")).toHaveTextContent(
    "Couldn’t copy. Try again.",
  );
  expect(screen.queryByText("Copied")).toBeNull();
  let finish!: () => void;
  writeText.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await act(async () => {
    fireEvent.click(button);
  });
  expect(button).toBeDisabled();
  expect(screen.queryByText("Copied")).toBeNull();
  view.rerender(
    <BookingConfirmation
      booking={{ ...booking, reference: "next-booking" }}
      onAgain={() => {}}
    />,
  );
  await act(async () => {
    finish();
  });
  expect(screen.queryByText("Copied")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Copy booking confirmation" }),
    );
  });
  expect(screen.getByText("Copied")).toBeVisible();
  view.rerender(
    <BookingConfirmation booking={booking} preview onAgain={() => {}} />,
  );
  expect(
    screen.queryByRole("button", { name: "Copy booking confirmation" }),
  ).toBeNull();
  expect(screen.queryByText("Copied")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  view.rerender(<BookingConfirmation booking={booking} onAgain={() => {}} />);
  let fail!: (error: Error) => void;
  writeText.mockImplementationOnce(
    () =>
      new Promise<void>((_resolve, reject) => {
        fail = reject;
      }),
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Copy booking confirmation" }),
    );
  });
  view.rerender(
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
  await act(async () => {
    fail(new Error("late clipboard failure"));
  });
  expect(screen.queryByText("Couldn’t copy. Try again.")).toBeNull();
  expect(screen.queryByText("Copied")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  view.rerender(<BookingConfirmation booking={booking} onAgain={() => {}} />);
  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Copy booking confirmation" }),
    );
  });
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
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
  expect(screen.getByText("Booking Contact")).toBeVisible();
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
    screen.queryByText("Payment received; booking confirmation pending"),
  ).toBeNull();
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
