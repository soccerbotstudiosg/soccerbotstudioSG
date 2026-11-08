"use client";
import { usePathname } from "next/navigation";
import { BookingLoadingProvider } from "./booking-loading";
import {
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
import { todaySG, dateLabel, endTime } from "@/domain/dates";
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
  useReducer,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  blankDraft,
  paymentLocked,
  type BookingDraft,
  type Outcome,
} from "@/domain/booking";
import type { CustomerIdentityService } from "@/services/contracts";
import { services } from "@/services";
import { customerCatalogueService } from "@/services/customer-catalogue";
import { defineBookingService } from "@/services/booking";
import {
  BookingServiceError,
  type BookingService,
  type BookingOperation,
} from "@/services/contracts";
import {
  loadBooking,
  loadLiveDraft,
  loadSuppressedSlots,
  saveSuppressedSlots,
  mayRestoreLiveCheckout,
  saveCalendarRecovery,
  isCalendarRecovery,
  liveCheckoutAttemptId,
  saveLiveDraft,
  saveBooking,
  type StoredBooking,
} from "@/services/storage";
import { useBookingAvailability } from "./availability";
type Action = Exclude<BookingOperation, "availability"> | "reserve" | "review";
type ActionState = {
  status:
    "idle" | "loading" | "success" | "failure" | "unavailable" | "cancelled";
  operation?: Action;
  error?: string;
  returnToCalendar?: boolean;
  resumeAttemptId?: string;
};
type SessionChoices = { outlet: boolean; session: boolean };
interface BookingContextValue extends StoredBooking {
  sessionChoices: SessionChoices;
  setSessionChoices: (choices: SessionChoices) => void;
  availability: ReturnType<typeof useBookingAvailability>;
  showDate: (date: string | null) => void;
  calendar: ReturnType<typeof useCalendarAvailability>;
  showMonth: (month: string, through?: string) => void;
  setCalendarBrowsing: (active: boolean) => void;
  selectionNotice: string | null;
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
  checkout: () => Promise<boolean>;
  pay: (outcome: Outcome) => Promise<boolean>;
  check: () => Promise<boolean>;
  resolve: () => Promise<boolean>;
  reset: () => void;
  leave: () => void;
  restartAfterExpiry: (attemptId: string) => void;
  browseAfterChecking: (attemptId: string) => boolean;
  clearReviewConsent: () => void;
  resumePaymentStatus: (attemptId: string) => void;
  rejectRecoveredSelection: (
    attemptId: string,
    rejection: CheckoutSelectionRejection,
  ) => Promise<boolean>;
  restartAfterConfirmation: (attemptId: string) => Promise<void>;
  rebookingError: string | null;
  retryRebooking: () => void;
}
/** Describe affected selections consistently across expiry and conflict notices. */
function describeSessions(slots: StoredBooking["draft"]["slots"]) {
  return slots
    .map(
      (slot) => `${dateLabel(slot.date)}, ${slot.start}–${endTime(slot.start)}`,
    )
    .join("; ");
}
/** Fresh reads identify unavailable selections; failed reads never imply a conflict. */
async function readConflictSelections(
  service: BookingService,
  draft: BookingDraft,
  signal: AbortSignal,
) {
  const dates = [...new Set(draft.slots.map((slot) => slot.date))];
  const results = await Promise.allSettled(
    dates.map((date) =>
      service.availability({
        date,
        players: draft.players,
        serviceId: draft.nativeServiceId,
        fresh: true,
        signal,
      }),
    ),
  );
  const unavailable = draft.slots.filter((slot) => {
    const result = results[dates.indexOf(slot.date)];
    return (
      result.status === "fulfilled" &&
      !result.value.some(
        (offer) =>
          offer.available &&
          sessionOfferKey(offer) === sessionOfferKey(slot) &&
          sessionPrice(offer) === sessionPrice(slot),
      )
    );
  });
  return { dates, results, unavailable };
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
  const [sessionChoices, setSessionChoices] = useState<SessionChoices>({
    outlet: false,
    session: false,
  });
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
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
  const [actionState, dispatchAction] = useState<
    ActionState & { owner: BookingService }
  >({ status: "idle", owner: service });
  const setAction = useCallback(
    (next: ActionState) => dispatchAction({ ...next, owner: service }),
    [service],
  );
  const action: ActionState =
    actionState.owner === service ? actionState : { status: "idle" };
  const active = useRef<{
    controller: AbortController;
    operation: Action;
  } | null>(null);
  const releasedReservation = useRef<string | null>(null);
  const queueRetry = useRef<{ id: string; revision: number } | null>(null);
  const mounted = useRef(false);
  const exitWork = useRef<{
    id: string;
    promise: Promise<boolean>;
    failed: boolean;
  } | null>(null);
  const [rebookingError, setRebookingError] = useState<string | null>(null);
  const finishExit = useCallback((id: string) => {
    if (exitWork.current?.id === id && !exitWork.current.failed)
      return exitWork.current.promise;
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
  }, []);
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
  const pathname = usePathname();
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
      (!!value.attempt && !action.returnToCalendar),
    calendarThrough,
  );
  const availability = useBookingAvailability(
    service,
    (value.attempt && !action.returnToCalendar) ||
      !calendarBrowsing ||
      calendarPaused ||
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
  const latest = useRef(value);
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
  const cancel = useCallback(() => {
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
  }, [setAction]);
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
  const rejectionRead = useRef<AbortController | null>(null);
  /** Leave a proven no-effects checkout immediately and classify its slots in the background. */
  const returnRejectedSelection = useCallback(
    (draft: BookingDraft, indexed?: BookingDraft["slots"][number]) => {
      rejectionRead.current?.abort();
      const controller = new AbortController();
      rejectionRead.current = controller;
      const identity = JSON.stringify(identityService.current());
      const candidates = indexed ? [indexed] : draft.slots;
      const existing = suppression.current.slots;
      setSuppressedSlots([
        ...existing.filter(
          (slot) => !candidates.some((candidate) => overlaps(slot, candidate)),
        ),
        ...candidates,
      ]);
      const generation = suppression.current.generation;
      commit({
        ...latest.current,
        attempt: null,
        draft: {
          ...latest.current.draft,
          accepted: false,
          slots: latest.current.draft.slots.filter(
            (slot) => !indexed || slotKey(slot) !== slotKey(indexed),
          ),
        },
      });
      if (service.mode === "live") saveLiveDraft(latest.current.draft, false);
      pauseCalendar(false);
      setSelectionNotice(
        indexed
          ? `Removed unavailable sessions: ${describeSessions([indexed])}.`
          : "These selections were not booked. Please check your sessions again. Your details are saved.",
      );
      setAction({ status: "idle", returnToCalendar: true });
      for (const date of new Set(draft.slots.map((slot) => slot.date)))
        rememberFreshDate(date, draft.players, draft.nativeServiceId);
      void readConflictSelections(service, draft, controller.signal).then(
        (read) => {
          if (
            controller.signal.aborted ||
            rejectionRead.current !== controller ||
            suppression.current.generation !== generation ||
            !mounted.current ||
            latest.current.attempt ||
            active.current ||
            latest.current.draft.mode !== draft.mode ||
            latest.current.draft.nativeServiceId !== draft.nativeServiceId ||
            latest.current.draft.players !== draft.players ||
            JSON.stringify(identityService.current()) !== identity
          )
            return;
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
          if (service.mode === "live")
            saveLiveDraft(latest.current.draft, false);
          if (affected.length)
            setSelectionNotice(
              `Removed unavailable sessions: ${describeSessions(affected)}.`,
            );
          rejectionRead.current = null;
        },
      );
    },
    [
      service,
      identityService,
      calendar,
      setSuppressedSlots,
      commit,
      setAction,
      rememberFreshDate,
    ],
  );
  /** Apply an authenticated no-effects rejection only to its original tab attempt. */
  const rejectRecoveredSelection = useCallback(
    async (id: string, rejection: CheckoutSelectionRejection) => {
      const current = latest.current;
      if (
        active.current ||
        service.mode !== "live" ||
        liveCheckoutAttemptId() !== id ||
        (current.attempt &&
          (current.attempt.id !== id || current.attempt.status === "paid"))
      )
        return false;
      const indexed =
        rejection.state === "selection_unavailable"
          ? current.attempt?.draft.slots[rejection.rejectedSessionIndex ?? -1]
          : undefined;
      returnRejectedSelection(current.draft, indexed);
      return true;
    },
    [service, returnRejectedSelection],
  );
  const recoverRejectedTab = useEffectEvent(
    async (id: string, controller: AbortController) => {
      try {
        const context = await protectedCheckoutService.context({
          attemptId: id,
          mode: "live",
          signal: controller.signal,
        });
        if (
          !controller.signal.aborted &&
          context.selectionRejection &&
          liveCheckoutAttemptId() === id
        )
          await rejectRecoveredSelection(id, context.selectionRejection);
      } catch {
        /* Unknown reads cannot discard a pending attempt. */
      }
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
    const controller = new AbortController();
    const revision = latest.current.revision;
    const exiting = service.mode === "live" ? completedExitIntent() : null;
    if (exiting) void finishExit(exiting);
    if (
      service.mode === "live" &&
      identityService.mode === "live" &&
      service.restore
    ) {
      void service
        .restore(controller.signal)
        .then(
          (attempt) => {
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
              if (isCalendarRecovery(attempt.id)) {
                commit({ version: 2, draft, attempt }, true);
                setAction({ status: "idle", returnToCalendar: true });
              } else if (
                !mayRestoreLiveCheckout(attempt.id) ||
                (draft.slots.length > 0 && !sameSelections)
              ) {
                setSelectionNotice(
                  "Another checkout is in progress. Your selections are saved. Please choose available sessions.",
                );
                setAction({
                  status: "idle",
                  returnToCalendar: true,
                });
              } else
                commit({ version: 2, draft: attempt.draft, attempt }, true);
            }
          },
          () => {
            /* A failed protected read cannot restore private state. */
          },
        )
        .finally(() => {
          if (!controller.signal.aborted) {
            setRestoredOwner({ service, identityService });
            const id = liveCheckoutAttemptId();
            if (id && mayRestoreLiveCheckout(id) && !latest.current.attempt)
              void recoverRejectedTab(id, controller);
          }
        });
    }
    return () => {
      controller.abort();
      rejectionRead.current?.abort();
      mounted.current = false;
      cancel();
    };
  }, [
    commit,
    cancel,
    service,
    identityService,
    finishExit,
    setAction,
    setSuppressedSlots,
  ]);
  useEffect(() => {
    const resume = (event: PageTransitionEvent) => {
      // Browser Back may restore this document with its handoff loader intact.
      // Release that UI operation so the retained attempt routes to recovery;
      // never start another checkout or discard its identity.
      if (event.persisted && active.current?.operation === "checkout") cancel();
    };
    window.addEventListener("pageshow", resume);
    return () => window.removeEventListener("pageshow", resume);
  }, [cancel]);
  /** Rebuild only the editable cart after server-confirmed unpaid release. */
  const restartReleasedReservation = useCallback(
    (id: string) => {
      if (releasedReservation.current === id) return;
      releasedReservation.current = id;
      // Reads made while the original attempt was locked cannot release slots.
      freshChecks.current.delete(service);
      cancel();
      const previous =
        latest.current.attempt?.id === id
          ? latest.current.attempt.draft
          : latest.current.draft;
      const nextDraft = {
        ...latest.current.draft,
        accepted: false,
        slots: latest.current.draft.slots.filter(
          (slot) =>
            !previous.slots.some(
              (expired) => slotKey(expired) === slotKey(slot),
            ),
        ),
      };
      setSuppressedSlots([
        ...suppressedSlots.filter(
          (slot) => !previous.slots.some((expired) => overlaps(slot, expired)),
        ),
        ...previous.slots,
      ]);
      setRestoredOwner({ service, identityService });
      commit({ ...latest.current, attempt: null, draft: nextDraft });
      if (service.mode === "live") saveLiveDraft(nextDraft, false);
      setAction({ status: "idle", returnToCalendar: true });
      pauseCalendar(false);
      setSelectionNotice(
        previous.slots.length
          ? `Your unpaid reservation has ended. Affected sessions: ${describeSessions(previous.slots)}. These sessions may not be available to book again immediately. Please try again later. Your details are saved.`
          : "Your unpaid reservation has ended. Your details are saved. Please choose your sessions again.",
      );
    },
    [
      cancel,
      commit,
      identityService,
      service,
      setAction,
      setSuppressedSlots,
      suppressedSlots,
    ],
  );
  // A warm display cache cannot release affected studio capacity. Only these
  // fresh reads may remove suppression, and never while its payment is unknown.
  const { reconcile } = calendar;
  const retainedAttempt = value.attempt;
  useEffect(() => {
    if (
      !value.ready ||
      restorationPending ||
      !calendarBrowsing ||
      !suppressedSlots.length
    )
      return;
    const controller = new AbortController();
    const generation = suppression.current.generation;
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
        if (retainedAttempt?.draft.slots.some((held) => overlaps(slot, held)))
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
      const nextSlots = latest.current.draft.slots.filter(
        (slot) =>
          !unavailable.some((hidden) => slotKey(hidden) === slotKey(slot)),
      );
      if (nextSlots.length !== latest.current.draft.slots.length) {
        const removed = latest.current.draft.slots.filter(
          (slot) =>
            !nextSlots.some((retained) => slotKey(retained) === slotKey(slot)),
        );
        setSelectionNotice(
          `Removed unavailable sessions: ${describeSessions(removed)}.`,
        );
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
    service,
    value.ready,
    value.draft.players,
    value.draft.nativeServiceId,
    value.draft.mode,
    restorationPending,
    calendarBrowsing,
    suppressedSlots,
    retainedAttempt,
    commit,
    rememberFreshDate,
    identityService,
    now,
    reconcile,
    setSuppressedSlots,
  ]);
  const run = useCallback(
    async (operation: Action, outcome: Outcome = "success") => {
      if (active.current || !mounted.current || !latest.current.ready)
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
      const request = { controller: new AbortController(), operation };
      let checkoutNavigationStarted = false;
      let holdDispatched = false;
      active.current = request; // Synchronous guard also catches same-turn double clicks.
      setAction({ status: "loading", operation });
      if (operation === "reserve" || operation === "checkout")
        pauseCalendar(true);
      const identity = () =>
        current.draft.mode === "member" ? identityService.current() : null;
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
        const retry = queueRetry.current;
        queueRetry.current = null;
        let attempt =
          operation === "checkout" &&
          current.attempt &&
          (current.attempt.held ||
            (current.attempt.status === "ready" &&
              retry?.id === current.attempt.id &&
              retry.revision === current.revision))
            ? current.attempt
            : operation === "checkout" || operation === "reserve"
              ? await service.checkout({
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
        if (JSON.stringify(identity()) !== sessionKey)
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
          let handoff: { url: string; expiresAtMs: number } | undefined;
          attempt = await service.pay({
            attempt,
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
            location.assign(handoff.url);
            checkoutNavigationStarted = true;
            return false;
          }
          const context = await protectedCheckoutService.context({
            attemptId: attempt.id,
            mode: "live",
            signal,
          });
          if (!isCurrent()) return false;
          if (
            context.checkout.state === "available" &&
            isHitpayCheckoutUrl(context.checkout.url)
          ) {
            // assign starts navigation asynchronously. Keep the overlay and
            // one-operation guard until this document is replaced.
            location.assign(context.checkout.url);
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
        if (!isCurrent()) return false;
        if (
          error instanceof BookingServiceError &&
          error.code === "queue_busy"
        ) {
          // Admission failed before this operation started. Keep the same
          // prepared attempt available for an explicit retry.
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
          error.code === "checkout_window_blocked"
        ) {
          // Server rejection establishes that this request dispatched no booking.
          returnRejectedSelection(current.draft);
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
          const restored = await service
            .restore(request.controller.signal)
            .catch(() => null);
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
          commit({ ...latest.current, attempt: null });
          setAction({ status: "failure", operation, error: error.message });
          return false;
        }
        if (holdDispatched && latest.current.attempt) {
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
              setAction({ status: "idle", returnToCalendar: true });
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
          returnRejectedSelection(
            current.draft,
            current.draft.slots[known.rejectedSessionIndex ?? -1],
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
      returnRejectedSelection,
      setSuppressedSlots,
      suppressedSlots,
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
  return (
    <Context.Provider
      value={{
        ...value,
        sessionChoices,
        setSessionChoices,
        ready: value.ready && !restorationPending,
        now,
        bookingService: service,
        identityService,
        action,
        cancel,
        availability,
        showDate,
        calendar,
        selectionNotice,
        suppressedSlots,
        showMonth,
        setCalendarBrowsing,
        rebookingError,
        retryRebooking() {
          if (exitWork.current) void finishExit(exitWork.current.id);
        },
        clearReviewConsent,
        rejectRecoveredSelection,
        resumePaymentStatus(id) {
          if (latest.current.attempt?.id === id) setAction({ status: "idle" });
        },
        /** Browse availability while retaining the original unresolved payment lock. */
        browseAfterChecking(id) {
          const current = latest.current;
          if (
            active.current ||
            current.attempt?.id !== id ||
            !paymentLocked(current.attempt) ||
            current.attempt.status === "paid"
          )
            return false;
          if (!action.returnToCalendar) {
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
                draft: { ...current.draft, accepted: false, slots: [] },
              },
              true,
            );
            if (service.mode === "live") saveCalendarRecovery(id);
            setAction({ status: "idle", returnToCalendar: true });
          }
          return true;
        },
        /** Restart the draft flow after an eligible attempt expiry. */
        restartAfterExpiry(id) {
          if (
            active.current ||
            latest.current.attempt?.status === "paid" ||
            (latest.current.attempt && latest.current.attempt.id !== id)
          )
            return;
          restartReleasedReservation(id);
        },
        async restartAfterConfirmation(id) {
          if (active.current) throw new Error("booking_exit_changed");
          const current = latest.current;
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
          setSessionChoices({ outlet: false, session: false });
          commit({ version: 2, draft: blankDraft(), attempt: null });
        },
        /** Apply draft changes while preserving the booking state constraints. */
        update(change) {
          const current = latest.current;
          if (action.returnToCalendar && current.attempt && !active.current) {
            if (
              !change.slots ||
              Object.keys(change).some((key) => key !== "slots")
            )
              return;
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
        checkout: () => run("checkout"),
        pay: (outcome) => run("pay", outcome),
        check: () => run("check"),
        resolve: () => run("resolve"),
        leave() {
          // Discard editable data without erasing a dispatched attempt or its
          // server-owned payment recovery. Cancellation invalidates late UI replies.
          cancel();
          setAction({ status: "idle" });
          setSelectionNotice(null);
          setSessionChoices({ outlet: false, session: false });
          showDate(null);
          setCalendarBrowsing(false);
          const attempt = latest.current.attempt;
          commit({
            version: 2,
            draft: attempt?.draft ?? blankDraft(),
            attempt,
          });
          // A held attempt's immutable snapshot remains usable for recovery;
          // the separately persisted editable live draft is still discarded.
          if (service.mode === "live") saveLiveDraft(blankDraft());
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
          cancel();
          setSelectionNotice(null);
          setSessionChoices({ outlet: false, session: false });
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
