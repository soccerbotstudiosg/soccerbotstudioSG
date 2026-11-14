vi.mock("@/services/email-domain", () => ({
  checkEmailDomain: vi.fn(async () => "valid"),
}));
import { useEffect } from "react";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
vi.mock("./email-bot-proof", async (original) => ({
  ...(await original<typeof import("./email-bot-proof")>()),
  CheckoutBotProof: function SyntheticCheckoutProof({
    onToken,
  }: {
    onToken: (token: string) => void;
  }) {
    useEffect(() => {
      onToken("synthetic-checkout-proof");
    }, [onToken]);
    return <button onClick={() => onToken("")}>Expire checkout proof</button>;
  },
}));
import { useBookingAvailability } from "./availability";
import { useCalendarAvailability } from "./calendar-availability";
import { demoBookingService } from "@/services/demo/booking";
import { BookingServiceError } from "@/services/contracts";
import type {
  BookingService,
  CalendarAvailability,
} from "@/services/contracts";
import { BookingProvider, useBooking } from "./provider";
import { DetailsStep } from "./details-step";
import { TimeStep } from "./time-step";
import { loadLiveDraft } from "@/services/storage";
import { BasketContinue, Summary, SessionSummaryHeading } from "./summary";
import { BookingPage } from "./booking-page";
import { SessionStep } from "./session-step";
import { dateLabel } from "@/domain/dates";
const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/book/time/",
  useRouter: () => ({ push, replace }),
}));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  push.mockClear();
  replace.mockClear();
});

test("live booking selection does not initialize an unrelated provider session", async () => {
  const { container } = render(
    <BookingProvider bookingService={{ ...demoBookingService, mode: "live" }}>
      <Seed />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Choose test session" }));
  await act(async () => {});
  expect(container.querySelector("iframe")).toBeNull();
});

function CalendarProbe({
  service,
  now,
}: {
  service: BookingService;
  now: number;
}) {
  const calendar = useCalendarAvailability(
    service,
    "12",
    "2027-01",
    "guest",
    false,
  );
  return (
    <output data-retained={calendar.hasLoaded("2027-01")}>
      {calendar
        .entry("2027-01", now)
        ?.dates.map((d) => d.date)
        .join(",") ?? "loading"}
    </output>
  );
}
test("calendar loads only the displayed month and discards an old scope reply", async () => {
  vi.spyOn(Date, "now").mockReturnValue(Date.parse("2027-01-01T00:00:00Z"));
  let finish!: (value: CalendarAvailability) => void;
  const first = {
    ...demoBookingService,
    calendar: vi.fn(
      () =>
        new Promise<CalendarAvailability>((resolve) => {
          finish = resolve;
        }),
    ),
  };
  const next = {
    ...demoBookingService,
    calendar: vi.fn(async ({ month }: { month: string }) => ({
      month,
      observedAtMs: Date.now(),
      dates: [{ date: month + "-05", available: true }],
    })),
  };
  const view = render(
    <CalendarProbe service={first} now={Date.now() + 1000} />,
  );
  expect(first.calendar).toHaveBeenCalledTimes(1);
  view.rerender(<CalendarProbe service={next} now={Date.now() + 1000} />);
  expect(await screen.findByText("2027-01-05")).toBeInTheDocument();
  await waitFor(() => expect(next.calendar).toHaveBeenCalledTimes(1));
  expect(next.calendar.mock.calls.map(([input]) => input.month)).toEqual([
    "2027-01",
  ]);
  await act(async () =>
    finish({
      month: "2027-01",
      observedAtMs: Date.now(),
      dates: [{ date: "2027-01-09", available: true }],
    }),
  );
  expect(screen.queryByText("2027-01-09")).not.toBeInTheDocument();
  expect(first.calendar).toHaveBeenCalledTimes(1);
});

const slot = {
  date: "2027-01-05",
  start: "12:00",
  instructor: "14",
  native: {
    serviceId: "12",
    serviceName: "Real session",
    instructorName: "Real trainer",
    currency: "SGD" as const,
    priceMinor: 8800,
  },
};
function Seed() {
  const { update, checkout } = useBooking();
  return (
    <>
      <button onClick={() => void checkout()}>Dispatch checkout</button>
      <button
        onClick={() =>
          update({
            mode: "guest",
            nativeServiceId: "12",
            slots: [slot],
            contact: {
              name: "Test Customer",
              email: "test@example.com",
              phone: "+65 8123 4567",
              contactMethod: "email",
              academy: "Test Academy",
            },
          })
        }
      >
        Choose test session
      </button>
    </>
  );
}
test("live calendar removes selections rejected at checkout and retains contact details", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
  let stale = false;
  const availability = vi.fn(
    async ({ date, fresh }: { date: string; fresh?: boolean }) => {
      if (fresh) stale = true;
      return date === slot.date && !stale ? [{ ...slot, available: true }] : [];
    },
  );
  const calendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    observedAtMs: Date.now(),
    dates:
      month === "2027-01"
        ? [
            { date: slot.date, available: !stale },
            { date: "2027-01-06", available: false },
          ]
        : [],
  }));
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: {
      ...demoBookingService.operations,
      availability: "live",
      checkout: "live",
    },
    checkout: async () => {
      stale = true;
      throw new BookingServiceError(
        "selection_changed",
        "The selected sessions were removed because availability changed.",
      );
    },
    availability,
    calendar,
  };
  render(
    <BookingProvider bookingService={service}>
      <Seed />
      <TimeStep />
      <Summary basket />
      <DetailsStep />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Choose test session" }));
  const region = screen.getByRole("region", { name: "Booking calendar" });
  await waitFor(() =>
    expect(
      within(region).getByRole("button", { name: dateLabel(slot.date) }),
    ).toBeEnabled(),
  );
  expect(
    within(region).getByRole("button", { name: dateLabel("2027-01-06") }),
  ).toBeDisabled();
  expect(
    within(region).getByRole("button", { name: dateLabel("2027-01-07") }),
  ).toBeDisabled();
  expect(
    screen.getAllByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    })[0],
  ).toHaveAttribute("href", "/book/details");
  expect(availability.mock.calls.some(([input]) => input.fresh === true)).toBe(
    false,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm email address is correct" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm email address is correct" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  );
  await waitFor(() => expect(push).toHaveBeenCalledWith("/book/review/"));
  fireEvent.click(screen.getByText("Dispatch checkout"));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Some sessions may no longer be available. Please check again.",
    ),
  );
  // Calendar owns the single conflict notice; background classification must
  // not leave a second Details error even when both are mounted by this fixture.
  expect(screen.getAllByRole("alert")).toHaveLength(1);
  expect(
    screen.queryByText(
      "The selected sessions were removed because availability changed.",
    ),
  ).not.toBeInTheDocument();
  expect(push).toHaveBeenCalledWith("/book/review/");
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Test Customer");
  expect(
    screen.queryByRole("button", {
      name: `Remove ${slot.date} at ${slot.start}`,
    }),
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      within(region).getByRole("button", { name: dateLabel(slot.date) }),
    ).toBeDisabled(),
  );
  expect(availability.mock.calls.some(([input]) => input.fresh === true)).toBe(
    true,
  );
  expect(
    screen.queryByText(/rotate every three hours/),
  ).not.toBeInTheDocument();
});

