"use client";
import { BookingHeading } from "./booking-heading";
import Link from "next/link";
import {
  AVAILABILITY_LOAD_FAILED,
  NO_SESSIONS_ON_DATE,
} from "@/domain/booking-messages";
import { BookingLoading as BrandLoading } from "./booking-loading";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import {
  MAX_BOOKING_SESSIONS,
  START_INTERVAL_MINUTES,
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
import { useMobileBooking } from "./booking-tools";

/** Measure the booking surfaces that remain above scrolled content. */
function stickyBookingHeight() {
  const header = document.querySelector(".site-header");
  const navigation = document.querySelector(".booking-navigation");
  return (
    (header?.getBoundingClientRect().height ?? 0) +
    (navigation && getComputedStyle(navigation).position === "sticky"
      ? navigation.getBoundingClientRect().height
      : 0)
  );
}
/** Reveal a booking section below both sticky navigation surfaces. */
function revealBookingSection(heading: HTMLElement | null, cueSpace = 0) {
  if (!heading) return;
  window.scrollTo({
    // Give integer-scroll engines the nearest target rather than letting them truncate.
    top: Math.round(
      Math.max(
        0,
        window.scrollY +
          heading.getBoundingClientRect().top -
          stickyBookingHeight() -
          cueSpace -
          24,
      ),
    ),
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
/** Manage calendar, session-time and instructor selection. */
export function TimeStep({
  recoveryNotice,
}: { recoveryNotice?: ReactNode } = {}) {
  const mobile = useMobileBooking();
  const headingRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLElement>(null);
  const [calendarAbove, setCalendarAbove] = useState(false);
  const [cueTop, setCueTop] = useState(0);
  const pendingScroll = useRef<string | null>(null);
  useEffect(() => {
    const updateCue = () => {
      const bottom = calendarRef.current?.getBoundingClientRect().bottom;
      const stickyHeight = stickyBookingHeight();
      setCueTop(stickyHeight + 8);
      setCalendarAbove(bottom !== undefined && bottom <= stickyHeight + 60);
    };
    updateCue();
    window.addEventListener("scroll", updateCue, { passive: true });
    window.addEventListener("resize", updateCue);
    return () => {
      window.removeEventListener("scroll", updateCue);
      window.removeEventListener("resize", updateCue);
    };
  }, [mobile]);
  const { selectionNotice, selectionNoticeSlots, suppressedSlots, action } =
    useBooking();
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
  const [calendarView, setCalendarView] = useState<"week" | "month">("month");
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
  const maxMonthOffset = publicCalendarReady
    ? calendar.lastMonthOffset(now)
    : 11;
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
  const lastDate = addDays(monthAt(today, maxMonthOffset + 1), -1);
  const desiredStart = weekStart ?? date;
  const rangeStart =
    calendarView === "week"
      ? desiredStart > lastDate
        ? month
        : desiredStart
      : month;
  const rangeEnd =
    calendarView === "week"
      ? addDays(rangeStart, 6)
      : addDays(month, days.getUTCDate() - 1);
  const throughMonth =
    calendarView === "week" &&
    !findingInitialDay &&
    rangeEnd <= lastDate &&
    rangeEnd.slice(0, 7) !== month.slice(0, 7)
      ? rangeEnd.slice(0, 7)
      : undefined;
  const verifiedMonthResult = calendar.entry(month.slice(0, 7), now);
  const monthResult =
    verifiedMonthResult ?? calendar.displayEntry(month.slice(0, 7));
  const sibling =
    throughMonth && throughMonth !== month.slice(0, 7)
      ? (calendar.entry(throughMonth, now) ??
        calendar.displayEntry(throughMonth))
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
  const verifiedDateMonth = calendar.entry(date.slice(0, 7), now);
  const displayDate =
    !dateInView ||
    (publicCalendarReady &&
      (!monthResult ||
        (verifiedDateMonth && dayAvailability.get(date) === false)))
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
  const calendarFailed =
    publicCalendarReady && calendar.failed.includes(month.slice(0, 7));
  const siblingFailed =
    !!throughMonth && calendar.failed.includes(throughMonth);
  /** Retry the failed calendar and day reads together without dropping their retained display. */
  function retryAvailability() {
    const failedMonths = [month.slice(0, 7), throughMonth].filter(
      (value): value is string => !!value && calendar.failed.includes(value),
    );
    if (failedMonths.length) calendar.retry(failedMonths);
    if (availability.result && availability.result.status !== "success")
      availability.retry();
  }
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
    publicCalendarReady &&
    !!verifiedDateMonth &&
    dayAvailability.get(date) === false;
  const result = useMemo(
    () =>
      availability.result?.dates.includes(date)
        ? availability.result
        : displayUnavailable
          ? { status: "success" as const, slots: [], dates: [date] }
          : null,
    [availability.result, date, displayUnavailable],
  );
  const displayResult =
    result?.status === "success"
      ? result
      : (!result ||
            result.status === "failure" ||
            result.status === "unavailable") &&
          availability.displayResult?.dates.includes(date)
        ? availability.displayResult
        : null;
  const timesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pendingScroll.current !== date) {
      pendingScroll.current = null;
      return;
    }
    if (!result || calendarBusy) return;
    pendingScroll.current = null;
    revealBookingSection(headingRef.current, 60);
  }, [date, result, calendarBusy]);
  const [timesHeight, setTimesHeight] = useState(0);
  useLayoutEffect(() => {
    if (!result || !timesRef.current) return;
    const element = timesRef.current;
    const measure = () =>
      setTimesHeight(element.getBoundingClientRect().height);
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [result]);
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
    displayResult?.status === "success"
      ? displayResult.slots.filter(
          (slot) =>
            slot.date === date &&
            !suppressedSlots.some(
              (hidden) =>
                hidden.date === slot.date &&
                Math.abs(
                  Date.parse(`${slot.date}T${slot.start}:00+08:00`) -
                    Date.parse(`${hidden.date}T${hidden.start}:00+08:00`),
                ) <
                  START_INTERVAL_MINUTES * 60000,
            ),
        )
      : [];
  const groups = [
    ...new Map(slots.map((slot) => [slotKey(slot), slot])).keys(),
  ].map((key) => slots.filter((slot) => slotKey(slot) === key));
  /** Commit only an explicitly chosen, currently offered trainer for this time. */
  function select(offered: AvailableSlot) {
    if (
      result?.status !== "success" ||
      (draft.slots.length >= MAX_BOOKING_SESSIONS &&
        !draft.slots.some((slot) => slotKey(slot) === slotKey(offered))) ||
      isElapsed(offered) ||
      !result.slots.some(
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
      <BookingHeading>
        Select dates<span className="booking-time-title-break"> and times</span>
      </BookingHeading>
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
      {recoveryNotice}
      {selectionNotice && (
        <div className="alert" role="alert">
          <p>{selectionNotice}</p>
          {selectionNoticeSlots.length > 0 && (
            <ul>
              {selectionNoticeSlots.map((slot) => (
                <li key={`${slot.date}|${slot.start}`}>
                  {dateLabel(slot.date)}, {slot.start}–{endTime(slot.start)}.
                </li>
              ))}
            </ul>
          )}
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
      <section
        ref={calendarRef}
        className="calendar-panel"
        aria-label="Booking calendar"
        aria-busy={
          calendarBusy ||
          calendarRefreshing ||
          (!!throughMonth && !sibling && !siblingFailed)
        }
      >
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
                          ? !calendar.entry(value.slice(0, 7), now)
                            ? "Availability not verified"
                            : dayAvailability.get(value) === true
                              ? "Available sessions"
                              : dayAvailability.get(value) === false
                                ? NO_SESSIONS_ON_DATE
                                : "Availability not verified"
                          : undefined
                      }
                      onClick={() => {
                        if (calendarView === "week") setWeekStart(rangeStart);
                        pendingScroll.current = value;
                        if (value === date && result && !calendarBusy) {
                          pendingScroll.current = null;
                          revealBookingSection(headingRef.current, 60);
                        }
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
        {calendarFailed && (
          <div className="alert availability-alert" role="alert">
            <span>{AVAILABILITY_LOAD_FAILED}</span>{" "}
            <button
              className="text-link"
              aria-label="Try again"
              onClick={retryAvailability}
            >
              Try again.
            </button>
          </div>
        )}
        {siblingFailed && (
          <div className="alert availability-alert" role="alert">
            <span>{AVAILABILITY_LOAD_FAILED}</span>{" "}
            <button
              className="text-link"
              aria-label="Try again"
              onClick={retryAvailability}
            >
              Try again.
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
          <div className="time-heading" ref={headingRef}>
            <h2>{dateLabel(date)}</h2>
            {calendarAbove && (
              <button
                type="button"
                className="calendar-return-cue"
                style={{ top: cueTop }}
                aria-label="Back to calendar"
                onClick={() => {
                  setCalendarAbove(false);
                  revealBookingSection(calendarRef.current);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m6 12 6-6 6 6M6 18l6-6 6 6" />
                </svg>
              </button>
            )}
          </div>
          <div
            ref={timesRef}
            className="session-times-region"
            style={!result ? { minHeight: timesHeight } : undefined}
            aria-busy={!result}
          >
            {result && result.status !== "success" && (
              <div className="alert availability-alert" role="alert">
                <span>{result.message}</span>{" "}
                {result.status !== "unavailable" && (
                  <button
                    className="text-link"
                    aria-label="Try again"
                    onClick={retryAvailability}
                  >
                    Try again.
                  </button>
                )}
              </div>
            )}
            {!displayResult ? (
              result || calendarFailed ? null : calendar.hasLoaded(
                  month.slice(0, 7),
                ) && !verifiedMonthResult ? (
                <p role="status">Updating session availability…</p>
              ) : (
                <BrandLoading overlay={false} compact label="Checking times…" />
              )
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
                        aria-expanded={!selected && choosing === key}
                        disabled={
                          (!available ||
                            elapsed ||
                            draft.slots.length >= MAX_BOOKING_SESSIONS) &&
                          !selected
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
                              ? `Trainer: ${sessionInstructorName(selected)}`
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
                      {!selected && choosing === key && (
                        <label className="trainer-choice">
                          <span>Trainer</span>
                          <select
                            aria-label={`Trainer for ${slot.date} at ${slot.start}`}
                            value=""
                            disabled={
                              elapsed ||
                              !available ||
                              result?.status !== "success"
                            }
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
                <button
                  className="button secondary calendar-empty-action"
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
          </div>
        </>
      )}
    </>
  );
}
