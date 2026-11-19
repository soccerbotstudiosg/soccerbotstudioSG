"use client";
import {
  onProfileAccessLoss,
  onBookingAccessEstablished,
  profileAccessGeneration,
  reportProfileAccessLoss,
  bookingAccessExpired,
  bookingAccessNotice,
  rememberBookingAccessNotice,
  clearBookingAccessNotice,
} from "@/services/profile-access";
import {
  clearIdentityEntry,
  identitySignOutTask,
  waitForIdentitySignOut,
} from "@/services/identity";
import {
  BOOKING_SESSION_EXPIRED,
  BOOKING_SIGNED_OUT,
  CONFLICT_NOTICE,
  CONFLICT_CHECKING,
  ACTIVE_CHECKOUT_CHECKING,
  ACTIVE_CHECKOUT_NOTICE,
  BOOKING_NOT_CREATED,
  CHECKOUT_UNRESOLVED,
  PAYMENT_WINDOW_ENDED,
  SESSION_UNAVAILABLE,
} from "@/domain/booking-messages";
import { usePathname, useRouter } from "next/navigation";
import { BOOKING_LEAD_MS, MAX_BOOKING_SESSIONS } from "@/domain/booking-policy";
import { CATALOGUE_MAX_AGE_MS } from "@/domain/catalog";
import { BookingLoadingProvider } from "./booking-loading";
import {
  ConfirmationError,
  protectedCheckoutService,
  expireBooking,
  dismissCompletedBooking,
  completedExitIntent,
  rememberCompletedExit,
  forgetCompletedExit,
} from "@/services/confirmation";
import {
  type CheckoutSelectionRejection,
  isHitpayCheckoutUrl,
} from "@/domain/native-checkout";
import { todaySG } from "@/domain/dates";
import {
  slotKey,
  sessionOfferKey,
  sessionPrice,
  selectionErrors,
  overlaps,
} from "@/domain/booking";
import { useCalendarAvailability } from "./calendar-availability";
import {
  createContext,
  useEffectEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  blankDraft,
  paymentLocked,
  type BookingDraft,
  type Outcome,
} from "@/domain/booking";
import type {
  CheckoutContext,
  CustomerIdentityService,
} from "@/services/contracts";
import { services } from "@/services";
import { customerCatalogueService } from "@/services/customer-catalogue";
import { defineBookingService } from "@/services/booking";
import {
  BookingServiceError,
  ProfileAccessRevokedError,
  type BookingService,
  type BookingOperation,
} from "@/services/contracts";
import {
  loadPendingConflict,
  savePendingConflict,
  type PendingConflict,
  markBookingDeparture,
  loadDepartureSlots,
  isBookingDeparture,
  loadConflictNotice,
  clearDepartedBookingHelpNotice,
  type NoticeSlot,
  saveConflictNotice,
  loadBooking,
  loadLiveDraft,
  loadSuppressedSlots,
  saveSuppressedSlots,
  mayRestoreLiveCheckout,
  saveCalendarRecovery,
  clearCalendarRecovery,
  completedPaymentReturn,
  checkoutRecoveryDeadline,
  clearCheckoutRecoveryDeadline,
  isCalendarRecovery,
  isUnresolvedCheckout,
  dismissCalendarRecoveryNotice,
  calendarRecoveryNoticeDismissed,
  liveCheckoutAttemptId,
  markSubmittedCheckout,
  rememberPaymentContinuation,
  submittedCheckoutId,
  hasSeenConfirmation,
  saveLiveDraft,
  saveBooking,
  type StoredBooking,
} from "@/services/storage";
import { useBookingAvailability } from "./availability";
type Action = Exclude<BookingOperation, "availability"> | "reserve" | "review";
type BookingRequest = {
  controller: AbortController;
  operation: Action;
  submission?: { id: string; detached: boolean };
};
type ActionState = {
  status:
    "idle" | "loading" | "success" | "failure" | "unavailable" | "cancelled";
  operation?: Action;
  error?: string;
  returnToCalendar?: boolean;
  /** Retained financial attempt while the independent draft remains editable. */
  calendarRecovery?: boolean;
  unresolvedCheckout?: boolean;
  resumeAttemptId?: string;
};
type SessionChoices = { outlet: boolean; session: boolean };
interface BookingContextValue extends StoredBooking {
  profileAccessRevision: number;
  profileAccessNotice: string;
  sessionChoices: SessionChoices;
  setSessionChoices: (choices: SessionChoices) => void;
  availability: ReturnType<typeof useBookingAvailability>;
  showDate: (date: string | null) => void;
  calendar: ReturnType<typeof useCalendarAvailability>;
  showMonth: (month: string, through?: string) => void;
  setCalendarBrowsing: (active: boolean) => void;
  resolveUncreatedBooking: (
    id: string,
    sessions?: CheckoutContext["summary"]["sessions"],
  ) => boolean;
  conflictLoadingLabel: string | null;
  selectionNotice: string | null;
  selectionNoticeSlots: NoticeSlot[];
  visitBookingStep: (step: string) => void;
  suppressedSlots: BookingDraft["slots"];
  ready: boolean;
  now: number;
  revision: number;
  confirmationRevision: number;
  bookingService: BookingService;
  identityService: CustomerIdentityService;
  action: ActionState;
  cancel: () => void;
  update: (change: Partial<BookingDraft>) => void;
  reserve: () => Promise<boolean>;
  review: () => Promise<boolean>;
  checkout: (botToken?: string) => Promise<boolean>;
  pay: (outcome: Outcome) => Promise<boolean>;
  check: () => Promise<boolean>;
  resolve: () => Promise<boolean>;
  reset: () => void;
  resetIdentityDraft: () => void;
  saveContact: () => Promise<boolean>;
  profileSaveError: string;
  leave: { (): void; (verifiedAttemptId: string): void };
  restartAfterExpiry: (attemptId: string) => boolean;
  browseAfterChecking: (attemptId: string, unresolved?: boolean) => boolean;
  clearReviewConsent: () => void;
  detachCheckout: () => void;
  browsingCheckout: boolean;
  resumeSubmittedCheckout: () => void;
  resumePaymentStatus: (attemptId: string) => void;
  rejectRecoveredSelection: (
    attemptId: string,
    rejection: CheckoutSelectionRejection,
    signal?: AbortSignal,
  ) => Promise<boolean>;
  restartAfterConfirmation: (attemptId: string) => Promise<void>;
  rebookingError: string | null;
  retryRebooking: () => void;
}
/** Mark the exact source entry so Back from the provider first returns to Payment. */
function openHostedPayment(id: string, url: string) {
  window.history.replaceState(
    { ...window.history.state, soccerbotHostedPayment: id },
    "",
  );
  location.assign(url);
}

/** Read the navigation hint from the current browser history entry. */
function hostedPaymentEntry() {
  const id = window.history.state?.soccerbotHostedPayment;
  return typeof id === "string" ? id : null;
}

/** Observe entry changes even when consecutive history entries share a pathname. */
function subscribeHostedPaymentEntry(refresh: () => void) {
  window.addEventListener("popstate", refresh);
  window.addEventListener("pageshow", refresh);
  return () => {
    window.removeEventListener("popstate", refresh);
    window.removeEventListener("pageshow", refresh);
  };
}

// Match protected checkout recovery's bounded read and conservative retry cadence.
const CONFLICT_READ_TIMEOUT_MS = 10_000;
// Allow fifteen seconds each for provider admission and availability transport.
const CONFLICT_AVAILABILITY_TIMEOUT_MS = 30_000;
const CONFLICT_READ_RETRY_MS = 30_000;
/** Bound one read and ignore a transport that settles after timeout or cancellation. */
async function conflictRead<T>(
  read: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  timeoutMs = CONFLICT_READ_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  try {
    return await Promise.race([
      new Promise<never>((_, reject) => {
        abort = () => {
          controller.abort();
          reject(new Error("conflict_read_cancelled"));
        };
        if (signal.aborted) abort();
        else signal.addEventListener("abort", abort, { once: true });
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("conflict_read_timeout"));
        }, timeoutMs);
      }),
      Promise.resolve().then(() => {
        if (controller.signal.aborted)
          throw new Error("conflict_read_cancelled");
        return read(controller.signal);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    if (abort) signal.removeEventListener("abort", abort);
  }
}
/** Pace failed read recovery while allowing immediate cancellation on departure. */
function waitForConflictRead(signal: AbortSignal, nextCheckMs = 0) {
  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(
      finish,
      Math.max(CONFLICT_READ_RETRY_MS, nextCheckMs - Date.now()),
    );
    if (signal.aborted) finish();
    else signal.addEventListener("abort", finish, { once: true });
  });
}
/** Retain successful dates and retry only failed reads until every date is classified. */
async function readConflictSelections(
  service: BookingService,
  draft: BookingDraft,
  signal: AbortSignal,
  isCurrent: () => boolean,
) {
  const dates = [...new Set(draft.slots.map((slot) => slot.date))];
  const values = new Map<
    string,
    {
      slots: Awaited<ReturnType<BookingService["availability"]>>;
      observedAtMs: number;
    }
  >();
  while (!signal.aborted && isCurrent()) {
    for (const [date, read] of values)
      if (Date.now() - read.observedAtMs >= CATALOGUE_MAX_AGE_MS)
        values.delete(date);
    const missing = dates.filter((date) => !values.has(date));
    const startedAtMs = Date.now();
    const results = await Promise.allSettled(
      missing.map((date) =>
        conflictRead(
          (readSignal) =>
            service.availability({
              date,
              players: draft.players,
              serviceId: draft.nativeServiceId,
              fresh: true,
              signal: readSignal,
            }),
          signal,
          CONFLICT_AVAILABILITY_TIMEOUT_MS,
        ),
      ),
    );
    if (signal.aborted || !isCurrent()) return null;
    for (const [index, result] of results.entries())
      if (result.status === "fulfilled")
        values.set(missing[index], {
          slots: result.value,
          observedAtMs: startedAtMs,
        });
    for (const [date, read] of values)
      if (Date.now() - read.observedAtMs >= CATALOGUE_MAX_AGE_MS)
        values.delete(date);
    if (values.size === dates.length) {
      const results = dates.map((date) => ({
        status: "fulfilled" as const,
        value: values.get(date)!.slots,
      }));
      const unavailable = draft.slots.filter(
        (slot) =>
          !values
            .get(slot.date)!
            .slots.some(
              (offer) =>
                offer.available &&
                sessionOfferKey(offer) === sessionOfferKey(slot) &&
                sessionPrice(offer) === sessionPrice(slot),
            ),
      );
      return { dates, results, unavailable };
    }
    await waitForConflictRead(signal);
  }
  return null;
}
/** Restore only the service and party size needed to browse after a discarded cart. */
function calendarDraft(
  draft: BookingDraft,
  original: BookingDraft,
): BookingDraft {
  if (draft.mode) return draft;
  return {
    ...draft,
    mode: "guest",
    players: original.players,
    nativeServiceId: original.nativeServiceId,
    nativeServiceName: original.nativeServiceName,
  };
}

