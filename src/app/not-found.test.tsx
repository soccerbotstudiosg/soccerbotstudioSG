import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import NotFound from "./not-found";
vi.mock("@/components/site-shell", () => ({ useStandalonePage: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test("404 tiles scatter with pointer travel settle back and respect reduced motion while Home stays accessible", () => {
  let positions: number[][] = [];
  let bright: number[][] = [];
  const context = {
    clearRect: () => {
      positions = [];
      bright = [];
    },
    save: () => {},
    restore: () => {},
    translate: (x: number, y: number) => positions.push([x, y]),
    rotate: () => {},
    scale: () => {},
    globalAlpha: 1,
    fillRect: (_x: number, _y: number, width: number, height: number) => {
      if (context.globalAlpha >= 0.7 && height > 1)
        bright.push([...positions[positions.length - 1], width]);
    },
    setTransform: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  const bounds = vi
    .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
    .mockReturnValue({ width: 1000, height: 700, left: 0, top: 0 } as DOMRect);
  let sequence = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++sequence, callback);
    return sequence;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect = disconnect;
    },
  );
  let change!: () => void;
  const media = {
    matches: false,
    addEventListener: (_: string, callback: () => void) => {
      change = callback;
    },
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", () => media);
  const interval = vi.spyOn(window, "setInterval");
  const clearInterval = vi.spyOn(window, "clearInterval");
  let time = 100;
  vi.spyOn(performance, "now").mockImplementation(() => time);
  const view = render(<NotFound />);
  const canvas = view.container.querySelector("canvas")!;
  expect(canvas.dataset.ready).toBe("true");
  expect(positions.length).toBeGreaterThan(100);
  const original = positions.map((point) => [...point]);
  const home = screen.getByRole("link", { name: "Back to home" });
  expect(home).toHaveAttribute("href", "/");
  home.focus();
  expect(home).toHaveFocus();
  const [x, y] = original[300];
  fireEvent(
    canvas,
    new MouseEvent("pointermove", { clientX: x - 7, clientY: y }),
  );
  fireEvent(canvas, new MouseEvent("pointermove", { clientX: x, clientY: y }));
  const tick = () => {
    const pending = [...frames.values()];
    frames.clear();
    time += 1000 / 60;
    for (const callback of pending) callback(time);
  };
  act(tick);
  expect(
    positions.some(
      (point, index) =>
        Math.abs(point[0] - original[index][0]) > 0.1 ||
        Math.abs(point[1] - original[index][1]) > 0.1,
    ),
  ).toBe(true);
  fireEvent.pointerLeave(canvas);
  for (let index = 0; index < 240 && frames.size; index++) act(tick);
  expect(frames.size).toBe(1);
  const moved = () =>
    positions.filter(
      (point, index) =>
        Math.hypot(
          point[0] - original[index][0],
          point[1] - original[index][1],
        ) > 12,
    ).length;
  // Sweep the scene so eligible fragments move while the anchored majority returns.
  for (const [px, py] of original.filter((_, index) => index % 8 === 0)) {
    fireEvent(
      canvas,
      new MouseEvent("pointermove", { clientX: px - 30, clientY: py }),
    );
    fireEvent(
      canvas,
      new MouseEvent("pointermove", { clientX: px, clientY: py }),
    );
  }
  fireEvent.pointerLeave(canvas);
  for (let index = 0; index < 240 && frames.size; index++) act(tick);
  expect(frames.size).toBe(1);
  expect(moved()).toBeGreaterThan(0);
  expect(moved()).toBeLessThan(original.length / 3);
  const settled = positions.map((point) => [...point]);
  act(tick);
  expect(positions).not.toEqual(settled);
  expect(
    Math.max(
      ...positions.map((point, index) =>
        Math.hypot(point[0] - settled[index][0], point[1] - settled[index][1]),
      ),
    ),
  ).toBeLessThan(1);
  const displacedBeforeRegroup = moved();
  expect(interval).toHaveBeenCalledWith(expect.any(Function), 7000);
  act(() => (interval.mock.calls[0][0] as () => void)());
  for (let index = 0; index < 240 && frames.size; index++) act(tick);
  expect(frames.size).toBe(1);
  expect(moved()).toBeLessThan(displacedBeforeRegroup);
  expect(moved()).toBeGreaterThan(0);

  act(() => {
    media.matches = true;
    change();
  });
  fireEvent(canvas, new MouseEvent("pointermove", { clientX: x, clientY: y }));
  expect(frames.size).toBe(0);
  act(() => {
    media.matches = false;
    change();
  });
  fireEvent(canvas, new MouseEvent("pointermove", { clientX: x, clientY: y }));
  bounds.mockReturnValue({
    width: 390,
    height: 844,
    left: 0,
    top: 0,
  } as DOMRect);
  act(change);
  // The two fours have14 tiles each; the zero has20 at the phone resolution.
  expect(bright).toHaveLength(48);
  const minX = Math.min(...bright.map(([px, , size]) => px - size / 2));
  const maxX = Math.max(...bright.map(([px, , size]) => px + size / 2));
  expect(maxX - minX).toBeGreaterThan(240);
  expect(maxX - minX).toBeLessThan(300);
  expect(minX).toBeGreaterThan(20);
  expect(maxX).toBeLessThan(370);
  expect(Math.max(...bright.map(([, py, size]) => py + size / 2))).toBeLessThan(
    390,
  );
  const phoneOrigin = positions.map((point) => [...point]);
  const target = bright[20];
  const targetIndex = positions.findIndex(
    ([px, py]) => px === target[0] && py === target[1],
  );
  const event = new MouseEvent("pointerdown", {
    clientX: target[0],
    clientY: target[1],
  });
  Object.defineProperty(event, "pointerType", { value: "touch" });
  const tappedAt = time;
  fireEvent(canvas, event);
  for (let index = 0; index < 180; index++) act(tick);
  const distanceFromOrigin = () =>
    Math.hypot(
      positions[targetIndex][0] - phoneOrigin[targetIndex][0],
      positions[targetIndex][1] - phoneOrigin[targetIndex][1],
    );
  expect(distanceFromOrigin()).toBeGreaterThan(40);
  // The global digit regroup must not shorten a touch tile's own seven-second hold.
  act(() => (interval.mock.calls[0][0] as () => void)());
  time = tappedAt + 6900;
  act(tick);
  expect(distanceFromOrigin()).toBeGreaterThan(40);
  time = tappedAt + 7000;
  for (let index = 0; index < 180; index++) act(tick);
  expect(distanceFromOrigin()).toBeLessThan(8);
  expect(
    Math.max(
      ...positions.map((point, index) =>
        Math.hypot(
          point[0] - phoneOrigin[index][0],
          point[1] - phoneOrigin[index][1],
        ),
      ),
    ),
  ).toBeLessThan(10);
  expect(frames.size).toBe(1);
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(frames.size).toBe(0);
  hidden.mockReturnValue(false);
  fireEvent(document, new Event("visibilitychange"));
  expect(frames.size).toBe(1);
  act(() => {
    media.matches = true;
    change();
  });
  const staticPositions = positions.map((point) => [...point]);
  fireEvent(canvas, event);
  act(tick);
  expect(positions).toEqual(staticPositions);
  expect(frames.size).toBe(0);
  view.unmount();
  expect(frames.size).toBe(0);
  expect(disconnect).toHaveBeenCalled();
  expect(clearInterval).toHaveBeenCalled();
  expect(media.removeEventListener).toHaveBeenCalled();
});
