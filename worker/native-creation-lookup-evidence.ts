import { z } from "zod";

import { emailSchema } from "../src/domain/contact";
import { freshReceipt } from "./catalogue";
import { intentSchema, bookedMinutes, occupiedMinutes } from "./journal";
import { recoveryMarker } from "./native-creation-marker";
import { studioStartsFromIntervals } from "./native-grid";
import { ApiError } from "./policy";
import { bookingWallTime, providerId } from "./provider-normalization";
import {
  BOOKING_LOOKUP_MAX_PAGES,
  BOOKING_LOOKUP_PAGE_SIZE,
  type NativeExchange,
} from "./provider-transport";

type Intent = z.infer<typeof intentSchema>;
type Evidence = {
  match: "empty" | "candidate" | "ambiguous" | "unavailable";
  windowsAvailable: boolean | null;
};
const bookingPage = z.object({
  data: z
    .array(
      z.object({
        id: z.unknown(),
        service_id: z.unknown(),
        provider_id: z.unknown(),
        start_datetime: z.string(),
        end_datetime: z.string(),
        duration: z.unknown(),
        client: z.object({ email: z.unknown().optional() }).nullish(),
      }),
    )
    .max(BOOKING_LOOKUP_PAGE_SIZE),
  metadata: z.object({
    page: z.number().int().positive(),
    on_page: z.literal(BOOKING_LOOKUP_PAGE_SIZE),
    items_count: z.number().int().nonnegative(),
    pages_count: z.number().int().min(0).max(BOOKING_LOOKUP_MAX_PAGES),
  }),
});
type WindowGroup = {
  date: string;
  serviceId: string;
  instructorId: string;
  starts: number[];
};
const singaporeWallTime = (ms: number) =>
  new Date(ms + 8 * 3600000).toISOString();

const invalidReport = () =>
  new ApiError(503, "native_booking_list_unavailable");
const lookupMarker = z.strictObject({
  field: recoveryMarker.shape.field,
  values: z.array(recoveryMarker.shape.value).min(1).max(12),
});

/** Validate the page envelope and the item count for this precise request. */
function parseBookingPage(body: unknown, page: number) {
  const { data, metadata } = bookingPage.parse(body);
  const total = metadata.items_count;
  const pages = Math.max(1, Math.ceil(total / BOOKING_LOOKUP_PAGE_SIZE));
  if (
    metadata.page !== page ||
    page > pages ||
    Math.max(1, metadata.pages_count) !== pages ||
    (metadata.pages_count === 0 && total > 0) ||
    data.length !==
      Math.min(
        BOOKING_LOOKUP_PAGE_SIZE,
        total - (page - 1) * BOOKING_LOOKUP_PAGE_SIZE,
      )
  )
    throw invalidReport();
  return { data, total, pages };
}

