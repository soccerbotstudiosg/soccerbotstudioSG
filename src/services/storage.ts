import { MAX_BOOKING_SESSIONS } from "@/domain/booking-policy";
import { z } from "zod";
import {
  attemptSchema,
  blankDraft,
  draftSchema,
  slotSchema,
  instructorSchema,
} from "@/domain/booking";
import { demoSession } from "./demo/schedule";
const storedSchema = z.object({
  version: z.literal(2),
  draft: draftSchema,
  attempt: attemptSchema.nullable(),
});
export type StoredBooking = z.infer<typeof storedSchema>;
const KEY = "soccerbot-next-demo-v2";
const LEGACY_KEY = "soccerbot-next-demo-v1";
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
/** Migrate a stored draft into the current client schema. */
function upgradeDraft(value: unknown): unknown {
  const draft = record(value);
  if (!draft || !("instructor" in draft) || !Array.isArray(draft.slots))
    return value;
  const instructor = instructorSchema.safeParse(draft.instructor);
  return {
    ...draft,
    slots: draft.slots.map((value: unknown) => {
      const slot = record(value);
      if (
        !slot ||
        typeof slot.date !== "string" ||
        typeof slot.start !== "string"
      )
        return value;
      const session = demoSession({ date: slot.date, start: slot.start });
      return session
        ? {
            ...session,
            ...(instructor.success ? { instructor: instructor.data } : {}),
          }
        : value;
    }),
  };
}
/** Migrate a stored booking into the current client schema. */
export function upgradeBooking(value: unknown): unknown {
  const booking = record(value),
    draft = record(booking?.draft);
  if (
    !booking ||
    !draft ||
    !("instructor" in draft) ||
    !Array.isArray(booking.slots)
  )
    return value;
  const next = record(upgradeDraft({ ...draft, slots: booking.slots }));
  const slots = next?.slots as unknown[] | undefined;
  return {
    ...booking,
    draft: upgradeDraft(draft),
    slots: slots?.map((slot, i) => ({
      ...record(slot),
      studio: record((booking.slots as unknown[])[i])?.studio,
    })),
  };
}
/** Validate and upgrade the persisted client booking state. */
function upgradeStored(value: unknown): unknown {
  const stored = record(value);
  if (stored?.version !== 1) return value;
  const attempt = record(stored.attempt);
  return {
    ...stored,
    version: 2,
    draft: upgradeDraft(stored.draft),
    attempt: attempt
      ? {
          ...attempt,
          draft: upgradeDraft(attempt.draft),
          booking: upgradeBooking(attempt.booking),
        }
      : null,
  };
}
/** Read local storage without propagating unavailable-storage errors. */
export function safeRead(key: string, persistent = false): unknown {
  try {
    return JSON.parse(
      (persistent ? localStorage : sessionStorage).getItem(key) || "null",
    );
  } catch {
    return null;
  }
}
/** Write local state while tolerating unavailable browser storage. */
export function safeWrite(
  key: string,
  value: unknown,
  persistent = false,
): void {
  try {
    (persistent ? localStorage : sessionStorage).setItem(
      key,
      JSON.stringify(value),
    );
  } catch {
    /* Private browsing may deny persistence. In-memory flow remains available. */
  }
}
/** Remember only a payment-return hint; this suppresses repayment and never proves payment. */
export function completedPaymentReturn(attemptId: string, received = false) {
  const key = `soccerbot-payment-return:${attemptId}`;
  if (received) safeWrite(key, { completed: true });
  return received || record(safeRead(key))?.completed === true;
}
export const EXPIRY_RECONCILIATION_MS = 20000;
export const CHECKOUT_RECOVERY_WAIT_MS = 30000;
/** One foreground wait per attempt, including response loss and reload. Not financial authority. */
export function checkoutRecoveryDeadline(
  attemptId: string,
  now = Date.now(),
  phase: "checkout" | "confirmation" = "checkout",
) {
  const key = `soccerbot-${phase}-wait:${attemptId}`;
  const saved = record(safeRead(key));
  if (typeof saved?.deadline === "number" && Number.isFinite(saved.deadline))
    return Math.min(saved.deadline, now + CHECKOUT_RECOVERY_WAIT_MS);
  const deadline = now + CHECKOUT_RECOVERY_WAIT_MS;
  safeWrite(key, { deadline });
  return deadline;
}
const EXPIRY_STATUS_SETTLEMENT_MS = 10000;
/** Keep one display-only expiry wait across reloads; this never releases a payment lock. */
export function expiryReconciliationDeadline(
  attemptId: string,
  paymentDeadline: number,
  now: number,
  awaitingFreshStatus = false,
) {
  // Allow one bounded status-response window when server pacing spans the grace period.
  const settlement = awaitingFreshStatus ? EXPIRY_STATUS_SETTLEMENT_MS : 0;
  const key = `soccerbot-expiry-reconciliation:${attemptId}`;
  const saved = record(safeRead(key));
  if (
    saved &&
    typeof saved.deadline === "number" &&
    Number.isFinite(saved.deadline)
  )
    return Math.min(
      saved.deadline + settlement,
      now + EXPIRY_RECONCILIATION_MS + settlement,
    );
  const deadline = now + EXPIRY_RECONCILIATION_MS;
  safeWrite(key, { paymentDeadline, deadline });
  const written = record(safeRead(key));
  // Without persistence, skip optional foreground waiting rather than renew it on reload.
  return written?.paymentDeadline === paymentDeadline &&
    written.deadline === deadline
    ? deadline + settlement
    : now;
}
/** Remove local state while tolerating unavailable browser storage. */
export function safeRemove(key: string, persistent = false): void {
  try {
    (persistent ? localStorage : sessionStorage).removeItem(key);
  } catch {
    /* Storage can be disabled. */
  }
}
/** Load validated persisted booking state. */
export function loadBooking(): StoredBooking {
  const parsed = storedSchema.safeParse(
    safeRead(KEY) ?? upgradeStored(safeRead(LEGACY_KEY)),
  );
  return parsed.success
    ? parsed.data
    : { version: 2, draft: blankDraft(), attempt: null };
}
/** Persist the permitted booking state fields. */
export function saveBooking(value: StoredBooking) {
  safeWrite(KEY, value);
}

