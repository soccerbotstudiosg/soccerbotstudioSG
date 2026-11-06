import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { blankDraft } from "@/domain/booking";
import { dateLabel, todaySG } from "@/domain/dates";
import { SessionStep } from "./session-step";
import { BookingPage } from "./booking-page";
import { Summary } from "./summary";
import { ReviewStep } from "./review-step";
import { BookingProvider } from "./provider";
import { demoSession } from "@/services/demo/schedule";
import { ConfirmationStep } from "./confirmation-step";
import { demoBookingModel } from "@/services/demo/booking";
import { loadBooking, saveBooking } from "@/services/storage";
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
const restoredDate = "2026-10-13";
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-07T02:00:00Z"));
  localStorage.clear();
  sessionStorage.clear();
  const draft = {
    ...blankDraft(),
    mode: "guest" as const,
    slots: [
      demoSession({
        date: restoredDate,
        start: "14:30",
      })!,
    ],
  };
  saveBooking({ version: 2, draft, attempt: null });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
test("booking page restores a future Tuesday on Wednesday before selecting and removing sessions, accumulating unique instructors and enabling Continue", async () => {
  const user = userEvent.setup();
  const view = render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(todaySG()).toBe("2026-10-07");
  const calendar = screen.getByRole("region", { name: "Booking calendar" });
  expect(
    within(calendar).getByRole("button", { name: dateLabel(restoredDate) }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    within(calendar).getByRole("button", { name: dateLabel(todaySG()) }),
  ).toHaveAttribute("aria-pressed", "false");
  const crossing = screen.getByRole("button", { name: /14:30–15:10/ });
  expect(crossing).toHaveAttribute("aria-pressed", "true");
  expect(crossing).toHaveTextContent("Faisal Shahril");
  expect(crossing).toHaveTextContent("Crosses the 15:00 instructor rotation");
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /15:20–16:00/ })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: /15:20–16:00/ }));
  expect(loadBooking().draft.slots).toHaveLength(1);
  await user.selectOptions(
    screen.getByLabelText(`Trainer for ${restoredDate} at 15:20`),
    `${restoredDate}|15:20|demo|daniel`,
  );
  const instructors = screen.getByRole("region", { name: "Your instructors" });
  expect(within(instructors).getAllByRole("article")).toHaveLength(2);
  expect(
    within(instructors).getByRole("article", { name: "Faisal Shahril" }),
  ).toBeInTheDocument();
  expect(
    within(instructors).getByRole("article", { name: "Daniel Tan" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /12:00–12:40/ }));
  await user.selectOptions(
    screen.getByLabelText(`Trainer for ${restoredDate} at 12:00`),
    `${restoredDate}|12:00|demo|faisal`,
  );
  expect(within(instructors).getAllByRole("article")).toHaveLength(2);
  expect(
    within(instructors)
      .getByRole("article", { name: "Faisal Shahril" })
      .querySelector(".trainer-bio"),
  ).not.toBeEmptyDOMElement();
  expect(
    within(
      within(instructors).getByRole("article", { name: "Faisal Shahril" }),
    ).queryByRole("list"),
  ).not.toBeInTheDocument();
  expect(
    within(instructors)
      .getByRole("article", { name: "Daniel Tan" })
      .querySelector(".trainer-bio"),
  ).not.toBeEmptyDOMElement();
  expect(
    within(
      within(instructors).getByRole("article", { name: "Daniel Tan" }),
    ).queryByRole("list"),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /15:20–16:00/ }));
  expect(within(instructors).getAllByRole("article")).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Clear all" }));
  expect(
    screen.queryByRole("region", { name: "Your instructors" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toBeDisabled();
  expect(screen.queryByText("Preview controls")).not.toBeInTheDocument();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  view.rerender(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  expect(
    screen.queryByRole("complementary", { name: "Your booking summary" }),
  ).not.toBeInTheDocument();
  expect(
    screen
      .getByRole("button", { name: "Open cart, 0 sessions" })
      .querySelector(".booking-cart-count"),
  ).toBeNull();
  await user.click(screen.getByRole("button", { name: /12:00–12:40/ }));
  await user.selectOptions(
    screen.getByLabelText(`Trainer for ${restoredDate} at 12:00`),
    `${restoredDate}|12:00|demo|faisal`,
  );
  await user.click(screen.getByRole("button", { name: /14:30–15:10/ }));
  await user.selectOptions(
    screen.getByLabelText(`Trainer for ${restoredDate} at 14:30`),
    `${restoredDate}|14:30|demo|faisal`,
  );
  expect(
    screen
      .getByRole("button", { name: "Open cart, 2 sessions" })
      .querySelector(".booking-cart-count"),
  ).toHaveTextContent("2");
  expect(
    screen
      .getByRole("button", { name: "View selected trainers, 1 trainer" })
      .querySelector(".booking-cart-count"),
  ).toHaveTextContent("1");
  await user.click(screen.getByRole("button", { name: /15:20–16:00/ }));
  await user.selectOptions(
    screen.getByLabelText(`Trainer for ${restoredDate} at 15:20`),
    `${restoredDate}|15:20|demo|daniel`,
  );
  expect(
    screen
      .getByRole("button", { name: "View selected trainers, 2 trainers" })
      .querySelector(".booking-cart-count"),
  ).toHaveTextContent("2");
  await user.click(
    screen.getByRole("button", { name: "View selected trainers, 2 trainers" }),
  );
  const trainerPanel = screen.getByRole("dialog", {
    name: "Selected trainers",
  });
  expect(within(trainerPanel).getAllByRole("article")).toHaveLength(2);
  await user.click(
    within(trainerPanel).getByRole("button", { name: "Close dialog" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Open cart, 3 sessions" }),
  );
  const cartPanel = screen.getByRole("dialog", { name: "Your cart" });
  expect(within(cartPanel).getAllByRole("listitem")).toHaveLength(3);
  expect(
    within(cartPanel).queryByRole("link", {
      name: /^Continue(?: \$[\d,.]+)?$/,
    }),
  ).not.toBeInTheDocument();
  await user.click(
    within(cartPanel).getByRole("button", {
      name: `Remove ${restoredDate} at 15:20`,
    }),
  );
  await user.click(
    within(cartPanel).getByRole("button", { name: "Close dialog" }),
  );
  expect(
    screen
      .getByRole("button", { name: "Open cart, 2 sessions" })
      .querySelector(".booking-cart-count"),
  ).toHaveTextContent("2");
  expect(
    screen
      .getByRole("button", { name: "View selected trainers, 1 trainer" })
      .querySelector(".booking-cart-count"),
  ).toHaveTextContent("1");
  expect(
    screen.getAllByRole("link", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toHaveLength(1);
});
test("crossing notices persist in the basket and review before payment", async () => {
  const basket = render(
    <BookingProvider>
      <Summary basket />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(
    within(screen.getByRole("complementary")).getByText(/Crosses the 15:00/),
  ).toHaveTextContent("stays for the full session");
  expect(
    screen.getByRole("link", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toHaveAttribute("href", "/book/details");
  basket.unmount();
  render(
    <BookingProvider>
      <ReviewStep />
    </BookingProvider>,
  );
  expect(screen.getByText(/Crosses the 15:00/)).toHaveTextContent(
    "stays for the full session",
  );
  expect(
    screen.getByRole("button", { name: /^Continue to payment \$[\d,.]+$/ }),
  ).toBeDisabled();
});

test("confirmation places three retained actions above a compact summary and discloses complete details", async () => {
  const stored = loadBooking();
  const draft = {
    ...stored.draft,
    accepted: true,
    contact: {
      ...stored.draft.contact,
      name: "Demo Customer",
      email: "demo@example.com",
      phone: "+65 8123 4567",
    },
    slots: [
      ...stored.draft.slots,
      demoSession({ date: stored.draft.slots[0].date, start: "15:20" })!,
    ],
  };
  const checking = demoBookingModel.pay(
    demoBookingModel.checkout(draft, null),
    "success",
  );
  const attempt = demoBookingModel.resolve(checking, checking.checkUntil);
  saveBooking({ version: 2, draft, attempt });
  const view = render(
    <BookingProvider>
      <ConfirmationStep />
    </BookingProvider>,
  );
  const disclosure = view.container.querySelector("details");
  expect(disclosure).not.toHaveAttribute("open");
  const actions = screen.getByLabelText("Booking actions");
  expect(
    Array.from(
      actions.querySelectorAll("button, a"),
      (action) => action.textContent,
    ),
  ).toEqual(["Make another booking", "WhatsApp Enquiry", "Back to home"]);
  expect(actions.compareDocumentPosition(disclosure!)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  fireEvent.click(screen.getByText("View full details"));
  expect(
    screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent),
  ).toEqual(["Your sessions", "Client Details", "Location", "Disclaimers"]);
  expect(disclosure).toHaveAttribute("open");
  expect(screen.getAllByText("Demo Customer", { exact: true })).toHaveLength(1);
  expect(screen.getAllByText("Studio 1", { exact: true })).toHaveLength(1);
  expect(
    screen.getAllByText("Trainer: Faisal Shahril", { exact: true }),
  ).toHaveLength(1);
  expect(
    screen.getAllByText("Trainer: Daniel Tan", { exact: true }),
  ).toHaveLength(1);
  expect(
    screen.getByText(/Crosses the 15:00 instructor rotation/),
  ).toBeVisible();
});

test("an open booking page expires a selected slot at its start and keeps it removable", async () => {
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(new Date("2026-10-06T11:59:59.999+08:00"));
  const draft = { ...blankDraft(), mode: "guest" as const };
  saveBooking({ version: 2, draft, attempt: null });
  const view = render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  const slot = screen.getByRole("button", { name: /12:00–12:40/ });
  expect(slot).toBeEnabled();
  fireEvent.click(slot);
  fireEvent.change(screen.getByLabelText("Trainer for 2026-10-06 at 12:00"), {
    target: { value: "2026-10-06|12:00|demo|faisal" },
  });
  expect(
    screen.getByRole("link", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toBeInTheDocument();
  await act(async () => {
    vi.advanceTimersByTime(1);
  });
  expect(
    screen.getByRole("button", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toBeDisabled();
  await act(async () => {});
  expect(
    within(screen.getByRole("complementary")).getByText(/Session has started/),
  ).toBeVisible();
  expect(loadBooking().draft.slots).toHaveLength(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Remove 2026-10-06 at 12:00" }),
  );
  expect(loadBooking().draft.slots).toHaveLength(0);
  expect(screen.getByRole("button", { name: /12:00–12:40/ })).toBeDisabled();
  view.unmount();
});

test("restored elapsed sessions remain labelled and removable alongside valid future sessions", async () => {
  vi.setSystemTime(new Date("2027-01-01T00:00:00+08:00"));
  const stale = demoSession({ date: "2026-12-31", start: "18:40" })!;
  const future = demoSession({ date: "2027-01-01", start: "12:00" })!;
  saveBooking({
    version: 2,
    draft: { ...blankDraft(), mode: "guest", slots: [stale, future] },
    attempt: null,
  });
  render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  const basket = within(screen.getByRole("complementary"));
  expect(basket.getByText(/Session has started/)).toBeVisible();
  expect(
    screen.getByRole("button", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toBeDisabled();
  expect(loadBooking().draft.slots).toEqual([stale, future]);
  fireEvent.click(
    screen.getByRole("button", { name: "Remove 2026-12-31 at 18:40" }),
  );
  await act(async () => {});
  expect(loadBooking().draft.slots).toEqual([future]);
  expect(basket.queryByText(/Session has started/)).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toBeInTheDocument();
});
test("selection rechecks time before dispatch and refreshes after a suspended tab resumes", async () => {
  vi.setSystemTime(new Date("2026-10-06T08:59:59+08:00"));
  saveBooking({
    version: 2,
    draft: { ...blankDraft(), mode: "guest" },
    attempt: null,
  });
  render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  const slot = screen.getByRole("button", { name: /12:00–12:40/ });
  expect(slot).toBeEnabled();
  // Move Date only, without delivering the scheduled UI timer.
  vi.setSystemTime(new Date("2026-10-06T12:00:00+08:00"));
  fireEvent.click(slot);
  expect(loadBooking().draft.slots).toEqual([]);
  await act(async () => {
    fireEvent.focus(window);
  });
  expect(screen.getByRole("button", { name: /12:00–12:40/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /12:00–12:40/ })).toHaveTextContent(
    "Session has started",
  );
});
test("an open calendar follows Singapore year rollover without deleting its draft", async () => {
  vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
  vi.setSystemTime(new Date("2026-12-31T23:59:59.999+08:00"));
  const slot = demoSession({ date: "2027-01-01", start: "12:00" })!;
  saveBooking({
    version: 2,
    draft: { ...blankDraft(), mode: "guest", slots: [slot] },
    attempt: null,
  });
  const view = render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {
    vi.advanceTimersByTime(1);
  });
  expect(todaySG()).toBe("2027-01-01");
  expect(
    screen.getByRole("button", { name: dateLabel("2027-01-01") }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(loadBooking().draft.slots).toEqual([slot]);
  expect(
    screen.getByRole("link", { name: /^Continue(?: \$[\d,.]+)?$/ }),
  ).toBeInTheDocument();
  view.unmount();
});

test("each time requires an independent trainer choice and changing it preserves other sessions and survives restoration", async () => {
  const user = userEvent.setup();
  const view = render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(screen.getAllByRole("button", { name: /12:00–12:40/ })).toHaveLength(
    1,
  );
  await user.click(screen.getByRole("button", { name: /12:00–12:40/ }));
  expect(loadBooking().draft.slots).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: /12:00–12:40/ }));
  expect(
    screen.queryByLabelText(`Trainer for ${restoredDate} at 12:00`),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /12:00–12:40/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(loadBooking().draft.slots).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: /12:00–12:40/ }));
  const picker = screen.getByLabelText(`Trainer for ${restoredDate} at 12:00`);
  await user.selectOptions(picker, `${restoredDate}|12:00|demo|daniel`);
  expect(
    loadBooking().draft.slots.find((slot) => slot.start === "12:00")
      ?.instructor,
  ).toBe("daniel");
  await user.selectOptions(picker, `${restoredDate}|12:00|demo|faisal`);
  expect(loadBooking().draft.slots).toHaveLength(2);
  expect(
    loadBooking().draft.slots.find((slot) => slot.start === "14:30")
      ?.instructor,
  ).toBe("faisal");
  view.unmount();
  render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(
    screen.getByLabelText(`Trainer for ${restoredDate} at 12:00`),
  ).toHaveValue(`${restoredDate}|12:00|demo|faisal`);
  await user.click(screen.getByRole("button", { name: /12:00–12:40/ }));
  expect(loadBooking().draft.slots).toHaveLength(1);
});
test("a trainer choice opened before expiry cannot add the session after its start", async () => {
  vi.setSystemTime(new Date("2026-10-13T11:59:59+08:00"));
  render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  fireEvent.click(screen.getByRole("button", { name: /12:00–12:40/ }));
  const picker = screen.getByLabelText(`Trainer for ${restoredDate} at 12:00`);
  vi.setSystemTime(new Date("2026-10-13T12:00:00+08:00"));
  fireEvent.change(picker, {
    target: { value: `${restoredDate}|12:00|demo|daniel` },
  });
  expect(loadBooking().draft.slots).toHaveLength(1);
});

test("calendar back preserves outlet and session choices while explicit deselection still clears them", async () => {
  const user = userEvent.setup();
  const view = render(
    <BookingProvider>
      <SessionStep />
    </BookingProvider>,
  );
  await user.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  await user.click(
    screen.getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Add one player" }));
  view.rerender(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  view.rerender(
    <BookingProvider>
      <SessionStep />
    </BookingProvider>,
  );
  expect(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
    }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("link", { name: "See available times" }),
  ).toBeVisible();
  expect(screen.getByText("2 players", { exact: true })).toBeVisible();
  await user.click(
    screen.getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
    }),
  );
  expect(
    screen.queryByRole("link", { name: "See available times" }),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  expect(
    screen.getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
    }),
  ).toHaveAttribute("aria-pressed", "false");
});
