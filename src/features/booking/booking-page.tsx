"use client";
import Link from "next/link";
import { hasIdentityEntry, takeIdentityEntry } from "@/services/identity";
import { sitePath } from "@/content/site-path";
import {
  isBookingDeparture,
  isUnresolvedCheckout,
  liveCheckoutAttemptId,
} from "@/services/storage";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BookingHeadingStatus,
  BookingHeadingTargets,
  VerifiedEmailStatus,
} from "./booking-heading";
import { guardedStep, type BookingStep } from "@/domain/booking";
import { Icon } from "@/components/icon";
import {
  BookingLoading as BrandLoading,
  checkoutRouteLoadingLabel,
} from "./booking-loading";
import { useBooking } from "./provider";
import { AccountStep } from "./account-step";
import { SessionStep } from "./session-step";
import {
  ProtectedConfirmation,
  useRepaymentSuppression,
} from "./protected-confirmation";
import { TimeStep } from "./time-step";
import { DetailsStep } from "./details-step";
import { ReviewStep } from "./review-step";
import { PaymentStep } from "./payment-step";
import { ConfirmationStep } from "./confirmation-step";
import { Summary, BasketContinue } from "./summary";
import { BookingTools, useMobileBooking } from "./booking-tools";
/** Publish the actual pinned progress height to its sibling sticky cart. */
export function BookingProgressHeader({ children }: { children: ReactNode }) {
  const header = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = header.current;
    const shell = element?.closest<HTMLElement>(".booking-shell");
    if (!element || !shell) return;
    const measure = () =>
      shell.style.setProperty(
        "--booking-navigation-height",
        `${element.getBoundingClientRect().height}px`,
      );
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      shell.style.removeProperty("--booking-navigation-height");
    };
  }, []);
  return (
    <div ref={header} className="booking-navigation">
      {children}
    </div>
  );
}

