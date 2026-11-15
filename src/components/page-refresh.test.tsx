import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PageRefreshBoundary } from "./page-refresh";

const booking = vi.hoisted(() => ({ ready: false }));
vi.mock("@/features/booking/provider", () => ({ useBooking: () => booking }));
let finishFonts: () => void;
let frame: FrameRequestCallback | undefined;
const originalFonts = Object.getOwnPropertyDescriptor(document, "fonts");
beforeEach(() => {
  booking.ready = false;
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
