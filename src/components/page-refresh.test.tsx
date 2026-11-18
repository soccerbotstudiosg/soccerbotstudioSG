import { act, cleanup, render, screen } from "@testing-library/react";
import { runInNewContext } from "node:vm";
import { documentNavigationScript } from "./document-navigation";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  BookingLoading,
  BookingLoadingProvider,
} from "@/features/booking/booking-loading";
import { PlayerAppPrompt } from "./player-app-prompt";
import { PageRefreshBoundary } from "./page-refresh";

const booking = vi.hoisted(() => ({ ready: false }));
const route = vi.hoisted(() => ({
  pathname: "/confirmation/",
  started: undefined as number | undefined,
}));
vi.mock("./booking-navigation", () => ({
  useNavigationStarted: () => route.started,
  useBookingEntryTransition: () => false,
}));
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
  route.started = undefined;
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
  expect(cover).toHaveTextContent(
    "Checking payment… Please do not close or refresh.",
  );
  for (const type of ["reload", "navigate", "back_forward"]) {
    const root = { dataset: {} as Record<string, string> };
    runInNewContext(documentNavigationScript, {
      document: { documentElement: root },
      performance: { getEntriesByType: () => [{ type }] },
    });
    expect(root.dataset.documentNavigation).toBe(type);
  }
  expect(cover.querySelector(".document-reload-message")).toHaveTextContent(
    "Refreshing…",
  );
  expect(cover.querySelector(".document-navigation-message")).toHaveTextContent(
    "Checking payment…",
  );
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
  // An initial protected-route redirect must not uncover unrestored booking state.
  route.pathname = "/book/account/";
  view.rerender(<PageRefreshBoundary>{content}</PageRefreshBoundary>);
  expect(screen.getByRole("status", { name: "Refreshing…" })).toBeVisible();
  expect(screen.getByText("Ready page")).not.toBeVisible();
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
  for (const [type, pathname] of [
    ["navigate", "/confirmation/"],
    ["back_forward", "/confirmation/"],
    ["back_forward", "/book/review/"],
  ]) {
    navigation = type;
    route.pathname = pathname;
    function Page({
      pending = true,
      label = "Payment received. Confirming booking.",
    }: {
      pending?: boolean;
      label?: string;
    }) {
      return (
        <BookingLoadingProvider>
          <PageRefreshBoundary>
            <main>
              {pending ? <BookingLoading label={label} /> : <h1>Ready page</h1>}
            </main>
          </PageRefreshBoundary>
        </BookingLoadingProvider>
      );
    }
    const view = render(<Page pending={false} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking payment… Please do not close or refresh.",
    );
    expect(screen.queryByText("Loading...", { exact: true })).toBeNull();
    view.rerender(<Page label="Preparing booking…" />);
    expect(
      screen.getByRole("status", { name: "Checking payment…" }),
    ).toBeVisible();
    view.rerender(<Page label="Processing payment" />);
    expect(
      screen.getByRole("status", { name: "Processing payment" }),
    ).toBeVisible();
    expect(document.querySelectorAll(".page-loading")).toHaveLength(1);
    view.rerender(<Page label="Opening checkout…" />);
    view.rerender(<Page label="Preparing booking…" />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Opening checkout… Please do not close or refresh.",
    );
    expect(screen.queryByText("Loading...", { exact: true })).toBeNull();
    view.rerender(<Page />);
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
    expect(screen.getByRole("status")).toHaveTextContent(
      "Payment received. Confirming booking. Please do not close or refresh.",
    );
    expect(screen.queryByText("Loading...", { exact: true })).toBeNull();
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
  let deferDecode = false;
  const image = (
    <div className="arena-photograph">
      <img
        alt="Hero"
        ref={(node) => {
          if (node)
            Object.defineProperty(node, "decode", {
              configurable: true,
              value: () =>
                deferDecode
                  ? new Promise<void>((resolve) => {
                      decode = resolve;
                    })
                  : Promise.resolve(),
            });
        }}
      />
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
    if (from === "/studio/") {
      frame = undefined;
      await act(async () => vi.advanceTimersByTime(999));
      expect(frame).toBeUndefined();
      expect(screen.getByRole("status")).toBeVisible();
      await act(async () => vi.advanceTimersByTime(1));
      act(() => frame!(0));
    }
    expect(document.getElementById("page-refresh")).toBeNull();
    frame = undefined;
    route.pathname = "/";
    deferDecode = true;
    view.rerender(<PageRefreshBoundary>{image}</PageRefreshBoundary>);
    const hero = screen.getByAltText("Hero");
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
  // A cached Home shares the click clock, including time spent before arrival.
  route.pathname = "/studio/";
  view.rerender(<PageRefreshBoundary>{content}</PageRefreshBoundary>);
  frame = undefined;
  deferDecode = false;
  route.started = performance.now() - 600;
  route.pathname = "/";
  view.rerender(<PageRefreshBoundary>{image}</PageRefreshBoundary>);
  await act(async () => vi.advanceTimersByTime(399));
  expect(frame).toBeUndefined();
  expect(screen.getByRole("status", { name: "Loading page" })).toBeVisible();
  await act(async () => vi.advanceTimersByTime(1));
  expect(frame).toBeDefined();
  act(() => frame!(0));
  expect(screen.queryByRole("status")).toBeNull();
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
