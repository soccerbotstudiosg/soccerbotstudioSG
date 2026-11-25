import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { KeyboardTrace, traceKeyboard } from "./keyboard-trace";

test("keyboard recorder requires opt-in and Start and exports geometry without field contents", async () => {
  window.history.replaceState({}, "", "/enquiry/");
  const off = render(<KeyboardTrace />);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  off.unmount();
  window.history.replaceState(
    {},
    "",
    "/enquiry/?keyboardTrace=1&email=secret-query",
  );
  const frameCallbacks: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frameCallbacks.push(callback);
    return frameCallbacks.length;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const viewport = Object.assign(new EventTarget(), {
    height: 900,
    width: 768,
    offsetTop: 0,
    scale: 1,
  });
  vi.stubGlobal("visualViewport", viewport);
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  const view = render(
    <>
      <KeyboardTrace />
      <input
        aria-label="Test field"
        id="secret-id"
        defaultValue="secret-value"
      />
    </>,
  );
  const field = screen.getByRole("textbox", { name: "Test field" });
  traceKeyboard("before-start");
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  fireEvent.focusIn(field);
  fireEvent.change(field, { target: { value: "secret-typed" } });
  viewport.dispatchEvent(new Event("resize"));
  viewport.height = 640; // Native geometry can update AFTER its resize event.
  act(() => {
    frameCallbacks.shift()!(0);
  });
  traceKeyboard(
    "recovery:scroll",
    { keyboardOpen: false, closing: true, fullHeight: 900, delta: -76 },
    field,
  );
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  const output = (
    screen.getByRole("textbox", {
      name: "Recorded keyboard trace",
    }) as HTMLTextAreaElement
  ).value;
  const trace = JSON.parse(output);
  expect(output).not.toMatch(/secret-|before-start/);
  expect(
    trace.events.find(
      (event: { event: string }) => event.event === "viewport:resize",
    ).viewport.height,
  ).toBe(900);
  expect(
    trace.events.find(
      (event: { event: string }) => event.event === "animation-frame:1",
    ).viewport.height,
  ).toBe(640);
  expect(
    trace.events.find(
      (event: { event: string }) => event.event === "recovery:scroll",
    ),
  ).toMatchObject({
    recovery: { closing: true, delta: -76 },
    tracked: { tag: "INPUT" },
  });
  traceKeyboard("after-stop");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Copy trace" }));
  });
  expect(writeText).toHaveBeenCalledExactlyOnceWith(output);
  expect(screen.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(output).not.toContain("after-stop");
  view.unmount();
  window.history.replaceState({}, "", "/");
  vi.unstubAllGlobals();
});

test("keyboard recorder bounds memory and offers a selectable trace when clipboard is unavailable", async () => {
  window.history.replaceState({}, "", "/enquiry/?keyboardTrace=1");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: undefined,
  });
  const view = render(<KeyboardTrace />);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  for (let i = 0; i < 1300; i++) traceKeyboard("recovery:check");
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  const area = screen.getByRole("textbox", {
    name: "Recorded keyboard trace",
  }) as HTMLTextAreaElement;
  const trace = JSON.parse(area.value);
  expect(trace.events).toHaveLength(1200);
  expect(trace.dropped).toBe(102);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Copy trace" }));
  });
  expect(area.readOnly).toBe(true);
  fireEvent.focus(area);
  expect(area.selectionEnd - area.selectionStart).toBe(area.value.length);
  fireEvent.click(screen.getByRole("button", { name: "Start" }));
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  expect(
    JSON.parse(
      (
        screen.getByRole("textbox", {
          name: "Recorded keyboard trace",
        }) as HTMLTextAreaElement
      ).value,
    ).events,
  ).toHaveLength(2);
  view.unmount();
  window.history.replaceState({}, "", "/");
});
