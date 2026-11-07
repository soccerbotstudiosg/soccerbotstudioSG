"use client";
import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icon";
/** Manage modal focus, dismissal and restoration for shared dialogs. */
export function Dialog({
  title,
  onClose,
  children,
  variant,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  variant?: "player-app" | "booking-panel";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      // Close while the dialog is still attached so native modal state and
      // focus are released before React removes it from the document.
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const rail = railRef.current;
    if (!body || !rail) return;
    /** Keep a persistent visual scroll indicator in sync with native scrolling. */
    function measure() {
      if (!body || !rail) return;
      const overflow = body.scrollHeight - body.clientHeight;
      rail.hidden = overflow <= 0;
      const height = rail.clientHeight;
      const thumb = Math.min(
        height,
        Math.max(24, (height * body.clientHeight) / body.scrollHeight),
      );
      rail.style.setProperty("--scroll-thumb-height", `${thumb || 0}px`);
      rail.style.setProperty(
        "--scroll-thumb-top",
        `${overflow > 0 ? (height - thumb) * Math.max(0, Math.min(1, body.scrollTop / overflow)) : 0}px`,
      );
    }
    measure();
    body.addEventListener("scroll", measure, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(body);
    observer?.observe(rail);
    for (const child of body.children) observer?.observe(child);
    return () => {
      body.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [variant, children]);
  return (
    <dialog
      ref={ref}
      className={`fixed ${variant === "booking-panel" ? "overflow-hidden" : "overflow-auto"} rounded-2xl border border-line shadow-2xl ${variant === "booking-panel" ? "" : "m-auto max-h-[85dvh] w-[calc(100%-32px)] p-6"} ${variant === "player-app" ? "player-app-dialog max-w-2xl" : variant === "booking-panel" ? "booking-panel-dialog text-ink backdrop:bg-navy/40" : "max-w-xl text-ink backdrop:bg-navy/65"}`}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) {
          const rect = ref.current!.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div
        className={`${variant === "booking-panel" ? "booking-panel-header" : "mb-5"} flex ${variant === "player-app" ? "items-start" : "items-center"} justify-between gap-4`}
      >
        <h2 className="dialog-title" id={titleId}>
          {title}
        </h2>
        <button
          type="button"
          className={`dialog-close grid h-11 w-11 shrink-0 place-items-center ${variant === "player-app" ? "player-app-close" : ""}`}
          onClick={onClose}
          aria-label="Close dialog"
        >
          <Icon name="close" />
        </button>
      </div>
      {variant === "booking-panel" ? (
        <div className="booking-panel-viewport">
          <div ref={bodyRef} className="booking-panel-body">
            {children}
          </div>
          <div
            ref={railRef}
            className="booking-panel-scrollbar"
            aria-hidden="true"
          >
            <span />
          </div>
        </div>
      ) : (
        children
      )}
    </dialog>
  );
}