test("live session preserves demo product player and inclusion presentation using provider labels", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        environment: "developer",
        observedAtMs: Date.now(),
        complete: true,
        services: [
          {
            id: "12",
            name: "Real session",
            active: true,
            durationMinutes: 40,
            recurring: false,
            priceMinor: 8800,
            currency: "SGD",
            instructorIds: ["14"],
          },
        ],
        instructors: [{ id: "14", name: "Real trainer", active: true }],
      }),
    ),
  );
  render(
    <BookingProvider bookingService={{ ...demoBookingService, mode: "live" }}>
      <SessionStep />
    </BookingProvider>,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  const card = await screen.findByRole("button", {
    name: "Choose Real session",
  });
  expect(card).toHaveTextContent("Weekdays $88");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(card);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Choose Real session" })).toBe(
    card,
  );
  expect(card).toBeVisible();
  expect(card).toHaveAttribute("aria-pressed", "true");
  expect(card).toHaveTextContent("Weekdays $88");
  expect(card).toHaveTextContent("Weekends/Public Holiday $108");
  expect(
    screen.getByRole("heading", { name: "Included with your session" }),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("link", { name: "Choose Date & Time" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Remove one player" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Add one player" }));
  expect(screen.getByText("2 players")).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByText("2 players")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Select session" }),
  ).not.toBeInTheDocument();
  expect(loadLiveDraft().nativeServiceName).toBe("Real session");
  render(
    <SessionSummaryHeading
      selectedService
      draft={{
        players: 2,
        nativeServiceId: "12",
        nativeServiceName: "Real session",
        slots: [
          {
            ...slot,
            native: { ...slot.native, serviceName: "Premium weekend variant" },
          },
        ],
      }}
    />,
  );
  expect(
    await screen.findByText("Real session · Apex @ Henderson"),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Premium weekend variant/)).not.toBeInTheDocument();
});

test("homepage prefetch starts without a booking identity and never creates guest access", async () => {
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: Date.now(),
    dates: [],
  }));
  const service = {
    ...demoBookingService,
    mode: "live" as const,
    operations: {
      ...demoBookingService.operations,
      availability: "live" as const,
    },
    publicCalendar,
  };
  function Entry() {
    const { update } = useBooking();
    return (
      <>
        <p>Homepage</p>
        <button
          onClick={() => update({ mode: "guest", nativeServiceId: "12" })}
        >
          Guest entry
        </button>
        <button
          onClick={() =>
            update({ mode: "member", accountEmail: "synthetic@example.test" })
          }
        >
          Email entry
        </button>
      </>
    );
  }
  render(
    <BookingProvider bookingService={service}>
      <Entry />
    </BookingProvider>,
  );
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  expect(screen.getByText("Homepage")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Guest entry" }));
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Email entry" }));
  await act(async () => {});
  expect(publicCalendar).toHaveBeenCalledTimes(1);
  expect(publicCalendar.mock.calls.map(([input]) => input.month)).toHaveLength(
    1,
  );
});

test("fresh calendar receipts render before the minute clock ticks and expire at their own deadline", async () => {
  vi.useFakeTimers();
  const initial = Date.parse("2027-01-01T00:00:00Z");
  vi.setSystemTime(initial);
  let finish!: (value: CalendarAvailability) => void;
  const calendar = vi.fn(
    () =>
      new Promise<CalendarAvailability>((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <CalendarProbe
      service={{ ...demoBookingService, calendar }}
      now={initial}
    />,
  );
  vi.setSystemTime(initial + 1500);
  await act(async () =>
    finish({
      month: "2027-01",
      observedAtMs: Date.now(),
      dates: [{ date: "2027-01-04", available: true }],
    }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("2027-01-04");
  await act(async () => vi.advanceTimersByTime(60000));
  expect(calendar).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("status")).toHaveTextContent("loading");
  expect(screen.getByRole("status")).toHaveAttribute("data-retained", "true");
  await act(async () =>
    finish({
      month: "2027-01",
      observedAtMs: Date.now(),
      dates: [{ date: "2027-01-06", available: true }],
    }),
  );
  expect(screen.getByRole("status")).toHaveTextContent("2027-01-06");
  expect(screen.getByRole("status")).not.toHaveTextContent("2027-01-04");
});

test("preloaded browser slots survive edits and checkout rejects changed availability", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-04T22:30:00Z"));
  let changed = false;
  const availability = vi.fn(
    async ({ date, fresh }: { date: string; fresh?: boolean }) => {
      if (fresh) changed = true;
      return date === slot.date && !changed
        ? [{ ...slot, available: true }]
        : [];
    },
  );
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: Date.now(),
    dates:
      month === "2027-01"
        ? [slot.date, "2027-01-06"].map((date) => ({
            date,
            available: !changed,
            offers: changed
              ? []
              : [
                  {
                    serviceId: "12",
                    serviceName: "Native Session",
                    instructorId: slot.instructor,
                    instructorName: "Native Trainer",
                    startMs: Date.parse(`${date}T${slot.start}:00+08:00`),
                    priceMinor: 8800,
                    currency: "SGD" as const,
                  },
                ],
          }))
        : [],
  }));
  function Players() {
    const { update, showDate } = useBooking();
    return (
      <>
        <button onClick={() => update({ players: 2 })}>Two players</button>
        <button onClick={() => showDate("2026-12-31")}>Inspect past day</button>
      </>
    );
  }
  render(
    <BookingProvider
      bookingService={{
        ...demoBookingService,
        mode: "live",
        operations: {
          ...demoBookingService.operations,
          availability: "live",
          checkout: "live",
        },
        checkout: async () => {
          changed = true;
          throw new BookingServiceError(
            "selection_changed",
            "The selected sessions were removed because availability changed.",
          );
        },
        publicCalendar,
        availability,
      }}
    >
      <Seed />
      <Players />
      <TimeStep />
      <Summary basket />
      <DetailsStep />
    </BookingProvider>,
  );
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "Choose test session" }));
  await act(async () => {});
  availability.mockClear();
  const region = screen.getByRole("region", { name: "Booking calendar" });
  for (const date of [slot.date, "2027-01-06", slot.date]) {
    fireEvent.click(
      within(region).getByRole("button", { name: dateLabel(date) }),
    );
    expect(
      screen.getByRole("group", { name: "Session times" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Checking times…")).not.toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole("button", { name: "Two players" }));
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Inspect past day" }));
  await act(async () => {});
  expect(availability).not.toHaveBeenCalled();
  expect(publicCalendar).toHaveBeenCalledTimes(1);
  expect(
    screen.getAllByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    })[0],
  ).toHaveAttribute("href", "/book/details");
  expect(availability.mock.calls.some(([input]) => input.fresh === true)).toBe(
    false,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm email address is correct" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm email address is correct" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  );
  await waitFor(() => expect(push).toHaveBeenCalledWith("/book/review/"));
  fireEvent.click(screen.getByText("Dispatch checkout"));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Some sessions may no longer be available. Please check again.",
    ),
  );
  // Calendar owns the single conflict notice; background classification must
  // not leave a second Details error even when both are mounted by this fixture.
  expect(screen.getAllByRole("alert")).toHaveLength(1);
  expect(
    screen.queryByText(
      "The selected sessions were removed because availability changed.",
    ),
  ).not.toBeInTheDocument();
  expect(availability.mock.calls.some(([input]) => input.fresh === true)).toBe(
    true,
  );
  expect(push).toHaveBeenCalledWith("/book/review/");
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Test Customer");
  expect(
    screen.queryByRole("button", {
      name: `Remove ${slot.date} at ${slot.start}`,
    }),
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      within(region).getByRole("button", { name: dateLabel(slot.date) }),
    ).toBeDisabled(),
  );
  expect(publicCalendar).toHaveBeenCalledTimes(1);
  expect(availability).toHaveBeenCalledWith(
    expect.objectContaining({ fresh: true }),
  );
});

test("browser slot cache expires after five minutes", async () => {
  vi.useFakeTimers();
  const initial = Date.parse("2027-01-01T00:00:00Z");
  vi.setSystemTime(initial);
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: initial,
    dates: [
      {
        date: month + "-05",
        available: true,
        offers: [
          {
            serviceId: "12",
            serviceName: "Session",
            instructorId: "3",
            instructorName: "Trainer",
            startMs: Date.parse(`${month}-05T12:00:00+08:00`),
            priceMinor: 8800,
            currency: "SGD" as const,
          },
        ],
      },
    ],
  }));
  render(
    <CalendarProbe
      service={{ ...demoBookingService, publicCalendar }}
      now={initial}
    />,
  );
  await act(async () => {});
  expect(screen.getByRole("status")).toHaveTextContent("2027-01-05");
  await act(async () => vi.advanceTimersByTime(60000));
  expect(screen.getByRole("status")).toHaveTextContent("2027-01-05");
  await act(async () => vi.advanceTimersByTime(240000));
  expect(screen.getByRole("status")).toHaveTextContent("loading");
});

