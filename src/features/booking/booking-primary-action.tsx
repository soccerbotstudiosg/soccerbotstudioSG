"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Float one existing action only until its reserved document position is reached. */
export function BookingPrimaryAction({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const position = anchor.current;
    const control = action.current;
    if (
      !position ||
      !control ||
      typeof window.matchMedia !== "function" ||
      !("ResizeObserver" in window)
    )
      return;
    const mobile = matchMedia("(max-width: 700px)");
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!mobile.matches) {
        position.style.minHeight = "";
        control.dataset.floating = "false";
        return;
      }
      const style = getComputedStyle(position);
      const spacing =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      position.style.minHeight = `${control.getBoundingClientRect().height + spacing}px`;
      control.dataset.floating = String(
        position.getBoundingClientRect().bottom > window.innerHeight,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(control);
    if (position.parentElement) observer.observe(position.parentElement);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    mobile.addEventListener("change", schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mobile.removeEventListener("change", schedule);
    };
  }, []);
  return (
    <div className="booking-action-anchor" ref={anchor}>
      <div
        className={`booking-primary-action ${className}`.trim()}
        data-floating="false"
        ref={action}
      >
        {children}
      </div>
    </div>
  );
}
