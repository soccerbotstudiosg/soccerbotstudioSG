import { z } from "zod";
import {
  isStudioSessionStart,
  MAX_BOOKING_SESSIONS,
  BOOKING_MONTH_COUNT,
} from "./booking-policy";
import { validDisplayDeadline } from "./catalog";
import { providerReferencesSchema } from "./provider-references";
// Initial sandbox checkout URL only; the server binds merchant and request ID.
/** Restrict hosted payment URLs to the accepted HitPay origins. */
export function isHitpayCheckoutUrl(value: string): boolean {
  return (
    value === value.trim() &&
    /^https:\/\/(?:securecheckout|checkout)\.sandbox\.hit-pay\.com\/payment-request\/@[A-Za-z0-9_-]{1,80}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/checkout$/.test(
      value,
    )
  );
}

export const hitpayHandoffSchema = z.strictObject({
  url: z.string().max(2048).refine(isHitpayCheckoutUrl),
  expiresAtMs: z.number().int().positive().safe(),
});

export const creationResolutionSchema = z.strictObject({
  state: z.literal("not_created"),
});
export type CreationResolution = z.infer<typeof creationResolutionSchema>;

// Only protected server reads with retained no-effect evidence may return this.
export const checkoutSelectionRejectionSchema = z
  .strictObject({
    state: z.enum(["selection_unavailable", "restart_required"]),
    rejectedSessionIndex: z.number().int().min(0).max(11).optional(),
    rejectedSessionIndices: z
      .array(z.number().int().min(0).max(11))
      .min(1)
      .max(MAX_BOOKING_SESSIONS)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
  })
  .refine(
    (value) =>
      value.rejectedSessionIndex === undefined ||
      !value.rejectedSessionIndices ||
      value.rejectedSessionIndices.includes(value.rejectedSessionIndex),
  );
export type CheckoutSelectionRejection = z.infer<
  typeof checkoutSelectionRejectionSchema
>;

// Owner-supplied token-free historical native destination shape, 9 October 2026.
// Validating this initial URL does not attest downstream redirects or sandbox mode.
/** Validate a native checkout URL against the accepted host policy. */
export function isNativeCheckoutUrl(value: string): boolean {
  return /^https:\/\/soccerbotstudiosg\.simplybook\.asia\/v2\/client\/pay-later\/id\/[A-Za-z0-9_-]+\/hash\/[A-Za-z0-9_-]+$/.test(
    value,
  );
}

// Provider-ID DTOs for the protected customer flow. Browser labels and reviewed
// totals are display/consent snapshots; the Worker revalidates provider truth.
import { isDate } from "./dates";
import { providerIdentifier } from "./catalog";
import { contactSchema, validatedContactSchema } from "./contact";
import { MAX_PLAYERS } from "./booking-policy";
// Bound response size independently of the number of providers in the roster.
export const MAX_DAILY_NATIVE_OFFERS = 2000;
export const MAX_CALENDAR_NATIVE_OFFERS = 6000;
export const MAX_CALENDAR_BYTES = 1500000;
/** Keep calendar payloads within browser and durable snapshot storage budgets. */
function boundedCalendar(value: { dates: { offers?: unknown[] }[] }) {
  return (
    value.dates.reduce((count, day) => count + (day.offers?.length ?? 0), 0) <=
      MAX_CALENDAR_NATIVE_OFFERS &&
    new TextEncoder().encode(JSON.stringify(value)).byteLength <=
      MAX_CALENDAR_BYTES
  );
}
export const nativeOfferSchema = z.strictObject({
  serviceId: providerIdentifier,
  productServiceId: providerIdentifier.optional(),
  serviceName: z.string().min(1).max(256),
  instructorId: providerIdentifier,
  instructorName: z.string().min(1).max(256),
  startMs: z.number().int().positive().safe(),
  priceMinor: z.number().int().nonnegative().safe(),
  currency: z.literal("SGD"),
});
export const nativeAvailabilitySchema = z.strictObject({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observedAtMs: z.number().int().nonnegative().safe(),
  offers: z.array(nativeOfferSchema).max(MAX_DAILY_NATIVE_OFFERS),
});
const coverageMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const calendarMonthCoverageSchema = z
  .array(
    z.union([
      z.strictObject({ month: coverageMonth, state: z.literal("unknown") }),
      z
        .strictObject({
          month: coverageMonth,
          state: z.enum(["available", "empty"]),
          observedAtMs: z.number().int().nonnegative().safe(),
          displayExpiresAtMs: z.number().int().positive().safe(),
        })
        .refine(validDisplayDeadline),
    ]),
  )
  .max(BOOKING_MONTH_COUNT)
  .refine(
    (entries) =>
      new Set(entries.map((entry) => entry.month)).size === entries.length,
  );
export type CalendarMonthCoverage = z.infer<typeof calendarMonthCoverageSchema>;

