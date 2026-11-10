import type { CheckoutSelectionRejection } from "@/domain/native-checkout";
import * as renderTrace from "./confirmation-render-trace";
import ConfirmationPage from "@/app/confirmation/page";
import { BookingProvider } from "./provider";
import { BookingLoadingProvider } from "./booking-loading";
import {
  saveLiveDraft,
  expiryReconciliationDeadline,
} from "@/services/storage";
import { liveBookingService } from "@/services/booking";
import { demoCustomerIdentity } from "@/services/demo/identity";
import { blankDraft, type Attempt } from "@/domain/booking";
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ProtectedConfirmation } from "./protected-confirmation";
const first = "00000000-0000-4000-8000-000000000001",
  second = "00000000-0000-4000-8000-000000000002";
const receiptFixture = (now = Date.now()) => ({
  attemptId: first,
  verifiedAtMs: now,
  createdAtMs: now,
  totalMinor: 8800,
  taxMinor: 0,
  contact: {
    name: "Synthetic Customer",
    email: "synthetic@example.com",
    phone: "+6591234567",
    contactMethod: "email",
    academy: "",
  },
  sessions: [
    {
      serviceId: "12",
      serviceName: "Native Session",
      instructorId: "14",
      instructorName: "Native Trainer",
      startMs: now + 86400000,
      priceMinor: 8800,
      currency: "SGD",
      players: 2,
    },
  ],
});
afterEach(() => {
  expect(
    screen.queryByRole("button", { name: /check (?:payment )?status/i }),
  ).toBeNull();
  expect(document.querySelector(".payment-check-feedback")).toBeNull();
  cleanup();
  navigation.status = "canceled";
  vi.useRealTimers();
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});
it("shows checking before the protected server result and confirms only verified evidence", async () => {
  let finish!: (response: Response) => void;
  let finishReceipt!: (response: Response) => void;
  const confirmation = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const receipt = new Promise<Response>((resolve) => {
    finishReceipt = resolve;
  });
  const fetch = vi.fn((url: string) =>
    url.endsWith("/receipt") ? receipt : confirmation,
  );
  vi.stubGlobal("fetch", fetch);
  render(<ProtectedConfirmation attemptId={first} />);
  expect(
    screen.getByRole("status", { name: "Checking payment…" }),
  ).toBeInTheDocument();
  finish(Response.json({ status: "confirmed", reason: "verified" }));
  await screen.findByRole("status", { name: "Preparing confirmation…" });
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).not.toBeInTheDocument();
  finishReceipt(Response.json(receiptFixture()));
  expect(
    await screen.findByRole("heading", { name: "Booking Confirmed" }),
  ).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith(
    `/api/attempts/${first}/confirmation`,
    expect.objectContaining({
      credentials: "same-origin",
      redirect: "error",
      cache: "no-store",
    }),
  );
});
it("denied and malformed responses cannot show confirmation or protected details", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      Response.json({ status: "confirmed", reason: "browser-return" }),
    );
  vi.stubGlobal("fetch", fetch);
  const view = render(<ProtectedConfirmation attemptId={first} />);
  expect(
    await screen.findByRole("heading", { name: "Confirmation unavailable" }),
  ).toBeInTheDocument();
  fetch.mockResolvedValue(new Response(null, { status: 401 }));
  view.rerender(<ProtectedConfirmation attemptId={second} />);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(
    await screen.findByRole("heading", { name: "Confirmation unavailable" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).not.toBeInTheDocument();
});
it("a late reply from a previous attempt cannot confirm the current attempt", async () => {
  let finishFirst: (response: Response) => void = () => {};
  const fetch = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finishFirst = resolve;
        }),
    )
    .mockResolvedValue(
      Response.json({ status: "unresolved", reason: "paid_booking_invalid" }),
    );
  vi.stubGlobal("fetch", fetch);
  const view = render(<ProtectedConfirmation attemptId={first} />);
  view.rerender(<ProtectedConfirmation attemptId={second} />);
  expect(
    await screen.findByText(
      "Payment received. Contact us about your booking. Do not pay again.",
    ),
  ).toBeInTheDocument();
  finishFirst(Response.json({ status: "confirmed", reason: "verified" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("heading", { name: "Booking Confirmed" }),
    ).not.toBeInTheDocument(),
  );
  expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
});
it("temporary checking failure preserves the protected summary and repeat checkout uses the same link", async () => {
  vi.useFakeTimers();
  let finishRead: ((response: Response) => void) | undefined;
  let defer = false;
  const context = {
    attemptId: first,
    mode: "synthetic",
    checkout: { state: "available", url: `/__experiment/checkout/${first}` },
    summary: {
      players: 2,
      totalMinor: 8800,
      currency: "SGD",
      sessions: [{ startMs: 1, players: 2 }],
    },
    checking: {
      deadlineMs: Date.now() + 600000,
      nextCheckMs: 0,
      pollAfterMs: 5000,
    },
  };
  const fetch = vi.fn((url: string) =>
    defer && !url.endsWith("/checkout")
      ? new Promise<Response>((resolve) => {
          finishRead = resolve;
        })
      : Promise.resolve(
          url.endsWith("/checkout")
            ? Response.json(context)
            : new Response(null, { status: 503 }),
        ),
  );
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingLoadingProvider>
      <ProtectedConfirmation attemptId={first} checkoutMode="synthetic" />
    </BookingLoadingProvider>,
  );
  await act(async () => {});
  const heading = screen.getByRole("heading", {
    name: "Confirmation unavailable",
  });
  const link = screen.getByRole("link", {
    name: "Open checkout",
  });
  expect(link).toHaveAttribute("href", context.checkout.url);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(
    screen.getByRole("region", { name: "Current booking summary" }),
  ).toHaveTextContent("2 players");
  const { fireEvent } = await import("@testing-library/react");
  fireEvent.click(link);
  expect(
    screen.getByRole("link", { name: "Open checkout again" }),
  ).toHaveAttribute("href", context.checkout.url);
  expect(fetch).toHaveBeenCalledTimes(2);
  defer = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(
    screen.getByRole("heading", { name: "Confirmation unavailable" }),
  ).toBe(heading);
  expect(
    document.querySelector(".booking-flow-overlay, .page-loading"),
  ).toBeNull();
  expect(screen.queryByRole("status", { name: "Checking status…" })).toBeNull();
  await act(async () => finishRead!(new Response(null, { status: 503 })));
  expect(
    screen.getByRole("heading", { name: "Confirmation unavailable" }),
  ).toBe(heading);
});
it("access denial hides a previously loaded checkout context", async () => {
  const context = {
    attemptId: first,
    mode: "synthetic",
    checkout: { state: "available", url: `/__experiment/checkout/${first}` },
    summary: {
      players: 2,
      totalMinor: 8800,
      currency: "SGD",
      sessions: [{ startMs: 1, players: 2 }],
    },
    checking: {
      deadlineMs: Date.now() + 600000,
      nextCheckMs: 0,
      pollAfterMs: 5000,
    },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith("/checkout")
          ? Response.json(context)
          : new Response(null, { status: 401 }),
      ),
    ),
  );
  render(<ProtectedConfirmation attemptId={first} checkoutMode="synthetic" />);
  await screen.findByText(/Contact the studio to view this booking/);
  expect(
    screen.queryByRole("region", { name: "Current booking summary" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Open checkout/ }),
  ).not.toBeInTheDocument();
});

