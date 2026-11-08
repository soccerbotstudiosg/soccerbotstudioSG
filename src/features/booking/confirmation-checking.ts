"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CheckoutSelectionRejection } from "@/domain/native-checkout";
import {
  checkoutNow,
  ConfirmationError,
  readConfirmation,
} from "@/services/confirmation";
type View = "checking" | "confirmed" | "unavailable" | "unresolved" | "denied";
type Window = {
  deadline: number;
  next: number;
  count: number;
  final?: boolean;
  refreshNext?: number;
  holdChecked?: number;
};
type ServerWindow = { deadlineMs: number; nextCheckMs: number };
/** Derive the bounded checking window from protected checkout context. */
function windowFor(id: string, deadline = Date.now() + 600000): Window {
  try {
    const value = JSON.parse(
      localStorage.getItem(`soccerbot-checking:${id}`) || "null",
    ) as Window | null;
    if (
      value &&
      [value.deadline, value.next, value.count].every(Number.isSafeInteger) &&
      value.deadline >= 0 &&
      value.next >= 0 &&
      value.count >= 0
    )
      return {
        ...value,
        refreshNext: Number.isSafeInteger(value.refreshNext)
          ? value.refreshNext
          : undefined,
        holdChecked: Number.isSafeInteger(value.holdChecked)
          ? value.holdChecked
          : undefined,
      };
  } catch {
    /* Server limits remain authoritative when browser storage fails. */
  }
  return { deadline, next: 0, count: 0 };
}
function save(id: string, window: Window) {
  try {
    localStorage.setItem(`soccerbot-checking:${id}`, JSON.stringify(window));
  } catch {
    /* No capability or decision is persisted. */
  }
}
/** Coordinate bounded polling, focus refresh and hold-expiry checks. */
export function useConfirmationChecking(
  attemptId: string,
  sessionRevision = 0,
  enabled = true,
  serverDeadline?: number,
  holdExpiresAtMs?: number,
  clock?: import("@/services/contracts").CheckoutContext["clock"],
) {
  const [result, setResult] = useState<{
    id: string;
    revision: number;
    view: View;
    paymentReceived: boolean;
    responseEvidence?: object;
    customerConfirmation?: import("@/services/contracts").CheckoutContext["customerConfirmation"];
    expired?: boolean;
    selectionRejection?: CheckoutSelectionRejection;
    busy: boolean;
    next: number;
  } | null>(null);
  const retainedView = useRef<{
    id: string;
    revision: number;
    view: View;
  } | null>(null);
  const refresh = useRef<() => void>(() => {});
  const check = useCallback(() => refresh.current(), []);
  const bind = useRef<(window: ServerWindow) => void>(() => {});
  const bindWindow = useCallback(
    (window: ServerWindow) => bind.current(window),
    [],
  );
  useEffect(() => {
    if (!enabled) return;
    const now = () => checkoutNow(clock);
    let active = true,
      busy = false,
      generation = 0;
    let controller: AbortController | undefined,
      timer: ReturnType<typeof setTimeout> | undefined;
    let budget = windowFor(attemptId, serverDeadline ?? now() + 600000);
    save(attemptId, budget);
    let unresolved = false;
    let displayedView: View =
      retainedView.current?.id === attemptId &&
      retainedView.current.revision === sessionRevision &&
      ["unavailable", "unresolved"].includes(retainedView.current.view)
        ? retainedView.current.view
        : "checking";
    const show = (view: View) => {
      displayedView = view;
      retainedView.current = { id: attemptId, revision: sessionRevision, view };
      unresolved = view === "unresolved";
      if (active)
        setResult({
          id: attemptId,
          revision: sessionRevision,
          view,
          paymentReceived,
          responseEvidence,
          customerConfirmation,
          expired,
          selectionRejection,
          busy,
          next: budget.next,
        });
    };
    let terminal = false;
    let paymentReceived = false;
    let responseEvidence: object | undefined;
    let customerConfirmation: import("@/services/contracts").CheckoutContext["customerConfirmation"];
    let expired = false;
    let selectionRejection: CheckoutSelectionRejection | undefined;
    /** Schedule the next bounded confirmation check for the active attempt. */
    function schedule() {
      clearTimeout(timer);
      if (!active || document.hidden) return;
      if (terminal) {
        if (
          unresolved &&
          holdExpiresAtMs !== undefined &&
          budget.holdChecked !== holdExpiresAtMs
        )
          timer = setTimeout(
            () => void poll("hold"),
            Math.max(
              1,
              holdExpiresAtMs - now(),
              (budget.refreshNext ?? 0) - now(),
            ),
          );
        return;
      }
      timer = setTimeout(
        () => void poll(),
        Math.max(
          1,
          Math.min(5000, budget.next - now(), budget.deadline - now()),
        ),
      );
    }
    /** Reserve a confirmation check within the attempt's polling limits. */
    function reserve(recheck: boolean) {
      const claim = () => {
        const shared = windowFor(attemptId, serverDeadline ?? now() + 600000);
        budget = {
          deadline: Math.min(budget.deadline, shared.deadline),
          next: Math.max(budget.next, shared.next),
          count: Math.max(budget.count, shared.count),
          final: budget.final || shared.final,
          refreshNext: Math.max(
            budget.refreshNext ?? 0,
            shared.refreshNext ?? 0,
          ),
          holdChecked: shared.holdChecked ?? budget.holdChecked,
        };
        if (recheck) {
          if (now() < (budget.refreshNext ?? 0)) return false;
          budget.refreshNext = now() + 30000;
          save(attemptId, budget);
          return true;
        }
        if ((now() >= budget.deadline && budget.final) || budget.count >= 120) {
          terminal = true;
          show("unresolved");
          return false;
        }
        if (now() < budget.next && now() < budget.deadline) return false;
        budget = {
          ...budget,
          next: now() + 5000,
          count: budget.count + 1,
          final: budget.final || now() >= budget.deadline,
        };
        save(attemptId, budget);
        return true;
      };
      return navigator.locks
        ? navigator.locks
            .request(`soccerbot-checking:${attemptId}`, claim)
            .catch(() => claim())
        : claim();
    }
    /** Read confirmation without overlapping requests or reviving terminal state. */
    async function poll(trigger?: "focus" | "hold") {
      const recheck =
        terminal &&
        unresolved &&
        trigger !== undefined &&
        now() >= budget.deadline;
      if (!active || (terminal && !recheck) || busy || document.hidden) return;
      busy = true;
      const current = ++generation;
      const reservation = reserve(recheck);
      if (
        !(typeof reservation === "boolean" ? reservation : await reservation)
      ) {
        busy = false;
        if (active) {
          if (!terminal) show(displayedView);
          schedule();
        }
        return;
      }
      if (!active || current !== generation) {
        busy = false;
        return;
      }
      const requestController = new AbortController();
      controller = requestController;
      show(recheck ? "unresolved" : displayedView);
      let requestTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        const response = await Promise.race([
          readConfirmation(attemptId, requestController.signal),
          new Promise<never>((_, reject) => {
            requestTimer = setTimeout(
              () => {
                requestController.abort();
                reject(new ConfirmationError("unavailable"));
              },
              budget.final
                ? 10000
                : Math.max(1, Math.min(10000, budget.deadline - now())),
            );
          }),
        ]);
        if (!active || generation !== current) return;
        budget.deadline = Math.min(
          budget.deadline,
          response.checking.deadlineMs ?? budget.deadline,
        );
        // A successful authenticated response may grant an earlier status
        // read. This never resets the shared count or the original deadline.
        budget.next = response.checking.nextCheckMs ?? budget.next;
        // A transport failure must not consume the one authenticated hold read.
        // Failed rechecks retain the shared 30-second spacing across reloads.
        if (
          recheck &&
          holdExpiresAtMs !== undefined &&
          now() >= holdExpiresAtMs
        )
          budget.holdChecked = holdExpiresAtMs;
        save(attemptId, budget);
        responseEvidence = response;
        customerConfirmation =
          "customerConfirmation" in response
            ? response.customerConfirmation
            : response.status === "confirmed"
              ? customerConfirmation
              : response.status === "pending"
                ? customerConfirmation
                : undefined;
        expired = "expired" in response && response.expired === true;
        selectionRejection =
          "selectionRejection" in response
            ? response.selectionRejection
            : undefined;
        paymentReceived =
          paymentReceived ||
          response.reason === "payment_received_booking_pending" ||
          response.reason === "paid_booking_invalid" ||
          response.status === "confirmed";
        if (response.status === "confirmed") {
          terminal = true;
          show("confirmed");
        } else if (response.status === "denied") {
          terminal = true;
          show("denied");
        } else if (response.status !== "pending" || now() >= budget.deadline) {
          terminal = true;
          show("unresolved");
        } else show("checking");
      } catch (error) {
        if (!active || generation !== current) return;
        if (recheck && error instanceof ConfirmationError) {
          budget.refreshNext = Math.max(
            budget.refreshNext ?? 0,
            error.nextCheckMs ?? 0,
          );
          save(attemptId, budget);
        }
        if (error instanceof ConfirmationError && error.kind === "denied") {
          terminal = true;
          show("denied");
        } else if (now() >= budget.deadline) {
          terminal = true;
          show("unresolved");
        } else if (error instanceof ConfirmationError) {
          budget.deadline = Math.min(
            budget.deadline,
            error.deadlineMs ?? budget.deadline,
          );
          budget.next = Math.max(budget.next, error.nextCheckMs ?? 0);
          save(attemptId, budget);
          if (error.kind === "exhausted") {
            terminal = true;
            show("unresolved");
          } else
            show(error.kind === "throttled" ? displayedView : "unavailable");
        } else show("unavailable");
      } finally {
        clearTimeout(requestTimer);
        if (active && generation === current) {
          if (terminal) {
            budget.next = 0;
            save(attemptId, budget);
          }
          busy = false;
          setResult((v) => (v?.id === attemptId ? { ...v, busy: false } : v));
          schedule();
        }
      }
    }
    function visibility() {
      if (document.hidden) {
        generation++;
        controller?.abort();
        busy = false;
        clearTimeout(timer);
      } else void poll("focus");
    }
    bind.current = (window) => {
      if (!active) return;
      // Checkout context and confirmation share the same server-owned window.
      // Bind it before exposing checkout, even when the first status read is
      // still pending. Neither a late context nor another tab may extend it.
      const shared = windowFor(attemptId, serverDeadline ?? now() + 600000);
      budget = {
        deadline: Math.min(budget.deadline, shared.deadline, window.deadlineMs),
        next: Math.max(budget.next, shared.next, window.nextCheckMs),
        count: Math.max(budget.count, shared.count),
        final: budget.final || shared.final,
        refreshNext: Math.max(budget.refreshNext ?? 0, shared.refreshNext ?? 0),
        holdChecked: shared.holdChecked ?? budget.holdChecked,
      };
      save(attemptId, budget);
      if (!terminal && now() >= budget.deadline && (budget.final || busy)) {
        terminal = true;
        generation++;
        controller?.abort();
        busy = false;
        show("unresolved");
      }
      schedule();
    };
    refresh.current = () => void poll("focus");
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", visibility);
    void poll();
    return () => {
      active = false;
      generation++;
      controller?.abort();
      clearTimeout(timer);
      refresh.current = () => {};
      bind.current = () => {};
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", visibility);
    };
  }, [
    attemptId,
    sessionRevision,
    enabled,
    serverDeadline,
    holdExpiresAtMs,
    clock,
  ]);
  return {
    selectionRejection:
      result?.id === attemptId && result.revision === sessionRevision
        ? result.selectionRejection
        : undefined,
    responseEvidence:
      result?.id === attemptId && result.revision === sessionRevision
        ? result.responseEvidence
        : undefined,
    customerConfirmation:
      result?.id === attemptId && result.revision === sessionRevision
        ? result.customerConfirmation
        : undefined,
    expired:
      result?.id === attemptId &&
      result.revision === sessionRevision &&
      result.expired === true,
    paymentReceived:
      result?.id === attemptId && result.revision === sessionRevision
        ? result.paymentReceived
        : false,
    view:
      result?.id === attemptId && result.revision === sessionRevision
        ? result.view
        : "checking",
    busy:
      result?.id === attemptId && result.revision === sessionRevision
        ? result.busy
        : false,
    check,
    bindWindow,
  };
}
