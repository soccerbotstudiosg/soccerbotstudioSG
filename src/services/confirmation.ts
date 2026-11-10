import {
  creationResolutionSchema,
  receiptSchema,
  bookingDetailsSchema,
  checkoutSelectionRejectionSchema,
} from "@/domain/native-checkout";
import type { Booking } from "@/domain/booking";
import { LOCATION } from "@/domain/catalog";
import { MAX_PLAYERS } from "@/domain/booking-policy";
import {
  isNativeCheckoutUrl,
  isHitpayCheckoutUrl,
} from "@/domain/native-checkout";
import { z } from "zod";
import type { CheckoutContext, ProtectedCheckoutService } from "./contracts";
const idSchema = z.string().uuid();
const decisionSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("confirmed"),
    reason: z.literal("verified"),
    customerConfirmation: receiptSchema.optional(),
  }),
  z.strictObject({
    status: z.literal("pending"),
    reason: z.string(),
    customerConfirmation: receiptSchema.optional(),
    expired: z.boolean().optional(),
  }),
  z.strictObject({
    status: z.literal("unresolved"),
    reason: z.string(),
    customerConfirmation: receiptSchema.optional(),
    expired: z.boolean().optional(),
  }),
  z
    .strictObject({
      status: z.literal("invalid"),
      reason: z.string(),
      creationResolution: creationResolutionSchema.optional(),
      selectionRejection: checkoutSelectionRejectionSchema.optional(),
    })
    .refine(
      (value) =>
        (!value.selectionRejection ||
          value.reason === "checkout_selection_rejected") &&
        (!value.creationResolution ||
          (value.reason === "booking_not_created" &&
            !value.selectionRejection)),
    ),
  z.object({ status: z.literal("denied"), reason: z.literal("access_denied") }),
]);
export class ConfirmationError extends Error {
  constructor(
    public kind: "denied" | "unavailable" | "throttled" | "exhausted",
    public nextCheckMs?: number,
    public deadlineMs?: number,
  ) {
    super("confirmation_unavailable");
  }
}
const instant = z.number().int().nonnegative().safe();
const contextSchema = z.strictObject({
  creationResolution: creationResolutionSchema.optional(),
  selectionRejection: checkoutSelectionRejectionSchema.optional(),
  customerConfirmation: receiptSchema.optional(),
  expired: z.boolean().optional(),
  details: bookingDetailsSchema.optional(),
  confirmation: receiptSchema.optional(),
  payment: z
    .strictObject({ status: z.literal("recorded"), paidAtMs: instant })
    .optional(),
  bookingIssue: z.literal("incomplete").optional(),
  paymentIssue: z.enum(["link_recovering", "link_unavailable"]).optional(),
  attemptId: idSchema,
  mode: z.enum(["synthetic", "live"]),
  checkout: z.discriminatedUnion("state", [
    z.strictObject({ state: z.literal("unavailable") }),
    z.strictObject({
      state: z.literal("available"),
      url: z.string().max(2048),
      expiresAtMs: instant.positive().optional(),
    }),
  ]),
  summary: z.strictObject({
    players: z.number().int().min(1).max(MAX_PLAYERS),
    totalMinor: instant,
    currency: z.literal("SGD"),
    sessions: z
      .array(
        z.strictObject({
          startMs: instant,
          players: z.number().int().min(1).max(MAX_PLAYERS),
        }),
      )
      .min(1)
      .max(12),
  }),
  checking: z.strictObject({
    deadlineMs: instant,
    paymentExpiresAtMs: instant.positive().optional(),
    holdExpiresAtMs: instant.optional(),
    recoveryEndsAtMs: instant.optional(),
    nextCheckMs: instant,
    pollAfterMs: z.number().int().min(1000).max(30000),
  }),
});
/** Read protected booking data with consistent response validation. */
async function protectedRead(
  attemptId: string,
  operation: string,
  signal: AbortSignal,
  displayDetails = false,
  refreshReceipt = false,
) {
  idSchema.parse(attemptId);
  const response = await fetch(
    `/api/attempts/${encodeURIComponent(attemptId)}/${operation}`,
    {
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
      // Bound optional receipt/context reads too; a provider stall must not
      // strand the customer behind an unbounded loading screen.
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
      headers: {
        Accept: "application/json",
        ...(displayDetails ? { "X-Booking-Details": "1" } : {}),
        ...(refreshReceipt ? { "X-Booking-Refresh": "1" } : {}),
      },
    },
  );
  const value = (name: string) => {
    const raw = response.headers.get(name);
    const n = Number(raw);
    return raw && Number.isSafeInteger(n) && n >= 0 ? n : undefined;
  };
  const checking = {
    nextCheckMs: value("X-Next-Check"),
    deadlineMs: value("X-Checking-Deadline"),
  };
  if (response.status === 401 || response.status === 403)
    throw new ConfirmationError("denied");
  if (response.status === 429)
    throw new ConfirmationError(
      response.headers.get("X-Checks-Remaining") === "0"
        ? "exhausted"
        : "throttled",
      checking.nextCheckMs,
      checking.deadlineMs,
    );
  if (!response.ok) throw new ConfirmationError("unavailable");
  return { response, checking };
}
const responseTimes = new WeakMap<object, number>();
/** Read the monotonic time when validated response evidence became available. */
export function confirmationResponseTime(value: object | null | undefined) {
  return value ? responseTimes.get(value) : undefined;
}
/** Attach local timing without changing response contracts or retaining customer data. */
function timeResponse<T extends object>(value: T, ...proofs: unknown[]): T {
  const at = performance.now();
  for (const item of [value, ...proofs])
    if (item && typeof item === "object") responseTimes.set(item, at);
  return value;
}
/** Read and validate the server's confirmation evidence. */
export async function readConfirmation(attemptId: string, signal: AbortSignal) {
  const { response, checking } = await protectedRead(
    attemptId,
    "confirmation",
    signal,
  );
  const decision = decisionSchema.parse(await response.json());
  if (
    "customerConfirmation" in decision &&
    decision.customerConfirmation?.attemptId !== undefined &&
    decision.customerConfirmation.attemptId !== attemptId
  )
    throw new ConfirmationError("unavailable");
  return timeResponse(
    { ...decision, checking },
    "customerConfirmation" in decision
      ? decision.customerConfirmation
      : undefined,
  );
}
/** Read the authorized receipt for the current booking attempt. */
export async function readBookingReceipt(
  attemptId: string,
  signal: AbortSignal,
  refresh = false,
) {
  const { response } = await protectedRead(
    attemptId,
    "receipt",
    signal,
    false,
    refresh,
  );
  const receipt = receiptSchema.parse(await response.json());
  // The authenticated server validates provider freshness. Compare its receipt
  // to its HTTP clock, not a customer's potentially skewed device clock.
  const serverDate = Date.parse(response.headers.get("Date") ?? "");
  const referenceTime = Number.isFinite(serverDate) ? serverDate : Date.now();
  const precision = Number.isFinite(serverDate) ? 999 : 0;
  if (
    signal.aborted ||
    receipt.attemptId !== attemptId ||
    receipt.verifiedAtMs > referenceTime + precision ||
    referenceTime - receipt.verifiedAtMs > 60000
  )
    throw new ConfirmationError("unavailable");
  return timeResponse(bookingFromReceipt(receipt));
}
/** Build a display booking from validated receipt evidence. */
export function bookingFromReceipt<
  T extends z.infer<typeof bookingDetailsSchema>,
