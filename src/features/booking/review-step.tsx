"use client";
import { BookingHeading } from "./booking-heading";
import { CheckoutBotProof } from "./email-bot-proof";
import {
  BookingPrimaryAction,
  BookingActionTotal,
} from "./booking-primary-action";
import { BookingLoading as BrandLoading } from "./booking-loading";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { Dialog } from "@/components/dialog";
import { selectionErrors } from "@/domain/booking";
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
export function Arrival({ compact = false }: { compact?: boolean } = {}) {
  return (
    <section className="arrival-information" aria-label="Before your session">
      {!compact && <h3>Before your session</h3>}
      <p className="arrival-time">
        <strong>Arrive 10 minutes early.</strong>
        <span>
          {compact
            ? "Late arrivals may not receive extra time."
            : "Latecomers may not be given extra time."}
        </span>
      </p>
      <p>
        {compact
          ? "Wear activewear and soccer boots (preferred) or sports shoes; bring a towel."
          : "Wear training gear or activewear. Soccer boots are preferred; sports shoes are also suitable. Bring your own towel."}
      </p>
      {compact && <p>Follow your instructor’s safety guidance.</p>}
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
      cancel,
      conflictLoadingLabel,
      clearReviewConsent,
      ready,
      bookingService,
    } = useBooking(),
    router = useRouter();
  const [policy, setPolicy] = useState(false);
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
      cancel();
    };
  }, [cancel, clearReviewConsent]);
  useEffect(() => {
    if (ready) clearReviewConsent();
  }, [ready, clearReviewConsent]);
  const error = action.error;
  const [navigating, startNavigation] = useTransition();
  const busy = action.status === "loading" || navigating;
  const checkingProof =
    draft.accepted && needsProof && !botToken && proofPending && !busy;
  const locked = verifying || (!action.calendarRecovery && attempt?.held);
  const canProceed =
    !action.calendarRecovery &&
    !verifying &&
    !busy &&
    (!needsProof || !!botToken) &&
    draft.accepted &&
    selectionErrors(draft.slots, now).length === 0;
  return (
    <>
      <BookingHeading lines={["Review", "Booking"]} />
      <p className="lead">Check your details before payment.</p>
      <section className="surface booking-document">
        <ReviewSessions part="heading" verifying={verifying} />
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
        <ReviewSessions part="order" verifying={verifying} />
        <Arrival />
      </section>
      <label className="check-label review-terms">
        <input
          type="checkbox"
          checked={draft.accepted}
          onChange={(e) => update({ accepted: e.target.checked })}
        />
        <span>
          I’ve reviewed all selected dates and times and the{" "}
          <button className="text-link" onClick={() => setPolicy(true)}>
            booking information
          </button>
          .
        </span>
      </label>
      {profileSaveError && (
        <div className="alert" role="alert">
          <p>{profileSaveError}</p>
          <button className="text-link" onClick={() => void saveContact()}>
            Try again
          </button>
        </div>
      )}
      {error && error !== profileSaveError && (
        <div className="alert mt-5" role="alert">
          {error}
          {action.resumeAttemptId && (
            <Link
              className="text-link ml-3"
              href={`/confirmation/?attempt=${encodeURIComponent(action.resumeAttemptId)}`}
            >
              View existing checkout
            </Link>
          )}
          {!attempt?.held && (
            <Link className="text-link ml-3" href="/book/time/">
              Review selections
            </Link>
          )}
        </div>
      )}
      {needsProof && !busy && (
        <CheckoutBotProof
          key={botGeneration}
          onToken={setBotToken}
          onPendingChange={setProofPending}
        />
      )}
      <BookingPrimaryAction className="actions" ready={canProceed}>
        <button
          className="button"
          disabled={!canProceed}
          aria-busy={checkingProof || undefined}
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
          {verifying ? (
            "Checking reservation…"
          ) : busy ? (
            <BrandLoading
              compact
              label={conflictLoadingLabel ?? "Opening checkout…"}
            />
          ) : (
            "Proceed to Payment"
          )}{" "}
          <BookingActionTotal />
          {checkingProof ? (
            <span aria-hidden="true">
              <Icon name="spinner" className="spinner" />
            </span>
          ) : !busy ? (
            <Icon name="chevron" />
          ) : null}
        </button>
      </BookingPrimaryAction>
      {verifying && (
        <p className="notice" role="status">
          Reservation checking. Please do not close or refresh.
        </p>
      )}
      {policy && (
        <Dialog title="Booking information" onClose={() => setPolicy(false)}>
          <div className="space-y-4">
            <p>
              Each session is 40 minutes for 1–4 players with one instructor in
              the shared studio. Start times are 50 minutes apart.
            </p>
            <p>
              {!action.calendarRecovery &&
                attempt?.held &&
                "Your Sessions are temporarily reserved. Complete payment before the reservation expires. "}
              Follow the instructor’s safety guidance.
            </p>
            <p>
              Contact the studio for changes, cancellations and applicable
              refund policies. Cancellation and refund are separate actions.
            </p>
          </div>
        </Dialog>
      )}
    </>
  );
}

/** Reuse review selections and their existing edit locks in inline and phone-panel layouts. */
function ReviewSessions({
  part,
  verifying = false,
}: {
  part?: "heading" | "order";
  verifying?: boolean;
}) {
  const { draft, attempt, now, action } = useBooking();
  const locked = verifying || (!action.calendarRecovery && attempt?.held);
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
