import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { PromotionPanel, PromotionBanner } from "./promotion-panel";
import { SectionReveals } from "./section-reveals";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("./booking-navigation", async () => {
  const { default: Link } = await import("next/link");
  return { BookingLink: Link };
});
const originalHitTest = Object.getOwnPropertyDescriptor(
  document,
  "elementFromPoint",
);
afterEach(() => {
  cleanup();
  if (originalHitTest)
    Object.defineProperty(document, "elementFromPoint", originalHitTest);
  else Reflect.deleteProperty(document, "elementFromPoint");
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
    top: 100,
    bottom: 700,
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
  expect(panel.querySelector(".promotion-edge")).toBeNull();
  expect(panel).toHaveStyle({
    "--panel-height": "600px",
    "--initial-travel": "160px",
    "--expanded-travel": "160px",
  });
  expect(panel.querySelector(".feature-chevron")).toBeNull();
  expect(panel.querySelector(".feature-circuits")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
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
  vi.stubGlobal("scrollY", 1000);
  fireEvent.scroll(window);
  expect(panel).toHaveAttribute("data-active", "false");
  fireEvent.pointerEnter(panel);
  vi.stubGlobal("scrollY", 800);
  fireEvent.scroll(window);
  expect(panel).toHaveAttribute("data-active", "true");
  fireEvent.pointerLeave(panel);
  expect(panel).toHaveAttribute("data-active", "false");
  let frame!: FrameRequestCallback;
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    frame = callback;
    return 1;
  });
  vi.stubGlobal("requestAnimationFrame", requestFrame);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const hitTest = vi.fn().mockReturnValue(panel);
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: hitTest,
  });
  const move = new MouseEvent("pointermove", { clientX: 100, clientY: 150 });
  Object.defineProperty(move, "pointerType", { value: "mouse" });
  fireEvent(window, move);
  fireEvent.scroll(window);
  fireEvent.scroll(window);
  expect(requestFrame).toHaveBeenCalledOnce();
  act(() => frame(0));
  expect(hitTest).toHaveBeenCalledExactlyOnceWith(100, 150);
  expect(panel).toHaveAttribute("data-active", "true");
  // Scroll under a stationary cursor, without any enter/leave event from Edge.
  hitTest.mockReturnValue(document.body);
  fireEvent.scroll(window);
  expect(requestFrame).toHaveBeenCalledTimes(2);
  act(() => frame(16));
  expect(panel).toHaveAttribute("data-active", "false");
  hitTest.mockReturnValue(panel);
  fireEvent.scroll(window);
  expect(requestFrame).toHaveBeenCalledTimes(3);
  act(() => frame(32));
  expect(panel).toHaveAttribute("data-active", "true");
  fireEvent(window, new Event("blur"));
  expect(panel).toHaveAttribute("data-active", "false");
  act(() => panel.focus());
  expect(panel).toHaveAttribute("data-active", "true");
  fireEvent.blur(panel);
  expect(panel).toHaveAttribute("data-active", "false");
  fireEvent.focus(panel);
  fireEvent.keyDown(panel, { key: "Escape" });
  expect(panel).toHaveAttribute("data-active", "false");
  const touch = new Event("pointerdown", { bubbles: true });
  Object.defineProperty(touch, "pointerType", { value: "touch" });
  fireEvent(panel, touch);
  const framesBeforeTouchScroll = requestFrame.mock.calls.length;
  fireEvent.scroll(window);
  expect(requestFrame).toHaveBeenCalledTimes(framesBeforeTouchScroll);
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
    const photoLink = screen.getByRole("link", {
      name: `Photo — ${actionLabel}`,
    });
    expect(photoLink).toHaveAttribute("href", href.slice(0, -1));
    expect(photoLink.querySelector("img")).not.toBeNull();
    expect(
      Array.from(panel.querySelectorAll(".feature-chevron path"), (path) =>
        path.getAttribute("d"),
      ),
    ).toEqual(["M0 0h3l8 9-8 9H0l8-9Z", "M14 0h3l8 9-8 9h-3l8-9Z"]);
    expect(panel.querySelector(".feature-circuits")).toBeNull();
    expect(panel.querySelector(".feature-heading .feature-arrow")).toBeNull();
    expect(panel.querySelector(".feature-action-cue")).toHaveTextContent(
      actionLabel,
    );
    expect(panel).toHaveAttribute("data-clickable", "true");
    expect(link).toContainElement(
      screen.getByRole("heading", { name: "Inside the arena." }),
    );
    expect(panel).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).toBeNull();
  }
  const removeMediaListener = vi.fn();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: removeMediaListener,
  }));
  const phone = render(
    <PromotionPanel {...props} id="phone-panel" title={["Mobile", "arena"]} />,
  );
  const phonePanel = screen.getByRole("region", { name: "Mobile arena" });
  expect(phonePanel).toHaveAttribute("data-active", "true");
  fireEvent.pointerLeave(phonePanel);
  fireEvent.keyDown(phonePanel, { key: "Escape" });
  expect(phonePanel).toHaveAttribute("data-active", "true");
  phone.unmount();
  expect(removeMediaListener).toHaveBeenCalledOnce();
  fireEvent(window, move);
  view.unmount();
  expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  expect(disconnect).toHaveBeenCalledTimes(2);
});

