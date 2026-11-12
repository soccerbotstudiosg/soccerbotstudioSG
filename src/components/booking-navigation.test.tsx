import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { BookingLink, BookingNavigation } from "./booking-navigation";
import { takeIdentityEntry } from "@/services/identity";
import type { CustomerIdentityService } from "@/services/contracts";
import { Arena } from "./arena";
const navigation = vi.hoisted(() => ({
  path: "/",
  push: vi.fn(),
  replace: vi.fn(),
}));
const identity = vi.hoisted(() => ({ mode: "demo", refresh: vi.fn() }));
vi.mock("@/services", () => ({ services: { customerIdentity: identity } }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.path,
  useRouter: () => router,
}));
const router = { push: navigation.push, replace: navigation.replace };
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: React.ComponentProps<"a">) => (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    >
      {children}
    </a>
  ),
}));
let reduced = false;
const listeners = new Set<() => void>();
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  navigation.path = "/";
  identity.mode = "demo";
  identity.refresh.mockReset().mockResolvedValue(null);
  navigation.push.mockClear();
  navigation.replace.mockClear();
  reduced = false;
  listeners.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return query.includes("reduce") && reduced;
    },
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  }));
  // No browser or rendering engine is launched: jsdom verifies React lifecycle/state.
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.documentElement.style.overflow = "";
});
function App({ arena = false }: { arena?: boolean }) {
  return (
    <BookingNavigation>
      <main id="main" tabIndex={-1}>
        {arena ? (
          <Arena />
        ) : (
          <BookingLink href="/book/account/">Book now</BookingLink>
        )}
      </main>
    </BookingNavigation>
  );
}
test("shows the logo on booking entry even when the destination is already prefetched", () => {
  const view = render(<App />);
  fireEvent.click(screen.getByRole("link", { name: "Book now" }));
  expect(
    screen.getByRole("status", { name: "Opening booking" }),
  ).toBeInTheDocument();
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/book/account/");
  navigation.path = "/book/account/";
  view.rerender(<App />);
  act(() => vi.advanceTimersByTime(479));
  expect(screen.getByRole("status")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(181));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(document.documentElement.style.overflow).toBe("");
  expect(screen.getByRole("main")).toHaveFocus();
});
test("keeps the hero scene separate from the logo and commits booking only once", () => {
  const view = render(<App arena />);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  expect(
    screen.getByRole("button", { name: "Skip arena transition" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(document.querySelectorAll('[data-scene-part^="panel-"]')).toHaveLength(
    30,
  );
  act(() => vi.advanceTimersByTime(2999));
  expect(navigation.replace).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(navigation.replace).toHaveBeenCalledExactlyOnceWith("/book/account/");
  navigation.path = "/book/account/";
  view.rerender(<App arena />);
  act(() => vi.advanceTimersByTime(900));
  expect(
    screen.queryByRole("button", { name: "Skip arena transition" }),
  ).not.toBeInTheDocument();
});
test("clicking the hero transition skips directly to booking without a delayed duplicate navigation", () => {
  const view = render(<App arena />);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  fireEvent.click(
    screen.getByRole("button", { name: "Skip arena transition" }),
  );
  navigation.path = "/book/account/";
  view.rerender(<App arena />);
  act(() => vi.advanceTimersByTime(5000));
  expect(navigation.replace).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole("button", { name: "Skip arena transition" }),
  ).not.toBeInTheDocument();
});
test("reduced motion enters booking immediately without either animation", () => {
  reduced = true;
  render(<App arena />);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/book/account/");
  expect(
    screen.queryByRole("button", { name: "Skip arena transition" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
test("modifier clicks retain native link navigation without a loading overlay", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("link"), { ctrlKey: true });
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
test("browser back cancels the pending hero and restores scrolling", () => {
  const before = window.history.length;
  render(<App arena />);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  expect(window.history.length).toBe(before + 1);
  fireEvent.popState(window);
  act(() => vi.advanceTimersByTime(5000));
  expect(navigation.push).not.toHaveBeenCalled();
  expect(navigation.replace).not.toHaveBeenCalled();
  expect(document.documentElement.style.overflow).toBe("");
});
test("unmount cleans the animation timers and preserves the previous scroll style", () => {
  document.documentElement.style.overflow = "clip";
  const view = render(<App arena />);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  view.unmount();
  act(() => vi.advanceTimersByTime(5000));
  expect(navigation.push).not.toHaveBeenCalled();
  expect(document.documentElement.style.overflow).toBe("clip");
  expect(cancelAnimationFrame).toHaveBeenCalled();
});
test("a changed motion preference finishes an active entry and removes its scroll lock", () => {
  render(<App arena />);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  reduced = true;
  act(() => listeners.forEach((listener) => listener()));
  act(() => vi.advanceTimersByTime(5000));
  expect(navigation.replace).toHaveBeenCalledTimes(1);
  expect(document.documentElement.style.overflow).toBe("");
  expect(
    screen.queryByRole("button", { name: "Skip arena transition" }),
  ).not.toBeInTheDocument();
});

test("studio navigation uses the same branded loader and restores focus after arrival", () => {
  function StudioLink() {
    return (
      <BookingNavigation>
        <main id="main" tabIndex={-1}>
          <BookingLink href="/studio/">The studio</BookingLink>
        </main>
      </BookingNavigation>
    );
  }
  const view = render(<StudioLink />);
  fireEvent.click(screen.getByRole("link", { name: "The studio" }));
  expect(
    screen.getByRole("status", { name: "Opening studio" }),
  ).toBeInTheDocument();
  expect(navigation.push).toHaveBeenCalledExactlyOnceWith("/studio/");
  navigation.path = "/studio/";
  view.rerender(<StudioLink />);
  act(() => vi.advanceTimersByTime(660));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByRole("main")).toHaveFocus();
});

test("live entry prepares identity during hero and hands off once after skip", async () => {
  identity.mode = "live";
  let resolve!: (value: null) => void;
  identity.refresh.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const view = render(<App arena />);
  expect(identity.refresh).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  expect(identity.refresh).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Skip arena transition" }),
  );
  expect(
    screen.getByRole("status", { name: "Opening booking" }),
  ).toBeInTheDocument();
  navigation.path = "/book/account/";
  view.rerender(<App arena />);
  act(() => vi.advanceTimersByTime(660));
  const prep = takeIdentityEntry(
    identity as unknown as CustomerIdentityService,
  );
  expect(identity.refresh).toHaveBeenCalledTimes(1);
  await act(async () => resolve(null));
  await expect(prep.promise).resolves.toBeNull();
  expect(identity.refresh.mock.calls[0][0].aborted).toBe(false);
});
test("live reduced motion keeps the functional full loader and same-route links do not restart identity", () => {
  identity.mode = "live";
  reduced = true;
  const view = render(<App />);
  fireEvent.click(screen.getByRole("link", { name: "Book now" }));
  expect(identity.refresh).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("status", { name: "Opening booking" }),
  ).toBeInTheDocument();
  navigation.path = "/book/account";
  view.rerender(<App />);
  act(() => vi.advanceTimersByTime(660));
  fireEvent.click(screen.getByRole("link", { name: "Book now" }));
  expect(identity.refresh).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("status")).toBeNull();
});
test("cancelled entry aborts its identity preparation and a new entry does not reuse it", async () => {
  identity.mode = "live";
  identity.refresh.mockImplementation(() => new Promise(() => {}));
  render(<App arena />);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  const signal = identity.refresh.mock.calls[0][0] as AbortSignal;
  fireEvent.popState(window);
  expect(signal.aborted).toBe(true);
  fireEvent.click(screen.getByRole("link", { name: /^Book now/ }));
  expect(identity.refresh).toHaveBeenCalledTimes(2);
  await act(async () => vi.advanceTimersByTime(10000));
  expect(identity.refresh.mock.calls[1][0].aborted).toBe(true);
});
