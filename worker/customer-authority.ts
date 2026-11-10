import {
  BOOKING_LEAD_MINUTES,
  START_INTERVAL_MINUTES,
} from "../src/domain/booking-policy";
import {
  preparationRejection,
  retainPreparationRejection,
} from "./checkout-preparation-rejection";
import { authenticate, type Access } from "./access";
import {
  ApiError,
  liveCustomerAccess,
  policy,
  providerServiceIds,
  digest,
} from "./policy";
import { sessionPrices } from "../src/domain/session-pricing";
import {
  nativePrepareSchema,
  type CheckoutSelectionRejection,
} from "../src/domain/native-checkout";
import { nativeAccountContractSchema } from "./prebooking";
import {
  calendarWindow,
  windowAvailability,
  type ReadOptions,
} from "./public-calendar";
import { providerSecrets } from "./provider-transport";
import { intentSchema, associationSchema } from "./journal";

export type Grant = {
  capability_hash: string;
  attempt_id: string | null;
  intent_hash: string | null;
  source_revision: string;
  contract_json: string;
  not_before_ms: number;
  expires_ms: number;
  starting_used: number;
  maximum_used: number;
  cleanup_allowed: number;
  state: string;
  result_json: string | null;
  available_dates_json: string;
  availability_json: string | null;
  read_state: string;
  ongoing: number;
  preparation?: D1PreparedStatement[];
};