test("prewarmed calendar remains visible until its original display deadline without refetching", async () => {
  vi.useFakeTimers();
  const initial = Date.parse("2027-01-01T00:00:00Z");
  vi.setSystemTime(initial);
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: initial - 900000,
    displayExpiresAtMs: initial + 900000,
    dates: [
      {
        date: month + "-05",
        available: true,
        offers: [
          {
            serviceId: "12",
            serviceName: "Session",
            instructorId: "3",
            instructorName: "Trainer",
            startMs: Date.parse(`${month}-05T12:00:00+08:00`),
            priceMinor: 8800,
            currency: "SGD" as const,
          },
        ],
      },
    ],
  }));
  render(
    <CalendarProbe
      service={{ ...demoBookingService, publicCalendar }}
      now={initial}
    />,
  );
  await act(async () => {});
  expect(screen.getByRole("status")).toHaveTextContent("2027-01-05");
  await act(async () => vi.advanceTimersByTime(60000));
  expect(screen.getByRole("status")).toHaveTextContent("2027-01-05");
  await act(async () => vi.advanceTimersByTime(840000));
  expect(screen.getByRole("status")).toHaveTextContent("loading");
  expect(publicCalendar).toHaveBeenCalledTimes(2);
});

test("Details opens local Review without waiting for unavailable providers", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
  const availability = vi.fn<BookingService["availability"]>(async () => {
    throw new Error("Provider unavailable");
  });
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: Date.now(),
    dates:
      month === "2027-01"
        ? [
            {
              date: slot.date,
              available: true,
              offers: [
                {
                  serviceId: "12",
                  serviceName: slot.native.serviceName,
                  instructorId: slot.instructor,
                  instructorName: slot.native.instructorName,
                  startMs: Date.parse(`${slot.date}T${slot.start}:00+08:00`),
                  priceMinor: 8800,
                  currency: "SGD" as const,
                },
              ],
            },
          ]
        : [],
  }));
  const service = {
    ...demoBookingService,
    mode: "live" as const,
    operations: {
      ...demoBookingService.operations,
      availability: "live" as const,
      checkout: "live" as const,
      pay: "live" as const,
    },
    publicCalendar,
    availability,
    checkout: vi.fn(demoBookingService.checkout),
    pay: vi.fn(demoBookingService.pay),
  };
  const tree = (step: "time" | "details") => (
    <BookingProvider bookingService={service}>
      <Seed />
      <BookingPage step={step} />
    </BookingProvider>
  );
  const view = render(tree("time"));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "Choose test session" }));
  expect(
    screen.getAllByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    })[0],
  ).toHaveAttribute("href", "/book/details");
  expect(availability).not.toHaveBeenCalled();
  view.rerender(tree("details"));
  expect(
    screen.getByRole("heading", { name: "Your details" }),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm email address is correct" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm email address is correct" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  );
  await waitFor(() => expect(push).toHaveBeenCalledWith("/book/review/"));
  expect(availability).not.toHaveBeenCalled();
  expect(service.checkout).not.toHaveBeenCalled();
  expect(service.pay).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Test Customer");
  expect(publicCalendar).toHaveBeenCalledTimes(1);
});

test("failed checkout preparation retains cached calendar and contact without refetching", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-04T22:30:00Z"));
  const availability = vi.fn<BookingService["availability"]>(async () => {
    throw new Error("availability unavailable");
  });
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: Date.now(),
    dates:
      month === "2027-01"
        ? [
            {
              date: slot.date,
              available: true,
              offers: [
                {
                  serviceId: "12",
                  serviceName: "Real session",
                  instructorId: slot.instructor,
                  instructorName: "Real trainer",
                  startMs: Date.parse(`${slot.date}T12:00:00+08:00`),
                  priceMinor: 8800,
                  currency: "SGD" as const,
                },
              ],
            },
          ]
        : [],
  }));
  const checkout = vi.fn(async () => {
    throw new Error("preparation unavailable");
  });
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: {
      ...demoBookingService.operations,
      availability: "live",
      checkout: "live",
      pay: "live",
    },
    publicCalendar,
    availability,
    checkout,
  };
  function Probe() {
    const state = useBooking();
    return (
      <>
        <button onClick={() => state.showDate(slot.date)}>
          Return to calendar
        </button>
        <output data-testid="cached-times">
          {state.availability.result?.dates.includes(slot.date)
            ? "visible"
            : "loading"}
        </output>
        <output data-testid="selected-count">{state.draft.slots.length}</output>
      </>
    );
  }
  const tree = (step: "time" | "details") => (
    <BookingProvider bookingService={service}>
      <Seed />
      <BookingPage step={step} />
      <Probe />
    </BookingProvider>
  );
  const view = render(tree("time"));
  await act(async () => {});
  fireEvent.click(screen.getByText("Choose test session"));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  view.rerender(tree("details"));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm email address is correct" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm email address is correct" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  );
  await waitFor(() => expect(push).toHaveBeenCalledWith("/book/review/"));
  expect(availability).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText("Dispatch checkout"));
  await waitFor(() => expect(checkout).toHaveBeenCalledTimes(1));
  await act(async () => {});
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Test Customer");
  view.rerender(tree("time"));
  fireEvent.click(screen.getByText("Return to calendar"));
  await waitFor(() =>
    expect(screen.getByTestId("cached-times")).toHaveTextContent("visible"),
  );
  expect(screen.getByTestId("selected-count")).toHaveTextContent("1");
  view.rerender(tree("details"));
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Test Customer");
  expect(publicCalendar).toHaveBeenCalledTimes(1);
  expect(availability).not.toHaveBeenCalled();
});

