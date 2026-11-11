import ConfirmationPage from "@/app/confirmation/page";
import { dateLabel } from "@/domain/dates";
import { PAYMENT_WINDOW_ENDED } from "@/domain/booking-messages";
import { useState } from "react";
import {
  act,
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BookingProvider, useBooking } from "./provider";
import { BookingPage } from "./booking-page";
import { ReviewStep } from "./review-step";
import { BookingServiceError, type BookingService } from "@/services/contracts";
import { liveBookingService } from "@/services/booking";
import {
  saveLiveDraft,
  saveBooking,
  saveSuppressedSlots,
  savePendingConflict,
} from "@/services/storage";
import { demoBookingService } from "@/services/demo/booking";
import { expireBooking } from "@/services/confirmation";
import { demoCustomerIdentity } from "@/services/demo/identity";
import { blankDraft, type Attempt } from "@/domain/booking";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  path: "/",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => navigation.path,
  useSearchParams: () => new URLSearchParams({ attempt: id }),
}));
const id = "00000000-0000-4000-8000-000000000001";
const url = `https://checkout.sandbox.hit-pay.com/payment-request/@soccerbot/${id}/checkout`;
const draft = {
  ...blankDraft(),
  mode: "guest" as const,
  nativeServiceId: "2",
  accepted: true,
  contact: {
    name: "Test",
    email: "test@example.com",
    phone: "+65 8123 4567",
    contactMethod: "email",
    academy: "",
  },
  slots: [
    {
      date: "2026-10-20",
      start: "12:00",
      instructor: "4",
      native: {
        serviceId: "2",
        serviceName: "Session",
        instructorName: "Instructor",
        priceMinor: 8800,
        currency: "SGD" as const,
      },
    },
  ],
};
function Seed({ accepted = true }: { accepted?: boolean }) {
  const { update, attempt, action, cancel, checkout } = useBooking();
  return (
    <>
      <button onClick={() => update({ ...draft, accepted })}>Seed</button>
      <button onClick={cancel}>Cancel</button>
      <button onClick={() => void checkout()}>Repeat checkout</button>
      <output data-testid="retained">{attempt?.id}</output>
      <output data-testid="action">{action.status}</output>
    </>
  );
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  navigation.path = "/";
  navigation.push.mockReset();
  navigation.replace.mockReset();
});
it("restored editable Review avoids background catalogue and calendar reads", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  navigation.path = "/SoccerBotStudioSG/book/review/";
  saveLiveDraft(draft);
  const fetch = vi.fn(async () => new Response(null, { status: 503 }));
  vi.stubGlobal("fetch", fetch);
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "2",
    observedAtMs: Date.now(),
    dates: [],
  }));
  const restore = vi.fn(async () => null);
  function DeferredReview() {
    const [shown, show] = useState(false);
    return shown ? (
      <BookingPage step="review" />
    ) : (
      <button onClick={() => show(true)}>Mount Review</button>
    );
  }
  render(
    <BookingProvider
      bookingService={{ ...liveBookingService, restore, publicCalendar }}
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <DeferredReview />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(restore).toHaveBeenCalledTimes(1);
  expect(publicCalendar).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Mount Review" }));
  expect(screen.getByRole("heading", { name: "Review Booking" })).toBeVisible();
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(restore).toHaveBeenCalledTimes(1);
  expect(publicCalendar).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
async function directCase(scenario: string) {
  navigation.path = "/book/review/";
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  let finish!: (attempt: Attempt) => void;
  const checkout = vi.fn<BookingService["checkout"]>(async ({ draft }) => ({
    id,
    draft,
    status: "ready" as const,
    outcome: "pending" as const,
    checkUntil: 0,
    booking: null,
  }));
  const pay = vi.fn<BookingService["pay"]>(
    () =>
      new Promise<Attempt>((resolve) => {
        finish = resolve;
      }),
  );
  const assign = vi.fn();
  vi.stubGlobal("location", { assign });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        attemptId: id,
        mode: "live",
        checkout: {
          state: "available",
          url:
            scenario === "wrong_host"
              ? url.replace("hit-pay.com", "evil.test")
              : url,
          expiresAtMs: Date.now() + 60000,
        },
        summary: {
          players: 1,
          totalMinor: 8800,
          currency: "SGD",
          sessions: [{ startMs: 1, players: 1 }],
        },
        checking: {
          deadlineMs: Date.now() + 120000,
          nextCheckMs: 0,
          pollAfterMs: 5000,
        },
      }),
    ),
  );
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        checkout,
        pay,
      }}
    >
      <Seed />
      <ReviewStep />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
    ),
  );
  expect(screen.getByTestId("retained")).toHaveTextContent(id);
  expect(pay).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole("button", { name: /^Opening checkout… \$[\d,.]+$/ }),
  );
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(assign).not.toHaveBeenCalled();
  if (scenario === "cancel" || scenario === "cancel_handoff")
    fireEvent.click(screen.getByText("Cancel"));
  if (scenario === "handoff" || scenario === "cancel_handoff") {
    pay.mock.calls[0][0].onCheckoutReady?.({
      url,
      expiresAtMs: Date.now() + 60000,
    });
  }
  await act(async () =>
    finish({ ...pay.mock.calls[0][0].attempt, status: "checking" }),
  );
  if (scenario === "success" || scenario === "handoff") {
    expect(assign).toHaveBeenCalledExactlyOnceWith(url);
    // assign() starts navigation; the current document can still paint while
    // the checkout destination loads. Never reveal the review form here.
    expect(screen.getByTestId("action")).toHaveTextContent("loading");
    expect(
      screen.getByRole("status", { name: "Opening checkout…" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Opening checkout… Please do not close or refresh."),
    ).toBeVisible();
    await act(async () => fireEvent.click(screen.getByText("Repeat checkout")));
    expect(pay).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /^Opening checkout… \$[\d,.]+$/ }),
    ).toBeDisabled();
    act(() => window.dispatchEvent(new PageTransitionEvent("pageshow")));
    expect(screen.getByTestId("action")).toHaveTextContent("loading");
    act(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );
    expect(screen.getByTestId("action")).toHaveTextContent("cancelled");
    expect(screen.getByTestId("retained")).toHaveTextContent(id);
    expect(pay).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledTimes(1);
  } else expect(assign).not.toHaveBeenCalled();
  if (scenario === "handoff" || scenario === "cancel_handoff")
    expect(fetch).not.toHaveBeenCalled();
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.getByTestId("retained")).toHaveTextContent(id);
}

it("direct checkout opens HitPay once in the same tab", () =>
  directCase("success"));
it("saved URL from checkout navigates once without a context request", () =>
  directCase("handoff"));
it("cancelled checkout ignores a late saved URL handoff", () =>
  directCase("cancel_handoff"));
it("cancelled direct checkout never navigates", () => directCase("cancel"));
it("direct checkout rejects an untrusted destination", () =>
  directCase("wrong_host"));
it("explicit reservation reuses its hold for payment without preparing or checking availability again", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const checkout = vi.fn<BookingService["checkout"]>(
    async ({ draft, holding }) => {
      expect(holding).toBe(true);
      expect(draft.accepted).toBe(false);
      return {
        id,
        draft,
        status: "ready",
        outcome: "pending",
        checkUntil: 0,
        booking: null,
      };
    },
  );
  const pay = vi.fn<BookingService["pay"]>(async ({ attempt, holding }) =>
    holding
      ? { ...attempt, held: true, status: "ready" }
      : { ...attempt, status: "checking" },
  );
  const availability = vi.fn<BookingService["availability"]>(async () => []);
  const assign = vi.fn();
  vi.stubGlobal("location", { assign });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        attemptId: id,
        mode: "live",
        checkout: { state: "available", url, expiresAtMs: Date.now() + 60000 },
        summary: {
          players: 1,
          totalMinor: 8800,
          currency: "SGD",
          sessions: [{ startMs: 1, players: 1 }],
        },
        checking: {
          deadlineMs: Date.now() + 120000,
          nextCheckMs: 0,
          pollAfterMs: 5000,
        },
      }),
    ),
  );
  function Hold() {
    const { update, reserve, attempt } = useBooking();
    return (
      <>
        <button onClick={() => update({ ...draft, accepted: false })}>
          Fill details
        </button>
        <button onClick={() => void reserve()}>Reserve for review</button>
        <output data-testid="hold-state">
          {attempt?.held ? "held" : "none"}
        </output>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        checkout,
        pay,
        availability,
      }}
    >
      <Hold />
      <BookingPage step="review" />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Fill details"));
  await act(async () =>
    fireEvent.click(screen.getByText("Reserve for review")),
  );
  expect(screen.getByTestId("hold-state")).toHaveTextContent("held");
  expect(assign).not.toHaveBeenCalled();
  expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument();
  const readsAtHold = availability.mock.calls.length;
  fireEvent.click(screen.getByRole("checkbox"));
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
    ),
  );
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(pay).toHaveBeenCalledTimes(2);
  expect(pay.mock.calls[1][0].attempt.id).toBe(id);
  expect(pay.mock.calls[1][0].attempt.draft.accepted).toBe(true);
  expect(pay.mock.calls[1][0].holding).toBe(false);
  expect(availability).toHaveBeenCalledTimes(readsAtHold);
  expect(assign).toHaveBeenCalledWith(url);
  expect(navigation.replace).not.toHaveBeenCalledWith("/book/payment/");
  await act(async () =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  expect(navigation.replace).toHaveBeenCalledWith("/book/payment/");
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(pay).toHaveBeenCalledTimes(2);
  expect(availability).toHaveBeenCalledTimes(readsAtHold);
});

it("live reservation response distinguishes a rejected selection from an uncertain write", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const attempt: Attempt = {
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  };
  const response = vi.fn(async () =>
    Response.json({
      attemptId: id,
      state: "selection_unavailable",
      paymentAvailable: false,
      rejectedSessionIndex: 0,
    }),
  );
  vi.stubGlobal("fetch", response);
  await expect(
    liveBookingService.pay({ attempt, outcome: "pending", holding: true }),
  ).rejects.toMatchObject({
    code: "selection_unavailable",
    rejectedSessionIndex: 0,
  });
  response.mockImplementation(async () =>
    Response.json({
      attemptId: id,
      state: "recovery_required",
      paymentAvailable: false,
    }),
  );
  await expect(
    liveBookingService.pay({ attempt, outcome: "pending", holding: true }),
  ).resolves.toMatchObject({ id, status: "checking" });
  response.mockImplementation(async () =>
    Response.json({
      attemptId: id,
      state: "selection_unavailable",
      paymentAvailable: false,
      rejectedSessionIndex: 9,
    }),
  );
  await expect(
    liveBookingService.pay({ attempt, outcome: "pending", holding: true }),
  ).rejects.toMatchObject({ code: "invalid_response" });
  expect(response).toHaveBeenCalledTimes(3);
});

it("HitPay HTTP conflict preserves the hold and shows payment failure without selection recovery", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  vi.spyOn(crypto, "randomUUID").mockReturnValue(id);
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      calls.push(path);
      if (path === `/api/booking/hold/${id}`)
        return Response.json({
          attemptId: id,
          state: "associated",
          paymentAvailable: false,
        });
      if (path === `/api/booking/hitpay/${id}`)
        return Response.json(
          { error: "hitpay_association_mismatch" },
          { status: 409 },
        );
      throw new Error("Unexpected test request: " + path);
    }),
  );
  function Hold() {
    const { update, reserve, attempt } = useBooking();
    return (
      <>
        <button
          onClick={() =>
            update({ ...draft, nativeServiceId: "2", accepted: false })
          }
        >
          Fill details
        </button>
        <button onClick={() => void reserve()}>Reserve</button>
        <output data-testid="hold">
          {attempt?.id}:{String(attempt?.held)}
        </output>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        publicCalendar: undefined,
        calendar: undefined,
      }}
    >
      <Hold />
      <BookingPage step="details" />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Fill details"));
  await act(async () => fireEvent.click(screen.getByText("Reserve")));
  fireEvent.click(screen.getByRole("checkbox"));
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
    ),
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "We couldn’t open checkout",
  );
  expect(screen.getByTestId("hold")).toHaveTextContent(id + ":true");
  expect(
    screen.queryByRole("link", { name: "Review selections" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/This selection has changed/),
  ).not.toBeInTheDocument();
  expect(calls).toEqual([
    `/api/booking/hold/${id}`,
    `/api/booking/hitpay/${id}`,
  ]);
  expect(navigation.push).not.toHaveBeenCalled();
});

it("Review performs no provider reads and checkout verifies one booking before HitPay", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  let complete!: (attempt: Attempt) => void;
  let created!: Attempt;
  const assign = vi.fn();
  vi.stubGlobal("location", { assign });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        attemptId: id,
        mode: "live",
        checkout: { state: "available", url, expiresAtMs: Date.now() + 60000 },
        summary: {
          players: 1,
          totalMinor: 8800,
          currency: "SGD",
          sessions: [{ startMs: 1, players: 1 }],
        },
        checking: {
          deadlineMs: Date.now() + 120000,
          nextCheckMs: 0,
          pollAfterMs: 5000,
        },
      }),
    ),
  );
  const availability = vi.fn(async () =>
    draft.slots.map((slot) => ({ ...slot, available: true })),
  );
  const pay = vi.fn<BookingService["pay"]>(({ attempt, holding }) => {
    if (!holding) return Promise.resolve({ ...attempt, status: "checking" });
    created = attempt;
    return new Promise((resolve) => {
      complete = resolve;
    });
  });
  const checkout = vi.fn<BookingService["checkout"]>(async ({ draft }) => ({
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  }));
  function Journey() {
    const [step, setStep] = useState<"details" | "review">("details");
    navigation.push.mockImplementation(() => setStep("review"));
    return <BookingPage step={step} />;
  }
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        checkout,
        pay,
        availability,
      }}
    >
      <Seed accepted={false} />
      <Journey />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Seed"));
  const detailsSummary = screen.getByRole("complementary", {
    name: "Your booking summary",
  });
  expect(
    detailsSummary.querySelector(".session-trainer-row .session-item-price"),
  ).toHaveTextContent("$88.00");
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm email address is correct" }),
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
    ),
  );
  expect(screen.getByRole("heading", { name: "Review Booking" })).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Dates & times" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/× 40 min session/)).not.toBeInTheDocument();
  const order = screen.getByRole("heading", { name: "Order Summary" })
    .parentElement!.parentElement!;
  expect(
    within(order).getByRole("list", { name: "Selected sessions" }),
  ).toBeVisible();
  expect(order.querySelector(".session-item-price")).toHaveTextContent(
    "$88.00",
  );
  expect(availability).not.toHaveBeenCalled();
  expect(checkout).not.toHaveBeenCalled();
  expect(pay).not.toHaveBeenCalled();
  for (const heading of ["Booking Contact", "Order Summary"]) {
    const section = screen.getByRole("heading", {
      name: heading,
    }).parentElement!;
    expect(within(section).getByRole("link", { name: "Edit" })).toBeVisible();
  }
  fireEvent.click(screen.getByRole("checkbox"));
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
    ),
  );
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(pay).toHaveBeenCalledTimes(1);
  expect(pay.mock.calls[0][0].holding).toBe(true);
  expect(assign).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: /^Opening checkout… \$[\d,.]+$/ }),
  ).toBeDisabled();
  fireEvent.click(screen.getByText("Repeat checkout"));
  expect(pay).toHaveBeenCalledTimes(1);
  await act(async () => complete({ ...created, status: "checking" }));
  expect(pay).toHaveBeenCalledTimes(1);
  expect(pay.mock.calls[0][0].startCheckout).toBe(true);
  expect(pay.mock.calls[0][0].attempt.draft.accepted).toBe(true);
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(assign).toHaveBeenCalledExactlyOnceWith(url);
});

