import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useEffect } from "react";
import { BookingProvider, useBooking } from "./provider";
import { BookingPage } from "./booking-page";
import { DetailsStep } from "./details-step";
import {
  createLiveIdentityService,
  prepareIdentityEntry,
} from "@/services/identity";
import { liveBookingService } from "@/services/booking";
import {
  profileAccessGeneration,
  establishedProfileAccess,
  onProfileAccessLoss,
  reportProfileAccessLoss,
  rememberBookingAccessExpiry,
} from "@/services/profile-access";
import { blankDraft } from "@/domain/booking";
import {
  saveLiveDraft,
  saveCalendarRecovery,
  markBookingDeparture,
} from "@/services/storage";
import { checkEmailDomain } from "@/services/email-domain";
import { BOOKING_SESSION_EXPIRED } from "@/domain/booking-messages";
const navigation = vi.hoisted(() => ({
  path: "/book/account/",
  push: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => navigation,
}));
const email = "profile@example.invalid";
const verified = () => ({
  email,
  expiresAt: Date.now() + 600000,
  remember: true,
});
const service = {
  ...liveBookingService,
  restore: async () => null,
  publicCalendarSnapshot: undefined,
  publicCalendar: undefined,
  calendar: undefined,
  availability: async () => [],
};
beforeEach(() => {
  establishedProfileAccess();
  sessionStorage.clear();
  localStorage.clear();
  navigation.path = "/book/account/";
  navigation.push.mockReset();
  navigation.replace.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
/** Seed verified memory through the actual identity transport. */
async function identityWith(fetcher: ReturnType<typeof vi.fn<typeof fetch>>) {
  vi.stubGlobal("fetch", fetcher);
  const identity = createLiveIdentityService();
  await identity.readCurrent!(new AbortController().signal);
  return identity;
}
/** Inspect the retained identity/draft without granting access through the fixture. */
function Probe({ visiting }: { visiting?: string } = {}) {
  const {
    draft,
    profileAccessRevision,
    checkout,
    action,
    update,
    leave,
    visitBookingStep,
    attempt,
  } = useBooking();
  useEffect(() => {
    if (visiting) visitBookingStep(visiting);
  }, [visiting, visitBookingStep]);
  return (
    <>
      <button onClick={leave}>Leave for home</button>
      <button onClick={() => update({ players: 2 })}>
        Change players locally
      </button>
      <button onClick={() => void checkout("synthetic-proof")}>
        Attempt checkout
      </button>
      <span>{action.error}</span>
      <output data-testid="recovery">
        {JSON.stringify({
          draft,
          profileAccessRevision,
          attemptId: attempt?.id,
        })}
      </output>
    </>
  );
}

test("revoked saved-contact editor returns to guest choices without revealing the profile", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  let denied = false;
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = String(input);
    if (path === "/api/access") return Response.json({ access: "guest" });
    if (path === "/api/identity/contact") {
      denied = true;
      return Response.json({ error: "access_denied" }, { status: 401 });
    }
    if (path === "/api/identity" || path === "/api/identity/restore")
      return Response.json(denied ? null : verified());
    return new Response(null, { status: 503 });
  });
  const identity = await identityWith(fetcher);
  render(
    <BookingProvider bookingService={service} identityService={identity}>
      <BookingPage step="account" />
      <Probe />
    </BookingProvider>,
  );
  await act(async () => vi.advanceTimersByTimeAsync(0));
  fireEvent.click(
    await screen.findByRole("button", { name: "Manage saved contact" }),
  );
  await act(async () => vi.advanceTimersByTimeAsync(0));
  expect(await screen.findByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
  expect(
    await screen.findByRole("button", { name: "Continue as guest" }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Continue with email" }),
  ).toBeEnabled();
  expect(screen.queryByText("Welcome back")).toBeNull();
  expect(screen.queryByLabelText(/Full name/)).toBeNull();
  expect(identity.current()).toBeNull();
  expect(navigation.replace).toHaveBeenCalledWith("/book/account/");
});

test("saved booking details stay behind the full loader until the protected profile read succeeds", async () => {
  navigation.path = "/book/details/";
  let finish!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    if (String(input) === "/api/identity/contact")
      return new Promise<Response>((resolve) => {
        finish = resolve;
      });
    if (String(input) === "/api/access")
      return Response.json({ access: "guest" });
    if (String(input).startsWith("/api/identity"))
      return Response.json(verified());
    return new Response(null, { status: 503 });
  });
  const identity = await identityWith(fetcher);
  saveLiveDraft({
    ...blankDraft(),
    mode: "member",
    accountEmail: email,
    contact: { ...blankDraft().contact, email },
  });
  render(
    <BookingProvider bookingService={service} identityService={identity}>
      <DetailsStep />
    </BookingProvider>,
  );
  await waitFor(() => expect(finish).toBeTypeOf("function"));
  expect(document.querySelector(".booking-flow-overlay")).not.toBeNull();
  expect(screen.queryByLabelText(/Full name/)).toBeNull();
  await act(async () =>
    finish(
      Response.json({
        email,
        contact: { name: "Saved Person", phone: "81234567" },
      }),
    ),
  );
  expect(await screen.findByDisplayValue("Saved Person")).toBeVisible();
  expect(screen.getByDisplayValue("81234567")).toBeVisible();
  if (vi.isFakeTimers())
    await act(async () => vi.advanceTimersByTimeAsync(1000));
  await waitFor(() =>
    expect(document.querySelector(".booking-flow-overlay")).toBeNull(),
  );
  fireEvent.change(screen.getByDisplayValue("Saved Person"), {
    target: { value: "Edited Person" },
  });
  expect(
    fetcher.mock.calls.filter(([path]) => path === "/api/identity/contact"),
  ).toHaveLength(1);
});