>(receipt: T) {
  const slots = receipt.sessions.map((offer) => {
    const wall = new Date(offer.startMs + 28800000).toISOString();
    return {
      date: wall.slice(0, 10),
      start: wall.slice(11, 16),
      instructor: offer.instructorId,
      studio: LOCATION.building,
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
    };
  });
  const booking: Booking = {
    reference: receipt.attemptId,
    ...(receipt.providerReferences
      ? { providerReferences: receipt.providerReferences }
      : {}),
    createdAt: new Date(receipt.createdAtMs).toISOString(),
    totalCents: receipt.totalMinor,
    slots,
    draft: {
      mode: "guest",
      accountEmail: "",
      nativeServiceId:
        receipt.sessions[0].productServiceId ?? receipt.sessions[0].serviceId,
      players: receipt.sessions[0].players,
      slots,
      contact: receipt.contact,
      accepted: true,
    },
  };
  return { ...receipt, booking };
}
/** Advance server time with a conservative upper bound only for payment expiry. */
export function checkoutNow(
  clock?: CheckoutContext["clock"],
  paymentExpiry = false,
) {
  if (!clock) return Date.now();
  const elapsed = Math.max(0, performance.now() - clock.monotonicMs);
  // Poll against the lower bound so uncertainty cannot dispatch early requests.
  // Whole milliseconds preserve the persisted polling-budget integer contract.
  return Math.floor(
    clock.epochMs + elapsed + (paymentExpiry ? clock.uncertaintyMs : 0),
  );
}
export const protectedCheckoutService: ProtectedCheckoutService = {
  /** Read and validate protected checkout context for the selected mode. */
  async context({ attemptId, mode, signal }) {
    const started = performance.now();
    const { response } = await protectedRead(
      attemptId,
      "checkout",
      signal,
      true,
    );
    const context = contextSchema.parse(await response.json());
    const serverDate = Date.parse(response.headers.get("Date") ?? "");
    const received = performance.now();
    // Date has second precision. Arrival anchors the lower bound for polling;
    // the entire request and rounded second bound payment expiry conservatively.
    const clock = Number.isFinite(serverDate)
      ? {
          epochMs: serverDate,
          monotonicMs: received,
          uncertaintyMs: 999 + Math.max(0, received - started),
        }
      : undefined;
    if (
      context.attemptId !== attemptId ||
      context.mode !== mode ||
      (context.checking.paymentExpiresAtMs !== undefined &&
        (context.checking.paymentExpiresAtMs > context.checking.deadlineMs ||
          context.bookingIssue === "incomplete")) ||
      (context.confirmation && context.confirmation.attemptId !== attemptId) ||
      (context.details && context.details.attemptId !== attemptId) ||
      (context.customerConfirmation &&
        context.customerConfirmation.attemptId !== attemptId) ||
      (context.creationResolution &&
        (context.checkout.state !== "unavailable" ||
          context.payment ||
          context.confirmation ||
          context.customerConfirmation ||
          context.details ||
          context.bookingIssue ||
          context.paymentIssue ||
          context.expired ||
          context.selectionRejection)) ||
      (context.selectionRejection &&
        (context.checkout.state !== "unavailable" ||
          context.payment ||
          context.confirmation ||
          context.customerConfirmation ||
          context.bookingIssue ||
          context.selectionRejection.rejectedSessionIndices?.some(
            (index) => index >= context.summary.sessions.length,
          ) ||
          (context.selectionRejection.rejectedSessionIndex !== undefined &&
            context.selectionRejection.rejectedSessionIndex >=
              context.summary.sessions.length)))
    )
      throw new ConfirmationError("unavailable");
    if (context.checkout.state === "available") {
      if (
        mode === "synthetic"
          ? context.checkout.url !== `/__experiment/checkout/${attemptId}`
          : (!isNativeCheckoutUrl(context.checkout.url) &&
              !isHitpayCheckoutUrl(context.checkout.url)) ||
            context.checkout.expiresAtMs === undefined ||
            context.checkout.expiresAtMs > context.checking.deadlineMs
      )
        throw new ConfirmationError("unavailable");
    }
    // An authenticated expired handoff still supplies the display deadline.
    // Hide its URL without discarding the attempt or declaring unpaid release.
    const elapsedLink =
      mode === "live" &&
      context.checkout.state === "available" &&
      context.checkout.expiresAtMs !== undefined &&
      context.checkout.expiresAtMs <= checkoutNow(clock, true);
    const value =
      elapsedLink && context.checkout.state === "available"
        ? {
            ...context,
            checkout: { state: "unavailable" as const },
            checking: {
              ...context.checking,
              paymentExpiresAtMs: Math.min(
                context.checking.paymentExpiresAtMs ??
                  context.checkout.expiresAtMs!,
                context.checkout.expiresAtMs!,
              ),
            },
          }
        : context;
    return timeResponse(
      { ...value, clock },
      context.customerConfirmation,
      context.confirmation,
    );
  },
};