it("lost hold response restores only the same verified attempt without repeating the write", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const attempt: Attempt = {
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  };
  let restoreResult: Attempt | null = null;
  const restore = vi.fn(async () => restoreResult);
  const pay = vi.fn<BookingService["pay"]>(async ({ onReviewReady }) => {
    onReviewReady?.();
    throw new TypeError("Failed to fetch");
  });
  function Reserve() {
    const { reserve, ready, attempt } = useBooking();
    return (
      <>
        <button disabled={!ready} onClick={() => void reserve()}>
          Reserve test
        </button>
        <output data-testid="restored-state">
          {attempt?.id}:{String(attempt?.held)}:{attempt?.status}
        </output>
      </>
    );
  }
  const view = render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore,
        pay,
        checkout: async () => attempt,
        publicCalendar: undefined,
        calendar: undefined,
        availability: async () => [],
      }}
    >
      <Seed />
      <Reserve />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("Seed"));
  restoreResult = { ...attempt, held: true };
  await act(async () => fireEvent.click(screen.getByText("Reserve test")));
  expect(screen.getByTestId("restored-state")).toHaveTextContent(
    `${id}:true:ready`,
  );
  expect(pay).toHaveBeenCalledTimes(1);
  expect(restore).toHaveBeenCalledTimes(1); // one protected recovery read
  view.unmount();
});

it("lost hold response cannot adopt a different attempt returned by recovery", async () => {
  const attempt: Attempt = {
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  };
  const restore = vi
    .fn<NonNullable<BookingService["restore"]>>()
    .mockResolvedValue({
      ...attempt,
      id: "00000000-0000-4000-8000-000000000002",
      held: true,
    });
  const pay = vi.fn<BookingService["pay"]>(async ({ onReviewReady }) => {
    onReviewReady?.();
    throw new TypeError("Failed to fetch");
  });
  function Reserve() {
    const { reserve, ready, attempt } = useBooking();
    return (
      <>
        <button disabled={!ready} onClick={() => void reserve()}>
          Reserve test
        </button>
        <output data-testid="restored-state">
          {attempt?.id}:{String(attempt?.held)}:{attempt?.status}
        </output>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore,
        pay,
        checkout: async () => attempt,
        publicCalendar: undefined,
        calendar: undefined,
        availability: async () => [],
      }}
    >
      <Seed />
      <Reserve />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("Seed"));
  await act(async () => fireEvent.click(screen.getByText("Reserve test")));
  expect(screen.getByTestId("restored-state")).toHaveTextContent(
    `${id}:undefined:checking`,
  );
  expect(pay).toHaveBeenCalledTimes(1);
  expect(restore).toHaveBeenCalledTimes(1);
});

it("expired Review releases only an authoritatively unpaid attempt and preserves contact on calendar return", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  vi.spyOn(crypto, "randomUUID").mockReturnValue(id);
  let uncertain = true;
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      calls.push(path);
      if (path === `/api/booking/hold/${id}`)
        return Response.json({
          attemptId: id,
          state: "associated",
          paymentAvailable: false,
        });
      if (path === `/api/booking/hitpay/${id}`)
        return Response.json({ error: "hitpay_hold_expired" }, { status: 409 });
      if (path === `/api/attempts/${id}/expire`)
        return uncertain
          ? Response.json(
              { error: "checkout_expiry_unresolved" },
              { status: 409 },
            )
          : Response.json({ expired: true });
      throw new Error("Unexpected request " + path);
    }),
  );
  function State() {
    const {
      update,
      reserve,
      attempt,
      draft: current,
      restartAfterExpiry,
      action,
    } = useBooking();
    return (
      <>
        <button
          onClick={() =>
            update({ ...draft, nativeServiceId: "2", accepted: false })
          }
        >
          Fill details
        </button>
        <button onClick={() => void reserve()}>Reserve</button>
        <button
          onClick={async () => {
            await expireBooking(id);
            restartAfterExpiry(id);
          }}
        >
          Verify unpaid release
        </button>
        <output data-testid="calendar-return">
          {String(action.returnToCalendar)}
        </output>
        <output data-testid="attempt">
          {attempt?.id ?? "none"}:{current.contact.email}:{current.slots.length}
        </output>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        publicCalendar: undefined,
        calendar: undefined,
      }}
    >
      <State />
      <BookingPage step="details" />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Fill details"));
  await act(async () => fireEvent.click(screen.getByText("Reserve")));
  fireEvent.click(screen.getByRole("checkbox"));
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
    ),
  );
  expect(screen.getByTestId("attempt")).toHaveTextContent(id);
  expect(screen.getByTestId("attempt")).toHaveTextContent(
    `${id}:${draft.contact.email}:0`,
  );
  expect(screen.getByTestId("calendar-return")).toHaveTextContent("true");
  expect(navigation.replace).toHaveBeenCalledWith("/book/time/");
  expect(
    screen.queryByText("Still checking your payment"),
  ).not.toBeInTheDocument();
  uncertain = false;
  await act(async () =>
    fireEvent.click(screen.getByText("Verify unpaid release")),
  );
  expect(screen.getByTestId("attempt")).toHaveTextContent(
    `none:${draft.contact.email}:0`,
  );
  expect(navigation.replace).toHaveBeenCalledWith("/book/time/");
  expect(
    calls.filter((path) => path.startsWith("/api/booking/hold/")),
  ).toHaveLength(1);
  expect(calls.filter((path) => path.endsWith("/expire"))).toHaveLength(2);
});

it("live checkout validates direct handoff scope expiry and destination without persisting the URL", async () => {
  const attempt: Attempt = {
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  };
  const checkout = { url, expiresAtMs: Date.now() + 60000 };
  const good = {
    attemptId: id,
    state: "associated",
    paymentAvailable: true,
    checkout,
  };
  const response = vi.fn(async () => Response.json(good));
  vi.stubGlobal("fetch", response);
  const ready = vi.fn();
  const input = {
    attempt,
    outcome: "pending" as const,
    holding: true,
    startCheckout: true,
    onCheckoutReady: ready,
  };
  const result = await liveBookingService.pay(input);
  expect(ready).toHaveBeenCalledExactlyOnceWith(checkout);
  expect(result.status).toBe("checking");
  expect(result.booking).toBeNull();
  expect(JSON.stringify(result)).not.toContain(url);
  for (const invalid of [
    { ...good, attemptId: "00000000-0000-4000-8000-000000000002" },
    { ...good, paymentAvailable: false },
    { ...good, state: "recovery_required" },
    { ...good, checkout: { ...checkout, expiresAtMs: Date.now() - 1 } },
    {
      ...good,
      checkout: { ...checkout, url: url.replace("hit-pay.com", "evil.test") },
    },
  ]) {
    response.mockImplementation(async () => Response.json(invalid));
    await expect(liveBookingService.pay(input)).rejects.toMatchObject({
      code: "invalid_response",
    });
    expect(ready).toHaveBeenCalledTimes(1);
  }
});

it("proven unstarted checkout stays editable without entering payment recovery", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const fetch = vi.fn(async () =>
    Response.json({ error: "checkout_not_started" }, { status: 503 }),
  );
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
      }}
      identityService={demoCustomerIdentity}
    >
      <Seed />
      <ReviewStep />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Seed" }));
  fireEvent.click(screen.getByRole("button", { name: "Repeat checkout" }));
  await screen.findByText(/Nothing was booked or charged/);
  expect(screen.getByTestId("retained")).toBeEmptyDOMElement();
  expect(screen.getByTestId("action")).toHaveTextContent("failure");
  expect(navigation.push).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
  fetch.mockImplementation(async () =>
    Response.json({ error: "reservation_blocked" }, { status: 429 }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Repeat checkout" }));
  await screen.findByText(/New reservations are paused/);
  expect(screen.getByTestId("retained")).toBeEmptyDOMElement();
  expect(screen.getByTestId("action")).toHaveTextContent("failure");
  expect(screen.getByText("test@example.com")).toBeInTheDocument();
  expect(screen.getByText("12:00–12:40 SGT")).toBeInTheDocument();
  expect(navigation.push).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("queue rejection keeps the original attempt on Review for an explicit retry", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({ error: "provider_queue_busy" }, { status: 503 }),
  );
  vi.stubGlobal("fetch", fetch);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
      }}
      identityService={demoCustomerIdentity}
    >
      <Seed />
      <ReviewStep />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Seed" }));
  fireEvent.click(screen.getByRole("button", { name: "Repeat checkout" }));
  await screen.findByText(/Please wait a moment, then try again/);
  const original = screen.getByTestId("retained").textContent;
  expect(original).toMatch(/^[0-9a-f-]{36}$/);
  expect(screen.getByTestId("action")).toHaveTextContent("failure");
  expect(navigation.push).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Repeat checkout" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(screen.getByTestId("retained")).toHaveTextContent(original!);
  expect(fetch.mock.calls[1][0]).toBe(fetch.mock.calls[0][0]);
  expect(fetch.mock.calls[1][1]?.body).toBe(fetch.mock.calls[0][1]?.body);
});

it("rejected checkout window clears the undispatched draft attempt without payment confirmation polling", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({ error: "checkout_already_active" }, { status: 503 }),
  );
  vi.stubGlobal("fetch", fetch);
  const other = { ...draft.slots[0], start: "12:50" };
  function Probe() {
    const state = useBooking();
    return (
      <>
        <button
          onClick={() =>
            state.update({ ...draft, slots: [draft.slots[0], other] })
          }
        >
          Seed rejected
        </button>
        <button onClick={() => void state.checkout()}>Submit rejected</button>
        <output data-testid="attempt">{state.attempt?.id ?? "none"}</output>
        <output data-testid="return">
          {String(state.action.returnToCalendar)}
        </output>
        <output data-testid="cart">{JSON.stringify(state.draft.slots)}</output>
        <output data-testid="suppressed">
          {JSON.stringify(state.suppressedSlots)}
        </output>
        <p data-testid="notice">{state.selectionNotice}</p>
        <output data-testid="notice-slots">
          {JSON.stringify(state.selectionNoticeSlots)}
        </output>
        <button
          onClick={() => {
            state.visitBookingStep("time");
            state.visitBookingStep("details");
          }}
        >
          Leave calendar
        </button>
      </>
    );
  }
  let finishAvailability!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  const availability = vi.fn<BookingService["availability"]>(
    () =>
      new Promise((resolve) => {
        finishAvailability = resolve;
      }),
  );
  const rejectedTree = (
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
        availability,
      }}
      identityService={demoCustomerIdentity}
    >
      <Probe />
    </BookingProvider>
  );
  render(rejectedTree);
  fireEvent.click(screen.getByText("Seed rejected"));
  fireEvent.click(screen.getByText("Submit rejected"));
  await waitFor(() => expect(availability).toHaveBeenCalledTimes(1));
  expect(screen.getByTestId("return")).not.toHaveTextContent("true");
  expect(JSON.parse(screen.getByTestId("notice-slots").textContent!)).toEqual(
    [],
  );
  // The first Calendar render must wait for the affected-session classification.
  expect(JSON.parse(screen.getByTestId("cart").textContent!)).toEqual([
    draft.slots[0],
    other,
  ]);
  expect(JSON.parse(screen.getByTestId("suppressed").textContent!)).toEqual([
    draft.slots[0],
    other,
  ]);
  expect(screen.queryByText("Checking payment…")).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Submit rejected"));
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => finishAvailability([{ ...other, available: true }]));
  expect(screen.getByTestId("return")).toHaveTextContent("true");
  expect(screen.getByTestId("attempt")).toHaveTextContent("none");
  expect(JSON.parse(screen.getByTestId("cart").textContent!)).toEqual([other]);
  expect(JSON.parse(screen.getByTestId("suppressed").textContent!)).toEqual(
    draft.slots,
  );
  expect(screen.getByTestId("notice")).toHaveTextContent(
    "Some sessions may no longer be available. Please check again.",
  );
  expect(JSON.parse(screen.getByTestId("notice-slots").textContent!)).toEqual([
    { date: draft.slots[0].date, start: draft.slots[0].start },
  ]);
  // A later background classification must not restore a notice dismissed by navigation.
  cleanup();
  saveSuppressedSlots([]);
  render(rejectedTree);
  fireEvent.click(screen.getByText("Seed rejected"));
  fireEvent.click(screen.getByText("Submit rejected"));
  await waitFor(() => expect(availability).toHaveBeenCalledTimes(2));
  fireEvent.click(screen.getByText("Leave calendar"));
  expect(screen.getByTestId("notice")).toBeEmptyDOMElement();
  await act(async () => finishAvailability([{ ...other, available: true }]));
  expect(screen.getByTestId("notice")).toBeEmptyDOMElement();
  expect(JSON.parse(screen.getByTestId("notice-slots").textContent!)).toEqual(
    [],
  );
  expect(sessionStorage.getItem("soccerbot-conflict-notice")).toBeNull();
  expect(availability).toHaveBeenCalledWith(
    expect.objectContaining({ fresh: true }),
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(screen.queryByText("Checking payment…")).not.toBeInTheDocument();
  cleanup();
  const active: Attempt = {
    id,
    draft,
    status: "checking",
    outcome: "pending",
    checkUntil: Date.now() + 600000,
    booking: null,
  };
  const restore = vi.fn(async () => active);
  // Exact contact and selections do not establish tab ownership, including a
  // new tab with no stored attempt marker and a rejected tab with a stale marker.
  for (const marker of [undefined, "00000000-0000-4000-8000-000000000099"]) {
    sessionStorage.removeItem("soccerbot-live-draft");
    saveSuppressedSlots([]);
    saveLiveDraft(draft, true, marker);
    render(
      <BookingProvider
        bookingService={{
          ...liveBookingService,
          restore,
          calendar: undefined,
          publicCalendar: undefined,
          availability,
        }}
        identityService={{ ...demoCustomerIdentity, mode: "live" }}
      >
        <Probe />
      </BookingProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("return")).toHaveTextContent("true"),
    );
    expect(screen.getByTestId("attempt")).toHaveTextContent("none");
    expect(JSON.parse(screen.getByTestId("cart").textContent!)).toEqual(
      draft.slots,
    );
    cleanup();
  }
  saveLiveDraft(draft, true, id);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore,
        calendar: undefined,
        publicCalendar: undefined,
        availability,
      }}
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <Probe />
    </BookingProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId("attempt")).toHaveTextContent(id),
  );
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch).toHaveBeenNthCalledWith(
    3,
    "/api/attempts/00000000-0000-4000-8000-000000000099/checkout",
    expect.objectContaining({ cache: "no-store", credentials: "same-origin" }),
  );
  expect(fetch.mock.calls[2][1]?.body).toBeUndefined();
});

