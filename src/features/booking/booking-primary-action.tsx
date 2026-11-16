"use client";
import { totalCents } from "@/domain/booking";
import { money } from "@/domain/dates";
import { useBooking } from "./provider";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Keep the single next action visible when its reserved position is offscreen. */
export function BookingPrimaryAction({
  children,
  className = "",
  ready,
  loading = false,
}: {
  children: ReactNode;
  className?: string;
  ready?: boolean;
  loading?: boolean;
}) {
  const [progressVisible, setProgressVisible] = useState(loading);
  if (loading && !progressVisible) setProgressVisible(true);
  const progress = useRef<HTMLSpanElement>(null);
  const fill = useRef<Animation | null>(null);
  useLayoutEffect(() => {
    const bar = progress.current;
    if (!bar) return;
    const current = getComputedStyle(bar).transform;
    fill.current?.cancel();
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (loading) {
      if (!reduced && bar.animate)
        fill.current = bar.animate(
          [
            { transform: "scaleX(0)", offset: 0 },
            { transform: "scaleX(0.8)", offset: 0.12 },
            { transform: "scaleX(0.94)", offset: 0.4 },
            { transform: "scaleX(0.98)", offset: 1 },
          ],
          {
            duration: 5000,
            easing: "linear",
            fill: "forwards",
          },
        );
      return;
    }
    let active = true;
    const completion =
      !reduced && bar.animate
        ? bar.animate([{ transform: current }, { transform: "scaleX(1)" }], {
            duration: 180,
            easing: "ease-out",
            fill: "forwards",
          })
        : null;
    fill.current = completion;
    void (completion?.finished ?? Promise.resolve()).then(
      () => {
        if (active) setProgressVisible(false);
      },
      () => {},
    );
    return () => {
      active = false;
    };
  }, [loading, progressVisible]);
  useLayoutEffect(() => () => fill.current?.cancel(), []);
  const available = !loading && !progressVisible && ready;
  const [readiness, setReadiness] = useState({
    ready: available,
    animate: available === true,
  });
  if (readiness.ready !== available)
    setReadiness({
      ready: available,
      animate: readiness.ready === false && available === true,
    });
  const anchor = useRef<HTMLDivElement>(null);
  const action = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const control = action.current;
    if (!control || !available || !("IntersectionObserver" in window)) return;
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
  }, [available]);
  useLayoutEffect(() => {
    const position = anchor.current;
    const control = action.current;
    if (!position || !control || !("ResizeObserver" in window)) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      // Reserve the in-flow size: a wider floating button can have fewer lines.
      control.dataset.floating = "false";
      const style = getComputedStyle(position);
      const spacing =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      position.style.minHeight = `${control.getBoundingClientRect().height + spacing}px`;
      const bounds = position.getBoundingClientRect();
      control.style.setProperty("--action-left", `${bounds.left}px`);
      control.style.setProperty("--action-width", `${bounds.width}px`);
      const header = document.querySelector(".site-header");
      const top = header?.getBoundingClientRect().bottom ?? 0;
      // Browser focus/click scrolling targets the button, not its surrounding
      // spacing or hint. Do not move a visible button out from under that click.
      const button = control.querySelector<HTMLElement>(".button");
      const buttonBounds = button?.getBoundingClientRect() ?? bounds;
      control.dataset.floating = String(
        buttonBounds.bottom + parseFloat(style.paddingBottom) >
          window.innerHeight || buttonBounds.top < top,
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
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <div className="booking-action-anchor" ref={anchor}>
      <div
        className={`booking-primary-action ${className}`.trim()}
        data-loading={loading ? "true" : undefined}
        aria-busy={loading || undefined}
        data-floating="false"
        data-ready-animation={readiness.animate ? "true" : undefined}
        ref={action}
      >
        {children}
        {progressVisible && (
          <div className="booking-action-track" aria-hidden="true">
            <span className="booking-action-progress" ref={progress} />
          </div>
        )}
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