test("revoked profile read on Details never reveals persisted fields and returns to booking entry", async () => {
  navigation.path = "/book/details/";
  const fetcher = vi.fn<typeof fetch>(async (input) =>
    String(input) === "/api/identity/contact"
      ? Response.json({ error: "access_denied" }, { status: 401 })
      : String(input).startsWith("/api/identity")
        ? Response.json(verified())
        : new Response(null, { status: 503 }),
  );
  const identity = await identityWith(fetcher);
  saveLiveDraft({
    ...blankDraft(),
    mode: "member",
    accountEmail: email,
    contact: {
      ...blankDraft().contact,
      email,
      name: "Never Reveal",
      phone: "81234567",
    },
  });
  render(
    <BookingProvider bookingService={service} identityService={identity}>
      <DetailsStep />
      <Probe />
    </BookingProvider>,
  );
  expect(screen.queryByDisplayValue("Never Reveal")).toBeNull();
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith("/book/account/"),
  );
  expect(screen.queryByDisplayValue("Never Reveal")).toBeNull();
  expect(screen.getByTestId("recovery")).not.toHaveTextContent("Never Reveal");
  expect(identity.current()).toBeNull();
});

test("expired local identity at Details returns to entry before any profile read", async () => {
  navigation.path = "/book/details/";
  const fetcher = vi.fn<typeof fetch>(async () => Response.json(verified()));
  const identity = await identityWith(fetcher);
  identity.invalidate!();
  saveLiveDraft({
    ...blankDraft(),
    mode: "member",
    accountEmail: email,
    contact: { ...blankDraft().contact, email, name: "Hidden Contact" },
  });
  render(
    <BookingProvider bookingService={service} identityService={identity}>
      <DetailsStep />
      <Probe />
    </BookingProvider>,
  );
  await waitFor(() =>
    expect(navigation.replace).toHaveBeenCalledWith("/book/account/"),
  );
  expect(screen.queryByDisplayValue("Hidden Contact")).toBeNull();
  expect(
    fetcher.mock.calls.filter(([path]) => path === "/api/identity/contact"),
  ).toHaveLength(0);
});

test("old and duplicate access denials cannot reset a newly established session", () => {
  const loss = vi.fn();
  const stop = onProfileAccessLoss(loss);
  const old = profileAccessGeneration();
  establishedProfileAccess();
  reportProfileAccessLoss(old);
  expect(loss).not.toHaveBeenCalled();
  const current = profileAccessGeneration();
  reportProfileAccessLoss(current);
  reportProfileAccessLoss(current);
  expect(loss).toHaveBeenCalledTimes(1);
  stop();
});