it("checkout readback uses slot-specific messaging only for verified unavailability", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const attempt: Attempt = {
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  };
  for (const status of [409, 503])
    for (const error of [
      "checkout_recovery_required",
      "checkout_already_active",
      "checkout_window_unresolved",
      "native_customer_window_unavailable",
      "checkout_selection_unavailable",
    ]) {
      const fetch = vi.fn(async () => Response.json({ error }, { status }));
      vi.stubGlobal("fetch", fetch);
      await expect(
        liveBookingService.pay({
          attempt,
          holding: true,
          startCheckout: true,
          outcome: "success",
        }),
      ).rejects.toMatchObject({
        code:
          error === "checkout_recovery_required"
            ? "temporarily_unavailable"
            : error === "checkout_selection_unavailable"
              ? "selection_unavailable"
              : "checkout_window_blocked",
        message:
          error === "checkout_recovery_required"
            ? "Checking your booking. Do not book or pay again."
            : error === "checkout_selection_unavailable"
              ? "Session no longer available."
              : "We couldn’t start checkout. Please try again later.",
      });
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  const other = { ...draft.slots[0], start: "12:50" };
  let finishAvailability!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  const availability = vi
    .fn<BookingService["availability"]>(async () => [
      { ...draft.slots[0], available: false },
      { ...other, available: true },
    ])
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishAvailability = resolve;
        }),
    );
  const checkout = vi.fn<BookingService["checkout"]>(async () => {
    throw new BookingServiceError(
      "selection_unavailable",
      "Session no longer available.",
    );
  });
  function ConflictProbe() {
    const state = useBooking();
    return (
      <>
        <button
          onClick={() =>
            state.update({ ...draft, slots: [draft.slots[0], other] })
          }
        >
          Seed multi
        </button>
        <button onClick={() => void state.checkout()}>Checkout multi</button>
        <p data-testid="conflict-notice">{state.selectionNotice}</p>
        <output data-testid="conflict-slots">
          {JSON.stringify(state.selectionNoticeSlots)}
        </output>
        <output data-testid="conflict-cart">
          {JSON.stringify(state.draft.slots)}
        </output>
        <output data-testid="conflict-action">
          {String(state.action.returnToCalendar)}
        </output>
        <output data-testid="conflict-calendar">
          {JSON.stringify(state.calendar.cachedDates[draft.slots[0].date])}
        </output>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: async ({ month }) => ({
          month,
          serviceId: "2",
          observedAtMs: Date.now(),
          dates: [
            {
              date: draft.slots[0].date,
              available: true,
              offers: [draft.slots[0], other].map((slot) => ({
                ...slot.native!,
                instructorId: slot.instructor,
                startMs: Date.parse(`${slot.date}T${slot.start}:00+08:00`),
              })),
            },
          ],
        }),
        checkout,
        availability,
      }}
    >
      <ConflictProbe />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Seed multi"));
  await waitFor(() =>
    expect(screen.getByTestId("conflict-calendar").textContent).toContain(
      "12:50",
    ),
  );
  fireEvent.click(screen.getByText("Checkout multi"));
  await waitFor(() => expect(availability).toHaveBeenCalledTimes(1));
  expect(screen.getByTestId("conflict-action")).not.toHaveTextContent("true");
  await act(async () =>
    finishAvailability([
      { ...draft.slots[0], available: false },
      { ...other, available: true },
    ]),
  );
  await waitFor(() =>
    expect(screen.getByTestId("conflict-action")).toHaveTextContent("true"),
  );
  expect(JSON.parse(screen.getByTestId("conflict-cart").textContent!)).toEqual([
    other,
  ]);
  expect(
    JSON.parse(screen.getByTestId("conflict-calendar").textContent!),
  ).toEqual([{ ...other, available: true }]);
  expect(availability).toHaveBeenCalledTimes(1);
  for (const call of availability.mock.calls)
    expect(call[0]).toEqual(
      expect.objectContaining({ fresh: true, date: draft.slots[0].date }),
    );
  expect(JSON.parse(screen.getByTestId("conflict-slots").textContent!)).toEqual(
    [{ date: draft.slots[0].date, start: draft.slots[0].start }],
  );
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("conflict-notice")).toHaveTextContent(
    "Some sessions may no longer be available. Please check again.",
  );
  cleanup();
  // The other tab retains an authorized checkout with identical contact data.
  // Reloading this rejected tab must preserve both empty and edited carts.
  const restore = vi.fn(async (): Promise<Attempt> => ({
    id,
    draft,
    status: "checking",
    outcome: "pending",
    checkUntil: Date.now() + 600000,
    booking: null,
  }));
  let recoveryResult: boolean | undefined;
  function ReloadProbe() {
    const state = useBooking();
    return (
      <>
        <button
          onClick={() =>
            void state
              .rejectRecoveredSelection(id, {
                state: "selection_unavailable",
                rejectedSessionIndex: 0,
              })
              .then((result) => {
                recoveryResult = result;
              })
          }
        >
          Recover original
        </button>
        <button
          onClick={() =>
            void state
              .rejectRecoveredSelection(
                "00000000-0000-4000-8000-000000000099",
                { state: "selection_unavailable", rejectedSessionIndex: 0 },
              )
              .then((result) => {
                recoveryResult = result;
              })
          }
        >
          Recover foreign
        </button>
        <output data-testid="reload-notice">{state.selectionNotice}</output>
        <output data-testid="reload-attempt">
          {state.attempt?.id ?? "none"}
        </output>
        <output data-testid="reload-cart">
          {JSON.stringify(state.draft.slots)}
        </output>
      </>
    );
  }
  for (const slots of [[], [other], draft.slots]) {
    saveLiveDraft({ ...draft, slots });
    render(
      <BookingProvider
        bookingService={{
          ...liveBookingService,
          restore,
          calendar: undefined,
          publicCalendar: undefined,
        }}
        identityService={{ ...demoCustomerIdentity, mode: "live" }}
      >
        <ReloadProbe />
      </BookingProvider>,
    );
    await act(async () => {});
    expect(screen.getByTestId("reload-attempt")).toHaveTextContent("none");
    expect(JSON.parse(screen.getByTestId("reload-cart").textContent!)).toEqual(
      slots,
    );
    cleanup();
  }
  // Lost rejection response: the exact saved attempt can be recovered from
  // authenticated no-effects evidence even when /current is now empty.
  for (const recovery of [
    "retained",
    "reload",
    "foreign",
    "mismatched",
  ] as const) {
    recoveryResult = undefined;
    const readsBefore = availability.mock.calls.length;
    saveSuppressedSlots([]);
    saveLiveDraft({ ...draft, slots: [draft.slots[0], other] }, true, id);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          attemptId: id,
          mode: "live",
          checkout: { state: "unavailable" },
          selectionRejection: {
            state: "selection_unavailable",
            rejectedSessionIndex: 0,
          },
          summary: {
            players: recovery === "mismatched" ? 2 : draft.players,
            totalMinor: 17600,
            currency: "SGD",
            sessions: [draft.slots[0], other].map((slot) => ({
              startMs: Date.parse(`${slot.date}T${slot.start}:00+08:00`),
              players: recovery === "mismatched" ? 2 : draft.players,
            })),
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
      <BookingProvider
        bookingService={{
          ...liveBookingService,
          restore: async () =>
            recovery === "reload" || recovery === "mismatched"
              ? null
              : {
                  id,
                  draft: { ...draft, slots: [draft.slots[0], other] },
                  status: "checking",
                  outcome: "pending",
                  checkUntil: Date.now() + 600000,
                  booking: null,
                },
          calendar: undefined,
          publicCalendar: undefined,
          availability,
        }}
        identityService={{ ...demoCustomerIdentity, mode: "live" }}
      >
        <ReloadProbe />
      </BookingProvider>,
    );
    if (recovery === "mismatched") {
      await act(async () => {});
      expect(
        JSON.parse(screen.getByTestId("reload-cart").textContent!),
      ).toEqual([draft.slots[0], other]);
      expect(availability).toHaveBeenCalledTimes(readsBefore);
      cleanup();
      continue;
    }
    if (recovery !== "reload") {
      await waitFor(() =>
        expect(screen.getByTestId("reload-attempt")).toHaveTextContent(id),
      );
      fireEvent.click(
        screen.getByText(
          recovery === "foreign" ? "Recover foreign" : "Recover original",
        ),
      );
      await waitFor(() => expect(recoveryResult).toBe(recovery !== "foreign"));
    }
    if (recovery === "foreign") {
      expect(screen.getByTestId("reload-attempt")).toHaveTextContent(id);
      expect(
        JSON.parse(screen.getByTestId("reload-cart").textContent!),
      ).toEqual([draft.slots[0], other]);
    } else {
      await waitFor(() =>
        expect(screen.getByTestId("reload-notice")).toHaveTextContent(
          "Some sessions may no longer be available. Please check again.",
        ),
      );
      expect(screen.getByTestId("reload-attempt")).toHaveTextContent("none");
      expect(
        JSON.parse(screen.getByTestId("reload-cart").textContent!),
      ).toEqual([other]);
    }
    cleanup();
  }
});

it("keeps booking UI unready until protected restoration finishes", async () => {
  let finish!: (attempt: Attempt | null) => void;
  const restore = vi.fn(
    () =>
      new Promise<Attempt | null>((resolve) => {
        finish = resolve;
      }),
  );
  function Probe() {
    const { ready } = useBooking();
    return <output data-testid="restoration-ready">{String(ready)}</output>;
  }
  render(
    <BookingProvider
      bookingService={{ ...liveBookingService, restore }}
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <Probe />
    </BookingProvider>,
  );
  expect(restore).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("restoration-ready")).toHaveTextContent("false");
  await act(async () => finish(null));
  expect(screen.getByTestId("restoration-ready")).toHaveTextContent("true");
});

it("editing a new selection clears the previous unpaid reservation notice", async () => {
  function State() {
    const { restartAfterExpiry, update, selectionNotice } = useBooking();
    return (
      <>
        <button onClick={() => restartAfterExpiry(id)}>Released</button>
        <button onClick={() => update({ players: 2 })}>New selection</button>
        {selectionNotice && <p role="status">{selectionNotice}</p>}
      </>
    );
  }
  render(
    <BookingProvider>
      <State />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("Released"));
  expect(screen.getByRole("status")).toHaveTextContent(PAYMENT_WINDOW_ENDED);
  fireEvent.click(screen.getByText("New selection"));
  expect(screen.queryByText(PAYMENT_WINDOW_ENDED)).not.toBeInTheDocument();
});

/** Exercise the shared expiry guard with an explicit reviewed case. */
async function verifyExpiryRetention(multi: boolean) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const other = { ...draft.slots[0], start: "12:50" };
  const availability = vi.fn<BookingService["availability"]>(async () => [
    { ...draft.slots[0], available: false },
    { ...other, available: true },
  ]);
  saveLiveDraft({
    ...draft,
    slots: multi ? [draft.slots[0], other] : draft.slots,
  });
  function Probe() {
    const {
      draft: current,
      restartAfterExpiry,
      selectionNotice,
      suppressedSlots,
    } = useBooking();
    return (
      <>
        <button onClick={() => restartAfterExpiry(id)}>Released</button>
        <output data-testid="cart">{JSON.stringify(current)}</output>
        <output data-testid="suppressed">
          {JSON.stringify(suppressedSlots)}
        </output>
        <p role="status" aria-label="Expiry notice">
          {selectionNotice}
        </p>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        publicCalendar: undefined,
        availability,
      }}
    >
      <Probe />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Released"));
  fireEvent.click(screen.getByText("Released"));
  expect(JSON.parse(screen.getByTestId("cart").textContent!).slots).toEqual([]);
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Expiry notice" }),
    ).toHaveTextContent(PAYMENT_WINDOW_ENDED),
  );
  const current = JSON.parse(screen.getByTestId("cart").textContent!);
  expect(current.slots).toEqual([]);
  expect(current.contact).toEqual(draft.contact);
  expect(current.accepted).toBe(false);
  await waitFor(() =>
    expect(JSON.parse(screen.getByTestId("suppressed").textContent!)).toEqual(
      draft.slots,
    ),
  );
  expect(availability).toHaveBeenCalledWith(
    expect.objectContaining({
      date: "2026-10-20",
      fresh: true,
      serviceId: "2",
    }),
  );
}
it("unpaid expiry keeps the cart empty and checks affected sessions (multi=false)", async () => {
  await verifyExpiryRetention(false);
});
it("unpaid expiry keeps the cart empty and checks affected sessions (multi=true)", async () => {
  await verifyExpiryRetention(true);
});