// Ordinary customer consent creates one short-lived, immutable checkout grant.
// The site stays open; a grant is never renewed or replayed after dispatch.
/** Validate customer authority and retain the checkout preparation grant. */
export async function authorizeCustomerCheckout(
  request: Request,
  value: unknown,
  options: ReadOptions,
  combinedHold = false,
  verifiedAccess?: Access,
  retainGrant = false,
  deferFresh = false,
) {
  const { env } = options;
  if (!liveCustomerAccess(env))
    throw new ApiError(503, "provider_access_disabled");
  const input = nativePrepareSchema.parse(value);
  const p = policy(env);
  const services = providerServiceIds(env);
  const access =
    verifiedAccess ?? (await authenticate(request, env, Date.now()));
  if (access.preparation_rejected === 1) {
    const rejection = await preparationRejection(
      env,
      input.key,
      access.owner_id,
    );
    if (
      !rejection ||
      rejection.inputHash !== (await digest(JSON.stringify(input)))
    )
      throw new ApiError(409, "native_attempt_unavailable");
    await authenticate(request, env, Date.now());
    throw new ApiError(
      503,
      rejection.selectionRejection.state === "selection_unavailable"
        ? "checkout_selection_unavailable"
        : "checkout_window_unresolved",
      rejection.selectionRejection.rejectedSessionIndices
        ? rejection.selectionRejection
        : undefined,
    );
  }
  // A retired idempotency key must not mint a replacement grant before the
  // immutable attempt is inspected. Otherwise replay can strand the next key
  // behind a fresh grant bound to the already resolved attempt.
  const resolved =
    access.checkout_key === input.key && access.resolved_checkout !== undefined
      ? access.resolved_checkout === 1
      : await env.STATE.withSession("first-primary")
          .prepare(
            "SELECT 1 FROM attempts a JOIN no_creation_resolutions n ON n.attempt_id=a.id WHERE a.owner_id=? AND a.idempotency_key=? UNION ALL SELECT 1 FROM checkout_preparation_rejections WHERE attempt_id=?",
          )
          .bind(access.owner_id, input.key, input.key)
          .first();
  if (resolved) throw new ApiError(409, "native_attempt_unavailable");
  const existing =
    !retainGrant &&
    (await archiveRejectedCustomerGrant(env, access.capability_hash));
  if (existing) return;
  const dates = [
    ...new Set(
      input.sessions.map((session) =>
        new Date(session.startMs + 28800000).toISOString().slice(0, 10),
      ),
    ),
  ].sort();
  if (
    input.sessions.some(
      (session) =>
        session.serviceId !== services.primary &&
        session.serviceId !== services.premium,
    )
  )
    throw new ApiError(409, "native_selection_changed");
  if (
    combinedHold &&
    dates.some((date) => !calendarWindow(options).window.dates.includes(date))
  )
    throw new ApiError(409, "native_selection_changed");
  const available: Record<
    string,
    Awaited<ReturnType<typeof windowAvailability>>
  > = {};
  for (const date of combinedHold ? [] : dates) {
    available[date] = await windowAvailability({
      ...options,
      date,
      serviceId: services.primary,
      fresh: true,
    });
  }
  if (
    !combinedHold &&
    input.sessions.some(
      (session) =>
        !Object.values(available).some((day) =>
          day.offers.some(
            (offer) =>
              offer.serviceId === session.serviceId &&
              offer.instructorId === session.instructorId &&
              offer.startMs === session.startMs &&
              offer.priceMinor === session.totalMinor,
          ),
        ),
    )
  )
    throw new ApiError(409, "native_selection_changed");
  const now = Date.now();
  if (!verifiedAccess) await authenticate(request, env, now);
  const expires = Math.min(now + 1200000, access.expires_ms);
  if (expires <= now + 180000) throw new ApiError(401, "access_expiring");
  const contract = nativeAccountContractSchema.parse({
    accountId: p.DEPLOYMENT_ACCOUNT_ID,
    environmentId: p.ENVIRONMENT,
    companyLogin: providerSecrets(env).company,
    serviceId: services.primary,
    priceMinor: sessionPrices(p.ENVIRONMENT).ordinary,
    ...(p.PREMIUM_SERVICE_ID ? { premiumServiceId: p.PREMIUM_SERVICE_ID } : {}),
    currency: "SGD",
    taxMinor: 0,
    durationMinutes: 40,
    bufferAfterMinutes: 10,
    clientLoginRequired: false,
    providerSchedules: "customer-choice",
    bookingLeadMinutes: BOOKING_LEAD_MINUTES,
    confirmedAtMs: now,
    expiresAtMs: expires,
  });
  const used = options.accounting().used;
  // Bound each attempt, including fresh pre-write validation of every session.
  // The durable account governor still paces all visitors and retains cooldowns.
  const maximum = used + 64 + input.sessions.length * 32;
  if (!Number.isSafeInteger(maximum))
    throw new ApiError(503, "provider_budget_invalid");
  const insert = env.STATE.prepare(
    "INSERT INTO native_checkout_grants(capability_hash,source_revision,contract_json,not_before_ms,expires_ms,starting_used,maximum_used,cleanup_allowed,state,available_dates_json,availability_json,read_state,ongoing) SELECT ?,?,?,?,?,?,?,0,'granted',?,?,'available',1 WHERE NOT EXISTS(SELECT 1 FROM attempts a JOIN no_creation_resolutions n ON n.attempt_id=a.id WHERE a.owner_id=? AND a.idempotency_key=?) AND NOT EXISTS(SELECT 1 FROM checkout_preparation_rejections WHERE attempt_id=?) ON CONFLICT(capability_hash) DO NOTHING",
  ).bind(
    access.capability_hash,
    p.SOURCE_REVISION,
    JSON.stringify(contract),
    now,
    expires,
    used,
    maximum,
    JSON.stringify(dates),
    JSON.stringify(available),
    access.owner_id,
    input.key,
    input.key,
  );
  if (deferFresh && retainGrant && verifiedAccess?.fresh_checkout === 1) {
    return {
      capability_hash: access.capability_hash,
      attempt_id: null,
      intent_hash: null,
      source_revision: p.SOURCE_REVISION,
      contract_json: JSON.stringify(contract),
      not_before_ms: now,
      expires_ms: expires,
      starting_used: used,
      maximum_used: maximum,
      cleanup_allowed: 0,
      state: "granted",
      result_json: null,
      available_dates_json: JSON.stringify(dates),
      availability_json: JSON.stringify(available),
      read_state: "available",
      ongoing: 1,
      preparation: [insert],
    } satisfies Grant;
  }
  if (!retainGrant) {
    await insert.run();
    return;
  }
  const db = env.STATE.withSession("first-primary");
  const results = await db.batch([
    ...rejectedGrantStatements(env, access.capability_hash),
    insert,
    db
      .prepare("SELECT * FROM native_checkout_grants WHERE capability_hash=?")
      .bind(access.capability_hash),
  ]);
  return results.at(-1)!.results[0] as Grant | undefined;
}