test("revoked email skips optional profile saving without clearing entered booking details", async () => {
  navigation.path = "/book/review/";
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-12T00:00:00Z"));
  let finish!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    if (String(input) === "/api/identity/contact" && init?.method === "POST")
      return new Promise<Response>((resolve) => {
        finish = resolve;
      });
    return Response.json(verified());
  });
  const identity = await identityWith(fetcher);
  saveLiveDraft({
    ...blankDraft(),
    mode: "member",
    accepted: true,
    nativeServiceId: "2",
    slots: [
      {
        date: "2026-11-20",
        start: "12:00",
        instructor: "4",
        native: {
          serviceId: "2",
          serviceName: "Session",
          instructorName: "Instructor",
          priceMinor: 8800,
          currency: "SGD",
        },
      },
    ],
    accountEmail: email,
    contact: {
      ...blankDraft().contact,
      email,
      name: "Entered Person",
      phone: "81234567",
    },
  });
  function SaveProbe() {
    const { saveContact, profileSaveError, draft, checkout, attempt } =
      useBooking();
    return (
      <>
        <button
          onClick={() =>
            void saveContact().then((result) => {
              saved(result);
            })
          }
        >
          Save optional profile
        </button>
        <button onClick={() => void checkout("synthetic-proof")}>
          Checkout entered details
        </button>
        <output>{attempt?.id}</output>
        <output>{draft.contact.name}</output>
        <span>{profileSaveError}</span>
      </>
    );
  }
  const saved = vi.fn();
  const attemptId = "00000000-0000-4000-8000-000000000055";
  const checkout = vi.fn<typeof service.checkout>(async ({ draft }) => ({
    id: attemptId,
    draft,
    status: "ready",
    outcome: "pending",
    checkUntil: 0,
    booking: null,
  }));
  const pay = vi.fn<typeof service.pay>(async ({ attempt }) => ({
    ...attempt,
    status: "pending",
    checkUntil: Date.now() + 60000,
  }));
  render(
    <BookingProvider
      bookingService={{ ...service, checkout, pay }}
      identityService={identity}
    >
      <SaveProbe />
    </BookingProvider>,
  );
  fireEvent.click(await screen.findByText("Save optional profile"));
  await waitFor(() => expect(finish).toBeTypeOf("function"));
  fireEvent.click(screen.getByText("Checkout entered details"));
  expect(checkout).not.toHaveBeenCalled();
  await act(async () =>
    finish(Response.json({ error: "identity_unavailable" }, { status: 401 })),
  );
  await waitFor(() => expect(saved).toHaveBeenCalledWith(true));
  await waitFor(() => expect(pay).toHaveBeenCalledTimes(1));
  expect(checkout).toHaveBeenCalledTimes(1);
  expect(checkout.mock.calls[0][0].draft.contact.name).toBe("Entered Person");
  expect(pay.mock.calls[0][0].attempt.id).toBe(attemptId);
  expect(screen.getByText(attemptId)).toBeVisible();
  expect(identity.current()).toBeNull();
  expect(screen.getByText("Entered Person")).toBeVisible();
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(screen.queryByText(/couldn’t save/)).toBeNull();
});

