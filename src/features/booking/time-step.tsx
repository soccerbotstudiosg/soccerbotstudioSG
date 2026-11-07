"use client";
import Link from "next/link";
import { ProtectedConfirmation } from "./protected-confirmation";
import {
  AVAILABILITY_LOAD_FAILED,
  NO_SESSIONS_ON_DATE,
} from "@/domain/booking-messages";
import { BookingLoading as BrandLoading } from "./booking-loading";
import { useEffect, useId, useMemo, useState } from "react";
import {
  BOOKING_MONTH_COUNT,
  MAX_BOOKING_SESSIONS,
} from "@/domain/booking-policy";
import { Icon } from "@/components/icon";
import { LOCATION } from "@/domain/catalog";
import { SERVICE_NAME } from "@/domain/demo-catalog";
import { LiveCatalogue } from "./live-catalogue";

import {
  isElapsed,
  slotKey,
  sessionOfferKey,
  sessionInstructorName,
  sessionPrice,
} from "@/domain/booking";
import {
  addDays,
  dateLabel,
  endTime,
  monthAt,
  money,
  todaySG,
} from "@/domain/dates";
import type { AvailableSlot } from "@/services/contracts";
import { useBooking } from "./provider";
/** Manage calendar, session-time and instructor selection. */
export function TimeStep() {
  const {
    selectionNotice,
    attempt,
    action,
    confirmationRevision,
    restartAfterExpiry,
    resumePaymentStatus,
  } = useBooking();
  const waitingForRelease = !!attempt && action.returnToCalendar === true;
  const {
    draft,
    update,
    now,
    availability,
    showDate,
    calendar,
    showMonth,
    bookingService,
  } = useBooking();
  const bookingLegendId = useId();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const today = todaySG(new Date(now));
  const live = bookingService.mode === "live";
  const publicCalendarReady =
    live &&
    bookingService.operations.availability === "live" &&
    !!bookingService.publicCalendar;
  const [date, setDate] = useState(
      () =>
        draft.slots[0]?.date ||
        (live
          ? calendar
              .entry(today.slice(0, 7), now)
              ?.dates.find((day) => day.available)?.date
          : undefined) ||
        today,
    ),
    [selectedMonth, setMonth] = useState(() =>
      monthAt(draft.slots[0]?.date || today, 0),
    );
  const [findingInitialDay, setFindingInitialDay] = useState(
    () => publicCalendarReady && draft.slots.length === 0,
  );
  const maxMonthOffset = publicCalendarReady ? BOOKING_MONTH_COUNT - 1 : 11;
  const offset = Math.max(
    0,
    Math.min(
      maxMonthOffset,
      (+selectedMonth.slice(0, 4) - +today.slice(0, 4)) * 12 +
        +selectedMonth.slice(5, 7) -
        +today.slice(5, 7),
    ),
  );
  const month = monthAt(today, offset),
    firstDay = (new Date(`${month}T12:00:00Z`).getUTCDay() + 6) % 7;
  const days = new Date(`${monthAt(today, offset + 1)}T12:00:00Z`);
  days.setUTCDate(0);
  const rangeStart = calendarView === "week" ? (weekStart ?? date) : month;
  const rangeEnd =
    calendarView === "week"
      ? addDays(rangeStart, 6)
      : addDays(month, days.getUTCDate() - 1);
  const lastDate = addDays(monthAt(today, maxMonthOffset + 1), -1);
  const throughMonth =
    calendarView === "week" &&
    !findingInitialDay &&
    rangeEnd <= lastDate &&
    rangeEnd.slice(0, 7) !== month.slice(0, 7)
      ? rangeEnd.slice(0, 7)
      : undefined;
  const monthResult = calendar.entry(month.slice(0, 7), now);
  const sibling =
    throughMonth && throughMonth !== month.slice(0, 7)
      ? calendar.entry(throughMonth, now)
      : null;
  const visibleDays = [
    ...(monthResult?.dates ?? []),
    ...(sibling?.dates ?? []),
  ];
  const dayAvailability = new Map(
    visibleDays.map((day) => [day.date, day.available]),
  );
  const availableDays = visibleDays
    .filter(
      (day) =>
        day.available &&
        day.date >= today &&
        (calendarView !== "week" ||
          !weekStart ||
          (day.date >= rangeStart && day.date <= rangeEnd)),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  // Initial discovery visits at most the three supported months, one at a time.
  // Once resolved or manually navigated, refresh never resumes this search.
  if (publicCalendarReady && monthResult) {
    if (
      dayAvailability.get(date) !== true ||
      (calendarView === "week" &&
        weekStart &&
        (date < rangeStart || date > rangeEnd))
    ) {
      const next =
        availableDays.find((day) => day.date >= date) ?? availableDays[0];
      if (next && next.date !== date) setDate(next.date);
    }
    if (findingInitialDay) {
      if (availableDays.length || offset === maxMonthOffset)
        setFindingInitialDay(false);
      else {
        const nextMonth = monthAt(today, offset + 1);
        setMonth(nextMonth);
        setDate(nextMonth);
      }
    }
  }
  const dateInView =
    calendarView === "month" || (date >= rangeStart && date <= rangeEnd);
  const displayDate =
    !dateInView || (publicCalendarReady && dayAvailability.get(date) !== true)
      ? null
      : date;
  useEffect(() => {
    showMonth(month.slice(0, 7), throughMonth);
    showDate(displayDate);
    return () => showDate(null);
  }, [displayDate, showDate, month, throughMonth, showMonth]);
  const nextAvailable = monthResult?.dates.find(
    (day) => day.date > date && day.available,
  )?.date;
  const { retry } = availability;
  const calendarFailed =
    publicCalendarReady && calendar.failed.includes(month.slice(0, 7));
  const siblingFailed =
    !!throughMonth && calendar.failed.includes(throughMonth);
  const calendarRefreshing =
    calendar.refreshing(month.slice(0, 7)) ||
    (!!throughMonth && calendar.refreshing(throughMonth));
  const calendarBusy =
    publicCalendarReady &&
    !calendarFailed &&
    (!monthResult ||
      (findingInitialDay && !availableDays.length && offset < maxMonthOffset));
  /** Stop initial discovery when the visitor chooses a calendar month. */
  function chooseMonth(next: string) {
    setFindingInitialDay(false);
    setWeekStart(null);
    setDate(next < today ? today : next);
    setMonth(next);
  }
  /** Move the rolling window without changing or dropping cart selections. */
  function moveWeek(direction: -1 | 1) {
    const next = addDays(rangeStart, direction * 7);
    const bounded = next < today ? today : next;
    setFindingInitialDay(false);
    setWeekStart(bounded);
    setMonth(monthAt(bounded, 0));
    setDate(bounded);
  }
  const displayUnavailable =
    publicCalendarReady && !!monthResult && dayAvailability.get(date) !== true;
  const result = useMemo(
    () =>
      availability.result?.dates.includes(date)
        ? availability.result
        : displayUnavailable
          ? { status: "success" as const, slots: [], dates: [date] }
          : null,
    [availability.result, date, displayUnavailable],
  );
  const { reconcile } = calendar;
  useEffect(() => {
    if (!live || !result) return;
    reconcile(
      date,
      result.status === "success"
        ? result.slots.some(
            (slot) =>
              slot.date === date && slot.available && !isElapsed(slot, now),
          )
        : undefined,
    );
  }, [live, result, date, now, reconcile]);
  const slots =
    result?.status === "success"
      ? result.slots.filter((slot) => slot.date === date)
      : [];
  const groups = [
    ...new Map(slots.map((slot) => [slotKey(slot), slot])).keys(),
  ].map((key) => slots.filter((slot) => slotKey(slot) === key));
  /** Commit only an explicitly chosen, currently offered trainer for this time. */
  function select(offered: AvailableSlot) {
    if (
      (draft.slots.length >= MAX_BOOKING_SESSIONS &&
        !draft.slots.some((slot) => slotKey(slot) === slotKey(offered))) ||
      isElapsed(offered) ||
      !slots.some(
        (candidate) =>
          sessionOfferKey(candidate) === sessionOfferKey(offered) &&
          candidate.available,
      )
    )
      return;
    const { date, start, instructor, rotationAt, native } = offered;
    const slot = {
      date,
      start,
      instructor,
      rotationAt,
      ...(native ? { native } : {}),
    };
    update({
      slots: [
        ...draft.slots.filter((item) => slotKey(item) !== slotKey(slot)),
        slot,
      ],
    });
    setChoosing(null);
  }
  return (
    <>
      <h1 className="page-title">
        Select dates<span className="booking-time-title-break"> and times</span>
      </h1>
      {live && bookingService.operations.availability === "live" ? (
        <LiveCatalogue
          renderStatus={(state) => (
            <p className="calendar-selection-context">
              <strong>
                {LOCATION.building} ·{" "}
                {state === "loading"
                  ? "Loading session details…"
                  : "Session details unavailable"}
              </strong>
            </p>
          )}
          render={(data) => (
            <p className="calendar-selection-context">
              <strong>
                {LOCATION.building} ·{" "}
                {data.services.find(
                  (service) => service.id === draft.nativeServiceId,
                )?.name ?? "Session details unavailable"}
              </strong>
            </p>
          )}
        />
      ) : (
        <p className="calendar-selection-context">
          <strong>
            {LOCATION.building} ·{" "}
            {live ? "Session details unavailable" : SERVICE_NAME}
          </strong>
        </p>
      )}
      {waitingForRelease && attempt && (
        <ProtectedConfirmation
          attemptId={attempt.id}
          checkoutMode="live"
          calendarRecovery
          sessionRevision={confirmationRevision}
          onExpired={restartAfterExpiry}
          onPaymentDetected={resumePaymentStatus}
        />
      )}
      {selectionNotice && !waitingForRelease && (
        <div className="alert" role="alert">
          <p>{selectionNotice}</p>
          {action.resumeAttemptId && (
            <Link
              className="text-link"
              href={`/confirmation/?attempt=${encodeURIComponent(action.resumeAttemptId)}`}
            >
              View existing checkout
            </Link>
          )}
        </div>
      )}
      <p className="lead">40-minute sessions · 10-minute changeover.</p>
      {draft.slots.length >= MAX_BOOKING_SESSIONS && (
        <p role="status" className="notice">
          Maximum {MAX_BOOKING_SESSIONS} sessions per booking. Remove a session
          to choose another.
        </p>
      )}
      <section
        className="calendar-panel"
        aria-label="Booking calendar"
        aria-busy={
          calendarBusy ||
          calendarRefreshing ||
          (!!throughMonth && !sibling && !siblingFailed)
        }
      >
        {calendarRefreshing && (
          <div className="calendar-refresh">
            <BrandLoading overlay={false} compact label="Updating dates…" />
          </div>
        )}
        <div className="calendar-head">
          <div className="month-picker">
            <label className="sr-only" htmlFor="calendar-month">
              Calendar month
            </label>
            <select
              id="calendar-month"
              value={offset}
              onChange={(e) => chooseMonth(monthAt(today, +e.target.value))}
            >
              {Array.from({ length: maxMonthOffset + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {dateLabel(monthAt(today, i), {
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>
          <div className="calendar-nav">
            <button
              className="icon-button"
              aria-label={
                calendarView === "week" ? "Previous week" : "Previous month"
              }
              disabled={
                calendarView === "week" ? rangeStart <= today : offset === 0
              }
              onClick={() =>
                calendarView === "week"
                  ? moveWeek(-1)
                  : chooseMonth(monthAt(today, offset - 1))
              }
            >
              <Icon name="chevron" className="rotate-180" />
            </button>
            <button
              className="icon-button"
              aria-label={calendarView === "week" ? "Next week" : "Next month"}
              disabled={
                calendarView === "week"
                  ? rangeEnd >= lastDate
                  : offset === maxMonthOffset
              }
              onClick={() =>
                calendarView === "week"
                  ? moveWeek(1)
                  : chooseMonth(monthAt(today, offset + 1))
              }
            >
              <Icon name="chevron" />
            </button>
            <label className="sr-only" htmlFor="calendar-view">
              Calendar view
            </label>
            <select
              id="calendar-view"
              value={calendarView}
              onChange={(event) => {
                setCalendarView(event.target.value as "week" | "month");
                setWeekStart(null);
                if (date.slice(0, 7) !== month.slice(0, 7))
                  setMonth(monthAt(date, 0));
              }}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
        {calendarBusy && !calendar.hasLoaded(month.slice(0, 7)) ? (
          <div className="calendar-loading">
            <BrandLoading overlay={false} compact label="Checking dates…" />
            <p>Finding available sessions…</p>
          </div>
        ) : (
          <>
            <div className="calendar-weekdays">
              {(calendarView === "week"
                ? Array.from({ length: 7 }, (_, i) =>
                    dateLabel(addDays(rangeStart, i), { weekday: "short" }),
                  )
                : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
              ).map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="dates">
              {Array.from(
                { length: calendarView === "month" ? firstDay : 0 },
                (_, i) => (
                  <span className="date-placeholder" key={`blank-${i}`} />
                ),
              )}
              {Array.from(
                { length: calendarView === "week" ? 7 : days.getUTCDate() },
                (_, i) => {
                  const value = addDays(
                    calendarView === "week" ? rangeStart : month,
                    i,
                  );
                  const inBooking = draft.slots.some(
                    (slot) => slot.date === value,
                  );
                  if (value > lastDate)
                    return <span className="date-placeholder" key={value} />;
                  return (
                    <button
                      key={value}
                      className={`date${value === date ? " selected" : ""}${inBooking ? " in-booking" : ""}`}
                      aria-label={dateLabel(value)}
                      aria-describedby={inBooking ? bookingLegendId : undefined}
                      aria-pressed={date === value}
                      disabled={
                        value < today ||
                        (live && dayAvailability.get(value) !== true)
                      }
                      title={
                        live
                          ? dayAvailability.get(value) === true
                            ? "Available sessions"
                            : dayAvailability.get(value) === false
                              ? NO_SESSIONS_ON_DATE
                              : "Availability not verified"
                          : undefined
                      }
                      onClick={() => {
                        if (calendarView === "week") setWeekStart(rangeStart);
                        setDate(value);
                      }}
                    >
                      <strong>{Number(value.slice(-2))}</strong>
                    </button>
                  );
                },
              )}
            </div>
          </>
        )}
        {siblingFailed && (
          <div className="alert" role="alert">
            Unable to load some dates.{" "}
            <button
              className="text-link"
              onClick={() => calendar.retry([throughMonth!])}
            >
              Try again
            </button>
          </div>
        )}
        {live && !calendarBusy && !monthResult && !calendarFailed && (
          <div role="status" className="notice">
            <BrandLoading overlay={false} compact label="Checking dates…" />
          </div>
        )}
        <span className="sr-only" id={bookingLegendId}>
          In your booking
        </span>
      </section>
      {!calendarBusy && (
        <>
          <div className="time-heading">
            <h2>{dateLabel(date)}</h2>
          </div>
          {!result ? (
            calendarFailed ? (
              <div className="alert" role="alert">
                <p>{AVAILABILITY_LOAD_FAILED}</p>
                <button className="text-link" onClick={() => calendar.retry()}>
                  Try again
                </button>
              </div>
            ) : (
              <BrandLoading overlay={false} compact label="Checking times…" />
            )
          ) : result.status !== "success" ? (
            <div className="alert" role="alert">
              <p>{result.message}</p>
              {result.status !== "unavailable" && (
                <button className="text-link" onClick={retry}>
                  Try again
                </button>
              )}
            </div>
          ) : slots.length ? (
            <div className="times" role="group" aria-label="Session times">
              <p className="mobile-time-hint">
                <span className="time-info" aria-hidden="true">
                  i
                </span>
                <span>Select to view trainers available</span>
              </p>
              {groups.map((offers) => {
                const first =
                  offers.find((offer) => offer.available) ?? offers[0];
                const selected = draft.slots.find(
                  (item) => slotKey(item) === slotKey(first),
                );
                const slot = selected
                  ? {
                      ...selected,
                      available: offers.some(
                        (offer) =>
                          sessionOfferKey(offer) ===
                            sessionOfferKey(selected) && offer.available,
                      ),
                    }
                  : first;
                const available = offers.some((offer) => offer.available);
                const key = slotKey(slot);
                const elapsed = isElapsed(slot, now);
                return (
                  <div className="time-choice" key={key}>
                    <button
                      className={`time${selected ? " selected" : ""}`}
                      aria-pressed={!!selected}
                      aria-expanded={!!selected || choosing === key}
                      disabled={
                        waitingForRelease ||
                        ((!available ||
                          elapsed ||
                          draft.slots.length >= MAX_BOOKING_SESSIONS) &&
                          !selected)
                      }
                      onClick={() => {
                        if (selected) {
                          update({
                            slots: draft.slots.filter(
                              (item) => slotKey(item) !== key,
                            ),
                          });
                          setChoosing(null);
                        } else if (!isElapsed(slot) && available) {
                          setChoosing(choosing === key ? null : key);
                        }
                      }}
                    >
                      <span className="time-details">
                        <span className="time-range">
                          {slot.start}–{endTime(slot.start)}
                        </span>
                        <span className="time-rate">
                          {elapsed ? (
                            "Session has started"
                          ) : slot.available ? (
                            <>
                              <strong>{money(sessionPrice(slot))}</strong>
                            </>
                          ) : (
                            "Unavailable"
                          )}
                        </span>
                        <span className="time-instructor">
                          {selected
                            ? sessionInstructorName(selected)
                            : available
                              ? `${offers
                                  .filter((offer) => offer.available)
                                  .map(sessionInstructorName)
                                  .join(" / ")}`
                              : "No instructor available"}
                        </span>
                        {slot.available && slot.rotationAt && (
                          <span className="rotation-notice">
                            Crosses the {slot.rotationAt} instructor rotation.
                            Your chosen instructor stays for the full session.
                          </span>
                        )}
                      </span>
                      <Icon name={selected ? "check" : "plus"} />
                    </button>
                    {(selected || choosing === key) && (
                      <label className="trainer-choice">
                        <span>Trainer</span>
                        <select
                          aria-label={`Trainer for ${slot.date} at ${slot.start}`}
                          value={selected ? sessionOfferKey(selected) : ""}
                          disabled={waitingForRelease || elapsed || !available}
                          onChange={(event) => {
                            const offer = offers.find(
                              (item) =>
                                sessionOfferKey(item) === event.target.value,
                            );
                            if (offer) select(offer);
                          }}
                        >
                          <option value="" disabled>
                            Choose a trainer to add this session
                          </option>
                          {selected &&
                            !offers.some(
                              (offer) =>
                                sessionOfferKey(offer) ===
                                sessionOfferKey(selected),
                            ) && (
                              <option
                                value={sessionOfferKey(selected)}
                                disabled
                              >
                                {sessionInstructorName(selected)} — unavailable
                              </option>
                            )}
                          {offers.map((offer) => (
                            <option
                              key={sessionOfferKey(offer)}
                              value={sessionOfferKey(offer)}
                              disabled={!offer.available}
                            >
                              {sessionInstructorName(offer)}
                              {!offer.available ? " — unavailable" : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Icon name="calendar" />
              <h3>{NO_SESSIONS_ON_DATE}</h3>
              <p>Choose another date. Your selections are saved.</p>
              <button
                className="button secondary"
                disabled={live && !nextAvailable && offset === maxMonthOffset}
                onClick={() => {
                  const next = live
                    ? (nextAvailable ??
                      (offset < maxMonthOffset
                        ? monthAt(today, offset + 1)
                        : undefined))
                    : addDays(date, 1);
                  if (!next) return;
                  setWeekStart(null);
                  setDate(next);
                  setMonth(monthAt(next, 0));
                }}
              >
                {live
                  ? nextAvailable
                    ? "See next available day"
                    : "See next month"
                  : "See next day"}{" "}
                <Icon name="chevron" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
