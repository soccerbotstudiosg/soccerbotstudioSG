"use client";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
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

import { useNavigationStarted } from "./booking-navigation";

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
const isHistoryReturn = () =>
  (
    performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined
  )?.type === "back_forward";

/** Cover initial rendering until hydration, restored state and fonts are ready. */
export function PageRefreshBoundary({ children }: { children: ReactNode }) {
  const { ready } = useBooking();
  const pathname = usePathname();
  const navigationStarted = useNavigationStarted();
  const [visit, setVisit] = useState(() => ({
    pathname,
    initial: true,
    episode: 0,
    started: undefined as number | undefined,
  }));
  const [complete, setComplete] = useState(false);
  if (visit.pathname !== pathname) {
    const publicReturn = pathname === "/" || /^\/studio\/?$/.test(pathname);
    setVisit({
      pathname,
      initial: false,
      episode: visit.episode + (publicReturn ? 1 : 0),
      started: navigationStarted,
    });
    if (publicReturn) setComplete(false);
    else if (!visit.initial && !complete) setComplete(true);
  }
  const visitClock = useRef(0);
  useLayoutEffect(() => {
    visitClock.current = visit.started ?? performance.now();
  }, [visit.episode, visit.started]);
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
  const historyReturn = useSyncExternalStore(
    subscribeToNavigation,
    isHistoryReturn,
    serverNavigation,
  );
  const reviewRoute = /^\/book\/review\/?$/.test(pathname);
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
  const activeFeedback =
    operationLabel ??
    (feedback.pathname === pathname ? feedback.label : undefined) ??
    checkoutRouteLoadingLabel(pathname) ??
    loading?.label;
  const feedbackLabel =
    historyReturn && reviewRoute && activeFeedback === "Checking booking…"
      ? "Checking payment…"
      : activeFeedback;
  const setDocumentLoading = loading?.setDocumentLoading;
  const pending = !!loading?.label;
  useLayoutEffect(() => {
    if (complete) return;
    setDocumentLoading?.(true);
    return () => setDocumentLoading?.(false);
  }, [complete, setDocumentLoading]);
  useEffect(() => {
    if (complete || !ready || pending) return;
    let active = true;
    let frame = 0;
    let minimumTimer: ReturnType<typeof setTimeout>;
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
      new Promise<void>((resolve) => {
        const remaining =
          FULL_PAGE_LOADING_MIN_MS - (performance.now() - visitClock.current);
        if (remaining <= 0) resolve();
        else minimumTimer = setTimeout(resolve, remaining);
      }),
    ]).then(reveal);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      clearTimeout(minimumTimer);
    };
  }, [
    complete,
    ready,
    reloading,
    pending,
    pathname,
    visit.episode,
    visit.started,
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
                    {reviewRoute ? (
                      <>
                        <span className="document-review-entry">
                          {loadingFeedbackMessage(feedbackLabel)}
                        </span>
                        <span className="document-review-return">
                          {loadingFeedbackMessage("Checking payment…")}
                        </span>
                      </>
                    ) : (
                      (loadingFeedbackMessage(feedbackLabel) ?? "Loading...")
                    )}
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