/** Exercise the shared expiry guard with an explicit reviewed case. */
async function verifyExpiryStaleRead(outcome: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  let finish!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  let fail!: (error: Error) => void;
  const availability = vi.fn<BookingService["availability"]>(
    () =>
      new Promise((resolve, reject) => {
        finish = resolve;
        fail = reject;
      }),
  );
  saveLiveDraft(draft);
  let signedIn = false;
  const identityService = {
    ...demoCustomerIdentity,
    current: () =>
      signedIn
        ? {
            email: "other@example.com",
            expiresAt: Date.now() + 60000,
            remember: false,
          }
        : null,
  };
  function Probe() {
    const {
      draft: current,
      restartAfterExpiry,
      update,
      selectionNotice,
      suppressedSlots,
    } = useBooking();
    return (
      <>
        <button onClick={() => restartAfterExpiry(id)}>Released</button>
        <button onClick={() => update({ players: 2 })}>Edit</button>
        <output data-testid="cart">{JSON.stringify(current)}</output>
        <output data-testid="suppressed">
          {JSON.stringify(suppressedSlots)}
        </output>
        <p role="status" aria-label="Expiry notice">
          {selectionNotice}
        </p>
      </>
    );
  }
  render(
    <BookingProvider
      identityService={identityService}
      bookingService={{
        ...liveBookingService,
        publicCalendar: undefined,
        availability,
      }}
    >
      <Probe />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Released"));
  const originalFinish = finish;
  const originalFail = fail;
  if (outcome === "edited") fireEvent.click(screen.getByText("Edit"));
  if (outcome === "identity") signedIn = true;
  await act(async () => {
    if (outcome === "failure") originalFail(new Error("offline"));
    else
      originalFinish([
        {
          ...draft.slots[0],
          available: true,
          ...(outcome === "changed" ? { instructor: "5" } : {}),
          ...(outcome === "rotation" ? { rotationAt: "12:20" } : {}),
          ...(outcome === "price"
            ? { native: { ...draft.slots[0].native, priceMinor: 9900 } }
            : {}),
        },
      ]);
  });
  const current = JSON.parse(screen.getByTestId("cart").textContent!);
  expect(current.slots).toEqual([]);
  expect(current.contact).toEqual(draft.contact);
  const suppressed = JSON.parse(screen.getByTestId("suppressed").textContent!);
  if (["failure", "identity", "edited"].includes(outcome))
    expect(suppressed).toEqual(draft.slots);
  else expect(suppressed).toEqual([]);
  if (outcome === "edited") {
    expect(current.players).toBe(2);
    expect(
      screen.getByRole("status", { name: "Expiry notice" }),
    ).toBeEmptyDOMElement();
    expect(availability.mock.calls[0][0].signal?.aborted).toBe(true);
  } else {
    expect(
      screen.getByRole("status", { name: "Expiry notice" }),
    ).toHaveTextContent(PAYMENT_WINDOW_ENDED);
    expect(
      screen.getByRole("status", { name: "Expiry notice" }),
    ).not.toHaveTextContent("Unable to confirm availability");
  }
}
it("unpaid expiry never restores an unconfirmed or obsolete selection (failure)", async () => {
  await verifyExpiryStaleRead("failure");
});
it("unpaid expiry never restores an unconfirmed or obsolete selection (changed)", async () => {
  await verifyExpiryStaleRead("changed");
});
it("unpaid expiry never restores an unconfirmed or obsolete selection (price)", async () => {
  await verifyExpiryStaleRead("price");
});
it("unpaid expiry never restores an unconfirmed or obsolete selection (rotation)", async () => {
  await verifyExpiryStaleRead("rotation");
});
it("unpaid expiry never restores an unconfirmed or obsolete selection (edited)", async () => {
  await verifyExpiryStaleRead("edited");
});
it("unpaid expiry never restores an unconfirmed or obsolete selection (identity)", async () => {
  await verifyExpiryStaleRead("identity");
});

/** Exercise the shared expiry guard with an explicit reviewed case. */
async function verifyExpiryAttemptGuard(kind: string) {
  const attempt: Attempt = {
    id: kind === "different" ? "00000000-0000-4000-8000-000000000002" : id,
    status: kind === "paid" ? "paid" : "ready",
    draft,
    outcome: "success",
    checkUntil: Date.now() + 60000,
    booking: null,
  };
  const availability = vi.fn<BookingService["availability"]>(async () => []);
  saveLiveDraft(draft, true, attempt.id);
  if (kind === "paid") saveBooking({ version: 2, draft, attempt });
  function Probe() {
    const {
      attempt: current,
      draft: currentDraft,
      restartAfterExpiry,
    } = useBooking();
    return (
      <>
        <button onClick={() => restartAfterExpiry(id)}>Released</button>
        <output data-testid="attempt">{current?.id}</output>
        <output data-testid="cart">{JSON.stringify(currentDraft.slots)}</output>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={
        kind === "paid"
          ? { ...demoBookingService, availability }
          : {
              ...liveBookingService,
              publicCalendar: undefined,
              availability,
              restore: async () => attempt,
            }
      }
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <Probe />
    </BookingProvider>,
  );
  await waitFor(() =>
    expect(screen.getByTestId("attempt")).toHaveTextContent(attempt.id),
  );
  fireEvent.click(screen.getByText("Released"));
  expect(screen.getByTestId("attempt")).toHaveTextContent(attempt.id);
  expect(JSON.parse(screen.getByTestId("cart").textContent!)).toEqual(
    draft.slots,
  );
  expect(availability).not.toHaveBeenCalled();
}
it("expiry callback cannot clear a paid or different current attempt (paid)", async () => {
  await verifyExpiryAttemptGuard("paid");
});
it("expiry callback cannot clear a paid or different current attempt (different)", async () => {
  await verifyExpiryAttemptGuard("different");
});

/** Exercise provider restoration, route guards and expiry recovery through protected reads. */
async function verifyMockPaymentExpiry(expired: boolean) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  localStorage.clear();
  const retained: Attempt = {
    id,
    draft,
    status: "checking",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  };
  const other = { ...draft.slots[0], start: "12:50" };
  const offers = [
    draft.slots[0],
    { ...draft.slots[0], instructor: "5" },
    other,
  ].map((slot) => ({ ...slot, available: true }));
  let paid = false;
  let deferStatus = false;
  let finishStatus!: (response: Response) => void;
  let failFresh = false;
  const requests: Array<{ path: string; method: string }> = [];
  const fetch = vi.fn<typeof globalThis.fetch>(async (input, options) => {
    const path = String(input);
    requests.push({ path, method: options?.method ?? "GET" });
    if (path === `/api/attempts/${id}/expire`)
      return Response.json(
        { error: "checkout_expiry_unresolved" },
        { status: 409 },
      );
    if (path === `/api/attempts/${id}/checkout`)
      return Response.json({
        attemptId: id,
        mode: "live",
        expired: expired && !paid,
        checkout: { state: "unavailable" },
        summary: {
          players: draft.players,
          totalMinor: 8800,
          currency: "SGD",
          sessions: [
            {
              startMs: Date.parse("2026-10-20T12:00:00+08:00"),
              players: draft.players,
            },
          ],
        },
        checking: {
          deadlineMs: Date.parse("2026-10-15T00:10:00Z"),
          nextCheckMs: 0,
          pollAfterMs: 5000,
        },
      });
    if (path === `/api/attempts/${id}/confirmation`) {
      if (deferStatus)
        return new Promise<Response>((resolve) => {
          finishStatus = resolve;
        });
      return expired
        ? Response.json({
            status: "pending",
            reason: paid
              ? "payment_received_booking_pending"
              : "payment_verification_pending",
            expired: !paid,
          })
        : new Response(null, { status: 503 });
    }
    return new Response(null, { status: 503 });
  });
  vi.stubGlobal("fetch", fetch);
  const availability = vi.fn<BookingService["availability"]>(
    async ({ fresh }) => {
      if (fresh && failFresh)
        throw new Error("Synthetic unavailable fresh read");
      return offers;
    },
  );
  const service: BookingService = {
    ...liveBookingService,
    restore: async () => retained,
    availability,
    publicCalendar: async ({ month }) => ({
      month,
      serviceId: "2",
      observedAtMs: Date.now(),
      dates: [
        {
          date: draft.slots[0].date,
          available: true,
          offers: offers.map((slot) => ({
            ...slot.native!,
            instructorId: slot.instructor,
            startMs: Date.parse(`${slot.date}T${slot.start}:00+08:00`),
          })),
        },
      ],
    }),
  };
  const identity = { ...demoCustomerIdentity, mode: "live" as const };
  function Probe() {
    const state = useBooking();
    return (
      <>
        <output data-testid="mock-expiry-attempt">
          {JSON.stringify(state.attempt)}
        </output>
        <output data-testid="mock-expiry-draft">
          {JSON.stringify(state.draft)}
        </output>
        <output data-testid="mock-expiry-return">
          {String(state.action.returnToCalendar)}
        </output>
        <output data-testid="mock-expiry-recovery">
          {String(state.action.calendarRecovery)}
        </output>
      </>
    );
  }
  const tree = (step: "payment" | "time") => (
    <BookingProvider bookingService={service} identityService={identity}>
      <Probe />
      <BookingPage step={step} />
    </BookingProvider>
  );
  saveLiveDraft(draft, true, id);
  let view = render(tree("payment"));
  if (!expired) {
    await screen.findByRole("heading", { name: "Confirmation unavailable" });
    expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
    expect(
      JSON.parse(screen.getByTestId("mock-expiry-attempt").textContent!),
    ).toEqual(retained);
    expect(
      JSON.parse(screen.getByTestId("mock-expiry-draft").textContent!).slots,
    ).toEqual(draft.slots);
    expect(
      requests.filter((request) => request.path.endsWith("/expire")),
    ).toEqual([]);
    return;
  }
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith("/book/time/"),
  );
  expect(screen.getByTestId("mock-expiry-return")).toHaveTextContent("true");
  expect(
    JSON.parse(screen.getByTestId("mock-expiry-attempt").textContent!),
  ).toEqual(retained);
  expect(
    JSON.parse(screen.getByTestId("mock-expiry-draft").textContent!).slots,
  ).toEqual([]);
  view.rerender(tree("time"));
  await screen.findByRole("button", { name: /12:50–13:30/ });
  expect(
    within(screen.getByRole("alert")).getByRole("listitem"),
  ).toHaveTextContent("Tue, 20 Oct 2026, 12:00–12:40.");
  expect(screen.queryByRole("button", { name: /12:00–12:40/ })).toBeNull();
  expect(screen.getByRole("button", { name: /12:50–13:30/ })).toBeEnabled();
  expect(
    document.querySelector(".booking-flow-overlay, .payment-check-feedback"),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Check status" })).toBeNull();
  const assertBackgroundOnly = () => {
    expect(
      document.querySelector(
        ".booking-flow-overlay, .page-loading, .payment-check-feedback, .spinner",
      ),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Check status" })).toBeNull();
    expect(screen.getByRole("button", { name: /12:50–13:30/ })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /12:00–12:40/ })).toBeNull();
  };
  assertBackgroundOnly();
  // Keep the next scheduled status response in flight: no interval may replace
  // the usable calendar with a foreground loader.
  vi.useFakeTimers();
  view.unmount();
  view = render(tree("time"));
  await act(async () => {});
  assertBackgroundOnly();
  const statusBefore = requests.filter((request) =>
    request.path.endsWith("/confirmation"),
  ).length;
  deferStatus = true;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(
    requests.filter((request) => request.path.endsWith("/confirmation")).length,
  ).toBeGreaterThan(statusBefore);
  assertBackgroundOnly();
  deferStatus = false;
  await act(async () =>
    finishStatus(
      Response.json({
        status: "pending",
        reason: "payment_verification_pending",
        expired: true,
      }),
    ),
  );
  assertBackgroundOnly();
  const releaseBefore = requests.filter((request) =>
    request.path.endsWith("/expire"),
  ).length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(25000);
  });
  expect(
    requests.filter((request) => request.path.endsWith("/expire")).length,
  ).toBeGreaterThan(releaseBefore);
  assertBackgroundOnly();
  failFresh = true;
  const freshBefore = availability.mock.calls.filter(
    ([request]) => request.fresh,
  ).length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(
    availability.mock.calls.filter(([request]) => request.fresh).length,
  ).toBeGreaterThan(freshBefore);
  assertBackgroundOnly();
  failFresh = false;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  assertBackgroundOnly();
  // Unmount before replacing the timer clock so cleanup owns its original timers.
  // Flush the mocked restoration/read promises before asserting the refreshed UI.
  view.unmount();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:02:00Z"));
  // Refresh retains the unresolved financial attempt but never restores its cart.
  await act(async () => {
    render(tree("time"));
  });
  expect(screen.getByRole("button", { name: /12:50–13:30/ })).toBeEnabled();
  expect(
    JSON.parse(screen.getByTestId("mock-expiry-attempt").textContent!),
  ).toEqual(retained);
  expect(
    JSON.parse(screen.getByTestId("mock-expiry-draft").textContent!).slots,
  ).toEqual([]);
  // Arrival consumes navigation intent while preserving financial recovery.
  expect(screen.getByTestId("mock-expiry-return")).toHaveTextContent("false");
  expect(screen.getByTestId("mock-expiry-recovery")).toHaveTextContent("true");
  expect(screen.queryByRole("button", { name: /12:00–12:40/ })).toBeNull();
  expect(screen.queryByRole("link", { name: "Continue payment" })).toBeNull();
  // Later authenticated payment evidence must return to the original payment
  // recovery, never permit another checkout or discard the paid attempt.
  paid = true;
  vi.setSystemTime(new Date("2026-10-15T00:02:31Z"));
  fireEvent.focus(window);
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith("/book/payment/"),
  );
  expect(screen.getByTestId("mock-expiry-return")).toHaveTextContent(
    "undefined",
  );
  expect(
    JSON.parse(screen.getByTestId("mock-expiry-attempt").textContent!).id,
  ).toBe(id);
  expect(
    requests
      .filter((request) => request.method !== "GET")
      .every((request) => request.path === `/api/attempts/${id}/expire`),
  ).toBe(true);
  expect(
    requests.some((request) => request.path.startsWith("/api/booking/")),
  ).toBe(false);
}

it("mock payment expiry returns to calendar preserves recovery across refresh and honours late payment", async () => {
  await verifyMockPaymentExpiry(true);
});
it("mock unavailable payment status cannot masquerade as expiry or clear the original attempt", async () => {
  await verifyMockPaymentExpiry(false);
});

