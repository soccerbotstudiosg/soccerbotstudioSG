"use client";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useBooking } from "@/features/booking/provider";
import {
  loadingFeedbackMessage,
  checkoutRouteLoadingLabel,
  useBookingLoadingState,
} from "@/features/booking/booking-loading";
import { BrandLoading, FULL_PAGE_LOADING_MIN_MS } from "./brand-loading";

const PageReady = createContext(true);
/** Delay public overlays until the page cover has revealed ready content. */
export function usePageReady() {
  return useContext(PageReady);
}

const subscribeToNavigation = () => () => {};
const isReload = () =>
  (
    performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined
  )?.type === "reload";
const serverNavigation = () => false;
const hydratedNavigation = () => true;

/** Cover initial rendering until hydration, restored state and fonts are ready. */
export function PageRefreshBoundary({ children }: { children: ReactNode }) {
  const { ready } = useBooking();
  const pathname = usePathname();
  const [visit, setVisit] = useState({ pathname, initial: true, episode: 0 });
  const [complete, setComplete] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  if (visit.pathname !== pathname) {
    const home = pathname === "/";
    setVisit({
      pathname,
      initial: false,
      episode: visit.episode + (home && complete ? 1 : 0),
    });
    if (home && complete) {
      setComplete(false);
      setMinimumElapsed(false);
    } else if (!visit.initial && !complete) {
      setComplete(true);
    }
  }
  useEffect(() => {
    const timer = setTimeout(
      () => setMinimumElapsed(true),
      FULL_PAGE_LOADING_MIN_MS,
    );
    return () => clearTimeout(timer);
  }, [visit.episode]);
  const navigationReload = useSyncExternalStore(
    subscribeToNavigation,
    isReload,
    serverNavigation,
  );
  const hydrated = useSyncExternalStore(
    subscribeToNavigation,
    hydratedNavigation,
    serverNavigation,
  );
  const reloading = visit.episode === 0 && navigationReload;
  const loading = useBookingLoadingState();
  const operationLabel = loadingFeedbackMessage(loading?.label)
    ? loading?.label
    : undefined;
  const [feedback, setFeedback] = useState({ pathname, label: operationLabel });
  if (
    feedback.pathname !== pathname ||
    (operationLabel && operationLabel !== feedback.label)
  )
    setFeedback({ pathname, label: operationLabel });
  // Active operations take precedence; retain meaningful feedback after they finish.
  const feedbackLabel =
    operationLabel ??
    (feedback.pathname === pathname ? feedback.label : undefined) ??
    checkoutRouteLoadingLabel(pathname) ??
    loading?.label;
  const setDocumentLoading = loading?.setDocumentLoading;
  const pending = !!loading?.label;
  useLayoutEffect(() => {
    if (complete) return;
    setDocumentLoading?.(true);
    return () => setDocumentLoading?.(false);
  }, [complete, setDocumentLoading]);
  useEffect(() => {
    if (complete || !minimumElapsed || !ready || pending) return;
    let active = true;
    let frame = 0;
    const reveal = () => {
      if (active)
        frame = requestAnimationFrame(() => {
          if (active) setComplete(true);
        });
    };
    const hero =
      pathname === "/"
        ? document.querySelector<HTMLImageElement>(".arena-photograph img")
        : null;
    // Decode the hero before uncovering it; failed media keeps its styled fallback.
    void Promise.allSettled([
      Promise.resolve(document.fonts?.ready),
      hero?.decode ? hero.decode() : Promise.resolve(),
    ]).then(reveal);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [
    complete,
    minimumElapsed,
    ready,
    reloading,
    pending,
    pathname,
    visit.episode,
  ]);
  return (
    <PageReady.Provider value={complete}>
      <div
        id="page-refresh-content"
        data-home-arrival={
          complete && visit.initial && !reloading && pathname === "/"
            ? "true"
            : undefined
        }
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
            label={
              reloading
                ? "Refreshing…"
                : (feedbackLabel ?? loading?.label ?? "Loading page")
            }
            message={
              !hydrated ? (
                <>
                  <span className="document-reload-message">Refreshing…</span>
                  <span className="document-navigation-message">
                    {loadingFeedbackMessage(feedbackLabel) ?? "Loading..."}
                  </span>
                </>
              ) : reloading ? (
                "Refreshing…"
              ) : (
                loadingFeedbackMessage(feedbackLabel)
              )
            }
          />
        </div>
      )}
    </PageReady.Provider>
  );
}
