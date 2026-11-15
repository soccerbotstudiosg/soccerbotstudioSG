"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useBooking } from "@/features/booking/provider";
import { BrandLoading } from "./brand-loading";

/** Cover initial rendering until hydration, restored state and fonts are ready. */
export function PageRefreshBoundary({ children }: { children: ReactNode }) {
  const { ready } = useBooking();
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    if (complete || !ready) return;
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
  }, [complete, ready]);
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
          <BrandLoading label="Refreshing…" message="Refreshing…" />
        </div>
      )}
    </>
  );
}
