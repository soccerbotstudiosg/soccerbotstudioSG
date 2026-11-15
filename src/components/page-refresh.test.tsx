import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  BookingLoading,
  BookingLoadingProvider,
} from "@/features/booking/booking-loading";
import { PageRefreshBoundary } from "./page-refresh";

const booking = vi.hoisted(() => ({ ready: false }));
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
  booking.ready = false;
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
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  const second = render(<PageRefreshBoundary>{content}</PageRefreshBoundary>);
  await act(async () => {});
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
    const view = render(
      <BookingLoadingProvider>
        <PageRefreshBoundary>
          <main>
            <BookingLoading label="Payment received. Confirming booking." />
          </main>
        </PageRefreshBoundary>
      </BookingLoadingProvider>,
    );
    expect(document.querySelector("#page-refresh")?.textContent).not.toContain(
      "Refreshing",
    );
    await act(async () => finishFonts());
    act(() => frame!(0));
    expect(document.querySelector("#page-refresh")).toBeNull();
    expect(
      screen.getByRole("status", {
        name: "Payment received. Confirming booking.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Payment received. Confirming booking. Please do not close or refresh.",
      ),
    ).toBeVisible();
    view.unmount();
  }
});
