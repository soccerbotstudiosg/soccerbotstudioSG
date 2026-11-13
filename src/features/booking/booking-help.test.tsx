import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { BookingHelp } from "./booking-help";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("booking help prevents duplicate clicks reports failures honestly and confirms only accepted reports", async () => {
  let finish!: (response: Response) => void;
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  render(
    <div className="alert calendar-recovery-notice" role="alert">
      <p>
        <strong>We couldn’t confirm your booking status.</strong>
      </p>
      <BookingHelp attemptId="00000000-0000-4000-8000-000000000001" />
      <ul>
        <li>Fri, 20 Nov 2026, 15:20–16:00.</li>
      </ul>
    </div>,
  );
  const button = screen.getByRole("button", { name: "Request Help" });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(button).toBeDisabled();
  expect(fetcher).toHaveBeenCalledTimes(1);
  await act(async () =>
    finish(Response.json({ status: "sent" }, { status: 503 })),
  );
  expect(screen.getByText(/Couldn’t send your request/)).toBeVisible();
  expect(button).not.toBeDisabled();
  fireEvent.click(button);
  await act(async () => finish(Response.json({ status: "sent" })));
  expect(screen.getByRole("button", { name: "Report sent" })).toBeDisabled();
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "We couldn’t confirm your booking status.",
  );
  expect(screen.getByRole("listitem")).toHaveTextContent(
    "Fri, 20 Nov 2026, 15:20–16:00.",
  );
  expect(
    screen.getByText("Your request has been sent to the studio."),
  ).toHaveAttribute("aria-live", "polite");
});
