"use client";
import {
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useBooking } from "@/features/booking/provider";
import { useBookingLoadingState } from "@/features/booking/booking-loading";
import { BrandLoading, FULL_PAGE_LOADING_MIN_MS } from "./brand-loading";

const subscribeToNavigation = () => () => {};
const isReload = () =>
  (
    performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined
  )?.type === "reload";
const serverNavigation = () => false;

/** Cover initial rendering until hydration, restored state and fonts are ready. */
export function PageRefreshBoundary({ children }: { children: ReactNode }) {
  const { ready } = useBooking();
  const [complete, setComplete] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(
      () => setMinimumElapsed(true),
      FULL_PAGE_LOADING_MIN_MS,
    );
    return () => clearTimeout(timer);
  }, []);
  const reloading = useSyncExternalStore(
    subscribeToNavigation,
    isReload,
    serverNavigation,
  );
  const loading = useBookingLoadingState();
  const setDocumentLoading = loading?.setDocumentLoading;
  const pending = !!loading?.label;
  useLayoutEffect(() => {
    if (complete || !reloading) return;
    setDocumentLoading?.(true);
    return () => setDocumentLoading?.(false);
  }, [complete, reloading, setDocumentLoading]);
  useEffect(() => {
    if (complete || !minimumElapsed || !ready || (reloading && pending)) return;
    let active = true;
    let frame = 0;
    const reveal = () => {
      if (active)
        frame = requestAnimationFrame(() => {
          if (active) setComplete(true);
        });
    };
    void Promise.resolve(document.fonts?.ready).then(reveal, reveal);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [complete, minimumElapsed, ready, reloading, pending]);
  return (
    <>
      <div
        id="page-refresh-content"
        inert={!complete}
        aria-busy={!complete || undefined}
        style={{
          display: "contents",
          visibility: complete ? undefined : "hidden",
        }}
      >
        {children}
      </div>
      {!complete && (
        <div
          id="page-refresh"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "#fff",
          }}
        >
          <BrandLoading
            label={reloading ? "Refreshing…" : "Loading page"}
            message={reloading ? "Refreshing…" : undefined}
          />
        </div>
      )}
    </>
  );
}
