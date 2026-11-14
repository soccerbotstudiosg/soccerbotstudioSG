"use client";
import { useState } from "react";
import { Icon } from "@/components/icon";
/** Customer-initiated report for the retained attempt; never a new checkout. */
export function BookingHelp({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed">(
    "idle",
  );
  /** Submit one support request and acknowledge only an accepted response. */
  async function send() {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    const controller = new AbortController();
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
      setState("sent");
    } catch {
      setState("failed");
    } finally {
      clearTimeout(timer);
    }
  }
  return (
    <div className="booking-help">
      <button
        type="button"
        className="button secondary"
        disabled={state === "sending" || state === "sent"}
        aria-busy={state === "sending"}
        aria-label={state === "sending" ? "Sending help request" : undefined}
        onClick={() => void send()}
      >
        {state === "sending" ? (
          <Icon name="spinner" className="spinner" />
        ) : state === "sent" ? (
          "Report sent"
        ) : (
          "Request Help"
        )}
      </button>
      <p aria-live="polite">
        {state === "sent"
          ? "Your request has been sent to the studio."
          : state === "failed"
            ? "Couldn’t send your request. Please wait a moment and try again."
            : ""}
      </p>
    </div>
  );
}