test("reservation conflict removes its session locally and returns to calendar with contact preserved", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-04T22:30:00Z"));
  const availability = vi.fn<BookingService["availability"]>(async () => [
    { ...slot, available: true },
  ]);
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: Date.now(),
    dates:
      month === "2027-01"
        ? [
            {
              date: slot.date,
              available: true,
              offers: [
                {
                  serviceId: "12",
                  serviceName: "Real session",
                  instructorId: slot.instructor,
                  instructorName: "Real trainer",
                  startMs: Date.parse(`${slot.date}T12:00:00+08:00`),
                  priceMinor: 8800,
                  currency: "SGD" as const,
                },
              ],
            },
          ]
        : [],
  }));
  const checkout = vi.fn<BookingService["checkout"]>(async ({ draft }) => ({
    id: "00000000-0000-4000-8000-000000000001",
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  }));
  const pay = vi.fn<BookingService["pay"]>(async () => {
    throw new BookingServiceError(
      "selection_unavailable",
      "The selected session is no longer available. Your details have been kept.",
      0,
    );
  });
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: {
      ...demoBookingService.operations,
      availability: "live",
      checkout: "live",
      pay: "live",
    },
    publicCalendar,
    availability,
    checkout,
    pay,
  };
  function Probe() {
    const state = useBooking();
    return (
      <>
        <button
          onClick={() => state.update({ slots: [{ ...slot, start: "12:50" }] })}
        >
          Choose replacement
        </button>
        <button onClick={() => state.showDate(slot.date)}>
          Return to calendar
        </button>
        <output data-testid="cached-times">
          {state.availability.result?.dates.includes(slot.date)
            ? "visible"
            : "loading"}
        </output>
        <output data-testid="selected-count">{state.draft.slots.length}</output>
        <output data-testid="contact-name">{state.draft.contact.name}</output>
        <output data-testid="notice">{state.selectionNotice}</output>
      </>
    );
  }
  const tree = (step: "time" | "details" | "review") => (
    <BookingProvider bookingService={service}>
      <Seed />
      <BookingPage step={step} />
      <Probe />
    </BookingProvider>
  );
  const view = render(tree("time"));
  await act(async () => {});
  fireEvent.click(screen.getByText("Choose test session"));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  view.rerender(tree("details"));
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm email address is correct" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Confirm email address is correct" }),
    ).toHaveAttribute("aria-pressed", "true"),
  );
  fireEvent.click(
    screen.getByRole("button", { name: /^Review Booking \$[\d,.]+$/ }),
  );
  await waitFor(() => expect(push).toHaveBeenCalledWith("/book/review/"));
  view.rerender(tree("review"));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
  );
  await waitFor(() => expect(pay).toHaveBeenCalledTimes(1));
  await act(async () => {});
  fireEvent.click(screen.getByText("Return to calendar"));
  await waitFor(() =>
    expect(screen.getByTestId("cached-times")).toHaveTextContent("visible"),
  );
  expect(screen.getByTestId("selected-count")).toHaveTextContent("0");
  expect(screen.getByTestId("contact-name")).toHaveTextContent("Test Customer");
  expect(replace).toHaveBeenCalledWith("/book/time/");
  expect(screen.getByTestId("notice")).toHaveTextContent(
    "Some sessions may no longer be available. Please check again.",
  );
  expect(publicCalendar).toHaveBeenCalledTimes(1);
  expect(availability).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ date: slot.date, fresh: true, serviceId: "12" }),
  );
  fireEvent.click(screen.getByText("Choose replacement"));
  view.rerender(tree("details"));
  expect(screen.getByLabelText(/Full name/)).toHaveValue("Test Customer");
  expect(screen.getByLabelText(/Email address/)).toHaveValue(
    "test@example.com",
  );
});

test("Details aborts an explicitly opened month and calendar return retains loaded months", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
  let finish!: (
    value: Awaited<ReturnType<NonNullable<BookingService["publicCalendar"]>>>,
  ) => void;
  const publicCalendar = vi.fn<NonNullable<BookingService["publicCalendar"]>>(
    ({ month }) =>
      month === "2027-01"
        ? Promise.resolve({
            month,
            serviceId: "12",
            observedAtMs: Date.now(),
            dates: [],
          })
        : new Promise((resolve) => {
            finish = resolve;
          }),
  );
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: { ...demoBookingService.operations, availability: "live" },
    publicCalendar,
  };
  const tree = (step: "time" | "details") => (
    <BookingProvider bookingService={service}>
      <Seed />
      <BookingPage step={step} />
    </BookingProvider>
  );
  const view = render(tree("time"));
  fireEvent.click(screen.getByText("Choose test session"));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByRole("combobox", { name: "Calendar view" }), {
    target: { value: "month" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(2));
  const pending = publicCalendar.mock.calls[1][0];
  expect(pending.month).toBe("2027-02");
  view.rerender(tree("details"));
  expect(pending.signal?.aborted).toBe(true);
  await act(async () =>
    finish({
      month: "2027-02",
      serviceId: "12",
      observedAtMs: Date.now(),
      dates: [],
    }),
  );
  expect(publicCalendar).toHaveBeenCalledTimes(2);
  view.rerender(tree("time"));
  await act(async () => {});
  expect(publicCalendar).toHaveBeenCalledTimes(2);
  fireEvent.change(screen.getByRole("combobox", { name: "Calendar view" }), {
    target: { value: "month" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(3));
  expect(publicCalendar.mock.calls.map(([input]) => input.month)).toEqual([
    "2027-01",
    "2027-02",
    "2027-02",
  ]);
});

test("cached calendar offers obey opening hours and the four-hour cutoff without another request", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  const initial = Date.parse("2027-01-05T08:00:00+08:00");
  vi.setSystemTime(initial);
  const publicCalendar = vi.fn<NonNullable<BookingService["publicCalendar"]>>(
    async ({ month }) => ({
      month,
      serviceId: "12",
      observedAtMs: initial,
      dates:
        month === "2027-01"
          ? [
              {
                date: "2027-01-05",
                available: true,
                offers: [
                  "11:59",
                  "12:00",
                  "14:40",
                  "18:40",
                  "19:20",
                  "19:21",
                ].map((time) => ({
                  serviceId: "12",
                  serviceName: "Synthetic session",
                  instructorId: "2",
                  instructorName: "Synthetic instructor",
                  startMs: Date.parse(`2027-01-05T${time}:00+08:00`),
                  priceMinor: 8800,
                  currency: "SGD" as const,
                })),
              },
            ]
          : [],
    }),
  );
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    publicCalendar,
  };
  function Probe({ now }: { now: number }) {
    const calendar = useCalendarAvailability(
      service,
      "12",
      "2027-01",
      "public",
      false,
    );
    return (
      <output data-testid="eligible">
        {calendar
          .entry("2027-01", now)
          ?.dates[0]?.offers?.map((offer) =>
            new Date(offer.startMs + 28800000).toISOString().slice(11, 16),
          )
          .join(",")}
      </output>
    );
  }
  const view = render(<Probe now={initial} />);
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  expect(screen.getByTestId("eligible")).toHaveTextContent("12:00,18:40");
  view.rerender(<Probe now={initial + 1} />);
  expect(screen.getByTestId("eligible")).toHaveTextContent(/^18:40$/);
  expect(publicCalendar).toHaveBeenCalledTimes(1);
});

test("failed public calendar releases full-page loading and leaves retry available", async () => {
  const publicCalendar = vi.fn(async () => {
    throw new Error("unavailable");
  });
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: { ...demoBookingService.operations, availability: "live" },
    publicCalendar,
  };
  render(
    <BookingProvider bookingService={service}>
      <Seed />
      <TimeStep />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "Choose test session" }));
  expect(await screen.findByText("Unable to Load.")).toBeInTheDocument();
  await waitFor(() =>
    expect(document.querySelector(".booking-flow-overlay")).toBeNull(),
  );
  expect(screen.getAllByText("Unable to Load.")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Refresh availability" }),
  ).toBeNull();
  const reads = publicCalendar.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(reads + 1));
  expect(
    await screen.findByRole("button", { name: "Try again" }),
  ).toBeEnabled();
});

/** Explicit negative evidence, rather than omitted/unknown dates. */
function verifiedEmptyDates(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return Array.from(
    { length: new Date(Date.UTC(year, monthNumber, 0)).getUTCDate() },
    (_, index) => ({
      date: `${month}-${String(index + 1).padStart(2, "0")}`,
      available: false,
      offers: [],
    }),
  );
}

