"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type RecoveryState = {
  keyboardOpen: boolean;
  closing: boolean;
  fullHeight: number;
  delta?: number;
};
let recorder:
  | ((event: string, state?: RecoveryState, field?: HTMLElement | null) => void)
  | null = null;

/** Report recovery decisions only while the explicitly started local recorder is active. */
export function traceKeyboard(
  event: string,
  state?: RecoveryState,
  field?: HTMLElement | null,
) {
  recorder?.(event, state, field);
}

/** Read geometry without copying text, values, identifiers, URLs or DOM markup. */
function geometry(element: Element | null) {
  if (!element) return null;
  const box = element.getBoundingClientRect();
  return {
    tag: element.tagName,
    top: box.top,
    bottom: box.bottom,
    height: box.height,
  };
}

const subscribe = () => () => {};

/** Offer a bounded, memory-only trace on explicitly opted-in diagnostic builds. */
export function KeyboardTrace() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [enabled] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("keyboardTrace") === "1",
  );
  const [recording, setRecording] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const stop = useRef<(() => string) | null>(null);
  useEffect(() => {
    return () => {
      stop.current?.();
    };
  }, []);
  /** Attach observations without changing focus, scrolling or keyboard recovery. */
  function start() {
    stop.current?.();
    setOutput("");
    setCopied(false);
    const started = performance.now();
    const events: object[] = [];
    let dropped = 0;
    let frame = 0;
    let edited: Element | null = null;
    const viewport = window.visualViewport;
    const capture = (
      event: string,
      state?: RecoveryState,
      field?: HTMLElement | null,
    ) => {
      if (events.length >= 1200) {
        dropped++;
        return;
      }
      events.push({
        ms: Math.round(performance.now() - started),
        event,
        recovery: state,
        scrollY: window.scrollY,
        scrollTop: document.scrollingElement?.scrollTop ?? null,
        innerHeight: window.innerHeight,
        clientHeight: document.documentElement.clientHeight,
        viewport: viewport
          ? {
              height: viewport.height,
              width: viewport.width,
              offsetTop: viewport.offsetTop,
              pageTop: viewport.pageTop,
              scale: viewport.scale,
            }
          : null,
        active: geometry(document.activeElement),
        edited: geometry(edited),
        tracked: geometry(field ?? null),
        header: geometry(document.querySelector(".site-header")),
        progress: geometry(document.querySelector(".booking-navigation")),
        visible: document.visibilityState,
        focused: document.hasFocus(),
      });
    };
    const observe = (event: Event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        edited = event.target;
      const source =
        event.currentTarget === viewport
          ? "viewport"
          : event.currentTarget === window
            ? "window"
            : "document";
      capture(`${source}:${event.type}`);
      // Coalesce extra geometry reads, including Safari values updated after the event.
      if (!frame)
        frame = requestAnimationFrame(() => {
          capture("animation-frame:1");
          frame = requestAnimationFrame(() => {
            frame = 0;
            capture("animation-frame:2");
          });
        });
    };
    const subscriptions: [EventTarget, string][] = [
      ...["resize", "scroll", "focus", "blur", "orientationchange"].map(
        (name): [EventTarget, string] => [window, name],
      ),
      ...[
        "focusin",
        "focusout",
        "pointerdown",
        "touchmove",
        "wheel",
        "visibilitychange",
      ].map((name): [EventTarget, string] => [document, name]),
      ...(viewport
        ? ["resize", "scroll"].map((name): [EventTarget, string] => [
            viewport,
            name,
          ])
        : []),
    ];
    for (const [target, name] of subscriptions)
      target.addEventListener(name, observe, { passive: true });
    recorder = capture;
    capture("start");
    stop.current = () => {
      capture("stop");
      for (const [target, name] of subscriptions)
        target.removeEventListener(name, observe);
      cancelAnimationFrame(frame);
      if (recorder === capture) recorder = null;
      stop.current = null;
      return JSON.stringify(
        {
          version: 1,
          build: process.env.NEXT_PUBLIC_BUILD_REVISION ?? "unknown",
          userAgent: navigator.userAgent,
          durationMs: Math.round(performance.now() - started),
          dropped,
          events,
        },
        null,
        2,
      );
    };
    setRecording(true);
  }
  if (!hydrated || !enabled) return null;
  return (
    <aside className="keyboard-trace" aria-label="Keyboard diagnostics">
      <strong>Keyboard trace {recording ? "· recording" : ""}</strong>
      <div>
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={start}
          disabled={recording}
        >
          Start
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          disabled={!recording}
          onClick={() => {
            setOutput(stop.current?.() ?? "");
            setRecording(false);
          }}
        >
          Stop
        </button>
        {output && (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(output);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? "Copied" : "Copy trace"}
          </button>
        )}
      </div>
      {output && (
        <textarea
          aria-label="Recorded keyboard trace"
          readOnly
          value={output}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </aside>
  );
}
