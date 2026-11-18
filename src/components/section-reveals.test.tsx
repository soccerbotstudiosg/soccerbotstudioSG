import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Link from "next/link";
import { BackToTop } from "./section-reveals";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("all routes show one chevron on scroll and hide after three idle seconds with focus and reduced motion", () => {
  vi.useFakeTimers();
  let position = 0;
  let reduced = false;
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => position);
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
  const view = render(
    <>
      <header className="site-header">
        <Link className="brand" href="/">
          Home
        </Link>
      </header>
      <BackToTop />
    </>,
  );
  for (const pathname of [
    "/",
    "/studio/",
    "/enquiry/",
    "/book/account/",
    "/book/session/",
    "/book/time/",
    "/book/details/",
    "/book/review/",
    "/book/payment/",
    "/confirmation/",
  ]) {
    route.pathname = pathname;
    position = 0;
    view.rerender(
      <>
        <header className="site-header">
          <Link className="brand" href="/">
            Home
          </Link>
        </header>
        <BackToTop />
      </>,
    );
    fireEvent.scroll(window);
    expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
    act(() => {
      position = 1;
      fireEvent.scroll(window);
    });
    const button = screen.getByRole("button", { name: "Back to top" });
    expect(button).toHaveClass("back-to-top");
    expect(button.querySelectorAll("svg path")).toHaveLength(1);
    expect(button.querySelector("svg path")).toHaveAttribute(
      "d",
      "m9 6 6 6-6 6",
    );
    expect(screen.getAllByRole("button", { name: "Back to top" })).toHaveLength(
      1,
    );
    expect(button.className).toBe("back-to-top");
    expect(button.style.top).toBe("");
    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByRole("button", { name: "Back to top" })).toBeVisible();
    fireEvent.scroll(window);
    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByRole("button", { name: "Back to top" })).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));
    expect(scroll).toHaveBeenLastCalledWith({
      top: 0,
      behavior: reduced ? "auto" : "smooth",
    });
    expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();
    act(() => {
      position = 0;
      fireEvent.scroll(window);
    });
    expect(screen.queryByRole("button", { name: "Back to top" })).toBeNull();
    reduced = !reduced;
  }
  route.pathname = "/book/session/";
  let actionTop = window.innerHeight - 80;
  let paintedBottom = window.innerHeight - 24;
  const computedStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const style = computedStyle(element, pseudo);
    if (element.classList.contains("back-to-top"))
      Object.defineProperty(style, "bottom", { value: "24px" });
    return style;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      if (this.classList.contains("back-to-top"))
        return {
          left: 300,
          right: 348,
          top: paintedBottom - 48,
          bottom: paintedBottom,
          height: 48,
        } as DOMRect;
      if (this.classList.contains("button"))
        return {
          left: 20,
          right: 370,
          top: actionTop,
          bottom: actionTop + 58,
        } as DOMRect;
      return {} as DOMRect;
    },
  );
  view.rerender(
    <>
      <div className="booking-primary-action">
        <Link className="button" href="/book/time/">
          Choose sessions
        </Link>
      </div>
      <BackToTop />
    </>,
  );
  position = 100;
  fireEvent.scroll(window);
  expect(screen.getAllByRole("button", { name: "Back to top" })).toHaveLength(
    1,
  );
  expect(
    screen
      .getByRole("button", { name: "Back to top" })
      .style.getPropertyValue("--back-to-top-clearance"),
  ).toBe("68px");
  // A later measurement can see the previously painted lifted rectangle.
  paintedBottom = window.innerHeight - 92;
  fireEvent.resize(window);
  expect(
    screen
      .getByRole("button", { name: "Back to top" })
      .style.getPropertyValue("--back-to-top-clearance"),
  ).toBe("68px");
  actionTop = window.innerHeight - 80.25;
  fireEvent.resize(window);
  expect(
    Number.parseFloat(
      screen
        .getByRole("button", { name: "Back to top" })
        .style.getPropertyValue("--back-to-top-clearance"),
    ),
  ).toBeGreaterThanOrEqual(68.25);
  // Consecutive scroll events retain clearance before the visitor releases.
  for (let index = 0; index < 5; index += 1) {
    position += 1;
    fireEvent.scroll(window);
    expect(
      screen
        .getByRole("button", { name: "Back to top" })
        .style.getPropertyValue("--back-to-top-clearance"),
    ).toBe("69px");
  }
  actionTop = 200;
  fireEvent.scroll(window);
  expect(
    screen
      .getByRole("button", { name: "Back to top" })
      .style.getPropertyValue("--back-to-top-clearance"),
  ).toBe("");
});