test("saved-profile timeout offers retry without exposing fields or restarting booking", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  navigation.path = "/book/details/";
  let calls = 0;
  let finishOld!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    if (String(input) === "/api/identity/contact") {
      calls += 1;
      if (calls === 1)
        return new Promise<Response>((resolve) => {
          finishOld = resolve;
        });
      return Response.json({
        email,
        contact: { name: "Retried Person", phone: "81234567" },
      });
    }
    if (String(input).startsWith("/api/identity"))
      return Response.json(verified());
    return new Response(null, { status: 503 });
  });
  const identity = await identityWith(fetcher);
  saveLiveDraft({
    ...blankDraft(),
    mode: "member",
    accountEmail: email,
    contact: { ...blankDraft().contact, email },
  });
  render(
    <BookingProvider bookingService={service} identityService={identity}>
      <DetailsStep />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(calls).toBe(1);
  await act(async () => vi.advanceTimersByTimeAsync(10000));
  expect(
    screen.getByText("Unable to load saved details. Please try again."),
  ).toBeVisible();
  expect(screen.queryByLabelText(/Full name/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await act(async () => {});
  expect(screen.getByDisplayValue("Retried Person")).toBeVisible();
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(calls).toBe(2);
  await act(async () =>
    finishOld(
      Response.json({
        email,
        contact: { name: "Obsolete Person", phone: "88888888" },
      }),
    ),
  );
  expect(screen.getByDisplayValue("Retried Person")).toBeVisible();
  expect(screen.queryByDisplayValue("Obsolete Person")).toBeNull();
});

test("expired guest email lookup returns to step one with session notice and usable entry choices", async () => {
  navigation.path = "/book/details/";
  let accessAvailable = false;
  let renewed = false;
  let completeRenewal: (() => void) | undefined;
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    if (String(input) === "/api/identity/email-domain")
      return renewed
        ? Response.json({ status: "valid" })
        : Response.json({ error: "access_denied" }, { status: 401 });
    if (String(input) === "/api/access") {
      if (!accessAvailable)
        return Response.json({ error: "unavailable" }, { status: 503 });
      await new Promise<void>((resolve) => {
        completeRenewal = resolve;
      });
      renewed = true;
      return Response.json(
        { access: "guest" },
        {
          headers: {
            "X-Booking-Access-Expires-At": String(Date.now() + 1800000),
          },
        },
      );
    }
    return Response.json(null);
  });
  const identity = await identityWith(fetcher);
  saveLiveDraft({
    ...blankDraft(),
    mode: "guest",
    contact: {
      ...blankDraft().contact,
      email: "guest@example.com",
      name: "Old Guest",
    },
  });
  const view = render(
    <BookingProvider bookingService={service} identityService={identity}>
      <BookingPage step="details" />
      <Probe />
    </BookingProvider>,
  );
  await act(async () => {
    await checkEmailDomain("guest@example.com", new AbortController().signal);
  });
  expect(navigation.replace).toHaveBeenCalledWith("/book/account/");
  navigation.path = "/book/account/";
  view.rerender(
    <BookingProvider bookingService={service} identityService={identity}>
      <BookingPage step="account" />
      <Probe />
    </BookingProvider>,
  );
  expect(await screen.findByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continue as guest" }),
  ).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Continue with email" }),
  ).toBeEnabled();
  expect(screen.getByTestId("recovery")).not.toHaveTextContent("Old Guest");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));
  });
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.getByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
  expect(
    screen.getByText("We couldn’t start your booking. Please try again."),
  ).toBeVisible();
  accessAvailable = true;
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));
  });
  expect(navigation.push).not.toHaveBeenCalled();
  const requestsBeforeCompletion = fetcher.mock.calls.filter(
    ([url]) => url === "/api/access",
  ).length;
  expect(completeRenewal).toBeTypeOf("function");
  await act(async () => {
    completeRenewal!();
  });
  expect(
    fetcher.mock.calls.filter(([url]) => url === "/api/access"),
  ).toHaveLength(requestsBeforeCompletion);
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/book/session/");
  navigation.replace.mockClear();
  navigation.path = "/book/session/";
  view.rerender(
    <BookingProvider bookingService={service} identityService={identity}>
      <Probe visiting="session" />
    </BookingProvider>,
  );
  expect(screen.getByTestId("recovery")).toHaveTextContent(
    '"profileAccessRevision":0',
  );
  await expect(
    checkEmailDomain("guest@example.com", new AbortController().signal),
  ).resolves.toBe("valid");
  expect(navigation.replace).not.toHaveBeenCalled();
});