export const publicCalendarSchema = z
  .strictObject({
    displayExpiresAtMs: z.number().int().nonnegative().safe().optional(),
    monthCoverage: calendarMonthCoverageSchema.optional(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    serviceId: providerIdentifier,
    observedAtMs: z.number().int().nonnegative().safe(),
    dates: z
      .array(
        z.strictObject({
          date: z.string().refine(isDate),
          available: z.boolean(),
          offers: z
            .array(nativeOfferSchema)
            .max(MAX_DAILY_NATIVE_OFFERS)
            .optional(),
        }),
      )
      .max(31),
  })
  .refine(boundedCalendar)
  .refine(validDisplayDeadline)
  .refine(
    (value) =>
      new Set(value.dates.map((day) => day.date)).size === value.dates.length &&
      value.dates.every(
        (day) =>
          day.date.startsWith(value.month + "-") &&
          (!day.offers ||
            (day.available === day.offers.length > 0 &&
              new Set(
                day.offers.map(
                  (offer) =>
                    `${offer.serviceId}|${offer.instructorId}|${offer.startMs}`,
                ),
              ).size === day.offers.length &&
              day.offers.every(
                (offer) =>
                  (offer.productServiceId ?? offer.serviceId) ===
                    value.serviceId &&
                  new Date(offer.startMs + 28800000)
                    .toISOString()
                    .slice(0, 10) === day.date,
              ))),
      ),
  );

/** Bound one public response to the complete booking-window month set. */
export const publicCalendarSnapshotSchema = z
  .strictObject({
    months: z.array(publicCalendarSchema).length(BOOKING_MONTH_COUNT),
  })
  .refine(
    ({ months }) =>
      new Set(months.map((entry) => entry.month)).size ===
        BOOKING_MONTH_COUNT &&
      months.every((entry) => entry.serviceId === months[0].serviceId),
  );

export const nativeCalendarSchema = z
  .strictObject({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    observedAtMs: z.number().int().nonnegative().safe(),
    dates: z.array(nativeAvailabilitySchema).max(31),
  })
  .refine(boundedCalendar);
export const nativePrepareSchema = z
  .strictObject({
    key: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
    contact: validatedContactSchema,
    accepted: z.boolean(),
    holding: z.literal(true).optional(),
    sessions: z
      .array(
        z.strictObject({
          serviceId: providerIdentifier,
          instructorId: providerIdentifier,
          startMs: z.number().int().positive().safe(),
          players: z.number().int().min(1).max(MAX_PLAYERS),
          totalMinor: z.number().int().nonnegative().safe(),
        }),
      )
      .min(1)
      .max(MAX_BOOKING_SESSIONS),
  })
  .refine((value) => value.accepted || value.holding === true);

export const nativeCurrentSchema = z.union([
  z.strictObject({ state: z.literal("empty") }),
  z.strictObject({
    state: z.enum(["prepared", "held", "checking"]),
    attemptId: z.string().uuid(),
    contact: contactSchema.strict(),
    sessions: z
      .array(
        nativeOfferSchema.extend({
          players: z.number().int().min(1).max(MAX_PLAYERS),
        }),
      )
      .min(1)
      .max(12),
  }),
]);

export const bookingDetailsSchema = z
  .strictObject({
    providerReferences: providerReferencesSchema.optional(),
    attemptId: z.string().uuid(),
    createdAtMs: z.number().int().nonnegative().safe(),
    totalMinor: z.number().int().nonnegative().safe(),
    taxMinor: z.number().int().nonnegative().safe(),
    contact: contactSchema.strict(),
    sessions: z
      .array(
        nativeOfferSchema.extend({
          players: z.number().int().min(1).max(MAX_PLAYERS),
        }),
      )
      .min(1)
      .max(12),
  })
  .refine(
    (value) =>
      value.taxMinor <= value.totalMinor &&
      value.sessions.reduce((sum, session) => sum + session.priceMinor, 0) ===
        value.totalMinor,
  );

// Display details carry no payment/confirmation authority or verification time.
export const receiptSchema = bookingDetailsSchema.safeExtend({
  verifiedAtMs: z.number().int().nonnegative().safe(),
});

// Display-only conversion shared by calendar prefetch and fresh daily reads.
/** Convert validated native availability into customer-facing slots. */
export function nativeDisplaySlots(
  date: string,
  offers: z.infer<typeof nativeOfferSchema>[],
) {
  return offers
    .filter((offer) => isStudioSessionStart(offer.startMs))
    .map((offer) => ({
      date,
      start: new Date(offer.startMs + 28800000).toISOString().slice(11, 16),
      instructor: offer.instructorId,
      available: true,
      native: {
        serviceId: offer.serviceId,
        ...(offer.productServiceId
          ? { productServiceId: offer.productServiceId }
          : {}),
        serviceName: offer.serviceName,
        instructorName: offer.instructorName,
        priceMinor: offer.priceMinor,
        currency: offer.currency,
      },
    }));
}
export const BROWSER_CALENDAR_MAX_AGE_MS = 5 * 60_000;

/** Remove off-grid calendar offers without extending their original freshness. */
export function studioDisplayCalendar(
  value: z.infer<typeof publicCalendarSchema>,
) {
  return {
    ...value,
    dates: value.dates.map((day) => {
      if (!day.offers) return day;
      const offers = day.offers.filter((offer) =>
        isStudioSessionStart(offer.startMs),
      );
      return { ...day, offers, available: day.available && offers.length > 0 };
    }),
  };
}