test("cold calendar entry and refresh select an available day while retaining a valid chosen day", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-21T02:00:00Z"));
  localStorage.clear();
  let dates = ["2026-10-22", "2026-10-23"];
  let release: (() => void) | undefined;
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => {
    if (!release)
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    return {
      month,
      serviceId: "2",
      observedAtMs: Date.now(),
      dates: dates.length
        ? dates.map((date) => ({
            date,
            available: true,
            offers: [
              {
                serviceId: "2",
                serviceName: "Session",
                instructorId: "14",
                instructorName: "Trainer",
                startMs: Date.parse(`${date}T12:00:00+08:00`),
                priceMinor: 8800,
                currency: "SGD" as const,
              },
            ],
          }))
        : verifiedEmptyDates(month),
    };
  });
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: { ...demoBookingService.operations, availability: "live" },
    publicCalendar,
  };
  function ChooseService() {
    const { update, calendar } = useBooking();
    return (
      <>
        <button onClick={() => update({ mode: "guest", nativeServiceId: "2" })}>
          Choose calendar service
        </button>
        <button onClick={() => calendar.retry()}>Refresh test calendar</button>
      </>
    );
  }
  const view = () => (
    <BookingProvider bookingService={service}>
      <ChooseService />
      <TimeStep />
    </BookingProvider>
  );
  const first = render(view());
  fireEvent.click(
    screen.getByRole("button", { name: "Choose calendar service" }),
  );
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(1));
  await act(async () => {
    release!();
  });
  const day = (date: string) =>
    within(screen.getByRole("region", { name: "Booking calendar" })).getByRole(
      "button",
      { name: dateLabel(date) },
    );
  await waitFor(() =>
    expect(day("2026-10-22")).toHaveAttribute("aria-pressed", "true"),
  );
  fireEvent.click(day("2026-10-23"));
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh test calendar" }),
  );
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(2));
  expect(day("2026-10-23")).toHaveAttribute("aria-pressed", "true");
  dates = ["2026-10-24"];
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh test calendar" }),
  );
  await waitFor(() =>
    expect(day("2026-10-24")).toHaveAttribute("aria-pressed", "true"),
  );
  dates = [];
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh test calendar" }),
  );
  await screen.findByText("No sessions available on this date.");
  expect(day("2026-10-24")).toHaveAttribute("aria-pressed", "true");
  // An empty October must still allow an explicit move to November.
  expect(
    publicCalendar.mock.calls.every(([input]) => input.month === "2026-10"),
  ).toBe(true);
  dates = ["2026-11-03", "2026-11-04"];
  fireEvent.click(screen.getByRole("button", { name: "See next month" }));
  await waitFor(() =>
    expect(day("2026-11-03")).toHaveAttribute("aria-pressed", "true"),
  );
  expect(screen.getByRole("combobox", { name: "Calendar month" })).toHaveValue(
    "1",
  );
  expect(
    publicCalendar.mock.calls.filter(([input]) => input.month === "2026-11"),
  ).toHaveLength(1);
  fireEvent.click(day("2026-11-04"));
  expect(day("2026-11-04")).toHaveAttribute("aria-pressed", "true");
  dates = [];
  fireEvent.click(
    screen.getByRole("button", { name: "Refresh test calendar" }),
  );
  await screen.findByText("No sessions available on this date.");
  fireEvent.click(screen.getByRole("button", { name: "See next month" }));
  await waitFor(() =>
    expect(
      publicCalendar.mock.calls.some(([input]) => input.month === "2026-12"),
    ).toBe(true),
  );
  await screen.findByText("No sessions available on this date.");
  expect(screen.getByRole("button", { name: "See next month" })).toBeDisabled();
  fireEvent.change(screen.getByRole("combobox", { name: "Calendar view" }), {
    target: { value: "month" },
  });
  expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  expect(
    within(
      screen.getByRole("combobox", { name: "Calendar month" }),
    ).getAllByRole("option"),
  ).toHaveLength(3);
  expect(
    publicCalendar.mock.calls.some(([input]) => input.month > "2026-12"),
  ).toBe(false);
  first.unmount();
  dates = ["2026-10-22", "2026-10-23"];
  render(view());
  await waitFor(() =>
    expect(day("2026-10-22")).toHaveAttribute("aria-pressed", "true"),
  );
  expect(
    screen.queryByText("No sessions available on this date."),
  ).not.toBeInTheDocument();
});

test("initial calendar discovery hides unresolved dates searches bounded months and respects manual navigation", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-31T02:00:00Z"));
  for (const scenario of ["available", "empty", "failure", "manual"] as const) {
    localStorage.clear();
    sessionStorage.clear();
    const gates = new Map<string, () => void>();
    let fail = scenario === "failure";
    const publicCalendar = vi.fn(async ({ month }: { month: string }) => {
      await new Promise<void>((resolve) => gates.set(month, resolve));
      if (fail && month === "2026-11")
        throw new Error("synthetic calendar failure");
      return {
        month,
        serviceId: "2",
        observedAtMs: Date.now(),
        displayExpiresAtMs: Date.now() + 60000,
        monthCoverage: ["2026-10", "2026-11", "2026-12"].map((value) => ({
          month: value,
          state:
            value === "2026-10" || scenario === "empty"
              ? ("empty" as const)
              : ("available" as const),
          observedAtMs: Date.now(),
          displayExpiresAtMs: Date.now() + 60000,
        })),
        dates:
          month !== "2026-10" && scenario !== "empty"
            ? [{ date: `${month}-03`, available: true }]
            : verifiedEmptyDates(month),
      };
    });
    const service: BookingService = {
      ...demoBookingService,
      mode: "live",
      operations: { ...demoBookingService.operations, availability: "live" },
      publicCalendar,
    };
    const view = render(
      <BookingProvider bookingService={service}>
        <TimeStep />
      </BookingProvider>,
    );
    await waitFor(() => expect(gates.has("2026-10")).toBe(true));
    expect(
      screen.getByRole("status", { name: "Checking dates…" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Booking calendar" }),
    ).toBeNull();
    await act(async () => gates.get("2026-10")!());
    if (scenario !== "empty") {
      await waitFor(() => expect(gates.has("2026-12")).toBe(true));
      await act(async () => gates.get("2026-11")!());
      // The first usable month is insufficient: the later available month must be ready too.
      expect(
        screen.queryByRole("region", { name: "Booking calendar" }),
      ).toBeNull();
      if (scenario === "failure") {
        expect(await screen.findByRole("alert")).toHaveTextContent(
          "Unable to Load.",
        );
        expect(
          screen.queryByRole("status", { name: "Checking dates…" }),
        ).toBeNull();
      }
      await act(async () => gates.get("2026-12")!());
      if (scenario === "failure") {
        fail = false;
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(4));
        await act(async () => gates.get("2026-11")!());
      }
    }
    const region = await screen.findByRole("region", {
      name: "Booking calendar",
    });
    expect(region).toHaveAttribute("aria-busy", "false");
    expect(
      screen.queryByRole("status", { name: "Checking dates…" }),
    ).toBeNull();
    const picker = screen.getByRole("combobox", { name: "Calendar month" });
    expect(picker).toHaveValue(scenario === "empty" ? "0" : "1");
    if (scenario !== "empty") {
      const reads = publicCalendar.mock.calls.length;
      fireEvent.change(picker, { target: { value: "2" } });
      expect(
        within(region).getByRole("button", { name: dateLabel("2026-12-03") }),
      ).toHaveAttribute("aria-pressed", "true");
      fireEvent.change(picker, { target: { value: "0" } });
      expect(picker).toHaveValue("0");
      expect(
        screen.queryByRole("status", { name: "Checking dates…" }),
      ).toBeNull();
      expect(publicCalendar).toHaveBeenCalledTimes(reads);
    } else {
      expect(publicCalendar).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    }
    expect(
      publicCalendar.mock.calls.some(([input]) => input.month > "2026-12"),
    ).toBe(false);
    view.unmount();
  }
});

test("home calendar warming defers sibling preparation until booking entry", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: Date.now(),
    displayExpiresAtMs: Date.now() + 60000,
    dates: [],
    monthCoverage: [
      {
        month: "2027-01",
        state: "empty" as const,
        observedAtMs: Date.now(),
        displayExpiresAtMs: Date.now() + 60000,
      },
      { month: "2027-02", state: "unknown" as const },
      { month: "2027-03", state: "unknown" as const },
    ],
  }));
  const service = { ...demoBookingService, publicCalendar };
  function Probe({ booking }: { booking: boolean }) {
    const calendar = useCalendarAvailability(
      service,
      "12",
      "2027-01",
      "public",
      false,
      undefined,
      undefined,
      booking,
    );
    return (
      <output>
        {calendar.initialReady
          ? "Prepared"
          : calendar.hasLoaded("2027-01")
            ? "Warmed"
            : "Loading"}
      </output>
    );
  }
  const view = render(<Probe booking={false} />);
  await screen.findByText("Warmed");
  expect(publicCalendar.mock.calls.map(([input]) => input.month)).toEqual([
    "2027-01",
  ]);
  view.rerender(<Probe booking />);
  await screen.findByText("Prepared");
  expect(publicCalendar.mock.calls.map(([input]) => input.month)).toEqual([
    "2027-01",
    "2027-02",
    "2027-03",
  ]);
});

