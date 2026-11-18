import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import Link from "next/link";
import { sitePath } from "@/content/site-path";
import { SiteShell, useErrorPage } from "./site-shell";
const navigation = vi.hoisted(() => ({
  path: "/book/session/yes",
  push: vi.fn(),
}));
const booking = vi.hoisted(() => ({
  attempt: null,
  action: { status: "idle" },
  leave: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => ({ push: navigation.push }),
}));
vi.mock("@/features/booking/provider", () => ({ useBooking: () => booking }));
vi.mock("next/link", () => ({
  default: (props: React.ComponentProps<"a">) => <a {...props} />,
}));
vi.mock("./booking-navigation", () => ({
  useBookingNavigation: () => ({ enter: navigation.push }),
  useBookingEntryTransition: () => false,
  BookingLink: (props: React.ComponentProps<"a">) => <a {...props} />,
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
test("nested booking 404 bypasses departure prompts and restores the guard only on valid booking pages", () => {
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
  const keyboardView = render(
    <SiteShell>
      <input aria-label="Editing field" />
    </SiteShell>,
  );
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
  keyboardView.unmount();
  vi.unstubAllGlobals();
});
