"use client";
import { hasSeenConfirmation, markConfirmationSeen } from "@/services/storage";
import {
  PAYMENT_WINDOW_ENDED,
  CONFLICT_CHECKING,
  CHECKOUT_UNRESOLVED,
} from "@/domain/booking-messages";
import {
  isHitpayCheckoutUrl,
  type CheckoutSelectionRejection,
} from "@/domain/native-checkout";
import {
  expiryReconciliationDeadline,
  checkoutRecoveryDeadline,
  completedPaymentReturn,
} from "@/services/storage";
import { SessionList, SessionSummaryHeading } from "./summary";
import { BookingLoading as BrandLoading } from "./booking-loading";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { BookingHelp } from "./booking-help";
import { BookingConfirmation, PendingConfirmation } from "./confirmation-step";
type BookingReceipt = Awaited<ReturnType<typeof readBookingReceipt>>;
import { sitePath } from "@/content/site-path";
import {
  checkoutNow,
  isConfirmationAttemptId,
  ConfirmationError,
  readBookingReceipt,
  dismissCompletedBooking,
  expireBooking,
  bookingFromReceipt,
  protectedCheckoutService,
} from "@/services/confirmation";
import type { CheckoutContext } from "@/services/contracts";
import { money, dateLabel, endTime } from "@/domain/dates";
import { useConfirmationRenderTrace } from "./confirmation-render-trace";
import { useConfirmationChecking } from "./confirmation-checking";
/** Reopen only the retained handoff within its original payment deadline. */
function PaymentContinuation({
  url,
  expiresAtMs,
  clock,
}: {
  url: string;
  expiresAtMs: number;
  clock: NonNullable<CheckoutContext["clock"]>;
}) {
  const [now, setNow] = useState(() => checkoutNow(clock, true));
  useEffect(() => {
    const refresh = () => setNow(checkoutNow(clock, true));
    const timer = setInterval(refresh, 1000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [clock]);
  const seconds = Math.max(0, Math.ceil((expiresAtMs - now) / 1000));
  if (!seconds) return null;
  return (
    <div className="payment-continuation">
      <p role="timer" aria-live="off">
        Time left to pay: {String(Math.floor(seconds / 60)).padStart(2, "0")}:
        {String(seconds % 60).padStart(2, "0")}
      </p>
      <a
        className="button wide booking-entry-action"
        href={url}
        data-booking-continuation
        referrerPolicy="no-referrer"
        onClick={(event) => {
          if (checkoutNow(clock, true) >= expiresAtMs) {
            event.preventDefault();
            setNow(checkoutNow(clock, true));
          }
        }}
      >
        Continue payment
      </a>
    </div>
  );
}
/** Leave an unusable confirmation view without changing retained financial state. */
function ConfirmationHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
/** Reject invalid links before mounting any protected reads or recovery timers. */
export function ProtectedConfirmation(
  props: Parameters<typeof ProtectedConfirmationBody>[0],
) {
  return isConfirmationAttemptId(props.attemptId) ? (
    <ProtectedConfirmationBody {...props} />
  ) : (
    <ConfirmationHome />
  );
}
/** Present protected checkout status without trusting browser payment claims. */
function ProtectedConfirmationBody({
  attemptId,
  checkoutMode,
  allowPaymentContinuation = false,
  providerReturn = false,
  confirmationRoute = false,
  sessionRevision = 0,
  onAgain,
  onRestart,
  onExpired,
  onAwaitingExpiry,
  calendarRecovery = false,
  silent = false,
  onPaymentDetected,
  onSelectionRejected,
  onCreationResolved,
}: {
  attemptId: string;
  checkoutMode?: "synthetic" | "live";
  allowPaymentContinuation?: boolean;
  providerReturn?: boolean;
  confirmationRoute?: boolean;
  sessionRevision?: number;
  onAgain?: () => void;
  onExpired?: (attemptId: string) => void;
  onAwaitingExpiry?: (attemptId: string, unresolved?: boolean) => boolean;
  calendarRecovery?: boolean;
  /** Continue protected recovery without rendering status on other draft steps. */
  silent?: boolean;
  onPaymentDetected?: (attemptId: string) => void;
  onCreationResolved?: (attemptId: string) => boolean;
  onSelectionRejected?: (
    attemptId: string,
    rejection: CheckoutSelectionRejection,
    signal?: AbortSignal,
  ) => Promise<boolean>;
  onRestart?: (attemptId: string) => void | Promise<void>;
}) {
  const router = useRouter();
  const [homeFallback, setHomeFallback] = useState<string | null>(null);
  const [homeDeparture, setHomeDeparture] = useState<ReactNode>(null);
  const [seenConfirmation] = useState(() => hasSeenConfirmation(attemptId));
  const returnedHome = useRef<string | null>(null);
  const [context, setContext] = useState<{
    value: CheckoutContext;
    revision: number;
  } | null>(null);
  const contextMatches =
    context?.value.attemptId === attemptId &&
    context.value.mode === checkoutMode &&
    context.revision === sessionRevision;
  const saved = contextMatches ? context.value.confirmation : undefined;
  const [contextFailure, setContextFailure] = useState<{
    id: string;
    revision: number;
  } | null>(null);
  const contextSettled =
    contextMatches ||
    (contextFailure?.id === attemptId &&
      contextFailure.revision === sessionRevision);
  const incomplete =
    contextMatches &&
    context.value.bookingIssue === "incomplete" &&
    !context.value.payment &&
    !saved;
  const linkRecovering =
    contextMatches &&
    context.value.paymentIssue === "link_recovering" &&
    !context.value.payment &&
    !saved;
  const {
    view,
    bindWindow,
    check: checkConfirmation,
    paymentReceived,
    responseEvidence,
    responseCheckedAtMs,
    customerConfirmation,
    selectionRejection: statusRejection,
    creationResolution: statusCreationResolution,
    settled: confirmationReadSettled,
    expired,
  } = useConfirmationChecking(
    attemptId,
    sessionRevision,
    (!checkoutMode || contextSettled) &&
      homeFallback !== attemptId &&
      !saved &&
      !incomplete &&
      !linkRecovering,
    contextMatches ? context.value.checking.deadlineMs : undefined,
    contextMatches
      ? (context.value.checking.recoveryEndsAtMs ??
          context.value.checking.holdExpiresAtMs)
      : undefined,
    contextMatches ? context.value.clock : undefined,
  );
  const [receipt, setReceipt] = useState<{
    value: BookingReceipt;
    revision: number;
  } | null>(null);
  const receiptWork = useRef<AbortController | null>(null);
  const [receiptFailure, setReceiptFailure] = useState<{
    id: string;
    revision: number;
  } | null>(null);
  const [receiptRead, setReceiptRead] = useState(0);
  const [invoiceFinished, setInvoiceFinished] = useState<{
    id: string;
    revision: number;
    read: number;
  } | null>(null);
  const finishExpiry = useEffectEvent((id: string, revision: number) => {
    if (
      id !== attemptId ||
      revision !== sessionRevision ||
      hasPaymentEvidence ||
      homeFallback === id
    )
      return;
    onExpired?.(attemptId);
    if (!calendarRecovery) router.replace("/book/time/");
  });
  const wantsExpiry =
    view !== "denied" &&
    view !== "confirmed" &&
    !paymentReceived &&
    !saved &&
    !customerConfirmation &&
    !(
      contextMatches &&
      (context.value.payment || context.value.customerConfirmation)
    ) &&
    (expired || (contextMatches && context.value.expired === true));
  const [failedExpiry, setFailedExpiry] = useState<{
    id: string;
    revision: number;
  } | null>(null);
  const expiryFailure =
    failedExpiry?.id === attemptId && failedExpiry.revision === sessionRevision;
  useEffect(() => {
    if (!wantsExpiry) return;
    let active = true;
    let busy = false;
    let finished = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    /** Retry only the same unpaid-release operation, without changing displayed recovery. */
    async function release() {
      if (!active || busy || finished || document.hidden) return;
      busy = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10000);
      try {
        await expireBooking(attemptId, controller.signal);
        if (active) {
          finished = true;
          finishExpiry(attemptId, sessionRevision);
        }
      } catch (error) {
        if (!active) return;
        setFailedExpiry({ id: attemptId, revision: sessionRevision });
        if (
          error instanceof ConfirmationError &&
          (error.kind === "denied" || error.kind === "missing")
        ) {
          finished = true;
          setHomeFallback(attemptId);
        } else
          timer = setTimeout(() => {
            timer = undefined;
            void release();
          }, 30000);
      } finally {
        clearTimeout(timeout);
        busy = false;
      }
    }
    const resume = () => {
      if (!document.hidden && !timer) void release();
    };
    void release();
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", resume);
    };
  }, [wantsExpiry, attemptId, sessionRevision]);
  const invoiceDeadline = contextMatches
    ? context.value.checking.deadlineMs
    : undefined;
  const invoiceClock = contextMatches ? context.value.clock : undefined;
  const hasSavedConfirmation = !!saved;
  useEffect(() => {
    if (
      (view !== "confirmed" && !hasSavedConfirmation) ||
      checkoutMode === "synthetic" ||
      (hasSavedConfirmation &&
        (!invoiceDeadline || checkoutNow(invoiceClock) >= invoiceDeadline))
    )
      return;
    const controller = new AbortController();
    receiptWork.current = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reads = 0;
    const finish = () =>
      setInvoiceFinished({
        id: attemptId,
        revision: sessionRevision,
        read: receiptRead,
      });
    const deadlineTimer = invoiceDeadline
      ? setTimeout(
          () => {
            controller.abort();
            clearTimeout(timer);
            finish();
          },
          Math.max(0, invoiceDeadline - checkoutNow(invoiceClock, true)),
        )
      : undefined;
    // Optional invoice enrichment shares the server's original checking window.
    // Six paced reads bound work even when a provider never issues a document.
    const read = async () => {
      const refresh = reads++ > 0;
      try {
        const value = await readBookingReceipt(
          attemptId,
          controller.signal,
          refresh,
        );
        if (controller.signal.aborted) return;
        setReceipt({ value, revision: sessionRevision });
        if (value.booking.providerReferences?.invoiceNumber) {
          clearTimeout(deadlineTimer);
          finish();
          return;
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ConfirmationError && error.kind === "denied") {
          clearTimeout(deadlineTimer);
          setHomeFallback(attemptId);
          finish();
          return;
        }
        if (!refresh)
          setReceiptFailure({ id: attemptId, revision: sessionRevision });
      }
      if (
        reads < 6 &&
        invoiceDeadline &&
        checkoutNow(invoiceClock) + 10000 < invoiceDeadline
      )
        timer = setTimeout(() => void read(), 10000);
      else {
        clearTimeout(deadlineTimer);
        finish();
      }
    };
    void read();
    return () => {
      controller.abort();
      clearTimeout(timer);
      clearTimeout(deadlineTimer);
    };
  }, [
    attemptId,
    view,
    checkoutMode,
    sessionRevision,
    receiptRead,
    hasSavedConfirmation,
    invoiceDeadline,
    invoiceClock,
  ]);
  const [expiredLink, setExpiredLink] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [preparation, setPreparation] = useState("loading");
  useEffect(() => {
    if (!checkoutMode) return;
    let active = true;
    let reading = false;
    let finished = false;
    let nextReadMs = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    /** Recover missing checkout context without replacing the current status display. */
    async function read() {
      if (
        !active ||
        finished ||
        reading ||
        document.hidden ||
        Date.now() < nextReadMs
      )
        return;
      clearTimeout(timer);
      reading = true;
      const request = new AbortController();
      controller = request;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const value = await Promise.race([
          protectedCheckoutService.context({
            attemptId,
            mode: checkoutMode!,
            signal: request.signal,
          }),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
              request.abort();
              reject(new ConfirmationError("unavailable"));
            }, 10000);
          }),
        ]);
        if (!active) return;
        finished = true;
        bindWindow(value.checking);
        setContext({ value, revision: sessionRevision });
        setPreparation("ready");
      } catch (error) {
        if (!active) return;
        setPreparation("unavailable");
        setContextFailure({ id: attemptId, revision: sessionRevision });
        if (
          error instanceof ConfirmationError &&
          (error.kind === "denied" || error.kind === "missing")
        ) {
          finished = true;
          setHomeFallback(attemptId);
        } else {
          nextReadMs = Math.max(
            Date.now() + 30000,
            error instanceof ConfirmationError ? (error.nextCheckMs ?? 0) : 0,
          );
          timer = setTimeout(() => {
            timer = undefined;
            void read();
          }, nextReadMs - Date.now());
        }
      } finally {
        clearTimeout(timeout);
        reading = false;
      }
    }
    void read();
    const resume = () => {
      if (!document.hidden) void read();
    };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false;
      controller?.abort();
      clearTimeout(timer);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [attemptId, checkoutMode, sessionRevision, bindWindow]);
  const current =
    context?.value.attemptId === attemptId &&
    context.value.mode === checkoutMode &&
    context.revision === sessionRevision &&
    view !== "denied"
      ? context.value
      : null;
  useEffect(() => {
    if (current) bindWindow(current.checking);
  }, [current, bindWindow, contextSettled]);
  useEffect(
    () => () => receiptWork.current?.abort(),
    [attemptId, sessionRevision],
  );
  const link =
    current?.checkout.state === "available" ? current.checkout : null;
  useEffect(() => {
    if (!link?.expiresAtMs) return;
    const timer = setTimeout(
      () => setExpiredLink(link.url),
      Math.max(0, link.expiresAtMs - checkoutNow(current?.clock, true)),
    );
    return () => clearTimeout(timer);
  }, [link, current?.clock]);
  const paymentDeadline =
    current?.checking.paymentExpiresAtMs ?? link?.expiresAtMs;
  const [elapsedPaymentWindow, setElapsedPaymentWindow] = useState<{
    id: string;
    revision: number;
    deadline: number;
  } | null>(null);
  const paymentWindowEnded =
    !!current?.clock &&
    paymentDeadline !== undefined &&
    (checkoutNow(current.clock, true) >= paymentDeadline ||
      (elapsedPaymentWindow?.id === attemptId &&
        elapsedPaymentWindow.revision === sessionRevision &&
        elapsedPaymentWindow.deadline === paymentDeadline));
  useEffect(() => {
    if (
      checkoutMode !== "live" ||
      !current?.clock ||
      paymentDeadline === undefined
    )
      return;
    const clock = current.clock;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      clearTimeout(timer);
      const remaining = paymentDeadline - checkoutNow(clock, true);
      if (remaining <= 0)
        setElapsedPaymentWindow({
          id: attemptId,
          revision: sessionRevision,
          deadline: paymentDeadline,
        });
      else timer = setTimeout(check, remaining);
    };
    check();
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [
    attemptId,
    sessionRevision,
    checkoutMode,
    current?.clock,
    paymentDeadline,
  ]);
  const recordedPayment = current?.payment;
  useEffect(() => {
    if ((!incomplete && !linkRecovering) || !checkoutMode) return;
    let timer: ReturnType<typeof setTimeout>;
    let reading = false;
    const controller = new AbortController();
    let pollAfterMs = 5000;
    let nextReadMs = Date.now() + pollAfterMs;
    const read = async () => {
      if (reading || controller.signal.aborted || Date.now() < nextReadMs)
        return;
      clearTimeout(timer);
      reading = true;
      try {
        const value = await protectedCheckoutService.context({
          attemptId,
          mode: checkoutMode,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        pollAfterMs = Math.max(
          value.checking.pollAfterMs,
          Date.now() >= checkoutRecoveryDeadline(attemptId) ? 30000 : 5000,
        );
        setContext({ value, revision: sessionRevision });
      } catch (error) {
        // A failed read cannot clear the uncertain attempt or authorize another write.
        if (controller.signal.aborted) return;
        if (
          error instanceof ConfirmationError &&
          (error.kind === "denied" || error.kind === "missing")
        ) {
          controller.abort();
          setHomeFallback(attemptId);
          setContext(null);
          setContextFailure({ id: attemptId, revision: sessionRevision });
          return;
        }
        pollAfterMs = Math.max(
          Math.min(pollAfterMs * 2, 30000),
          error instanceof ConfirmationError && error.nextCheckMs
            ? error.nextCheckMs - Date.now()
            : 0,
        );
      } finally {
        reading = false;
      }
      if (!controller.signal.aborted) {
        nextReadMs = Date.now() + pollAfterMs;
        timer = setTimeout(() => void read(), pollAfterMs);
      }
    };
    const resume = () => {
      if (document.visibilityState === "visible") void read();
    };
    timer = setTimeout(() => void read(), pollAfterMs);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [incomplete, linkRecovering, checkoutMode, attemptId, sessionRevision]);
  const selectionRejection =
    view === "denied"
      ? undefined
      : (statusRejection ??
        (contextMatches ? context.value.selectionRejection : undefined));
  const rejectionState = selectionRejection?.state;
  const rejectionIndex = selectionRejection?.rejectedSessionIndex;
  const rejectionIndices = selectionRejection?.rejectedSessionIndices;
  const hasPaymentEvidence = !!(
    recordedPayment ||
    paymentReceived ||
    saved ||
    customerConfirmation ||
    (contextMatches && context.value.customerConfirmation) ||
    view === "confirmed"
  );
  const [expiryWait, setExpiryWait] = useState<{
    id: string;
    revision: number;
    paymentDeadline: number;
    ended: boolean;
  } | null>(null);
  const calendarReturned = useRef<string | null>(null);
  const [recoveryTimedOut, setRecoveryTimedOut] = useState<string | null>(null);
  const postPayment =
    checkoutMode === "live" &&
    confirmationRoute &&
    (hasPaymentEvidence ||
      (providerReturn && !allowPaymentContinuation) ||
      completedPaymentReturn(attemptId));
  useEffect(() => {
    if (confirmationRoute && providerReturn && !allowPaymentContinuation)
      completedPaymentReturn(attemptId, true);
  }, [confirmationRoute, providerReturn, allowPaymentContinuation, attemptId]);
  const [confirmationTimedOut, setConfirmationTimedOut] = useState<
    string | null
  >(null);
  useEffect(() => {
    if (!postPayment || checkoutMode !== "live" || view === "denied") return;
    const deadline = checkoutRecoveryDeadline(
      attemptId,
      Date.now(),
      "confirmation",
    );
    const timer = setTimeout(
      () => setConfirmationTimedOut(attemptId),
      Math.max(0, deadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [postPayment, checkoutMode, attemptId, view]);
  const awaitingCreation =
    checkoutMode === "live" &&
    !calendarRecovery &&
    !postPayment &&
    !paymentWindowEnded &&
    !wantsExpiry &&
    !(
      contextMatches &&
      checkoutNow(context.value.clock) >= context.value.checking.deadlineMs
    ) &&
    !hasPaymentEvidence &&
    !link &&
    view !== "denied" &&
    !rejectionState &&
    !(contextMatches && context.value.creationResolution);
  const leaveUnresolved = useEffectEvent(() => {
    setRecoveryTimedOut(attemptId);
    if (onAwaitingExpiry?.(attemptId, true)) {
      calendarReturned.current = attemptId;
      router.replace("/book/time/");
    } else {
      // A missing local attempt cannot accept a Calendar recovery handoff.
      // Keep server reconciliation and stored locks intact; only leave this view.
      setHomeFallback(attemptId);
    }
  });
  const creationDeadline = awaitingCreation
    ? checkoutRecoveryDeadline(attemptId)
    : undefined;
  useEffect(() => {
    if (
      !awaitingCreation ||
      !contextSettled ||
      !(confirmationReadSettled || incomplete || linkRecovering) ||
      creationDeadline === undefined ||
      recoveryTimedOut === attemptId
    )
      return;
    const timer = setTimeout(
      () => leaveUnresolved(),
      Math.max(0, creationDeadline - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [
    awaitingCreation,
    contextSettled,
    confirmationReadSettled,
    incomplete,
    linkRecovering,
    creationDeadline,
    attemptId,
    sessionRevision,
    recoveryTimedOut,
  ]);
  const needsExpiryReconciliation =
    checkoutMode === "live" &&
    !calendarRecovery &&
    !postPayment &&
    paymentWindowEnded &&
    !wantsExpiry &&
    !hasPaymentEvidence &&
    !rejectionState &&
    view !== "denied";
  const awaitingFreshExpiryStatus =
    paymentDeadline !== undefined &&
    (responseCheckedAtMs === undefined ||
      responseCheckedAtMs < paymentDeadline);
  const expiryWaitEnded =
    expiryWait?.id === attemptId &&
    expiryWait.revision === sessionRevision &&
    expiryWait.paymentDeadline === paymentDeadline &&
    expiryWait.ended;
  const reconcilingExpiry = needsExpiryReconciliation && !expiryWaitEnded;
  useEffect(() => {
    if (
      !needsExpiryReconciliation ||
      paymentDeadline === undefined ||
      !current?.clock
    )
      return;
    const deadline = expiryReconciliationDeadline(
      attemptId,
      paymentDeadline,
      Date.now(),
      awaitingFreshExpiryStatus,
    );
    const started = performance.now();
    const remainingAtStart = Math.max(0, deadline - Date.now());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      const remaining = Math.min(
        deadline - Date.now(),
        remainingAtStart - Math.max(0, performance.now() - started),
      );
      setExpiryWait({
        id: attemptId,
        revision: sessionRevision,
        paymentDeadline,
        ended: remaining <= 0,
      });
      if (remaining > 0) timer = setTimeout(update, remaining);
    };
    update();
    if (Date.now() < deadline) checkConfirmation();
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [
    needsExpiryReconciliation,
    awaitingFreshExpiryStatus,
    paymentDeadline,
    current?.clock,
    attemptId,
    sessionRevision,
    checkConfirmation,
  ]);
  const creationResolved =
    view !== "denied" &&
    !!(
      statusCreationResolution ??
      (contextMatches ? context.value.creationResolution : undefined)
    );
  const finishCreationResolution = useEffectEvent((id: string) =>
    onCreationResolved?.(id),
  );
  useEffect(() => {
    if (
      creationResolved &&
      !hasPaymentEvidence &&
      finishCreationResolution(attemptId) &&
      !calendarRecovery
    )
      router.replace("/book/time/");
  }, [
    creationResolved,
    calendarRecovery,
    hasPaymentEvidence,
    attemptId,
    sessionRevision,
    router,
  ]);
  const rejectSelection = useEffectEvent(
    (id: string, rejection: CheckoutSelectionRejection, signal: AbortSignal) =>
      onSelectionRejected?.(id, rejection, signal),
  );
  useEffect(() => {
    if (!rejectionState || hasPaymentEvidence) return;
    const controller = new AbortController();
    const rejection: CheckoutSelectionRejection = {
      state: rejectionState,
      ...(rejectionIndex === undefined
        ? {}
        : { rejectedSessionIndex: rejectionIndex }),
      ...(rejectionIndices === undefined
        ? {}
        : { rejectedSessionIndices: rejectionIndices }),
    };
    void Promise.resolve(
      rejectSelection(attemptId, rejection, controller.signal),
    )
      .then((rejected) => {
        if (!controller.signal.aborted && rejected && !calendarRecovery)
          router.replace("/book/time/");
      })
      .catch(() => {
        /* Unknown recovery remains on its original protected attempt. */
      });
    return () => {
      controller.abort();
    };
  }, [
    attemptId,
    sessionRevision,
    rejectionState,
    calendarRecovery,
    rejectionIndex,
    rejectionIndices,
    hasPaymentEvidence,
    router,
  ]);
  const historicalPayment =
    !!recordedPayment && ["unresolved", "unavailable"].includes(view);
  const showLink =
    !recordedPayment &&
    !paymentReceived &&
    current?.checkout.state === "available" &&
    current.checkout.url !== expiredLink &&
    !["confirmed", "denied", "unresolved"].includes(view);
  const recoverableHandoff =
    checkoutMode === "live" &&
    allowPaymentContinuation &&
    view === "unavailable" &&
    showLink &&
    !!link &&
    isHitpayCheckoutUrl(link.url) &&
    !expired;
  const customerProof = !["denied", "unresolved"].includes(view)
    ? (customerConfirmation ??
      (contextMatches ? context.value.customerConfirmation : undefined))
    : undefined;
  const displayedReceipt =
    (view === "confirmed" || saved) &&
    receipt?.value.attemptId === attemptId &&
    receipt.revision === sessionRevision
      ? receipt.value
      : saved
        ? bookingFromReceipt(saved)
        : customerProof
          ? bookingFromReceipt(customerProof)
          : view === "confirmed" && current?.details
            ? bookingFromReceipt(current.details)
            : null;
  const returnExpiredCheckout = useEffectEvent(() => {
    if (onAwaitingExpiry?.(attemptId)) {
      calendarReturned.current = attemptId;
      router.replace("/book/time/");
    } else if (confirmationRoute) {
      calendarReturned.current = attemptId;
      setHomeFallback(attemptId);
    }
  });
  useEffect(() => {
    if (calendarRecovery) {
      if (hasPaymentEvidence || displayedReceipt) {
        onPaymentDetected?.(attemptId);
        router.replace(
          `/confirmation/?attempt=${encodeURIComponent(attemptId)}`,
        );
      }
      return;
    }
    if (
      checkoutMode !== "live" ||
      postPayment ||
      !current ||
      hasPaymentEvidence ||
      displayedReceipt ||
      rejectionState ||
      reconcilingExpiry ||
      (awaitingCreation && !wantsExpiry) ||
      (!paymentWindowEnded &&
        !wantsExpiry &&
        (view !== "unresolved" ||
          checkoutNow(current.clock) < current.checking.deadlineMs)) ||
      calendarReturned.current === attemptId
    )
      return;
    returnExpiredCheckout();
  }, [
    calendarRecovery,
    confirmationRoute,
    postPayment,
    checkoutMode,
    view,
    current,
    hasPaymentEvidence,
    displayedReceipt,
    wantsExpiry,
    paymentWindowEnded,
    reconcilingExpiry,
    awaitingCreation,
    sessionRevision,
    rejectionState,
    attemptId,
    onAwaitingExpiry,
    onPaymentDetected,
    router,
  ]);
  const receiptUnavailable =
    receiptFailure?.id === attemptId &&
    receiptFailure.revision === sessionRevision;
  const receiptMatches =
    (view === "confirmed" || !!saved) &&
    receipt?.value.attemptId === attemptId &&
    receipt.revision === sessionRevision;
  const confirmedCard = !!displayedReceipt;
  const repeatedProviderReturn =
    providerReturn && seenConfirmation && !!saved && view !== "denied";
  useEffect(() => {
    if (repeatedProviderReturn) {
      if (returnedHome.current === attemptId) return;
      returnedHome.current = attemptId;
      router.replace("/");
      if (onRestart) void Promise.resolve(onRestart(attemptId)).catch(() => {});
    } else if (confirmedCard && !silent) markConfirmationSeen(attemptId);
  }, [
    repeatedProviderReturn,
    confirmedCard,
    silent,
    attemptId,
    router,
    onRestart,
  ]);
  useConfirmationRenderTrace({
    attemptId,
    revision: sessionRevision,
    state:
      checkoutMode !== "live" || expiryFailure || view === "denied"
        ? undefined
        : confirmedCard
          ? "confirmed"
          : paymentReceived
            ? "payment_received"
            : current && allowPaymentContinuation && showLink && !expired
              ? "summary"
              : undefined,
    proofSource: receiptMatches
      ? "receipt"
      : saved
        ? "saved"
        : customerConfirmation
          ? "status_proof"
          : customerProof
            ? "context_proof"
            : view === "confirmed"
              ? "confirmed_status"
              : "none",
    evidence:
      (receiptMatches ? receipt.value : saved) ??
      customerProof ??
      (paymentReceived || view === "confirmed" ? responseEvidence : current),
    receipt: receiptMatches ? receipt.value : undefined,
  });
  if (
    homeFallback === attemptId ||
    (checkoutMode === "live" && view === "denied")
  )
    return silent ? null : <ConfirmationHome />;
  if (homeDeparture) return homeDeparture;
  if (silent || repeatedProviderReturn) return null;
  if (reconcilingExpiry) return <BrandLoading label="Checking payment…" />;
  if (rejectionState && !hasPaymentEvidence)
    return <BrandLoading compact label={CONFLICT_CHECKING} />;
  if (
    !calendarRecovery &&
    checkoutMode === "live" &&
    paymentWindowEnded &&
    !postPayment &&
    !hasPaymentEvidence &&
    !rejectionState &&
    view !== "denied"
  )
    return <BrandLoading overlay={false} label="Checking payment…" />;
  if (calendarRecovery && view !== "denied")
    return (
      <div className="alert" role="alert">
        {paymentReceived || recordedPayment || displayedReceipt ? (
          <p>
            Payment received. Opening your booking status. Do not pay again.
          </p>
        ) : (
          <>
            <p>{PAYMENT_WINDOW_ENDED}</p>
            {!!current?.summary.sessions.length && (
              <ul>
                {current.summary.sessions.map((session, index) => {
                  const wall = new Date(
                    session.startMs + 8 * 3600000,
                  ).toISOString();
                  const start = wall.slice(11, 16);
                  return (
                    <li key={`${session.startMs}:${index}`}>
                      {dateLabel(wall.slice(0, 10))}, {start}–{endTime(start)}.
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    );
  if (displayedReceipt && checkoutMode !== "synthetic") {
    const confirmation = (
      <BookingConfirmation
        booking={displayedReceipt.booking}
        invoicePending={
          !!invoiceDeadline &&
          checkoutNow(invoiceClock) < invoiceDeadline &&
          !(
            invoiceFinished?.id === attemptId &&
            invoiceFinished.revision === sessionRevision &&
            invoiceFinished.read === receiptRead
          )
        }
        verifiedAtMs={customerProof?.verifiedAtMs ?? saved?.verifiedAtMs}
        onAgain={async () => {
          if (onRestart) {
            await onRestart(attemptId);
            router.push("/book/account/");
            return;
          }
          if (checkoutMode === "live") await dismissCompletedBooking(attemptId);
          onAgain?.();
          window.location.assign(sitePath("/book/account/"));
        }}
        onHome={() => {
          setHomeDeparture(confirmation);
          router.push("/");
          if (onRestart)
            void Promise.resolve(onRestart(attemptId)).catch(() => {});
          else {
            if (checkoutMode === "live")
              void dismissCompletedBooking(attemptId).catch(() => {});
            onAgain?.();
          }
        }}
      />
    );
    return confirmation;
  }
  if (
    postPayment &&
    checkoutMode === "live" &&
    confirmationTimedOut === attemptId &&
    contextSettled &&
    (confirmationReadSettled || incomplete || linkRecovering) &&
    !confirmedCard &&
    !displayedReceipt &&
    view !== "denied" &&
    !creationResolved
  ) {
    if (!current) return <ConfirmationHome />;
    const notice = (
      <div className="alert booking-help-notice" role="alert">
        <div className="booking-help-content">
          <p>
            <strong>{CHECKOUT_UNRESOLVED}</strong>
          </p>
        </div>
        <BookingHelp key={attemptId} attemptId={attemptId} />
      </div>
    );
    const label =
      paymentReceived || recordedPayment || view === "confirmed"
        ? "Payment received; booking confirmation pending"
        : "Pending";
    if (current?.details)
      return (
        <BookingConfirmation
          booking={bookingFromReceipt(current.details).booking}
          pending
          pendingLabel={label}
          pendingNotice={notice}
          onAgain={() => {}}
        />
      );
    return (
      <PendingConfirmation label={label} pendingNotice={notice} showSummary>
        <ConfirmationSummary
          summary={current.summary}
          details={current.details}
        />
      </PendingConfirmation>
    );
  }
  if (postPayment && view !== "denied" && !confirmedCard)
    return (
      <BrandLoading
        label={
          paymentReceived || recordedPayment
            ? "Payment received. Confirming booking."
            : "Checking payment…"
        }
      />
    );
  if (creationResolved && !hasPaymentEvidence)
    return <BrandLoading label="Checking booking…" />;
  if (recoveryTimedOut === attemptId && awaitingCreation)
    return <BrandLoading label="Checking booking…" />;
  if (awaitingCreation && !contextMatches)
    return <BrandLoading label="Checking booking…" />;
  if (
    linkRecovering &&
    !paymentReceived &&
    !recordedPayment &&
    view !== "denied"
  )
    return <BrandLoading label="Preparing your payment link…" />;
  if (
    current?.paymentIssue === "link_unavailable" &&
    !paymentReceived &&
    !recordedPayment &&
    view !== "confirmed" &&
    view !== "denied"
  )
    return <BrandLoading label="Preparing your payment link…" />;
  if (
    current?.bookingIssue === "incomplete" &&
    !paymentReceived &&
    !recordedPayment &&
    view !== "confirmed" &&
    view !== "denied"
  )
    return <BrandLoading label="Checking whether your booking was created…" />;
  if (awaitingCreation && (view === "unavailable" || view === "unresolved"))
    return <BrandLoading label="Checking booking…" />;
  if (
    checkoutMode === "live" &&
    !postPayment &&
    !hasPaymentEvidence &&
    view === "unresolved" &&
    current &&
    checkoutNow(current.clock) >= current.checking.deadlineMs
  )
    return <BrandLoading overlay={false} label="Checking payment…" />;
  if (expiryFailure && view !== "denied")
    return <BrandLoading label="Checking payment…" />;
  if (
    ((view === "checking" || recoverableHandoff) &&
      !(showLink && link && !isHitpayCheckoutUrl(link.url))) ||
    (view === "confirmed" &&
      checkoutMode !== "synthetic" &&
      !receiptUnavailable)
  ) {
    const pendingLabel =
      view === "confirmed"
        ? "Preparing confirmation…"
        : checkoutMode && preparation === "loading"
          ? "Checking booking…"
          : paymentReceived
            ? "Payment received. Confirming booking."
            : "Checking payment…";
    // Both payment and provider return may reopen the same server-authorized
    // unpaid handoff. Known money or an expired deadline still hides it.
    const continuation =
      allowPaymentContinuation &&
      showLink &&
      !expired &&
      (view === "checking" || recoverableHandoff) &&
      current?.clock &&
      link?.expiresAtMs &&
      isHitpayCheckoutUrl(link.url) ? (
        <PaymentContinuation
          key={link.url}
          clock={current.clock}
          url={link.url}
          expiresAtMs={link.expiresAtMs}
        />
      ) : undefined;
    const pendingMessage = continuation
      ? "Continue to pay. If already paid, please wait..."
      : undefined;
    if (current?.details) {
      const details = bookingFromReceipt(current.details);
      return (
        <BookingConfirmation
          booking={details.booking}
          pending
          pendingLabel={pendingLabel}
          pendingMessage={pendingMessage}
          pendingAction={continuation}
          onAgain={() => {}}
        />
      );
    }
    return (
      <PendingConfirmation
        label={pendingLabel}
        message={pendingMessage}
        showSummary={!!continuation}
      >
        {current ? (
          <>
            <ConfirmationSummary
              summary={current.summary}
              details={current.details}
            />
            {continuation}
          </>
        ) : undefined}
      </PendingConfirmation>
    );
  }
  if (checkoutMode !== "synthetic" && confirmationRoute) {
    // A successful handoff already owns navigation; never race it with Home.
    if (recoveryTimedOut === attemptId) return null;
    return <ConfirmationHome />;
  }
  return (
    <div className="status-shell">
      <section className="surface confirmation-card" aria-live="polite">
        {checkoutMode === "synthetic" && (
          <p className="payment-foot">
            Experiment 1 · Synthetic Preview · No payment or booking is made
          </p>
        )}
        <div
          className={
            ["denied", "unavailable"].includes(view) ||
            (view === "unresolved" && (paymentReceived || historicalPayment))
              ? "alert"
              : "notice"
          }
          role={
            ["denied", "unavailable"].includes(view) ||
            (view === "unresolved" && (paymentReceived || historicalPayment))
              ? "alert"
              : "status"
          }
        >
          {!(
            view === "unresolved" &&
            !paymentReceived &&
            !historicalPayment
          ) && (
            <h1 className="message-heading">
              {historicalPayment
                ? "Payment received"
                : paymentReceived && view !== "confirmed" && view !== "denied"
                  ? "Payment received; booking confirmation pending"
                  : view === "checking"
                    ? "Complete your payment"
                    : view === "confirmed"
                      ? "Booking Confirmed"
                      : "Confirmation unavailable"}
            </h1>
          )}
          <p>
            {historicalPayment
              ? "Payment received. Contact us about your booking. Do not pay again."
              : view === "confirmed"
                ? "Your booking is confirmed."
                : view === "denied"
                  ? "Contact the studio to view this booking. Don’t pay again."
                  : view === "checking"
                    ? "Checking booking."
                    : paymentReceived
                      ? "Payment received. Contact us about your booking. Do not pay again."
                      : view === "unavailable"
                        ? "Payment status is temporarily unavailable. We’ll check again automatically."
                        : "Payment is still unconfirmed. Contact the studio before booking or paying again."}
          </p>
        </div>
        {historicalPayment && recordedPayment && (
          <p>
            Payment verified:{" "}
            {new Intl.DateTimeFormat("en-SG", {
              timeZone: "Asia/Singapore",
              dateStyle: "medium",
              timeStyle: "short",
            }).format(recordedPayment.paidAtMs)}{" "}
            (Singapore time)
          </p>
        )}
        {view === "confirmed" && receiptUnavailable && (
          <div className="alert" role="alert">
            <p>Booking confirmed. Try loading your details again.</p>
            <button
              className="button"
              onClick={() => {
                setReceiptFailure(null);
                setReceiptRead((value) => value + 1);
              }}
            >
              Load booking details
            </button>
          </div>
        )}
        {current && (
          <ConfirmationSummary
            summary={current.summary}
            details={current.details}
          />
        )}
        {checkoutMode &&
          showLink &&
          !recordedPayment &&
          !!link &&
          !isHitpayCheckoutUrl(link.url) && (
            <>
              <p>
                Checkout opens separately. Return here to check your booking.
              </p>
              <a
                className="button wide"
                href={link.url}
                data-booking-continuation
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                onClick={(event) => {
                  if (
                    link?.expiresAtMs &&
                    checkoutNow(current?.clock, true) >= link.expiresAtMs
                  ) {
                    event.preventDefault();
                    setExpiredLink(link.url);
                  } else setOpened(attemptId);
                }}
              >
                {opened === attemptId ? "Open checkout again" : "Open checkout"}
              </a>
            </>
          )}
      </section>
    </div>
  );
}

/** Render the retained session summary while confirmation is unresolved. */
function ConfirmationSummary({
  summary,
  details,
}: {
  summary: CheckoutContext["summary"];
  details?: CheckoutContext["details"];
}) {
  if (details) {
    const { booking } = bookingFromReceipt(details);
    return (
      <section
        className="booking-document"
        aria-label="Current booking summary"
      >
        <SessionSummaryHeading
          draft={{ ...booking.draft, slots: booking.slots }}
        />
        <SessionList slots={booking.slots} showPrices />
        <div className="summary-total">
          <span>Total</span>
          <strong>
            <span className="total-currency">SGD</span>{" "}
            {money(summary.totalMinor)}
          </strong>
        </div>
      </section>
    );
  }
  return (
    <section aria-label="Current booking summary">
      <h2 className="section-title">Your booking</h2>
      <p>
        {summary.players} player{summary.players === 1 ? "" : "s"} ·{" "}
        {summary.sessions.length} session
        {summary.sessions.length === 1 ? "" : "s"}
      </p>
      <ul>
        {summary.sessions.map((session, index) => (
          <li key={index}>
            {new Intl.DateTimeFormat("en-SG", {
              timeZone: "Asia/Singapore",
              dateStyle: "medium",
              timeStyle: "short",
            }).format(session.startMs)}{" "}
            · {session.players} player{session.players === 1 ? "" : "s"}
          </li>
        ))}
      </ul>
      <p className="line-item total">
        Total{" "}
        <strong>
          <span className="total-currency">SGD</span>{" "}
          {money(summary.totalMinor)}
        </strong>
      </p>
    </section>
  );
}