it("mock conflict refresh keeps the rejected tab on calendar without adopting an identical-contact checkout", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  localStorage.clear();
  const notice =
    "Some sessions may no longer be available. Please check again.";
  const otherId = "00000000-0000-4000-8000-000000000002";
  const available = { ...draft.slots[0], start: "12:50", available: true };
  let otherActive = false;
  const restore = vi.fn(async (): Promise<Attempt | null> =>
    otherActive
      ? {
          id: otherId,
          draft,
          status: "checking",
          outcome: "pending",
          checkUntil: 0,
          booking: null,
        }
      : null,
  );
  const checkout = vi.fn<BookingService["checkout"]>(async () => {
    throw new BookingServiceError(
      "selection_unavailable",
      "Synthetic capacity conflict",
      0,
    );
  });
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () => new Response(null, { status: 503 }),
  );
  vi.stubGlobal("fetch", fetch);
  const service: BookingService = {
    ...liveBookingService,
    restore,
    checkout,
    availability: async () => [available],
    publicCalendar: async ({ month }) => ({
      month,
      serviceId: "2",
      observedAtMs: Date.now(),
      dates: [
        {
          date: available.date,
          available: true,
          offers: [
            {
              ...available.native!,
              instructorId: available.instructor,
              startMs: Date.parse(
                `${available.date}T${available.start}:00+08:00`,
              ),
            },
          ],
        },
      ],
    }),
  };
  const identity = { ...demoCustomerIdentity, mode: "live" as const };
  function Probe() {
    const state = useBooking();
    return (
      <>
        <button onClick={() => state.update({ ...draft, accepted: true })}>
          Review conflicting cart
        </button>
        <button onClick={() => void state.checkout()}>Submit conflict</button>
        <output data-testid="conflict-refresh-attempt">
          {state.attempt?.id ?? "none"}
        </output>
        <output data-testid="conflict-refresh-draft">
          {JSON.stringify(state.draft)}
        </output>
        <output data-testid="conflict-refresh-notice">
          {state.selectionNotice}
        </output>
      </>
    );
  }
  const tree = (step: "review" | "time" | "details") => (
    <BookingProvider bookingService={service} identityService={identity}>
      <Probe />
      <BookingPage step={step} />
    </BookingProvider>
  );
  saveLiveDraft(draft);
  const view = render(tree("review"));
  await act(async () => {});
  fireEvent.click(screen.getByText("Review conflicting cart"));
  fireEvent.click(screen.getByText("Submit conflict"));
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith("/book/time/"),
  );
  view.rerender(tree("time"));
  expect(
    (await screen.findByRole("alert")).querySelector("p")?.textContent,
  ).toBe(notice);
  expect(
    within(screen.getByRole("alert")).getByRole("listitem"),
  ).toHaveTextContent("Tue, 20 Oct 2026, 12:00–12:40.");
  expect(screen.getByTestId("conflict-refresh-notice").textContent).toBe(
    notice,
  );
  expect(
    JSON.parse(sessionStorage.getItem("soccerbot-conflict-notice")!),
  ).toEqual([{ date: "2026-10-20", start: "12:00" }]);
  expect(
    JSON.parse(screen.getByTestId("conflict-refresh-draft").textContent!).slots,
  ).toEqual([]);
  expect(screen.getByTestId("conflict-refresh-attempt")).toHaveTextContent(
    "none",
  );
  expect(checkout).toHaveBeenCalledTimes(1);
  otherActive = true;
  view.unmount();
  const restoreBefore = restore.mock.calls.length;
  const refreshed = render(tree("time"));
  await waitFor(() => expect(restore).toHaveBeenCalledTimes(restoreBefore + 1));
  expect(
    await screen.findByRole("button", { name: /12:50–13:30/ }),
  ).toBeEnabled();
  expect(screen.getByTestId("conflict-refresh-attempt")).toHaveTextContent(
    "none",
  );
  const saved = JSON.parse(
    screen.getByTestId("conflict-refresh-draft").textContent!,
  );
  expect(saved.slots).toEqual([]);
  expect(saved.contact).toEqual(draft.contact);
  expect(screen.queryByRole("link", { name: "Continue payment" })).toBeNull();
  expect(screen.queryByRole("button", { name: /12:00–12:40/ })).toBeNull();
  expect(
    document.querySelector(".booking-flow-overlay, .payment-check-feedback"),
  ).toBeNull();
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(
    fetch.mock.calls.every(
      ([, options]) => !options?.method || options.method === "GET",
    ),
  ).toBe(true);
  expect(
    fetch.mock.calls.some(([path]) => String(path).includes(otherId)),
  ).toBe(false);
  expect(screen.getByRole("alert").querySelector("p")?.textContent).toBe(
    notice,
  );
  expect(
    within(screen.getByRole("alert")).getByRole("listitem"),
  ).toHaveTextContent("Tue, 20 Oct 2026, 12:00–12:40.");
  expect(screen.getByTestId("conflict-refresh-notice").textContent).toBe(
    notice,
  );
  expect(
    JSON.parse(sessionStorage.getItem("soccerbot-conflict-notice")!),
  ).toEqual([{ date: "2026-10-20", start: "12:00" }]);

  // Calendar edits do not dismiss the conflict explanation.
  fireEvent.click(screen.getByRole("button", { name: /12:50–13:30/ }));
  fireEvent.change(
    screen.getByLabelText(`Trainer for ${available.date} at 12:50`),
    {
      target: { value: `${available.date}|12:50|2|4` },
    },
  );
  expect(
    JSON.parse(screen.getByTestId("conflict-refresh-draft").textContent!).slots,
  ).toEqual([{ ...draft.slots[0], start: "12:50" }]);
  expect(screen.getByRole("alert").querySelector("p")?.textContent).toBe(
    notice,
  );
  expect(
    within(screen.getByRole("alert")).getByRole("listitem"),
  ).toHaveTextContent("Tue, 20 Oct 2026, 12:00–12:40.");
  expect(screen.getByTestId("conflict-refresh-notice").textContent).toBe(
    notice,
  );
  expect(
    JSON.parse(sessionStorage.getItem("soccerbot-conflict-notice")!),
  ).toEqual([{ date: "2026-10-20", start: "12:00" }]);
  expect(
    screen.getByRole("link", { name: /^Enter Booking Details/ }),
  ).toHaveAttribute("href", "/book/details");

  // Completing the first navigation away clears the notice and its persisted
  // state. A later calendar visit must not resurrect it from the foreign checkout.
  refreshed.rerender(tree("details"));
  expect(
    await screen.findByRole("heading", {
      name: "Booking Contact",
    }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("conflict-refresh-notice")).toBeEmptyDOMElement();
  expect(sessionStorage.getItem("soccerbot-conflict-notice")).toBeNull();
  refreshed.rerender(tree("time"));
  expect(
    await screen.findByRole("button", { name: /12:50–13:30/ }),
  ).toBeEnabled();
  expect(screen.getByTestId("conflict-refresh-notice")).toBeEmptyDOMElement();
  expect(screen.queryByText(notice)).toBeNull();
  refreshed.unmount();
  const afterLeaveRestore = restore.mock.calls.length;
  render(tree("time"));
  await waitFor(() =>
    expect(restore).toHaveBeenCalledTimes(afterLeaveRestore + 1),
  );
  expect(
    await screen.findByRole("button", { name: /12:50–13:30/ }),
  ).toBeEnabled();
  expect(screen.getByTestId("conflict-refresh-notice")).toBeEmptyDOMElement();
  expect(sessionStorage.getItem("soccerbot-conflict-notice")).toBeNull();
  expect(screen.queryByText(notice)).toBeNull();
  expect(screen.getByTestId("conflict-refresh-attempt")).toHaveTextContent(
    "none",
  );
  expect(screen.queryByRole("link", { name: "Continue payment" })).toBeNull();
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(
    fetch.mock.calls.some(([path]) => String(path).includes(otherId)),
  ).toBe(false);
});

it("confirmed no-creation proof clears only its original attempt through recovery refresh home and immediate checkout routes", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  const notice =
    "Nothing was booked or charged. Your details are saved; please choose your sessions again.";
  for (const route of [
    "recovery",
    "confirmation",
    "status",
    "refresh",
    "home",
    "home-refresh",
    "immediate",
  ] as const) {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    navigation.replace.mockClear();
    let resolved = route === "status" || route === "immediate";
    let refreshed = false;
    let freshAvailable = false;
    const retained: Attempt = {
      id,
      draft,
      status: "checking",
      outcome: "pending",
      checkUntil: 0,
      booking: null,
    };
    const fetcher = vi.fn<typeof globalThis.fetch>(async (input) => {
      const path = String(input);
      if (path === `/api/booking/checkout/${id}`)
        return Response.json({
          attemptId: id,
          state: "recovery_required",
          paymentAvailable: false,
          creationResolution: { state: "not_created" },
        });
      if (path === `/api/attempts/${id}/checkout`)
        return Response.json({
          attemptId: id,
          mode: "live",
          checkout: { state: "unavailable" },
          ...(route === "status"
            ? {}
            : resolved
              ? { creationResolution: { state: "not_created" } }
              : { bookingIssue: "incomplete" }),
          summary: {
            players: draft.players,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [
              {
                startMs: Date.parse("2026-10-20T12:00:00+08:00"),
                players: draft.players,
              },
            ],
          },
          checking: {
            deadlineMs: Date.now() + 600000,
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        });
      if (path === `/api/attempts/${id}/confirmation`)
        return Response.json(
          resolved
            ? {
                status: "invalid",
                reason: "booking_not_created",
                creationResolution: { state: "not_created" },
              }
            : { status: "pending", reason: "payment_verification_pending" },
        );
      return new Response(null, { status: 503 });
    });
    vi.stubGlobal("fetch", fetcher);
    const service: BookingService = {
      ...liveBookingService,
      checkout: async () => ({ ...retained, status: "ready" }),
      restore: async () =>
        route === "immediate" || refreshed ? null : retained,
      publicCalendar: undefined,
      calendar: async ({ month }) => ({
        month,
        observedAtMs: Date.now(),
        dates: [{ date: draft.slots[0].date, available: true }],
      }),
      availability: vi.fn(async ({ fresh }) => {
        if (fresh && !freshAvailable)
          throw new Error("Synthetic fresh availability outage");
        return [
          ...draft.slots.map((slot) => ({ ...slot, available: true })),
          {
            ...draft.slots[0],
            instructor: "5",
            native: {
              ...draft.slots[0].native,
              instructorName: "Other instructor",
            },
            available: true,
          },
        ];
      }),
    };
    const identity = { ...demoCustomerIdentity, mode: "live" as const };
    function Probe() {
      const state = useBooking();
      return (
        <>
          <output data-testid="creation-attempt">
            {state.attempt?.id ?? "none"}
          </output>
          <output data-testid="creation-draft">
            {JSON.stringify(state.draft)}
          </output>
          <output data-testid="creation-suppressed">
            {JSON.stringify(state.suppressedSlots)}
          </output>
          <button onClick={state.leave}>Leave uncertain booking</button>
          <button
            onClick={() =>
              state.resolveUncreatedBooking(
                "00000000-0000-4000-8000-000000000099",
              )
            }
          >
            Foreign proof
          </button>
          <button onClick={() => state.update({ ...draft, accepted: true })}>
            Accept original
          </button>
          <button onClick={() => void state.checkout()}>Create original</button>
        </>
      );
    }
    const tree = (
      step: "payment" | "time" | "account" | "review" | "confirmation" | null,
    ) => (
      <BookingProvider bookingService={service} identityService={identity}>
        <Probe />
        {step === "confirmation" ? (
          <ConfirmationPage />
        ) : (
          step && <BookingPage step={step} />
        )}
      </BookingProvider>
    );
    navigation.path =
      route === "immediate"
        ? "/book/review/"
        : route === "confirmation"
          ? "/confirmation/"
          : "/book/payment/";
    saveLiveDraft(draft, true, route === "immediate" ? undefined : id);
    let view = render(
      tree(
        route === "immediate"
          ? "review"
          : route === "confirmation"
            ? "confirmation"
            : "payment",
      ),
    );
    if (route === "immediate") {
      await act(async () => {});
      fireEvent.click(screen.getByText("Accept original"));
      fireEvent.click(screen.getByText("Create original"));
    } else if (route !== "status") {
      await screen.findByRole("status", { name: "Checking your reservation…" });
      fireEvent.click(screen.getByText("Foreign proof"));
      expect(screen.getByTestId("creation-attempt")).toHaveTextContent(id);
      expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
      expect(
        JSON.parse(screen.getByTestId("creation-draft").textContent!).slots,
      ).toEqual(draft.slots);
      if (route === "home" || route === "home-refresh") {
        fireEvent.click(screen.getByText("Leave uncertain booking"));
        navigation.path = "/";
        view.rerender(tree(null));
        resolved = true;
        navigation.replace.mockClear();
        navigation.path = "/book/account/";
        if (route === "home-refresh") {
          view.unmount();
          refreshed = true;
          view = render(tree("account"));
        } else view.rerender(tree("account"));
      } else if (route === "refresh") {
        view.unmount();
        resolved = true;
        refreshed = true;
        view = render(tree("payment"));
      } else {
        resolved = true;
        vi.setSystemTime(Date.now() + 5001);
        fireEvent.focus(window);
      }
    }
    await waitFor(() =>
      expect(screen.getByTestId("creation-attempt")).toHaveTextContent("none"),
    );
    await waitFor(() =>
      expect(
        JSON.parse(screen.getByTestId("creation-draft").textContent!).slots,
        route,
      ).toEqual([]),
    );
    const cleared = JSON.parse(
      screen.getByTestId("creation-draft").textContent!,
    );
    expect(cleared.slots).toEqual([]);
    expect(cleared.accepted).toBe(false);
    expect(
      JSON.parse(screen.getByTestId("creation-suppressed").textContent!),
    ).toEqual(draft.slots);
    expect(
      JSON.parse(sessionStorage.getItem("soccerbot-live-draft")!)
        .checkoutAttemptId,
    ).toBeUndefined();
    if (route === "home" || route === "home-refresh") {
      await screen.findByRole("heading", { name: "Start your booking" });
      expect(navigation.replace).not.toHaveBeenCalledWith("/book/payment/");
      expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
      expect(cleared.mode).toBeNull();
    } else {
      expect(cleared.contact).toEqual(draft.contact);
      expect(cleared.nativeServiceId).toBe(draft.nativeServiceId);
      await waitFor(() =>
        expect(navigation.replace).toHaveBeenCalledWith("/book/time/"),
      );
      navigation.path = "/book/time/";
      view.rerender(tree("time"));
      expect(await screen.findByRole("alert")).toHaveTextContent(notice);
      expect(
        document.querySelector(
          ".booking-flow-overlay, .payment-check-feedback",
        ),
      ).toBeNull();
      expect(
        screen.queryByRole("status", { name: "Checking your reservation…" }),
      ).toBeNull();
      const originalDate = await screen.findByRole("button", {
        name: dateLabel(draft.slots[0].date),
      });
      await waitFor(() => expect(originalDate).toBeEnabled());
      fireEvent.click(originalDate);
      await waitFor(() =>
        expect(service.availability).toHaveBeenCalledWith(
          expect.objectContaining({ fresh: true }),
        ),
      );
      // Warm offers for both trainers must stay hidden through a failed fresh read.
      expect(screen.queryByRole("button", { name: /12:00–12:40/ })).toBeNull();
      expect(
        JSON.parse(screen.getByTestId("creation-suppressed").textContent!),
      ).toEqual(draft.slots);
      expect(
        document.querySelector(
          ".booking-flow-overlay, .payment-check-feedback",
        ),
      ).toBeNull();
      freshAvailable = true;
      vi.setSystemTime(Date.now() + 60001);
      fireEvent.focus(window);
      await waitFor(() =>
        expect(
          JSON.parse(screen.getByTestId("creation-suppressed").textContent!),
        ).toEqual([]),
      );
      expect(
        await screen.findByRole("button", { name: /12:00–12:40/ }),
      ).toBeEnabled();
    }
    const writes = fetcher.mock.calls.filter(
      ([, options]) => options?.method === "POST",
    );
    expect(writes).toHaveLength(route === "immediate" ? 1 : 0);
    view.unmount();
  }
});

/** Expose observable handoff state without coupling the regression to private helpers. */
function ConflictHandoffProbe({
  slots = draft.slots,
}: {
  slots?: typeof draft.slots;
}) {
  const state = useBooking();
  return (
    <>
      <button onClick={() => state.update({ ...draft, slots })}>
        Seed handoff
      </button>
      <button onClick={() => void state.checkout()}>Submit handoff</button>
      <button onClick={() => state.leave()}>Leave handoff</button>
      <button
        onClick={() =>
          void state.rejectRecoveredSelection(id, {
            state: "selection_unavailable",
            rejectedSessionIndex: 0,
          })
        }
      >
        Recover handoff
      </button>
      <output data-testid="handoff-ready">{String(state.ready)}</output>
      <output data-testid="handoff-return">
        {String(state.action.returnToCalendar)}
      </output>
      <output data-testid="handoff-attempt">
        {state.attempt?.id ?? "none"}
      </output>
      <output data-testid="handoff-cart">
        {JSON.stringify(state.draft.slots)}
      </output>
      <output data-testid="handoff-notice">
        {JSON.stringify(state.selectionNoticeSlots)}
      </output>
    </>
  );
}

