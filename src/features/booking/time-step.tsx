"use client";
import {
  AVAILABILITY_LOAD_FAILED,
  NO_SESSIONS_ON_DATE,
} from "@/domain/booking-messages";
import { BookingLoading as BrandLoading } from "./booking-loading";
import { useEffect, useMemo, useState } from "react";
import { BOOKING_MONTH_COUNT } from "@/domain/booking-policy";
import { Icon } from "@/components/icon";

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
  const { selectionNotice } = useBooking();
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
  const [choosing, setChoosing] = useState<string | null>(null);
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
  const monthResult = calendar.entry(month.slice(0, 7), now);
  const dayAvailability = new Map(
    monthResult?.dates.map((day) => [day.date, day.available]),
  );
  const availableDays =
    monthResult?.dates
      .filter((day) => day.available && day.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date)) ?? [];
  // Initial discovery visits at most the three supported months, one at a time.
  // Once resolved or manually navigated, refresh never resumes this search.
  if (publicCalendarReady && monthResult) {
    if (dayAvailability.get(date) !== true) {
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
  const displayDate =
    publicCalendarReady && dayAvailability.get(date) !== true ? null : date;
  useEffect(() => {
    showMonth(month.slice(0, 7));
    showDate(displayDate);
    return () => showDate(null);
  }, [displayDate, showDate, month, showMonth]);
  const nextAvailable = monthResult?.dates.find(
    (day) => day.date > date && day.available,
  )?.date;
  const { retry } = availability;
  const calendarFailed =
    publicCalendarReady && calendar.failed.includes(month.slice(0, 7));
  const calendarBusy =
    publicCalendarReady &&
    !calendarFailed &&
    (!monthResult ||
      (findingInitialDay && !availableDays.length && offset < maxMonthOffset));
  /** Stop initial discovery when the visitor chooses a calendar month. */
  function chooseMonth(next: string) {
    setFindingInitialDay(false);
    setMonth(next);
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
      {selectionNotice && (
        <p className="alert" role="alert">
          {selectionNotice}
        </p>
      )}
      <p className="lead">40-minute sessions · 10-minute changeover.</p>
      <section
        className="calendar-panel"
        aria-label="Booking calendar"
        aria-busy={calendarBusy}
      >
        <div className={`calendar-head${live ? " with-refresh" : ""}`}>
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
                    month: "short",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>
          {live && (
            <button
              className="calendar-refresh"
              aria-label="Refresh availability"
              disabled={calendarBusy}
              onClick={() => calendar.retry()}
            >
              Refresh
            </button>
          )}
          <div className="calendar-nav">
            <button
              className="icon-button"
              aria-label="Previous month"
              disabled={offset === 0}
              onClick={() => chooseMonth(monthAt(today, offset - 1))}
            >
              <Icon name="chevron" className="rotate-180" />
            </button>
            <button
              className="icon-button"
              aria-label="Next month"
              disabled={offset === maxMonthOffset}
              onClick={() => chooseMonth(monthAt(today, offset + 1))}
            >
              <Icon name="chevron" />
            </button>
          </div>
        </div>
        {calendarBusy ? (
          <div className="calendar-loading">
            <BrandLoading overlay={false} compact label="Checking dates…" />
            <p>Finding available sessions…</p>
          </div>
        ) : (
          <>
            <div className="calendar-weekdays">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="dates">
              {Array.from({ length: firstDay }, (_, i) => (
                <span className="date-placeholder" key={`blank-${i}`} />
              ))}
              {Array.from({ length: days.getUTCDate() }, (_, i) => {
                const value = addDays(month, i);
                return (
                  <button
                    key={value}
                    className={`date${value === date ? " selected" : ""}`}
                    aria-label={dateLabel(value)}
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
                      setDate(value);
                    }}
                  >
                    <strong>{i + 1}</strong>
                    <span className="dot" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </>
        )}
        {live && !calendarBusy && !monthResult && !calendarFailed && (
          <div role="status" className="notice">
            <BrandLoading overlay={false} compact label="Checking dates…" />
          </div>
        )}
        {!calendarBusy && (
          <div className="calendar-legend">
            <span>
              <i className="legend-mark" />
              Available
            </span>
            <span>
              <i className="legend-mark unavailable" />
              Unavailable
            </span>
          </div>
        )}
      </section>
      {!calendarBusy && (
        <>
          <div className="time-heading">
            <h2>{dateLabel(date)}</h2>
          </div>
          {!result ? (
            calendarFailed ? (
              <p>{AVAILABILITY_LOAD_FAILED}</p>
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
                      disabled={(!available || elapsed) && !selected}
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
                          disabled={elapsed || !available}
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
                              {sessionInstructorName(offer)} ·{" "}
                              {money(sessionPrice(offer))}
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
      <p className="note">
        <Icon name="clock" />
        <span>
          {live
            ? "Open noon–8pm. Book at least 4 hours ahead. Choose a trainer for each session."
            : "Open noon–8pm. Choose a trainer separately for every session. Demo trainer choices rotate every three hours; your chosen trainer stays for the full session."}
        </span>
      </p>
    </>
  );
}
