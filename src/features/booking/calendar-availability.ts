"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BROWSER_CALENDAR_MAX_AGE_MS,
  nativeDisplaySlots,
} from "@/domain/native-checkout";
import { addDays, monthAt, todaySG } from "@/domain/dates";
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

// Keep an absent cache stable so clock-only updates do not restart day reads.
const EMPTY_CACHED_DATES: Record<string, AvailableSlot[]> = Object.freeze({});

/** Expand fresh empty-month evidence into explicit empty day entries. */
function emptyCalendarDates(month: string) {
  const [year, number] = month.split("-").map(Number);
  return Array.from(
    { length: new Date(Date.UTC(year, number, 0)).getUTCDate() },
    (_, index) => ({
      date: addDays(month + "-01", index),
      available: false,
      offers: [],
    }),
  );
}
const retention = (entry: CalendarAvailability) =>
  entry.displayExpiresAtMs !== undefined
    ? entry.displayExpiresAtMs - entry.observedAtMs
    : entry.dates.every((day) => day.offers !== undefined)
      ? BROWSER_CALENDAR_MAX_AGE_MS
      : CATALOGUE_MAX_AGE_MS;
// Prepare the actual advertised cache coverage once; subsequent reads refresh
// only the visible month(s), without replacing the stable calendar presentation.
/** Load calendar availability and reconcile the selected day. */
export function useCalendarAvailability(
  service: BookingService,
  serviceId: string | undefined,
  month: string,
  scope: string,
  paused: boolean,
  throughMonth?: string,
  observedNow?: number,
  prepareCoverage = true,
) {
  const [reload, setReload] = useState(0);
  const prepareWindow = service.publicCalendarSnapshot ? true : prepareCoverage;
  const [prepared, setPrepared] = useState<{
    owner: BookingService;
    key: string;
  } | null>(null);
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
  const preparedRef = useRef(prepared);
  useEffect(() => {
    preparedRef.current = prepared;
  }, [prepared]);
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
    const load = async (
      next: string,
    ): Promise<CalendarAvailability | undefined> => {
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
      if (saved && Date.now() - saved.observedAtMs < retention(saved))
        return saved;
      try {
        let result = service.publicCalendar
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
        const emptyCoverage = result.monthCoverage?.find(
          (entry) =>
            entry.month === next &&
            entry.state === "empty" &&
            entry.observedAtMs <= receivedAtMs &&
            entry.displayExpiresAtMs > receivedAtMs,
        );
        if (!result.dates.length && emptyCoverage?.state === "empty")
          result = {
            ...result,
            dates: emptyCalendarDates(next),
            displayExpiresAtMs: Math.min(
              result.observedAtMs + retention(result),
              emptyCoverage.displayExpiresAtMs,
            ),
          };
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
        return result;
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
    };
    void (async () => {
      if (service.publicCalendarSnapshot) {
        const previous = retained.current;
        const first = todaySG(new Date(Date.now())).slice(0, 7) + "-01";
        const months = Array.from({ length: BOOKING_MONTH_COUNT }, (_, index) =>
          monthAt(first, index).slice(0, 7),
        );
        if (
          previous?.owner === service &&
          previous.key === key &&
          months.every((month) => {
            const entry = previous.entries[month];
            return (
              entry &&
              entry.observedAtMs <= Date.now() &&
              entry.observedAtMs + retention(entry) > Date.now()
            );
          })
        ) {
          setPrepared({ owner: service, key });
          return;
        }
        try {
          const snapshot = await service.publicCalendarSnapshot({
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          const receivedAtMs = Date.now();
          if (
            snapshot.months.length !== months.length ||
            months.some(
              (month) =>
                !snapshot.months.some((entry) => entry.month === month),
            ) ||
            snapshot.months.some(
              (entry) =>
                entry.observedAtMs > receivedAtMs ||
                entry.observedAtMs + retention(entry) <= receivedAtMs,
            )
          )
            throw new Error("calendar_snapshot_incomplete");
          setState({
            owner: service,
            key,
            entries: Object.fromEntries(
              snapshot.months.map((entry) => [
                entry.month,
                { ...entry, receivedAtMs },
              ]),
            ),
            failed: [],
          });
          setPrepared({ owner: service, key });
        } catch {
          if (!controller.signal.aborted)
            setState((previous) => ({
              owner: service,
              key,
              entries:
                previous?.owner === service && previous.key === key
                  ? previous.entries
                  : {},
              failed: months,
            }));
        }
        return;
      }
      const visible = await Promise.all(requested.map(load));
      if (controller.signal.aborted || !prepareWindow) return;
      if (
        preparedRef.current?.owner === service &&
        preparedRef.current.key === key
      )
        return;
      const coverage = visible.find(
        (entry) => entry?.monthCoverage,
      )?.monthCoverage;
      const firstMonth = todaySG(new Date(Date.now())).slice(0, 7);
      const lastMonth = monthAt(
        firstMonth + "-01",
        BOOKING_MONTH_COUNT - 1,
      ).slice(0, 7);
      const covered = (coverage ?? []).filter(
        (entry) =>
          entry.month >= firstMonth &&
          entry.month <= lastMonth &&
          !requested.includes(entry.month),
      );
      // Empty cache evidence describes a display-ready empty grid, without
      // making another request or extending the server's original deadline.
      const results = await Promise.all(
        covered.map(async (entry) => {
          if (
            entry.state === "empty" &&
            entry.observedAtMs <= Date.now() &&
            entry.displayExpiresAtMs > Date.now()
          ) {
            setState((previous) => {
              if (
                previous?.owner !== service ||
                previous.key !== key ||
                (previous.entries[entry.month] &&
                  previous.entries[entry.month].observedAtMs +
                    retention(previous.entries[entry.month]) >
                    Date.now())
              )
                return previous;
              return {
                ...previous,
                entries: {
                  ...previous.entries,
                  [entry.month]: {
                    month: entry.month,
                    dates: emptyCalendarDates(entry.month),
                    observedAtMs: entry.observedAtMs,
                    displayExpiresAtMs: entry.displayExpiresAtMs,
                    receivedAtMs: Date.now(),
                  },
                },
              };
            });
            return true;
          }
          return !!(await load(entry.month));
        }),
      );
      if (
        !controller.signal.aborted &&
        visible.every(Boolean) &&
        results.every(Boolean)
      )
        setPrepared({ owner: service, key });
    })();
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
    prepareWindow,
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
  const cachedDates = useMemo(() => {
    const entries = Object.fromEntries(
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
    );
    return Object.keys(entries).length ? entries : EMPTY_CACHED_DATES;
  }, [current, serviceId, checkedAt, observedNow]);
  return {
    cachedDates,
    initialReady:
      !service.publicCalendar ||
      (prepared?.owner === service && prepared.key === key),
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