it("conflict handoff waits for complete classification after all or partial failed reads", async () => {
  for (const failure of ["all", "partial"] as const) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
    navigation.path = "/book/review/";
    const other = { ...draft.slots[0], date: "2026-10-21", start: "12:50" };
    let recovering = false;
    const availability = vi.fn<BookingService["availability"]>(
      async ({ date }) => {
        if (!recovering && (failure === "all" || date === other.date))
          throw new Error("Synthetic availability outage");
        return date === other.date ? [{ ...other, available: true }] : [];
      },
    );
    const checkout = vi.fn<BookingService["checkout"]>(async () => ({
      id,
      draft: { ...draft, slots: [draft.slots[0], other] },
      status: "ready",
      outcome: "pending",
      checkUntil: 0,
      booking: null,
    }));
    const pay = vi.fn<BookingService["pay"]>(async () => {
      throw new BookingServiceError(
        "selection_unavailable",
        "Synthetic conflict",
      );
    });
    render(
      <BookingProvider
        bookingService={{
          ...liveBookingService,
          restore: undefined,
          calendar: undefined,
          publicCalendar: undefined,
          checkout,
          pay,
          availability,
        }}
      >
        <ConflictHandoffProbe slots={[draft.slots[0], other]} />
      </BookingProvider>,
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Seed handoff"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Submit handoff"));
    });
    expect(availability).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
    expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
      [draft.slots[0], other],
    );
    recovering = true;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_999);
    });
    expect(availability).toHaveBeenCalledTimes(2);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByTestId("handoff-return")).toHaveTextContent("true");
    expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
      [other],
    );
    expect(
      JSON.parse(screen.getByTestId("handoff-notice").textContent!),
    ).toEqual([{ date: draft.slots[0].date, start: draft.slots[0].start }]);
    expect(checkout).toHaveBeenCalledTimes(1);
    expect(pay).toHaveBeenCalledTimes(1);
    cleanup();
    sessionStorage.clear();
    vi.useRealTimers();
  }
});

it("conflict handoff aborts stalled reads and paces recovery without replaying checkout", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  navigation.path = "/book/review/";
  let staleFinish!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  let firstSignal: AbortSignal | undefined;
  const availability = vi
    .fn<BookingService["availability"]>(async () => [])
    .mockImplementationOnce(({ signal }) => {
      firstSignal = signal;
      return new Promise((resolve) => {
        staleFinish = resolve;
      });
    });
  const checkout = vi.fn<BookingService["checkout"]>(async () => ({
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  }));
  const pay = vi.fn<BookingService["pay"]>(async () => {
    throw new BookingServiceError(
      "selection_unavailable",
      "Synthetic conflict",
    );
  });
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
        checkout,
        pay,
        availability,
      }}
    >
      <ConflictHandoffProbe />
    </BookingProvider>,
  );
  await act(async () => {
    fireEvent.click(screen.getByText("Seed handoff"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Submit handoff"));
  });
  expect(availability).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(29_999);
  });
  expect(firstSignal?.aborted).toBe(false);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(firstSignal?.aborted).toBe(true);
  expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
  await act(async () => {
    staleFinish([{ ...draft.slots[0], available: true }]);
  });
  expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(29_999);
  });
  expect(availability).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(availability).toHaveBeenCalledTimes(2);
  expect(screen.getByTestId("handoff-return")).toHaveTextContent("true");
  expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
    [],
  );
  expect(JSON.parse(screen.getByTestId("handoff-notice").textContent!)).toEqual(
    [{ date: draft.slots[0].date, start: draft.slots[0].start }],
  );
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(pay).toHaveBeenCalledTimes(1);
  // A healthy read just above ten seconds matches the captured provider latency;
  // it must finish normally instead of being discarded by the protected-read deadline.
  cleanup();
  sessionStorage.clear();
  let slowFinish!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  let slowSignal: AbortSignal | undefined;
  const slowAvailability = vi.fn<BookingService["availability"]>(
    ({ signal: readSignal }) => {
      slowSignal = readSignal;
      return new Promise((resolve) => {
        slowFinish = resolve;
      });
    },
  );
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
        checkout,
        pay,
        availability: slowAvailability,
      }}
    >
      <ConflictHandoffProbe />
    </BookingProvider>,
  );
  await act(async () => {
    fireEvent.click(screen.getByText("Seed handoff"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Submit handoff"));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(11_000);
  });
  expect(slowSignal?.aborted).toBe(false);
  await act(async () => slowFinish([]));
  expect(screen.getByTestId("handoff-return")).toHaveTextContent("true");
  expect(slowAvailability).toHaveBeenCalledTimes(1);
  expect(checkout).toHaveBeenCalledTimes(2);
  expect(pay).toHaveBeenCalledTimes(2);
});

it("refresh during conflict classification retains its original indexed snapshot without adopting another checkout", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  navigation.path = "/book/review/";
  const other = { ...draft.slots[0], start: "12:50" };
  const original = { ...draft, slots: [draft.slots[0], other] };
  const foreignId = "00000000-0000-4000-8000-000000000099";
  let refreshed = false;
  let firstFinish!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  let refreshFinish!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  let finishContext!: (response: Response) => void;
  const fetch = vi.fn<typeof globalThis.fetch>(
    () =>
      new Promise((resolve) => {
        finishContext = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const availability = vi.fn<BookingService["availability"]>(
    () =>
      new Promise((resolve) => {
        if (refreshed) refreshFinish = resolve;
        else firstFinish = resolve;
      }),
  );
  const checkout = vi.fn<BookingService["checkout"]>(async () => ({
    id,
    draft: original,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  }));
  const pay = vi.fn<BookingService["pay"]>(async () => {
    throw new BookingServiceError(
      "selection_unavailable",
      "Synthetic indexed conflict",
      1,
    );
  });
  const restore = vi.fn<NonNullable<BookingService["restore"]>>(async () =>
    refreshed
      ? {
          id: foreignId,
          draft: original,
          status: "checking",
          outcome: "pending",
          checkUntil: 0,
          booking: null,
        }
      : null,
  );
  const service: BookingService = {
    ...liveBookingService,
    calendar: undefined,
    publicCalendar: undefined,
    restore,
    checkout,
    pay,
    availability,
  };
  const identity = { ...demoCustomerIdentity, mode: "live" as const };
  const tree = () => (
    <BookingProvider bookingService={service} identityService={identity}>
      <ConflictHandoffProbe slots={original.slots} />
    </BookingProvider>
  );
  const view = render(tree());
  await act(async () => {});
  await act(async () => {
    fireEvent.click(screen.getByText("Seed handoff"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Submit handoff"));
  });
  expect(availability).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
  view.unmount();
  refreshed = true;
  render(tree());
  await act(async () => {});
  expect(screen.getByTestId("handoff-ready")).toHaveTextContent("false");
  expect(screen.getByTestId("handoff-attempt")).not.toHaveTextContent(
    foreignId,
  );
  expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(String(fetch.mock.calls[0][0])).toContain(
    `/api/attempts/${id}/checkout`,
  );
  await act(async () =>
    finishContext(
      Response.json({
        attemptId: id,
        mode: "live",
        checkout: { state: "unavailable" },
        selectionRejection: {
          state: "selection_unavailable",
          rejectedSessionIndex: 1,
        },
        summary: {
          players: 1,
          totalMinor: 17600,
          currency: "SGD",
          sessions: original.slots.map((slot) => ({
            startMs: Date.parse(`${slot.date}T${slot.start}:00+08:00`),
            players: 1,
          })),
        },
        checking: {
          deadlineMs: Date.now() + 600000,
          nextCheckMs: 0,
          pollAfterMs: 5000,
        },
      }),
    ),
  );
  expect(screen.getByTestId("handoff-ready")).toHaveTextContent("false");
  expect(availability).toHaveBeenCalledTimes(2);
  await act(async () => firstFinish([]));
  expect(screen.getByTestId("handoff-ready")).toHaveTextContent("false");
  await act(async () =>
    refreshFinish([
      { ...draft.slots[0], available: true },
      { ...other, available: true },
    ]),
  );
  expect(screen.getByTestId("handoff-return")).toHaveTextContent("true");
  expect(screen.getByTestId("handoff-ready")).toHaveTextContent("true");
  expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
    draft.slots,
  );
  expect(JSON.parse(screen.getByTestId("handoff-notice").textContent!)).toEqual(
    [{ date: other.date, start: other.start }],
  );
  expect(screen.getByTestId("handoff-attempt")).toHaveTextContent("none");
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(pay).toHaveBeenCalledTimes(1);
  expect(
    fetch.mock.calls.some(([path]) => String(path).includes(foreignId)),
  ).toBe(false);
});

it("leaving pending conflict classification prevents late reads from changing a fresh draft or navigation", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  navigation.path = "/book/review/";
  let finish!: (
    slots: Awaited<ReturnType<BookingService["availability"]>>,
  ) => void;
  let signal: AbortSignal | undefined;
  const availability = vi.fn<BookingService["availability"]>((input) => {
    signal = input.signal;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const checkout = vi.fn<BookingService["checkout"]>(async () => ({
    id,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  }));
  const pay = vi.fn<BookingService["pay"]>(async () => {
    throw new BookingServiceError(
      "selection_unavailable",
      "Synthetic conflict",
    );
  });
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
        checkout,
        pay,
        availability,
      }}
    >
      <ConflictHandoffProbe />
    </BookingProvider>,
  );
  await act(async () => {
    fireEvent.click(screen.getByText("Seed handoff"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Submit handoff"));
  });
  expect(availability).toHaveBeenCalledTimes(1);
  await act(async () => {
    fireEvent.click(screen.getByText("Leave handoff"));
  });
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    fireEvent.click(screen.getByText("Seed handoff"));
  });
  await act(async () => {
    finish([]);
    await vi.advanceTimersByTimeAsync(40_000);
  });
  expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
    draft.slots,
  );
  expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
  expect(JSON.parse(screen.getByTestId("handoff-notice").textContent!)).toEqual(
    [],
  );
  expect(availability).toHaveBeenCalledTimes(1);
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(pay).toHaveBeenCalledTimes(1);
  // A direct Home load is not a path-change event. Its saved display recovery
  // must still be dismissed without following the customer away from Home.
  cleanup();
  sessionStorage.clear();
  navigation.path = "/";
  saveLiveDraft(draft, false, id);
  savePendingConflict({ attemptId: id, draft, rejectedSessionIndex: 0 });
  const homeAvailability = vi.fn<BookingService["availability"]>(
    async () => [],
  );
  const homeFetch = vi.fn<typeof globalThis.fetch>(
    async () => new Response(null, { status: 503 }),
  );
  vi.stubGlobal("fetch", homeFetch);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
        availability: homeAvailability,
      }}
    >
      <ConflictHandoffProbe />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(homeFetch).not.toHaveBeenCalled();
  expect(homeAvailability).not.toHaveBeenCalled();
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("soccerbot-pending-conflict")).toBeNull();
  expect(
    JSON.parse(sessionStorage.getItem("soccerbot-live-draft")!)
      .checkoutAttemptId,
  ).toBe(id);
});

it("completed conflict classification preserves all available selections without inventing affected sessions", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  navigation.path = "/book/review/";
  const availability = vi.fn<BookingService["availability"]>(async () => [
    { ...draft.slots[0], available: true },
  ]);
  const checkout = vi.fn<BookingService["checkout"]>(async () => {
    throw new BookingServiceError(
      "checkout_window_blocked",
      "Synthetic transient window rejection",
    );
  });
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        restore: undefined,
        calendar: undefined,
        publicCalendar: undefined,
        checkout,
        availability,
      }}
    >
      <ConflictHandoffProbe />
    </BookingProvider>,
  );
  await act(async () => {
    fireEvent.click(screen.getByText("Seed handoff"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Submit handoff"));
  });
  expect(screen.getByTestId("handoff-return")).toHaveTextContent("true");
  expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
    draft.slots,
  );
  expect(JSON.parse(screen.getByTestId("handoff-notice").textContent!)).toEqual(
    [],
  );
  expect(availability).toHaveBeenCalledTimes(1);
  expect(checkout).toHaveBeenCalledTimes(1);
});

it("payment and confirmation consumers retain one classifier until the complete calendar handoff", async () => {
  for (const route of ["payment", "confirmation"] as const) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
    navigation.path = route === "payment" ? "/book/payment/" : "/confirmation/";
    saveLiveDraft(draft, true, id);
    const restore = vi.fn<NonNullable<BookingService["restore"]>>(async () => ({
      id,
      draft,
      status: "checking",
      outcome: "pending",
      checkUntil: Date.now() + 600000,
      booking: null,
    }));
    let finish!: (
      slots: Awaited<ReturnType<BookingService["availability"]>>,
    ) => void;
    let signal: AbortSignal | undefined;
    const availability = vi.fn<BookingService["availability"]>((input) => {
      signal = input.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    const fetch = vi.fn<typeof globalThis.fetch>(async (path) =>
      String(path).endsWith("/checkout")
        ? Response.json({
            attemptId: id,
            mode: "live",
            checkout: { state: "unavailable" },
            selectionRejection: {
              state: "selection_unavailable",
              rejectedSessionIndex: 0,
            },
            summary: {
              players: 1,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [
                {
                  startMs: Date.parse("2026-10-20T12:00:00+08:00"),
                  players: 1,
                },
              ],
            },
            checking: {
              deadlineMs: Date.now() + 600000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          })
        : Response.json({
            status: "invalid",
            reason: "checkout_selection_rejected",
            selectionRejection: {
              state: "selection_unavailable",
              rejectedSessionIndex: 0,
            },
          }),
    );
    vi.stubGlobal("fetch", fetch);
    const service: BookingService = {
      ...liveBookingService,
      restore,
      availability,
      calendar: undefined,
      publicCalendar: undefined,
    };
    const identity = { ...demoCustomerIdentity, mode: "live" as const };
    render(
      <BookingProvider bookingService={service} identityService={identity}>
        <ConflictHandoffProbe />
        {route === "payment" ? (
          <BookingPage step="payment" />
        ) : (
          <ConfirmationPage />
        )}
      </BookingProvider>,
    );
    await act(async () => {});
    expect(availability).toHaveBeenCalledTimes(1);
    expect(signal?.aborted).toBe(false);
    if (route === "confirmation") {
      await act(async () => {
        fireEvent.click(screen.getByText("Recover handoff"));
      });
      expect(availability).toHaveBeenCalledTimes(1);
      expect(signal?.aborted).toBe(false);
    }
    expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
    expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
    await act(async () => finish([]));
    expect(screen.getByTestId("handoff-return")).toHaveTextContent("true");
    expect(navigation.replace).toHaveBeenCalledWith("/book/time/");
    expect(
      JSON.parse(screen.getByTestId("handoff-notice").textContent!),
    ).toEqual([{ date: "2026-10-20", start: "12:00" }]);
    expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
      [],
    );
    expect(availability).toHaveBeenCalledTimes(1);
    expect(
      fetch.mock.calls.every(
        ([, options]) => !options?.method || options.method === "GET",
      ),
    ).toBe(true);
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    navigation.replace.mockReset();
    vi.useRealTimers();
  }
});

it("refresh after a lost rejection response stays unready until protected evidence and classification finish", async () => {
  for (const pendingSnapshot of [false, true]) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
    navigation.path = "/book/time/";
    saveLiveDraft(draft, true, id);
    if (pendingSnapshot)
      savePendingConflict({ attemptId: id, draft, rejectedSessionIndex: 0 });
    let finishContext!: (response: Response) => void;
    let finishAvailability!: (
      slots: Awaited<ReturnType<BookingService["availability"]>>,
    ) => void;
    const fetch = vi.fn<typeof globalThis.fetch>(
      () =>
        new Promise((resolve) => {
          finishContext = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetch);
    const availability = vi.fn<BookingService["availability"]>(
      () =>
        new Promise((resolve) => {
          finishAvailability = resolve;
        }),
    );
    const restore = vi.fn<NonNullable<BookingService["restore"]>>(() =>
      pendingSnapshot ? new Promise(() => {}) : Promise.resolve(null),
    );
    render(
      <BookingProvider
        bookingService={{
          ...liveBookingService,
          restore,
          availability,
          calendar: undefined,
          publicCalendar: undefined,
        }}
        identityService={{ ...demoCustomerIdentity, mode: "live" }}
      >
        <ConflictHandoffProbe />
      </BookingProvider>,
    );
    await act(async () => {});
    if (pendingSnapshot) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(9_999);
      });
      expect(fetch).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
    }
    expect(screen.getByTestId("handoff-ready")).toHaveTextContent("false");
    expect(availability).not.toHaveBeenCalled();
    await act(async () =>
      finishContext(
        Response.json({
          attemptId: id,
          mode: "live",
          checkout: { state: "unavailable" },
          selectionRejection: {
            state: "selection_unavailable",
            rejectedSessionIndex: 0,
          },
          summary: {
            players: 1,
            totalMinor: 8800,
            currency: "SGD",
            sessions: [
              { startMs: Date.parse("2026-10-20T12:00:00+08:00"), players: 1 },
            ],
          },
          checking: {
            deadlineMs: Date.now() + 600000,
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        }),
      ),
    );
    expect(screen.getByTestId("handoff-ready")).toHaveTextContent("false");
    expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
    await act(async () => finishAvailability([]));
    expect(screen.getByTestId("handoff-ready")).toHaveTextContent("true");
    expect(screen.getByTestId("handoff-return")).toHaveTextContent("true");
    expect(
      JSON.parse(screen.getByTestId("handoff-notice").textContent!),
    ).toEqual([{ date: "2026-10-20", start: "12:00" }]);
    expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
      [],
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(availability).toHaveBeenCalledTimes(1);
    cleanup();
    sessionStorage.clear();
    vi.useRealTimers();
  }
});