it("verified live receipt shows provider invoice number without internal IDs or export actions", async () => {
  const now = Date.now();
  const receipt = {
    ...receiptFixture(now + 120000),
    providerReferences: {
      bookingIds: ["701"],
      invoiceId: "901",
      invoiceNumber: "INV-2026-TEST",
    },
  };
  let reads = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith("/receipt")
          ? ++reads === 1
            ? Response.json(receipt, {
                headers: { Date: new Date(now + 120000).toUTCString() },
              })
            : new Response(null, { status: 401 })
          : Response.json({ status: "confirmed", reason: "verified" }),
      ),
    ),
  );
  render(<ProtectedConfirmation attemptId={first} />);
  await screen.findByText("View Full Details");
  const orderSummary = await screen.findByRole("region", {
    name: "Order Summary",
  });
  expect(orderSummary).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "Booking Confirmed" })
      .nextElementSibling,
  ).toHaveTextContent("Your booking confirmation will be emailed to you.");
  expect(orderSummary.closest("details")).toBeNull();
  expect(
    screen
      .getByRole("heading", { name: "Before Your Session" })
      .closest("details"),
  ).not.toHaveAttribute("open");
  expect(orderSummary.querySelector(".series-list")).not.toHaveTextContent(
    "Paid",
  );
  expect(
    orderSummary.querySelector(".confirmation-paid-amount"),
  ).toHaveTextContent("SGD $88.00");
  expect(
    orderSummary.querySelector(".review-head .confirmation-paid-status"),
  ).toHaveTextContent("Paid");
  fireEvent.click(await screen.findByText("View Full Details"));
  expect(
    Array.from(document.querySelectorAll(".confirmation-card h2")).map(
      (node) => node.textContent,
    ),
  ).toEqual([
    "Your Sessions",
    "Booking Contact",
    "Location",
    "Before Your Session",
    "Order Summary",
  ]);
  expect(
    await screen.findByRole("heading", { name: "Booking Contact" }),
  ).toBeInTheDocument();
  for (const name of ["Location", "Before Your Session"])
    expect(screen.getByRole("heading", { name })).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Order Summary" }),
  ).toHaveTextContent("SGD $88.00");
  expect(
    screen.queryByRole("region", { name: "Amount" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Session Details" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Before Your Session" }),
  ).toHaveClass("confirmation-disclaimers");
  expect(
    screen.getByRole("region", { name: "Before Your Session" }),
  ).toHaveTextContent("bring a towel");
  expect(screen.getByText("Trainer: Native Trainer")).toBeInTheDocument();
  expect(screen.queryByText("701")).not.toBeInTheDocument();
  expect(screen.queryByText("901")).not.toBeInTheDocument();
  expect(screen.queryByText(/SoccerBot reference/)).not.toBeInTheDocument();
  expect(screen.getByText(/Invoice number/)).toBeInTheDocument();
  expect(screen.getByText("INV-2026-TEST")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "WhatsApp Enquiry" }),
  ).toHaveAttribute("href", "https://wa.me/6590143819");
  expect(
    screen.getByRole("link", { name: "WhatsApp Enquiry" }),
  ).toHaveAttribute("target", "_blank");
  expect(
    screen.getByRole("link", { name: "WhatsApp Enquiry" }),
  ).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.queryByText("Paid · Preview")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: /Add to calendar|Download booking details/,
    }),
  ).toBeNull();
  expect(reads).toBe(1);
});

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  status: "canceled",
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => navigation,
  useSearchParams: () =>
    new URLSearchParams(
      `attempt=00000000-0000-4000-8000-000000000001&status=${navigation.status}`,
    ),
}));
it("booking restoration does not restart a protected confirmation read", async () => {
  let finishRestore!: (attempt: Attempt | null) => void;
  const restore = vi.fn(
    () =>
      new Promise<Attempt | null>((resolve) => {
        finishRestore = resolve;
      }),
  );
  const fetch = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/confirmation")
        ? Response.json({ status: "confirmed", reason: "verified" })
        : new Response(null, { status: 503 }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        publicCalendar: undefined,
        calendar: undefined,
        restore,
      }}
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <ConfirmationPage />
    </BookingProvider>,
  );
  expect(restore).toHaveBeenCalledTimes(1);
  expect(
    await screen.findByRole("heading", { name: "Booking Confirmed" }),
  ).toBeInTheDocument();
  expect(
    fetch.mock.calls.filter(([url]) => url.endsWith("/confirmation")),
  ).toHaveLength(1);
  await act(async () =>
    finishRestore({
      id: first,
      status: "checking",
      draft: blankDraft(),
      outcome: "pending",
      checkUntil: Date.now() + 600000,
      booking: null,
    }),
  );
  expect(
    await screen.findByRole("heading", { name: "Booking Confirmed" }),
  ).toBeInTheDocument();
  expect(
    fetch.mock.calls.filter(([url]) => url.endsWith("/confirmation")),
  ).toHaveLength(1);
});
it("failed booking restoration does not block independent protected confirmation", async () => {
  const fetch = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/confirmation")
        ? Response.json({ status: "confirmed", reason: "verified" })
        : new Response(null, { status: 503 }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        publicCalendar: undefined,
        calendar: undefined,
        restore: async () => {
          throw new Error("synthetic restoration unavailable");
        },
      }}
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <ConfirmationPage />
    </BookingProvider>,
  );
  expect(
    await screen.findByRole("heading", { name: "Booking Confirmed" }),
  ).toBeInTheDocument();
  expect(
    fetch.mock.calls.filter(([url]) => url.endsWith("/confirmation")),
  ).toHaveLength(1);
});
it("expired checking shows authenticated recorded payment without confirming or exporting stale booking evidence", async () => {
  const deadline = Date.now() - 1000;
  localStorage.setItem(
    `soccerbot-checking:${first}`,
    JSON.stringify({ deadline, next: 0, count: 1 }),
  );
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("/confirmation"))
      return Response.json({
        status: "unresolved",
        reason: "payment_received_booking_pending",
      });
    if (!url.endsWith("/checkout"))
      throw new Error("Unexpected receipt request");
    return Response.json({
      attemptId: first,
      mode: "live",
      checkout: { state: "unavailable" },
      payment: { status: "recorded", paidAtMs: deadline - 60000 },
      details: Object.fromEntries(
        Object.entries(receiptFixture()).filter(
          ([key]) => key !== "verifiedAtMs",
        ),
      ),
      summary: {
        players: 2,
        totalMinor: 8800,
        currency: "SGD",
        sessions: [{ startMs: Date.now() + 86400000, players: 2 }],
      },
      checking: { deadlineMs: deadline, nextCheckMs: 0, pollAfterMs: 5000 },
    });
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        publicCalendar: undefined,
        calendar: undefined,
      }}
      identityService={demoCustomerIdentity}
    >
      <ConfirmationPage />
    </BookingProvider>,
  );
  expect(
    await screen.findByRole("heading", {
      name: "Payment received",
    }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Do not pay again/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Check status" })).toBeNull();
  expect(screen.getByText("Trainer: Native Trainer")).toBeVisible();
  expect(screen.getByLabelText("Current booking summary")).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Open checkout/ }),
  ).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${first}`)!).deadline,
  ).toBe(deadline);
});
it("restoring a held attempt blocks background calendar work before and after restoration", async () => {
  saveLiveDraft(blankDraft(), true, first);
  let finish!: (attempt: Attempt) => void;
  const restore = vi.fn(
    () =>
      new Promise<Attempt>((resolve) => {
        finish = resolve;
      }),
  );
  const publicCalendar = vi.fn();
  const fetch = vi.fn(() =>
    Promise.reject(new Error("Unexpected catalogue request")),
  );
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingProvider
      bookingService={{ ...liveBookingService, restore, publicCalendar }}
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <p>Restoring</p>
    </BookingProvider>,
  );
  await act(async () => {});
  expect(restore).toHaveBeenCalledTimes(1);
  expect(publicCalendar).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  await act(async () =>
    finish({
      id: first,
      status: "ready",
      draft: blankDraft(),
      outcome: "pending",
      checkUntil: Date.now() + 600000,
      booking: null,
    }),
  );
  expect(publicCalendar).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it("reopening an expired paid booking shows the saved full confirmation without polling or granting exports", async () => {
  const now = Date.now();
  const saved = receiptFixture(now - 3600000);
  localStorage.setItem(
    `soccerbot-checking:${first}`,
    JSON.stringify({ deadline: now - 1000, next: 0, count: 120 }),
  );
  const fetch = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/checkout")
        ? Response.json({
            attemptId: first,
            mode: "live",
            confirmation: saved,
            payment: { status: "recorded", paidAtMs: saved.verifiedAtMs },
            checkout: { state: "unavailable" },
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [{ startMs: now + 86400000, players: 2 }],
            },
            checking: {
              deadlineMs: now - 1000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          })
        : new Response(null, { status: 409 }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  const page = render(
    <ProtectedConfirmation attemptId={first} checkoutMode="live" />,
  );
  fireEvent.click(await screen.findByText("View Full Details"));
  await screen.findByRole("heading", { name: "Booking Contact" });
  expect(screen.getByText(/Verified/)).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
  page.unmount();
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  fireEvent.click(await screen.findByText("View Full Details"));
  await screen.findByRole("heading", { name: "Booking Contact" });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(
    screen.queryByRole("button", {
      name: /Add to calendar|Download booking details/,
    }),
  ).toBeNull();
  expect(fetch.mock.calls.map(([url]) => url.split("/").at(-1))).toEqual([
    "checkout",
    "checkout",
  ]);

  const assign = vi.fn();
  vi.stubGlobal(
    "window",
    new Proxy(window, {
      get(target, key) {
        return key === "location"
          ? { assign }
          : Reflect.get(target, key, target);
      },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Make another booking" }));
  await waitFor(() =>
    expect(fetch.mock.calls.at(-1)?.[0]).toBe(`/api/attempts/${first}/dismiss`),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Please try again to leave this booking",
  );
  expect(assign).not.toHaveBeenCalled();
  fetch.mockImplementationOnce(() =>
    Promise.resolve(Response.json({ dismissed: true })),
  );
  fireEvent.click(screen.getByRole("button", { name: "Make another booking" }));
  await waitFor(() =>
    expect(assign).toHaveBeenCalledWith(
      expect.stringContaining("/book/account/"),
    ),
  );
  fetch.mockImplementationOnce(() =>
    Promise.resolve(Response.json({ dismissed: true })),
  );
  fireEvent.click(screen.getByRole("link", { name: "Back to home" }));
  await waitFor(() => expect(assign).toHaveBeenCalledTimes(2));
  expect(fetch.mock.calls.at(-1)?.[0]).toBe(`/api/attempts/${first}/dismiss`);
});

it("pending checkout context uses the full checkout loader without summary or success", async () => {
  let finish!: (response: Response) => void;
  const context = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetch = vi.fn((url: string) =>
    url.endsWith("/checkout")
      ? context
      : Promise.resolve(
          Response.json({ status: "pending", reason: "missing_evidence" }),
        ),
  );
  vi.stubGlobal("fetch", fetch);
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  expect(
    screen.getByRole("status", { name: "Checking booking…" }),
  ).toBeVisible();
  expect(
    document.querySelector(".page-loading .page-loading-orbit"),
  ).not.toBeNull();
  expect(document.querySelector(".confirmation-shell")).toBeNull();
  expect(screen.queryByLabelText("Booking summary")).toBeNull();
  expect(
    screen.queryByRole("link", { name: /Open checkout/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).not.toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
  finish(
    Response.json({
      attemptId: first,
      mode: "live",
      checkout: { state: "unavailable" },
      summary: {
        players: 2,
        totalMinor: 8800,
        currency: "SGD",
        sessions: [{ startMs: 1, players: 2 }],
      },
      checking: {
        deadlineMs: Date.now() + 600000,
        nextCheckMs: 0,
        pollAfterMs: 5000,
      },
    }),
  );
  await screen.findByRole("status", { name: "Checking payment…" });
  expect(
    screen.queryByRole("region", { name: "Current booking summary" }),
  ).toBeNull();
  expect(
    document.querySelector(".page-loading .page-loading-orbit"),
  ).not.toBeNull();
  expect(
    screen.queryByRole("link", { name: /Open checkout/ }),
  ).not.toBeInTheDocument();
});

it("pending confirmation uses the full checkout loader until verified confirmation replaces it", async () => {
  const trace = vi.spyOn(renderTrace, "useConfirmationRenderTrace");
  const receipt = receiptFixture();
  const details = { ...receipt };
  Reflect.deleteProperty(details, "verifiedAtMs");
  let complete!: (value: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    complete = resolve;
  });
  let finishReceipt!: (value: Response) => void;
  const delayedReceipt = new Promise<Response>((resolve) => {
    finishReceipt = resolve;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.endsWith("/checkout"))
        return Promise.resolve(
          Response.json({
            attemptId: first,
            mode: "live",
            details,
            checkout: { state: "unavailable" },
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [{ startMs: details.sessions[0].startMs, players: 2 }],
            },
            checking: {
              deadlineMs: Date.now() + 600000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          }),
        );
      return url.endsWith("/receipt") ? delayedReceipt : pending;
    }),
  );
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  await screen.findByRole("status", { name: "Checking payment…" });
  expect(screen.queryByText("View Full Details")).toBeNull();
  expect(screen.queryByLabelText("Booking summary")).toBeNull();
  expect(
    screen.getByText("Please do not close or refresh.", { exact: false }),
  ).toBeVisible();
  expect(document.querySelector(".confirmation-card")).toBeNull();
  expect(
    document.querySelector(".page-loading .page-loading-orbit"),
  ).not.toBeNull();
  expect(document.querySelector(".booking-loading-inline")).toBeNull();
  for (const name of ["Booking Contact", "Location", "Before Your Session"])
    expect(screen.queryByRole("heading", { name })).toBeNull();
  expect(screen.queryByText("Synthetic Customer")).toBeNull();
  expect(
    screen.getByRole("status", { name: "Checking payment…" }),
  ).toBeVisible();
  expect(trace.mock.calls.at(-1)?.[0]).toMatchObject({
    state: undefined,
    proofSource: "none",
  });
  expect(screen.queryByText("Paid", { exact: true })).toBeNull();
  expect(screen.queryByLabelText("Booking actions")).toBeNull();
  expect(screen.queryByRole("link", { name: "Back to home" })).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).toBeNull();
  await act(async () =>
    complete(Response.json({ status: "confirmed", reason: "verified" })),
  );
  await screen.findByRole("heading", { name: "Booking Confirmed" });
  expect(document.querySelector(".confirmation-card")).not.toBeNull();
  expect(document.querySelector(".page-loading")).toBeNull();
  expect(screen.getByLabelText("Booking actions")).toBeVisible();
  expect(screen.getByRole("link", { name: "Back to home" })).toBeVisible();
  expect(trace.mock.calls.at(-1)?.[0].state).toBe("confirmed");
  expect(trace.mock.calls.at(-1)?.[0].proofSource).toBe("confirmed_status");
  const confirmedHeading = screen.getByRole("heading", {
    name: "Booking Confirmed",
  });
  await act(async () => finishReceipt(Response.json(receipt)));
  expect(screen.getByRole("heading", { name: "Booking Confirmed" })).toBe(
    confirmedHeading,
  );
  expect(document.querySelector(".page-loading")).toBeNull();
  expect(trace.mock.calls.at(-1)?.[0].proofSource).toBe("receipt");
  trace.mockRestore();
});

it("Back to home starts the shared background exit and navigates without awaiting dismissal", async () => {
  const receipt = receiptFixture();
  const restart = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        attemptId: first,
        mode: "live",
        confirmation: receipt,
        checkout: { state: "unavailable" },
        summary: {
          players: 2,
          totalMinor: 8800,
          currency: "SGD",
          sessions: [{ startMs: receipt.sessions[0].startMs, players: 2 }],
        },
        checking: {
          deadlineMs: Date.now() + 600000,
          nextCheckMs: 0,
          pollAfterMs: 5000,
        },
      }),
    ),
  );
  render(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      onRestart={restart}
    />,
  );
  await screen.findByRole("heading", { name: "Booking Confirmed" });
  fireEvent.click(screen.getByRole("link", { name: "Back to home" }));
  expect(restart).toHaveBeenCalledWith(first);
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/"));
});

it("verified payment shows confirmation before reconciliation without export actions", async () => {
  const proof = receiptFixture();
  let finish!: (value: Response) => void;
  const verification = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetch = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/checkout")
        ? Response.json({
            attemptId: first,
            mode: "live",
            customerConfirmation: proof,
            details: Object.fromEntries(
              Object.entries(proof).filter(([key]) => key !== "verifiedAtMs"),
            ),
            checkout: { state: "unavailable" },
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [{ startMs: proof.sessions[0].startMs, players: 2 }],
            },
            checking: {
              deadlineMs: Date.now() + 600000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          })
        : url.endsWith("/receipt")
          ? Response.json({ error: "receipt_not_verified" }, { status: 409 })
          : verification,
    ),
  );
  vi.stubGlobal("fetch", fetch);
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  await screen.findByRole("heading", { name: "Booking Confirmed" });
  fireEvent.click(screen.getByText("View Full Details"));
  expect(screen.getByText("Total Paid", { exact: true })).toBeVisible();
  expect(
    screen.queryByRole("button", {
      name: /Add to calendar|Download booking details/,
    }),
  ).toBeNull();
  expect(
    screen.getByRole("heading", { name: "Booking Confirmed" }),
  ).toBeVisible();
  expect(
    document.querySelector(".booking-flow-overlay, .page-loading"),
  ).toBeNull();
  expect(
    fetch.mock.calls.filter(([url]) => url.endsWith("/receipt")),
  ).toHaveLength(0);
  await act(async () =>
    finish(Response.json({ status: "confirmed", reason: "verified" })),
  );
  await waitFor(() =>
    expect(
      fetch.mock.calls.filter(([url]) => url.endsWith("/receipt")),
    ).toHaveLength(1),
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(
    screen.getByRole("heading", { name: "Booking Confirmed" }),
  ).toBeVisible();
  expect(
    fetch.mock.calls.filter(([url]) => url.endsWith("/receipt")),
  ).toHaveLength(1);
});

it("manual review supersedes an earlier customer confirmation without exposing downloads", async () => {
  const proof = receiptFixture();
  let finish!: (value: Response) => void;
  const verification = new Promise<Response>((resolve) => {
    finish = resolve;
  });
  const fetch = vi.fn((url: string) =>
    Promise.resolve(
      url.endsWith("/checkout")
        ? Response.json({
            attemptId: first,
            mode: "live",
            customerConfirmation: proof,
            details: Object.fromEntries(
              Object.entries(proof).filter(([key]) => key !== "verifiedAtMs"),
            ),
            checkout: { state: "unavailable" },
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [{ startMs: proof.sessions[0].startMs, players: 2 }],
            },
            checking: {
              deadlineMs: Date.now() + 600000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          })
        : url.endsWith("/receipt")
          ? Response.json({ error: "receipt_not_verified" }, { status: 409 })
          : verification,
    ),
  );
  vi.stubGlobal("fetch", fetch);
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  await screen.findByRole("heading", { name: "Booking Confirmed" });
  await act(async () =>
    finish(
      Response.json({
        status: "unresolved",
        reason: "payment_received_booking_pending",
      }),
    ),
  );
  await screen.findByRole("heading", {
    name: "Payment received; booking confirmation pending",
  });
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Payment received. Contact us about your booking. Do not pay again.",
  );
  expect(screen.queryByText(/We’re still checking your payment/)).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: "Download booking details" }),
  ).toBeNull();
  expect(
    fetch.mock.calls.filter(([url]) => url.endsWith("/receipt")),
  ).toHaveLength(0);
});

it("authoritative unpaid expiry releases the original attempt before returning to the calendar", async () => {
  const proof = receiptFixture();
  const onExpired = vi.fn();
  let release!: (value: Response) => void;
  const released = new Promise<Response>((resolve) => {
    release = resolve;
  });
  let expired = true;
  let deadline = Date.now() + 600000;
  const fetch = vi.fn((url: string) =>
    url.endsWith("/expire")
      ? url.includes(second)
        ? Promise.resolve(new Response(null, { status: 503 }))
        : released
      : Promise.resolve(
          Response.json(
            url.endsWith("/checkout")
              ? {
                  attemptId: url.includes(second) ? second : first,
                  mode: "live",
                  expired,
                  details: Object.fromEntries(
                    Object.entries({
                      ...proof,
                      attemptId: url.includes(second) ? second : first,
                    }).filter(([key]) => key !== "verifiedAtMs"),
                  ),
                  checkout: { state: "unavailable" },
                  summary: {
                    players: 2,
                    totalMinor: 8800,
                    currency: "SGD",
                    sessions: [
                      { startMs: proof.sessions[0].startMs, players: 2 },
                    ],
                  },
                  checking: {
                    deadlineMs: deadline,
                    nextCheckMs: 0,
                    pollAfterMs: 5000,
                  },
                }
              : { status: "pending", reason: "payment_verification_pending" },
          ),
        ),
  );
  vi.stubGlobal("fetch", fetch);
  const view = render(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      onExpired={onExpired}
    />,
  );
  await waitFor(() =>
    expect(fetch.mock.calls.some(([url]) => url.endsWith("/expire"))).toBe(
      true,
    ),
  );
  expect(onExpired).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "Check status" })).toBeNull();
  await act(async () => release(Response.json({ expired: true })));
  expect(onExpired).toHaveBeenCalledExactlyOnceWith(first);
  expect(navigation.replace).toHaveBeenCalledWith("/book/time/");
  view.rerender(
    <ProtectedConfirmation
      attemptId={second}
      checkoutMode="live"
      onExpired={onExpired}
    />,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "We couldn’t confirm that your reservation was released.",
  );
  expect(onExpired).toHaveBeenCalledTimes(1);
  expired = false;
  view.rerender(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      sessionRevision={1}
      onExpired={onExpired}
    />,
  );
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).toBeNull();
  expect(onExpired).toHaveBeenCalledTimes(1);
  const onAwaitingExpiry = vi.fn(() => true);
  deadline = Date.now() - 1;
  view.rerender(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      sessionRevision={2}
      onExpired={onExpired}
      onAwaitingExpiry={onAwaitingExpiry}
    />,
  );
  await waitFor(() =>
    expect(onAwaitingExpiry).toHaveBeenCalledExactlyOnceWith(first),
  );
  expect(onExpired).toHaveBeenCalledTimes(1);
  expect(navigation.replace).toHaveBeenLastCalledWith("/book/time/");
  view.rerender(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      sessionRevision={2}
      onExpired={onExpired}
      calendarRecovery
    />,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Your payment window has ended. These sessions may not be available to book again immediately. Please try again later.",
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByRole("listitem")).toHaveTextContent(/–/);
  expect(screen.queryByRole("link", { name: "Back to home" })).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();
  expect(document.querySelector(".booking-flow-overlay, .spinner")).toBeNull();
  expect(screen.queryByRole("button", { name: "Check status" })).toBeNull();
  view.unmount();
  vi.useFakeTimers();
  let releaseCalls = 0;
  fetch.mockImplementation(async (url: string) => {
    if (url.endsWith("/expire")) {
      releaseCalls++;
      return releaseCalls === 1
        ? new Response(null, { status: 503 })
        : Response.json({ expired: true });
    }
    return url.endsWith("/checkout")
      ? Response.json({
          attemptId: first,
          mode: "live",
          expired: true,
          checkout: { state: "unavailable" },
          summary: {
            players: 2,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [{ startMs: proof.sessions[0].startMs, players: 2 }],
          },
          checking: {
            deadlineMs: Date.now(),
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        })
      : Response.json({
          status: "unresolved",
          reason: "payment_verification_pending",
        });
  });
  render(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      sessionRevision={3}
      calendarRecovery
      onExpired={onExpired}
    />,
  );
  await act(async () => {});
  expect(releaseCalls).toBe(1);
  expect(screen.queryByRole("status")).toBeNull();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(29999);
  });
  expect(releaseCalls).toBe(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(releaseCalls).toBe(2);
  expect(onExpired).toHaveBeenCalledTimes(2);
  expect(onExpired).toHaveBeenLastCalledWith(first);
  expect(navigation.replace).toHaveBeenLastCalledWith("/book/time/");
});

it("poll-confirmed payment retains its displayed proof while the final receipt is delayed", async () => {
  vi.useFakeTimers();
  for (const initialStatus of ["pending", "confirmed"]) {
    const proof = receiptFixture();
    let finishReceipt!: (response: Response) => void;
    const receipt = new Promise<Response>((resolve) => {
      finishReceipt = resolve;
    });
    let polls = 0;
    const fetch = vi.fn((url: string) =>
      url.endsWith("/receipt")
        ? receipt
        : Promise.resolve(
            Response.json(
              ++polls === 1
                ? {
                    status: initialStatus,
                    reason:
                      initialStatus === "confirmed"
                        ? "verified"
                        : "payment_received_booking_pending",
                    customerConfirmation: proof,
                  }
                : { status: "confirmed", reason: "verified" },
            ),
          ),
    );
    vi.stubGlobal("fetch", fetch);
    render(<ProtectedConfirmation attemptId={first} />);
    await act(async () => {});
    const heading = screen.getByRole("heading", { name: "Booking Confirmed" });
    const verified = screen.getByText(/^Verified /).textContent;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(
      fetch.mock.calls.filter(([url]) => url.endsWith("/receipt")),
    ).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Booking Confirmed" })).toBe(
      heading,
    );
    expect(
      screen.queryByRole("status", { name: "Preparing confirmation…" }),
    ).toBeNull();
    expect(screen.queryByText("Please do not close or refresh.")).toBeNull();
    expect(screen.getByText(/^Verified /).textContent).toBe(verified);
    await act(async () => {
      finishReceipt(Response.json(proof));
    });
    expect(screen.getByRole("heading", { name: "Booking Confirmed" })).toBe(
      heading,
    );
    expect(screen.getByText(/^Verified /).textContent).toBe(verified);
    cleanup();
    localStorage.clear();
  }
});

it("retains verified customer confirmation across pending responses that omit proof", async () => {
  vi.useFakeTimers();
  const proof = receiptFixture();
  let reads = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json(
        ++reads === 1
          ? {
              status: "pending",
              reason: "payment_received_booking_pending",
              customerConfirmation: proof,
            }
          : { status: "pending", reason: "payment_received_booking_pending" },
      ),
    ),
  );
  render(<ProtectedConfirmation attemptId={first} />);
  await act(async () => {});
  expect(
    screen.getByRole("heading", { name: "Booking Confirmed" }),
  ).toBeVisible();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(reads).toBeGreaterThan(1);
  expect(
    screen.getByRole("heading", { name: "Booking Confirmed" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("status", { name: "Checking payment…" }),
  ).toBeNull();
});

it("shows payment received feedback with details while current booking evidence is pending", async () => {
  vi.useFakeTimers();
  const proof = receiptFixture();
  let reads = 0;
  const details = Object.fromEntries(
    Object.entries(proof).filter(([key]) => key !== "verifiedAtMs"),
  );
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("/checkout"))
      return Response.json(
        {
          attemptId: first,
          mode: "live",
          checkout: {
            state: "available",
            url: "https://checkout.sandbox.hit-pay.com/payment-request/@test/00000000-0000-4000-8000-000000000001/checkout",
            expiresAtMs: Date.now() + 60000,
          },
          details,
          summary: {
            players: 2,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [{ startMs: proof.sessions[0].startMs, players: 2 }],
          },
          checking: {
            deadlineMs: Date.now() + 600000,
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        },
        { headers: { Date: new Date().toUTCString() } },
      );
    if (url.endsWith("/confirmation"))
      return Response.json({
        status: "pending",
        reason:
          ++reads === 1
            ? "payment_verification_pending"
            : reads === 2
              ? "payment_received_booking_pending"
              : "invoice_pending",
      });
    throw new Error("No receipt or other request before booking verification");
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        publicCalendar: undefined,
        calendar: undefined,
      }}
      identityService={demoCustomerIdentity}
    >
      <ConfirmationPage />
    </BookingProvider>,
  );
  await act(async () => {});
  const summary = screen.getByLabelText("Booking summary");
  expect(summary.querySelector(".session-item-price")).toHaveTextContent(
    "$88.00",
  );
  expect(summary.querySelector(".summary-total")).toHaveTextContent(
    "TotalSGD $88.00",
  );
  expect(screen.queryByText("SGD · Final total")).not.toBeInTheDocument();
  const timer = screen.getByRole("timer");
  const continuation = screen.getByRole("link", { name: "Continue payment" });
  const message = screen.getByText(/Continue to pay/);
  expect(
    message.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    summary.compareDocumentPosition(timer) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    timer.compareDocumentPosition(continuation) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(continuation).not.toHaveAttribute("target");
  expect(continuation.nextElementSibling).toBeNull();
  expect(continuation.parentElement?.nextElementSibling).toBeNull();
  expect(screen.queryByText("View Full Details")).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Before Your Session" }),
  ).toBeNull();
  expect(screen.queryByText(/SimplyBook booking ID/)).toBeNull();
  navigation.status = "completed";
  // A completed redirect can only hide payment. Pending server evidence must
  // still display checking, never a fabricated confirmation.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  // Force the route to consume the changed synthetic search parameters.
  cleanup();
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        publicCalendar: undefined,
        calendar: undefined,
      }}
      identityService={demoCustomerIdentity}
    >
      <ConfirmationPage />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(screen.queryByRole("link", { name: "Continue payment" })).toBeNull();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).toBeNull();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(
    screen.getByRole("status", {
      name: "Payment received. Confirming booking.",
    }),
  ).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: /download|home/i })).toBeNull();
  expect(screen.queryByRole("link", { name: "Continue payment" })).toBeNull();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(reads).toBeGreaterThan(1);
  expect(screen.queryByRole("link", { name: "Continue payment" })).toBeNull();
  expect(screen.queryByRole("timer")).toBeNull();
  expect(fetch.mock.calls.some(([url]) => url.endsWith("/receipt"))).toBe(
    false,
  );
});

it("revisiting a saved confirmation enriches its invoice without replaying confirmation or export actions", async () => {
  const now = Date.now(),
    saved = receiptFixture(now - 120000);
  let receiptReads = 0;
  let finalAvailable = true;
  const fetch = vi.fn<
    (url: string, options?: RequestInit) => Promise<Response>
  >((url) =>
    Promise.resolve(
      url.endsWith("/checkout")
        ? Response.json({
            attemptId: first,
            mode: "live",
            confirmation: saved,
            payment: { status: "recorded", paidAtMs: saved.verifiedAtMs },
            checkout: { state: "unavailable" },
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [{ startMs: now + 86400000, players: 2 }],
            },
            checking: {
              deadlineMs: now + 60000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          })
        : url.endsWith("/receipt")
          ? Response.json({
              ...receiptFixture(),
              providerReferences: {
                bookingIds: ["701"],
                invoiceId: "901",
                ...(++receiptReads > 1 && finalAvailable
                  ? { invoiceNumber: "FINAL-DOCUMENT-7" }
                  : {}),
              },
            })
          : new Response(null, { status: 409 }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const page = render(
    <ProtectedConfirmation attemptId={first} checkoutMode="live" />,
  );
  await act(async () => {});
  expect(screen.getByText(/^Verified /)).toBeInTheDocument();
  expect(
    screen.getByRole("status", { name: "Checking invoice number" }),
  ).toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(screen.getByText("FINAL-DOCUMENT-7")).toHaveClass(
    "confirmation-invoice-value",
  );
  expect(
    screen.queryByRole("status", { name: "Checking invoice number" }),
  ).toBeNull();
  expect(
    new Headers(fetch.mock.calls.at(-1)?.[1]?.headers).get("X-Booking-Refresh"),
  ).toBe("1");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(receiptReads).toBe(2);
  expect(
    screen.queryByRole("button", {
      name: /Add to calendar|Download booking details/,
    }),
  ).toBeNull();
  expect(fetch.mock.calls.map(([url]) => url.split("/").at(-1))).toEqual([
    "checkout",
    "receipt",
    "receipt",
  ]);
  page.unmount();
  finalAvailable = false;
  receiptReads = 0;
  const missing = render(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      sessionRevision={2}
    />,
  );
  await act(async () => {});
  expect(
    screen.getByRole("status", { name: "Checking invoice number" }),
  ).toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(receiptReads).toBe(6);
  expect(
    screen.queryByRole("status", { name: "Checking invoice number" }),
  ).toBeNull();
  expect(
    screen.getByRole("heading", { name: "Booking Confirmed" }),
  ).toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(receiptReads).toBe(6);
  missing.unmount();
});

it("incomplete provider booking shows reservation recovery without a payment spinner or checkout link", async () => {
  vi.useFakeTimers();
  let incomplete = true;
  let denied = false;
  let paymentIssue: "link_recovering" | "link_unavailable" | undefined;
  const fetcher = vi.fn(async (url: string) =>
    denied
      ? new Response(null, { status: 403 })
      : Response.json(
          url.endsWith("/checkout")
            ? {
                attemptId: first,
                mode: "live",
                ...(incomplete ? { bookingIssue: "incomplete" } : {}),
                ...(paymentIssue ? { paymentIssue } : {}),
                checkout: { state: "unavailable" },
                summary: {
                  players: 1,
                  totalMinor: 10800,
                  currency: "SGD",
                  sessions: [{ startMs: Date.now() + 86400000, players: 1 }],
                },
                checking: {
                  deadlineMs: Date.now() + 600000,
                  nextCheckMs: 0,
                  pollAfterMs: 5000,
                },
              }
            : { status: "pending", reason: "payment_verification_pending" },
        ),
  );
  vi.stubGlobal("fetch", fetcher);
  const rendered = render(
    <ProtectedConfirmation attemptId={first} checkoutMode="live" />,
  );
  await act(async () => {});
  expect(screen.getByRole("alert")).toHaveTextContent(
    "We’re checking whether your booking was created. Please don’t book or pay again.",
  );
  expect(
    screen.getByRole("status", { name: "Checking your reservation…" }),
  ).toBeVisible();
  expect(
    screen.queryByLabelText("Current booking summary"),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /payment|checkout/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).not.toBeInTheDocument();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(
    screen.queryByRole("status", { name: "Checking your reservation…" }),
  ).toBeVisible();
  expect(screen.getByRole("alert")).toBeVisible();
  const reads = fetcher.mock.calls.length;
  expect(reads).toBe(13);
  expect(fetcher.mock.calls.every(([url]) => url.endsWith("/checkout"))).toBe(
    true,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(fetcher).toHaveBeenCalledTimes(reads + 12);
  incomplete = false;
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    fetcher.mock.calls.filter(([url]) => url.endsWith("/checkout")),
  ).toHaveLength(reads + 13);
  rendered.unmount();
  const finalReads = fetcher.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(fetcher).toHaveBeenCalledTimes(finalReads);
  incomplete = true;
  const revoked = render(
    <ProtectedConfirmation attemptId={first} checkoutMode="live" />,
  );
  await act(async () => {});
  expect(
    screen.getByRole("status", { name: "Checking your reservation…" }),
  ).toBeVisible();
  denied = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(
    screen.queryByRole("status", { name: "Checking your reservation…" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      "Contact the studio to view this booking. Don’t pay again.",
    ),
  ).toBeVisible();
  const deniedReads = fetcher.mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(fetcher).toHaveBeenCalledTimes(deniedReads);
  revoked.unmount();
  denied = false;
  incomplete = false;
  paymentIssue = "link_recovering";
  const paymentRecovery = render(
    <ProtectedConfirmation attemptId={first} checkoutMode="live" />,
  );
  await act(async () => {});
  expect(
    screen.getByRole("status", { name: "Preparing payment…" }),
  ).toBeVisible();
  paymentIssue = "link_unavailable";
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(
    screen.getByRole("heading", { name: "Payment Unavailable" }),
  ).toBeVisible();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Our payment provider may be temporarily unavailable.",
  );
  expect(
    screen.getByText(
      "Your reservation still needs to be resolved. Please don’t book or pay again. Contact the studio for help.",
    ),
  ).toBeVisible();
  expect(screen.queryByText(/Please try again later/)).toBeNull();
  expect(
    screen.queryByRole("status", { name: "Preparing payment…" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /payment|checkout/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText("Current booking summary"),
  ).not.toBeInTheDocument();
  paymentRecovery.unmount();
});

it("routes only authenticated no-effect selection rejections to the calendar", async () => {
  const rejection = {
    state: "selection_unavailable" as const,
    rejectedSessionIndex: 0,
    rejectedSessionIndices: [0, 2],
  };
  for (const source of [
    "context",
    "status",
    "unknown",
    "paid",
    "background-rejection",
    "background-not-created",
  ] as const) {
    const rejected = vi.fn(async () => true);
    const resolved = vi.fn(() => true);
    const background = source.startsWith("background-");
    const onAwaitingExpiry = vi.fn(() => true);
    const fetch = vi.fn(async (url: string) => {
      if (source === "unknown") return new Response(null, { status: 503 });
      if (url.endsWith("/checkout"))
        return Response.json({
          attemptId: first,
          mode: "live",
          checkout: { state: "unavailable" },
          ...(source === "context" || source === "background-rejection"
            ? { selectionRejection: rejection }
            : {}),
          ...(source === "background-not-created"
            ? { creationResolution: { state: "not_created" } }
            : {}),
          ...(source === "paid"
            ? { payment: { status: "recorded", paidAtMs: Date.now() } }
            : {}),
          summary: {
            players: 2,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [1, 2, 3].map((day) => ({
              startMs: Date.now() + day * 86400000,
              players: 2,
            })),
          },
          checking: {
            deadlineMs: Date.now() + (source === "context" ? -1 : 600000),
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        });
      if (source === "background-not-created")
        return Response.json({
          status: "invalid",
          reason: "booking_not_created",
          creationResolution: { state: "not_created" },
        });
      return Response.json({
        status: "invalid",
        reason: "checkout_selection_rejected",
        selectionRejection: rejection,
      });
    });
    vi.stubGlobal("fetch", fetch);
    const view = render(
      <ProtectedConfirmation
        attemptId={first}
        checkoutMode="live"
        calendarRecovery={background}
        silent={background}
        onCreationResolved={resolved}
        onSelectionRejected={rejected}
        onAwaitingExpiry={onAwaitingExpiry}
      />,
    );
    await act(async () => {});
    if (background) {
      if (source === "background-rejection")
        expect(rejected).toHaveBeenCalledWith(
          first,
          rejection,
          expect.any(AbortSignal),
        );
      else expect(resolved).toHaveBeenCalledWith(first);
      expect(navigation.replace).not.toHaveBeenCalled();
      expect(view.container).toBeEmptyDOMElement();
    } else if (source === "context" || source === "status") {
      expect(rejected).toHaveBeenCalledWith(
        first,
        rejection,
        expect.any(AbortSignal),
      );
      expect(onAwaitingExpiry).not.toHaveBeenCalled();
      expect(navigation.replace).toHaveBeenCalledWith("/book/time/");
    } else {
      expect(rejected).not.toHaveBeenCalled();
      expect(navigation.replace).not.toHaveBeenCalled();
    }
    view.unmount();
    navigation.replace.mockReset();
    localStorage.clear();
  }
  let finish!: (value: boolean) => void;
  let classificationSignal: AbortSignal | undefined;
  const rejected = vi.fn(
    (
      _id: string,
      _rejection: CheckoutSelectionRejection,
      signal?: AbortSignal,
    ) => {
      classificationSignal = signal;
      return new Promise<boolean>((resolve) => {
        finish = resolve;
      });
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("/checkout")
        ? Response.json({
            attemptId: url.includes(second) ? second : first,
            mode: "live",
            checkout: { state: "unavailable" },
            ...(url.includes(first) ? { selectionRejection: rejection } : {}),
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [1, 2, 3].map((day) => ({
                startMs: Date.now() + day * 86400000,
                players: 2,
              })),
            },
            checking: {
              deadlineMs: Date.now() + 600000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          })
        : Response.json({
            status: "pending",
            reason: "payment_verification_pending",
          }),
    ),
  );
  const view = render(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      onSelectionRejected={rejected}
    />,
  );
  await act(async () => {});
  expect(rejected).toHaveBeenCalledWith(
    first,
    rejection,
    expect.any(AbortSignal),
  );
  expect(classificationSignal?.aborted).toBe(false);
  view.rerender(
    <ProtectedConfirmation
      attemptId={second}
      checkoutMode="live"
      sessionRevision={1}
      onSelectionRejected={rejected}
    />,
  );
  expect(classificationSignal?.aborted).toBe(true);
  await act(async () => finish(true));
  expect(navigation.replace).not.toHaveBeenCalled();
});

it("retries unavailable checkout context silently and returns expired checkout to the calendar", async () => {
  vi.useFakeTimers();
  let contextCalls = 0;
  let finishExpiry!: (response: Response) => void;
  const expiry = new Promise<Response>((resolve) => {
    finishExpiry = resolve;
  });
  const onExpired = vi.fn();
  const onAwaitingExpiry = vi.fn(() => true);
  const fetch = vi.fn(async (url: string) => {
    if (url.endsWith("/expire")) return expiry;
    if (!url.endsWith("/checkout")) return new Response(null, { status: 503 });
    contextCalls++;
    if (contextCalls === 1) return new Response(null, { status: 503 });
    return Response.json({
      attemptId: first,
      mode: "live",
      expired: true,
      checkout: { state: "unavailable" },
      summary: {
        players: 2,
        totalMinor: 8800,
        currency: "SGD",
        sessions: [{ startMs: Date.now() + 86400000, players: 2 }],
      },
      checking: {
        deadlineMs: Date.now() - 1,
        nextCheckMs: 0,
        pollAfterMs: 5000,
      },
    });
  });
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingLoadingProvider>
      <ProtectedConfirmation
        attemptId={first}
        checkoutMode="live"
        onExpired={onExpired}
        onAwaitingExpiry={onAwaitingExpiry}
      />
    </BookingLoadingProvider>,
  );
  await act(async () => {});
  const heading = screen.getByRole("heading", {
    name: "Confirmation unavailable",
  });
  expect(
    screen.getByText(
      "Payment status is temporarily unavailable. We’ll check again automatically.",
    ),
  ).toBeVisible();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(29999);
  });
  expect(contextCalls).toBe(1);
  expect(
    screen.getByRole("heading", { name: "Confirmation unavailable" }),
  ).toBe(heading);
  expect(
    document.querySelector(".booking-flow-overlay, .payment-check-feedback"),
  ).toBeNull();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(contextCalls).toBe(2);
  expect(onAwaitingExpiry).toHaveBeenCalledExactlyOnceWith(first);
  expect(navigation.replace).toHaveBeenLastCalledWith("/book/time/");
  expect(
    document.querySelector(".booking-flow-overlay, .payment-check-feedback"),
  ).toBeNull();
  expect(onExpired).not.toHaveBeenCalled();
  await act(async () => finishExpiry(Response.json({ expired: true })));
  expect(onExpired).toHaveBeenCalledExactlyOnceWith(first);
  expect(
    screen.queryByRole("button", { name: /check (?:payment )?status/i }),
  ).toBeNull();
  cleanup();
  navigation.replace.mockClear();
  onAwaitingExpiry.mockClear();
  localStorage.removeItem(`soccerbot-checking:${first}`);
  vi.setSystemTime(new Date("2026-11-09T00:00:00Z"));
  const serverNow = Date.now();
  let monotonic = 0;
  const clock = vi
    .spyOn(performance, "now")
    .mockImplementation(() => monotonic);
  fetch.mockImplementation(async (url: string) => {
    if (url.endsWith("/checkout"))
      return Response.json(
        {
          attemptId: first,
          mode: "live",
          checkout: {
            state: "available",
            url: "https://checkout.sandbox.hit-pay.com/payment-request/@test/00000000-0000-4000-8000-000000000001/checkout",
            expiresAtMs: serverNow + 5000,
          },
          summary: {
            players: 2,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [{ startMs: serverNow + 86400000, players: 2 }],
          },
          checking: {
            deadlineMs: serverNow + 65000,
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        },
        { headers: { Date: new Date(serverNow).toUTCString() } },
      );
    if (url.endsWith("/confirmation"))
      return Response.json({
        status: "pending",
        reason: "payment_verification_pending",
      });
    throw new Error(
      "Payment deadline must not release or recreate the reservation",
    );
  });
  render(
    <BookingLoadingProvider>
      <ProtectedConfirmation
        attemptId={first}
        checkoutMode="live"
        allowPaymentContinuation
        onAwaitingExpiry={onAwaitingExpiry}
      />
    </BookingLoadingProvider>,
  );
  await act(async () => {});
  expect(onAwaitingExpiry).not.toHaveBeenCalled();
  await act(async () => {
    monotonic = 4000;
    await vi.advanceTimersByTimeAsync(4000);
  });
  expect(onAwaitingExpiry).not.toHaveBeenCalled();
  await act(async () => {
    monotonic = 4001;
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(onAwaitingExpiry).not.toHaveBeenCalled();
  expect(document.querySelector(".booking-flow-overlay")).not.toBeNull();
  await act(async () => {
    monotonic = 14001;
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(onAwaitingExpiry).toHaveBeenCalledExactlyOnceWith(first);
  expect(navigation.replace).toHaveBeenLastCalledWith("/book/time/");
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${first}`)!).deadline,
  ).toBe(serverNow + 65000);
  expect(
    document.querySelector(".booking-flow-overlay, .payment-check-feedback"),
  ).toBeNull();
  cleanup();
  for (const scenario of [
    "expired",
    "unknown",
    "missing-clock",
    "paid",
    "resume",
    "denied",
  ] as const) {
    navigation.replace.mockClear();
    onAwaitingExpiry.mockClear();
    sessionStorage.clear();
    localStorage.removeItem(`soccerbot-checking:${first}`);
    monotonic = 0;
    vi.setSystemTime(new Date(serverNow));
    fetch.mockImplementation(async (url: string) => {
      if (url.endsWith("/checkout"))
        return Response.json(
          {
            attemptId: first,
            mode: "live",
            checkout: { state: "unavailable" },
            ...(scenario === "paid"
              ? { payment: { status: "recorded", paidAtMs: serverNow - 1000 } }
              : {}),
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [{ startMs: serverNow + 86400000, players: 2 }],
            },
            checking: {
              deadlineMs: serverNow + 65000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
              ...(scenario === "unknown"
                ? {}
                : {
                    paymentExpiresAtMs:
                      serverNow +
                      (scenario === "resume" || scenario === "denied"
                        ? 5000
                        : -1),
                  }),
            },
          },
          scenario === "missing-clock"
            ? {}
            : { headers: { Date: new Date(serverNow).toUTCString() } },
        );
      if (url.endsWith("/confirmation"))
        return scenario === "denied"
          ? new Response(null, { status: 401 })
          : Response.json({
              status: "pending",
              reason:
                scenario === "paid"
                  ? "payment_received_booking_pending"
                  : "payment_verification_pending",
            });
      throw new Error("Display expiry does not release or recreate a booking");
    });
    render(
      <BookingLoadingProvider>
        <ProtectedConfirmation
          attemptId={first}
          checkoutMode="live"
          onAwaitingExpiry={onAwaitingExpiry}
        />
      </BookingLoadingProvider>,
    );
    await act(async () => {});
    if (scenario === "resume" || scenario === "denied") {
      expect(onAwaitingExpiry).not.toHaveBeenCalled();
      await act(async () => {
        monotonic = 6000;
        window.dispatchEvent(new Event("pageshow"));
      });
    }
    if (scenario === "expired" || scenario === "resume") {
      expect(onAwaitingExpiry).not.toHaveBeenCalled();
      await act(async () => {
        monotonic += 10000;
        await vi.advanceTimersByTimeAsync(10000);
      });
      expect(onAwaitingExpiry).toHaveBeenCalledExactlyOnceWith(first);
      expect(navigation.replace).toHaveBeenLastCalledWith("/book/time/");
      expect(
        document.querySelector(
          ".booking-flow-overlay, .payment-check-feedback",
        ),
      ).toBeNull();
    } else expect(onAwaitingExpiry, scenario).not.toHaveBeenCalled();
    expect(
      fetch.mock.calls.filter(([url]) => url.endsWith("/expire")),
    ).toHaveLength(1);
    cleanup();
  }
  // An authenticated late payment on the calendar always resumes its original attempt.
  let statusReads = 0;
  const detected = vi.fn();
  navigation.replace.mockClear();
  monotonic = 0;
  vi.setSystemTime(new Date(serverNow));
  fetch.mockImplementation(async (url: string) => {
    if (url.endsWith("/checkout"))
      return Response.json(
        {
          attemptId: first,
          mode: "live",
          checkout: { state: "unavailable" },
          summary: {
            players: 2,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [{ startMs: serverNow + 86400000, players: 2 }],
          },
          checking: {
            paymentExpiresAtMs: serverNow - 1,
            deadlineMs: serverNow + 65000,
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        },
        { headers: { Date: new Date(serverNow).toUTCString() } },
      );
    if (url.endsWith("/confirmation"))
      return Response.json({
        status: "pending",
        reason:
          ++statusReads === 1
            ? "payment_verification_pending"
            : "payment_received_booking_pending",
      });
    throw new Error("No new reservation or payment on a late result");
  });
  localStorage.removeItem(`soccerbot-checking:${first}`);
  render(
    <ProtectedConfirmation
      attemptId={first}
      checkoutMode="live"
      calendarRecovery
      silent
      onPaymentDetected={detected}
    />,
  );
  await act(async () => {});
  expect(detected).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).toBeNull();
  await act(async () => {
    monotonic = 5000;
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(detected).toHaveBeenCalledWith(first);
  expect(navigation.replace).toHaveBeenLastCalledWith("/book/payment/");
  cleanup();
  clock.mockRestore();
});

