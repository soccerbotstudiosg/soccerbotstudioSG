"use client";
import { BookingHeading } from "./booking-heading";
import { CheckoutBotProof } from "./email-bot-proof";
import {
  BookingPrimaryAction,
  ContinuePaymentAction,
  BookingActionTotal,
} from "./booking-primary-action";
import { BookingLoading as BrandLoading } from "./booking-loading";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { hitpayLogo } from "@/content/media";
import { money } from "@/domain/dates";
import { totalCents, selectionErrors } from "@/domain/booking";
import { CONTACT_METHODS } from "@/domain/catalog";
import { normalizeContact, type ContactDetails } from "@/domain/contact";
import { useBooking } from "./provider";
import { PriceSummary, SessionList, SessionSummaryHeading } from "./summary";
/** Render the customer's contact details for booking review. */
export function ClientDetails({ contact }: { contact: ContactDetails }) {
  const c = normalizeContact(contact);
  return (
    <dl className="booking-facts client-details">
      <dt>Full name</dt>
      <dd>{c.name}</dd>
      <dt>Email address</dt>
      <dd>{c.email}</dd>
      <dt>Mobile number</dt>
      <dd>{c.phone}</dd>
      <dt>Preferred contact method</dt>
      <dd>
        {CONTACT_METHODS[c.contactMethod as keyof typeof CONTACT_METHODS]}
      </dd>
      {c.academy && (
        <>
          <dt>Academy / school / organisation</dt>
          <dd>{c.academy}</dd>
        </>
      )}
    </dl>
  );
}
/** Present the session arrival instructions. */
export function Arrival({ className = "" }: { className?: string } = {}) {
  return (
    <section
      className={`arrival-information${className ? ` ${className}` : ""}`}
      aria-label="Before your session"
    >
      <h3>Before your session</h3>
      <p className="arrival-time">
        <strong>Please arrive 10 minutes early.</strong>
      </p>
      <ul className="arrival-points">
        <li>Wear training gear or activewear.</li>
        <li>Soccer boots preferred; sports shoes are suitable.</li>
        <li>Bring your own towel.</li>
        <li>Follow your instructor’s safety guidance.</li>
      </ul>
    </section>
  );
}
/** Review selections and consent before starting checkout. */
export function ReviewStep({
  verifying = false,
}: { verifying?: boolean } = {}) {
  const {
      draft,
      attempt,
      update,
      checkout,
      saveContact,
      profileSaveError,
      now,
      action,
      detachCheckout,
      browsingCheckout,
      conflictLoadingLabel,
      clearReviewConsent,
      ready,
      bookingService,
    } = useBooking(),
    router = useRouter();
  const [botToken, setBotToken] = useState("");
  const [proofPending, setProofPending] = useState(false);
  const [botGeneration, setBotGeneration] = useState(0);
  const needsProof =
    bookingService.mode === "live" && !attempt?.held && !verifying;
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    clearReviewConsent();
    window.addEventListener("pagehide", clearReviewConsent);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", clearReviewConsent);
      clearReviewConsent();
      detachCheckout();
    };
  }, [detachCheckout, clearReviewConsent]);
  useEffect(() => {
    if (ready) clearReviewConsent();
  }, [ready, clearReviewConsent]);
  const error = action.error;
  const [navigating, startNavigation] = useTransition();
  const busy = action.status === "loading" || navigating;
  const checkingProof =
    draft.accepted && needsProof && !botToken && proofPending && !busy;
  const locked =
    browsingCheckout ||
    verifying ||
    (!action.calendarRecovery && attempt?.held === true);
  const canProceed =
    !action.calendarRecovery &&
    !verifying &&
    !busy &&
    (!needsProof || !!botToken) &&
    draft.accepted &&
    selectionErrors(draft.slots, now).length === 0;
  const reviewSummary = (
    <>
      <BookingHeading lines={["Review", "Booking"]} />
      <p className="lead booking-step-instruction">
        Review your booking before payment.
      </p>
      <section className="surface booking-document">
        <ReviewSessions part="heading" locked={locked} />
        <div className="review-block">
          <div className="review-head">
            <h2>Booking Contact</h2>
            {!locked && (
              <Link className="text-link" href="/book/details/">
                Edit
              </Link>
            )}
          </div>
          <ClientDetails contact={draft.contact} />
        </div>
        <ReviewSessions part="order" locked={locked} />
        <Arrival />
      </section>
    </>
  );
  if (browsingCheckout)
    return (
      <>
        {reviewSummary}
        <ContinuePaymentAction />
      </>
    );
  return (
    <>
      {reviewSummary}
      <label className="check-label review-terms">
        <input
          type="checkbox"
          checked={draft.accepted}
          onChange={(e) => update({ accepted: e.target.checked })}
        />
        <span>
          I’ve reviewed all selected options. I accept the{" "}
          <Link
            className="text-link"
            href="/terms-of-service/"
            data-booking-continuation
            target="_blank"
            rel="noopener"
          >
            Terms and Conditions
          </Link>
          .
        </span>
      </label>
      {profileSaveError && (
        <div className="alert review-feedback" role="alert">
          <p>{profileSaveError}</p>
          <button className="text-link" onClick={() => void saveContact()}>
            Try again
          </button>
        </div>
      )}
      {error && error !== profileSaveError && (
        <div className="alert review-feedback" role="alert">
          <p>{error}</p>
          {action.resumeAttemptId && (
            <Link
              className="text-link"
              href={`/confirmation/?attempt=${encodeURIComponent(action.resumeAttemptId)}`}
            >
              View existing checkout
            </Link>
          )}
          {!attempt?.held && (
            <Link className="text-link" href="/book/time/">
              Review selections
            </Link>
          )}
        </div>
      )}
      {action.calendarRecovery && (
        <p className="notice review-feedback" role="status">
          Checking your previous payment. You can proceed once we confirm the
          previous booking was released.
        </p>
      )}
      {needsProof && !busy && (
        <CheckoutBotProof
          key={botGeneration}
          onToken={setBotToken}
          onPendingChange={setProofPending}
        />
      )}
      <BookingPrimaryAction
        className="actions"
        ready={canProceed}
        loading={checkingProof || busy || verifying}
      >
        <button
          className="button checkout-payment-button"
          aria-describedby="checkout-redirect"
          disabled={!canProceed}
          aria-busy={checkingProof || undefined}
          aria-label={
            checkingProof
              ? `Proceed to Payment ${money(totalCents(draft))}`
              : undefined
          }
          onClick={async () => {
            try {
              if (
                (await checkout(needsProof ? botToken : undefined)) &&
                mounted.current
              )
                startNavigation(() => router.push("/book/payment/"));
            } finally {
              if (mounted.current) {
                setBotToken("");
                setBotGeneration((generation) => generation + 1);
              }
            }
          }}
        >
          <span className="checkout-primary-line">
            {(checkingProof || busy || verifying) && (
              <Icon name="spinner" className="spinner" />
            )}
            {verifying ? (
              "Checking reservation…"
            ) : busy ? (
              <BrandLoading
                compact
                label={conflictLoadingLabel ?? "Opening checkout…"}
              />
            ) : checkingProof ? (
              "Checking security…"
            ) : (
              "Proceed to Payment"
            )}{" "}
            <BookingActionTotal />
            {!checkingProof && !busy ? (
              <Icon name="lock" className="checkout-lock" />
            ) : null}
            <img
              className="checkout-button-logo"
              src={hitpayLogo}
              width={108}
              height={28}
              alt=""
              aria-hidden="true"
            />
          </span>
          <span
            id="checkout-redirect"
            className="checkout-redirect"
            aria-hidden="true"
          >
            You’ll be redirected to{" "}
            <img src={hitpayLogo} width={108} height={28} alt="HitPay" /> to
            complete your payment.
          </span>
        </button>
      </BookingPrimaryAction>
      {verifying && (
        <p className="notice" role="status">
          Reservation checking. Please do not close or refresh.
        </p>
      )}
    </>
  );
}

/** Reuse review selections and their existing edit locks in inline and phone-panel layouts. */
function ReviewSessions({
  part,
  locked,
}: {
  part?: "heading" | "order";
  locked: boolean;
}) {
  const { draft, now } = useBooking();
  const cartHeading = (
    <div className="review-block">
      <SessionSummaryHeading
        selectedService
        draft={draft}
        action={
          !locked && (
            <Link className="text-link" href="/book/session/">
              Edit
            </Link>
          )
        }
      />
    </div>
  );
  const cartOrder = (
    <div className="review-block">
      <div className="review-head">
        <h2>Order Summary</h2>
        {!locked && (
          <Link className="text-link" href="/book/time/">
            Edit
          </Link>
        )}
      </div>
      <SessionList slots={draft.slots} now={now} showPrices />
      <PriceSummary draft={draft} />
    </div>
  );
  if (part === "heading") return cartHeading;
  if (part === "order") return cartOrder;
  return (
    <div className="booking-document">
      {cartHeading}
      {cartOrder}
    </div>
  );
}