/** Resolve a complete, validated rejection index list against its original submission. */
function rejectedSlots(draft: BookingDraft, indices?: number[]) {
  return indices?.length && indices.every((index) => draft.slots[index])
    ? indices.map((index) => draft.slots[index])
    : undefined;
}
const Context = createContext<BookingContextValue | null>(null);
/** Coordinate draft, identity and checkout state across the booking flow. */
export function BookingProvider({
  children,
  bookingService = services.booking,
  identityService = services.customerIdentity,
}: {
  children: ReactNode;
  bookingService?: BookingService;
  identityService?: CustomerIdentityService;
}) {
  const [profileAccessRevision, setProfileAccessRevision] = useState(() =>
    bookingAccessNotice() ? 1 : 0,
  );
  const [profileAccessNotice, setProfileAccessNotice] = useState(() =>
    bookingAccessNotice() === "session"
      ? BOOKING_SESSION_EXPIRED
      : BOOKING_SIGNED_OUT,
  );
  const [profileSaveError, setProfileSaveError] = useState("");
  const profileSave = useRef<{
    controller: AbortController;
    promise: Promise<boolean>;
  } | null>(null);
  useEffect(
    () => () => {
      profileSave.current?.controller.abort();
    },
    [],
  );
  const pathname = usePathname();
  const initialHomeConflict =
    !!pathname &&
    !/\/(?:book\/|confirmation)/.test(pathname) &&
    !!loadPendingConflict();
  const [sessionChoices, setSessionChoices] = useState<SessionChoices>({
    outlet: true,
    session: true,
  });
  const [noticeState, dispatchSelectionNotice] = useState(() => {
    const cutoff =
      bookingService.mode === "live" &&
      !!pathname &&
      /\/(?:book\/|confirmation)/.test(pathname)
        ? loadConflictNotice("cutoff")
        : null;
    if (cutoff !== null) return { message: SESSION_UNAVAILABLE, slots: cutoff };
    const expiry =
      bookingService.mode === "live" && /\/book\/time\/?$/.test(pathname ?? "")
        ? loadConflictNotice("expiry")
        : null;
    if (expiry !== null)
      return { message: PAYMENT_WINDOW_ENDED, slots: expiry };
    const activeCheckout =
      bookingService.mode === "live" && /\/book\/time\/?$/.test(pathname ?? "")
        ? loadConflictNotice("active-checkout")
        : null;
    if (activeCheckout !== null)
      return { message: ACTIVE_CHECKOUT_NOTICE, slots: activeCheckout };
    const noCreation =
      bookingService.mode === "live" && /\/book\/time\/?$/.test(pathname ?? "")
        ? loadConflictNotice("no-creation")
        : null;
    if (noCreation !== null)
      return { message: BOOKING_NOT_CREATED, slots: noCreation };
    const slots =
      bookingService.mode === "live" && !initialHomeConflict
        ? loadConflictNotice()
        : null;
    return {
      message: slots !== null ? CONFLICT_NOTICE : null,
      slots: slots ?? [],
    };
  });
  const router = useRouter();
  const [protectedConflictRedirect, setProtectedConflictRedirect] = useState<
    string | null
  >(null);
  const completedConflict = useRef<string | null>(null);
  const rejectionRead = useRef<AbortController | null>(null);
  const rejectionWork = useRef<{
    key: string;
    promise: Promise<boolean>;
  } | null>(null);
  const [pendingConflict, setPendingConflict] =
    useState<PendingConflict | null>(() =>
      bookingService.mode === "live" && !initialHomeConflict
        ? loadPendingConflict()
        : null,
    );
  const clearPendingConflict = useCallback(() => {
    rejectionRead.current?.abort();
    rejectionRead.current = null;
    savePendingConflict(null);
    setPendingConflict(null);
  }, []);
  const noticeCurrent = useRef(noticeState);
  const selectionNotice = noticeState.message;
  const selectionNoticeSlots = noticeState.slots;
  const noticeRevision = useRef(0);
  const noticeShownOnCalendar = useRef(false);
  const setSelectionNotice = useCallback(
    (notice: string | null, affected: NoticeSlot[] = []) => {
      const slots = affected
        .map(({ date, start }) => ({ date, start }))
        .filter(
          (slot, index, all) =>
            all.findIndex(
              (other) => other.date === slot.date && other.start === slot.start,
            ) === index,
        )
        .slice(-MAX_BOOKING_SESSIONS);
      saveConflictNotice(
        bookingService.mode === "live" && notice === CONFLICT_NOTICE
          ? slots
          : null,
      );
      saveConflictNotice(
        bookingService.mode === "live" && notice === SESSION_UNAVAILABLE
          ? slots
          : null,
        "cutoff",
      );
      saveConflictNotice(
        bookingService.mode === "live" && notice === BOOKING_NOT_CREATED
          ? slots
          : null,
        "no-creation",
      );
      saveConflictNotice(
        bookingService.mode === "live" && notice === PAYMENT_WINDOW_ENDED
          ? slots
          : null,
        "expiry",
      );
      saveConflictNotice(
        bookingService.mode === "live" && notice === ACTIVE_CHECKOUT_NOTICE
          ? slots
          : null,
        "active-checkout",
      );
      if (!notice || noticeCurrent.current.message !== notice)
        noticeShownOnCalendar.current = false;
      noticeCurrent.current = { message: notice, slots };
      dispatchSelectionNotice(noticeCurrent.current);
      return ++noticeRevision.current;
    },
    [bookingService.mode],
  );
  const [suppressedSlots, dispatchSuppressedSlots] = useState<
    BookingDraft["slots"]
  >(() => (bookingService.mode === "live" ? loadSuppressedSlots() : []));
  const suppression = useRef({ slots: suppressedSlots, generation: 0 });
  const setSuppressedSlots = useCallback((slots: BookingDraft["slots"]) => {
    suppression.current = {
      slots,
      generation: suppression.current.generation + 1,
    };
    saveSuppressedSlots(slots);
    dispatchSuppressedSlots(slots);
  }, []);
  const service = useMemo(
    () => defineBookingService(bookingService),
    [bookingService],
  );
  const [value, dispatch] = useReducer(
    (
      _state: StoredBooking & {
        ready: boolean;
        revision: number;
        confirmationRevision: number;
      },
      next: StoredBooking & {
        ready: boolean;
        revision: number;
        confirmationRevision: number;
      },
    ) => next,
    {
      version: 2,
      draft: blankDraft(),
      attempt: null,
      ready: false,
      revision: 0,
      confirmationRevision: 0,
    },
  );
  const latest = useRef(value);
  const [actionState, dispatchAction] = useState<
    ActionState & { owner: BookingService }
  >({ status: "idle", owner: service });
  const setAction = useCallback(
    (next: ActionState) => dispatchAction({ ...next, owner: service }),
    [service],
  );
  const action = useMemo<ActionState>(
    () => (actionState.owner === service ? actionState : { status: "idle" }),
    [actionState, service],
  );
  const visitBookingStep = useCallback(
    (step: string) => {
      if (
        step !== "account" &&
        latest.current.draft.mode &&
        !bookingAccessExpired()
      ) {
        clearBookingAccessNotice();
        setProfileAccessRevision(0);
      }
      if (step === "time") {
        if (
          action.calendarRecovery &&
          value.attempt &&
          !calendarRecoveryNoticeDismissed(value.attempt.id) &&
          (action.unresolvedCheckout ||
            isUnresolvedCheckout(value.attempt.id)) &&
          noticeCurrent.current.message !== CHECKOUT_UNRESOLVED
        ) {
          setSelectionNotice(CHECKOUT_UNRESOLVED, value.attempt.draft.slots);
          if (service.mode === "live")
            saveCalendarRecovery(value.attempt.id, true);
        }
        noticeShownOnCalendar.current = true;
        if (action.returnToCalendar)
          setAction({ ...action, returnToCalendar: false });
      } else if (noticeShownOnCalendar.current) {
        if (action.calendarRecovery && value.attempt)
          dismissCalendarRecoveryNotice(value.attempt.id);
        clearPendingConflict();
        setSelectionNotice(null);
      }
    },
    [
      setSelectionNotice,
      clearPendingConflict,
      action,
      setAction,
      value.attempt,
      service.mode,
    ],
  );
  const [detachedCheckout, setDetachedCheckout] = useState<string | null>(() =>
    bookingService.mode === "live" ? submittedCheckoutId() : null,
  );
  const hostedReturnId = useSyncExternalStore(
    subscribeHostedPaymentEntry,
    hostedPaymentEntry,
    () => null,
  );
  const returningFromHostedPayment =
    !!hostedReturnId && hostedReturnId === submittedCheckoutId();
  const browsingCheckout =
    !!detachedCheckout &&
    !returningFromHostedPayment &&
    !profileAccessRevision &&
    value.attempt?.status !== "paid" &&
    !action.calendarRecovery &&
    !isCalendarRecovery(detachedCheckout) &&
    (value.attempt?.id === detachedCheckout ||
      submittedCheckoutId() === detachedCheckout);
  const active = useRef<BookingRequest | null>(null);
  const pendingSubmission = useRef<{
    request: BookingRequest;
    id: string;
    settled: Promise<void>;
  } | null>(null);
  const [entryChecked, setEntryChecked] = useState<string | null>(null);
  const [requestedEntry, setRequestedEntry] = useState<string | null>(null);
  const entryRead = useRef<AbortController | null>(null);
  const restoredExpiryRead = useRef<AbortController | null>(null);
  const [historyBrowsing, setHistoryBrowsing] = useState(
    () =>
      !!pathname?.includes("/book/") &&
      typeof performance !== "undefined" &&
      (
        performance.getEntriesByType?.("navigation")[0] as
          PerformanceNavigationTiming | undefined
      )?.type === "back_forward",
  );
  const releasedReservation = useRef<string | null>(null);
  const queueRetry = useRef<{ id: string; revision: number } | null>(null);
  const mounted = useRef(false);
  const exitWork = useRef<{
    id: string;
    promise: Promise<boolean>;
    failed: boolean;
  } | null>(null);
  const [rebookingError, setRebookingError] = useState<string | null>(null);
  const finishExit = useCallback(
    (id: string) => {
      if (exitWork.current?.id === id && !exitWork.current.failed)
        return exitWork.current.promise;
      clearIdentityEntry(identityService);
      rememberCompletedExit(id);
      setRebookingError(null);
      const work = { id, failed: false, promise: Promise.resolve(false) };
      exitWork.current = work;
      work.promise = dismissCompletedBooking(id).then(
        () => {
          forgetCompletedExit(id);
          return true;
        },
        () => {
          work.failed = true;
          if (mounted.current && exitWork.current === work)
            setRebookingError(
              "Unable to start a new booking. Please try again. Your confirmed booking is unchanged.",
            );
          return false;
        },
      );
      return work.promise;
    },
    [identityService],
  );
  const [availabilityRevision, invalidateAvailability] = useReducer(
    (revision: number) => revision + 1,
    0,
  );
  const [restoredOwner, setRestoredOwner] = useState<{
    service: BookingService;
    identityService: CustomerIdentityService;
  } | null>(null);
  const restorationPending =
    service.mode === "live" &&
    identityService.mode === "live" &&
    !!service.restore &&
    (restoredOwner?.service !== service ||
      restoredOwner.identityService !== identityService);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    todaySG().slice(0, 7),
  );
  const [calendarThrough, setCalendarThrough] = useState<string>();
  const showMonth = useCallback((month: string, through?: string) => {
    setCalendarMonth(month);
    setCalendarThrough(through);
  }, []);
  const [calendarPaused, pauseCalendar] = useState(false);
  const [browsingRequested, setCalendarBrowsing] = useState(true);
  if (
    protectedConflictRedirect &&
    pathname &&
    /\/(?:book\/)?confirmation\/?$/.test(pathname)
  )
    setProtectedConflictRedirect(null);
  // The route is known before the streamed page mounts. A page effect alone
  // can briefly enable display reads while restoring an editable Review.
  const calendarBrowsing =
    browsingRequested &&
    !!pathname &&
    !/\/(?:book\/(?:details|review|payment|confirmation)|confirmation)\/?$/.test(
      pathname,
    );
  const [date, showDate] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const sessionKey = useCallback(
    () =>
      value.draft.mode === "member"
        ? JSON.stringify(identityService.current())
        : "guest",
    [value.draft.mode, identityService],
  );
  useEffect(() => {
    if (
      service.mode !== "live" ||
      service.operations.availability !== "live" ||
      !service.publicCalendar ||
      restorationPending ||
      !calendarBrowsing ||
      !!value.attempt
    )
      return;
    const controller = new AbortController();
    void customerCatalogueService.read(controller.signal).catch(() => {
      // The booking screen owns the recoverable error; no background retry.
    });
    return () => controller.abort();
  }, [service, restorationPending, calendarBrowsing, value.attempt]);
  const calendar = useCalendarAvailability(
    service,
    value.ready && value.draft.mode ? value.draft.nativeServiceId : undefined,
    calendarMonth,
    JSON.stringify([
      service.publicCalendar ? "public" : sessionKey(),
      availabilityRevision,
    ]),
    !value.ready ||
      restorationPending ||
      !calendarBrowsing ||
      calendarPaused ||
      !!pendingConflict ||
      (!!value.attempt && !action.calendarRecovery && !browsingCheckout),
    calendarThrough,
    now,
    !!pathname && /\/book\//.test(pathname),
  );
  const availability = useBookingAvailability(
    service,
    (value.attempt && !action.calendarRecovery && !browsingCheckout) ||
      !calendarBrowsing ||
      calendarPaused ||
      !!pendingConflict ||
      (service.mode === "live" && !date)
      ? []
      : [
          ...(date ? [date] : []),
          ...(value.ready ? value.draft.slots.map((slot) => slot.date) : []),
        ],
    value.draft.players,
    JSON.stringify([
      availabilityRevision,
      value.draft.mode,
      value.draft.accountEmail,
      value.attempt?.id,
      value.attempt?.status,
    ]),
    Math.floor(now / 60_000),
    sessionKey,
    value.draft.nativeServiceId,
    calendar.cachedDates,
  );
  // Every start is minute-aligned. Also refresh after a suspended/background tab
  // resumes; action/service guards still sample the clock at dispatch time.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      const current = Date.now();
      setNow(current);
      timer = setTimeout(refresh, 60_000 - (current % 60_000));
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const hydrationOwner = useRef({ service, identityService });
  const commit = useCallback(
    (
      next: StoredBooking,
      preserveConfirmation = false,
      preserveOperation = false,
    ) => {
      const state = {
        ...next,
        ready: true,
        revision: latest.current.revision + (preserveOperation ? 0 : 1),
        confirmationRevision:
          latest.current.confirmationRevision + (preserveConfirmation ? 0 : 1),
      };
      latest.current = state;
      if (service.mode === "demo") saveBooking(next);
      else
        saveLiveDraft(
          next.draft,
          next.attempt ? true : undefined,
          next.attempt?.id,
        );
      dispatch(state);
    },
    [service],
  );
  // A Review draft is not a hold. Remove only time-cutoff selections while it
  // remains editable; financial attempts and in-flight writes keep their snapshot.
  useEffect(() => {
    const current = latest.current;
    if (
      !pathname ||
      !/\/book\//.test(pathname) ||
      !current.ready ||
      restorationPending ||
      current.attempt ||
      active.current ||
      pendingConflict ||
      service.mode !== "live"
    )
      return;
    const time = Date.now();
    const cutoff = (slot: BookingDraft["slots"][number]) =>
      slot.native
        ? Date.parse(`${slot.date}T${slot.start}:00+08:00`) - BOOKING_LEAD_MS
        : Infinity;
    const affected = current.draft.slots.filter((slot) => cutoff(slot) < time);
    if (affected.length) {
      const removed = new Set(affected);
      setSelectionNotice(SESSION_UNAVAILABLE, [
        ...(noticeCurrent.current.message === SESSION_UNAVAILABLE
          ? noticeCurrent.current.slots
          : []),
        ...affected,
      ]);
      commit(
        {
          ...current,
          draft: {
            ...current.draft,
            slots: current.draft.slots.filter((slot) => !removed.has(slot)),
            accepted: false,
          },
        },
        true,
      );
      pauseCalendar(false);
      setAction({
        status: "idle",
        returnToCalendar:
          !!pathname &&
          /\/book\/(?:time|details|review|payment)\/?$/.test(pathname),
      });
      return;
    }
    // Four hours exactly is still valid. Catch the first invalid millisecond,
    // including when the normal minute tick lands exactly on that boundary.
    const candidates = [
      ...current.draft.slots,
      ...(calendarBrowsing ? (availability.displayResult?.slots ?? []) : []),
    ];
    const next =
      Math.min(
        ...candidates.map(cutoff).filter((boundary) => boundary >= time),
      ) + 1;
    if (!Number.isFinite(next) || next - time > 60_000) return;
    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.max(1, next - time),
    );
    return () => clearTimeout(timer);
  }, [
    now,
    value.revision,
    restorationPending,
    pendingConflict,
    service,
    pathname,
    action.status,
    calendarBrowsing,
    availability.displayResult,
    commit,
    setAction,
    setSelectionNotice,
  ]);

  /** Clear editable consent without changing a dispatched payment snapshot. */
  const clearReviewConsent = useCallback(() => {
    const current = latest.current;
    if (current.draft.accepted)
      commit(
        { ...current, draft: { ...current.draft, accepted: false } },
        true,
        true,
      );
  }, [commit]);
  const cancel = useCallback(
    (clearConflict = true) => {
      if (clearConflict) {
        completedConflict.current = null;
        clearPendingConflict();
        setProtectedConflictRedirect(null);
      }
      if (mounted.current && !latest.current.attempt) pauseCalendar(false);
      const request = active.current;
      if (!request) return;
      active.current = null;
      request.controller.abort();
      if (mounted.current)
        setAction({
          status: "cancelled",
          operation: request.operation,
          ...(request.operation === "resolve" || request.operation === "check"
            ? {
                error:
                  "The status check was interrupted. Your booking is unchanged.",
              }
            : {}),
        });
    },
    [setAction, clearPendingConflict],
  );
  /** Stop foreground handoff while a submitted checkout finishes under its original ID. */
  const detachCheckout = useCallback(() => {
    const request = active.current;
    if (!request?.submission) {
      cancel();
      return;
    }
    request.submission.detached = true;
    active.current = null;
    setDetachedCheckout(request.submission.id);
    const current = latest.current;
    if (
      current.attempt?.id === request.submission.id &&
      current.attempt.status === "ready"
    )
      commit(
        { ...current, attempt: { ...current.attempt, status: "checking" } },
        true,
        true,
      );
    pauseCalendar(false);
    setAction({ status: "cancelled", operation: "checkout" });
  }, [cancel, commit, setAction]);
  useLayoutEffect(
    () =>
      onProfileAccessLoss((reason) => {
        if (service.mode !== "live" || identityService.mode !== "live") return;
        identityService.invalidate?.();
        clearIdentityEntry(identityService);
        if (!pathname || !/\/(?:book\/|confirmation)/.test(pathname)) return;
        rememberBookingAccessNotice(reason);
        pendingSubmission.current = null;
        cancel(false);
        profileSave.current?.controller.abort();
        profileSave.current = null;
        setProfileSaveError("");
        setSessionChoices({ outlet: true, session: true });
        setProfileAccessNotice(
          reason === "session" ? BOOKING_SESSION_EXPIRED : BOOKING_SIGNED_OUT,
        );
        setProfileAccessRevision((revision) => revision + 1);
        setAction({ status: "idle" });
        // Preserve original financial authority; only the editable profile/draft is reset.
        commit({ ...latest.current, draft: blankDraft() });
        router.replace("/book/account/");
      }),
    [
      service.mode,
      identityService,
      pathname,
      cancel,
      commit,
      router,
      setAction,
    ],
  );
  useLayoutEffect(() => {
    if (
      service.mode === "live" &&
      identityService.mode === "live" &&
      pathname?.startsWith("/book/") &&
      (!latest.current.attempt ||
        isCalendarRecovery(latest.current.attempt.id) ||
        isBookingDeparture(latest.current.attempt.id) ||
        latest.current.attempt.id === submittedCheckoutId()) &&
      bookingAccessExpired()
    )
      reportProfileAccessLoss(profileAccessGeneration(), "session");
  }, [service.mode, identityService.mode, pathname]);
  const previousNoticePath = useRef(pathname);
  const noticeRoute = useEffectEvent(() => {
    if (pathname) clearDepartedBookingHelpNotice(pathname);
    // A full-document departure must dismiss persisted display state too.
    if (pathname && !/\/book\/time\/?$/.test(pathname)) {
      saveConflictNotice(null, "no-creation");
      saveConflictNotice(null, "expiry");
      saveConflictNotice(null, "active-checkout");
      const retained = liveCheckoutAttemptId();
      if (retained && isCalendarRecovery(retained))
        dismissCalendarRecoveryNotice(retained);
    }
    const changed = previousNoticePath.current !== pathname;
    previousNoticePath.current = pathname;
    if (changed) {
      entryRead.current?.abort();
      restoredExpiryRead.current?.abort();
      setRequestedEntry(null);
      setEntryChecked(null);
    }
    if (pathname && !/\/(?:book\/|confirmation)/.test(pathname)) {
      if (changed) {
        setHistoryBrowsing(false);
        detachCheckout();
      }
      const current = latest.current;
      const id = submittedCheckoutId();
      if (id && !isBookingDeparture(id)) {
        const slots =
          current.attempt?.id === id
            ? current.attempt.draft.slots
            : loadLiveDraft().slots;
        markBookingDeparture(id, slots);
        commit({ ...current, draft: blankDraft() });
      }
    }

    if (
      changed &&
      pathname &&
      !/\/book\//.test(pathname) &&
      (noticeShownOnCalendar.current ||
        noticeCurrent.current.message === SESSION_UNAVAILABLE)
    ) {
      if (action.calendarRecovery && value.attempt)
        dismissCalendarRecoveryNotice(value.attempt.id);
      setSelectionNotice(null);
    }
  });
  useEffect(() => {
    noticeRoute();
  }, [pathname]);
  const freshChecks = useRef(
    new WeakMap<BookingService, Map<string, number>>(),
  );
  /** Reuse this tick's authoritative day read without replacing its evidence. */
  const rememberFreshDate = useCallback(
    (date: string, players: number, serviceId?: string) => {
      const entries =
        freshChecks.current.get(service) ?? new Map<string, number>();
      entries.set(
        JSON.stringify([date, players, serviceId, identityService.current()]),
        Date.now(),
      );
      freshChecks.current.set(service, entries);
    },
    [service, identityService],
  );
  /** Classify a rejected checkout before returning with its affected-session notice. */
  const returnRejectedSelection = useCallback(
    (
      draft: BookingDraft,
      indexed?: BookingDraft["slots"][number],
      originalId: string | null = latest.current.attempt?.id ?? null,
      parentSignal?: AbortSignal,
      provenAffected?: BookingDraft["slots"],
      reason?: PendingConflict["reason"],
      stayOnStep = false,
    ): Promise<boolean> => {
      const notice =
        reason === "checkout_already_active"
          ? ACTIVE_CHECKOUT_NOTICE
          : CONFLICT_NOTICE;
      if (parentSignal?.aborted) return Promise.resolve(false);
      /** Withdraw this view's rejection authority without releasing the retained attempt. */
      function observeCancellation(
        promise: Promise<boolean>,
        controller: AbortController,
      ) {
        if (!parentSignal) return promise;
        const abort = () => {
          controller.abort();
          if (rejectionRead.current === controller) {
            rejectionRead.current = null;
            if (mounted.current) {
              setPendingConflict(null);
              setSelectionNotice(null);
            }
          }
        };
        parentSignal.addEventListener("abort", abort, { once: true });
        if (parentSignal.aborted) abort();
        return promise.finally(() =>
          parentSignal.removeEventListener("abort", abort),
        );
      }
      const key = JSON.stringify([
        originalId,
        draft,
        indexed,
        provenAffected,
        reason,
        stayOnStep,
        identityService.current(),
      ]);
      if (
        rejectionWork.current?.key === key &&
        rejectionRead.current &&
        !rejectionRead.current.signal.aborted
      )
        return observeCancellation(
          rejectionWork.current.promise,
          rejectionRead.current,
        );
      const promise = (async () => {
        rejectionRead.current?.abort();
        const controller = new AbortController();
        rejectionRead.current = controller;
        const pending: PendingConflict = {
          attemptId: originalId,
          ...(reason ? { reason } : {}),
          draft,
          ...(indexed
            ? {
                rejectedSessionIndex: draft.slots.findIndex(
                  (slot) => slotKey(slot) === slotKey(indexed),
                ),
              }
            : {}),
        };
        if (service.mode === "live") {
          saveLiveDraft(latest.current.draft, false, originalId);
          savePendingConflict(pending);
        }
        setPendingConflict(pending);
        const identity = JSON.stringify(identityService.current());
        const operation = active.current;
        const originalAttempt = latest.current.attempt;
        // Recovery may classify the immutable old attempt while the customer
        // has already edited the independent draft on an earlier step. During
        // retained recovery those edits do not invalidate the original attempt's
        // proof; ordinary checkout classification still rejects stale draft reads.
        const editableDraft = latest.current.draft;
        const candidates =
          provenAffected ?? (indexed ? [indexed] : draft.slots);
        const existing = suppression.current.slots;
        setSuppressedSlots([
          ...existing.filter(
            (slot) =>
              !candidates.some((candidate) => overlaps(slot, candidate)),
          ),
          ...candidates,
        ]);
        const generation = suppression.current.generation;
        pauseCalendar(false);
        const showRecoveryNotice =
          !action.calendarRecovery || noticeShownOnCalendar.current;
        const noticeGeneration = showRecoveryNotice
          ? setSelectionNotice(
              notice,
              provenAffected ?? (indexed ? [indexed] : []),
            )
          : noticeRevision.current;
        const isCurrent = () =>
          !controller.signal.aborted &&
          rejectionRead.current === controller &&
          suppression.current.generation === generation &&
          mounted.current &&
          latest.current.attempt === originalAttempt &&
          active.current === operation &&
          ((action.calendarRecovery && originalAttempt !== null) ||
            (latest.current.draft.mode === editableDraft.mode &&
              latest.current.draft.nativeServiceId ===
                editableDraft.nativeServiceId &&
              latest.current.draft.players === editableDraft.players)) &&
          JSON.stringify(identityService.current()) === identity;
        // A protected pre-dispatch proof already identifies the affected rows.
        // Provider cooldown must not turn that known rejection into a foreground
        // availability wait; unclassified survivors retain normal freshness guards.
        const read = await (provenAffected
          ? Promise.resolve({
              dates: [] as string[],
              results: [] as PromiseFulfilledResult<
                Awaited<ReturnType<BookingService["availability"]>>
              >[],
              unavailable: provenAffected,
            })
          : readConflictSelections(
              service,
              draft,
              controller.signal,
              isCurrent,
            ));
        if (!read || !isCurrent()) return false;
        const affected = indexed
          ? [
              indexed,
              ...read.unavailable.filter(
                (slot) => slotKey(slot) !== slotKey(indexed),
              ),
            ]
          : read.unavailable;
        for (const [index, result] of read.results.entries()) {
          if (result.status === "fulfilled") {
            const offers = result.value.filter((slot) => slot.available);
            rememberFreshDate(
              read.dates[index],
              draft.players,
              draft.nativeServiceId,
            );
            calendar.reconcile(read.dates[index], offers.length > 0, offers);
          }
        }
        // Only this request's provisional windows can be released here. Older
        // quarantines and failed reads remain for the regular fresh-read loop.
        const available = candidates.filter((slot) => {
          const result = read.results[read.dates.indexOf(slot.date)];
          return (
            result?.status === "fulfilled" &&
            result.value.some(
              (offer) =>
                offer.available &&
                sessionOfferKey(offer) === sessionOfferKey(slot) &&
                sessionPrice(offer) === sessionPrice(slot),
            )
          );
        });
        setSuppressedSlots(
          suppression.current.slots.filter(
            (slot) =>
              !available.some(
                (released) => slotKey(released) === slotKey(slot),
              ),
          ),
        );
        commit({
          ...latest.current,
          attempt: null,
          draft: {
            ...latest.current.draft,
            accepted: false,
            slots: latest.current.draft.slots.filter(
              (slot) =>
                !affected.some(
                  (rejected) => slotKey(rejected) === slotKey(slot),
                ),
            ),
          },
        });
        if (service.mode === "live") saveLiveDraft(latest.current.draft, false);
        if (showRecoveryNotice && noticeRevision.current === noticeGeneration)
          setSelectionNotice(notice, affected);
        rejectionRead.current = null;
        completedConflict.current = originalId;
        savePendingConflict(null);
        setPendingConflict(null);
        setAction({
          status: "idle",
          returnToCalendar: !stayOnStep && !action.calendarRecovery,
        });
        return true;
      })();
      const work = { key, promise };
      rejectionWork.current = work;
      const finished = () => {
        if (rejectionWork.current === work) rejectionWork.current = null;
      };
      void promise.then(finished, finished);
      return observeCancellation(promise, rejectionRead.current!);
    },
    [
      service,
      identityService,
      calendar,
      action.calendarRecovery,
      setSuppressedSlots,
      commit,
      setAction,
      rememberFreshDate,
      setSelectionNotice,
    ],
  );
  /** Apply an authenticated no-effects rejection only to its original tab attempt. */
  const rejectRecoveredSelection = useCallback(
    async (
      id: string,
      rejection: CheckoutSelectionRejection,
      signal?: AbortSignal,
    ) => {
      if (signal?.aborted) return false;
      const current = latest.current;
      if (
        active.current ||
        service.mode !== "live" ||
        liveCheckoutAttemptId() !== id ||
        (current.attempt &&
          (current.attempt.id !== id || current.attempt.status === "paid"))
      )
        return false;
      if (completedConflict.current === id && !current.attempt) return true;
      const pending = loadPendingConflict();
      if (!current.attempt && !pending && !mayRestoreLiveCheckout(id))
        return false;
      const draft =
        pending?.attemptId === id
          ? pending.draft
          : (current.attempt?.draft ?? current.draft);
      const indexed =
        rejection.state === "selection_unavailable"
          ? pending?.attemptId === id || current.attempt?.id === id
            ? draft.slots[rejection.rejectedSessionIndex ?? -1]
            : undefined
          : undefined;
      const indices =
        rejection.state === "selection_unavailable"
          ? rejection.rejectedSessionIndices
          : undefined;
      const provenAffected = rejectedSlots(draft, indices);
      return returnRejectedSelection(
        draft,
        indexed,
        id,
        signal,
        provenAffected,
      );
    },
    [service, returnRejectedSelection],
  );
  /** Clear only the owned attempt after authenticated terminal no-creation proof. */
  const resolveUncreatedBooking = useCallback(
    (
      id: string,
      sessions?: CheckoutContext["summary"]["sessions"],
      stayOnStep = false,
    ) => {
      const current = latest.current;
      if (
        service.mode !== "live" ||
        liveCheckoutAttemptId() !== id ||
        (current.attempt &&
          (current.attempt.id !== id || current.attempt.status === "paid"))
      )
        return false;
      const left = isBookingDeparture(id);
      const originalSlots = current.attempt?.draft.slots.length
        ? current.attempt.draft.slots
        : left
          ? loadDepartureSlots(id)
          : current.draft.slots;
      // Non-creation releases this attempt, not provider capacity. Calendar
      // recovery may already have restored an original time through a fresh
      // availability read; preserve any deliberate selection of that time.
      const hiddenOriginals =
        action.calendarRecovery &&
        (action.unresolvedCheckout || isUnresolvedCheckout(id))
          ? originalSlots.filter((original) =>
              suppression.current.slots.some((slot) =>
                overlaps(slot, original),
              ),
            )
          : originalSlots;
      setSuppressedSlots([
        ...suppression.current.slots.filter(
          (slot) => !originalSlots.some((original) => overlaps(slot, original)),
        ),
        ...hiddenOriginals,
      ]);
      freshChecks.current.delete(service);
      const draft = left
        ? blankDraft()
        : {
            ...current.draft,
            slots:
              stayOnStep || action.calendarRecovery || browsingCheckout
                ? current.draft.slots.filter(
                    (slot) =>
                      !hiddenOriginals.some(
                        (original) => slotKey(original) === slotKey(slot),
                      ),
                  )
                : [],
            accepted: false,
          };
      cancel();
      commit({ ...current, draft, attempt: null });
      saveLiveDraft(draft, false, null);
      setAction({
        status: "idle",
        returnToCalendar: !stayOnStep && !left && !action.calendarRecovery,
      });
      const notice =
        left || (action.calendarRecovery && !noticeShownOnCalendar.current)
          ? null
          : BOOKING_NOT_CREATED;
      const noticeSlots = sessions
        ? sessions.map(({ startMs }) => {
            const instant = new Date(startMs);
            return {
              date: todaySG(instant),
              start: new Intl.DateTimeFormat("en-GB", {
                timeZone: "Asia/Singapore",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
              }).format(instant),
            };
          })
        : originalSlots;
      setSelectionNotice(notice, notice ? noticeSlots : []);
      pauseCalendar(false);
      return true;
    },
    [
      service,
      action.calendarRecovery,
      action.unresolvedCheckout,
      browsingCheckout,
      cancel,
      commit,
      setAction,
      setSelectionNotice,
      setSuppressedSlots,
    ],
  );
  const [accessRevision, observeAccess] = useReducer(
    (revision: number) => revision + 1,
    0,
  );
  useLayoutEffect(
    () =>
      onBookingAccessEstablished((newOwner) => {
        if (service.mode !== "live" || identityService.mode !== "live") return;
        if (newOwner && (latest.current.attempt || liveCheckoutAttemptId())) {
          // HTTP 201 explicitly creates a different guest owner. Only discard this tab's correlation.
          cancel();
          pendingSubmission.current = null;
          setDetachedCheckout(null);
          pauseCalendar(false);
          commit({ ...latest.current, attempt: null, draft: blankDraft() });
          saveLiveDraft(blankDraft(), false, null);
        }
        setEntryChecked(null);
        observeAccess();
      }),
    [service.mode, identityService.mode, cancel, commit],
  );
  const paymentEntry = /\/book\/payment\/?$/.test(pathname ?? "");
  const entryId =
    liveCheckoutAttemptId() ?? (browsingCheckout ? value.attempt?.id : null);
  const needsEntryCheck =
    service.mode === "live" &&
    !!entryId &&
    !!pathname?.includes("/book/") &&
    !bookingAccessExpired() &&
    !profileAccessRevision &&
    !pendingConflict &&
    (requestedEntry === pathname ||
      (!historyBrowsing &&
        isBookingDeparture(entryId) &&
        mayRestoreLiveCheckout(entryId) &&
        (!isCalendarRecovery(entryId) ||
          /\/book\/account\/?$/.test(pathname))) ||
      (returningFromHostedPayment &&
        !restorationPending &&
        !paymentLocked(value.attempt)) ||
      (paymentEntry &&
        browsingCheckout &&
        !restorationPending &&
        !paymentLocked(value.attempt))) &&
    entryChecked !== pathname;
  /** Reopen the submitted attempt only on a deliberate booking action. */
  function resumeSubmittedCheckout() {
    if (!browsingCheckout || !entryId || !pathname) return;
    if (bookingAccessExpired()) {
      reportProfileAccessLoss(profileAccessGeneration(), "session");
      return;
    }
    setEntryChecked(null);
    setRequestedEntry(pathname);
  }
  const recoverEntry = useEffectEvent(
    (id: string, path: string, controller: AbortController) => {
      const generation = profileAccessGeneration();
      const current = () =>
        !controller.signal.aborted &&
        generation === profileAccessGeneration() &&
        (liveCheckoutAttemptId() ?? latest.current.attempt?.id) === id;
      const recover = async () => {
        const pending = pendingSubmission.current;
        const read = () =>
          conflictRead(
            (signal) =>
              protectedCheckoutService.context({
                attemptId: id,
                mode: "live",
                signal,
              }),
            controller.signal,
          );
        let context: CheckoutContext;
        try {
          context = await read();
        } catch (error) {
          // The original write can still be queued before its first durable claim.
          // If evidence already exists (including a saved link), use it immediately.
          if (!(
            error instanceof ConfirmationError &&
            error.kind === "missing" &&
            pending?.id === id
          ))
            throw error;
          await pending.settled;
          if (!current()) return;
          context = await read();
        }
        if (!current() || context.attemptId !== id) return;
        if (context.creationResolution) {
          resolveUncreatedBooking(id, context.summary.sessions);
          return;
        }
        if (context.selectionRejection) {
          const original =
            latest.current.attempt?.id === id
              ? latest.current.attempt.draft.slots
              : loadDepartureSlots(id);
          const same =
            original.length === context.summary.sessions.length &&
            context.summary.players === latest.current.attempt?.draft.players &&
            original.every(
              (slot, i) =>
                Date.parse(`${slot.date}T${slot.start}:00+08:00`) ===
                context.summary.sessions[i].startMs,
            );
          const rejection =
            same && latest.current.attempt?.id === id
              ? context.selectionRejection
              : { state: context.selectionRejection.state };
          setEntryChecked(path);
          // The entry loader ends as classification starts. Navigation can still cancel its reads.
          const classification = new AbortController();
          entryRead.current = classification;
          try {
            await rejectRecoveredSelection(
              id,
              rejection,
              classification.signal,
            );
          } finally {
            if (entryRead.current === classification) entryRead.current = null;
          }
          return;
        }
        if (
          !submittedCheckoutId() &&
          (hasSeenConfirmation(id) || completedPaymentReturn(id))
        )
          return;
        // This existing route handles unpaid links, incomplete creation, paid evidence and receipts.
        // It performs its own protected checks and never creates a replacement checkout.
        setProtectedConflictRedirect(id);
        router.replace(`/confirmation/?attempt=${encodeURIComponent(id)}`);
      };
      void recover()
        .catch((error: unknown) => {
          if (!current() || (submittedCheckoutId() !== id && !browsingCheckout))
            return;
          if (error instanceof ConfirmationError && error.kind === "denied") {
            reportProfileAccessLoss(generation, "session");
            return;
          }
          // The protected screen owns bounded retry, missing-attempt privacy and support.
          setProtectedConflictRedirect(id);
          router.replace(`/confirmation/?attempt=${encodeURIComponent(id)}`);
        })
        .finally(() => {
          if (!controller.signal.aborted) setEntryChecked(path);
        });
    },
  );
  useEffect(() => {
    if (!needsEntryCheck || !entryId || !pathname) return;
    const controller = new AbortController();
    entryRead.current = controller;
    recoverEntry(entryId, pathname, controller);
    return () => {
      controller.abort();
      if (entryRead.current === controller) entryRead.current = null;
    };
  }, [
    entryId,
    accessRevision,
    needsEntryCheck,
    pathname,
    service,
    identityService,
  ]);
  /** Revalidate a persisted conflict against its original protected attempt before classification. */
  const recoverPendingConflict = useEffectEvent(
    async (
      pending: PendingConflict,
      parent: AbortSignal,
      restoredAttempt: StoredBooking["attempt"] = null,
    ) => {
      if (pending.attemptId === null)
        return returnRejectedSelection(
          pending.draft,
          undefined,
          null,
          parent,
          undefined,
          pending.reason,
        );
      const controller = new AbortController();
      rejectionRead.current?.abort();
      rejectionRead.current = controller;
      const abort = () => controller.abort();
      parent.addEventListener("abort", abort, { once: true });
      const protectedFallback = () => {
        if (
          controller.signal.aborted ||
          !mounted.current ||
          liveCheckoutAttemptId() !== pending.attemptId
        )
          return false;
        if (restoredAttempt?.id === pending.attemptId)
          commit(
            {
              ...latest.current,
              draft: restoredAttempt.draft,
              attempt: restoredAttempt,
            },
            true,
          );
        saveLiveDraft(latest.current.draft, true, pending.attemptId);
        clearPendingConflict();
        setSelectionNotice(null);
        setProtectedConflictRedirect(pending.attemptId);
        router.replace(
          `/confirmation/?attempt=${encodeURIComponent(pending.attemptId!)}`,
        );
        return false;
      };
      try {
        while (
          !controller.signal.aborted &&
          mounted.current &&
          loadPendingConflict()?.attemptId === pending.attemptId
        ) {
          try {
            const context = await conflictRead(
              (signal) =>
                protectedCheckoutService.context({
                  attemptId: pending.attemptId!,
                  mode: "live",
                  signal,
                }),
              controller.signal,
            );
            if (
              controller.signal.aborted ||
              !mounted.current ||
              liveCheckoutAttemptId() !== pending.attemptId ||
              JSON.stringify(loadPendingConflict()) !== JSON.stringify(pending)
            )
              return false;
            if (context.creationResolution)
              return resolveUncreatedBooking(
                pending.attemptId,
                context.summary.sessions,
              );
            if (context.selectionRejection) {
              const sameSnapshot =
                context.summary.sessions.length ===
                  pending.draft.slots.length &&
                context.summary.sessions.every(
                  (session, index) =>
                    session.players === pending.draft.players &&
                    session.startMs ===
                      Date.parse(
                        `${pending.draft.slots[index].date}T${pending.draft.slots[index].start}:00+08:00`,
                      ),
                );
              // A browser snapshot cannot decide which authenticated original index was rejected.
              const rejection = sameSnapshot
                ? context.selectionRejection
                : { state: context.selectionRejection.state };
              return rejectRecoveredSelection(pending.attemptId, rejection);
            }
            // The original server state supersedes a stale display marker. Preserve its
            // financial authority; ordinary restoration/confirmation owns that state.
            return protectedFallback();
          } catch (error) {
            if (controller.signal.aborted) return false;
            if (error instanceof ConfirmationError && error.kind === "denied")
              return protectedFallback();
            await waitForConflictRead(
              controller.signal,
              error instanceof ConfirmationError
                ? error.nextCheckMs
                : undefined,
            );
          }
        }
        return false;
      } finally {
        parent.removeEventListener("abort", abort);
      }
    },
  );
  /** Rebuild only the editable cart after server-confirmed unpaid release. */
  const restartReleasedReservation = useCallback(
    (id: string, recoveredSlots?: BookingDraft["slots"]) => {
      if (releasedReservation.current === id) return;
      releasedReservation.current = id;
      const noticeDismissed = calendarRecoveryNoticeDismissed(id);
      // Reads made while the original attempt was locked cannot release slots.
      freshChecks.current.delete(service);
      cancel();
      const previousSlots =
        recoveredSlots ??
        (latest.current.attempt?.id === id
          ? latest.current.attempt.draft.slots
          : latest.current.draft.slots);
      const nextDraft = {
        ...latest.current.draft,
        accepted: false,
        slots: latest.current.draft.slots.filter(
          (slot) =>
            !previousSlots.some(
              (expired) => slotKey(expired) === slotKey(slot),
            ),
        ),
      };
      setSuppressedSlots([
        ...suppressedSlots.filter(
          (slot) => !previousSlots.some((expired) => overlaps(slot, expired)),
        ),
        ...previousSlots,
      ]);
      setRestoredOwner({ service, identityService });
      commit({ ...latest.current, attempt: null, draft: nextDraft });
      if (service.mode === "live") saveLiveDraft(nextDraft, false, null);
      setAction({
        status: "idle",
        returnToCalendar: !recoveredSlots && !action.calendarRecovery,
      });
      pauseCalendar(false);
      if (
        !noticeDismissed &&
        (!recoveredSlots ||
          /\/book\/time\/?$/.test(previousNoticePath.current ?? "")) &&
        (!action.calendarRecovery || noticeShownOnCalendar.current)
      )
        setSelectionNotice(PAYMENT_WINDOW_ENDED, previousSlots);
    },
    [
      action.calendarRecovery,
      cancel,
      commit,
      identityService,
      service,
      setAction,
      setSuppressedSlots,
      suppressedSlots,
      setSelectionNotice,
    ],
  );
  const recoverRejectedTab = useEffectEvent(
    async (id: string, controller: AbortController) => {
      const expiryRead = isCalendarRecovery(id) ? new AbortController() : null;
      if (expiryRead) restoredExpiryRead.current = expiryRead;
      const signal = expiryRead
        ? AbortSignal.any([controller.signal, expiryRead.signal])
        : controller.signal;
      const generation = profileAccessGeneration();
      const ownsExpiry = () =>
        !signal.aborted &&
        profileAccessGeneration() === generation &&
        liveCheckoutAttemptId() === id &&
        isCalendarRecovery(id) &&
        !latest.current.attempt &&
        !active.current;
      try {
        const context = await conflictRead(
          (signal) =>
            protectedCheckoutService.context({
              attemptId: id,
              mode: "live",
              signal,
            }),
          signal,
        );
        if (context.attemptId !== id || signal.aborted) return;
        if (
          expiryRead &&
          context.expired &&
          !context.payment &&
          !context.confirmation &&
          !context.customerConfirmation &&
          ownsExpiry()
        ) {
          // Current excludes an archived grant. Replaying the protected release checks
          // both active and archived grants, including any intervening payment.
          await conflictRead(
            (readSignal) => expireBooking(id, readSignal),
            signal,
          );
          if (!ownsExpiry()) return;
          const starts = new Set(
            context.summary.sessions.map((session) => session.startMs),
          );
          const slots = new Map<string, BookingDraft["slots"][number]>();
          for (const slot of [
            ...loadDepartureSlots(id),
            ...suppression.current.slots,
            ...latest.current.draft.slots,
          ]) {
            if (starts.has(Date.parse(`${slot.date}T${slot.start}:00+08:00`)))
              slots.set(slotKey(slot), slot);
          }
          restartReleasedReservation(id, [...slots.values()]);
          return;
        }
        if (
          !controller.signal.aborted &&
          (context.selectionRejection || context.creationResolution) &&
          liveCheckoutAttemptId() === id
        )
          if (context.creationResolution)
            resolveUncreatedBooking(id, context.summary.sessions);
          else if (context.selectionRejection) {
            const original =
              latest.current.attempt?.id === id
                ? latest.current.attempt.draft
                : latest.current.draft;
            const sameSnapshot =
              context.summary.sessions.length === original.slots.length &&
              context.summary.sessions.every(
                (session, index) =>
                  session.players === original.players &&
                  session.startMs ===
                    Date.parse(
                      `${original.slots[index].date}T${original.slots[index].start}:00+08:00`,
                    ),
              );
            // A lost-response read must not apply old indexes to an edited draft.
            if (sameSnapshot)
              await rejectRecoveredSelection(id, context.selectionRejection);
          }
      } catch {
        /* Unknown reads cannot discard a pending attempt. */
      } finally {
        if (restoredExpiryRead.current === expiryRead)
          restoredExpiryRead.current = null;
      }
    },
  );
  const clearDepartedConflict = useEffectEvent(() => {
    if (pathname && !/\/(?:book\/|confirmation)/.test(pathname))
      saveConflictNotice(null, "cutoff");
    if (
      pathname &&
      !/\/(?:book\/|confirmation)/.test(pathname) &&
      loadPendingConflict()
    ) {
      savePendingConflict(null);
      saveConflictNotice(null);
    }
  });
  const restoreMatchedCheckout = useEffectEvent(
    (attempt: NonNullable<StoredBooking["attempt"]>) => {
      // On refresh, let Payment resume its protected context and confirmation reads in place.
      if (
        paymentEntry &&
        paymentLocked(attempt) &&
        submittedCheckoutId() === attempt.id
      )
        setDetachedCheckout(null);
      commit({ version: 2, draft: attempt.draft, attempt }, true);
    },
  );
  useEffect(() => {
    mounted.current = true;
    const sameSession =
      hydrationOwner.current.service === service &&
      hydrationOwner.current.identityService === identityService;
    hydrationOwner.current = { service, identityService };
    // Hydration and read-only restoration do not change the cookie identity.
    // Actual session/booking actions retain protected-read invalidation.
    commit(
      service.mode === "demo"
        ? loadBooking()
        : { version: 2, draft: loadLiveDraft(), attempt: null },
      sameSession,
    );
    // A direct Home load is a deliberate presentation departure, not permission
    // to discard the original server-owned attempt or redirect back into recovery.
    clearDepartedConflict();
    const controller = new AbortController();
    const revision = latest.current.revision;
    const exiting = service.mode === "live" ? completedExitIntent() : null;
    if (exiting) void finishExit(exiting);
    let restoredAttempt: StoredBooking["attempt"] = null;
    if (
      service.mode === "live" &&
      identityService.mode === "live" &&
      service.restore
    ) {
      const restore = () =>
        loadPendingConflict() || submittedCheckoutId()
          ? conflictRead(
              (signal) => service.restore!(signal),
              controller.signal,
            )
          : service.restore!(controller.signal);
      const restoration = identitySignOutTask(identityService)
        ? waitForIdentitySignOut(identityService, controller.signal).then(
            restore,
          )
        : restore();
      void restoration
        .then(
          (attempt) => {
            restoredAttempt = attempt;
            if (loadPendingConflict()) return;
            if (
              attempt &&
              attempt.id !== exiting &&
              !controller.signal.aborted &&
              mounted.current &&
              latest.current.revision === revision &&
              !active.current
            ) {
              const draft = latest.current.draft;
              const sameSelections =
                draft.players === attempt.draft.players &&
                draft.nativeServiceId === attempt.draft.nativeServiceId &&
                draft.slots.length === attempt.draft.slots.length &&
                draft.slots.every((slot) =>
                  attempt.draft.slots.some(
                    (other) =>
                      sessionOfferKey(slot) === sessionOfferKey(other) &&
                      sessionPrice(slot) === sessionPrice(other),
                  ),
                );
              if (
                isBookingDeparture(attempt.id) &&
                !isCalendarRecovery(attempt.id)
              ) {
                commit({ version: 2, draft, attempt }, true);
              } else if (
                mayRestoreLiveCheckout(attempt.id) &&
                completedPaymentReturn(attempt.id)
              ) {
                clearCalendarRecovery(attempt.id);
                commit({ version: 2, draft: attempt.draft, attempt }, true);
                setAction({ status: "idle" });
              } else if (isCalendarRecovery(attempt.id)) {
                commit(
                  {
                    version: 2,
                    draft: calendarDraft(draft, attempt.draft),
                    attempt,
                  },
                  true,
                );
                if (!calendarRecoveryNoticeDismissed(attempt.id))
                  setSelectionNotice(
                    isUnresolvedCheckout(attempt.id)
                      ? CHECKOUT_UNRESOLVED
                      : PAYMENT_WINDOW_ENDED,
                    attempt.draft.slots,
                  );
                setAction({
                  status: "idle",
                  returnToCalendar: !calendarRecoveryNoticeDismissed(
                    attempt.id,
                  ),
                  calendarRecovery: true,
                  unresolvedCheckout: isUnresolvedCheckout(attempt.id),
                });
              } else if (
                !mayRestoreLiveCheckout(attempt.id) ||
                (draft.slots.length > 0 && !sameSelections)
              ) {
                // A foreign checkout is not a new conflict. Preserve any saved
                // notice without resurrecting one after the calendar was left.
                setAction({
                  status: "idle",
                  returnToCalendar: true,
                });
              } else restoreMatchedCheckout(attempt);
            }
          },
          () => {
            /* A failed protected read cannot restore private state. */
          },
        )
        .finally(async () => {
          if (!controller.signal.aborted) {
            const pending = loadPendingConflict();
            if (pending)
              await recoverPendingConflict(
                pending,
                controller.signal,
                restoredAttempt,
              );
            const id = liveCheckoutAttemptId();
            if (
              !pending &&
              id &&
              (mayRestoreLiveCheckout(id) || isBookingDeparture(id)) &&
              !latest.current.attempt
            )
              await recoverRejectedTab(id, controller);
            if (!controller.signal.aborted)
              setRestoredOwner({ service, identityService });
          }
        });
    } else {
      const pending = loadPendingConflict();
      if (service.mode === "live" && pending)
        void recoverPendingConflict(pending, controller.signal);
    }
    return () => {
      controller.abort();
      rejectionRead.current?.abort();
      mounted.current = false;
      cancel(false);
    };
  }, [
    commit,
    cancel,
    service,
    identityService,
    finishExit,
    setAction,
    setSelectionNotice,
    setSuppressedSlots,
  ]);
  useEffect(() => {
    const resume = (event: PageTransitionEvent) => {
      // Browser Back may restore this document with its handoff loader intact.
      // Release that UI operation so the retained attempt routes to recovery;
      // never start another checkout or discard its identity.
      if (event.persisted && active.current?.operation === "checkout") {
        detachCheckout();
        setEntryChecked(null);
      }
    };
    const leaving = () => {
      entryRead.current?.abort();
      restoredExpiryRead.current?.abort();
      setRequestedEntry(null);
      if (
        active.current?.submission ||
        (active.current?.operation === "checkout" && !latest.current.attempt)
      )
        detachCheckout();
    };
    const traverseHistory = () => {
      leaving();
      if (active.current?.operation === "checkout") detachCheckout();
      // The Home hero creates a same-URL history entry while its animation runs.
      // Back there cancels only that entry; the next Book click is still deliberate.
      const bookingRoute = /\/(?:book\/|confirmation)/;
      setHistoryBrowsing(
        bookingRoute.test(previousNoticePath.current ?? "") ||
          bookingRoute.test(window.location.pathname),
      );
      setProtectedConflictRedirect(null);
      const id = submittedCheckoutId();
      if (id) setDetachedCheckout(id);
    };
    window.addEventListener("popstate", traverseHistory);
    window.addEventListener("pagehide", leaving);
    window.addEventListener("pageshow", resume);
    return () => {
      window.removeEventListener("popstate", traverseHistory);
      window.removeEventListener("pagehide", leaving);
      window.removeEventListener("pageshow", resume);
    };
  }, [detachCheckout]);
  // Fresh availability can restore pre-link creation recovery's display while
  // its original financial attempt stays locked. Issued-link expiry retains
  // suppression until authoritative release; warm caches cannot restore either.
  const { reconcile } = calendar;
  const retainedAttempt = value.attempt;
  const creationRecovery =
    service.mode === "live" &&
    action.calendarRecovery &&
    !!retainedAttempt &&
    (action.unresolvedCheckout || isUnresolvedCheckout(retainedAttempt.id));
  useEffect(() => {
    if (
      !value.ready ||
      restorationPending ||
      pendingConflict ||
      !calendarBrowsing ||
      !suppressedSlots.length
    )
      return;
    const controller = new AbortController();
    const generation = suppression.current.generation;
    const noticeGeneration = noticeRevision.current;
    const identity = JSON.stringify(identityService.current());
    const mode = value.draft.mode;
    const dates = [...new Set(suppressedSlots.map((slot) => slot.date))].filter(
      (date) => {
        const checked = freshChecks.current
          .get(service)
          ?.get(
            JSON.stringify([
              date,
              value.draft.players,
              value.draft.nativeServiceId,
              identityService.current(),
            ]),
          );
        return checked === undefined || checked < now;
      },
    );
    if (!dates.length) return;
    void Promise.allSettled(
      dates.map((date) =>
        service.availability({
          date,
          players: value.draft.players,
          serviceId: value.draft.nativeServiceId,
          fresh: true,
          signal: controller.signal,
        }),
      ),
    ).then((results) => {
      if (
        controller.signal.aborted ||
        !mounted.current ||
        suppression.current.generation !== generation ||
        latest.current.attempt !== retainedAttempt ||
        active.current ||
        latest.current.draft.mode !== mode ||
        latest.current.draft.players !== value.draft.players ||
        latest.current.draft.nativeServiceId !== value.draft.nativeServiceId ||
        JSON.stringify(identityService.current()) !== identity
      )
        return;
      for (const [index, result] of results.entries()) {
        if (result.status === "fulfilled") {
          const available = result.value.filter((offer) => offer.available);
          rememberFreshDate(
            dates[index],
            value.draft.players,
            value.draft.nativeServiceId,
          );
          reconcile(dates[index], available.length > 0, available);
        }
      }
      const remaining = suppressedSlots.filter((slot) => {
        if (
          !creationRecovery &&
          retainedAttempt?.draft.slots.some((held) => overlaps(slot, held))
        )
          return true;
        const result = results[dates.indexOf(slot.date)];
        return (
          !result ||
          result.status !== "fulfilled" ||
          !result.value.some(
            (offer) =>
              offer.available &&
              slotKey(offer) === slotKey(slot) &&
              selectionErrors([offer], Date.now()).length === 0,
          )
        );
      });
      // Unknown-index conflicts keep candidates in the cart until a successful
      // read classifies them; a failed read never removes a selection.
      const unavailable = suppressedSlots.filter((slot) => {
        const result = results[dates.indexOf(slot.date)];
        return (
          result?.status === "fulfilled" &&
          !result.value.some(
            (offer) =>
              offer.available &&
              sessionOfferKey(offer) === sessionOfferKey(slot) &&
              sessionPrice(offer) === sessionPrice(slot),
          )
        );
      });
      if (
        noticeRevision.current === noticeGeneration &&
        noticeCurrent.current.message === CONFLICT_NOTICE
      ) {
        const newlyAffected = unavailable.filter((slot) =>
          latest.current.draft.slots.some(
            (selected) => slotKey(selected) === slotKey(slot),
          ),
        );
        if (newlyAffected.length)
          setSelectionNotice(CONFLICT_NOTICE, [
            ...noticeCurrent.current.slots,
            ...newlyAffected,
          ]);
      }
      const nextSlots = latest.current.draft.slots.filter(
        (slot) =>
          !unavailable.some((hidden) => slotKey(hidden) === slotKey(slot)),
      );
      if (nextSlots.length !== latest.current.draft.slots.length) {
        commit(
          {
            ...latest.current,
            draft: {
              ...latest.current.draft,
              accepted: false,
              slots: nextSlots,
            },
          },
          true,
        );
      }
      if (remaining.length !== suppressedSlots.length)
        setSuppressedSlots(remaining);
    });
    return () => controller.abort();
  }, [
    setSelectionNotice,
    service,
    value.ready,
    value.draft.players,
    value.draft.nativeServiceId,
    value.draft.mode,
    restorationPending,
    calendarBrowsing,
    creationRecovery,
    suppressedSlots,
    pendingConflict,
    retainedAttempt,
    commit,
    rememberFreshDate,
    identityService,
    now,
    reconcile,
    setSuppressedSlots,
  ]);
  const run = useCallback(
    async (
      operation: Action,
      outcome: Outcome = "success",
      botToken?: string,
    ) => {
      if (
        pendingConflict ||
        protectedConflictRedirect ||
        (browsingCheckout &&
          ["reserve", "checkout", "pay"].includes(operation)) ||
        (action.calendarRecovery &&
          latest.current.attempt &&
          (["reserve", "checkout", "pay"].includes(operation) ||
            (operation === "review" &&
              (action.unresolvedCheckout ||
                isUnresolvedCheckout(latest.current.attempt.id))))) ||
        active.current ||
        !mounted.current ||
        !latest.current.ready
      )
        return false;
      let current = latest.current;
      if (
        ["checkout", "reserve", "review"].includes(operation) &&
        current.draft.slots.some((slot) =>
          suppression.current.slots.some((hidden) => overlaps(slot, hidden)),
        )
      )
        return false;
      if (
        operation !== "checkout" &&
        operation !== "reserve" &&
        operation !== "review" &&
        !current.attempt
      )
        return false;
      // Review uses the editable replacement draft while retaining the original financial attempt.
      if (operation === "review" && action.calendarRecovery && current.attempt)
        return selectionErrors(current.draft.slots, Date.now()).length === 0;
      if (
        operation === "checkout" &&
        submittedCheckoutId() &&
        !current.attempt?.held &&
        !queueRetry.current
      )
        return false;
      const request: BookingRequest = {
        controller: new AbortController(),
        operation,
      };
      let checkoutNavigationStarted = false;
      let holdDispatched = false;
      active.current = request; // Synchronous guard also catches same-turn double clicks.
      setAction({ status: "loading", operation });
      if (operation === "reserve" || operation === "checkout")
        pauseCalendar(true);
      const identity = () =>
        current.draft.mode === "member" ? identityService.current() : null;
      const accessGeneration = profileAccessGeneration();
      const session = identity();
      const sessionKey = JSON.stringify(session);
      const isCurrent = () =>
        mounted.current &&
        active.current === request &&
        !request.controller.signal.aborted &&
        latest.current.revision === current.revision;
      try {
        if (
          service.mode === "live" &&
          exitWork.current &&
          (operation === "reserve" || operation === "checkout")
        ) {
          const finished = await finishExit(exitWork.current.id);
          if (!isCurrent()) return false;
          if (!finished)
            throw new BookingServiceError(
              "temporarily_unavailable",
              "Unable to start a new booking. Please try again.",
            );
        }
        if (
          service.mode === "demo" &&
          current.draft.mode === "member" &&
          session?.email !== current.draft.accountEmail
        )
          throw new BookingServiceError(
            "conflict",
            "Please verify your email again.",
          );
        const signal = request.controller.signal;
        if (operation === "review") {
          // Review is a local draft, not a reservation. The checkout service
          // owns fresh validation at the write boundary.
          const errors = selectionErrors(current.draft.slots, Date.now());
          if (errors.length)
            throw new BookingServiceError("conflict", errors[0]);
          setAction({ status: "success", operation });
          return true;
        }
        if (
          (operation === "reserve" || operation === "checkout") &&
          !current.attempt?.held &&
          identitySignOutTask(identityService)
        ) {
          try {
            await waitForIdentitySignOut(identityService, signal);
          } catch {
            throw new BookingServiceError(
              "temporarily_unavailable",
              "Sign-out could not be completed. Return to booking options and try again.",
            );
          }
          if (!isCurrent()) return false;
        }
        if (
          (operation === "reserve" || operation === "checkout") &&
          !current.attempt?.held
        ) {
          const savedContact = profileSave.current
            ? await profileSave.current.promise
            : !profileSaveError;
          if (!isCurrent()) return false;
          if (!savedContact)
            throw new BookingServiceError(
              "temporarily_unavailable",
              "We couldn’t save your details. Please try again.",
            );
        }
        const retry = queueRetry.current;
        queueRetry.current = null;
        const retryingUndispatchedCheckout =
          operation === "checkout" &&
          current.attempt?.status === "ready" &&
          retry?.id === current.attempt.id &&
          retry.revision === current.revision;
        if (retryingUndispatchedCheckout)
          clearCheckoutRecoveryDeadline(current.attempt!.id);
        let attempt =
          operation === "checkout" &&
          current.attempt &&
          (current.attempt.held || retryingUndispatchedCheckout)
            ? current.attempt
            : operation === "checkout" || operation === "reserve"
              ? await service.checkout({
                  botToken,
                  holding:
                    operation === "reserve" ||
                    (operation === "checkout" && service.mode === "live"),
                  draft: current.draft,
                  previous: current.attempt,
                  signal,
                })
              : operation === "pay"
                ? await service.pay({
                    attempt: current.attempt!,
                    outcome,
                    signal,
                  })
                : await service[operation]({
                    attempt: current.attempt!,
                    signal,
                  });
        if (!isCurrent()) return false;
        if (
          service.mode === "demo" &&
          JSON.stringify(identity()) !== sessionKey
        )
          throw new BookingServiceError(
            "conflict",
            "Please verify your email again.",
          );
        commit({ ...current, attempt });
        current = latest.current;
        if (
          (operation === "checkout" || operation === "reserve") &&
          service.mode === "live"
        ) {
          // Retain the prepared attempt before the one-use provider write.
          // A missing reply must never cause a new preparation or payment.
          const startCheckout = operation === "checkout" && !attempt.held;
          holdDispatched = operation === "reserve" || startCheckout;
          if (operation === "checkout") {
            request.submission = {
              id: attempt.id,
              detached: false,
            };
            markSubmittedCheckout(attempt.id, true);
          }
          let handoff: { url: string; expiresAtMs: number } | undefined;
          const payment = service.pay({
            attempt,
            botToken,
            outcome: "pending",
            signal,
            holding: operation === "reserve" || startCheckout,
            startCheckout,
            onCheckoutReady: (value) => {
              handoff = value;
            },
            onReviewReady:
              operation === "reserve"
                ? () => {
                    if (!isCurrent()) return;
                    attempt = { ...attempt, verifying: true };
                    commit({ ...latest.current, attempt });
                    current = latest.current;
                  }
                : undefined,
          });
          if (request.submission)
            pendingSubmission.current = {
              request,
              id: attempt.id,
              settled: payment.then(
                () => {},
                () => {},
              ),
            };
          attempt = await payment;
          if (request.submission?.detached) {
            if (
              mounted.current &&
              latest.current.attempt?.id === attempt.id &&
              pendingSubmission.current?.id === attempt.id &&
              profileAccessGeneration() === accessGeneration
            )
              commit({ ...latest.current, attempt }, true);
            return false;
          }
          if (!isCurrent()) return false;
          // Consent may change while the created hold is being verified.
          // Carry it forward without canceling or recreating the reservation.
          if (operation === "reserve") {
            current = latest.current;
            attempt = { ...attempt, draft: current.draft };
          }
          commit({ ...current, attempt });
          current = latest.current;
          if (operation === "reserve") {
            setAction({ status: "success", operation });
            return attempt.held === true && attempt.status === "ready";
          }
          if (attempt.status === "pending") {
            setAction({ status: "success", operation });
            return true;
          }
          if (
            handoff &&
            handoff.expiresAtMs > Date.now() &&
            isHitpayCheckoutUrl(handoff.url)
          ) {
            request.submission = undefined;
            openHostedPayment(attempt.id, handoff.url);
            checkoutNavigationStarted = true;
            return false;
          }
          const contextController = new AbortController();
          let contextTimer: ReturnType<typeof setTimeout> | undefined;
          const timeout = new Promise<never>((_, reject) => {
            contextTimer = setTimeout(
              () => {
                contextController.abort();
                reject(
                  new BookingServiceError(
                    "checkout_timeout",
                    "Checkout status is still being checked.",
                  ),
                );
              },
              Math.max(1, checkoutRecoveryDeadline(attempt.id) - Date.now()),
            );
          });
          const context = await Promise.race([
            protectedCheckoutService.context({
              attemptId: attempt.id,
              mode: "live",
              signal: AbortSignal.any([signal, contextController.signal]),
            }),
            timeout,
          ]).finally(() => clearTimeout(contextTimer));
          if (!isCurrent()) return false;
          if (context.creationResolution) {
            resolveUncreatedBooking(attempt.id, context.summary.sessions);
            return false;
          }
          if (
            context.checkout.state === "available" &&
            isHitpayCheckoutUrl(context.checkout.url)
          ) {
            // assign starts navigation asynchronously. Keep the overlay and
            // one-operation guard until this document is replaced.
            request.submission = undefined;
            openHostedPayment(attempt.id, context.checkout.url);
            checkoutNavigationStarted = true;
            // Do not also navigate to the intermediate SoccerBot route.
            return false;
          }
          // Existing native attempts and unknown creation outcomes keep their
          // protected recovery route; never invent or substitute a payment URL.
        }
        setAction({ status: "success", operation });
        return true;
      } catch (error) {
        if (
          request.submission?.detached &&
          mounted.current &&
          latest.current.attempt?.id === request.submission.id &&
          pendingSubmission.current?.id === request.submission.id &&
          profileAccessGeneration() === accessGeneration
        ) {
          const id = request.submission.id;
          if (!(error instanceof BookingServiceError)) return false;
          const conflict =
            error.code === "checkout_already_active" ||
            error.code === "checkout_window_blocked" ||
            error.code === "selection_unavailable" ||
            error.code === "selection_changed";
          if (
            !conflict &&
            ![
              "booking_not_created",
              "checkout_not_started",
              "reservation_blocked",
              "queue_busy",
              "checkout_verification_required",
            ].includes(error.code)
          )
            return false;

          const original = latest.current.attempt.draft;
          const classify =
            conflict &&
            !isBookingDeparture(id) &&
            /\/book\//.test(previousNoticePath.current ?? "");
          // A definitive response supersedes a pending protected read of this rejected ID.
          entryRead.current?.abort();
          setRequestedEntry(null);
          setProtectedConflictRedirect((checked) =>
            checked === id ? null : checked,
          );
          setDetachedCheckout(null);
          if (error.code === "booking_not_created") {
            resolveUncreatedBooking(id, undefined, true);
          } else {
            markSubmittedCheckout(id, false);
            commit({ ...latest.current, attempt: null });
            saveLiveDraft(latest.current.draft, false, null);
            if (classify) {
              await returnRejectedSelection(
                original,
                original.slots[error.rejectedSessionIndex ?? -1],
                id,
                undefined,
                rejectedSlots(original, error.rejectedSessionIndices),
                error.code === "checkout_already_active"
                  ? error.code
                  : undefined,
                true,
              );
            }
          }
          return false;
        }
        if (!isCurrent()) return false;
        request.submission = undefined;
        if (
          error instanceof BookingServiceError &&
          error.code === "booking_not_created" &&
          latest.current.attempt
        ) {
          resolveUncreatedBooking(latest.current.attempt.id);
          return false;
        }
        if (
          error instanceof BookingServiceError &&
          (error.code === "queue_busy" ||
            error.code === "checkout_verification_required")
        ) {
          // Admission/proof failed before this request dispatched a booking.
          // Keep the same prepared identity for an explicit fresh-proof retry.
          if (latest.current.attempt)
            markSubmittedCheckout(latest.current.attempt.id, false);
          if (latest.current.attempt)
            queueRetry.current = {
              id: latest.current.attempt.id,
              revision: latest.current.revision,
            };
          setAction({ status: "failure", operation, error: error.message });
          return false;
        }
        if (
          error instanceof BookingServiceError &&
          (error.code === "checkout_window_blocked" ||
            error.code === "checkout_already_active")
        ) {
          // Server rejection establishes that this request dispatched no booking.
          await returnRejectedSelection(
            current.draft,
            undefined,
            undefined,
            undefined,
            undefined,
            error.code === "checkout_already_active" ? error.code : undefined,
          );
          return false;
        }
        // A lost write response is not permission to create another booking.
        // Resolve it once through the protected current-attempt read, accepting
        // only the exact original attempt with a fully verified hold.
        if (
          holdDispatched &&
          service.restore &&
          (!(error instanceof BookingServiceError) ||
            error.code === "invalid_response" ||
            error.code === "temporarily_unavailable")
        ) {
          const originalId = latest.current.attempt?.id;
          const restored = originalId
            ? await conflictRead(
                (signal) => service.restore!(signal),
                request.controller.signal,
                Math.max(1, checkoutRecoveryDeadline(originalId) - Date.now()),
              ).catch(() => null)
            : null;
          if (!isCurrent()) return false;
          if (
            restored?.id === originalId &&
            restored?.held &&
            restored.status === "ready"
          ) {
            commit({
              ...latest.current,
              attempt: { ...restored, draft: latest.current.draft },
            });
            setAction({ status: "success", operation });
            return true;
          }
        }
        if (
          error instanceof BookingServiceError &&
          (error.code === "checkout_not_started" ||
            error.code === "reservation_blocked")
        ) {
          if (latest.current.attempt)
            markSubmittedCheckout(latest.current.attempt.id, false);
          commit({ ...latest.current, attempt: null });
          setAction({ status: "failure", operation, error: error.message });
          return false;
        }
        if (
          (holdDispatched ||
            (error instanceof BookingServiceError &&
              error.code === "checkout_timeout")) &&
          latest.current.attempt
        ) {
          commit({
            ...latest.current,
            attempt: {
              ...latest.current.attempt,
              verifying: undefined,
              status: "checking",
            },
          });
          current = latest.current;
        }
        const known =
          error instanceof BookingServiceError
            ? error
            : new BookingServiceError(
                "temporarily_unavailable",
                "We couldn’t complete that request. Please try again.",
              );
        if (known.code === "reservation_expired" && latest.current.attempt) {
          try {
            const expiredId = latest.current.attempt.id;
            await expireBooking(expiredId);
            if (!isCurrent()) return false;
            restartReleasedReservation(expiredId);
          } catch {
            if (isCurrent() && latest.current.attempt) {
              const retained = latest.current.attempt;
              if (!calendarRecoveryNoticeDismissed(retained.id))
                setSelectionNotice(PAYMENT_WINDOW_ENDED, retained.draft.slots);
              setSuppressedSlots([
                ...suppressedSlots.filter(
                  (slot) =>
                    !retained.draft.slots.some((held) => overlaps(slot, held)),
                ),
                ...retained.draft.slots,
              ]);
              commit(
                {
                  ...latest.current,
                  attempt: { ...retained, status: "checking" },
                  draft: {
                    ...latest.current.draft,
                    accepted: false,
                    slots: [],
                  },
                },
                true,
              );
              if (service.mode === "live") saveCalendarRecovery(retained.id);
              pauseCalendar(false);
              setAction({
                status: "idle",
                returnToCalendar: true,
                calendarRecovery: true,
              });
            }
          }
          return false;
        }
        const selectionRejected =
          (operation === "reserve" ||
            operation === "review" ||
            operation === "checkout") &&
          (known.code === "selection_unavailable" ||
            known.code === "selection_changed");
        if (selectionRejected) {
          await returnRejectedSelection(
            current.draft,
            current.draft.slots[known.rejectedSessionIndex ?? -1],
            latest.current.attempt?.id ?? null,
            undefined,
            rejectedSlots(current.draft, known.rejectedSessionIndices),
          );
          return false;
        } else if (known.code === "conflict") invalidateAvailability();
        setAction({
          status:
            known.code === "cancelled"
              ? "cancelled"
              : known.code === "unavailable"
                ? "unavailable"
                : "failure",
          operation,
          error: known.message,
          returnToCalendar: selectionRejected,
        });
        return false;
      } finally {
        if (pendingSubmission.current?.request === request)
          pendingSubmission.current = null;
        if (active.current === request && !checkoutNavigationStarted)
          active.current = null;
        if (mounted.current && !latest.current.attempt) pauseCalendar(false);
      }
    },
    [
      service,
      commit,
      setAction,
      identityService,
      finishExit,
      restartReleasedReservation,
      resolveUncreatedBooking,
      returnRejectedSelection,
      setSelectionNotice,
      setSuppressedSlots,
      suppressedSlots,
      pendingConflict,
      protectedConflictRedirect,
      action.calendarRecovery,
      action.unresolvedCheckout,
      browsingCheckout,
      profileSaveError,
    ],
  );
  useEffect(() => {
    if (service.mode !== "demo" || value.attempt?.status !== "checking") return;
    const timer = setTimeout(
      () => {
        void run("resolve");
      },
      Math.max(0, value.attempt.checkUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [value.attempt, run, service.mode]);
  /** Save remembered contact independently of the Details route lifetime. */
  function saveContact() {
    if (profileSave.current) return profileSave.current.promise;
    const contact = latest.current.draft.contact;
    const identity = identityService.current();
    if (!identity?.remember || identity.email !== contact.email)
      return Promise.resolve(true);
    const controller = new AbortController();
    setProfileSaveError("");
    if (action.error === "We couldn’t save your details. Please try again.")
      setAction({ status: "idle" });
    let timeout: ReturnType<typeof setTimeout>;
    let timedOut = false;
    const promise = Promise.race([
      identityService.saveProfile(contact, controller.signal),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          timedOut = true;
          controller.abort();
          reject(new Error("profile_save_timeout"));
        }, 10000);
      }),
    ])
      .then(
        () => !controller.signal.aborted,
        (error: unknown) => {
          // Profile storage is optional. Revoked email proof does not revoke a booking.
          if (
            error instanceof ProfileAccessRevokedError &&
            !controller.signal.aborted
          )
            return true;
          if (
            (!controller.signal.aborted || timedOut) &&
            identityService.current()?.email === identity.email
          )
            setProfileSaveError(
              "We couldn’t save your details. Please try again.",
            );
          return false;
        },
      )
      .finally(() => {
        clearTimeout(timeout);
        if (profileSave.current?.controller === controller)
          profileSave.current = null;
      });
    profileSave.current = { controller, promise };
    return promise;
  }
  return (
    <Context.Provider
      value={{
        ...value,
        profileAccessRevision,
        profileAccessNotice,
        sessionChoices,
        saveContact,
        profileSaveError,
        resetIdentityDraft() {
          cancel();
          profileSave.current?.controller.abort();
          profileSave.current = null;
          setProfileSaveError("");
          setSelectionNotice(null);
          setSessionChoices({ outlet: true, session: true });
          showDate(null);
          setCalendarBrowsing(false);
          setAction({ status: "idle" });
          commit({ ...latest.current, draft: blankDraft() });
        },
        setSessionChoices,
        ready:
          value.ready &&
          !restorationPending &&
          !needsEntryCheck &&
          !(protectedConflictRedirect && !!pathname?.includes("/book/")),
        conflictLoadingLabel: pendingConflict
          ? pendingConflict.reason === "checkout_already_active"
            ? ACTIVE_CHECKOUT_CHECKING
            : CONFLICT_CHECKING
          : null,
        resolveUncreatedBooking,
        now,
        bookingService: service,
        identityService,
        action,
        cancel,
        availability,
        showDate,
        calendar,
        selectionNotice,
        selectionNoticeSlots,
        visitBookingStep,
        suppressedSlots,
        showMonth,
        setCalendarBrowsing,
        rebookingError,
        retryRebooking() {
          if (exitWork.current) void finishExit(exitWork.current.id);
        },
        clearReviewConsent,
        detachCheckout,
        browsingCheckout,
        resumeSubmittedCheckout,
        rejectRecoveredSelection,
        resumePaymentStatus(id) {
          if (latest.current.attempt?.id !== id) return;
          completedPaymentReturn(id, true);
          clearCalendarRecovery(id);
          setSelectionNotice(null);
          setAction({ status: "idle" });
        },
        /** Browse availability while retaining the original unresolved payment lock. */
        browseAfterChecking(id, unresolved = false) {
          const current = latest.current;
          if (
            active.current ||
            current.attempt?.id !== id ||
            !paymentLocked(current.attempt) ||
            current.attempt.status === "paid"
          )
            return false;
          // A read from before the unknown creation cannot restore its display.
          if (unresolved && !action.unresolvedCheckout)
            freshChecks.current.delete(service);
          pauseCalendar(false);
          if (service.mode === "live")
            saveCalendarRecovery(id, unresolved || isUnresolvedCheckout(id));
          if (action.calendarRecovery && unresolved) {
            if (!calendarRecoveryNoticeDismissed(id))
              setSelectionNotice(
                CHECKOUT_UNRESOLVED,
                current.attempt.draft.slots,
              );
            setAction({
              status: "idle",
              returnToCalendar: true,
              calendarRecovery: true,
              unresolvedCheckout: true,
            });
          }
          if (!action.calendarRecovery) {
            if (!calendarRecoveryNoticeDismissed(id))
              setSelectionNotice(
                unresolved ? CHECKOUT_UNRESOLVED : PAYMENT_WINDOW_ENDED,
                current.attempt.draft.slots,
              );
            setSuppressedSlots([
              ...suppressedSlots.filter(
                (slot) =>
                  !current.attempt!.draft.slots.some((held) =>
                    overlaps(slot, held),
                  ),
              ),
              ...current.attempt.draft.slots,
            ]);
            commit(
              {
                ...current,
                draft: {
                  ...calendarDraft(current.draft, current.attempt.draft),
                  accepted: false,
                  slots: [],
                },
              },
              true,
            );
            setAction({
              status: "idle",
              returnToCalendar: true,
              calendarRecovery: true,
              unresolvedCheckout: unresolved,
            });
          }
          return true;
        },
        /** Restart the draft flow after an eligible attempt expiry. */
        restartAfterExpiry(id) {
          const attempt = latest.current.attempt;
          const storedId =
            service.mode === "live" ? liveCheckoutAttemptId() : null;
          if (
            active.current ||
            attempt?.status === "paid" ||
            (attempt && attempt.id !== id) ||
            (storedId && storedId !== id)
          )
            return false;
          restartReleasedReservation(id);
          return true;
        },
        async restartAfterConfirmation(id) {
          if (active.current) throw new Error("booking_exit_changed");
          const current = latest.current;
          const storedId =
            service.mode === "live" ? liveCheckoutAttemptId() : null;
          // The visible receipt can belong to an earlier booking while this tab restores its checkout.
          if (storedId && storedId !== (current.attempt?.id ?? id)) return;
          if (current.attempt && current.attempt.id !== id) {
            if (service.mode !== "live") return;
            const otherId = current.attempt.id;
            const context = await protectedCheckoutService.context({
              attemptId: otherId,
              mode: "live",
              signal: new AbortController().signal,
            });
            if (latest.current !== current || active.current)
              throw new Error("booking_exit_changed");
            // Only independently verified completion permits clearing the newer
            // attempt. An unpaid/uncertain checkout remains recoverable.
            if (!context.confirmation && !context.customerConfirmation) return;
            if (!(await finishExit(otherId)))
              throw new Error("booking_exit_changed");
            if (latest.current !== current || active.current)
              throw new Error("booking_exit_changed");
            id = otherId;
          }
          if (service.mode === "live") void finishExit(id);
          cancel();
          // A completed booking changes availability even while its browser
          // snapshot is still within its display lifetime.
          invalidateAvailability();
          pauseCalendar(false);
          setSelectionNotice(null);
          setRestoredOwner({ service, identityService });
          setSessionChoices({ outlet: true, session: true });
          commit({ version: 2, draft: blankDraft(), attempt: null });
          // Explicit rebooking starts a new navigation journey; completion hints
          // remain keyed to the old attempt for protected receipt/history reads.
          if (service.mode === "live") saveLiveDraft(blankDraft(), false, null);
        },
        /** Apply draft changes while preserving the booking state constraints. */
        update(change) {
          if (change.contact || change.accountEmail || change.mode) {
            profileSave.current?.controller.abort();
            profileSave.current = null;
            setProfileSaveError("");
          }
          const current = latest.current;
          if (active.current?.submission) return;
          if (
            (action.calendarRecovery ||
              browsingCheckout ||
              isBookingDeparture(current.attempt?.id ?? null)) &&
            current.attempt &&
            !active.current
          ) {
            // Editable new selections are separate from the retained recovery attempt.
            commit(
              {
                ...current,
                draft: { ...current.draft, ...change, accepted: false },
              },
              true,
            );
            return;
          }
          if (current.attempt?.held || current.attempt?.verifying) {
            if (
              (active.current &&
                !(
                  current.attempt.verifying &&
                  active.current.operation === "reserve"
                )) ||
              current.attempt.status !== "ready" ||
              Object.keys(change).some((key) => key !== "accepted")
            )
              return;
            const draft = { ...current.draft, ...change };
            // Only consent may change during this same reservation. It does
            // not invalidate the in-flight hold result or its request guard.
            const consentingDuringReserve =
              current.attempt.verifying === true &&
              active.current?.operation === "reserve";
            commit(
              { ...current, draft, attempt: { ...current.attempt, draft } },
              consentingDuringReserve,
              consentingDuringReserve,
            );
            return;
          }
          if (
            paymentLocked(current.attempt) ||
            (active.current && active.current.operation !== "checkout")
          )
            return;
          cancel();
          if (action.returnToCalendar) setAction({ status: "idle" });
          if (
            selectionNotice !== CONFLICT_NOTICE &&
            selectionNotice !== BOOKING_NOT_CREATED &&
            selectionNotice !== PAYMENT_WINDOW_ENDED &&
            selectionNotice !== ACTIVE_CHECKOUT_NOTICE &&
            selectionNotice !== SESSION_UNAVAILABLE
          )
            setSelectionNotice(null);
          pauseCalendar(false);
          commit({
            ...current,
            draft: { ...current.draft, accepted: false, ...change },
            attempt: null,
          });
        },
        reserve: () => run("reserve"),
        review: () => run("review"),
        checkout: (botToken) => run("checkout", "success", botToken),
        pay: (outcome) => run("pay", outcome),
        check: () => run("check"),
        resolve: () => run("resolve"),
        leave(verifiedAttemptId?: string) {
          entryRead.current?.abort();
          setRequestedEntry(null);
          setHistoryBrowsing(false);
          // The outgoing booking step can still render before the destination commits.
          setEntryChecked(pathname);
          // Access recovery belongs to the departed journey, not the next entry.
          clearBookingAccessNotice();
          setProfileAccessRevision(0);
          setProfileAccessNotice(BOOKING_SIGNED_OUT);
          // Detach the editable cart from the original financial submission.
          detachCheckout();
          if (latest.current.attempt?.id === submittedCheckoutId())
            setDetachedCheckout(latest.current.attempt?.id ?? null);
          setAction({ status: "idle" });
          setSelectionNotice(null);
          setSessionChoices({ outlet: true, session: true });
          showDate(null);
          setCalendarBrowsing(false);
          const attempt = latest.current.attempt;
          const retainedId = attempt?.id ?? liveCheckoutAttemptId();
          const departedSlots =
            attempt?.draft.slots ??
            (retainedId && isBookingDeparture(retainedId)
              ? loadDepartureSlots(retainedId)
              : retainedId
                ? latest.current.draft.slots
                : []);
          commit({
            version: 2,
            draft:
              service.mode === "live"
                ? blankDraft()
                : (attempt?.draft ?? blankDraft()),
            attempt,
          });
          // A held attempt's immutable snapshot remains usable for recovery;
          // the separately persisted editable live draft is still discarded.
          if (service.mode === "live") {
            const verified =
              typeof verifiedAttemptId === "string" &&
              (!retainedId || retainedId === verifiedAttemptId) &&
              rememberPaymentContinuation(verifiedAttemptId)
                ? verifiedAttemptId
                : null;
            if (verified) setDetachedCheckout(verified);
            saveLiveDraft(blankDraft());
            const id = verified ?? retainedId;
            if (id) markBookingDeparture(id, departedSlots);
          }
        },
        reset() {
          const current = latest.current;
          if (
            active.current ||
            (current.attempt &&
              (current.attempt.held ||
                ["checking", "pending", "late"].includes(
                  current.attempt.status,
                )))
          )
            return;
          clearIdentityEntry(identityService);
          cancel();
          setSelectionNotice(null);
          setSessionChoices({ outlet: true, session: true });
          commit({ version: 2, draft: blankDraft(), attempt: null });
        },
      }}
    >
      <BookingLoadingProvider>{children}</BookingLoadingProvider>
    </Context.Provider>
  );
}

/** Read booking state and actions from the required provider. */
export function useBooking() {
  const context = useContext(Context);
  if (!context) throw new Error("BookingProvider is required.");
  return context;
}