test("compact closing banners group their content and expose one action per viewport", () => {
  let reveal!: IntersectionObserverCallback;
  const observe = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        reveal = callback;
      }
      observe = observe;
      unobserve() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: window.innerHeight + 100,
    height: 120,
  } as DOMRect);
  for (const mobile of [false, true]) {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("max-width") && mobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    for (const [href, actionLabel] of [
      ["/enquiry/", "Enquire"],
      ["/book/account/", "Book now"],
    ]) {
      observe.mockClear();
      const view = render(
        <main id="main">
          <PromotionBanner
            id="banner-title"
            className="studio-bottom"
            eyebrow="Step into the arena"
            title="Your move."
            description="Full instructor guidance for your group."
            href={href}
            actionLabel={actionLabel}
          />
          <SectionReveals />
        </main>,
      );
      const link = screen.getByRole("link", { name: actionLabel });
      expect(link).toHaveAttribute("href", href.slice(0, -1));
      if (mobile) {
        expect(link).toHaveClass("button", "promotion-cta");
        expect(link.querySelector("svg")).toBeNull();
        expect(link).not.toContainElement(
          screen.getByRole("heading", { name: "Your move." }),
        );
        expect(link.parentElement?.children).toHaveLength(3);
      } else {
        expect(link.children).toHaveLength(3);
        expect(link).toContainElement(
          screen.getByRole("heading", { name: "Your move." }),
        );
        expect(link.querySelector(".abstract-promotion-action svg")).toBeNull();
        expect(link.querySelector(".button")).toBeNull();
      }
      expect(screen.getAllByRole("link")).toHaveLength(1);
      const banner = link.closest(
        ".abstract-promotion-mobile, .abstract-promotion-link",
      )!;
      expect(observe).toHaveBeenCalledExactlyOnceWith(banner);
      expect(link.closest("section")).not.toHaveClass("section-reveal-pending");
      expect(banner).toHaveClass("section-reveal-pending");
      expect(banner.querySelector(".section-reveal-pending")).toBeNull();
      act(() =>
        reveal(
          [
            {
              target: banner,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: banner.getBoundingClientRect(),
              intersectionRect: banner.getBoundingClientRect(),
              rootBounds: null,
              time: 0,
            },
          ],
          {} as IntersectionObserver,
        ),
      );
      expect(banner).toHaveClass("section-reveal");
      fireEvent.focusIn(link);
      expect(banner).not.toHaveClass(
        "section-reveal",
        "section-reveal-pending",
      );
      view.unmount();
    }
  }
});
