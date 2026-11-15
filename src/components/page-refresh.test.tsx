import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  BookingLoading,
  BookingLoadingProvider,
} from "@/features/booking/booking-loading";
import { PlayerAppPrompt } from "./player-app-prompt";
import { PageRefreshBoundary } from "./page-refresh";

const booking = vi.hoisted(() => ({ ready: false }));
const route = vi.hoisted(() => ({ pathname: "/confirmation/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/features/booking/provider", () => ({ useBooking: () => booking }));
let navigation = "reload";
const originalNavigation = Object.getOwnPropertyDescriptor(
  performance,
  "getEntriesByType",
);
let finishFonts: () => void;
let frame: FrameRequestCallback | undefined;
const originalFonts = Object.getOwnPropertyDescriptor(document, "fonts");
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  booking.ready = false;
  route.pathname = "/confirmation/";
  localStorage.clear();
  sessionStorage.clear();
  navigation = "reload";
  Object.defineProperty(performance, "getEntriesByType", {
    configurable: true,
    value: () => [{ type: navigation }],
  });
  frame = undefined;
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      ready: new Promise<void>((resolve) => {
        finishFonts = resolve;
      }),
    },
  });
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      frame = callback;
      return 1;
    }),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  if (originalFonts) Object.defineProperty(document, "fonts", originalFonts);
  else Reflect.deleteProperty(document, "fonts");
  if (originalNavigation)
    Object.defineProperty(performance, "getEntriesByType", originalNavigation);
  else Reflect.deleteProperty(performance, "getEntriesByType");
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const content = (
  <>
    <main>
      <h1>Ready page</h1>
    </main>
    <footer>Footer</footer>
  </>
);

test("refresh cover survives server HTML and hydration until restored state fonts and a render frame are ready", async () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(
    <PageRefreshBoundary>{content}</PageRefreshBoundary>,
  );
  document.body.append(container);
  const cover = container.querySelector<HTMLElement>("#page-refresh")!;
  expect(cover).toHaveTextContent("Loading...");
  expect(cover.style.position).toBe("fixed");
  expect(cover.style.inset).toBe("0px");
  expect(container.querySelector("#page-refresh-content")).toHaveAttribute(
    "inert",
  );
  expect(container.querySelector("#page-refresh-content")).toHaveStyle({
    visibility: "hidden",
  });
  const view = render(<PageRefreshBoundary>{content}</PageRefreshBoundary>, {
    container,
    hydrate: true,
  });
  expect(screen.getByRole("status", { name: "Refreshing…" })).toBeVisible();
  expect(screen.getByText("Ready page")).not.toBeVisible();
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  booking.ready = true;
  view.rerender(<PageRefreshBoundary>{content}</PageRefreshBoundary>);
  expect(screen.getByRole("status")).toBeVisible();
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  await act(async () => finishFonts());
  await act(async () => vi.advanceTimersByTime(999));
  expect(frame).toBeUndefined();
  expect(screen.getByRole("status")).toBeVisible();
  await act(async () => vi.advanceTimersByTime(1));
  expect(frame).toBeDefined();
  expect(screen.getByRole("status")).toBeVisible();
  act(() => frame!(0));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("heading", { name: "Ready page" })).toBeVisible();
  expect(container.querySelector("#page-refresh-content")).not.toHaveAttribute(
    "inert",
  );
  booking.ready = false;
  view.rerender(
    <PageRefreshBoundary>
      <main>
        <h1>Next page</h1>
      </main>
    </PageRefreshBoundary>,
  );
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("heading", { name: "Next page" })).toBeVisible();
  view.unmount();
  container.remove();
});

test("refresh cleanup prevents late font and frame completions from revealing an unmounted page", async () => {
  booking.ready = true;
  const first = render(<PageRefreshBoundary>{content}</PageRefreshBoundary>);
  first.unmount();
  await act(async () => finishFonts());
  await act(async () => vi.advanceTimersByTime(1000));
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  const second = render(<PageRefreshBoundary>{content}</PageRefreshBoundary>);
  await act(async () => {});
  await act(async () => vi.advanceTimersByTime(1000));
  expect(frame).toBeDefined();
  second.unmount();
  expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  act(() => frame!(0));
  expect(document.querySelector("#page-refresh")).toBeNull();
});

