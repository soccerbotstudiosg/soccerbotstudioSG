import type { Enquiry } from "@/domain/enquiry";
import { BOOKING_SIGNED_OUT } from "@/domain/booking-messages";
import type { z } from "zod";
import type {
  hitpayHandoffSchema,
  nativeOfferSchema,
  receiptSchema,
  bookingDetailsSchema,
  CheckoutSelectionRejection,
  CreationResolution,
  CalendarMonthCoverage,
} from "@/domain/native-checkout";
import type { Attempt, BookingDraft, Outcome, Session } from "@/domain/booking";
export type AvailableSlot = Session & { available: boolean };
export type BookingMode = "demo" | "live";
export type BookingOperation =
  "availability" | "checkout" | "pay" | "check" | "resolve";
export type BookingRequest = { signal?: AbortSignal };
export type AvailabilityInput = BookingRequest & {
  date: string;
  players: number;
  serviceId?: string;
  fresh?: boolean;
};
export type CalendarAvailability = {
  monthCoverage?: CalendarMonthCoverage;
  displayExpiresAtMs?: number;
  month: string;
  observedAtMs: number;
  dates: {
    date: string;
    available: boolean;
    offers?: z.infer<typeof nativeOfferSchema>[];
  }[];
};
export type CheckoutInput = BookingRequest & {
  botToken?: string;
  holding?: boolean;
  draft: BookingDraft;
  previous: Attempt | null;
};
export type PayInput = BookingRequest & {
  botToken?: string;
  startCheckout?: boolean;
  onReviewReady?: () => void;
  onCheckoutReady?: (checkout: z.infer<typeof hitpayHandoffSchema>) => void;
  attempt: Attempt;
  outcome: Outcome;
  holding?: boolean;
};
export type AttemptInput = BookingRequest & { attempt: Attempt };
export type ResolveInput = AttemptInput & { now?: number };
export interface BookingService {
  publicCalendarSnapshot?(
    input: BookingRequest,
  ): Promise<{ months: (CalendarAvailability & { serviceId: string })[] }>;

  publicCalendar?(
    input: BookingRequest & { month: string },
  ): Promise<CalendarAvailability & { serviceId: string }>;
  calendar?(
    input: BookingRequest & { month: string; serviceId: string },
  ): Promise<CalendarAvailability>;
  restore?(signal: AbortSignal): Promise<Attempt | null>;
  readonly mode: BookingMode;
  readonly operations: Readonly<
    Record<BookingOperation, "demo" | "live" | "unavailable">
  >;
  availability(input: AvailabilityInput): Promise<AvailableSlot[]>;
  checkout(input: CheckoutInput): Promise<Attempt>;
  pay(input: PayInput): Promise<Attempt>;
  check(input: AttemptInput): Promise<Attempt>;
  resolve(input: ResolveInput): Promise<Attempt>;
}
export type BookingErrorCode =
  | "invalid_request"
  | "invalid_response"
  | "selection_unavailable"
  | "selection_changed"
  | "reservation_expired"
  | "checkout_window_blocked"
  | "checkout_already_active"
  | "booking_not_created"
  | "checkout_not_started"
  | "checkout_timeout"
  | "checkout_verification_required"
  | "reservation_blocked"
  | "queue_busy"
  | "payment_unavailable"
  | "conflict"
  | "unavailable"
  | "temporarily_unavailable"
  | "cancelled";
export const EMAIL_SECURITY_CHECK_REQUIRED =
  "Complete the security check and try again.";