test("expired protected availability and verification notify recovery but transient failures do not", async () => {
  const lost = vi.fn();
  const stop = onProfileAccessLoss(lost);
  const fetcher = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetcher);
  try {
    fetcher.mockResolvedValue(
      Response.json({ error: "access_denied" }, { status: 401 }),
    );
    await expect(
      liveBookingService.availability!({
        date: "2026-11-20",
        players: 1,
        serviceId: "2",
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow();
    expect(lost).toHaveBeenCalledWith("session");
    establishedProfileAccess();
    lost.mockClear();
    await expect(
      createLiveIdentityService().verify(
        {
          challengeId: "00000000-0000-4000-8000-000000000001",
          email: "guest@example.com",
          expiresAt: Date.now() + 60000,
          resendAfter: 0,
        },
        "123456",
        false,
        new AbortController().signal,
      ),
    ).rejects.toThrow();
    expect(lost).toHaveBeenCalledWith("session");
    establishedProfileAccess();
    lost.mockClear();
    fetcher.mockResolvedValue(
      Response.json({ status: "unavailable" }, { status: 503 }),
    );
    expect(
      await checkEmailDomain("guest@example.com", new AbortController().signal),
    ).toBe("unavailable");
    expect(lost).not.toHaveBeenCalled();
    fetcher.mockResolvedValue(
      Response.json({ error: "identity_unavailable" }, { status: 401 }),
    );
    await checkEmailDomain("guest@example.com", new AbortController().signal);
    expect(lost).not.toHaveBeenCalled();
  } finally {
    stop();
  }
});

test("late or aborted email denial cannot expire a newly established booking session", async () => {
  let finish!: (response: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    ),
  );
  const lost = vi.fn();
  const stop = onProfileAccessLoss(lost);
  try {
    const old = checkEmailDomain(
      "guest@example.com",
      new AbortController().signal,
    );
    establishedProfileAccess();
    finish(Response.json({ error: "access_denied" }, { status: 401 }));
    await old;
    expect(lost).not.toHaveBeenCalled();
    const controller = new AbortController();
    const aborted = checkEmailDomain("guest@example.com", controller.signal);
    controller.abort();
    finish(Response.json({ error: "access_denied" }, { status: 401 }));
    await aborted;
    expect(lost).not.toHaveBeenCalled();
  } finally {
    stop();
  }
});

test("expired navigation redirects on forward and back steps while local edits and renewed entry remain free", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  const start = Date.now();
  let restoredMember: ReturnType<typeof verified> | null = null;
  const fetcher = vi.fn<typeof fetch>(async (input) =>
    String(input) === "/api/access"
      ? Response.json(
          { access: "guest" },
          {
            headers: {
              "X-Booking-Access-Expires-At": String(Date.now() + 1800000),
            },
          },
        )
      : Response.json(
          String(input) === "/api/identity" ? restoredMember : null,
        ),
  );
  const identity = await identityWith(fetcher);
  const accessCalls = () =>
    fetcher.mock.calls.filter(([path]) => path === "/api/access").length;
  for (const [origin, destination] of [
    ["/book/session/", "/book/time/"],
    ["/book/time/", "/book/details/"],
    ["/book/details/", "/book/review/"],
    ["/book/review/", "/book/details/"],
    ["/book/details/", "/book/time/"],
    ["/book/time/", "/book/session/"],
    ["/book/session/", "/book/account/"],
  ]) {
    navigation.replace.mockClear();
    navigation.push.mockClear();
    const beforeRecovery = accessCalls();
    navigation.path = origin;
    vi.setSystemTime(start);
    establishedProfileAccess(String(start + 1800000));
    saveLiveDraft({ ...blankDraft(), mode: "guest" });
    let view = render(
      <BookingProvider bookingService={service} identityService={identity}>
        <Probe />
      </BookingProvider>,
    );
    await act(async () => {});
    expect(navigation.replace).not.toHaveBeenCalled();
    vi.setSystemTime(start + 1800001);
    fireEvent.click(
      screen.getByRole("button", { name: "Change players locally" }),
    );
    expect(screen.getByTestId("recovery")).toHaveTextContent('"players":2');
    expect(navigation.replace).not.toHaveBeenCalled();
    navigation.path = destination;
    view.rerender(
      <BookingProvider bookingService={service} identityService={identity}>
        <Probe visiting={destination.split("/")[2]} />
      </BookingProvider>,
    );
    expect(navigation.replace).toHaveBeenCalledExactlyOnceWith(
      "/book/account/",
    );
    navigation.path = "/book/account/";
    view.rerender(
      <BookingProvider bookingService={service} identityService={identity}>
        <BookingPage step="account" />
        <Probe />
      </BookingProvider>,
    );
    expect(await screen.findByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
    expect(accessCalls()).toBe(beforeRecovery);
    // A refresh remounts the provider while the generation has already reported loss.
    view.unmount();
    view = render(
      <BookingProvider bookingService={service} identityService={identity}>
        <BookingPage step="account" />
        <Probe />
      </BookingProvider>,
    );
    expect(await screen.findByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
    expect(accessCalls()).toBe(beforeRecovery);
    expect(navigation.push).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Continue as guest" }),
      );
    });
    expect(accessCalls()).toBe(beforeRecovery + 1);
    expect(navigation.push).toHaveBeenCalledWith("/book/session/");
    expect(screen.getByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
    navigation.replace.mockClear();
    navigation.path = "/book/session/";
    view.rerender(
      <BookingProvider bookingService={service} identityService={identity}>
        <Probe />
      </BookingProvider>,
    );
    expect(navigation.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Leave for home" }));
    navigation.path = "/";
    view.rerender(
      <BookingProvider bookingService={service} identityService={identity}>
        <Probe />
      </BookingProvider>,
    );
    const beforeEntry = accessCalls();
    await act(async () => {
      await prepareIdentityEntry(identity).promise;
    });
    expect(accessCalls()).toBe(beforeEntry + 1);
    navigation.path = "/book/account/";
    view.rerender(
      <BookingProvider bookingService={service} identityService={identity}>
        <BookingPage step="account" />
        <Probe />
      </BookingProvider>,
    );
    expect(
      await screen.findByRole("button", { name: "Continue as guest" }),
    ).toBeEnabled();
    expect(screen.queryByText(BOOKING_SESSION_EXPIRED)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));
    expect(navigation.push).toHaveBeenCalledWith("/book/session/");
    expect(accessCalls()).toBe(beforeEntry + 1);
    expect(navigation.replace).not.toHaveBeenCalled();
    view.unmount();
  }
  // Calendar recovery can retain a previous financial attempt while the visitor
  // edits a new journey. Its evidence must survive, without bypassing expiry.
  for (const [destination, recovery] of [
    ["/book/session/", true],
    ["/book/details/", true],
    ["/book/session/", false],
    ["/book/details/", false],
  ] as const) {
    vi.setSystemTime(start);
    establishedProfileAccess(String(start + 1800000));
    navigation.path = "/book/time/";
    navigation.replace.mockClear();
    const draft = { ...blankDraft(), mode: "guest" as const };
    const retained = {
      id: "00000000-0000-4000-8000-000000000001",
      status: "checking" as const,
      draft,
      outcome: "pending" as const,
      checkUntil: start + 600000,
      booking: null,
    };
    saveLiveDraft(draft, true, retained.id);
    if (recovery) saveCalendarRecovery(retained.id);
    else markBookingDeparture(retained.id, []);
    const recoveringService = { ...service, restore: async () => retained };
    const recovering = render(
      <BookingProvider
        bookingService={recoveringService}
        identityService={identity}
      >
        <Probe />
      </BookingProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("recovery")).toHaveTextContent(retained.id),
    );
    vi.setSystemTime(start + 1800001);
    navigation.path = destination;
    recovering.rerender(
      <BookingProvider
        bookingService={recoveringService}
        identityService={identity}
      >
        <Probe visiting={destination.split("/")[2]} />
      </BookingProvider>,
    );
    expect(navigation.replace).toHaveBeenCalledWith("/book/account/");
    expect(screen.getByTestId("recovery")).toHaveTextContent(retained.id);
    navigation.path = "/book/account/";
    recovering.rerender(
      <BookingProvider
        bookingService={recoveringService}
        identityService={identity}
      >
        <BookingPage step="account" />
        <Probe />
      </BookingProvider>,
    );
    expect(await screen.findByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
    recovering.unmount();
    sessionStorage.clear();
  }
  // Recovery must not silently renew or restore remembered sign-in.
  // Choosing email opens its form without requesting access until a code request.
  restoredMember = verified();
  const beforeMemberRecovery = accessCalls();
  establishedProfileAccess(String(Date.now() - 1));
  navigation.path = "/book/details/";
  const restoredView = render(
    <BookingProvider bookingService={service} identityService={identity}>
      <Probe />
    </BookingProvider>,
  );
  expect(navigation.replace).toHaveBeenCalledWith("/book/account/");
  navigation.path = "/book/account/";
  restoredView.rerender(
    <BookingProvider bookingService={service} identityService={identity}>
      <BookingPage step="account" />
      <Probe />
    </BookingProvider>,
  );
  expect(await screen.findByText(BOOKING_SESSION_EXPIRED)).toBeVisible();
  expect(accessCalls()).toBe(beforeMemberRecovery);
  expect(identity.current()).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Continue with email" }));
  expect(
    await screen.findByRole("heading", { name: "Continue with email" }),
  ).toBeVisible();
  expect(accessCalls()).toBe(beforeMemberRecovery);
  restoredView.unmount();
  rememberBookingAccessExpiry(null);
});
