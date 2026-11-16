"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { bookingHelpNotice } from "@/services/storage";
import { BOOKING_HELP_REQUESTED } from "@/domain/booking-messages";
import { Icon } from "@/components/icon";
/** Customer-initiated report for the retained attempt; never a new checkout. */
export function BookingHelp({
  attemptId,
  children,
  className = "",
}: {
  attemptId: string;
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "failed" | "dismissed"
  >(() => {
    const saved = bookingHelpNotice(attemptId, pathname);
    return saved === "sent" || saved === "dismissed" ? saved : "idle";
  });
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!bookingHelpNotice(attemptId, pathname))
      bookingHelpNotice(attemptId, pathname, "open");
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [attemptId, pathname]);
  /** Submit one support request and acknowledge only an accepted response. */
  async function send() {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    const controller = new AbortController();
    activeRequest.current = controller;
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(
        `/api/attempts/${encodeURIComponent(attemptId)}/support`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          redirect: "error",
          signal: controller.signal,
        },
      );
      const value: unknown = await response.json();
      if (
        !response.ok ||
        !value ||
        typeof value !== "object" ||
        !("status" in value) ||
        value.status !== "sent"
      )
        throw new Error("report_unavailable");
      if (activeRequest.current !== controller || controller.signal.aborted)
        return;
      bookingHelpNotice(attemptId, pathname, "sent");
      setState("sent");
    } catch {
      if (activeRequest.current === controller) setState("failed");
    } finally {
      clearTimeout(timer);
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }
  if (state === "dismissed") return null;
  return (
    <div
      className={`${state === "sent" ? "notice success" : "alert"} booking-help-notice ${className}`.trim()}
      role={state === "sent" ? "status" : "alert"}
    >
      {state === "sent" ? (
        <p>{BOOKING_HELP_REQUESTED}</p>
      ) : (
        <>
          {children}
          <div className="booking-help">
            <button
              type="button"
              className="button secondary"
              disabled={state === "sending"}
              aria-busy={state === "sending"}
              aria-label={
                state === "sending" ? "Sending help request" : undefined
              }
              onClick={() => void send()}
            >
              {state === "sending" ? (
                <span className="button-loading">
                  <Icon name="spinner" className="spinner" />
                  Sending request…
                </span>
              ) : (
                "Request Help"
              )}
            </button>
            {state === "failed" && (
              <p aria-live="polite">
                Couldn’t send your request. Please wait a moment and try again.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