export const EMAIL_REQUEST_LIMITED = "Too many code requests. Try again later.";
/** Mark locally authored customer guidance, never raw server or transport errors. */
export class CustomerMessageError extends Error {}
/** Carry a validated server deadline without exposing raw provider errors. */
export class VerificationRequestLimitedError extends CustomerMessageError {
  constructor(public readonly retryAt: number | null) {
    super(EMAIL_REQUEST_LIMITED);
    this.name = "VerificationRequestLimitedError";
  }
}
/** Distinguish revoked profile consent from failed booking access or transport. */
export class ProfileAccessRevokedError extends CustomerMessageError {
  constructor() {
    super(BOOKING_SIGNED_OUT);
  }
}
/** Display reviewed guidance or an operation-specific fallback for unexpected errors. */
export function customerMessage(error: unknown, fallback: string) {
  return error instanceof CustomerMessageError ? error.message : fallback;
}
export class BookingServiceError extends CustomerMessageError {
  constructor(
    public readonly code: BookingErrorCode,
    message: string,
    public readonly rejectedSessionIndex?: number,
    public readonly rejectedSessionIndices?: number[],
  ) {
    super(message);
    this.name = "BookingServiceError";
  }
}
export interface EnquiryService {
  readonly mode: "demo" | "live";
  submit(
    values: Enquiry,
    proof?: { key: string; botToken: string },
  ): Promise<{ email: string; delivered: boolean }>;
}
export type { Enquiry } from "@/domain/enquiry";
export type VerifiedIdentity = {
  email: string;
  expiresAt: number;
  remember?: boolean;
};
export type AuthChallenge = {
  email: string;
  expiresAt: number;
  used: boolean;
  attempts: number;
};
export interface IdentityService {
  read(): VerifiedIdentity | null;
  challenge(email: string): AuthChallenge;
  verify(
    challenge: AuthChallenge,
    code: string,
    remember: boolean,
  ): VerifiedIdentity;
  signOut(): void;
  profile(email: string): BookingDraft["contact"] | null;
  saveProfile(draft: BookingDraft): void;
}
export type CheckoutContext = {
  creationResolution?: CreationResolution;
  selectionRejection?: CheckoutSelectionRejection;
  bookingIssue?: "incomplete";
  paymentIssue?: "link_recovering" | "link_unavailable";
  /** Client-only server time anchor; never serialized as booking authority. */
  clock?: { epochMs: number; monotonicMs: number; uncertaintyMs: number };
  customerConfirmation?: z.infer<typeof receiptSchema>;
  expired?: boolean;
  details?: z.infer<typeof bookingDetailsSchema>;
  confirmation?: z.infer<typeof receiptSchema>;
  payment?: { status: "recorded"; paidAtMs: number };
  attemptId: string;
  mode: "synthetic" | "live";
  checkout:
    | { state: "unavailable" }
    | { state: "available"; url: string; expiresAtMs?: number };
  summary: {
    players: number;
    totalMinor: number;
    currency: "SGD";
    sessions: { startMs: number; players: number }[];
  };
  checking: {
    deadlineMs: number;
    paymentExpiresAtMs?: number;
    nextCheckMs: number;
    pollAfterMs: number;
    holdExpiresAtMs?: number;
    recoveryEndsAtMs?: number;
  };
};
export interface ProtectedCheckoutService {
  context(input: {
    attemptId: string;
    mode: "synthetic" | "live";
    signal: AbortSignal;
  }): Promise<CheckoutContext>;
}

export type CustomerChallenge = {
  email: string;
  expiresAt: number;
  challengeId: string;
  resendAfter: number;
  requestLimited?: boolean;
};
export interface CustomerIdentityService {
  readonly mode: "demo" | "live";
  current(): VerifiedIdentity | null;
  /** Forget displayed identity and fence late profile/verification replies. */
  invalidate?(): void;
  /** Inspect the existing identity without creating access or restoring a session. */
  readCurrent?(signal: AbortSignal): Promise<VerifiedIdentity | null>;
  refresh(signal: AbortSignal): Promise<VerifiedIdentity | null>;
  guest(signal: AbortSignal): Promise<void>;
  challenge(
    email: string,
    signal: AbortSignal,
    botToken?: string,
  ): Promise<CustomerChallenge>;
  verify(
    challenge: CustomerChallenge,
    code: string,
    remember: boolean,
    signal: AbortSignal,
  ): Promise<VerifiedIdentity>;
  profile(
    email: string,
    signal: AbortSignal,
  ): Promise<BookingDraft["contact"] | null>;
  saveProfile(
    contact: BookingDraft["contact"],
    signal: AbortSignal,
  ): Promise<void>;
  signOut(signal: AbortSignal, allDevices?: boolean): Promise<void>;
}
