"use client";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useBookingEntryTransition } from "@/components/booking-navigation";
import {
  CONFLICT_CHECKING,
  ACTIVE_CHECKOUT_CHECKING,
} from "@/domain/booking-messages";
import { BrandLoading, useMinimumLoading } from "@/components/brand-loading";
export const loadingMessage = "Please do not close or refresh.";
/** Preserve approved operation feedback within any full-page loading cover. */
export const loadingFeedbackMessage = (label?: string) =>
  [
    "Opening checkout…",
    "Checking whether your booking was created…",
    "Preparing your payment link…",
    CONFLICT_CHECKING,
    ACTIVE_CHECKOUT_CHECKING,
    "Checking payment…",
    "Checking booking…",
    "Preparing confirmation…",
    "Payment received. Confirming booking.",
  ].includes(label ?? "")
    ? `${label} ${loadingMessage}`
    : undefined;
const subscribeToHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;
type LoadingState = {
  register: (label: string, overlay: boolean) => () => void;
  label?: string;
  documentLoading: boolean;
  setDocumentLoading: (active: boolean) => void;
};
const Loading = createContext<LoadingState | null>(null);
/** Expose pending page checks so a document refresh can retain its existing cover. */
export function useBookingLoadingState() {
  return useContext(Loading);
}

// Keep the active screen mounted: loading must not discard contact, consent,
// provider widgets or an in-flight attempt. Multiple reads share one overlay.
/** Share booking loading state across asynchronous operations. */
export function BookingLoadingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<
    Map<symbol, { label: string; overlay: boolean }>
  >(() => new Map());
  const [documentLoading, setDocumentLoading] = useState(false);
  const register = useCallback((label: string, overlay: boolean) => {
    const id = Symbol();
    setPending((current) => new Map(current).set(id, { label, overlay }));
    return () =>
      setPending((current) => {
        const next = new Map(current);
        next.delete(id);
        return next;
      });
  }, []);
  const overlay = [...pending.values()].find((entry) => entry.overlay);
  const visibleLabel = useMinimumLoading(
    documentLoading ? undefined : overlay?.label,
  );
  const busy = !!visibleLabel;
  useLayoutEffect(() => {
    if (!busy) return;
    const main = document.getElementById("main");
    const wasInert = main?.inert;
    if (main) main.inert = true;
    return () => {
      if (main) main.inert = wasInert ?? false;
    };
  }, [busy]);
  return (
    <Loading.Provider
      value={{
        register,
        label: pending.values().next().value?.label,
        documentLoading,
        setDocumentLoading,
      }}
    >
      <div
        style={{ display: "contents" }}
        inert={busy && !documentLoading}
        aria-busy={busy || undefined}
      >
        {children}
      </div>
      {busy &&
        !documentLoading &&
        createPortal(
          <div className="booking-flow-overlay">
            <BrandLoading
              label={visibleLabel}
              message={loadingFeedbackMessage(visibleLabel)}
            />
          </div>,
          document.body,
        )}
    </Loading.Provider>
  );
}
/** Render the shared booking progress presentation. */
export function BookingLoading({
  label = "Preparing booking…",
  compact = false,
  overlay = true,
}: {
  label?: string;
  compact?: boolean;
  overlay?: boolean;
}) {
  const state = useBookingLoadingState();
  const register = state?.register;
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    hydratedSnapshot,
    serverSnapshot,
  );
  const entryTransition = useBookingEntryTransition();
  // Register before paint so a newly mounted loader cannot expose an intermediate screen.
  useLayoutEffect(
    () =>
      (overlay || !compact) && !entryTransition
        ? register?.(label, overlay)
        : undefined,
    [register, label, overlay, compact, entryTransition],
  );
  // Server HTML needs visible progress before layout effects can register the portal.
  return hydrated &&
    (entryTransition ||
      (register && (overlay || (state?.documentLoading && !compact)))) ? (
    <span className="sr-only">{label}</span>
  ) : (
    <BrandLoading
      compact={compact}
      overlay={overlay}
      label={label}
      message={overlay ? loadingFeedbackMessage(label) : undefined}
    />
  );
}