it("expiry reconciliation keeps one ten-second foreground budget across refresh then detects late payment silently", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T00:00:00Z"));
  const started = Date.now();
  let paymentDeadline = started - 60000;
  let paid = false;
  let firstContext = true;
  const awaiting = vi.fn(() => true),
    detected = vi.fn();
  navigation.replace.mockClear();
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input);
    if (path.endsWith("/checkout")) {
      if (firstContext) {
        firstContext = false;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      const responseDate = new Date().toUTCString();
      return Response.json(
        {
          attemptId: first,
          mode: "live",
          checkout: { state: "unavailable" },
          summary: {
            players: 2,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [{ startMs: started + 86400000, players: 2 }],
          },
          checking: {
            paymentExpiresAtMs: paymentDeadline,
            deadlineMs: started + 120000,
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        },
        { headers: { Date: responseDate } },
      );
    }
    if (path.endsWith("/confirmation"))
      return Response.json({
        status: "pending",
        reason: paid
          ? "payment_received_booking_pending"
          : "payment_verification_pending",
      });
    throw new Error(`Expiry display must not mutate payment: ${path}`);
  });
  vi.stubGlobal("fetch", fetcher);
  const tree = (background = false) => (
    <BookingLoadingProvider>
      <ProtectedConfirmation
        attemptId={first}
        checkoutMode="live"
        calendarRecovery={background}
        silent={background}
        onAwaitingExpiry={awaiting}
        onPaymentDetected={detected}
      />
    </BookingLoadingProvider>
  );
  let view = render(tree());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(
    document.querySelector(".booking-flow-overlay .page-loading"),
  ).not.toBeNull();
  expect(awaiting).not.toHaveBeenCalled();
  const budget = sessionStorage.getItem(
    `soccerbot-expiry-reconciliation:${first}`,
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
  });
  view.unmount();
  paymentDeadline += 1000;
  view = render(tree());
  await act(async () => {});
  expect(
    sessionStorage.getItem(`soccerbot-expiry-reconciliation:${first}`),
  ).toBe(budget);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3999);
  });
  expect(awaiting).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(awaiting).toHaveBeenCalledExactlyOnceWith(first);
  expect(navigation.replace).toHaveBeenLastCalledWith("/book/time/");
  view.rerender(tree(true));
  expect(
    document.querySelector(".booking-flow-overlay, .page-loading"),
  ).toBeNull();
  paid = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(detected).toHaveBeenCalledWith(first);
  expect(navigation.replace).toHaveBeenLastCalledWith("/book/payment/");
  expect(
    document.querySelector(".booking-flow-overlay, .page-loading"),
  ).toBeNull();
  expect(
    fetcher.mock.calls.every(([path]) => !String(path).endsWith("/expire")),
  ).toBe(true);
});

