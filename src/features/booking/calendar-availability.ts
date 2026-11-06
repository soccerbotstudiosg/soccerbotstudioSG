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
// Load only the requested month. TimeStep may advance initial discovery once
// through supported months; only display expiry replaces an already loaded month.
/** Load calendar availability and reconcile the selected day. */
export function useCalendarAvailability(
  service: BookingService,
  serviceId: string | undefined,
  month: string,
  scope: string,
  paused: boolean,
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
    void (async () => {
      const next = month;
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
          return { owner: service, key, entries: retained, failed: [] };
        });
      } catch {
        if (!controller.signal.aborted)
          setState((previous) => {
            const entries =
              previous?.owner === service && previous.key === key
                ? { ...previous.entries }
                : {};
            return { owner: service, key, entries, failed: [next] };
          });
        return;
      }
    })();
    return () => controller.abort();
  }, [service, protectedServiceId, month, scope, paused, key, reload]);
  // Replace the visible month at its fixed deadline. Retain its layout while
  // fetching, but never reuse expired offers as selectable availability.
  useEffect(() => {
    if (paused || state?.owner !== service || state.key !== key) return;
    const deadlines = Object.values(state.entries)
      .map((entry) => entry.observedAtMs + retention(entry))
      .filter((deadline) => deadline > checkedAt);
    if (!deadlines.length) return;
    const timer = setTimeout(
      () => {
        const now = Date.now();
        setCheckedAt(now);
        const entry = state.entries[month];
        if (
          entry &&
          entry.observedAtMs + retention(entry) <= now &&
          !state.failed.includes(month)
        )
          setReload((value) => value + 1);
      },
      Math.max(0, Math.min(...deadlines) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [state, service, key, month, paused, checkedAt]);
  useEffect(() => {
    if (!refreshIndicator) return;
    const timer = setTimeout(() => setRefreshIndicator(null), 500);
    return () => clearTimeout(timer);
  }, [refreshIndicator]);
  const current = state?.owner === service && state.key === key ? state : null;
  const reconcile = useCallback(
    (date: string, available: boolean | undefined, slots?: AvailableSlot[]) => {
      setState((previous) => {
        if (!previous || previous.owner !== service || previous.key !== key)
          return previous;
        const month = date.slice(0, 7);
        const entry = previous.entries[month];
        if (!entry) return previous;
        const existing = entry.dates.find((day) => day.date === date);
        if (existing?.available === available && !slots) return previous;
        const dates = entry.dates.filter((day) => day.date !== date);
        if (available !== undefined)
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
              Math.max(checkedAt, entry.receivedAtMs),
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
    [current, serviceId, checkedAt],
  );
  return {
    cachedDates,
    reconcile,
    hasLoaded: (selected: string) => !!current?.entries[selected],
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
    retry: (months: string[] = [month]) => {
      // Drop only requested months; retained siblings keep their fixed deadline.
      const previous = retained.current;
      if (previous?.owner === service && previous.key === key) {
        const entries = { ...previous.entries };
        for (const selected of months) delete entries[selected];
        const next = { ...previous, entries, failed: [] };
        retained.current = next;
        setState(next);
      }
      setReload((value) => value + 1);
    },
  };
}
