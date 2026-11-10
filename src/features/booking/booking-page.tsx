"use client";
import Link from "next/link";
import { sitePath } from "@/content/site-path";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingHeadingStatus } from "./booking-heading";
import { guardedStep, type BookingStep } from "@/domain/booking";
import { Icon } from "@/components/icon";
import { BookingLoading as BrandLoading } from "./booking-loading";
import { useBooking } from "./provider";
import { AccountStep } from "./account-step";
import { SessionStep } from "./session-step";
import { ProtectedConfirmation } from "./protected-confirmation";
import { TimeStep } from "./time-step";
import { DetailsStep } from "./details-step";
import { ReviewStep } from "./review-step";
import { PaymentStep } from "./payment-step";
import { ConfirmationStep } from "./confirmation-step";
import { Summary, BasketContinue } from "./summary";
import { BookingTools, useMobileBooking } from "./booking-tools";
const progress: Array<[BookingStep, string]> = [
  ["account", "Booking"],
  ["session", "Session"],
  ["time", "Time"],
  ["details", "Details"],
  ["review", "Review"],
];
const screens = {
  account: AccountStep,
  session: SessionStep,
  time: TimeStep,
  details: DetailsStep,
  review: ReviewStep,
  payment: PaymentStep,
  confirmation: ConfirmationStep,
};
/** Render the guarded booking step and its navigation controls. */
export function BookingPage({ step }: { step: BookingStep }) {
  const mobile = useMobileBooking();
  const [leavingAccount, setLeavingAccount] = useState(false);
  const [accountBack, setAccountBack] = useState<(() => void) | null>(null);
  const registerAccountBack = useCallback((back: (() => void) | null) => {
    setAccountBack(() => back);
  }, []);
  const {
      identityService,
      ready,
      draft,
      attempt,
      now,
      bookingService,
      setCalendarBrowsing,
      visitBookingStep,
      action,
      confirmationRevision,
      restartAfterExpiry,
      rejectRecoveredSelection,
      resolveUncreatedBooking,
      resumePaymentStatus,
    } = useBooking(),
    router = useRouter();
  const [identity, setIdentity] = useState(() => identityService.current());
  useEffect(() => {
    if (
      step === "account" ||
      identityService.current() ||
      !identityService.readCurrent
    )
      return;
    const controller = new AbortController();
    void identityService
      .readCurrent(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setIdentity(value);
      })
      .catch(() => {
        /* Unverified identity is presented as Guest. */
      });
    return () => controller.abort();
  }, [identityService, step]);
  const verifiedIdentity =
    identity &&
    identity.expiresAt > now &&
    identityService.current()?.email === identity.email
      ? identity
      : null;
  const headingStatus = (
    <div className="booking-identity-status" aria-label="Booking identity">
      <span
        className={verifiedIdentity ? undefined : "pill booking-guest-status"}
      >
        {verifiedIdentity?.email ?? "Guest"}
      </span>
    </div>
  );
  const handingOff =
    !action.calendarRecovery &&
    bookingService.mode === "live" &&
    (step === "review" || (step === "details" && attempt?.held)) &&
    !!attempt &&
    (action.status === "loading" || action.status === "success") &&
    action.operation === "checkout";
  const reserving =
    bookingService.mode === "live" &&
    step === "details" &&
    action.operation === "reserve" &&
    action.status === "loading";
  const pendingReview =
    !action.calendarRecovery &&
    step === "details" &&
    attempt?.verifying === true;
  const displayStep =
    !action.calendarRecovery &&
    step === "details" &&
    (attempt?.verifying || attempt?.held)
      ? "review"
      : step;
  const actual =
      action.returnToCalendar &&
      ["time", "details", "review", "payment"].includes(step)
        ? "time"
        : handingOff || reserving
          ? step
          : bookingService.mode === "live" &&
              bookingService.operations.availability === "unavailable" &&
              step !== "account"
            ? "session"
            : bookingService.mode === "live" &&
                !attempt &&
                draft.mode &&
                step === "payment"
              ? "time"
              : action.calendarRecovery && attempt
                ? ["account", "session", "time", "details", "review"].includes(
                    step,
                  )
                  ? guardedStep(step, draft, null, now)
                  : "time"
                : guardedStep(step, draft, attempt, now),
    current = progress.findIndex(([id]) => id === displayStep);
  const retainingReview =
    !action.calendarRecovery &&
    step === "details" &&
    actual === "review" &&
    attempt?.held === true;
  useEffect(() => {
    if (leavingAccount || !ready || actual === step) return;
    if (retainingReview) {
      // Review is already interactive. Commit its URL without remounting it
      // through the app-router loading boundary. Refresh still opens Review.
      window.history.replaceState(null, "", sitePath("/book/review/"));
    } else router.replace(`/book/${actual}/`);
  }, [actual, step, ready, router, retainingReview, leavingAccount]);
  useEffect(() => {
    if (ready && (actual === step || retainingReview)) visitBookingStep(actual);
  }, [ready, actual, step, retainingReview, visitBookingStep]);
  useEffect(() => {
    setCalendarBrowsing(["account", "session", "time"].includes(actual));
    return () => setCalendarBrowsing(true);
  }, [actual, setCalendarBrowsing]);
  // Review is already mounted after creation. Preserve it while the URL
  // catches up after verification; routing must not bring the overlay back.
  if (!ready || (!leavingAccount && actual !== step && !retainingReview))
    return <BrandLoading overlay={false} />;
  const Screen = screens[step];
  if (step === "payment" || step === "confirmation") return <Screen />;
  const recoveryNotice = action.calendarRecovery && attempt && (
    <ProtectedConfirmation
      attemptId={attempt.id}
      checkoutMode="live"
      calendarRecovery
      silent
      sessionRevision={confirmationRevision}
      onExpired={restartAfterExpiry}
      onSelectionRejected={rejectRecoveredSelection}
      onCreationResolved={resolveUncreatedBooking}
      onPaymentDetected={resumePaymentStatus}
    />
  );
  return (
    <BookingHeadingStatus.Provider value={headingStatus}>
      <div
        className={`booking-shell ${["account", "session", "review"].includes(displayStep) ? "session-shell" : ""}`}
      >
        {current >= 0 && (
          <div className="booking-navigation">
            <div className="booking-top">
              {step === "account" && accountBack ? (
                <button type="button" className="back" onClick={accountBack}>
                  <Icon name="back" />
                  <span className="back-label">Back</span>
                </button>
              ) : pendingReview ? (
                <span className="back" aria-disabled="true">
                  <Icon name="back" />
                  Back
                </span>
              ) : (
                <Link
                  className="back"
                  href={
                    current > 0 ? `/book/${progress[current - 1][0]}/` : "/"
                  }
                >
                  <Icon name="back" />
                  <span className="back-label">
                    {current ? "Back" : "Home"}
                  </span>
                </Link>
              )}
              <span className="eyebrow text-muted">Booking</span>
              <span className="booking-current-step">
                {progress[current][1]} · {current + 1} of {progress.length}
              </span>
              {mobile &&
                ["time", "details", "review"].includes(displayStep) && (
                  <BookingTools basket={displayStep === "time"} />
                )}
            </div>
            <ol className="progress" aria-label="Booking progress">
              {progress.map(([id, label], index) => (
                <li
                  key={id}
                  aria-current={index === current ? "step" : undefined}
                  className={
                    index === current ? "active" : index < current ? "done" : ""
                  }
                >
                  <span className="step-number">
                    {index < current ? (
                      <Icon name="check" className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  {index < current && !pendingReview ? (
                    <Link href={`/book/${id}/`} className="hover:underline">
                      {label}
                    </Link>
                  ) : (
                    label
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
        <div
          className={
            ["time", "details"].includes(displayStep)
              ? "booking-layout"
              : "booking-layout session-layout"
          }
        >
          <section className="booking-main min-w-0">
            {step === "time" ? (
              <TimeStep recoveryNotice={recoveryNotice} />
            ) : (
              <>
                {recoveryNotice}
                {step === "account" ? (
                  <AccountStep
                    onBackChange={registerAccountBack}
                    onIdentityChange={setIdentity}
                    onExit={() => setLeavingAccount(true)}
                  />
                ) : (
                  <Screen />
                )}
              </>
            )}
          </section>
          {!mobile && ["time", "details"].includes(displayStep) && (
            <Summary basket={step === "time"} />
          )}
          {mobile && displayStep === "time" && <BasketContinue />}
        </div>
      </div>
    </BookingHeadingStatus.Provider>
  );
}
