"use client";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
export const BookingHeadingStatus = createContext<ReactNode>(null);
/** Keep the current identity beside each booking step's title. */
export function BookingHeading({
  lines,
  status: suppliedStatus,
}: {
  lines: readonly [string, string];
  status?: ReactNode;
}) {
  const inheritedStatus = useContext(BookingHeadingStatus);
  const status = suppliedStatus ?? inheritedStatus;
  const title = (
    <h1 className="page-title booking-title">
      <span className="booking-title-line">{lines[0]}</span>{" "}
      <span className="booking-title-line">{lines[1]}</span>
    </h1>
  );
  if (!status) return title;
  return (
    <div className="booking-heading-row">
      {title}
      {status}
    </div>
  );
}

/** Show verified contact identity without implying reservation-management access. */
export function VerifiedEmailStatus({ email }: { email: string }) {
  const address = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = address.current;
    const badge = element?.parentElement;
    if (!element || !badge) return;
    let active = true;
    /** Fit the complete mobile address inside the existing badge width. */
    const fit = () => {
      if (!active) return;
      if (window.innerWidth > 700) {
        element.style.removeProperty("font-size");
        return;
      }
      const range = document.createRange();
      range.selectNodeContents(element);
      const width = range.getBoundingClientRect?.().width ?? 0;
      const available = element.clientWidth;
      if (!width || !available) return;
      const current = parseFloat(getComputedStyle(element).fontSize);
      const maximum = parseFloat(getComputedStyle(badge).fontSize);
      element.style.fontSize = `${Math.min(maximum, (current * available) / width)}px`;
    };
    fit();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(badge);
    window.addEventListener("resize", fit);
    void document.fonts?.ready.then(fit);
    return () => {
      active = false;
      observer?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [email]);
  return (
    <span className="booking-verified-status">
      <strong>Email verified</strong>
      <span ref={address}>{email}</span>
    </span>
  );
}
