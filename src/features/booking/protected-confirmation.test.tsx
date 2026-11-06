import * as renderTrace from "./confirmation-render-trace";
import ConfirmationPage from "@/app/confirmation/page";
import { BookingProvider } from "./provider";
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
  cleanup();
  navigation.status = "canceled";
  vi.useRealTimers();
  localStorage.clear();
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
    Promise.resolve(
      url.endsWith("/checkout")
        ? Response.json(context)
        : new Response(null, { status: 503 }),
    ),
  );
  vi.stubGlobal("fetch", fetch);
  render(<ProtectedConfirmation attemptId={first} checkoutMode="synthetic" />);
  await screen.findByRole("heading", { name: "Confirmation unavailable" });
  const link = await screen.findByRole("link", {
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
  fireEvent.click(await screen.findByText("View full details"));
  expect(
    await screen.findByRole("heading", { name: "Client Details" }),
  ).toBeInTheDocument();
  for (const name of ["Location", "Disclaimers"])
    expect(screen.getByRole("heading", { name })).toBeInTheDocument();
  expect(screen.getByLabelText("Booking summary")).toHaveTextContent(
    "SGD $88.00",
  );
  expect(
    screen.queryByRole("region", { name: "Amount" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Session Details" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Disclaimers" })).toHaveClass(
    "confirmation-disclaimers",
  );
  expect(screen.getByRole("region", { name: "Disclaimers" })).toHaveTextContent(
    "bring a towel",
  );
  expect(screen.getByText("Trainer: Native Trainer")).toBeInTheDocument();
  expect(screen.queryByText("701")).not.toBeInTheDocument();
  expect(screen.queryByText("901")).not.toBeInTheDocument();
  expect(screen.queryByText(/SoccerBot reference/)).not.toBeInTheDocument();
  expect(screen.getByText(/Invoice number/)).toBeInTheDocument();
  expect(screen.getByText("INV-2026-TEST")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "WhatsApp Enquiry" }),
  ).toHaveAttribute("href", "https://wa.me/6590143819");
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
  fireEvent.click(await screen.findByText("View full details"));
  await screen.findByRole("heading", { name: "Client Details" });
  expect(screen.getByText(/Saved confirmation · Verified/)).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(1);
  page.unmount();
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  fireEvent.click(await screen.findByText("View full details"));
  await screen.findByRole("heading", { name: "Client Details" });
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

it("pending checkout context uses the compact confirmation shell without checkout or success", async () => {
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
  const shell = document.querySelector(".confirmation-shell");
  expect(
    shell?.querySelector(".status-heading .booking-loading-inline"),
  ).not.toBeNull();
  expect(
    shell?.querySelector(".confirmation-card .booking-loading-inline"),
  ).toBeNull();
  expect(screen.getByLabelText("Booking summary")).toHaveTextContent(
    "Loading summary…",
  );
  expect(
    document.querySelector(".page-loading, .booking-flow-overlay"),
  ).toBeNull();
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
  expect(
    await screen.findByRole("region", { name: "Current booking summary" }),
  ).toBeVisible();
  expect(document.querySelector(".confirmation-shell")).toBe(shell);
  expect(
    shell?.querySelector(".status-heading .booking-loading-inline"),
  ).not.toBeNull();
  expect(
    screen.queryByRole("link", { name: /Open checkout/ }),
  ).not.toBeInTheDocument();
});

it("pending confirmation retains the booking summary while hiding full details success and every action", async () => {
  const trace = vi.spyOn(renderTrace, "useConfirmationRenderTrace");
  const receipt = receiptFixture();
  const details = { ...receipt };
  Reflect.deleteProperty(details, "verifiedAtMs");
  let complete!: (value: Response) => void;
  const pending = new Promise<Response>((resolve) => {
    complete = resolve;
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
      return url.endsWith("/receipt")
        ? Promise.resolve(Response.json(receipt))
        : pending;
    }),
  );
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  await screen.findByText("Checking payment…");
  expect(screen.queryByText("View full details")).toBeNull();
  expect(screen.getByLabelText("Booking summary")).toBeVisible();
  expect(screen.getByText("Please do not close or refresh.")).toBeVisible();
  expect(screen.getByText("Checking payment…")).toBeVisible();
  const card = document.querySelector(".confirmation-card");
  expect(document.querySelector(".booking-loading")).toBeNull();
  expect(
    document.querySelector(".booking-loading-inline .page-loading-orbit"),
  ).not.toBeNull();
  for (const name of ["Client Details", "Location", "Disclaimers"])
    expect(screen.queryByRole("heading", { name })).toBeNull();
  expect(screen.queryByText("Synthetic Customer")).toBeNull();
  expect(
    screen.getByRole("status", { name: "Checking payment…" }),
  ).toBeVisible();
  expect(trace.mock.calls.at(-1)?.[0]).toMatchObject({
    state: "summary",
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
  expect(document.querySelector(".confirmation-card")).toBe(card);
  expect(screen.getByLabelText("Booking actions")).toBeVisible();
  expect(screen.getByRole("link", { name: "Back to home" })).toBeVisible();
  expect(trace.mock.calls.at(-1)?.[0].state).toBe("confirmed");
  expect(trace.mock.calls.at(-1)?.[0].proofSource).not.toBe("none");
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
  expect(screen.getByText("Paid", { exact: true })).toBeVisible();
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
                    deadlineMs: Date.now() + 600000,
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
    "Still checking your payment",
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
    const verified = screen.getByText(/Saved confirmation/).textContent;
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
    expect(screen.getByText(/Saved confirmation/).textContent).toBe(verified);
    await act(async () => {
      finishReceipt(Response.json(proof));
    });
    expect(screen.getByRole("heading", { name: "Booking Confirmed" })).toBe(
      heading,
    );
    expect(screen.getByText(/Saved confirmation/).textContent).toBe(verified);
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
  expect(screen.queryByText("View full details")).toBeNull();
  expect(screen.queryByRole("heading", { name: "Disclaimers" })).toBeNull();
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
  expect(screen.getByText(/Saved confirmation/)).toBeInTheDocument();
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
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      Response.json(
        url.endsWith("/checkout")
          ? {
              attemptId: first,
              mode: "live",
              bookingIssue: "incomplete",
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
    ),
  );
  render(<ProtectedConfirmation attemptId={first} checkoutMode="live" />);
  expect(
    await screen.findByText(/Unable to complete this booking/),
  ).toBeVisible();
  expect(
    screen.queryByRole("status", { name: "Checking payment…" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /payment|checkout/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Booking Confirmed" }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("Current booking summary")).toHaveTextContent(
    "SGD $108.00",
  );
});
