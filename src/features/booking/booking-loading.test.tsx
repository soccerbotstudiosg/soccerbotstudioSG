import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { PendingConfirmation } from "./confirmation-step";
import { BookingLoading, BookingLoadingProvider } from "./booking-loading";

beforeEach(() =>
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] }),
);
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test("overlapping booking reads share one full-page loader and preserve the mounted form", () => {
  function Screen({ first, second }: { first: boolean; second: boolean }) {
    return (
      <BookingLoadingProvider>
        <input aria-label="Contact name" defaultValue="" />
        {first && <BookingLoading label="Preparing booking" />}
        {second && <BookingLoading label="Reading calendar" />}
      </BookingLoadingProvider>
    );
  }
  const initialHtml = document.createElement("div");
  initialHtml.innerHTML = renderToString(
    <BookingLoadingProvider>
      <PendingConfirmation />
    </BookingLoadingProvider>,
  );
  expect(initialHtml.querySelectorAll(".page-loading")).toHaveLength(1);
  expect(initialHtml.querySelector('[role="status"]')).toHaveAttribute(
    "aria-label",
    "Checking booking…",
  );
  const view = render(<Screen first={false} second={false} />);
  const input = screen.getByLabelText("Contact name");
  fireEvent.change(input, { target: { value: "Retained name" } });
  view.rerender(<Screen first second={false} />);
  expect(document.querySelectorAll(".booking-flow-overlay")).toHaveLength(1);
  expect(screen.getByRole("status")).toHaveTextContent("Loading...");
  view.rerender(<Screen first={false} second />);
  expect(document.querySelectorAll(".booking-flow-overlay")).toHaveLength(1);
  expect(
    screen.getByRole("status", { name: "Reading calendar" }),
  ).toBeVisible();
  expect(screen.getByLabelText("Contact name")).toBe(input);
  view.rerender(<Screen first second />);
  expect(document.querySelectorAll(".page-loading")).toHaveLength(1);
  expect(screen.queryByText("Please do not close or refresh.")).toBeNull();
  expect(document.querySelector(".booking-loading-inline")).toBeNull();
  expect(input.parentElement).toHaveAttribute("inert");
  view.rerender(<Screen first={false} second />);
  expect(
    screen.getByRole("status", { name: "Reading calendar" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Contact name")).toBe(input);
  view.rerender(<Screen first={false} second={false} />);
  expect(document.querySelector(".page-loading")).not.toBeNull();
  act(() => vi.advanceTimersByTime(999));
  expect(document.querySelector(".page-loading")).not.toBeNull();
  expect(input.parentElement).toHaveAttribute("inert");
  act(() => vi.advanceTimersByTime(1));
  expect(document.querySelector(".page-loading")).toBeNull();
  expect(input).toHaveValue("Retained name");
  expect(input.parentElement).not.toHaveAttribute("inert");
  // A new episode gets its own minimum; slow work adds no extra delay.
  view.rerender(<Screen first second={false} />);
  act(() => vi.advanceTimersByTime(1500));
  expect(document.querySelector(".page-loading")).not.toBeNull();
  view.rerender(<Screen first={false} second={false} />);
  act(() => vi.advanceTimersByTime(0));
  expect(document.querySelector(".page-loading")).toBeNull();
  expect(input.parentElement).not.toHaveAttribute("inert");
  // Recovery feedback survives the calendar handoff, but not a new episode.
  for (const label of [
    "Checking payment…",
    "Some sessions may no longer be available.",
  ]) {
    view.rerender(
      <BookingLoadingProvider>
        <BookingLoading label="Reading calendar" />
        <BookingLoading label={label} />
      </BookingLoadingProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      `${label} Please do not close or refresh.`,
    );
    view.rerender(
      <BookingLoadingProvider>
        <BookingLoading label="Reading calendar" />
      </BookingLoadingProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      `${label} Please do not close or refresh.`,
    );
    expect(screen.queryByText("Loading...")).toBeNull();
    view.rerender(<BookingLoadingProvider>{null}</BookingLoadingProvider>);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByRole("status")).toBeNull();
    view.rerender(
      <BookingLoadingProvider>
        <BookingLoading label="Reading calendar" />
      </BookingLoadingProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading...");
    view.rerender(<BookingLoadingProvider>{null}</BookingLoadingProvider>);
    act(() => vi.advanceTimersByTime(1000));
  }
});

test("unmounting a pending booking screen releases the overlay and existing page inert state", () => {
  const main = document.createElement("main");
  main.id = "main";
  main.inert = false;
  document.body.append(main);
  const view = render(
    <BookingLoadingProvider>
      <BookingLoading label="Checking booking" />
    </BookingLoadingProvider>,
    { container: main },
  );
  expect(main.inert).toBe(true);
  view.unmount();
  expect(main.inert).toBe(false);
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  main.remove();
});

test("display loading leaves navigation interactive while payment loading still locks the page", () => {
  const view = render(
    <BookingLoadingProvider>
      <button>Guest</button>
      <BookingLoading compact overlay={false} label="Reading calendar" />
    </BookingLoadingProvider>,
  );
  const button = screen.getByRole("button", { name: "Guest" });
  expect(button.closest("[inert]")).toBeNull();
  expect(document.querySelector(".booking-flow-overlay")).toBeNull();
  expect(screen.getByRole("status")).toHaveClass("booking-loading-inline");
  expect(screen.getByRole("status")).toHaveTextContent("Loading...");
  view.rerender(
    <BookingLoadingProvider>
      <button>Guest</button>
      <BookingLoading compact overlay={false} label="Reading calendar" />
      <BookingLoading compact label="Opening checkout…" />
    </BookingLoadingProvider>,
  );
  expect(button.closest("[inert]")).not.toBeNull();
  expect(document.querySelectorAll(".booking-flow-overlay")).toHaveLength(1);
  view.rerender(
    <BookingLoadingProvider>
      <BookingLoading label="Preparing confirmation…" />
    </BookingLoadingProvider>,
  );
  expect(screen.getByText(/Please do not close or refresh/)).toBeVisible();
  for (const label of [
    "Some sessions may no longer be available.",
    "You may already have an active checkout.",
  ]) {
    view.rerender(
      <BookingLoadingProvider>
        <BookingLoading label={label} />
      </BookingLoadingProvider>,
    );
    expect(
      screen.getByText(`${label} Please do not close or refresh.`),
    ).toBeVisible();
    expect(document.querySelectorAll(".booking-flow-overlay")).toHaveLength(1);
  }
});