test("refresh retains one cover through account calendar and confirmation checks then restores normal operation loaders", async () => {
  booking.ready = true;
  function Page({
    label,
    overlay = true,
  }: {
    label?: string;
    overlay?: boolean;
  }) {
    return (
      <BookingLoadingProvider>
        <PageRefreshBoundary>
          <main id="main">
            {label ? (
              <BookingLoading label={label} overlay={overlay} />
            ) : (
              <h1>Ready page</h1>
            )}
          </main>
        </PageRefreshBoundary>
      </BookingLoadingProvider>
    );
  }
  const view = render(<Page label="Opening booking" />);
  const cover = screen.getByRole("status", { name: "Refreshing…" });
  await act(async () => finishFonts());
  await act(async () => vi.advanceTimersByTime(1000));
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  for (const label of [
    "Checking dates…",
    "Checking payment…",
    "Payment received. Confirming booking.",
    "Preparing confirmation…",
  ]) {
    view.rerender(<Page label={label} />);
    expect(screen.getByRole("status")).toBe(cover);
    expect(document.querySelectorAll(".page-loading")).toHaveLength(1);
    expect(document.querySelector(".booking-flow-overlay")).toBeNull();
    expect(cover.closest("[inert]")).toBeNull();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  }
  // Standalone payment checks also complete inside the refresh cover.
  view.rerender(<Page label="Checking payment…" overlay={false} />);
  expect(screen.getByRole("status")).toBe(cover);
  expect(document.querySelector(".booking-loading")).toBeNull();
  view.rerender(<Page />);
  await act(async () => {});
  expect(cover).toBeVisible();
  act(() => frame!(0));
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByRole("heading", { name: "Ready page" })).toBeVisible();
  view.rerender(<Page label="Checking payment…" />);
  expect(
    screen.getByRole("status", { name: "Checking payment…" }),
  ).toBeVisible();
  expect(
    screen.getByText("Checking payment… Please do not close or refresh."),
  ).toBeVisible();
  expect(screen.queryByText("Refreshing…")).toBeNull();
});

test("normal and browser return navigation never say refreshing and preserve payment loader messages", async () => {
  booking.ready = true;
  for (const type of ["navigate", "back_forward"]) {
    navigation = type;
    function Page({ pending = true }: { pending?: boolean }) {
      return (
        <BookingLoadingProvider>
          <PageRefreshBoundary>
            <main>
              {pending ? (
                <BookingLoading label="Payment received. Confirming booking." />
              ) : (
                <h1>Ready page</h1>
              )}
            </main>
          </PageRefreshBoundary>
        </BookingLoadingProvider>
      );
    }
    const view = render(<Page />);
    const cover = screen.getByRole("status", {
      name: "Payment received. Confirming booking.",
    });
    expect(document.querySelector("#page-refresh")?.textContent).not.toContain(
      "Refreshing",
    );
    expect(document.querySelectorAll(".page-loading")).toHaveLength(1);
    expect(document.querySelector(".booking-flow-overlay")).toBeNull();
    await act(async () => finishFonts());
    await act(async () => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("status")).toBe(cover);
    expect(
      screen.getByText(
        "Payment received. Confirming booking. Please do not close or refresh.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("Refreshing…")).toBeNull();
    view.rerender(<Page pending={false} />);
    await act(async () => {});
    act(() => frame!(0));
    expect(document.querySelector("#page-refresh")).toBeNull();
    expect(screen.getByRole("heading", { name: "Ready page" })).toBeVisible();
    expect(document.querySelector(".booking-flow-overlay")).toBeNull();
    view.unmount();
  }
});

test("homepage revisits retain one neutral cover through image decoding without replaying first arrival", async () => {
  navigation = "navigate";
  route.pathname = "/";
  booking.ready = true;
  let decode: () => void;
  const image = (
    <div className="arena-photograph">
      <img alt="Hero" />
    </div>
  );
  const view = render(<PageRefreshBoundary>{image}</PageRefreshBoundary>);
  await act(async () => finishFonts());
  await act(async () => vi.advanceTimersByTime(1000));
  act(() => frame!(0));
  expect(document.getElementById("page-refresh-content")).toHaveAttribute(
    "data-home-arrival",
    "true",
  );
  for (const from of ["/studio/", "/enquiry/", "/book/account/"]) {
    route.pathname = from;
    view.rerender(<PageRefreshBoundary>{content}</PageRefreshBoundary>);
    expect(document.getElementById("page-refresh")).toBeNull();
    frame = undefined;
    route.pathname = "/";
    view.rerender(<PageRefreshBoundary>{image}</PageRefreshBoundary>);
    const hero = screen.getByAltText("Hero");
    Object.defineProperty(hero, "decode", {
      configurable: true,
      value: () =>
        new Promise<void>((resolve) => {
          decode = resolve;
        }),
    });
    expect(
      screen.getByRole("status", { name: "Loading page" }),
    ).toHaveTextContent("Loading...");
    expect(hero).not.toBeVisible();
    expect(document.getElementById("page-refresh-content")).not.toHaveAttribute(
      "data-home-arrival",
    );
    await act(async () => vi.advanceTimersByTime(999));
    expect(frame).toBeUndefined();
    await act(async () => vi.advanceTimersByTime(1));
    expect(frame).toBeUndefined();
    await act(async () => decode!());
    act(() => frame!(0));
    expect(hero).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  }
});

test("initial player app prompt waits until page loading finishes", async () => {
  navigation = "navigate";
  route.pathname = "/";
  booking.ready = true;
  render(
    <PageRefreshBoundary>
      {content}
      <PlayerAppPrompt />
    </PageRefreshBoundary>,
  );
  expect(document.querySelector("dialog")).toBeNull();
  await act(async () => finishFonts());
  await act(async () => vi.advanceTimersByTime(1000));
  expect(document.querySelector("dialog")).toBeNull();
  act(() => frame!(0));
  expect(
    screen.getByRole("dialog", { name: "Get the Soccerbot360 Player App" }),
  ).toBeVisible();
  expect(document.querySelector(".page-loading")).toBeNull();
});