/** Prepare archival statements for explicitly rejected checkout grants. */
function rejectedGrantStatements(env: Env, capabilityHash: string) {
  // The account coordinator serializes this rollover. Archive only a proven
  // preflight rejection with no dispatch or effect; never renew uncertain writes.
  const rejected =
    "capability_hash=? AND ongoing=1 AND state='blocked' AND json_extract(result_json,'$.state') IN ('selection_unavailable','restart_required','checkout_not_started') AND EXISTS(SELECT 1 FROM attempts a WHERE a.id=native_checkout_grants.attempt_id AND a.state='prepared' AND a.association_json IS NULL) AND NOT EXISTS(SELECT 1 FROM dispatches d WHERE d.attempt_id=native_checkout_grants.attempt_id) AND NOT EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=native_checkout_grants.attempt_id)";
  const db = env.STATE.withSession("first-primary");
  return [
    db
      .prepare(
        `INSERT INTO rejected_native_checkout_grants SELECT * FROM native_checkout_grants WHERE ${rejected}`,
      )
      .bind(capabilityHash),
    db
      .prepare(
        `DELETE FROM native_checkout_grants WHERE ${rejected} AND EXISTS(SELECT 1 FROM rejected_native_checkout_grants h WHERE h.attempt_id=native_checkout_grants.attempt_id AND h.capability_hash=native_checkout_grants.capability_hash)`,
      )
      .bind(capabilityHash),
  ];
}
/** Archive a rejected grant without discarding dispatched effects. */
export async function archiveRejectedCustomerGrant(
  env: Env,
  capabilityHash: string,
) {
  const db = env.STATE.withSession("first-primary");
  const results = await db.batch([
    ...rejectedGrantStatements(env, capabilityHash),
    db
      .prepare("SELECT 1 FROM native_checkout_grants WHERE capability_hash=?")
      .bind(capabilityHash),
  ]);
  return results.at(-1)!.results.length > 0;
}

