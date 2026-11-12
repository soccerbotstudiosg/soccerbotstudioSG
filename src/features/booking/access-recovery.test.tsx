import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { BookingProvider, useBooking } from "./provider";
import { BookingPage } from "./booking-page";
import { DetailsStep } from "./details-step";
import { createLiveIdentityService } from "@/services/identity";
import { liveBookingService } from "@/services/booking";
import {
  profileAccessGeneration,
  establishedProfileAccess,
  onProfileAccessLoss,
  reportProfileAccessLoss,
} from "@/services/profile-access";
import { blankDraft } from "@/domain/booking";
import { saveLiveDraft } from "@/services/storage";
import { BOOKING_SIGNED_OUT } from "@/domain/booking-messages";
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
function Probe() {
  const { draft, profileAccessRevision, checkout, action } = useBooking();
  return (
    <>
      <button onClick={() => void checkout("synthetic-proof")}>
        Attempt checkout
      </button>
      <span>{action.error}</span>
      <output data-testid="recovery">
        {JSON.stringify({ draft, profileAccessRevision })}
      </output>
    </>
  );
}

test("revoked saved-contact editor returns to guest choices without revealing the profile", async () => {
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
  fireEvent.click(
    await screen.findByRole("button", { name: "Manage saved contact" }),
  );
  expect(await screen.findByText(BOOKING_SIGNED_OUT)).toBeVisible();
  expect(
    await screen.findByRole("button", { name: "Continue as Guest" }),
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
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
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