it("stale pending conflict proof routes only its original protected attempt on denied or changed authority", async () => {
  for (const proof of ["held", "denied"] as const) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
    navigation.path = "/book/time/";
    const foreignId = "00000000-0000-4000-8000-000000000099";
    saveLiveDraft(draft, false, id);
    savePendingConflict({ attemptId: id, draft, rejectedSessionIndex: 0 });
    const restored: Attempt = {
      id: proof === "held" ? id : foreignId,
      draft,
      status: "ready",
      held: true,
      outcome: "pending",
      checkUntil: 0,
      booking: null,
    };
    const restore = vi.fn<NonNullable<BookingService["restore"]>>(
      async () => restored,
    );
    const availability = vi.fn<BookingService["availability"]>(async () => []);
    const fetch = vi.fn<typeof globalThis.fetch>(async () =>
      proof === "denied"
        ? new Response(null, { status: 403 })
        : Response.json({
            attemptId: id,
            mode: "live",
            checkout: { state: "unavailable" },
            summary: {
              players: 1,
              totalMinor: 8800,
              currency: "SGD",
              sessions: [
                {
                  startMs: Date.parse("2026-10-20T12:00:00+08:00"),
                  players: 1,
                },
              ],
            },
            checking: {
              deadlineMs: Date.now() + 600000,
              nextCheckMs: 0,
              pollAfterMs: 5000,
            },
          }),
    );
    vi.stubGlobal("fetch", fetch);
    const service: BookingService = {
      ...liveBookingService,
      restore,
      availability,
      calendar: undefined,
      publicCalendar: undefined,
    };
    const identity = { ...demoCustomerIdentity, mode: "live" as const };
    const tree = () => (
      <BookingProvider bookingService={service} identityService={identity}>
        <ConflictHandoffProbe />
      </BookingProvider>
    );
    const view = render(tree());
    await act(async () => {});
    expect(navigation.replace).toHaveBeenCalledWith(
      `/confirmation/?attempt=${id}`,
    );
    expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
    expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(
      proof === "held" ? id : "none",
    );
    expect(screen.getByTestId("handoff-attempt")).not.toHaveTextContent(
      foreignId,
    );
    expect(availability).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0][0])).toContain(
      `/api/attempts/${id}/checkout`,
    );
    navigation.path = "/confirmation/";
    view.rerender(tree());
    await act(async () => {});
    navigation.path = "/book/time/";
    view.rerender(tree());
    await act(async () => {});
    expect(screen.getByTestId("handoff-ready")).toHaveTextContent("true");
    expect(availability).not.toHaveBeenCalled();
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    navigation.replace.mockReset();
    vi.useRealTimers();
  }
});

it("access denial during conflict classification stops recovery and keeps the original cart without calendar navigation", async () => {
  for (const route of ["payment", "confirmation"] as const) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
    navigation.path = route === "payment" ? "/book/payment/" : "/confirmation/";
    saveLiveDraft(draft, true, id);
    const restore = vi.fn<NonNullable<BookingService["restore"]>>(async () => ({
      id,
      draft,
      status: "checking",
      outcome: "pending",
      checkUntil: Date.now() + 600000,
      booking: null,
    }));
    let finishAvailability!: (
      slots: Awaited<ReturnType<BookingService["availability"]>>,
    ) => void;
    let finishStatus!: (response: Response) => void;
    let availabilitySignal: AbortSignal | undefined;
    const availability = vi.fn<BookingService["availability"]>(({ signal }) => {
      availabilitySignal = signal;
      return new Promise((resolve) => {
        finishAvailability = resolve;
      });
    });
    const fetch = vi.fn<typeof globalThis.fetch>((path) =>
      String(path).endsWith("/checkout")
        ? Promise.resolve(
            Response.json({
              attemptId: id,
              mode: "live",
              checkout: { state: "unavailable" },
              selectionRejection: {
                state: "selection_unavailable",
                rejectedSessionIndex: 0,
              },
              summary: {
                players: 1,
                totalMinor: 8800,
                currency: "SGD",
                sessions: [
                  {
                    startMs: Date.parse("2026-10-20T12:00:00+08:00"),
                    players: 1,
                  },
                ],
              },
              checking: {
                deadlineMs: Date.now() + 600000,
                nextCheckMs: 0,
                pollAfterMs: 5000,
              },
            }),
          )
        : new Promise((resolve) => {
            finishStatus = resolve;
          }),
    );
    vi.stubGlobal("fetch", fetch);
    const service: BookingService = {
      ...liveBookingService,
      restore,
      availability,
      calendar: undefined,
      publicCalendar: undefined,
    };
    const identity = { ...demoCustomerIdentity, mode: "live" as const };
    render(
      <BookingProvider bookingService={service} identityService={identity}>
        <ConflictHandoffProbe />
        {route === "payment" ? (
          <BookingPage step="payment" />
        ) : (
          <ConfirmationPage />
        )}
      </BookingProvider>,
    );
    await act(async () => {});
    expect(availability).toHaveBeenCalledTimes(1);
    expect(availabilitySignal?.aborted).toBe(false);
    expect(
      fetch.mock.calls.some(([path]) => String(path).endsWith("/confirmation")),
    ).toBe(true);
    await act(async () =>
      finishStatus(
        new Response(null, { status: route === "payment" ? 401 : 403 }),
      ),
    );
    expect(
      screen.getByText(
        "Contact the studio to view this booking. Don’t pay again.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText("Checking available sessions…"),
    ).not.toBeInTheDocument();
    expect(availabilitySignal?.aborted).toBe(true);
    const requestsAfterDenial = fetch.mock.calls.length;
    await act(async () => {
      finishAvailability([]);
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
      draft.slots,
    );
    expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id);
    expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
    expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
    expect(
      screen.getByText(
        "Contact the studio to view this booking. Don’t pay again.",
      ),
    ).toBeVisible();
    expect(availability).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(requestsAfterDenial);
    expect(
      fetch.mock.calls.every(
        ([, options]) => !options?.method || options.method === "GET",
      ),
    ).toBe(true);
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    navigation.replace.mockReset();
    vi.useRealTimers();
  }
});

it("completed conflict allows immediate calendar Back and Continue with retained selections across refresh", async () => {
  for (const refresh of [false, true]) {
    for (const destination of ["details", "session"] as const) {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
      navigation.path = "/book/review/";
      const retained = ["12:50", "13:40"].map((start) => ({
        ...draft.slots[0],
        start,
      }));
      const original = { ...draft, slots: [...draft.slots, ...retained] };
      saveLiveDraft(original);
      const foreign = "00000000-0000-4000-8000-000000000002";
      let refreshed = false;
      const restore = vi.fn<NonNullable<BookingService["restore"]>>(async () =>
        refreshed
          ? {
              id: foreign,
              draft: original,
              status: "checking",
              outcome: "pending",
              checkUntil: Date.now() + 600000,
              booking: null,
            }
          : null,
      );
      const checkout = vi.fn<BookingService["checkout"]>(async () => {
        throw new BookingServiceError(
          "selection_unavailable",
          "Synthetic conflict",
          0,
        );
      });
      const fetch = vi.fn<typeof globalThis.fetch>(
        async () => new Response(null, { status: 503 }),
      );
      vi.stubGlobal("fetch", fetch);
      const service = {
        ...liveBookingService,
        restore,
        checkout,
        availability: async () =>
          retained.map((slot) => ({ ...slot, available: true })),
        calendar: undefined,
        publicCalendar: undefined,
      };
      const identity = { ...demoCustomerIdentity, mode: "live" as const };
      const tree = (step: "review" | "time" | "details" | "session") => (
        <BookingProvider bookingService={service} identityService={identity}>
          <ConflictHandoffProbe slots={original.slots} />
          <BookingPage step={step} />
        </BookingProvider>
      );
      let view = render(tree("review"));
      await act(async () => {});
      await act(async () => {
        fireEvent.click(screen.getByText("Submit handoff"));
      });
      expect(navigation.replace).toHaveBeenCalledWith("/book/time/");
      navigation.path = "/book/time/";
      view.rerender(tree("time"));
      await act(async () => {});
      expect(
        JSON.parse(screen.getByTestId("handoff-cart").textContent!),
      ).toEqual(retained);
      expect(sessionStorage.getItem("soccerbot-conflict-notice")).toContain(
        "12:00",
      );
      if (refresh) {
        view.unmount();
        refreshed = true;
        view = render(tree("time"));
        await act(async () => {});
        expect(screen.getByTestId("handoff-attempt")).toHaveTextContent("none");
        expect(sessionStorage.getItem("soccerbot-conflict-notice")).toContain(
          "12:00",
        );
      }
      const link = screen.getByRole("link", {
        name: destination === "details" ? /^Enter Booking Details/ : "Back",
      });
      expect(link.getAttribute("href")).toContain(`/book/${destination}`);
      navigation.replace.mockClear();
      navigation.path = `/book/${destination}/`;
      view.rerender(tree(destination));
      await act(async () => {});
      expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
      expect(
        screen.getByRole("heading", {
          name: destination === "details" ? "Your details" : "Your session",
        }),
      ).toBeVisible();
      expect(sessionStorage.getItem("soccerbot-conflict-notice")).toBeNull();
      expect(
        JSON.parse(screen.getByTestId("handoff-cart").textContent!),
      ).toEqual(retained);
      expect(checkout).toHaveBeenCalledTimes(1);
      expect(
        fetch.mock.calls.every(
          ([, options]) => !options?.method || options.method === "GET",
        ),
      ).toBe(true);
      cleanup();
      sessionStorage.clear();
      localStorage.clear();
      navigation.replace.mockReset();
      vi.useRealTimers();
    }
  }
});

async function expectRecoveryReleaseNavigation(
  destination: "details" | "session",
  resolution: "expiry" | "not_created" | "rejected",
) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  navigation.path = "/book/time/";
  saveLiveDraft(draft, true, id);
  const replacement = { ...draft.slots[0], start: "13:40" };
  const restore = vi.fn<NonNullable<BookingService["restore"]>>(async () => ({
    id,
    draft,
    status: "checking",
    outcome: "pending",
    checkUntil: Date.now() + 600000,
    booking: null,
  }));
  const fetch = vi.fn<typeof globalThis.fetch>(
    async () => new Response(null, { status: 503 }),
  );
  vi.stubGlobal("fetch", fetch);
  const checkout = vi.fn<BookingService["checkout"]>();
  const pay = vi.fn<BookingService["pay"]>();
  let classify = false;
  let finishClassification: (() => void) | undefined;
  const service = {
    ...liveBookingService,
    restore,
    checkout,
    pay,
    availability: async () => {
      if (classify && resolution === "rejected") {
        await new Promise<void>((resolve) => {
          finishClassification = resolve;
        });
      }
      return [{ ...replacement, available: true }];
    },
    calendar: undefined,
    publicCalendar: undefined,
  };
  function ExpiryProbe() {
    const state = useBooking();
    return (
      <>
        <ConflictHandoffProbe />
        <button onClick={() => state.browseAfterChecking(id)}>
          Browse expired
        </button>
        <button onClick={() => state.update({ slots: [replacement] })}>
          Select replacement
        </button>
        <output data-testid="original-recovery-draft">
          {JSON.stringify(state.attempt?.draft)}
        </output>
        <output data-testid="replacement-players">{state.draft.players}</output>
        <button onClick={() => state.update({ players: 1 })}>
          Edit during classification
        </button>
        <button onClick={() => state.update({ players: 2 })}>
          Edit replacement players
        </button>
        <button
          onClick={() => {
            if (resolution === "not_created") state.resolveUncreatedBooking(id);
            else if (resolution === "rejected")
              void state.rejectRecoveredSelection(id, {
                state: "selection_unavailable",
                rejectedSessionIndex: 0,
              });
            else state.restartAfterExpiry(id);
          }}
        >
          Verified release
        </button>
      </>
    );
  }
  const identity = { ...demoCustomerIdentity, mode: "live" as const };
  const tree = (step: "time" | "details" | "session") => (
    <BookingProvider bookingService={service} identityService={identity}>
      <ExpiryProbe />
      <BookingPage step={step} />
    </BookingProvider>
  );
  const view = render(tree("time"));
  await act(async () => {});
  expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id);
  await act(async () => {
    fireEvent.click(screen.getByText("Browse expired"));
  });
  await act(async () => {
    fireEvent.click(screen.getByText("Select replacement"));
  });
  expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id);
  // Browsing must not authorize a duplicate reservation while payment is unresolved.
  await act(async () => {
    fireEvent.click(screen.getByText("Submit handoff"));
  });
  expect(checkout).not.toHaveBeenCalled();
  expect(pay).not.toHaveBeenCalled();
  expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id);
  if (destination === "session") {
    // Back must work even while the old payment remains unresolved.
    navigation.replace.mockClear();
    navigation.path = "/book/session/";
    view.rerender(tree("session"));
    await act(async () => {});
    expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
    expect(screen.getByRole("heading", { name: "Your session" })).toBeVisible();
    expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id);
    await act(async () => {
      fireEvent.click(screen.getByText("Edit replacement players"));
    });
    expect(
      JSON.parse(screen.getByTestId("original-recovery-draft").textContent!),
    ).toEqual(draft);
  }
  classify = true;
  await act(async () => {
    fireEvent.click(screen.getByText("Verified release"));
  });
  if (resolution === "rejected") {
    expect(finishClassification).toBeDefined();
    expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id);
    await act(async () => {
      fireEvent.click(screen.getByText("Edit during classification"));
    });
    expect(screen.getByTestId("replacement-players")).toHaveTextContent("1");
    await act(async () => {
      finishClassification!();
    });
    expect(sessionStorage.getItem("soccerbot-pending-conflict")).toBeNull();
    expect(screen.getByTestId("replacement-players")).toHaveTextContent("1");
  }
  if (destination === "session") {
    // A background release after departure must not revive the calendar notice.
    expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
    expect(screen.getByRole("heading", { name: "Your session" })).toBeVisible();
    expect(sessionStorage.getItem("soccerbot-conflict-notice")).toBeNull();
  }
  expect(screen.getByTestId("handoff-attempt"), resolution).toHaveTextContent(
    "none",
  );
  expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual([
    replacement,
  ]);
  navigation.replace.mockClear();
  navigation.path = `/book/${destination}/`;
  view.rerender(tree(destination));
  await act(async () => {});
  expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
  expect(
    screen.getByRole("heading", {
      name: destination === "details" ? "Your details" : "Your session",
    }),
  ).toBeVisible();
  if (destination === "session") {
    navigation.path = "/book/details/";
    view.rerender(tree("details"));
    await act(async () => {});
    expect(screen.getByRole("heading", { name: "Your details" })).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalledWith("/book/time/");
  }
  expect(checkout).not.toHaveBeenCalled();
  expect(pay).not.toHaveBeenCalled();
  expect(
    fetch.mock.calls.every(
      ([, options]) => !options?.method || options.method === "GET",
    ),
  ).toBe(true);
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
  navigation.replace.mockReset();
  vi.useRealTimers();
}