test("calendar refresh replaces only the selected month and retains loaded siblings", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => ({
    month,
    serviceId: "12",
    observedAtMs: Date.now(),
    dates: [],
  }));
  const service: BookingService = { ...demoBookingService, publicCalendar };
  function Probe({ month }: { month: string }) {
    const calendar = useCalendarAvailability(
      service,
      "12",
      month,
      "public",
      false,
    );
    return (
      <>
        <button onClick={() => calendar.retry()}>Refresh month</button>
        <output>
          {calendar.entry(month, Date.parse("2027-01-01T00:00:00Z"))
            ? month
            : "Loading"}
        </output>
      </>
    );
  }
  const view = render(<Probe month="2027-01" />);
  await screen.findByText("2027-01");
  view.rerender(<Probe month="2027-02" />);
  await screen.findByText("2027-02");
  fireEvent.click(screen.getByText("Refresh month"));
  await waitFor(() => expect(publicCalendar).toHaveBeenCalledTimes(3));
  await screen.findByText("2027-02");
  view.rerender(<Probe month="2027-01" />);
  await screen.findByText("2027-01");
  expect(publicCalendar.mock.calls.map(([value]) => value.month)).toEqual([
    "2027-01",
    "2027-02",
    "2027-02",
  ]);
});

test("rolling week starts at first availability crosses months and preserves cart day markings", async () => {
  localStorage.clear();
  sessionStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-28T00:00:00Z"));
  let failNovember = true;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  const publicCalendar = vi.fn(async ({ month }: { month: string }) => {
    await ready;
    if (month === "2026-11" && failNovember)
      throw new Error("synthetic offline");
    return {
      month,
      serviceId: "12",
      observedAtMs: Date.now(),
      dates: (month === "2026-10"
        ? ["2026-10-29", "2026-10-31"]
        : ["2026-11-02", "2026-11-06"]
      ).map((date) => ({
        date,
        available: true,
        offers: [
          {
            serviceId: "12",
            serviceName: "Session",
            instructorId: "14",
            instructorName: "Trainer",
            startMs: Date.parse(`${date}T12:00:00+08:00`),
            priceMinor: 8800,
            currency: "SGD" as const,
          },
        ],
      })),
    };
  });
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: { ...demoBookingService.operations, availability: "live" },
    publicCalendar,
  };
  function CartProbe() {
    const { draft, update } = useBooking();
    return (
      <>
        <button
          onClick={() => update({ mode: "guest", nativeServiceId: "12" })}
        >
          Start test calendar
        </button>
        <button
          onClick={() => update({ slots: [{ ...slot, date: "2026-10-31" }] })}
        >
          Select test date
        </button>
        <button onClick={() => update({ slots: [] })}>Remove test date</button>
        <output data-testid="retained-cart">{draft.slots.length}</output>
      </>
    );
  }
  render(
    <BookingProvider bookingService={service}>
      <CartProbe />
      <TimeStep />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Start test calendar"));
  await act(async () => {
    release();
  });
  await waitFor(() => expect(publicCalendar).toHaveBeenCalled());
  const region = screen.getByRole("region", { name: "Booking calendar" });
  const day = (date: string) =>
    within(region).getByRole("button", { name: dateLabel(date) });
  await waitFor(() =>
    expect(day("2026-10-29")).toHaveAttribute("aria-pressed", "true"),
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Calendar view" }), {
    target: { value: "week" },
  });
  expect(screen.getByRole("combobox", { name: "Calendar view" })).toHaveValue(
    "week",
  );
  expect(region.querySelectorAll(".date")).toHaveLength(7);
  expect(day("2026-11-04")).toBeDisabled();
  await screen.findByText(/Unable to Load\./);
  expect(day("2026-10-31")).toBeEnabled();
  failNovember = false;
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(day("2026-11-02")).toBeEnabled());
  expect(publicCalendar.mock.calls.map(([input]) => input.month)).toEqual([
    "2026-10",
    "2026-11",
    "2026-11",
  ]);
  fireEvent.click(screen.getByText("Select test date"));
  expect(day("2026-10-31")).toHaveClass("in-booking");
  fireEvent.click(day("2026-11-02"));
  expect(day("2026-10-29")).toBeInTheDocument();
  expect(day("2026-11-02")).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Next week" }));
  await waitFor(() =>
    expect(day("2026-11-06")).toHaveAttribute("aria-pressed", "true"),
  );
  expect(day("2026-11-05")).toBeDisabled();
  expect(screen.getByTestId("retained-cart")).toHaveTextContent("1");
  fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
  expect(day("2026-10-31")).toHaveClass("in-booking");
  fireEvent.change(screen.getByRole("combobox", { name: "Calendar view" }), {
    target: { value: "month" },
  });
  expect(region.querySelectorAll(".date")).toHaveLength(31);
  expect(day("2026-10-31")).toHaveClass("in-booking");
  fireEvent.click(screen.getByText("Remove test date"));
  expect(day("2026-10-31")).not.toHaveClass("in-booking");
  expect(publicCalendar.mock.calls).toHaveLength(3);
});

test("calendar month choices trim only fresh trailing empty cache coverage without extra discovery reads", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T02:00:00Z"));
  for (const scenario of [
    "trailing",
    "internal",
    "unknown",
    "missing",
    "expired",
    "all-empty",
  ] as const) {
    localStorage.clear();
    sessionStorage.clear();
    const months = ["2026-10", "2026-11", "2026-12"];
    const publicCalendar = vi.fn(
      async ({
        month,
      }: {
        month: string;
      }): ReturnType<NonNullable<BookingService["publicCalendar"]>> => ({
        month,
        serviceId: "2",
        observedAtMs: Date.now(),
        displayExpiresAtMs: Date.now() + 60000,
        ...(scenario === "missing"
          ? {}
          : {
              monthCoverage: months.map((value, index) =>
                scenario === "unknown" && index === 2
                  ? { month: value, state: "unknown" as const }
                  : {
                      month: value,
                      state:
                        scenario === "all-empty" ||
                        index === 1 ||
                        (scenario !== "internal" && index === 2)
                          ? ("empty" as const)
                          : ("available" as const),
                      observedAtMs: Date.now() - 1000,
                      displayExpiresAtMs:
                        Date.now() + (scenario === "expired" ? -1 : 60000),
                    },
              ),
            }),
        dates:
          scenario === "all-empty"
            ? []
            : [{ date: `${month}-20`, available: true }],
      }),
    );
    const service: BookingService = {
      ...demoBookingService,
      mode: "live",
      operations: { ...demoBookingService.operations, availability: "live" },
      publicCalendar,
    };
    const view = render(
      <BookingProvider bookingService={service}>
        <TimeStep />
      </BookingProvider>,
    );
    const picker = await screen.findByRole("combobox", {
      name: "Calendar month",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "Booking calendar" }),
      ).toHaveAttribute("aria-busy", "false"),
    );
    const trimmed = scenario === "trailing" || scenario === "all-empty";
    expect(within(picker).getAllByRole("option")).toHaveLength(trimmed ? 1 : 3);
    expect(picker).toHaveValue("0");
    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeDisabled();
    if (trimmed)
      expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    else
      expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
    expect(
      within(picker).getByRole("option", { name: "October 2026" }),
    ).toBeInTheDocument();
    expect(publicCalendar).toHaveBeenCalledTimes(
      scenario === "internal" || scenario === "unknown"
        ? 2
        : scenario === "expired"
          ? 3
          : 1,
    );
    if (scenario === "internal") {
      fireEvent.change(picker, { target: { value: "1" } });
      await waitFor(() => expect(picker).toHaveValue("1"));
    }
    if (scenario === "internal" || scenario === "all-empty") {
      expect(
        screen.queryByRole("status", { name: "Checking times…" }),
      ).toBeNull();
      expect(document.querySelector(".booking-loading")).toBeNull();
    }
    view.unmount();
  }
});

