"use client";
import { BookingHelp, RejectedEmailHelp } from "./booking-help";
import {
  CHECKOUT_UNRESOLVED,
  CALENDAR_CHECKOUT_PAUSED,
} from "@/domain/booking-messages";
import { useMobileBooking } from "./booking-tools";
import { BookingHeading } from "./booking-heading";
import Link from "next/link";
import {
  AVAILABILITY_LOAD_FAILED,
  NO_SESSIONS_ON_DATE,
} from "@/domain/booking-messages";
import { BookingLoading as BrandLoading } from "./booking-loading";
import {
  Fragment,
  type ReactNode,
  type CSSProperties,
  useEffect,
  useId,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import {
  SESSION_MINUTES,
  BOOKING_LEAD_MS,
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

/** Hide native offers at the strict lead-time boundary, including retained display data. */
function pastSelectionCutoff(slot: AvailableSlot, now = Date.now()) {
  return (
    isElapsed(slot, now) ||
    (!!slot.native &&
      Date.parse(`${slot.date}T${slot.start}:00+08:00`) - now < BOOKING_LEAD_MS)
  );
}

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
function revealBookingSection(heading: HTMLElement | null) {
  if (!heading) return;
  window.scrollTo({
    // Give integer-scroll engines the nearest target rather than letting them truncate.
    top: Math.round(
      Math.max(
        0,
        window.scrollY +
          heading.getBoundingClientRect().top -
          stickyBookingHeight() -
          72,
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
  const pendingScroll = useRef<string | null>(null);
  const {
    selectionNotice,
    selectionNoticeSlots,
    emailRejection,
    browsingCheckout,
    suppressedSlots,
    action,
    attempt,
  } = useBooking();
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
  const trainerPointer = useRef(false);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<"week" | "month">("month");
  const hasSelections = draft.slots.length > 0;
  const [hadSelections, setHadSelections] = useState(hasSelections);
  if (hadSelections !== hasSelections) {
    setHadSelections(hasSelections);
    if (!hasSelections) setChoosing(null);
  }
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
  // Initial discovery stays within the supported calendar coverage.
  // Once resolved or manually navigated, refresh never resumes this search.
  if (publicCalendarReady && calendar.initialReady && monthResult) {
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
  // Align the shared day read before paint; cached day changes must not flash a loader.
  useLayoutEffect(() => {
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
    revealBookingSection(headingRef.current);
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
              slot.date === date &&
              slot.available &&
              !pastSelectionCutoff(slot, now),
          )
        : undefined,
    );
  }, [live, result, date, now, reconcile]);
  // Older tabs may already have cleared display suppression before checkout settled.
  const hiddenSlots =
    action.calendarRecovery && attempt
      ? [...suppressedSlots, ...attempt.draft.slots]
      : suppressedSlots;
  const slots =
    displayResult?.status === "success"
      ? displayResult.slots.filter(
          (slot) =>
            slot.date === date &&
            (!slot.native || !pastSelectionCutoff(slot, now)) &&
            !hiddenSlots.some(
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
  const groups = [...new Map(slots.map((slot) => [slotKey(slot), slot])).keys()]
    .map((key) => slots.filter((slot) => slotKey(slot) === key))
    .sort((left, right) => left[0].start.localeCompare(right[0].start));
  /** Commit only an explicitly chosen, currently offered trainer for this time. */
  function select(offered: AvailableSlot) {
    if (
      result?.status !== "success" ||
      (draft.slots.length >= MAX_BOOKING_SESSIONS &&
        !draft.slots.some((slot) => slotKey(slot) === slotKey(offered))) ||
      pastSelectionCutoff(offered) ||
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
  }
  const selectionNoticeContent = (
    <div className="booking-help-content">
      <p>
        {selectionNotice === CHECKOUT_UNRESOLVED ? (
          <strong>{CALENDAR_CHECKOUT_PAUSED}</strong>
        ) : (
          selectionNotice
        )}
      </p>
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
  );
  if (emailRejection?.phase === "checking")
    return <BrandLoading label="Checking session availability…" />;
  const notices = (
    <Fragment key="booking-notices">
      {recoveryNotice}
      {emailRejection &&
        (emailRejection.phase === "unavailable" ||
          emailRejection.phase === "unknown") && (
          <RejectedEmailHelp
            attemptId={emailRejection.id}
            email={emailRejection.email}
            availability={emailRejection.phase}
          />
        )}
      {selectionNotice &&
        (selectionNotice === CHECKOUT_UNRESOLVED && attempt ? (
          <BookingHelp
            key={attempt.id}
            attemptId={attempt.id}
            className="calendar-recovery-notice"
          >
            {selectionNoticeContent}
          </BookingHelp>
        ) : (
          <div className="alert" role="alert">
            {selectionNoticeContent}
          </div>
        ))}
    </Fragment>
  );
  if (
    publicCalendarReady &&
    (!calendar.initialReady || (findingInitialDay && calendarBusy))
  ) {
    return (
      <>
        {notices}
        {calendar.failed.length ? (
          <div className="alert availability-alert" role="alert">
            <span>{AVAILABILITY_LOAD_FAILED}</span>{" "}
            <button
              className="text-link"
              aria-label="Try again"
              onClick={() => calendar.retry(calendar.failed)}
            >
              Try again.
            </button>
          </div>
        ) : (
          <BrandLoading
            label="Checking dates…"
            overlay={!browsingCheckout && !recoveryNotice}
            compact={browsingCheckout || !!recoveryNotice}
          />
        )}
      </>
    );
  }
  const contextContent = (sessionName: string) =>
    mobile ? (
      <p className="calendar-selection-context">
        <strong>
          {LOCATION.building} · {sessionName}
        </strong>
      </p>
    ) : (
      <div className="calendar-selection-context calendar-context-cards">
        <span>{LOCATION.building}</span>
        <span>{sessionName}</span>
      </div>
    );
  const calendarContext =
    live && bookingService.operations.availability === "live" ? (
      <LiveCatalogue
        renderStatus={(state) =>
          contextContent(
            state === "loading"
              ? "Loading session details…"
              : "Session details unavailable",
          )
        }
        render={(data) =>
          contextContent(
            data.services.find(
              (service) => service.id === draft.nativeServiceId,
            )?.name ?? "Session details unavailable",
          )
        }
      />
    ) : (
      contextContent(live ? "Session details unavailable" : SERVICE_NAME)
    );
  return (
    <>
      <BookingHeading lines={["Select dates", "and times"]} />
      {mobile && (
        <>
          {calendarContext}
          <p className="lead">
            {SESSION_MINUTES}-min session · 10-min changeover.
          </p>
        </>
      )}
      {notices}
      <section
        className="calendar-panel"
        aria-label="Booking calendar"
        aria-busy={
          calendarBusy || (!!throughMonth && !sibling && !siblingFailed)
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
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
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
                          revealBookingSection(headingRef.current);
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
            {!mobile && (
              <p className="calendar-duration-note">
                *{SESSION_MINUTES}-min session · 10-min changeover.
              </p>
            )}
            {!mobile && calendarContext}
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
              <div
                className="times"
                role="group"
                aria-label="Session times"
                style={
                  {
                    "--time-rows": Math.ceil(groups.length / 2),
                  } as CSSProperties
                }
              >
                <p className="mobile-time-hint">
                  <span className="time-info" aria-hidden="true">
                    i
                  </span>
                  <span>Select to view trainers available</span>
                </p>
                {groups.map((offers, index) => {
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
                  const elapsed = pastSelectionCutoff(slot, now);
                  const disabled =
                    (!available ||
                      elapsed ||
                      draft.slots.length >= MAX_BOOKING_SESSIONS) &&
                    !selected;
                  const toggle = () => {
                    if (disabled) return;
                    if (selected || (!pastSelectionCutoff(slot) && available)) {
                      setChoosing(choosing === key ? null : key);
                    }
                  };
                  const next = groups[index + 1]?.[0];
                  const showCue =
                    !!next &&
                    !selected &&
                    !draft.slots.some(
                      (item) => slotKey(item) === slotKey(next),
                    ) &&
                    (mobile || index !== Math.ceil(groups.length / 2) - 1);
                  return (
                    <div className="time-choice-wrap" key={key}>
                      <div
                        className="time-choice"
                        onClick={(event) => {
                          if (
                            !(event.target instanceof Element) ||
                            event.target.closest("button, select")
                          )
                            return;
                          toggle();
                        }}
                      >
                        <button
                          className={`time${selected ? " selected" : ""}`}
                          aria-pressed={!!selected}
                          aria-expanded={choosing === key}
                          disabled={disabled}
                          onClick={toggle}
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
                          </span>
                        </button>
                        {selected && (
                          <button
                            className="time-remove"
                            aria-label={`Remove selected session ${slot.date} at ${slot.start}`}
                            onClick={() => {
                              update({
                                slots: draft.slots.filter(
                                  (item) => slotKey(item) !== key,
                                ),
                              });
                              if (choosing === key) setChoosing(null);
                            }}
                          >
                            <Icon name="close" />
                          </button>
                        )}
                        {choosing === key && (
                          <div className="trainer-choice">
                            <select
                              aria-label={`Trainer for ${slot.date} at ${slot.start}`}
                              value={selected ? sessionOfferKey(selected) : ""}
                              disabled={
                                elapsed ||
                                !available ||
                                result?.status !== "success"
                              }
                              onPointerDown={() => {
                                trainerPointer.current = true;
                              }}
                              onKeyDown={() => {
                                trainerPointer.current = false;
                              }}
                              onBlur={() => {
                                trainerPointer.current = false;
                              }}
                              onChange={(event) => {
                                const pointerSelection = trainerPointer.current;
                                const offer = offers.find(
                                  (item) =>
                                    sessionOfferKey(item) ===
                                    event.target.value,
                                );
                                if (offer) select(offer);
                                if (pointerSelection)
                                  event.currentTarget.blur();
                              }}
                            >
                              <option value="" disabled>
                                Choose a trainer
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
                          </div>
                        )}
                      </div>
                      {showCue && (
                        <span className="time-slot-cue" aria-hidden="true">
                          <span>
                            {slot.start}–{endTime(slot.start)}
                          </span>
                        </span>
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