const progress: Array<[BookingStep, string]> = [
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
  const [titleTarget, setTitleTarget] = useState<HTMLDivElement | null>(null);
  const [statusTarget, setStatusTarget] = useState<HTMLDivElement | null>(null);
  const [accountBack, setAccountBack] = useState<(() => void) | null>(null);
  const registerAccountBack = useCallback((back: (() => void) | null) => {
    setAccountBack(() => back);
  }, []);
  const {
      identityService,
      profileAccessRevision,
      ready,
      draft,
      attempt,
      now,
      bookingService,
      setCalendarBrowsing,
      visitBookingStep,
      browsingCheckout,
      detachCheckout,
      action,
      confirmationRevision,
      restartAfterExpiry,
      rejectRecoveredSelection,
      resolveUncreatedBooking,
      resumePaymentStatus,
      browseAfterChecking,
    } = useBooking(),
    router = useRouter();
  const [identity, setIdentity] = useState(() => identityService.current());
  useEffect(() => {
    if (
      step === "account" ||
      hasIdentityEntry(identityService, true) ||
      identityService.mode !== "live"
    )
      return;
    let active = true;
    const entry = takeIdentityEntry(identityService, true);
    void entry.promise.then((value) => {
      if (active) setIdentity(value);
    });
    return () => {
      active = false;
      entry.cancel();
    };
  }, [identityService, step]);
  const verifiedIdentity =
    identity &&
    identity.expiresAt > now &&
    identityService.current()?.email === identity.email
      ? identity
      : null;
  const headingStatus = (
    <div className="booking-identity-status" aria-label="Booking identity">
      {verifiedIdentity ? (
        <VerifiedEmailStatus email={verifiedIdentity.email} />
      ) : (
        <span className="pill booking-guest-status">Guest</span>
      )}
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
  const unresolvedCreation =
    action.calendarRecovery &&
    attempt &&
    (action.unresolvedCheckout || isUnresolvedCheckout(attempt.id));
  const actual =
      profileAccessRevision > 0 && !draft.mode
        ? "account"
        : action.returnToCalendar &&
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
                  ? ["account", "session", "time"].includes(step) ||
                    (!unresolvedCreation &&
                      ["details", "review"].includes(step))
                    ? guardedStep(step, draft, null, now)
                    : "time"
                  : guardedStep(
                      step,
                      draft,
                      browsingCheckout ? null : attempt,
                      now,
                    ),
    current = progress.findIndex(([id]) => id === displayStep);
  const retainingReview =
    !action.calendarRecovery &&
    step === "details" &&
    actual === "review" &&
    attempt?.held === true;
  const retainedAttemptId = attempt?.id ?? liveCheckoutAttemptId();
  const suppressRepayment = useRepaymentSuppression(
    retainedAttemptId ?? undefined,
  );
  const returningToConfirmation =
    bookingService.mode === "live" && !!retainedAttemptId && suppressRepayment;
  const returningFromUnresolvedCreation =
    unresolvedCreation &&
    ["details", "review", "payment", "confirmation"].includes(step);
  useEffect(() => {
    if (ready && returningToConfirmation && retainedAttemptId) {
      router.replace(
        isBookingDeparture(retainedAttemptId)
          ? "/"
          : `/confirmation/?attempt=${encodeURIComponent(retainedAttemptId)}`,
      );
      return;
    }
    if (!ready || actual === step) return;
    if (returningFromUnresolvedCreation && attempt && !action.returnToCalendar)
      browseAfterChecking(attempt.id, true);
    if (retainingReview) {
      // Review is already interactive. Commit its URL without remounting it
      // through the app-router loading boundary. Refresh still opens Review.
      window.history.replaceState(null, "", sitePath("/book/review/"));
    } else router.replace(`/book/${actual}/`);
  }, [
    actual,
    step,
    ready,
    router,
    retainingReview,
    returningToConfirmation,
    retainedAttemptId,
    attempt,
    returningFromUnresolvedCreation,
    action.returnToCalendar,
    browseAfterChecking,
  ]);
  useEffect(() => {
    if (ready && (actual === step || retainingReview)) visitBookingStep(actual);
  }, [ready, actual, step, retainingReview, visitBookingStep]);
  useEffect(() => {
    setCalendarBrowsing(["account", "session", "time"].includes(actual));
    return () => setCalendarBrowsing(true);
  }, [actual, setCalendarBrowsing]);
  // Review is already mounted after creation. Preserve it while the URL
  // catches up after verification; routing must not bring the overlay back.
  if (
    !ready ||
    returningToConfirmation ||
    (actual !== step && !retainingReview)
  )
    return (
      <BrandLoading
        label={
          returningToConfirmation
            ? "Checking payment…"
            : (checkoutRouteLoadingLabel(`/book/${actual}/`) ??
              checkoutRouteLoadingLabel(`/book/${step}/`))
        }
      />
    );
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
      <BookingHeadingTargets.Provider
        value={mobile ? null : { title: titleTarget, status: statusTarget }}
      >
        <div
          className={`booking-shell ${["account", "session", "review"].includes(displayStep) ? "session-shell" : ""}`}
        >
          {(current >= 0 || displayStep === "account") && (
            <BookingProgressHeader>
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
                    onNavigate={
                      step === "review" && action.operation === "checkout"
                        ? detachCheckout
                        : undefined
                    }
                    href={
                      current > 0
                        ? `/book/${progress[current - 1][0]}/`
                        : displayStep === "session"
                          ? "/book/account/"
                          : "/"
                    }
                  >
                    <Icon name="back" />
                    <span className="back-label">
                      {displayStep === "account" ? "Home" : "Back"}
                    </span>
                  </Link>
                )}
                {!mobile && (
                  <>
                    <div className="booking-top-title" ref={setTitleTarget} />
                    <div className="booking-top-meta">
                      <div
                        className="booking-top-identity"
                        ref={setStatusTarget}
                      />
                    </div>
                  </>
                )}
                {current >= 0 && (
                  <span className="booking-current-step">
                    {progress[current][1]} · {current + 1} of {progress.length}
                  </span>
                )}
                {mobile &&
                  ["time", "details", "review"].includes(displayStep) && (
                    <BookingTools basket={displayStep === "time"} />
                  )}
              </div>
              {current >= 0 && (
                <ol className="progress" aria-label="Booking progress">
                  {progress.map(([id, label], index) => (
                    <li
                      key={id}
                      aria-current={index === current ? "step" : undefined}
                      className={
                        index === current
                          ? "active"
                          : index < current
                            ? "done"
                            : ""
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
              )}
            </BookingProgressHeader>
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
                      key={profileAccessRevision}
                      onBackChange={registerAccountBack}
                      onIdentityChange={setIdentity}
                    />
                  ) : (
                    <Screen />
                  )}
                </>
              )}
              {!mobile && displayStep === "time" && <BasketContinue />}
            </section>
            {!mobile && ["time", "details"].includes(displayStep) && (
              <Summary basket={step === "time"} />
            )}
            {mobile && displayStep === "time" && <BasketContinue />}
          </div>
        </div>
      </BookingHeadingTargets.Provider>
    </BookingHeadingStatus.Provider>
  );
}