// Called only after preparation rejects its one-use window, before execution.
// Read existing ownership first; availability never resolves a dispatched write.
/** Distinguish a rejected preparation from an attempt requiring recovery. */
export async function rejectedCheckoutReadback(
  request: Request,
  value: unknown,
  options: ReadOptions,
) {
  const input = nativePrepareSchema.parse(value);
  const access = await authenticate(request, options.env, Date.now());
  const replay = await preparationRejection(
    options.env,
    input.key,
    access.owner_id,
  );
  if (replay) {
    if (replay.inputHash !== (await digest(JSON.stringify(input))))
      throw new ApiError(409, "native_attempt_unavailable");
    await authenticate(request, options.env, Date.now());
    return {
      code:
        replay.selectionRejection.state === "selection_unavailable"
          ? "checkout_selection_unavailable"
          : "checkout_window_unresolved",
      ...(replay.selectionRejection.rejectedSessionIndices
        ? { selectionRejection: replay.selectionRejection }
        : {}),
    };
  }
  const db = options.env.STATE.withSession("first-primary");
  const [original, active] = await db.batch<{
    id: string;
    intent_json?: string;
    association_json?: string | null;
    owner_id?: string;
    state?: string;
    effects?: number;
    intent_hash?: string;
    hold_expires_ms?: number;
    hold_association_json?: string;
    hold_intent_hash?: string;
    payment_reason?: string;
  }>([
    db
      .prepare(
        "SELECT a.id,a.owner_id,a.state,a.association_json,(EXISTS(SELECT 1 FROM dispatches d WHERE d.attempt_id=a.id) OR EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id) OR EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=a.id)) AS effects FROM attempts a WHERE a.id=?",
      )
      .bind(input.key),
    db
      .prepare(
        "SELECT a.id,a.state,a.intent_json,a.intent_hash,a.association_json,h.expires_ms AS hold_expires_ms,h.association_json AS hold_association_json,h.intent_hash AS hold_intent_hash,p.reason AS payment_reason FROM native_checkout_grants g JOIN attempts a ON a.id=g.attempt_id LEFT JOIN hitpay_holds h ON h.attempt_id=a.id LEFT JOIN hitpay_payments p ON p.attempt_id=a.id WHERE g.capability_hash=? AND a.owner_id=? LIMIT 1",
      )
      .bind(access.capability_hash, access.owner_id),
  ]);
  await authenticate(request, options.env, Date.now());
  const retained = original.results[0];
  if (retained) return { code: "checkout_recovery_required" };
  /** Retain no-dispatch proof independently of provider classification availability. */
  const reject = async (
    code: string,
    selectionRejection: CheckoutSelectionRejection = {
      state: "restart_required",
    },
  ) => {
    const proof = await retainPreparationRejection(
      request,
      options.env,
      input,
      access,
      selectionRejection,
    );
    if (!proof) throw new ApiError(503, "checkout_recovery_required");
    return {
      code,
      ...(proof.selectionRejection.rejectedSessionIndices
        ? { selectionRejection: proof.selectionRejection }
        : {}),
    };
  };
  const owned = active.results[0];
  if (owned) {
    // An owned attempt for another studio start, or an unobserved write, cannot
    // establish that this selection is occupied. Never disclose its details.
    if (
      typeof owned.intent_json !== "string" ||
      (!owned.association_json && owned.state !== "recovery_required")
    )
      return reject("checkout_already_active");
    if (typeof owned.association_json === "string")
      associationSchema.parse(JSON.parse(owned.association_json));
    const intent = intentSchema.parse(JSON.parse(owned.intent_json));
    const indexes = input.sessions.flatMap((session, index) =>
      intent.sessions.some(
        (existing) =>
          Math.abs(existing.startMs - session.startMs) <
          START_INTERVAL_MINUTES * 60000,
      )
        ? [index]
        : [],
    );
    if (!indexes.length) return reject("checkout_already_active");
    if (
      typeof owned.association_json === "string" &&
      owned.hold_association_json === owned.association_json &&
      owned.hold_intent_hash === owned.intent_hash &&
      (owned.hold_expires_ms ?? 0) > Date.now() &&
      owned.payment_reason !== "hitpay_unpaid_verified"
    )
      return reject("checkout_selection_unavailable", {
        state: "selection_unavailable",
        rejectedSessionIndices: indexes,
      });
  }
  const days = new Map<
    string,
    Awaited<ReturnType<typeof windowAvailability>>
  >();
  for (const session of input.sessions) {
    const date = new Date(session.startMs + 28800000)
      .toISOString()
      .slice(0, 10);
    let day = days.get(date);
    if (!day) {
      try {
        day = await windowAvailability({
          ...options,
          date,
          serviceId: providerServiceIds(options.env).primary,
          fresh: true,
        });
      } catch {
        return reject("checkout_window_unresolved");
      }
      days.set(date, day);
    }
    if (
      !day.offers.some(
        (offer) =>
          offer.serviceId === session.serviceId &&
          offer.instructorId === session.instructorId &&
          offer.startMs === session.startMs,
      )
    ) {
      await authenticate(request, options.env, Date.now());
      return reject("checkout_selection_unavailable");
    }
  }
  await authenticate(request, options.env, Date.now());
  return reject("checkout_window_unresolved");
}
