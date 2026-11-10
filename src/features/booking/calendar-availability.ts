"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BROWSER_CALENDAR_MAX_AGE_MS,
  nativeDisplaySlots,
} from "@/domain/native-checkout";
import { monthAt, todaySG } from "@/domain/dates";
import {
  BOOKING_LEAD_MS,
  BOOKING_MONTH_COUNT,
  isStudioSessionStart,
} from "@/domain/booking-policy";
import { CATALOGUE_MAX_AGE_MS } from "@/domain/catalog";
import type {
  AvailableSlot,
  BookingService,
  CalendarAvailability,
} from "@/services/contracts";

const retention = (entry: CalendarAvailability) =>
  entry.displayExpiresAtMs !== undefined
    ? entry.displayExpiresAtMs - entry.observedAtMs
    : entry.dates.every((day) => day.offers !== undefined)
      ? BROWSER_CALENDAR_MAX_AGE_MS
      : CATALOGUE_MAX_AGE_MS;
// Load only the visible month(s). Rolling weeks may span two months.
// TimeStep may advance initial discovery once
// through supported months; only display expiry replaces an already loaded month.
/** Load calendar availability and reconcile the selected day. */
export function useCalendarAvailability(
  service: BookingService,
  serviceId: string | undefined,
  month: string,
  scope: string,
  paused: boolean,
  throughMonth?: string,
  observedNow?: number,
) {
  const [reload, setReload] = useState(0);
  const [refreshIndicator, setRefreshIndicator] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const protectedServiceId = service.publicCalendar ? undefined : serviceId;
  const key = JSON.stringify([
    service.publicCalendar ? "public" : serviceId,
    scope,
  ]);
  const [state, setState] = useState<{
    owner: BookingService;
    key: string;
    entries: Record<string, CalendarAvailability & { receivedAtMs: number }>;
    failed: string[];
  } | null>(null);
  const retained = useRef(state);
  useEffect(() => {
    retained.current = state;
  }, [state]);
  useEffect(() => {
    if (
      paused ||
      (!service.publicCalendar && (!service.calendar || !protectedServiceId))
    )
      return;
    const controller = new AbortController();
    const calendar = service.calendar;
    const requested = [
      ...new Set(
        [month, throughMonth].filter((value): value is string => !!value),
      ),
    ];
    void Promise.all(
      requested.map(async (next) => {
        if (
          next >
          monthAt(
            todaySG(new Date(Date.now())).slice(0, 7) + "-01",
            BOOKING_MONTH_COUNT - 1,
          ).slice(0, 7)
        )
          return;
        if (controller.signal.aborted) return;
        const previous = retained.current;
        const saved =
          previous?.owner === service && previous.key === key
            ? previous.entries[next]
            : undefined;
        if (saved && Date.now() - saved.observedAtMs < retention(saved)) return;
        if (saved) setRefreshIndicator(JSON.stringify([key, next]));
        try {
          const result = service.publicCalendar
            ? await service.publicCalendar({
                month: next,
                signal: controller.signal,
              })
            : await calendar!({
                month: next,
                serviceId: protectedServiceId!,
                signal: controller.signal,
              });
          if (
            protectedServiceId &&
            "serviceId" in result &&
            result.serviceId !== protectedServiceId
          )
            throw new Error("calendar_service_changed");
          if (controller.signal.aborted) return;
          const receivedAtMs = Date.now();
          if (result.observedAtMs + retention(result) <= receivedAtMs)
            throw new Error("calendar_receipt_expired");
          setState((previous) => {
            const entries =
              previous?.owner === service && previous.key === key
                ? { ...previous.entries }
                : {};
            entries[next] = { ...result, receivedAtMs };
            const retained = Object.fromEntries(
              Object.entries(entries).slice(-BOOKING_MONTH_COUNT),
            );
            const failed =
              previous?.owner === service && previous.key === key
                ? previous.failed.filter((value) => value !== next)
                : [];
            return { owner: service, key, entries: retained, failed };
          });
        } catch {
          if (!controller.signal.aborted)
            setState((previous) => {
              const entries =
                previous?.owner === service && previous.key === key
                  ? { ...previous.entries }
                  : {};
              const failed =
                previous?.owner === service && previous.key === key
                  ? [...new Set([...previous.failed, next])]
                  : [next];
              return { owner: service, key, entries, failed };
            });
          return;
        }
      }),
    );
    return () => controller.abort();
  }, [
    service,
    protectedServiceId,
    month,
    throughMonth,
    scope,
    paused,
    key,
    reload,
  ]);
  // Replace the visible month at its fixed deadline. Retain its layout while
  // fetching, but never reuse expired offers as selectable availability.
  useEffect(() => {
    if (paused || state?.owner !== service || state.key !== key) return;
    const deadlines = Object.values(state.entries)
      .flatMap((entry) => [
        entry.observedAtMs + retention(entry),
        ...(entry.monthCoverage ?? []).flatMap((coverage) =>
          coverage.state === "unknown" ? [] : [coverage.displayExpiresAtMs],
        ),
      ])
      .filter((deadline) => deadline > checkedAt);
    if (!deadlines.length) return;
    const timer = setTimeout(
      () => {
        const now = Date.now();
        setCheckedAt(now);
        if (
          [month, throughMonth].some((selected) => {
            const entry = selected ? state.entries[selected] : undefined;
            return (
              entry &&
              entry.observedAtMs + retention(entry) <= now &&
              !state.failed.includes(selected!)
            );
          })
        )
          setReload((value) => value + 1);
      },
      Math.max(0, Math.min(...deadlines) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [state, service, key, month, throughMonth, paused, checkedAt]);
  useEffect(() => {
    if (!refreshIndicator) return;
    const timer = setTimeout(() => setRefreshIndicator(null), 500);
    return () => clearTimeout(timer);
  }, [refreshIndicator]);
  const current = state?.owner === service && state.key === key ? state : null;
  const reconcile = useCallback(
    (date: string, available: boolean | undefined, slots?: AvailableSlot[]) => {
      // Failed/unknown reads cannot erase last-known date presentation.
      if (available === undefined) return;
      setState((previous) => {
        if (!previous || previous.owner !== service || previous.key !== key)
          return previous;
        const month = date.slice(0, 7);
        const entry = previous.entries[month];
        if (!entry) return previous;
        const existing = entry.dates.find((day) => day.date === date);
        if (existing?.available === available && !slots) return previous;
        const dates = entry.dates.filter((day) => day.date !== date);
        dates.push({
          date,
          available,
          ...(slots && slots.every((slot) => slot.native)
            ? {
                offers: slots.map((slot) => ({
                  ...slot.native!,
                  instructorId: slot.instructor,
                  startMs: Date.parse(`${slot.date}T${slot.start}:00+08:00`),
                })),
              }
            : {}),
        });
        return {
          ...previous,
          entries: {
            ...previous.entries,
            [month]: {
              ...entry,
              dates: dates.sort((a, b) => a.date.localeCompare(b.date)),
            },
          },
        };
      });
    },
    [service, key],
  );
  const cachedDates = useMemo(
    () =>
      Object.fromEntries(
        Object.values(current?.entries ?? {})
          .filter(
            (entry) =>
              entry.observedAtMs + retention(entry) >
              Math.max(observedNow ?? checkedAt, checkedAt, entry.receivedAtMs),
          )
          .flatMap((entry) =>
            entry.dates.flatMap((day) =>
              day.offers &&
              day.offers.every(
                (offer) =>
                  (offer.productServiceId ?? offer.serviceId) === serviceId,
              )
                ? [[day.date, nativeDisplaySlots(day.date, day.offers)]]
                : [],
            ),
          ),
      ),
    [current, serviceId, checkedAt, observedNow],
  );
  return {
    cachedDates,
    /** Trim only trailing months proved empty by still-current server cache evidence. */
    lastMonthOffset(now: number) {
      const observedNow = Math.max(now, checkedAt);
      const latestCoverage = Object.values(current?.entries ?? {})
        .filter((entry) => entry.monthCoverage)
        .sort((a, b) => b.receivedAtMs - a.receivedAtMs)[0]?.monthCoverage;
      let offset = BOOKING_MONTH_COUNT - 1;
      const today = todaySG(new Date(observedNow));
      while (offset > 0) {
        const selected = monthAt(today, offset).slice(0, 7);
        const coverage = latestCoverage?.find(
          (entry) => entry.month === selected,
        );
        const loaded = current?.entries[selected];
        const hasAvailableDates =
          loaded &&
          loaded.observedAtMs + retention(loaded) > observedNow &&
          loaded.dates.some((day) => day.available);
        if (
          hasAvailableDates ||
          current?.failed.includes(selected) ||
          coverage?.state !== "empty" ||
          coverage.observedAtMs === undefined ||
          coverage.observedAtMs > observedNow ||
          coverage.displayExpiresAtMs <= observedNow
        )
          break;
        offset -= 1;
      }
      return offset;
    },
    reconcile,
    hasLoaded: (selected: string) => !!current?.entries[selected],
    /** Last-known grid only: never expose expired offers or extend their deadline. */
    displayEntry(selected: string) {
      const entry = current?.entries[selected];
      return entry
        ? {
            dates: entry.dates.map(({ date, available }) => ({
              date,
              available,
            })),
          }
        : null;
    },
    refreshing: (selected: string) =>
      refreshIndicator === JSON.stringify([key, selected]),
    /** Resolve a cached calendar entry and filter offers against the current cutoff. */
    entry(selected: string, now: number) {
      const value = current?.entries[selected];
      const observedNow = Math.max(now, checkedAt, value?.receivedAtMs ?? now);
      return value &&
        value.observedAtMs <= observedNow &&
        observedNow - value.observedAtMs < retention(value)
        ? {
            ...value,
            dates: value.dates.map((day) => {
              if (!day.offers) return day;
              const offers = day.offers.filter(
                (offer) =>
                  isStudioSessionStart(offer.startMs) &&
                  offer.startMs - observedNow >= BOOKING_LEAD_MS,
              );
              return {
                ...day,
                offers,
                available: day.available && offers.length > 0,
              };
            }),
          }
        : null;
    },
    failed: current?.failed ?? [],
    retry: (
      months: string[] = [
        ...new Set(
          [month, throughMonth].filter((value): value is string => !!value),
        ),
      ],
    ) => {
      // Invalidate requested offers while retaining their display; siblings keep their fixed deadline.
      const previous = retained.current;
      if (previous?.owner === service && previous.key === key) {
        const entries = { ...previous.entries };
        for (const selected of months) {
          const entry = entries[selected];
          if (entry)
            entries[selected] = {
              ...entry,
              displayExpiresAtMs: entry.observedAtMs,
            };
        }
        const next = { ...previous, entries, failed: [] };
        retained.current = next;
        setState(next);
      }
      setReload((value) => value + 1);
    },
  };
}