/** Create an attempt through the isolated local preview endpoint. */
export async function startSyntheticCheckout(
  signal: AbortSignal,
): Promise<string> {
  const response = await fetch("/__experiment/attempts", {
    method: "POST",
    credentials: "same-origin",
    redirect: "error",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new ConfirmationError("unavailable");
  return z.strictObject({ attemptId: idSchema }).parse(await response.json())
    .attemptId;
}

/** Request an authenticated expiry check without assuming payment cancellation. */
export async function expireBooking(attemptId: string, signal?: AbortSignal) {
  const id = idSchema.parse(attemptId);
  const response = await fetch(`/api/attempts/${id}/expire`, {
    signal,
    method: "POST",
    credentials: "same-origin",
    redirect: "error",
    cache: "no-store",
  });
  if (response.status === 401 || response.status === 403)
    throw new ConfirmationError("denied");
  if (!response.ok || !(await response.json()).expired)
    throw new Error(
      "Payment status is still being checked. Your original booking has been kept.",
    );
}

/** Dismiss a completed attempt through the authenticated server endpoint. */
export async function dismissCompletedBooking(attemptId: string) {
  const id = idSchema.parse(attemptId);
  const response = await fetch(`/api/attempts/${id}/dismiss`, {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    redirect: "error",
    headers: { Accept: "application/json" },
  });
  if (!response.ok || !(await response.json()).dismissed)
    throw new Error("Please try again to leave this booking.");
}

// Tab-local navigation intent only; the server still verifies completion and
// ownership before releasing anything. Retain interrupted exits across reload.
const exitKey = "soccerbot.completed-exit";
/** Read the locally retained completed-checkout exit intent. */
export function completedExitIntent() {
  try {
    const value = idSchema.safeParse(sessionStorage.getItem(exitKey));
    return value.success ? value.data : null;
  } catch {
    return null;
  }
}
/** Retain the completed-checkout exit intent for safe retry. */
export function rememberCompletedExit(id: string) {
  try {
    sessionStorage.setItem(exitKey, idSchema.parse(id));
  } catch {
    // Current-page work remains protected if browser storage is unavailable.
  }
}
/** Remove the locally retained completed-checkout exit intent. */
export function forgetCompletedExit(id: string) {
  try {
    if (completedExitIntent() === id) sessionStorage.removeItem(exitKey);
  } catch {}
}