test("calendar coverage expiry failures and newly reconciled availability keep future months reachable", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-15T02:00:00Z"));
  for (const scenario of ["expired", "failure", "reconciled"] as const) {
    const publicCalendar = vi.fn(
      async ({
        month,
      }: {
        month: string;
      }): ReturnType<NonNullable<BookingService["publicCalendar"]>> => {
        if (scenario === "failure" && month === "2026-12")
          throw new Error("read failed");
        return {
          month,
          serviceId: "2",
          observedAtMs: Date.now(),
          displayExpiresAtMs: Date.now() + 60000,
          dates: [{ date: `${month}-20`, available: false }],
          monthCoverage: ["2026-10", "2026-11", "2026-12"].map((value) => ({
            month: value,
            state: "empty",
            observedAtMs: Date.now(),
            displayExpiresAtMs: Date.now() + 1000,
          })),
        };
      },
    );
    const service: BookingService = { ...demoBookingService, publicCalendar };
    const initialNow = Date.now();
    function Probe({ month }: { month: string }) {
      const calendar = useCalendarAvailability(
        service,
        "2",
        month,
        "public",
        false,
      );
      return (
        <>
          <output>{calendar.lastMonthOffset(initialNow)}</output>
          <button onClick={() => calendar.reconcile("2026-12-20", true)}>
            Reconcile available
          </button>
        </>
      );
    }
    const view = render(<Probe month="2026-10" />);
    await act(async () => {});
    expect(screen.getByRole("status")).toHaveTextContent("0");
    if (scenario === "expired") {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1001);
      });
      expect(publicCalendar).toHaveBeenCalledTimes(1);
    } else {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1001);
      });
      view.rerender(<Probe month="2026-12" />);
      await act(async () => {});
      if (scenario === "reconciled")
        fireEvent.click(screen.getByText("Reconcile available"));
      expect(publicCalendar).toHaveBeenCalledTimes(2);
    }
    expect(screen.getByRole("status")).toHaveTextContent("2");
    view.unmount();
  }
});

test("expired calendar refresh retains dates and sessions without branded loading or stale checkout availability", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
  localStorage.clear();
  sessionStorage.clear();
  const pending: Array<{
    resolve: (
      value: Awaited<ReturnType<NonNullable<BookingService["publicCalendar"]>>>,
    ) => void;
    reject: (error: Error) => void;
  }> = [];
  const publicCalendar = vi.fn<NonNullable<BookingService["publicCalendar"]>>(
    () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
  );
  const slotReads: Array<{ reject: (error: Error) => void }> = [];
  const availability = vi.fn<BookingService["availability"]>(
    () => new Promise((_resolve, reject) => slotReads.push({ reject })),
  );
  const checkout = vi.fn<BookingService["checkout"]>();
  const service: BookingService = {
    ...demoBookingService,
    mode: "live",
    operations: { ...demoBookingService.operations, availability: "live" },
    publicCalendar,
    availability,
    checkout,
  };
  const snapshot = () => ({
    month: "2027-01",
    serviceId: "12",
    observedAtMs: Date.now(),
    displayExpiresAtMs: Date.now() + 1000,
    dates: ["2027-01-05", "2027-01-06"].map((date) => ({
      date,
      available: true,
      offers: [
        {
          ...slot.native,
          instructorId: slot.instructor,
          startMs: Date.parse(`${date}T12:00:00+08:00`),
        },
      ],
    })),
  });
  function Probe() {
    const { calendar, update, now } = useBooking();
    return (
      <>
        <button
          onClick={() =>
            update({
              mode: "guest",
              nativeServiceId: "12",
              nativeServiceName: "Test session",
              slots: [slot],
            })
          }
        >
          Seed refresh cart
        </button>
        <output data-testid="strict-cache">
          {JSON.stringify({
            entry: !!calendar.entry("2027-01", now),
            offers: calendar.cachedDates[slot.date]?.length ?? 0,
            displayOffers:
              "offers" in (calendar.displayEntry("2027-01")?.dates[0] ?? {}),
          })}
        </output>
      </>
    );
  }
  const view = render(
    <BookingProvider bookingService={service}>
      <Probe />
      <TimeStep />
      <BasketContinue />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByText("Seed refresh cart"));
  await act(async () => pending[0].resolve(snapshot()));
  const region = screen.getByRole("region", { name: "Booking calendar" });
  const day = () =>
    within(region).getByRole("button", { name: dateLabel(slot.date) });
  expect(day()).toBeEnabled();
  expect(
    screen.getAllByRole("link", { name: /^Enter Booking Details/ })[0],
  ).toBeInTheDocument();
  expect(JSON.parse(screen.getByTestId("strict-cache").textContent!)).toEqual({
    entry: true,
    offers: 1,
    displayOffers: false,
  });
  // A resumed tab can observe expiry before its throttled deadline timer runs.
  await act(async () => {
    vi.setSystemTime(new Date("2027-01-01T00:00:01.001Z"));
    window.dispatchEvent(new Event("focus"));
  });
  expect(publicCalendar).toHaveBeenCalledTimes(1);
  expect(JSON.parse(screen.getByTestId("strict-cache").textContent!)).toEqual({
    entry: false,
    offers: 0,
    displayOffers: false,
  });
  expect(
    screen.getAllByRole("button", { name: /^Enter Booking Details/ })[0],
  ).toBeDisabled();
  expect(
    screen.getByRole("group", { name: "Session times" }),
  ).toBeInTheDocument();
  expect(day()).toBeEnabled();
  expect(view.container.querySelector(".loading-logo, [inert]")).toBeNull();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1001);
  });
  expect(publicCalendar).toHaveBeenCalledTimes(2);
  expect(
    screen.getByRole("group", { name: "Session times" }),
  ).toBeInTheDocument();
  expect(day()).toBeEnabled();
  expect(day()).toHaveAttribute("title", "Availability not verified");
  expect(view.container.querySelector(".loading-logo")).toBeNull();
  expect(JSON.parse(screen.getByTestId("strict-cache").textContent!)).toEqual({
    entry: false,
    offers: 0,
    displayOffers: false,
  });
  expect(
    screen.getAllByRole("button", { name: /^Enter Booking Details/ })[0],
  ).toBeDisabled();
  expect(checkout).not.toHaveBeenCalled();
  for (let tick = 0; tick < 2; tick += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(
      screen.getByRole("group", { name: "Session times" }),
    ).toBeInTheDocument();
    expect(view.container.querySelector(".loading-logo, [inert]")).toBeNull();
    expect(
      screen.getAllByRole("button", { name: /^Enter Booking Details/ })[0],
    ).toBeDisabled();
  }
  await act(async () =>
    slotReads
      .at(-1)!
      .reject(
        new BookingServiceError(
          "unavailable",
          "Online booking is unavailable. Please try again later.",
        ),
      ),
  );
  expect(day()).toBeEnabled();
  expect(
    screen.getByRole("group", { name: "Session times" }),
  ).toBeInTheDocument();
  expect(view.container.querySelector(".loading-logo, [inert]")).toBeNull();
  await act(async () =>
    pending[1].reject(new Error("synthetic month refresh failed")),
  );
  expect(day()).toBeEnabled();
  expect(
    screen.getByRole("group", { name: "Session times" }),
  ).toBeInTheDocument();
  expect(within(region).getByText("Unable to Load.")).toBeInTheDocument();
  expect(view.container.querySelector(".loading-logo")).toBeNull();
  fireEvent.click(within(region).getByRole("button", { name: "Try again" }));
  expect(screen.queryByText("Unable to Load.")).toBeNull();
  await act(async () => {});
  expect(day()).toBeEnabled();
  expect(
    screen.getByRole("group", { name: "Session times" }),
  ).toBeInTheDocument();
  expect(view.container.querySelector(".loading-logo, [inert]")).toBeNull();
  expect(
    screen.getAllByRole("button", { name: /^Enter Booking Details/ })[0],
  ).toBeDisabled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(screen.queryByText("Unable to Load.")).toBeNull();
  expect(view.container.querySelector(".loading-logo, [inert]")).toBeNull();
  await act(async () => pending[2].reject(new Error("synthetic retry failed")));
  expect(within(region).getByText("Unable to Load.")).toBeInTheDocument();
  expect(
    screen.getByRole("group", { name: "Session times" }),
  ).toBeInTheDocument();
  expect(view.container.querySelector(".loading-logo, [inert]")).toBeNull();
  fireEvent.click(within(region).getByRole("button", { name: "Try again" }));
  expect(screen.queryByText("Unable to Load.")).toBeNull();
  expect(
    screen.getAllByRole("button", { name: /^Enter Booking Details/ })[0],
  ).toBeDisabled();
  await act(async () => pending[3].resolve(snapshot()));
  expect(day()).toBeEnabled();
  expect(day()).toHaveAttribute("title", "Available sessions");
  expect(screen.queryByText("Unable to Load.")).toBeNull();
  expect(JSON.parse(screen.getByTestId("strict-cache").textContent!)).toEqual({
    entry: true,
    offers: 1,
    displayOffers: false,
  });
  expect(
    screen.getAllByRole("link", { name: /^Enter Booking Details/ })[0],
  ).toBeInTheDocument();
  expect(checkout).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1001);
  });
  await act(async () =>
    pending[4].resolve({
      ...snapshot(),
      dates: snapshot().dates.map((day) => ({
        ...day,
        available: false,
        offers: [],
      })),
    }),
  );
  expect(screen.queryByRole("group", { name: "Session times" })).toBeNull();
  expect(day()).toBeDisabled();
  expect(
    screen.getAllByRole("button", { name: /^Enter Booking Details/ })[0],
  ).toBeDisabled();
  expect(checkout).not.toHaveBeenCalled();
});

