import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { PromotionPanel } from "./promotion-panel";
vi.mock("./booking-navigation", async () => {
  const { default: Link } = await import("next/link");
  return { BookingLink: Link };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
test("promotion cards reveal on pointer focus and touch without inventing studio actions and preserve full-panel destinations", () => {
  let measure!: () => void;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        measure = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    height: 600,
  } as DOMRect);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(240);
  const props = {
    id: "studio-test",
    className: "studio-row",
    index: 0,
    eyebrow: "The arena",
    title: ["Inside the", "arena."] as const,
    activeTitle: ["Step into", "the game."] as const,
    teaser: "A real ball. A whole new world.",
    description: "Full instructor guidance surrounds your group.",
    photo: { src: "/photo.jpg", alt: "Studio arena", width: 800, height: 600 },
  };
  const view = render(<PromotionPanel {...props} />);
  const panel = screen.getByRole("region", { name: "Inside the arena." });
  expect(panel).toHaveAttribute("data-active", "false");
  expect(panel).toHaveStyle({
    "--panel-height": "600px",
    "--initial-travel": "160px",
    "--expanded-travel": "160px",
  });
  expect(screen.queryByRole("link")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.getByText(props.description)).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  fireEvent.pointerEnter(panel);
  expect(panel).toHaveAttribute("data-active", "true");
  expect(screen.getByText(props.description)).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  fireEvent.pointerLeave(panel);
  expect(panel).toHaveAttribute("data-active", "false");
  act(() => panel.focus());
  expect(panel).toHaveAttribute("data-active", "true");
  fireEvent.keyDown(panel, { key: "Escape" });
  expect(panel).toHaveAttribute("data-active", "false");
  const touch = new Event("pointerdown", { bubbles: true });
  Object.defineProperty(touch, "pointerType", { value: "touch" });
  fireEvent(panel, touch);
  expect(panel).toHaveAttribute("data-active", "true");
  act(measure);
  for (const [href, actionLabel] of [
    ["/studio/", "Explore the studio"],
    ["/book/account/", "Book now"],
    ["/enquiry/", "Contact us"],
  ]) {
    view.rerender(
      <PromotionPanel {...props} href={href} actionLabel={actionLabel} />,
    );
    const link = screen.getByRole("link", { name: actionLabel });
    expect(link).toHaveAttribute("href", href.slice(0, -1));
    expect(link).toHaveClass("feature-copy");
    expect(link).toContainElement(
      screen.getByRole("heading", { name: "Inside the arena." }),
    );
    expect(panel).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).toBeNull();
  }
  view.unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});