// An editable live draft is display data only. Attempts and payment authority
// are always restored from the authenticated server, never browser storage.
/** Load the client draft without treating it as server authority. */
export function loadLiveDraft() {
  const parsed = draftSchema.safeParse(safeRead("soccerbot-live-draft"));
  return parsed.success ? { ...parsed.data, accepted: false } : blankDraft();
}
/** Return only this tab's attempt correlation, never payment authority. */
export function liveCheckoutAttemptId() {
  const value = record(safeRead("soccerbot-live-draft"))?.checkoutAttemptId;
  return typeof value === "string" ? value : null;
}
/** Check this tab's navigation preference, never checkout authority. */
export function mayRestoreLiveCheckout(attemptId?: string) {
  const stored = record(safeRead("soccerbot-live-draft"));
  return (
    stored?.resumeCheckout !== false &&
    (!attemptId || stored?.checkoutAttemptId === attemptId)
  );
}
/** Persist the live draft and its tab-local checkout navigation preference. */
export function saveLiveDraft(
  draft: StoredBooking["draft"],
  resumeCheckout = mayRestoreLiveCheckout(),
  checkoutAttemptId: string | null | undefined = (() => {
    const value = record(safeRead("soccerbot-live-draft"))?.checkoutAttemptId;
    return typeof value === "string" ? value : undefined;
  })(),
) {
  const previous = record(safeRead("soccerbot-live-draft"));
  safeWrite("soccerbot-live-draft", {
    ...draft,
    accepted: false,
    resumeCheckout,
    ...(checkoutAttemptId ? { checkoutAttemptId } : {}),
    leftBookingFlow:
      !!checkoutAttemptId &&
      previous?.checkoutAttemptId === checkoutAttemptId &&
      previous?.leftBookingFlow === true,
    ...(checkoutAttemptId && previous?.checkoutAttemptId === checkoutAttemptId
      ? { departedSlots: loadDepartureSlots(checkoutAttemptId) }
      : {}),
    calendarNoticeDismissed:
      !!checkoutAttemptId &&
      previous?.checkoutAttemptId === checkoutAttemptId &&
      previous?.calendarNoticeDismissed === true,
    calendarRecovery:
      resumeCheckout &&
      previous?.checkoutAttemptId === checkoutAttemptId &&
      previous?.calendarRecovery === true,
    unresolvedCheckout:
      resumeCheckout &&
      previous?.checkoutAttemptId === checkoutAttemptId &&
      previous?.unresolvedCheckout === true,
  });
}

/** Retain display-only affected slots across refresh without granting booking authority. */
export function loadSuppressedSlots() {
  const parsed = draftSchema.shape.slots.safeParse(
    safeRead("soccerbot-suppressed-slots"),
  );
  return parsed.success ? parsed.data : [];
}
/** Save slots hidden pending fresh availability; this never authorizes a checkout. */
export function saveSuppressedSlots(slots: StoredBooking["draft"]["slots"]) {
  safeWrite("soccerbot-suppressed-slots", slots);
}

/** Remember calendar navigation for this tab's retained unresolved attempt only. */
export function saveCalendarRecovery(attemptId: string, unresolved = false) {
  const stored = record(safeRead("soccerbot-live-draft"));
  if (stored?.checkoutAttemptId === attemptId)
    safeWrite("soccerbot-live-draft", {
      ...stored,
      calendarRecovery: true,
      unresolvedCheckout: unresolved,
    });
}
export function isUnresolvedCheckout(attemptId: string) {
  const stored = record(safeRead("soccerbot-live-draft"));
  return (
    stored?.checkoutAttemptId === attemptId &&
    stored?.unresolvedCheckout === true
  );
}
/** Restore recovery presentation only when the authenticated attempt matches this tab. */
export function isCalendarRecovery(attemptId: string) {
  const stored = record(safeRead("soccerbot-live-draft"));
  return mayRestoreLiveCheckout(attemptId) && stored?.calendarRecovery === true;
}

