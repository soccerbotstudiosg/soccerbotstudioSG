"use client";
import { BookingLoading as BrandLoading } from "./booking-loading";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { SERVICE_NAME } from "@/domain/demo-catalog";
import {
  orderedSlots,
  sessionInstructorName,
  sessionPrice,
  instructorSchema,
  isElapsed,
  selectionErrors,
  slotKey,
  sessionOfferKey,
  totalCents,
  type BookingDraft,
  type Session,
} from "@/domain/booking";
import { dateLabel, endTime, money } from "@/domain/dates";
import { bookingCover } from "@/content/media";
import { InstructorProfile } from "./instructor";
import { useBooking } from "./provider";
/** Present the same session heading and service description across booking summaries. */
export function SessionSummaryHeading({
  draft,
  action,
}: {
  draft: Pick<BookingDraft, "slots" | "players" | "nativeServiceId">;
  action?: ReactNode;
}) {
  const serviceName =
    draft.slots[0]?.native?.serviceName ??
    (draft.nativeServiceId ? undefined : SERVICE_NAME);
  return (
    <div className="session-summary-heading">
      <div className="review-head">
        <h2>Your sessions</h2>
        {action}
      </div>
      <p>
        {serviceName && (
          <>
            <strong>{serviceName}</strong>
            <br />
          </>
        )}
        {draft.players} {draft.players === 1 ? "player" : "players"} per session
        · Full instructor guidance
      </p>
    </div>
  );
}

