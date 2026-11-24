import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import Link from "next/link";
import * as keyboardTrace from "./keyboard-trace";
import { sitePath } from "@/content/site-path";
import { SiteShell, useErrorPage } from "./site-shell";
const navigation = vi.hoisted(() => ({
  path: "/book/session/yes",
  push: vi.fn(),
  back: vi.fn(),
}));
const booking = vi.hoisted(() => ({
  attempt: null,
  action: { status: "idle" },
  leave: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => ({ push: navigation.push, back: navigation.back }),
}));
vi.mock("@/features/booking/provider", () => ({ useBooking: () => booking }));
vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("./booking-navigation", () => ({
  useBookingNavigation: () => ({ enter: navigation.push }),
  useBookingEntryTransition: () => false,
  BookingLink: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href && sitePath(href)} {...props} />
  ),
}));
vi.mock("./section-reveals", () => ({
  SectionReveals: () => null,
  BackToTop: () => <button aria-label="Back to top" />,
}));
vi.mock("./player-app-prompt", () => ({
  PlayerAppPrompt: () => <span>Player app prompt</span>,
}));
/** Exercise the real errorPage lifecycle independently of canvas animation. */
function Standalone({ children }: { children: ReactNode }) {
  useErrorPage();
  return children;
}
test("site navigation preserves public return state, booking guards and keyboard visibility", () => {
  const follow = vi.fn();
  const home = (
    <Link
      href={sitePath("/")}
      onClick={(event) => {
        event.preventDefault();
        follow();
      }}
    >
      Artwork Home
    </Link>
  );
  const view = render(
    <SiteShell>
      <Standalone>{home}</Standalone>
    </SiteShell>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(follow).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.queryByText("Player app prompt")).not.toBeInTheDocument();
  expect(booking.leave).not.toHaveBeenCalled();
  expect(screen.getAllByRole("button", { name: "Back to top" })).toHaveLength(
    1,
  );
  navigation.path = "/book/session/";
  view.rerender(<SiteShell>{home}</SiteShell>);
  expect(screen.getAllByRole("button", { name: "Back to top" })).toHaveLength(
    1,
  );
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(
    screen.getByRole("dialog", { name: "Leave this booking?" }),
  ).toBeVisible();
  expect(follow).toHaveBeenCalledOnce();
  navigation.path = "/book/session/yes";
  view.rerender(
    <SiteShell>
      <Standalone>{home}</Standalone>
    </SiteShell>,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(follow).toHaveBeenCalledTimes(2);
  navigation.path = "/book/session/";
  view.rerender(<SiteShell>{home}</SiteShell>);
  expect(screen.getAllByRole("button", { name: "Back to top" })).toHaveLength(
    1,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  expect(
    screen.getByRole("dialog", { name: "Leave this booking?" }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Stay" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(booking.leave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("link", { name: "Artwork Home" }));
  fireEvent.click(screen.getByRole("button", { name: "Leave booking" }));
  expect(booking.leave).toHaveBeenCalledExactlyOnceWith();
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/");
  view.unmount();
  const trace = vi.spyOn(keyboardTrace, "traceKeyboard");
  const viewport = Object.assign(new EventTarget(), {
    height: window.innerHeight,
    scale: 1,
    offsetTop: 0,
  });
  vi.stubGlobal("visualViewport", viewport);
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  let top = 40;
  const scroll = vi.fn((options: ScrollToOptions) => {
    top -= options.top ?? 0;
  });
  vi.stubGlobal("scrollBy", scroll);
  navigation.path = "/enquiry/";
  window.history.replaceState({}, "", "/enquiry/?keyboardTrace=1");
  const keyboardView = render(
    <SiteShell>
      <input aria-label="Editing field" />
    </SiteShell>,
  );
  expect(
    screen.queryByRole("complementary", { name: "Keyboard diagnostics" }),
  ).not.toBeInTheDocument();
  window.history.replaceState({}, "", "/enquiry/");
  const field = screen.getByRole("textbox", { name: "Editing field" });
  vi.spyOn(field, "getBoundingClientRect").mockImplementation(() => ({
    top,
    bottom: top + 52,
    height: 52,
    width: 300,
    left: 0,
    right: 300,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }));
  vi.spyOn(
    document.querySelector(".site-header")!,
    "getBoundingClientRect",
  ).mockReturnValue({ bottom: 100 } as DOMRect);
  const flush = () => {
    act(() => {
      for (let i = 0; i < 4 && frames.length; i++) frames.shift()!(0);
    });
  };
  const resize = (height: number) => {
    viewport.height = height;
    act(() => {
      viewport.dispatchEvent(new Event("resize"));
    });
    flush();
  };
  fireEvent.focusIn(field);
  resize(window.innerHeight / 2);
  expect(scroll).not.toHaveBeenCalled();
  resize(window.innerHeight);
  expect(scroll).toHaveBeenCalledExactlyOnceWith({
    top: -76,
    behavior: "instant",
  });
  expect(trace).toHaveBeenCalledWith(
    "recovery:scroll",
    expect.objectContaining({ closing: true, delta: -76 }),
    field,
  );
  expect(top).toBe(116);
  // Safari may finish its document scroll after the viewport resize has settled.
  top = 20;
  fireEvent.scroll(window);
  flush();
  expect(top).toBe(116);
  scroll.mockClear();
  top = 160;
  fireEvent.focusIn(field);
  resize(window.innerHeight / 2);
  resize(window.innerHeight);
  expect(scroll).not.toHaveBeenCalled();
  top = 40;
  fireEvent.focusIn(field);
  resize(window.innerHeight / 2);
  fireEvent.touchMove(document);
  resize(window.innerHeight);
  expect(scroll).not.toHaveBeenCalled();
  // Some iPad layouts shrink both viewport measurements while editing.
  scroll.mockClear();
  const fullHeight = window.innerHeight;
  fireEvent.focusIn(field);
  vi.stubGlobal("innerHeight", fullHeight / 2);
  resize(fullHeight / 2);
  expect(scroll).not.toHaveBeenCalled();
  vi.stubGlobal("innerHeight", fullHeight);
  resize(fullHeight);
  expect(top).toBe(116);
  scroll.mockClear();
  fireEvent.pointerDown(document);
  top = 20;
  fireEvent.scroll(window);
  flush();
  expect(scroll).not.toHaveBeenCalled();
  // A portrait iPad keyboard can occupy less than a quarter of the viewport.
  // Toolbar-only resizing must also leave an already visible field alone.
  top = 160;
  fireEvent.focusIn(field);
  resize(fullHeight - 40);
  resize(fullHeight);
  expect(scroll).not.toHaveBeenCalled();
  vi.stubGlobal("innerHeight", 1200);
  resize(1200);
  top = 40;
  fireEvent.focusIn(field);
  resize(960);
  expect(scroll).not.toHaveBeenCalled();
  resize(1200);
  expect(scroll).toHaveBeenCalledExactlyOnceWith({
    top: -76,
    behavior: "instant",
  });
  expect(top).toBe(116);
  trace.mockRestore();
  keyboardView.unmount();
  vi.unstubAllGlobals();
  const originalState = window.history.state;
  window.history.replaceState({}, "");
  navigation.path = "/studio/";
  const publicView = render(
    <SiteShell>
      <p>Public content</p>
    </SiteShell>,
  );
  navigation.push.mockClear();
  fireEvent.click(screen.getByRole("link", { name: "Back" }));
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/");
  for (const route of [
    "/",
    "/book/review/",
    "/confirmation/",
    "/enquiry/",
    "/terms-of-service/",
    "/privacy-policy/",
  ]) {
    navigation.path = route;
    publicView.rerender(
      <SiteShell>
        <p>Public content</p>
      </SiteShell>,
    );
    expect(document.querySelectorAll(".site-signature")).toHaveLength(
      route.startsWith("/book/") || route === "/confirmation/" ? 0 : 1,
    );
  }
  const historyLength = vi
    .spyOn(window.history, "length", "get")
    .mockReturnValue(2);
  fireEvent.click(screen.getByRole("link", { name: "Back" }));
  expect(navigation.back).toHaveBeenCalledOnce();
  publicView.unmount();
  // Reload retains the current entry's return state.
  const reloadView = render(
    <SiteShell>
      <p>Public content</p>
    </SiteShell>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Back" }));
  expect(navigation.back).toHaveBeenCalledTimes(2);
  reloadView.unmount();
  // A noopener legal tab still has a same-origin referrer and a single entry.
  window.history.replaceState({}, "");
  historyLength.mockReturnValue(1);
  const referrer = vi
    .spyOn(document, "referrer", "get")
    .mockReturnValue(`${window.location.origin}/book/review/`);
  const close = vi.spyOn(window, "close").mockImplementation(() => {});
  vi.stubGlobal("closed", true);
  const tabView = render(
    <SiteShell>
      <p>Public content</p>
    </SiteShell>,
  );
  navigation.push.mockClear();
  fireEvent.click(screen.getByRole("link", { name: "Back" }));
  expect(close).toHaveBeenCalledOnce();
  expect(navigation.push).not.toHaveBeenCalled();
  expect(navigation.back).toHaveBeenCalledTimes(2);
  tabView.unmount();
  close.mockRestore();
  referrer.mockRestore();
  historyLength.mockRestore();
  window.history.replaceState(originalState, "");
  vi.unstubAllGlobals();
});

test("unpaid continuation guards site departures and releases links after payment", () => {
  navigation.path = "/confirmation/";
  const pay = vi.fn();
  const paymentLink = (
    <a
      href="https://checkout.sandbox.hit-pay.com/"
      data-payment-continuation="00000000-0000-4000-8000-000000000107"
      data-booking-continuation
      onClick={(event) => {
        event.preventDefault();
        pay();
      }}
    >
      Continue payment
    </a>
  );
  const view = render(<SiteShell>{paymentLink}</SiteShell>);
  for (const name of [
    "SOCCERBOTSTUDIO Singapore home",
    "The studio",
    "Book now",
    "Terms and Condition",
    "Privacy Policy",
    /WhatsApp:/,
    /Instagram:/,
  ]) {
    fireEvent.click(screen.getByRole("link", { name }));
    expect(
      screen.getByRole("dialog", { name: "Leave this booking?" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
  }
  fireEvent.click(screen.getByRole("link", { name: "Continue payment" }));
  expect(pay).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Book now" }));
  fireEvent.click(screen.getByRole("button", { name: "Leave booking" }));
  expect(booking.leave).toHaveBeenCalledWith(
    "00000000-0000-4000-8000-000000000107",
  );
  expect(navigation.push).toHaveBeenCalledWith("/book/account/");
  view.unmount();

  const done = vi.fn();
  render(
    <SiteShell>
      <a
        href="/studio/"
        onClick={(event) => {
          event.preventDefault();
          done();
        }}
      >
        Finished booking link
      </a>
    </SiteShell>,
  );
  fireEvent.click(screen.getByRole("link", { name: "Finished booking link" }));
  expect(done).toHaveBeenCalledOnce();
  expect(screen.queryByRole("dialog")).toBeNull();
});