/** Collect bounded, fresh report and interval evidence for the original intent. */
export async function lookupUnknownCreationEvidence(options: {
  intent: Intent;
  exchange: NativeExchange;
  signal: AbortSignal;
  marker?: z.infer<typeof lookupMarker>;
}): Promise<Evidence> {
  const { exchange, signal } = options;
  signal.throwIfAborted();
  try {
    const intent = intentSchema.parse(options.intent);
    const email = emailSchema.parse(intent.contact?.email);
    const marker = lookupMarker.optional().parse(options.marker);
    if (
      marker &&
      (marker.values.length !== intent.sessions.length ||
        new Set(marker.values).size !== marker.values.length)
    )
      throw invalidReport();
    const markersByTime = new Map(
      intent.sessions.map((session, index) => [
        session.startMs,
        marker?.values[index],
      ]),
    );
    const byStart = new Map(intent.sessions.map((s) => [s.startMs, s]));
    const groups = new Map<string, WindowGroup>();
    for (const session of intent.sessions) {
      const date = singaporeWallTime(session.startMs).slice(0, 10);
      const serviceId = providerId(session.serviceId);
      const instructorId = providerId(session.instructorId);
      const key = [date, serviceId, instructorId].join("/");
      const group = groups.get(key) ?? {
        date,
        serviceId,
        instructorId,
        starts: [],
      };
      group.starts.push(session.startMs);
      groups.set(key, group);
    }
    const ids = new Set<string>();
    const candidates = new Map<number, string>();
    let ambiguous = false;
    let windowsAvailable = true;
    let oldestRead = Infinity;
    for (const { starts, ...scope } of groups.values()) {
      let pages = 1;
      let total: number | undefined;
      for (let page = 1; page <= pages; page++) {
        signal.throwIfAborted();
        const report = await exchange(
          { kind: "booking-list", ...scope, page },
          signal,
        );
        signal.throwIfAborted();
        freshReceipt(report.receivedAtMs, Date.now());
        oldestRead = Math.min(oldestRead, report.receivedAtMs);
        const reportPage = parseBookingPage(report.body, page);
        pages = reportPage.pages;
        if (total !== undefined && total !== reportPage.total)
          throw invalidReport();
        total = reportPage.total;
        for (const row of reportPage.data) {
          const id = providerId(row.id);
          const start = bookingWallTime(row.start_datetime, "Asia/Singapore");
          const end = bookingWallTime(row.end_datetime, "Asia/Singapore");
          if (
            ids.has(id) ||
            end <= start ||
            row.start_datetime.slice(0, 10) !== scope.date ||
            providerId(row.service_id) !== scope.serviceId ||
            providerId(row.provider_id) !== scope.instructorId
          )
            throw invalidReport();
          ids.add(id);
          const contact = emailSchema.safeParse(row.client?.email);
          if (contact.success && contact.data !== email) continue;
          for (const original of starts) {
            const session = byStart.get(original)!;
            const occupiedMs = occupiedMinutes(session) * 60000;
            if (end <= original || start >= original + occupiedMs) continue;
            if (
              contact.success &&
              start === original &&
              end === original + occupiedMs &&
              providerId(row.duration) === String(bookedMinutes(session)) &&
              !candidates.has(original)
            )
              candidates.set(original, id);
            else ambiguous = true;
          }
        }
      }
      // The report omits intake answers. Its field filter can identify additional
      // leads but cannot authenticate a response or supply a booking signing hash.
      if (marker) {
        for (const original of starts) {
          const value = markersByTime.get(original)!;
          signal.throwIfAborted();
          const filtered = await exchange(
            {
              kind: "booking-list",
              ...scope,
              page: 1,
              marker: { field: marker.field, value },
            },
            signal,
          );
          signal.throwIfAborted();
          freshReceipt(filtered.receivedAtMs, Date.now());
          oldestRead = Math.min(oldestRead, filtered.receivedAtMs);
          const { data, total } = parseBookingPage(filtered.body, 1);
          // A second or conflicting row (including a provider ignoring the
          // field filter) keeps the attempt protected for reconciliation.
          if (
            total > 1 ||
            data.some((row) => providerId(row.id) !== candidates.get(original))
          )
            ambiguous = true;
        }
      }
      signal.throwIfAborted();
      const intervals = await exchange(
        { kind: "availability", ...scope, intervals: true },
        signal,
      );
      signal.throwIfAborted();
      freshReceipt(intervals.receivedAtMs, Date.now());
      oldestRead = Math.min(oldestRead, intervals.receivedAtMs);
      const offered = studioStartsFromIntervals(
        intervals.body,
        scope.date,
        scope.instructorId,
        occupiedMinutes(byStart.get(starts[0])!),
      );
      if (
        starts.some(
          (start) => !offered.includes(singaporeWallTime(start).slice(11, 19)),
        )
      ) {
        windowsAvailable = false;
      }
    }
    freshReceipt(oldestRead, Date.now());
    // A report can change while paging. Even complete list and capacity reads
    // cannot prove the original dispatch finished or authorize a booking ID.
    const match =
      ambiguous ||
      (candidates.size > 0 && candidates.size < intent.sessions.length)
        ? "ambiguous"
        : candidates.size > 0
          ? "candidate"
          : "empty";
    return { match, windowsAvailable };
  } catch {
    signal.throwIfAborted();
    return { match: "unavailable", windowsAvailable: null };
  }
}
