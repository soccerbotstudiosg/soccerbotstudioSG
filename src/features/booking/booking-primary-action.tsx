"use client";
import { totalCents } from "@/domain/booking";
import { money } from "@/domain/dates";
import { useBooking } from "./provider";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Float one existing action only until its reserved document position is reached. */
export function BookingPrimaryAction({
  children,
  className = "",
  ready,
}: {
  children: ReactNode;
  className?: string;
  ready?: boolean;
}) {
  const [readiness, setReadiness] = useState({ ready, animate: false });
  if (readiness.ready !== ready)
    setReadiness({
      ready,
      animate: readiness.ready === false && ready === true,
    });
  const anchor = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const control = action.current;
    if (!control || !ready || !("IntersectionObserver" in window)) return;
    const button = control.querySelector<HTMLElement>(".button");
    if (!button) return;
    let active = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          !active ||
          !entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.75,
          )
        )
          return;
        control.dataset.halo = "true";
        active = false;
        observer.disconnect();
      },
      { threshold: 0.75 },
    );
    observer.observe(button);
    return () => {
      active = false;
      observer.disconnect();
      delete control.dataset.halo;
    };
  }, [ready]);
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
        data-ready-animation={readiness.animate ? "true" : undefined}
        ref={action}
      >
        {children}
      </div>
    </div>
  );
}

/** Show the selected-session total beside the booking action. */
export function BookingActionTotal() {
  const { draft } = useBooking();
  return draft.slots.length > 0 ? (
    <span className="booking-action-total">{money(totalCents(draft))}</span>
  ) : null;
}
