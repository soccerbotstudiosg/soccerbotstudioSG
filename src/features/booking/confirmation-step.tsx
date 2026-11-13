"use client";
import { BookingLoading, loadingMessage } from "./booking-loading";
import { BrandLoading as InlineLoading } from "@/components/brand-loading";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { ADDRESS, BOOKING_SUPPORT } from "@/domain/catalog";
import { dateLabel, endTime, money } from "@/domain/dates";
import {
  orderedSlots,
  sessionInstructorName,
  type Booking,
} from "@/domain/booking";
import { useBooking } from "./provider";
import { SessionList, SessionSummaryHeading } from "./summary";
import { Arrival, ClientDetails } from "./review-step";
/** Share only the visible confirmed booking summary, never payment links or credentials. */
export function bookingConfirmationMessage(booking: Booking) {
  return [
    "SOCCERBOTSTUDIO Singapore",
    "Booking confirmed · Paid",
    ...(booking.providerReferences?.invoiceNumber
      ? [`Invoice: ${booking.providerReferences.invoiceNumber}`]
      : []),
    "",
    ...orderedSlots(booking.slots).flatMap((slot, index) => [
      `${index + 1}. ${dateLabel(slot.date)}`,
      `${slot.start}–${endTime(slot.start)} SGT`,
      ...(slot.native?.serviceName ? [slot.native.serviceName] : []),
      `Trainer: ${sessionInstructorName(slot)}`,
      "",
    ]),
    `Players: ${booking.draft.players}`,
    `Location: ${[...new Set(booking.slots.map((slot) => slot.studio))].join(", ")}`,
    ADDRESS,
    "",
    `Total paid: SGD ${money(booking.totalCents)}`,
  ].join("\n");
}
/** Copy a confirmed receipt and keep transient feedback scoped to its mounted booking. */
function ConfirmationCopy({ booking }: { booking: Booking }) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "failed">(
    "idle",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generation = useRef(0);
  const busy = useRef(false);
  useEffect(
    () => () => {
      generation.current += 1;
      clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    if (busy.current) return;
    busy.current = true;
    const request = ++generation.current;
    clearTimeout(timer.current);
    setState("copying");
    try {
      await navigator.clipboard.writeText(bookingConfirmationMessage(booking));
      if (request !== generation.current) return;
      setState("copied");
      timer.current = setTimeout(() => setState("idle"), 3000);
    } catch {
      if (request === generation.current) setState("failed");
    } finally {
      if (request === generation.current) busy.current = false;
    }
  }
  return (
    <div className="confirmation-copy-control">
      <button
        type="button"
        className="icon-button confirmation-copy"
        aria-label="Copy booking confirmation"
        title="Copy booking confirmation"
        disabled={state === "copying"}
        onClick={() => void copy()}
      >
        <Icon
          name={state === "copying" ? "spinner" : "copy"}
          className={state === "copying" ? "spinner" : ""}
        />
      </button>
      <span
        className={`confirmation-copy-feedback${state === "failed" ? " failed" : ""}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Couldn’t copy. Try again."
            : ""}
      </span>
    </div>
  );
}
function PendingConfirmationHeading({
  label,
  message,
}: {
  label: string;
  message?: string;
}) {
  return (
    <>
      <InlineLoading compact label={label} />
      <p className="text-sm text-muted">{label}</p>
      <p className="text-sm text-muted">{message ?? loadingMessage}</p>
    </>
  );
}

/** Present a pending booking without claiming final confirmation. */
export function PendingConfirmation({
  label = "Checking booking…",
  message,
  children,
  showSummary = false,
  pendingNotice,
}: {
  label?: string;
  message?: string;
  children?: ReactNode;
  showSummary?: boolean;
  pendingNotice?: ReactNode;
}) {
  if (!showSummary) return <BookingLoading label={label} />;
  return (
    <div className="status-shell confirmation-shell">
      {!pendingNotice && (
        <div className="status-heading">
          <PendingConfirmationHeading label={label} message={message} />
        </div>
      )}
      {pendingNotice}
      <section
        className="surface confirmation-card booking-document"
        aria-busy={!pendingNotice}
      >
        {pendingNotice && (
          <div className="review-head">
            <h2>Order Summary</h2>
            <div className="confirmation-paid-actions">
              <span className="pill confirmation-pending-status confirmation-paid-status">
                Pending
              </span>
              {label !== "Pending" && (
                <p className="text-sm text-muted">{label}</p>
              )}
            </div>
          </div>
        )}
        {children ?? (
          <div
            className="confirmation-summary review-block"
            aria-label="Booking summary"
          >
            <strong className="section-title">Your booking</strong>
            <p>Loading summary…</p>
          </div>
        )}
      </section>
    </div>
  );
}

/** Select the appropriate confirmation presentation for the booking state. */
export function ConfirmationStep() {
  const { attempt, reset } = useBooking(),
    router = useRouter(),
    booking = attempt?.booking;
  if (!booking) return null;
  return (
    <BookingConfirmation
      booking={booking}
      preview
      onHome={() => {
        reset();
        router.push("/");
      }}
      onAgain={() => {
        reset();
        router.push("/book/account/");
      }}
    />
  );
}
/** Render confirmed booking details and customer navigation. */
export function BookingConfirmation({
  booking,
  preview = false,
  pending = false,
  pendingLabel = "Checking payment…",
  pendingMessage,
  pendingAction,
  pendingNotice,
  verifiedAtMs,
  invoicePending = false,
  onAgain,
  onHome,
}: {
  booking: Booking;
  preview?: boolean;
  pending?: boolean;
  pendingLabel?: string;
  pendingMessage?: string;
  pendingAction?: ReactNode;
  pendingNotice?: ReactNode;
  verifiedAtMs?: number;
  invoicePending?: boolean;
  onAgain: () => void | Promise<void>;
  onHome?: () => void | Promise<void>;
}) {
  const [error, setError] = useState(""),
    [leaving, setLeaving] = useState(false);
  async function leave(operation: () => void | Promise<void>) {
    if (leaving) return;
    setLeaving(true);
    setError("");
    try {
      await operation();
    } catch {
      setError("Please try again to leave this booking.");
    } finally {
      setLeaving(false);
    }
  }
  if (pending && !pendingAction && !pendingNotice)
    return <BookingLoading label={pendingLabel} />;
  const showReceipt = !pending || !!pendingNotice;
  return (
    <div className="status-shell confirmation-shell">
      {!pendingNotice && (
        <div className="status-heading">
          {pending ? (
            <PendingConfirmationHeading
              label={pendingLabel}
              message={pendingMessage}
            />
          ) : (
            <>
              <span className="status-icon">
                <Icon name="check" />
              </span>
              <h1>Booking Confirmed</h1>
              {!preview && (
                <p>Your booking confirmation will be emailed to you.</p>
              )}
            </>
          )}
          {!pending && verifiedAtMs !== undefined && (
            <p className="confirmation-verified">
              Verified{" "}
              {new Intl.DateTimeFormat("en-SG", {
                timeZone: "Asia/Singapore",
                dateStyle: "medium",
                timeStyle: "short",
              }).format(verifiedAtMs)}{" "}
              (Singapore time)
            </p>
          )}
          {!pending &&
            !preview &&
            (booking.providerReferences?.invoiceNumber || invoicePending) && (
              <p className="reference" aria-live="polite" aria-atomic="true">
                Invoice number{" "}
                {booking.providerReferences?.invoiceNumber ? (
                  <strong
                    className="text-ink confirmation-invoice-value"
                    key={booking.providerReferences.invoiceNumber}
                  >
                    {booking.providerReferences.invoiceNumber}
                  </strong>
                ) : (
                  <span
                    className="confirmation-invoice-loader"
                    role="status"
                    aria-label="Checking invoice number"
                  >
                    <Icon name="spinner" className="spinner" />
                  </span>
                )}
              </p>
            )}
          {!pending && preview && (
            <p className="reference">
              Booking reference{" "}
              <strong className="text-ink">{booking.reference}</strong>
            </p>
          )}
        </div>
      )}
      {!pending && (
        <div className="confirmation-actions" aria-label="Booking actions">
          <button
            className="button secondary"
            disabled={leaving}
            onClick={() => void leave(onAgain)}
          >
            <Icon name="plus" />
            <span>Make another booking</span>
          </button>
          <a
            className="button secondary"
            href={BOOKING_SUPPORT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="phone" />
            <span>WhatsApp Enquiry</span>
          </a>
          <Link
            href="/"
            className="button secondary confirmation-home"
            onClick={
              onHome
                ? (event) => {
                    event.preventDefault();
                    void leave(onHome);
                  }
                : undefined
            }
          >
            Back to home
          </Link>
        </div>
      )}
      {pendingNotice}
      <section className="surface confirmation-card booking-document">
        {pending && !pendingNotice && (
          <div
            className="confirmation-summary review-block"
            aria-label="Booking summary"
          >
            <SessionSummaryHeading
              draft={{ ...booking.draft, slots: booking.slots }}
            />
            <SessionList
              slots={booking.slots}
              showRotation={false}
              showPrices
            />
            <div className="summary-total">
              <span>Total</span>
              <strong>
                <span className="total-currency">SGD</span>{" "}
                {money(booking.totalCents)}
              </strong>
            </div>
          </div>
        )}
        {pending && pendingAction}
        {showReceipt && (
          <div
            className={`confirmation-details-row${!pending && !preview ? " has-copy" : ""}`}
          >
            <details className="confirmation-full-details">
              <summary>View Full Details</summary>
              <div className="confirmation-details-grid">
                <section className="review-block">
                  <SessionSummaryHeading
                    draft={{ ...booking.draft, slots: booking.slots }}
                  />
                </section>
                <section
                  className="confirmation-section review-block"
                  aria-labelledby="confirmation-client"
                >
                  <h2 className="section-title" id="confirmation-client">
                    Booking Contact
                  </h2>
                  <ClientDetails contact={booking.draft.contact} />
                </section>
                <section
                  className="confirmation-section review-block"
                  aria-labelledby="confirmation-location"
                >
                  <h2 className="section-title" id="confirmation-location">
                    Location
                  </h2>
                  <p>
                    <strong>
                      {[
                        ...new Set(booking.slots.map((slot) => slot.studio)),
                      ].join(", ")}
                    </strong>
                    <br />
                    {ADDRESS}
                  </p>
                </section>
                <section
                  className="confirmation-section confirmation-disclaimers review-block"
                  aria-labelledby="confirmation-disclaimers"
                >
                  <h2 className="section-title" id="confirmation-disclaimers">
                    Before Your Session
                  </h2>
                  {booking.slots
                    .filter((slot) => slot.rotationAt)
                    .map((slot) => (
                      <p
                        className="rotation-notice"
                        key={`${slot.date}|${slot.start}`}
                      >
                        {dateLabel(slot.date)}, {slot.start}–
                        {endTime(slot.start)}: Crosses the {slot.rotationAt}{" "}
                        instructor rotation. Your assigned instructor stays for
                        the full session.
                      </p>
                    ))}
                  <Arrival compact />
                  {preview && (
                    <p className="payment-foot">
                      Payment preview · No money was charged.
                    </p>
                  )}
                </section>
              </div>
            </details>
            {!pending && !preview && (
              <ConfirmationCopy key={booking.reference} booking={booking} />
            )}
          </div>
        )}
        {showReceipt && (
          <section
            className="confirmation-section review-block"
            aria-labelledby="confirmation-order"
          >
            <div className="review-head">
              <h2 id="confirmation-order">Order Summary</h2>
              {!preview &&
                (pending ? (
                  <div className="confirmation-paid-actions">
                    <span className="pill confirmation-pending-status confirmation-paid-status">
                      Pending
                    </span>
                    {pendingLabel !== "Pending" && (
                      <p className="text-sm text-muted">{pendingLabel}</p>
                    )}
                  </div>
                ) : (
                  <span className="pill success confirmation-paid-status">
                    Paid
                  </span>
                ))}
            </div>
            <SessionList
              slots={booking.slots}
              showRotation={false}
              showPrices
            />
            <div className="price-breakdown">
              <div className="line-item total confirmation-total">
                <span>
                  {pending ? "Total" : "Total Paid"}
                  {preview ? " · Preview" : ""}
                </span>
                <span className="confirmation-paid-amount">
                  <strong>
                    <span className="total-currency">SGD</span>{" "}
                    {money(booking.totalCents)}
                  </strong>
                </span>
              </div>
            </div>
          </section>
        )}
      </section>

      {error && (
        <p className="alert mt-4" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