/** Remember dismissal of this attempt's calendar notice without changing recovery authority. */
export function dismissCalendarRecoveryNotice(attemptId: string) {
  const stored = record(safeRead("soccerbot-live-draft"));
  if (stored?.checkoutAttemptId === attemptId)
    safeWrite("soccerbot-live-draft", {
      ...stored,
      calendarNoticeDismissed: true,
    });
}
/** Read this tab's display-only notice dismissal for the matching attempt. */
export function calendarRecoveryNoticeDismissed(attemptId: string) {
  const stored = record(safeRead("soccerbot-live-draft"));
  return (
    stored?.checkoutAttemptId === attemptId &&
    stored?.calendarNoticeDismissed === true
  );
}

const noticeSlotsSchema = z.array(slotSchema).max(MAX_BOOKING_SESSIONS);
export type NoticeSlot = z.infer<typeof noticeSlotsSchema>[number];
/** Read validated display-only affected slots; an empty array retains generic conflict copy. */
export function loadConflictNotice(
  kind: "conflict" | "cutoff" = "conflict",
): NoticeSlot[] | null {
  const parsed = noticeSlotsSchema.safeParse(
    safeRead(`soccerbot-${kind}-notice`),
  );
  return parsed.success ? parsed.data : null;
}
/** Retain availability copy across refresh without persisting booking authority. */
export function saveConflictNotice(
  slots: NoticeSlot[] | null,
  kind: "conflict" | "cutoff" = "conflict",
) {
  if (slots !== null) safeWrite(`soccerbot-${kind}-notice`, slots);
  else safeRemove(`soccerbot-${kind}-notice`);
}

// Pending conflict data is a tab-local display snapshot, never server authority.
const pendingConflictSchema = z.strictObject({
  reason: z.literal("checkout_already_active").optional(),
  attemptId: z.string().uuid().nullable(),
  draft: draftSchema,
  rejectedSessionIndex: z
    .number()
    .int()
    .min(0)
    .max(MAX_BOOKING_SESSIONS - 1)
    .optional(),
});
export type PendingConflict = z.infer<typeof pendingConflictSchema>;
/** Restore only the pending original draft belonging to this tab's attempt marker. */
export function loadPendingConflict(): PendingConflict | null {
  const parsed = pendingConflictSchema.safeParse(
    safeRead("soccerbot-pending-conflict"),
  );
  if (!parsed.success || parsed.data.attemptId !== liveCheckoutAttemptId())
    return null;
  if (
    parsed.data.rejectedSessionIndex !== undefined &&
    parsed.data.rejectedSessionIndex >= parsed.data.draft.slots.length
  )
    return null;
  return parsed.data;
}
/** Persist display correlation while awaiting complete fresh conflict classification. */
export function savePendingConflict(value: PendingConflict | null) {
  if (value)
    safeWrite("soccerbot-pending-conflict", pendingConflictSchema.parse(value));
  else safeRemove("soccerbot-pending-conflict");
}

/** Remember deliberate departure while preserving the exact unresolved attempt correlation. */
export function markBookingDeparture(
  id: string,
  slots: StoredBooking["draft"]["slots"],
) {
  const stored = record(safeRead("soccerbot-live-draft"));
  if (stored?.checkoutAttemptId === id)
    safeWrite("soccerbot-live-draft", {
      ...stored,
      leftBookingFlow: true,
      departedSlots: slots,
    });
}
/** Restore only validated affected times belonging to this tab's departed attempt. */
export function loadDepartureSlots(id: string) {
  const stored = record(safeRead("soccerbot-live-draft"));
  const slots = draftSchema.shape.slots
    .max(MAX_BOOKING_SESSIONS)
    .safeParse(
      stored?.checkoutAttemptId === id && stored?.leftBookingFlow === true
        ? stored.departedSlots
        : undefined,
    );
  return slots.success ? slots.data : [];
}
/** Read only this tab's departure marker, never financial authority. */
export function isBookingDeparture(id: string | null) {
  const stored = record(safeRead("soccerbot-live-draft"));
  return (
    !!id && stored?.checkoutAttemptId === id && stored?.leftBookingFlow === true
  );
}

const SEEN_CONFIRMATION_KEY = "soccerbot-confirmation-seen";
/** Read a bounded presentation hint; this never grants payment or receipt authority. */
export function hasSeenConfirmation(attemptId: string) {
  try {
    return localStorage.getItem(SEEN_CONFIRMATION_KEY) === attemptId;
  } catch {
    return false;
  }
}
/** Remember the last displayed confirmation for repeat provider-return navigation only. */
export function markConfirmationSeen(attemptId: string) {
  try {
    localStorage.setItem(SEEN_CONFIRMATION_KEY, attemptId);
  } catch {
    /* Storage is optional. */
  }
}
