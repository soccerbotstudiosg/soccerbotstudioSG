import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { blankDraft } from "@/domain/booking";
import { dateLabel, todaySG } from "@/domain/dates";
import { SessionStep } from "./session-step";
import { BookingPage } from "./booking-page";
import { Summary } from "./summary";
import { ReviewStep } from "./review-step";
import { BookingProvider, useBooking } from "./provider";
import { demoSession } from "@/services/demo/schedule";
import { ConfirmationStep } from "./confirmation-step";
import { TimeStep } from "./time-step";
import { demoBookingService, demoBookingModel } from "@/services/demo/booking";
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test("booking page restores a future Tuesday on Wednesday before selecting and removing sessions, accumulating unique instructors and enabling Continue", async () => {
  const user = userEvent.setup();
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  let calendarBottom = 600;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      return {
        x: 0,
        y: 0,
        top: this.classList.contains("time-heading") ? 420 : 0,
        left: 0,
        right: 400,
        bottom: this.classList.contains("calendar-panel")
          ? calendarBottom
          : 600,
        width: 400,
        height: this.classList.contains("session-times-region")
          ? 600
          : this.classList.contains("booking-navigation")
            ? 56
            : 0,
        toJSON: () => ({}),
      };
    },
  );
  const view = render(
    <BookingProvider>
      <BookingPage step="time" />
    </BookingProvider>,
  );
  await act(async () => {});
  expect(scroll).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: dateLabel(restoredDate) }),
  );
  expect(scroll).toHaveBeenLastCalledWith({ top: 360, behavior: "smooth" });
  calendarBottom = -1000;
  fireEvent.scroll(window);
  expect(screen.getByRole("button", { name: "Back to calendar" })).toHaveStyle({
    top: "8px",
  });
  calendarBottom = 600;
  fireEvent.scroll(window);
  scroll.mockClear();
  expect(todaySG()).toBe("2026-10-07");
  expect(screen.getByRole("combobox", { name: "Calendar view" })).toHaveValue(
    "month",
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Calendar view" }), {
    target: { value: "month" },
  });
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
    screen.getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
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
  const faisalProfile = within(instructors).getByRole("button", {
    name: "Faisal Shahril",
  });
  const danielProfile = within(instructors).getByRole("button", {
    name: "Daniel Tan",
  });
  expect(faisalProfile).toHaveAttribute("aria-expanded", "false");
  expect(danielProfile).toHaveAttribute("aria-expanded", "false");
  expect(
    instructors.querySelectorAll(".trainer-bio:not([hidden])"),
  ).toHaveLength(0);
  await user.click(faisalProfile);
  expect(faisalProfile).toHaveAttribute("aria-expanded", "true");
  expect(
    instructors.querySelectorAll(".trainer-bio:not([hidden])"),
  ).toHaveLength(1);
  await user.click(danielProfile);
  expect(faisalProfile).toHaveAttribute("aria-expanded", "false");
  expect(danielProfile).toHaveAttribute("aria-expanded", "true");
  expect(
    instructors.querySelectorAll(".trainer-bio:not([hidden])"),
  ).toHaveLength(1);
  await user.click(danielProfile);
  expect(
    instructors.querySelectorAll(".trainer-bio:not([hidden])"),
  ).toHaveLength(0);
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
    screen.getByRole("button", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
  ).toBeDisabled();
  expect(screen.queryByText("Preview controls")).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: dateLabel(restoredDate) }),
  );
  expect(scroll).toHaveBeenLastCalledWith({ top: 360, behavior: "smooth" });
  scroll.mockClear();
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
  const trainerBody = trainerPanel.querySelector(".booking-panel-body")!;
  const trainerRail = trainerPanel.querySelector<HTMLElement>(
    ".booking-panel-scrollbar",
  )!;
  Object.defineProperties(trainerBody, {
    clientHeight: { value: 200 },
    scrollHeight: { value: 600 },
    scrollTop: { value: 200, writable: true },
  });
  Object.defineProperty(trainerRail, "clientHeight", { value: 180 });
  fireEvent.scroll(trainerBody);
  expect(trainerRail.hidden).toBe(false);
  expect(trainerRail.style.getPropertyValue("--scroll-thumb-height")).toBe(
    "60px",
  );
  expect(trainerRail.style.getPropertyValue("--scroll-thumb-top")).toBe("60px");
  expect(trainerBody.querySelector(".booking-panel-header")).toBeNull();
  await user.click(
    within(trainerPanel).getByRole("button", { name: "Close dialog" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Open cart, 3 sessions" }),
  );
  const cartPanel = screen.getByRole("dialog", { name: "Your Cart" });
  expect(within(cartPanel).getAllByRole("listitem")).toHaveLength(3);
  const cartBody = cartPanel.querySelector(".booking-panel-body")!;
  const cartRail = cartPanel.querySelector<HTMLElement>(
    ".booking-panel-scrollbar",
  )!;
  Object.defineProperties(cartBody, {
    clientHeight: { value: 200 },
    scrollHeight: { value: 400 },
    scrollTop: { value: 200, writable: true },
  });
  Object.defineProperty(cartRail, "clientHeight", { value: 180 });
  fireEvent.scroll(cartBody);
  expect(cartRail.hidden).toBe(false);
  expect(cartRail.style.getPropertyValue("--scroll-thumb-top")).toBe("90px");
  expect(
    within(cartPanel).queryByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
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
    screen.getAllByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
  ).toHaveLength(1);
  expect(
    screen.queryByRole("heading", { name: "Your Sessions" }),
  ).not.toBeInTheDocument();
  view.container.querySelector<HTMLElement>(
    ".booking-navigation",
  )!.style.position = "sticky";
  fireEvent.click(
    screen.getByRole("button", { name: dateLabel("2026-10-14") }),
  );
  expect(scroll).not.toHaveBeenCalled();
  expect(view.container.querySelector(".session-times-region")).toHaveStyle({
    minHeight: "600px",
  });
  expect(
    screen.queryByRole("button", { name: /12:00–12:40/ }),
  ).not.toBeInTheDocument();
  await act(async () => {});
  expect(
    view.container.querySelector(".session-times-region"),
  ).not.toHaveAttribute("aria-busy", "true");
  expect(scroll).toHaveBeenCalledExactlyOnceWith({
    top: 304,
    behavior: "instant",
  });
  await act(async () => {});
  expect(scroll).toHaveBeenCalledTimes(1);
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query === "(max-width: 700px)",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  fireEvent.click(
    screen.getByRole("button", { name: dateLabel("2026-10-14") }),
  );
  expect(scroll).toHaveBeenLastCalledWith({ top: 304, behavior: "smooth" });
  expect(screen.queryByRole("button", { name: "Back to calendar" })).toBeNull();
  calendarBottom = 0;
  fireEvent.scroll(window);
  const returnCue = screen.getByRole("button", { name: "Back to calendar" });
  expect(returnCue.querySelector("svg path")).not.toBeNull();
  expect(returnCue).toHaveStyle({ top: "64px" });
  calendarBottom = 600;
  fireEvent.scroll(window);
  expect(screen.queryByRole("button", { name: "Back to calendar" })).toBeNull();
  calendarBottom = 0;
  fireEvent.scroll(window);
  await user.click(screen.getByRole("button", { name: "Back to calendar" }));
  expect(scroll).toHaveBeenLastCalledWith({ top: 0, behavior: "smooth" });
  expect(screen.queryByRole("button", { name: "Back to calendar" })).toBeNull();
  calendarBottom = 600;
  fireEvent.scroll(window);
  calendarBottom = -1000;
  fireEvent.scroll(window);
  expect(
    screen.getByRole("button", { name: "Back to calendar" }),
  ).toBeInTheDocument();
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
    screen.getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
  ).toHaveAttribute("href", "/book/details");
  const cart = screen.getByRole("complementary");
  expect(
    within(cart).queryByText("Updating session availability…"),
  ).not.toBeInTheDocument();
  expect(
    within(cart).queryByText("Session no longer available."),
  ).not.toBeInTheDocument();
  expect(cart.querySelector(".summary-total")).toBeNull();
  expect(
    cart
      .querySelector(".basket-continue")!
      .compareDocumentPosition(cart.querySelector(".basket-list")!),
  ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(cart.querySelector(".booking-primary-action")).toHaveAttribute(
    "data-ready-animation",
    "true",
  );
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
    screen.getByRole("button", { name: /^Proceed to Payment \$[\d,.]+$/ }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  const payment = screen.getByRole("button", {
    name: /^Proceed to Payment \$[\d,.]+$/,
  });
  expect(payment).toBeEnabled();
  expect(payment.parentElement).toHaveAttribute("data-ready-animation", "true");
  fireEvent.click(screen.getByRole("checkbox"));
  expect(payment).toBeDisabled();
  expect(payment.parentElement).not.toHaveAttribute("data-ready-animation");
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
  expect(
    disclosure?.querySelector(".session-summary-heading h2"),
  ).toHaveTextContent("Your Sessions");
  expect(
    view.container.querySelector(
      ".confirmation-summary .session-summary-heading",
    ),
  ).toBeNull();
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
  fireEvent.click(screen.getByText("View Full Details"));
  expect(
    screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent),
  ).toEqual([
    "Your Sessions",
    "Booking Contact",
    "Location",
    "Before Your Session",
    "Order Summary",
  ]);
  expect(disclosure).toHaveAttribute("open");
  expect(
    Array.from(disclosure!.querySelectorAll("h2"), (node) => node.textContent),
  ).toEqual([
    "Your Sessions",
    "Booking Contact",
    "Location",
    "Before Your Session",
  ]);
  expect(disclosure!.querySelector(".confirmation-disclaimers")).not.toBeNull();
  expect(
    screen.getByRole("region", { name: "Order Summary" }).closest("details"),
  ).toBeNull();
  expect(disclosure!.querySelector("button, a")).toBeNull();
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
    screen.getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
  ).toBeInTheDocument();
  await act(async () => {
    vi.advanceTimersByTime(1);
  });
  expect(
    screen.getByRole("button", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
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
    screen.getByRole("button", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
  ).toBeDisabled();
  expect(loadBooking().draft.slots).toEqual([stale, future]);
  fireEvent.click(
    screen.getByRole("button", { name: "Remove 2026-12-31 at 18:40" }),
  );
  await act(async () => {});
  expect(loadBooking().draft.slots).toEqual([future]);
  expect(basket.queryByText(/Session has started/)).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
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
    screen.getByRole("link", {
      name: /^Enter Booking Details(?: \$[\d,.]+)?$/,
    }),
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
  expect(picker).not.toBeInTheDocument();
  const selected = screen.getByRole("button", { name: /12:00–12:40/ });
  expect(selected).toHaveTextContent("Trainer: Daniel Tan");
  expect(selected).toHaveAttribute("aria-expanded", "false");
  await user.click(selected);
  await user.click(selected);
  await user.selectOptions(
    screen.getByLabelText(`Trainer for ${restoredDate} at 12:00`),
    `${restoredDate}|12:00|demo|faisal`,
  );
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
  expect(screen.getByRole("button", { name: /12:00–12:40/ })).toHaveTextContent(
    "Trainer: Faisal Shahril",
  );
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
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scroll,
  });
  const originalMatchMedia = window.matchMedia;
  let mobile = false;
  vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...originalMatchMedia(query),
    matches: query === "(max-width: 700px)" && mobile,
  }));
  const user = userEvent.setup();
  const view = render(
    <BookingProvider>
      <SessionStep />
    </BookingProvider>,
  );
  await user.click(
    screen.getByRole("button", { name: "Select Apex @ Henderson outlet" }),
  );
  expect(scroll).toHaveBeenCalledTimes(1);
  expect(scroll.mock.instances[0]).toBe(
    document.getElementById("outlet-sessions"),
  );
  await user.click(
    screen.getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
    }),
  );
  expect(scroll).toHaveBeenCalledTimes(2);
  expect(scroll.mock.instances[1]).toBe(
    document.querySelector(".booking-primary-action"),
  );
  expect(scroll).toHaveBeenLastCalledWith({
    block: "nearest",
    behavior: "smooth",
  });
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
    screen.getByRole("link", { name: "Choose Date & Time" }),
  ).toBeVisible();
  expect(screen.getByText("2 players", { exact: true })).toBeVisible();
  expect(scroll).toHaveBeenCalledTimes(2);
  mobile = true;
  await user.click(
    screen.getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
    }),
  );
  expect(
    screen.queryByRole("link", { name: "Choose Date & Time" }),
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
  await user.click(
    screen.getByRole("button", {
      name: "Choose Kickoff Special (Trial Price)",
    }),
  );
  expect(scroll).toHaveBeenCalledTimes(2);
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

test("expiry recovery hides affected studio times across trainers while other selections remain editable", async () => {
  const original = demoSession({ date: restoredDate, start: "12:00" })!;
  const alternateTrainer = { ...original, instructor: "daniel" };
  const other = demoSession({ date: restoredDate, start: "12:50" })!;
  const originalDraft = { ...loadBooking().draft, slots: [original] };
  const retained = {
    id: "00000000-0000-4000-8000-000000000001",
    status: "checking" as const,
    draft: originalDraft,
    outcome: "pending" as const,
    checkUntil: Date.now() + 60000,
    booking: null,
  };
  saveBooking({ version: 2, draft: originalDraft, attempt: retained });
  let freshFails = true;
  const offers = [original, alternateTrainer, other].map((slot) => ({
    ...slot,
    available: true,
  }));
  const availability = vi.fn(async ({ fresh }: { fresh?: boolean }) => {
    if (fresh && freshFails) throw new Error("Synthetic offline fresh read");
    return offers;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 503 })),
  );
  function Controls() {
    const state = useBooking();
    return (
      <>
        <button onClick={() => state.browseAfterChecking(retained.id)}>
          Browse after expiry
        </button>
        <button onClick={() => state.restartAfterExpiry(retained.id)}>
          Authoritative unpaid release
        </button>
        <output data-testid="recovery-attempt">
          {JSON.stringify(state.attempt)}
        </output>
        <output data-testid="recovery-cart">
          {JSON.stringify(state.draft.slots)}
        </output>
        <output data-testid="recovery-suppressed">
          {JSON.stringify(state.suppressedSlots)}
        </output>
      </>
    );
  }
  function RecoveryCalendar() {
    return useBooking().ready ? <TimeStep /> : null;
  }
  render(
    <BookingProvider bookingService={{ ...demoBookingService, availability }}>
      <Controls />
      <RecoveryCalendar />
    </BookingProvider>,
  );
  fireEvent.click(screen.getByText("Browse after expiry"));
  await waitFor(() =>
    expect(availability).toHaveBeenCalledWith(
      expect.objectContaining({ fresh: true }),
    ),
  );
  expect(
    screen.queryByRole("button", { name: /12:00–12:40/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /12:50–13:30/ })).toBeEnabled();
  expect(JSON.parse(screen.getByTestId("recovery-cart").textContent!)).toEqual(
    [],
  );
  expect(
    JSON.parse(screen.getByTestId("recovery-attempt").textContent!),
  ).toEqual(retained);
  fireEvent.click(screen.getByRole("button", { name: /12:50–13:30/ }));
  fireEvent.change(
    screen.getByLabelText(`Trainer for ${restoredDate} at 12:50`),
    {
      target: { value: `${restoredDate}|12:50|demo|faisal` },
    },
  );
  expect(JSON.parse(screen.getByTestId("recovery-cart").textContent!)).toEqual([
    other,
  ]);
  expect(
    JSON.parse(screen.getByTestId("recovery-attempt").textContent!),
  ).toEqual(retained);
  expect(
    document.querySelector(".payment-check-feedback, .booking-flow-overlay"),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Check status" })).toBeNull();
  // A successful fresh response still cannot release an unresolved payment's time.
  freshFails = false;
  vi.setSystemTime(new Date("2026-10-07T02:01:00Z"));
  fireEvent.focus(window);
  await act(async () => {});
  expect(
    JSON.parse(screen.getByTestId("recovery-suppressed").textContent!),
  ).toEqual([original]);
  expect(
    screen.queryByRole("button", { name: /12:00–12:40/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Authoritative unpaid release"));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /12:00–12:40/ })).toBeEnabled(),
  );
  expect(
    JSON.parse(screen.getByTestId("recovery-attempt").textContent!),
  ).toBeNull();
  expect(JSON.parse(screen.getByTestId("recovery-cart").textContent!)).toEqual([
    other,
  ]);
  expect(
    JSON.parse(screen.getByTestId("recovery-suppressed").textContent!),
  ).toEqual([]);
});
