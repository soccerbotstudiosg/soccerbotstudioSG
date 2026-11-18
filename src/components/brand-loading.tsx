"use client";
import { useState, type ReactNode } from "react";
import { darkLogo } from "@/content/media";
/** Preserve meaningful feedback while work is pending, without a minimum display delay. */
export function useLoadingFeedback(
  label: string | undefined,
  retain?: (previous: string | undefined, next: string | undefined) => boolean,
) {
  const [state, setState] = useState({ input: label, label });
  if (state.input !== label) {
    setState({
      input: label,
      label:
        label !== undefined && retain?.(state.label, label)
          ? state.label
          : label,
    });
  }
  return label === undefined ? undefined : state.label;
}

/** Render the branded loading indicator and status message. */
export function BrandLoading({
  compact = false,
  leaving = false,
  overlay = true,
  label = "Opening booking",
  message = "Loading...",
}: {
  compact?: boolean;
  leaving?: boolean;
  overlay?: boolean;
  label?: string;
  message?: ReactNode;
}) {
  const Container = compact ? "span" : "div";
  return (
    <Container
      className={
        compact
          ? "booking-loading-inline"
          : overlay
            ? "page-loading"
            : "booking-loading"
      }
      data-phase={leaving ? "leaving" : "loading"}
      role="status"
      aria-label={label}
    >
      <span className="page-loading-content">
        <svg
          className="page-loading-emblem"
          viewBox="0 0 120 120"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="60" cy="60" r="51" stroke="#dce5ec" strokeWidth="1" />
          <circle className="page-loading-orbit" cx="60" cy="60" r="43" />
          <g transform="translate(36 36) scale(2)">
            <circle cx="12" cy="12" r="9" />
            <path d="m12 7 5 4-2 6H9l-2-6zM12 7V3M17 11l4-1M15 17l2 3M9 17l-2 3M7 11l-4-1" />
          </g>
        </svg>
        <img
          src={darkLogo}
          width={565}
          height={190}
          className="official-logo loading-logo"
          alt={compact ? "" : "SOCCERBOTSTUDIO Singapore"}
        />
        {!compact && <span className="page-loading-track" aria-hidden="true" />}
        {message && (
          <span className="block mt-5 text-sm text-muted">{message}</span>
        )}
      </span>
    </Container>
  );
}
