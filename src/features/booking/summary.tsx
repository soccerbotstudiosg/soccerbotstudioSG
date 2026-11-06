"use client";
import { BookingPrimaryAction } from "./booking-primary-action";
import {
  SESSION_UNAVAILABLE,
  AVAILABILITY_LOAD_FAILED,
} from "@/domain/booking-messages";
import { BookingLoading as BrandLoading } from "./booking-loading";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { LOCATION } from "@/domain/catalog";
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
            <strong>
              {serviceName} · {LOCATION.building}
            </strong>
            <br />
          </>
        )}
        {draft.players} {draft.players === 1 ? "player" : "players"}
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
  showPrices = false,
  now,
}: {
  slots: Session[];
  now?: number;
  showRotation?: boolean;
  trainerAction?: ReactNode;
  showPrices?: boolean;
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
                  {showPrices && (
                    <strong className="session-item-price">
                      {money(sessionPrice(slot))}
                    </strong>
                  )}
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
      <div className="line-item total">
        <span>Total due</span>
        <strong>
          <span className="total-currency">SGD</span> {money(totalCents(draft))}
        </strong>
      </div>
    </div>
  );
}
/** Render the booking summary and permitted editing actions. */
export function Summary({
  basket = false,
  includeAction = true,
  showTrainers = true,
}: {
  basket?: boolean;
  includeAction?: boolean;
  showTrainers?: boolean;
}) {
  const { draft, update, now } = useBooking();
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
                showPrices
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
            <strong>
              <span className="total-currency">SGD</span>{" "}
              {money(totalCents(draft))}
            </strong>
          </div>

          {basket && includeAction && <BasketContinue />}
        </div>
      </aside>
      {showTrainers && draft.slots.length > 0 && <SelectedTrainers />}
    </div>
  );
}

/** Retain calendar continuation and fresh-availability guards outside mobile popups. */
export function BasketContinue() {
  const { draft, now, availability } = useBooking();
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
  return (
    <>
      <BookingPrimaryAction>
        {draft.slots.length > 0 && valid ? (
          <Link className="button wide basket-continue" href="/book/details/">
            Continue <Icon name="chevron" />
          </Link>
        ) : (
          <button className="button wide basket-continue" disabled>
            Continue <Icon name="chevron" />
          </button>
        )}
      </BookingPrimaryAction>
      {draft.slots.length > 0 && !valid && (
        <p className="notice" role="status">
          {selectionErrors(draft.slots, now).length > 0 ||
          result?.status === "success" ? (
            SESSION_UNAVAILABLE
          ) : !result ? (
            <BrandLoading overlay={false} compact label="Checking sessions…" />
          ) : (
            AVAILABILITY_LOAD_FAILED
          )}
        </p>
      )}
    </>
  );
}

/** Present each selected instructor once, including provider profile names. */
export function SelectedTrainers() {
  const { draft } = useBooking();
  const instructors = [
    ...new Map(
      orderedSlots(draft.slots).map((slot) => [slot.instructor, slot]),
    ).values(),
  ];
  return (
    <>
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
      {!instructors.length && (
        <p>No trainers selected. Choose a session time and trainer first.</p>
      )}
    </>
  );
}