it("expiry reconciliation exits early for unpaid proof and preserves payment evidence before its deadline", async () => {
  for (const outcome of ["unpaid", "confirmed", "money-pending"] as const) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-09T00:00:00Z"));
    const started = Date.now();
    let settled = outcome === "unpaid";
    const awaiting = vi.fn(() => true),
      released = vi.fn();
    navigation.replace.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const path = String(input);
        if (path.endsWith("/checkout"))
          return Response.json(
            {
              attemptId: first,
              mode: "live",
              checkout: { state: "unavailable" },
              ...(outcome === "unpaid" ? { expired: true } : {}),
              summary: {
                players: 2,
                totalMinor: 8800,
                currency: "SGD",
                sessions: [{ startMs: started + 86400000, players: 2 }],
              },
              checking: {
                paymentExpiresAtMs: started - 1,
                deadlineMs: started + 120000,
                nextCheckMs: 0,
                pollAfterMs: 5000,
              },
            },
            { headers: { Date: new Date().toUTCString() } },
          );
        if (path.endsWith("/expire")) return Response.json({ expired: true });
        if (path.endsWith("/receipt"))
          return Response.json(receiptFixture(started));
        if (path.endsWith("/confirmation"))
          return Response.json(
            settled && outcome === "confirmed"
              ? { status: "confirmed", reason: "verified" }
              : {
                  status: "pending",
                  reason:
                    settled && outcome === "money-pending"
                      ? "payment_received_booking_pending"
                      : "payment_verification_pending",
                },
          );
        throw new Error(`Unexpected reconciliation request ${path}`);
      }),
    );
    render(
      <BookingLoadingProvider>
        <ProtectedConfirmation
          attemptId={first}
          checkoutMode="live"
          onAwaitingExpiry={awaiting}
          onExpired={released}
        />
      </BookingLoadingProvider>,
    );
    await act(async () => {});
    if (outcome === "unpaid") {
      expect(released).toHaveBeenCalledWith(first);
      expect(navigation.replace).toHaveBeenCalledWith("/book/time/");
      expect(Date.now()).toBe(started);
    } else {
      expect(awaiting).not.toHaveBeenCalled();
      settled = true;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      if (outcome === "confirmed")
        expect(
          screen.getByRole("heading", { name: "Booking Confirmed" }),
        ).toBeVisible();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(awaiting).not.toHaveBeenCalled();
      expect(released).not.toHaveBeenCalled();
      expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
    }
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    vi.useRealTimers();
  }
});