/** Render selected sessions with their dates, times and instructors. */
export function SessionList({
  slots,
  remove,
  showRotation = true,
  trainerAction,
  now,
}: {
  slots: Session[];
  now?: number;
  showRotation?: boolean;
  trainerAction?: ReactNode;
  remove?: (slot: Session) => void;
}) {
  const list = (
    <ol
      className={remove ? "basket-list" : "series-list"}
      aria-label="Selected sessions"
      tabIndex={0}
    >
      {orderedSlots(slots).map((slot, index) => {
        return (
          <li key={slotKey(slot)}>
            {!remove && <span className="series-index">{index + 1}</span>}
            <div className={remove ? undefined : "series-date"}>
              <strong>{dateLabel(slot.date)}</strong>
              <span>
                {slot.start}–{endTime(slot.start)} SGT
              </span>
              {!remove && (
                <div className="session-trainer-row">
                  <span className="session-instructor">
                    Trainer: {sessionInstructorName(slot)}
                  </span>
                  {slots.length === 1 && trainerAction}
                </div>
              )}
              {showRotation && slot.rotationAt && (
                <span className="rotation-notice">
                  Crosses the {slot.rotationAt} instructor rotation. Your
                  assigned instructor stays for the full session.
                </span>
              )}
              {now !== undefined && isElapsed(slot, now) && (
                <span className="field-error">
                  Session has started — remove to continue.
                </span>
              )}
            </div>
            {remove && (
              <button
                className="basket-remove"
                aria-label={`Remove ${slot.date} at ${slot.start}`}
                onClick={() => remove(slot)}
              >
                <Icon name="close" />
              </button>
            )}
            {remove && (
              <div className="basket-price-row">
                <span className="session-instructor">
                  Trainer: {sessionInstructorName(slot)}
                </span>
                <small>{money(sessionPrice(slot))}</small>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
  return list;
}

/** Present the total derived from the selected sessions. */
export function PriceSummary({ draft }: { draft: BookingDraft }) {
  return (
    <div className="price-breakdown">
      <div className="line-item">
        <span>{draft.slots.length} × 40 min session</span>
        <strong>{money(totalCents(draft))}</strong>
      </div>
      <div className="line-item total">
        <span>Total due</span>
        <strong>{money(totalCents(draft))}</strong>
      </div>
      <p className="hint summary-currency">
        {draft.nativeServiceId ? "SGD · Final total" : "SGD · Inclusive of GST"}
      </p>
    </div>
  );
}
/** Render the booking summary and permitted editing actions. */
export function Summary({ basket = false }: { basket?: boolean }) {
  const { draft, update, now, availability } = useBooking();
  const result = availability.result;
  const valid =
    selectionErrors(draft.slots, now).length === 0 &&
    result?.status === "success" &&
    draft.slots.every((slot) =>
      result.slots.some(
        (available) =>
          sessionOfferKey(available) === sessionOfferKey(slot) &&
          available.available &&
          available.instructor === slot.instructor &&
          available.rotationAt === slot.rotationAt,
      ),
    );
  const instructors = [
    ...new Map(
      orderedSlots(draft.slots).map((slot) => [slot.instructor, slot]),
    ).values(),
  ];
  return (
    <div className="aside-wrap">
      <aside className="summary" aria-label="Your booking summary">
        <div
          className="summary-cover"
          style={{ backgroundImage: `url("${bookingCover}")` }}
        >
          <span className="eyebrow">
            {basket ? "Your booking basket" : "Booking summary"}
          </span>
        </div>
        <div className="summary-body">
          <SessionSummaryHeading draft={draft} />
          {draft.slots.length ? (
            <>
              {basket && (
                <div className="basket-heading">
                  <strong>
                    {draft.slots.length}{" "}
                    {draft.slots.length === 1 ? "session" : "sessions"}
                  </strong>
                  <button
                    className="text-link"
                    onClick={() => update({ slots: [] })}
                  >
                    Clear all
                  </button>
                </div>
              )}
              <SessionList
                slots={draft.slots}
                now={now}
                remove={
                  basket
                    ? (slot) =>
                        update({
                          slots: draft.slots.filter(
                            (item) => slotKey(item) !== slotKey(slot),
                          ),
                        })
                    : undefined
                }
              />
            </>
          ) : (
            <div className="basket-empty">
              <Icon name="calendar" />
              <strong>No sessions selected</strong>
              <p>Choose a date, then add the times that suit you.</p>
            </div>
          )}
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(totalCents(draft))}</strong>
          </div>
          <p className="hint summary-currency">
            {draft.nativeServiceId
              ? "SGD · Final total"
              : "SGD · Inclusive of GST"}
          </p>
          {basket &&
            (draft.slots.length > 0 && valid ? (
              <Link
                className="button wide basket-continue"
                href="/book/details/"
              >
                Continue <Icon name="arrow" />
              </Link>
            ) : (
              <button className="button wide basket-continue" disabled>
                Continue <Icon name="arrow" />
              </button>
            ))}
          {basket && draft.slots.length > 0 && !valid && (
            <p className="notice" role="status">
              {selectionErrors(draft.slots, now).length > 0 ||
              result?.status === "success" ? (
                "A selected session is no longer available. Remove it and choose another time."
              ) : !result ? (
                <BrandLoading
                  overlay={false}
                  compact
                  label="Checking sessions…"
                />
              ) : (
                "Please refresh availability. Your selections are saved."
              )}
            </p>
          )}
        </div>
      </aside>
      {instructors.length > 0 && (
        <section
          className="booking-instructors"
          aria-labelledby="instructors-heading"
        >
          <h2 className="sr-only" id="instructors-heading">
            Your instructors
          </h2>
          {instructors.map((slot) => (
            <InstructorProfile
              key={slot.instructor}
              sessions={draft.slots.filter(
                (session) => session.instructor === slot.instructor,
              )}
              {...(slot.native
                ? {
                    profile: {
                      name: sessionInstructorName(slot),
                      initials: sessionInstructorName(slot)
                        .split(/\s+/)
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join(""),
                      role: "Instructor",
                      bio: "",
                    },
                  }
                : { id: instructorSchema.parse(slot.instructor) })}
            />
          ))}
        </section>
      )}
    </div>
  );
}