it("expiry release permits Continue with replacement selections without replaying payment", async () => {
  await expectRecoveryReleaseNavigation("details", "expiry");
});

it("expiry release permits Back with replacement selections without replaying payment", async () => {
  await expectRecoveryReleaseNavigation("session", "expiry");
});

it("verified no-creation permits Back with replacement selections without replaying payment", async () => {
  await expectRecoveryReleaseNavigation("session", "not_created");
});

it("verified rejection permits Back and edits during classification without replaying payment", async () => {
  await expectRecoveryReleaseNavigation("session", "rejected");
});

it("authenticated predispatch conflict proof survives cooldown and refresh without adopting another checkout", async () => {
  for (const route of [
    "immediate",
    "reload",
    "retry-proof",
    "stale-proof",
    "generic",
  ] as const) {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
    vi.spyOn(crypto, "randomUUID").mockReturnValue(id);
    sessionStorage.clear();
    localStorage.clear();
    navigation.path = "/book/review/";
    const slots = [
      draft.slots[0],
      { ...draft.slots[0], date: "2026-10-21" },
      { ...draft.slots[0], date: "2026-10-22" },
    ];
    const original = { ...draft, slots };
    const foreignId = "00000000-0000-4000-8000-000000000099";
    let refreshed = false;
    let proofUnavailable = route === "retry-proof";
    let delayProof = route === "stale-proof";
    let releaseProof!: () => void;
    const rejection = {
      state: "selection_unavailable",
      rejectedSessionIndices: [0, 2],
    };
    const fetcher = vi.fn<typeof globalThis.fetch>(async (input) => {
      const path = String(input);
      if (path === "/api/booking/current")
        return Response.json(
          refreshed
            ? {
                state: "checking",
                attemptId: foreignId,
                contact: draft.contact,
                sessions: [
                  {
                    ...slots[0].native,
                    instructorId: slots[0].instructor,
                    startMs: Date.parse(`${slots[0].date}T12:00:00+08:00`),
                    players: 1,
                  },
                ],
              }
            : { state: "empty" },
        );
      if (path === `/api/booking/checkout/${id}`)
        return Response.json(
          route === "immediate"
            ? {
                error: "checkout_selection_unavailable",
                selectionRejection: rejection,
              }
            : { error: "checkout_window_unresolved" },
          { status: 503 },
        );
      if (path === `/api/attempts/${id}/checkout` && delayProof)
        await new Promise<void>((resolve) => {
          releaseProof = resolve;
        });
      if (path === `/api/attempts/${id}/checkout` && proofUnavailable)
        return Response.json(
          { error: "temporarily_unavailable" },
          { status: 503 },
        );
      if (path === `/api/attempts/${id}/checkout`)
        return Response.json({
          attemptId: id,
          mode: "live",
          checkout: { state: "unavailable" },
          selectionRejection:
            route === "generic" ? { state: "restart_required" } : rejection,
          summary: {
            players: 1,
            totalMinor: 26400,
            currency: "SGD",
            sessions: slots.map((slot) => ({
              startMs: Date.parse(`${slot.date}T12:00:00+08:00`),
              players: 1,
            })),
          },
          checking: {
            deadlineMs: Date.now() + 600000,
            nextCheckMs: 0,
            pollAfterMs: 5000,
          },
        });
      if (path.startsWith("/api/booking/availability/")) {
        if (!refreshed || route !== "generic")
          return Response.json({ error: "cooldown" }, { status: 503 });
        const date = path.split("/").at(-1)!.split("?")[0];
        const slot = slots.find((slot) => slot.date === date)!;
        return Response.json({
          date,
          observedAtMs: Date.now(),
          offers:
            date === slots[0].date
              ? []
              : [
                  {
                    ...slot.native,
                    instructorId: slot.instructor,
                    startMs: Date.parse(`${date}T12:00:00+08:00`),
                  },
                ],
        });
      }
      throw new Error(`Unexpected conflict fixture request ${path}`);
    });
    vi.stubGlobal("fetch", fetcher);
    const service = {
      ...liveBookingService,
      calendar: undefined,
      publicCalendar: undefined,
    };
    const identity = { ...demoCustomerIdentity, mode: "live" as const };
    const tree = () => (
      <BookingProvider bookingService={service} identityService={identity}>
        <ConflictHandoffProbe slots={slots} />
      </BookingProvider>
    );
    saveLiveDraft(original);
    const view = render(tree());
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByText("Seed handoff"));
    });
    await act(async () => {
      fireEvent.click(screen.getByText("Submit handoff"));
    });
    if (route !== "immediate") {
      expect(screen.getByTestId("handoff-return")).not.toHaveTextContent(
        "true",
      );
      expect(
        fetcher.mock.calls.filter(([path]) =>
          String(path).startsWith("/api/booking/availability/"),
        ),
      ).toHaveLength(3);
      // A local index is display-only and must not override authenticated proof.
      savePendingConflict({
        attemptId: id,
        draft: original,
        rejectedSessionIndex: 1,
      });
      view.unmount();
      refreshed = true;
      const recovered = render(tree());
      await act(async () => {});
      if (route === "stale-proof") {
        // A successful old response cannot reinterpret a snapshot changed while it was in flight.
        savePendingConflict({
          attemptId: id,
          draft: { ...original, slots: [slots[1]] },
        });
        await act(async () => releaseProof());
        expect(screen.getByTestId("handoff-return")).not.toHaveTextContent(
          "true",
        );
        expect(
          JSON.parse(screen.getByTestId("handoff-cart").textContent!),
        ).toEqual(slots);
        expect(
          JSON.parse(sessionStorage.getItem("soccerbot-pending-conflict")!)
            .draft.slots,
        ).toEqual([slots[1]]);
        recovered.unmount();
        delayProof = false;
        savePendingConflict({ attemptId: id, draft: original });
        render(tree());
        await act(async () => {});
      }
      if (route === "retry-proof") {
        expect(screen.getByTestId("handoff-return")).not.toHaveTextContent(
          "true",
        );
        expect(
          JSON.parse(screen.getByTestId("handoff-cart").textContent!),
        ).toEqual(slots);
        expect(
          sessionStorage.getItem("soccerbot-pending-conflict"),
        ).not.toBeNull();
        expect(screen.getByTestId("handoff-attempt")).toHaveTextContent("none");
        recovered.unmount();
        proofUnavailable = false;
        render(tree());
        await act(async () => {});
      }
    }
    await waitFor(() =>
      expect(screen.getByTestId("handoff-return")).toHaveTextContent("true"),
    );
    const affected = route === "generic" ? [slots[0]] : [slots[0], slots[2]];
    const retained = route === "generic" ? [slots[1], slots[2]] : [slots[1]];
    expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
      retained,
    );
    expect(
      JSON.parse(screen.getByTestId("handoff-notice").textContent!),
    ).toEqual(affected.map(({ date, start }) => ({ date, start })));
    expect(screen.getByTestId("handoff-attempt")).toHaveTextContent("none");
    expect(screen.getByTestId("handoff-ready")).toHaveTextContent("true");
    expect(
      fetcher.mock.calls.filter(([, options]) => options?.method === "POST"),
    ).toHaveLength(1);
    expect(
      fetcher.mock.calls.some(([path]) => String(path).includes(foreignId)),
    ).toBe(false);
    expect(sessionStorage.getItem("soccerbot-pending-conflict")).toBeNull();
    if (route === "immediate")
      expect(
        fetcher.mock.calls.some(([path]) =>
          String(path).startsWith("/api/booking/availability/"),
        ),
      ).toBe(false);
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  }
});

it("missing predispatch proof cannot classify a pending conflict or adopt a foreign checkout", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  sessionStorage.clear();
  localStorage.clear();
  navigation.path = "/book/review/";
  saveLiveDraft(draft, false, id);
  savePendingConflict({ attemptId: id, draft, rejectedSessionIndex: 0 });
  const foreignId = "00000000-0000-4000-8000-000000000099";
  const fetcher = vi.fn<typeof globalThis.fetch>(async (input) => {
    const path = String(input);
    if (path === "/api/booking/current")
      return Response.json({
        state: "checking",
        attemptId: foreignId,
        contact: draft.contact,
        sessions: [
          {
            ...draft.slots[0].native,
            instructorId: draft.slots[0].instructor,
            startMs: Date.parse("2026-10-20T12:00:00+08:00"),
            players: 1,
          },
        ],
      });
    if (path === `/api/attempts/${id}/checkout`)
      return Response.json({ error: "attempt_unavailable" }, { status: 404 });
    throw new Error(`Unexpected unproven-conflict request ${path}`);
  });
  vi.stubGlobal("fetch", fetcher);
  render(
    <BookingProvider
      bookingService={{
        ...liveBookingService,
        calendar: undefined,
        publicCalendar: undefined,
      }}
      identityService={{ ...demoCustomerIdentity, mode: "live" }}
    >
      <ConflictHandoffProbe />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual([
    "/api/booking/current",
    `/api/attempts/${id}/checkout`,
  ]);
  expect(screen.getByTestId("handoff-ready")).toHaveTextContent("false");
  expect(screen.getByTestId("handoff-attempt")).toHaveTextContent("none");
  expect(screen.getByTestId("handoff-return")).not.toHaveTextContent("true");
  expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
    draft.slots,
  );
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(sessionStorage.getItem("soccerbot-pending-conflict")).not.toBeNull();
});

it("expired held Review with unresolved release returns affected sessions in the first calendar notice", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T00:00:00Z"));
  sessionStorage.clear();
  localStorage.clear();
  navigation.path = "/book/review/";
  saveLiveDraft(draft, true, id);
  const requests: Array<{ path: string; method: string }> = [];
  const fetcher = vi.fn<typeof globalThis.fetch>(async (input, options) => {
    const path = String(input);
    requests.push({ path, method: options?.method ?? "GET" });
    if (path === "/api/booking/current")
      return Response.json({
        state: "held",
        attemptId: id,
        contact: draft.contact,
        sessions: [
          {
            ...draft.slots[0].native,
            instructorId: draft.slots[0].instructor,
            startMs: Date.parse("2026-10-20T12:00:00+08:00"),
            players: 1,
          },
        ],
      });
    if (path === `/api/booking/hitpay/${id}`)
      return Response.json({ error: "hitpay_hold_expired" }, { status: 409 });
    if (path === `/api/attempts/${id}/expire`)
      return Response.json({ error: "payment_unresolved" }, { status: 409 });
    if (path.endsWith("/checkout"))
      return Response.json({
        attemptId: id,
        mode: "live",
        checkout: { state: "unavailable" },
        summary: {
          players: 1,
          totalMinor: 8800,
          currency: "SGD",
          sessions: [
            { startMs: Date.parse("2026-10-20T12:00:00+08:00"), players: 1 },
          ],
        },
        checking: {
          paymentExpiresAtMs: Date.now() - 1,
          deadlineMs: Date.now() + 300000,
          nextCheckMs: 0,
          pollAfterMs: 5000,
        },
      });
    if (path.endsWith("/confirmation"))
      return Response.json({
        status: "pending",
        reason: "payment_verification_pending",
      });
    return new Response(null, { status: 503 });
  });
  vi.stubGlobal("fetch", fetcher);
  const service = {
    ...liveBookingService,
    calendar: undefined,
    publicCalendar: undefined,
    availability: async () => [],
  };
  const identity = { ...demoCustomerIdentity, mode: "live" as const };
  const tree = (step: "review" | "time") => (
    <BookingProvider bookingService={service} identityService={identity}>
      <BookingPage step={step} />
      <ConflictHandoffProbe />
    </BookingProvider>
  );
  const view = render(tree("review"));
  await waitFor(() =>
    expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id),
  );
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: /^Proceed to Payment/ }));
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith("/book/time/"),
  );
  navigation.path = "/book/time/";
  view.rerender(tree("time"));
  const notice = await screen.findByRole("alert");
  expect(notice).toHaveTextContent(PAYMENT_WINDOW_ENDED);
  expect(within(notice).getByRole("listitem")).toHaveTextContent(
    "Tue, 20 Oct 2026, 12:00–12:40.",
  );
  expect(screen.getByTestId("handoff-attempt")).toHaveTextContent(id);
  expect(JSON.parse(screen.getByTestId("handoff-cart").textContent!)).toEqual(
    [],
  );
  expect(requests.filter((r) => r.method === "POST")).toEqual([
    { path: `/api/booking/hitpay/${id}`, method: "POST" },
    { path: `/api/attempts/${id}/expire`, method: "POST" },
  ]);
});