it("late unpaid-release acknowledgement cannot override newer payment evidence and unavailable storage cannot renew expiry waits", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T00:00:00Z"));
  const started = Date.now();
  let paid = false,
    definitelyUnpaid = true;
  let finishRelease!: (response: Response) => void;
  const released = vi.fn(),
    awaiting = vi.fn(() => false);
  navigation.replace.mockClear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.endsWith("/checkout"))
        return Response.json(
          {
            attemptId: first,
            mode: "live",
            checkout: { state: "unavailable" },
            ...(definitelyUnpaid ? { expired: true } : {}),
            summary: {
              players: 2,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [{ startMs: started + 86400000, players: 2 }],
            },
            checking: {
              paymentExpiresAtMs: started - 60000,
              deadlineMs: started + 120000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          },
          { headers: { Date: new Date().toUTCString() } },
        );
      if (path.endsWith("/expire"))
        return new Promise<Response>((resolve) => {
          finishRelease = resolve;
        });
      if (path.endsWith("/confirmation"))
        return Response.json({
          status: "pending",
          reason: paid
            ? "payment_received_booking_pending"
            : "payment_verification_pending",
        });
      throw new Error(`Unexpected expiry request ${path}`);
    }),
  );
  const tree = () => (
    <BookingLoadingProvider>
      <ProtectedConfirmation
        attemptId={first}
        checkoutMode="live"
        onAwaitingExpiry={awaiting}
        onExpired={released}
      />
    </BookingLoadingProvider>
  );
  const view = render(tree());
  await act(async () => {});
  paid = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  navigation.replace.mockClear();
  await act(async () => finishRelease(Response.json({ expired: true })));
  expect(released).not.toHaveBeenCalled();
  expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
  view.unmount();
  definitelyUnpaid = false;
  paid = false;
  localStorage.clear();
  sessionStorage.clear();
  awaiting.mockReset().mockReturnValue(true);
  const write = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("storage unavailable");
    });
  const skewedLocalNow = Date.now() - 365 * 86400000;
  expect(expiryReconciliationDeadline(first, Date.now(), skewedLocalNow)).toBe(
    skewedLocalNow,
  );
  for (let refresh = 0; refresh < 2; refresh++) {
    const remount = render(tree());
    await act(async () => {});
    expect(awaiting).toHaveBeenCalledWith(first);
    expect(document.querySelector(".booking-flow-overlay")).toBeNull();
    remount.unmount();
    awaiting.mockClear();
  }
  write.mockRestore();
});
