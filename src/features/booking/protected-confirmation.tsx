"use client";
import { isHitpayCheckoutUrl } from "@/domain/native-checkout";
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
    <div>
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
  onRestart?: (attemptId: string) => void;
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
  const finishExpiry = useEffectEvent(() => {
    onExpired?.(attemptId);
    router.replace("/book/time/");
  });
  const expiryWork = useRef<{ id: string; work: Promise<void> } | null>(null);
  const wantsExpiry =
    expired || (contextMatches && context.value.expired === true);
  const [expiryFailure, setExpiryFailure] = useState(false);
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
        if (active) setExpiryFailure(true);
      },
    );
    return () => {
      active = false;
    };
  }, [wantsExpiry, attemptId, sessionRevision]);
  useEffect(() => {
    if (view !== "confirmed" || checkoutMode === "synthetic") return;
    const controller = new AbortController();
    receiptWork.current = controller;
    void readBookingReceipt(attemptId, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted)
          setReceipt({ value, revision: sessionRevision });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setReceiptFailure({ id: attemptId, revision: sessionRevision });
      });
    return () => controller.abort();
  }, [attemptId, view, checkoutMode, sessionRevision, receiptRead]);
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
  const displayedReceipt = saved
    ? bookingFromReceipt(saved)
    : view === "confirmed" &&
        receipt?.value.attemptId === attemptId &&
        receipt.revision === sessionRevision
      ? receipt.value
      : customerProof
        ? bookingFromReceipt(customerProof)
        : null;
  const receiptUnavailable =
    receiptFailure?.id === attemptId &&
    receiptFailure.revision === sessionRevision;
  const receiptMatches =
    view === "confirmed" &&
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
    proofSource: saved
      ? "saved"
      : receiptMatches
        ? "receipt"
        : customerConfirmation
          ? "status_proof"
          : customerProof
            ? "context_proof"
            : view === "confirmed"
              ? "confirmed_status"
              : "none",
    evidence:
      saved ??
      (receiptMatches
        ? receipt.value
        : (customerProof ??
          (paymentReceived || view === "confirmed"
            ? responseEvidence
            : current))),
    receipt: receiptMatches ? receipt.value : undefined,
  });
  if (displayedReceipt && checkoutMode !== "synthetic") {
    return (
      <BookingConfirmation
        booking={displayedReceipt.booking}
        verifiedAtMs={customerProof?.verifiedAtMs ?? saved?.verifiedAtMs}
        onAgain={async () => {
          if (onRestart) {
            onRestart(attemptId);
            router.push("/book/account/");
            return;
          }
          if (checkoutMode === "live") await dismissCompletedBooking(attemptId);
          onAgain?.();
          window.location.assign(sitePath("/book/account/"));
        }}
        onHome={async () => {
          if (onRestart) {
            onRestart(attemptId);
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
            ? "Paid—confirming booking…"
            : "Checking payment…";
    // Only the original payment step may reopen an unpaid handoff. The provider
    // return route remains confirmation-only, even before payment evidence arrives.
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
      ? "Complete your payment below. If you have paid, please wait for confirmation."
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
            <ConfirmationSummary summary={current.summary} />
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
        <h1>
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
            "Payment needs checking"
          ) : (
            "Can’t load confirmation"
          )}
        </h1>
        <p>
          {historicalPayment
            ? "Payment received. Contact the studio for booking help. Don’t pay again."
            : view === "confirmed"
              ? "Your booking is confirmed."
              : view === "denied"
                ? "Contact the studio to view this booking. Don’t pay again."
                : view === "checking"
                  ? "Checking booking."
                  : view === "unavailable"
                    ? "We couldn’t check your payment. Try checking again shortly."
                    : "We couldn’t confirm your payment. Don’t pay again; contact the studio."}
        </p>
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
        {current && <ConfirmationSummary summary={current.summary} />}
        {checkoutMode &&
          !recordedPayment &&
          !(link && isHitpayCheckoutUrl(link.url)) && (
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
        {!["confirmed", "unresolved", "denied"].includes(view) && (
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
}: {
  summary: CheckoutContext["summary"];
}) {
  return (
    <section aria-label="Current booking summary">
      <h2 className="section-title">Your booking</h2>
      <p>
        {summary.players} players · {summary.sessions.length} session
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
            · {session.players} players
          </li>
        ))}
      </ul>
      <p className="line-item total">
        Total <strong>{money(summary.totalMinor)}</strong>
      </p>
    </section>
  );
}
