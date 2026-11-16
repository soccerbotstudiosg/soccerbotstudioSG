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
    expect(button.classList.contains("booking-back-to-top")).toBe(
      pathname.startsWith("/book/") || pathname === "/confirmation/",
    );
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
});
