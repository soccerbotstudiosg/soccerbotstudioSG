import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { BookingHelp } from "./booking-help";
import { BookingProvider } from "./provider";
import { demoBookingService } from "@/services/demo/booking";
const navigation = vi.hoisted(() => ({
  path: "/book/time/",
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => navigation,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
test("booking help prevents duplicate clicks reports failures honestly and confirms only accepted reports", async () => {
  for (const initialPath of ["/book/time/", "/confirmation/"]) {
    navigation.path = initialPath;
    sessionStorage.clear();
    let finish!: (response: Response) => void;
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetcher);
    let attemptId = "00000000-0000-4000-8000-000000000001";
    const tree = (show = true) => (
      <BookingProvider bookingService={demoBookingService}>
        {show && (
          <BookingHelp
            key={attemptId}
            attemptId={attemptId}
            className="calendar-recovery-notice"
          >
            <div className="booking-help-content">
              <p>
                <strong>We couldn’t confirm your booking status.</strong>
              </p>
              <ul>
                <li>Fri, 20 Nov 2026, 15:20–16:00.</li>
              </ul>
            </div>
          </BookingHelp>
        )}
      </BookingProvider>
    );
    let view = render(tree());
    const button = screen.getByRole("button", {
      name: "Ask the studio to contact me",
    });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button.querySelector(".spinner")).not.toBeNull();
    expect(button).toHaveTextContent("Sending request…");
    expect(
      document.querySelector(".page-loading, .booking-flow-overlay"),
    ).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () =>
      finish(Response.json({ status: "sent" }, { status: 503 })),
    );
    expect(screen.getByText(/Couldn’t send your request/)).toBeVisible();
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    await act(async () => finish(Response.json({ status: "sent" })));
    expect(
      screen.queryByRole("button", { name: "Ask the studio to contact me" }),
    ).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status")).toHaveClass("notice", "success");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Help has been requested. We will get back as soon as we can.",
    );
    expect(
      screen.queryByText("We couldn’t confirm your booking status."),
    ).toBeNull();
    view.rerender(tree());
    expect(screen.getByRole("status")).toHaveClass("success");
    view.unmount();
    view = render(tree());
    expect(screen.getByRole("status")).toHaveClass("success");
    expect(fetcher).toHaveBeenCalledTimes(2);
    navigation.path = "/book/session/";
    view.rerender(tree(false));
    navigation.path = initialPath;
    view.rerender(tree());
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Ask the studio to contact me" }),
    ).toBeNull();
    attemptId = "00000000-0000-4000-8000-000000000002";
    view.rerender(tree());
    expect(screen.getByRole("alert")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Ask the studio to contact me" }),
    );
    navigation.path = "/book/session/";
    view.rerender(tree(false));
    await act(async () => finish(Response.json({ status: "sent" })));
    navigation.path = initialPath;
    view.rerender(tree());
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    view.unmount();
  }
});