test("retained session display rejects changed date players service scope owner and authentication plus obsolete responses", async () => {
  for (const change of [
    "date",
    "players",
    "service",
    "scope",
    "owner",
    "auth",
  ] as const) {
    const replies: Array<
      (slots: Awaited<ReturnType<BookingService["availability"]>>) => void
    > = [];
    const availability = vi.fn<BookingService["availability"]>(
      () => new Promise((resolve) => replies.push(resolve)),
    );
    const original: BookingService = { ...demoBookingService, availability };
    let session = "original-session";
    const sessionKey = () => session;
    const initial = {
      owner: original,
      dates: [slot.date],
      players: 1,
      scope: "public",
      serviceId: "12",
      minute: Date.parse("2027-01-01T00:00:00Z") / 60000,
    };
    function Probe(props: typeof initial) {
      const value = useBookingAvailability(
        props.owner,
        props.dates,
        props.players,
        props.scope,
        props.minute,
        sessionKey,
        props.serviceId,
      );
      return (
        <output>
          {JSON.stringify({
            fresh: value.result?.status ?? null,
            shown: value.displayResult?.slots.length ?? 0,
          })}
        </output>
      );
    }
    const view = render(<Probe {...initial} />);
    await act(async () => replies[0]([{ ...slot, available: true }]));
    expect(screen.getByRole("status")).toHaveTextContent('"shown":1');
    view.rerender(<Probe {...initial} minute={initial.minute + 1} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      '"fresh":null,"shown":1',
    );
    const obsolete = replies[1];
    const next = { ...initial, minute: initial.minute + 1 };
    if (change === "date") next.dates = ["2027-01-06"];
    if (change === "players") next.players = 2;
    if (change === "service") next.serviceId = "99";
    if (change === "scope") next.scope = "protected";
    if (change === "owner") next.owner = { ...original };
    if (change === "auth") session = "replacement-session";
    view.rerender(<Probe {...next} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      '"fresh":null,"shown":0',
    );
    await act(async () => obsolete([{ ...slot, available: true }]));
    expect(screen.getByRole("status")).toHaveTextContent(
      '"fresh":null,"shown":0',
    );
    await act(async () => replies.at(-1)!([]));
    expect(screen.getByRole("status")).toHaveTextContent(
      '"fresh":"success","shown":0',
    );
    view.unmount();
  }
});

test("one calendar snapshot prepares every month and rejects incomplete or expired replacements", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-15T02:00:00Z"));
  const months = ["2026-10", "2026-11", "2026-12"].map((month) => ({
    month,
    serviceId: "2",
    observedAtMs: Date.now(),
    displayExpiresAtMs: Date.now() + 60000,
    dates: [{ date: month + "-20", available: false, offers: [] }],
  }));
  let finish!: (value: { months: typeof months }) => void;
  let pendingSignal: AbortSignal | undefined;
  const publicCalendarSnapshot = vi.fn(
    async ({ signal }: { signal?: AbortSignal }) => {
      pendingSignal = signal;
      return new Promise<{ months: typeof months }>((resolve) => {
        finish = resolve;
      });
    },
  );
  const publicCalendar = vi.fn();
  const service = {
    ...demoBookingService,
    publicCalendar,
    publicCalendarSnapshot,
  };
  const view = renderHook(
    ({ month, prepare }) =>
      useCalendarAvailability(
        service,
        "2",
        month,
        "public",
        false,
        undefined,
        undefined,
        prepare,
      ),
    { initialProps: { month: "2026-10", prepare: false } },
  );
  await waitFor(() => expect(publicCalendarSnapshot).toHaveBeenCalledTimes(1));
  view.rerender({ month: "2026-10", prepare: true });
  expect(pendingSignal?.aborted).toBe(false);
  expect(publicCalendarSnapshot).toHaveBeenCalledTimes(1);
  await act(async () => finish({ months }));
  await waitFor(() => expect(view.result.current.initialReady).toBe(true));
  expect(publicCalendarSnapshot).toHaveBeenCalledTimes(1);
  for (const month of ["2026-11", "2026-12", "2026-10"]) {
    view.rerender({ month, prepare: true });
    expect(view.result.current.entry(month, Date.now())?.dates).toEqual([
      { date: month + "-20", available: false, offers: [] },
    ]);
    expect(view.result.current.cachedDates[month + "-20"]).toEqual([]);
  }
  expect(publicCalendarSnapshot).toHaveBeenCalledTimes(1);
  expect(publicCalendar).not.toHaveBeenCalled();
  publicCalendarSnapshot.mockResolvedValueOnce({ months: months.slice(0, 2) });
  act(() => view.result.current.retry());
  await waitFor(() => expect(view.result.current.failed).toHaveLength(3));
  expect(view.result.current.entry("2026-10", Date.now())).toBeNull();
  publicCalendarSnapshot.mockResolvedValueOnce({
    months: months.map((entry) => ({
      ...entry,
      displayExpiresAtMs: Date.now() - 1,
    })),
  });
  act(() => view.result.current.retry());
  await waitFor(() => expect(view.result.current.failed).toHaveLength(3));
  expect(publicCalendarSnapshot).toHaveBeenCalledTimes(3);
  expect(view.result.current.entry("2026-10", Date.now())).toBeNull();
  publicCalendarSnapshot.mockResolvedValueOnce({ months });
  act(() => view.result.current.retry());
  await waitFor(() =>
    expect(view.result.current.entry("2026-10", Date.now())).not.toBeNull(),
  );
  expect(view.result.current.failed).toHaveLength(0);
});
