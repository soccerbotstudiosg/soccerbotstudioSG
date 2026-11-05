"use client";
import { isHitpayCheckoutUrl } from "@/domain/native-checkout";
import { SessionList, SessionSummaryHeading } from "./summary";
import { BookingLoading as BrandLoading } from "./booking-loading";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingConfirmation, PendingConfirmation } from "./confirmation-step";
type BookingReceipt = Awaited<ReturnType<typeof readBookingReceipt>>;
import { sitePath } from "@/content/site-path";
import {
  checkoutNow,
  readBookingReceipt,
  dismissCompletedBooking,
  expireBooking,
  bookingFromReceipt,
  protectedCheckoutService,
} from "@/services/confirmation";
import type { CheckoutContext } from "@/services/contracts";
import { money } from "@/domain/dates";
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
        className="button wide"
        href={url}
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
/** Present protected checkout status without trusting browser payment claims. */
export function ProtectedConfirmation({
  attemptId,
  checkoutMode,
  allowPaymentContinuation = false,
  sessionRevision = 0,
  onAgain,
  onRestart,
  onExpired,
}: {
  attemptId: string;
  checkoutMode?: "synthetic" | "live";
  allowPaymentContinuation?: boolean;
  sessionRevision?: number;
  onAgain?: () => void;
  onExpired?: (attemptId: string) => void;
  onRestart?: (attemptId: string) => void | Promise<void>;
}) {
  const router = useRouter();
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
  const {
    view,
    busy,
    check,
    feedback,
    bindWindow,
    paymentReceived,
    responseEvidence,
    customerConfirmation,
    expired,
  } = useConfirmationChecking(
    attemptId,
    sessionRevision,
    (!checkoutMode || contextSettled) && !saved,
    contextMatches ? context.value.checking.deadlineMs : undefined,
    contextMatches ? context.value.checking.holdExpiresAtMs : undefined,
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
  const finishExpiry = useEffectEvent(() => {
    onExpired?.(attemptId);
    router.replace("/book/time/");
  });
  const expiryWork = useRef<{ id: string; work: Promise<void> } | null>(null);
  const wantsExpiry =
    expired || (contextMatches && context.value.expired === true);
  const [failedExpiry, setFailedExpiry] = useState<{
    id: string;
    revision: number;
  } | null>(null);
  const expiryFailure =
    failedExpiry?.id === attemptId && failedExpiry.revision === sessionRevision;
  useEffect(() => {
    if (!wantsExpiry) return;
    if (expiryWork.current?.id !== attemptId)
      expiryWork.current = { id: attemptId, work: expireBooking(attemptId) };
    let active = true;
    void expiryWork.current.work.then(
      () => {
        if (!active) return;
        finishExpiry();
      },
      () => {
        if (active)
          setFailedExpiry({ id: attemptId, revision: sessionRevision });
      },
    );
    return () => {
      active = false;
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
      } catch {
        if (controller.signal.aborted) return;
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
    const controller = new AbortController();
    void protectedCheckoutService
      .context({ attemptId, mode: checkoutMode, signal: controller.signal })
      .then(
        (value) => {
          if (active) {
            bindWindow(value.checking);
            setContext({ value, revision: sessionRevision });
            setPreparation("ready");
          }
        },
        () => {
          if (active) {
            setPreparation("unavailable");
            setContextFailure({ id: attemptId, revision: sessionRevision });
          }
        },
      );
    return () => {
      active = false;
      controller.abort();
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
  const recordedPayment = current?.payment;
  const historicalPayment =
    !!recordedPayment && ["unresolved", "unavailable"].includes(view);
  const showLink =
    !recordedPayment &&
    !paymentReceived &&
    current?.checkout.state === "available" &&
    current.checkout.url !== expiredLink &&
    !["confirmed", "denied", "unresolved"].includes(view);
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
          : null;
  const receiptUnavailable =
    receiptFailure?.id === attemptId &&
    receiptFailure.revision === sessionRevision;
  const receiptMatches =
    (view === "confirmed" || !!saved) &&
    receipt?.value.attemptId === attemptId &&
    receipt.revision === sessionRevision;
  const confirmedCard =
    !!displayedReceipt || (view === "confirmed" && receiptUnavailable);
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
            : current
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
  if (displayedReceipt && checkoutMode !== "synthetic") {
    return (
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
        onHome={async () => {
          if (onRestart) {
            await onRestart(attemptId);
            router.push("/");
            return;
          }
          if (checkoutMode === "live") await dismissCompletedBooking(attemptId);
          onAgain?.();
          window.location.assign(sitePath("/"));
        }}
      />
    );
  }
  if (expiryFailure)
    return (
      <p className="alert" role="alert">
        Still checking your payment. Don’t pay again.
      </p>
    );
  if (
    (view === "checking" &&
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
      view === "checking" &&
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
      <PendingConfirmation label={pendingLabel} message={pendingMessage}>
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
          <h1 className="message-heading">
            {historicalPayment ? (
              "Payment received"
            ) : paymentReceived && view !== "confirmed" && view !== "denied" ? (
              "Payment received; booking confirmation pending"
            ) : view === "checking" ? (
              showLink && link && !isHitpayCheckoutUrl(link.url) ? (
                "Complete your payment"
              ) : (
                <BrandLoading
                  compact
                  label={
                    checkoutMode && preparation === "loading"
                      ? "Preparing checkout…"
                      : "Checking payment…"
                  }
                />
              )
            ) : view === "confirmed" ? (
              "Booking confirmed"
            ) : view === "unresolved" ? (
              "Please check your payment"
            ) : (
              "Confirmation unavailable"
            )}
          </h1>
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
                        ? "Payment status unavailable. Please check again shortly."
                        : "We’re still checking your payment. If you haven’t paid, please wait a moment while we check whether you can book again. If you were charged, don’t pay again; contact us."}
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
              {showLink && current?.checkout.state === "available" ? (
                <a
                  className="button wide"
                  href={current.checkout.url}
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
                  {opened === attemptId
                    ? "Open checkout again"
                    : "Open checkout"}
                </a>
              ) : view === "checking" || view === "unavailable" ? (
                <p className="notice" role="status">
                  {preparation === "loading" ? (
                    <BrandLoading compact label="Preparing checkout…" />
                  ) : (
                    "Checkout unavailable. Don’t pay again; contact the studio."
                  )}
                </p>
              ) : null}
            </>
          )}
        {feedback && !busy && !["confirmed", "denied"].includes(view) && (
          <p className="hint" role="status">
            {feedback}
          </p>
        )}
        {!["confirmed", "denied"].includes(view) && (
          <button
            className="button secondary wide payment-status-action"
            disabled={busy}
            onClick={check}
          >
            {busy ? (
              <BrandLoading compact label="Checking status…" />
            ) : (
              "Check status"
            )}
          </button>
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
          <strong>{money(summary.totalMinor)}</strong>
        </div>
        <p className="hint summary-currency">SGD · Final total</p>
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
        Total <strong>{money(summary.totalMinor)}</strong>
      </p>
    </section>
  );
}
