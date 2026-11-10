"use client";
import { AVAILABILITY_LOAD_FAILED } from "@/domain/booking-messages";
import { useEffect, useMemo, useState } from "react";
import { BOOKING_LEAD_MS, withinOpeningHours } from "@/domain/booking-policy";
import {
  BookingServiceError,
  type AvailableSlot,
  type BookingService,
} from "@/services/contracts";

type Result =
  | {
      owner: BookingService;
      key: string;
      dates: string[];
      status: "success";
      slots: AvailableSlot[];
    }
  | {
      owner: BookingService;
      key: string;
      dates: string[];
      status: "failure" | "unavailable" | "cancelled";
      message: string;
    };
// BookingProvider is the sole query owner. Calendar, basket and instructor cards
// share one read per distinct date in this input revision. No persistent cache.
/** Load slot availability while rejecting stale selection responses. */
export function useBookingAvailability(
  service: BookingService,
  dates: string[],
  players: number,
  scope: string,
  minute: number,
  sessionKey: () => string,
  serviceId?: string,
  cachedDates?: Record<string, AvailableSlot[]>,
) {
  const datesKey = JSON.stringify([...new Set(dates)].sort());
  const session = sessionKey();
  const displayKey = JSON.stringify([
    service.mode,
    serviceId,
    datesKey,
    players,
    scope,
    session,
  ]);
  const key = JSON.stringify([
    service.mode,
    serviceId,
    datesKey,
    players,
    scope,
    minute,
    session,
  ]);
  const requested: string[] = useMemo(() => JSON.parse(datesKey), [datesKey]);
  const displayCache = useMemo(() => {
    const entries = { ...cachedDates };
    if (service.mode === "live" && service.operations.availability === "live")
      for (const date of requested)
        if (
          Date.parse(`${date}T23:59:59+08:00`) <
          minute * 60_000 + BOOKING_LEAD_MS
        )
          entries[date] = [];
    return entries;
  }, [
    cachedDates,
    service.mode,
    service.operations.availability,
    requested,
    minute,
  ]);
  const cached = useMemo(
    () =>
      requested.length && requested.every((date) => displayCache[date])
        ? {
            owner: service,
            key,
            dates: requested,
            status: "success" as const,
            slots: requested
              .flatMap((date) => displayCache[date])
              .filter(
                (slot) =>
                  withinOpeningHours(
                    Date.parse(`${slot.date}T${slot.start}:00+08:00`),
                  ) &&
                  Date.parse(`${slot.date}T${slot.start}:00+08:00`) -
                    minute * 60_000 >=
                    BOOKING_LEAD_MS,
              ),
          }
        : null,
    [requested, displayCache, service, key, minute],
  );
  const [result, setResult] = useState<Result | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (cached) return;
    const controller = new AbortController();
    let current = true;
    const requested: string[] = JSON.parse(datesKey);
    void Promise.all(
      requested.map(
        (date) =>
          displayCache[date] ??
          service.availability({
            date,
            players,
            ...(serviceId ? { serviceId } : {}),
            signal: controller.signal,
          }),
      ),
    ).then(
      (values) => {
        if (current && !controller.signal.aborted)
          setResult(
            sessionKey() === session
              ? {
                  owner: service,
                  key,
                  dates: requested,
                  status: "success",
                  slots: values
                    .flat()
                    .filter((slot) =>
                      withinOpeningHours(
                        Date.parse(`${slot.date}T${slot.start}:00+08:00`),
                      ),
                    ),
                }
              : {
                  owner: service,
                  key,
                  dates: requested,
                  status: "cancelled",
                  message:
                    "Your session has changed. Please check availability again.",
                },
          );
      },
      (error) => {
        if (!current || controller.signal.aborted) return;
        const known = error instanceof BookingServiceError ? error : null;
        setResult({
          owner: service,
          key,
          dates: requested,
          status:
            known?.code === "unavailable"
              ? "unavailable"
              : known?.code === "cancelled"
                ? "cancelled"
                : "failure",
          message:
            known?.code === "cancelled"
              ? known.message
              : AVAILABILITY_LOAD_FAILED,
        });
      },
    );
    return () => {
      current = false;
      controller.abort();
    };
  }, [
    service,
    datesKey,
    players,
    key,
    reload,
    session,
    sessionKey,
    serviceId,
    cached,
    displayCache,
  ]);
  const currentResult =
    cached ?? (result?.key === key && result.owner === service ? result : null);
  const [retained, setRetained] = useState<{
    owner: BookingService;
    key: string;
    result: Extract<Result, { status: "success" }>;
  } | null>(null);
  if (currentResult?.status === "success" && retained?.result !== currentResult)
    setRetained({ owner: service, key: displayKey, result: currentResult });
  else if (
    retained &&
    (retained.owner !== service ||
      retained.key !== displayKey ||
      currentResult?.status === "cancelled")
  )
    setRetained(null);
  return {
    result: currentResult,
    // Presentation only: minute refreshes cannot grant stale selection authority.
    displayResult:
      currentResult?.status === "success"
        ? currentResult
        : (!currentResult ||
              currentResult.status === "failure" ||
              currentResult.status === "unavailable") &&
            retained?.owner === service &&
            retained.key === displayKey
          ? retained.result
          : null,
    retry() {
      setResult(null);
      setReload((value) => value + 1);
    },
  };
}
