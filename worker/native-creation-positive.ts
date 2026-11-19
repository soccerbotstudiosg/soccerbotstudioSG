import {
  CHECKING_BUFFER_MS,
  HOLD_WINDOW_MS,
  PAYMENT_WINDOW_MS,
  RECOVERY_BUFFER_MS,
} from "../src/domain/booking-policy";
import type { Access } from "./access";
import { hitpaySetting } from "./hitpay-contract";
import { hitpayHoldStatement } from "./hitpay-hold";
import { prepareHitpay } from "./hitpay-journal";
import { intentSchema } from "./journal";
import {
  nativeCheckoutDeadline,
  readRecoverableNativeAssociation,
  type NativeScope,
} from "./native-adapter";
import type { CreationLookupClaim } from "./native-creation-resolution";
import { ongoingReadbackEnabled } from "./ongoing-readback";
import { ApiError, digest, providerCredentialName } from "./policy";
import { nativeAccountContractSchema } from "./prebooking";
import type { ProviderControl, ProviderSession } from "./provider-session";
import { providerSecrets } from "./provider-transport";

const eligibility = `FROM attempts a
  JOIN dispatches d ON d.attempt_id=a.id AND d.operation='booking.create' AND ((a.association_json IS NULL AND d.outcome='unknown') OR (a.association_json IS NOT NULL AND d.outcome='observed'))
  JOIN native_checkout_grants g ON g.attempt_id=a.id AND g.intent_hash=a.intent_hash AND g.ongoing=1
  JOIN guest_access c ON c.capability_hash=g.capability_hash AND c.owner_id=a.owner_id
  JOIN checkout_payment_routes route ON route.attempt_id=a.id AND route.route='hitpay'
  JOIN recovery_work r ON r.attempt_id=a.id AND r.attempt_version=a.version
  LEFT JOIN checkout_progress p ON p.attempt_id=a.id
  WHERE a.id=? AND a.state='recovery_required' AND a.observation_json IS NULL AND a.version=?
    AND r.state='claimed' AND r.claimant=? AND r.generation=? AND r.ready_ms>?
    AND g.state IN ('running','blocked') AND g.expires_ms>? AND a.deadline_ms>?
    AND c.revoked_ms IS NULL AND c.issued_ms<=? AND c.expires_ms>?
    AND NOT EXISTS(SELECT 1 FROM hitpay_holds WHERE attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM hitpay_payments WHERE attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=a.id)`;

/** Recover a verified booking and finish only its original, consented hosted checkout. */
export async function reconcileKnownCreation(
  env: Env,
  attemptId: string,
  provider: ProviderSession,
  control: ProviderControl,
  claim: CreationLookupClaim,
): Promise<"associated" | "pending" | "no_keys" | "manual_review"> {
  if (!ongoingReadbackEnabled(env)) return "pending";
  const parameters = (now: number) => [
    attemptId,
    claim.attempt_version,
    claim.claimant,
    claim.generation,
    now,
    now,
    now,
    now,
    now,
  ];
  const db = env.STATE.withSession("first-primary");
  const row = await db
    .prepare(
      `SELECT a.intent_json,a.intent_hash,a.association_json,c.owner_id,c.capability_hash,c.issued_ms,c.expires_ms,
    g.contract_json,json_type(g.result_json,'$.hostedCheckoutRequested') AS hosted_checkout,
    d.fence,COALESCE(p.booking_created_ms,d.started_ms) AS created_ms,p.payment_window_ms,p.hold_window_ms,
    (SELECT count(*) FROM session_effects e WHERE e.attempt_id=a.id AND (e.step='native-booking-key' OR e.step GLOB 'native-booking-key:[0-9]*') AND e.outcome='observed') AS keys
    ${eligibility}`,
    )
    .bind(...parameters(Date.now()))
    .first<
      Access & {
        intent_json: string;
        intent_hash: string;
        association_json: string | null;
        contract_json: string;
        hosted_checkout: string | null;
        fence: number;
        created_ms: number;
        payment_window_ms: number | null;
        hold_window_ms: number | null;
        keys: number;
      }
    >();
  if (!row) return "pending";
  if (!row.keys) return "no_keys";
  const intent = intentSchema.parse(JSON.parse(row.intent_json));
  const company = providerSecrets(env).company;
  const contract = nativeAccountContractSchema.parse(
    JSON.parse(row.contract_json),
  );
  if (
    row.keys !== intent.sessions.length ||
    intent.accountId !== env.DEPLOYMENT_ACCOUNT_ID ||
    intent.environmentId !== env.ENVIRONMENT ||
    intent.customerMode !== "booking-contact" ||
    intent.customerId !== row.owner_id ||
    contract.companyLogin !== company ||
    contract.accountId !== intent.accountId ||
    contract.environmentId !== intent.environmentId ||
    (await digest(row.intent_json)) !== row.intent_hash
  )
    return "pending";
  const scope: NativeScope = {
    attemptId,
    companyLogin: company,
    timezone: "Asia/Singapore",
    intent,
  };
  const secret = hitpaySetting(
    env,
    providerCredentialName(env, "SIGNING_SECRET"),
  );
  if (!secret || secret.includes("[")) return "pending";
  const signal = AbortSignal.timeout(15000);
  await provider.identity(env, control);
  const verified = await readRecoverableNativeAssociation({
    db: env.STATE,
    existingAssociation: row.association_json,
    scope,
    signingSecret: secret,
    signal,
    exchange: (operation, abort) =>
      provider.nativeRead(env, control, operation, abort),
  });
  if (verified.version !== claim.attempt_version) return "pending";
  const association =
    row.association_json ?? JSON.stringify(verified.association);
  const unpaid =
    verified.observation.invoice.status === "unpaid" &&
    verified.observation.bookings.every(
      (booking) => booking.status === "confirmed",
    );
  const version = claim.attempt_version + 1;
  const bindVerified = (
    now: number,
    publishObservation: boolean,
    payment = false,
  ) => {
    return [
      db
        .prepare(
          `UPDATE attempts SET ${row.association_json === null ? "association_json=?," : ""}observation_json=?,observation_ms=?,state=?,version=version+1
        WHERE association_json IS ? AND id IN (SELECT a.id ${eligibility}${payment ? " AND json_type(g.result_json,'$.hostedCheckoutRequested')='true'" : ""})`,
        )
        .bind(
          ...(row.association_json === null ? [association] : []),
          publishObservation ? JSON.stringify(verified.observation) : null,
          publishObservation ? verified.observedAtMs : null,
          unpaid ? "observed" : "recovery_required",
          row.association_json,
          ...parameters(now),
        ),
      ...(row.association_json === null
        ? [
            db
              .prepare(
                "UPDATE dispatches SET outcome='observed' WHERE attempt_id=? AND fence=? AND operation='booking.create' AND outcome='unknown' AND changes()=1 AND EXISTS(SELECT 1 FROM attempts WHERE id=? AND version=? AND association_json=?)",
              )
              .bind(attemptId, row.fence, attemptId, version, association),
          ]
        : []),
    ];
  };

  if (!unpaid) {
    const { invoice, bookings } = verified.observation;
    const reviewReason =
      invoice.status === "paid"
        ? "native_booking_paid_review"
        : (invoice.status === "cancelled" || invoice.status === "unpaid") &&
            !invoice.paymentReceived &&
            bookings.every((booking) => booking.status === "cancelled")
          ? "native_booking_cancelled_review"
          : null;
    signal.throwIfAborted();
    const now = Date.now();
    // Keep differing or transitional provider statuses available for another
    // signed read. Only the financial/booking match above can authorize payment.
    const results = await db.batch([
      ...bindVerified(now, reviewReason !== null),
      db
        .prepare(
          "UPDATE native_checkout_grants SET state='blocked',result_json=json_set(COALESCE(result_json,'{}'),'$.nativeCreationObservation',json(?)) WHERE attempt_id=? AND intent_hash=? AND changes()=1",
        )
        .bind(
          JSON.stringify({
            verifiedMs: verified.observedAtMs,
            invoiceStatus: invoice.status,
            paymentReceived: invoice.paymentReceived,
            bookingStatuses: bookings.map((booking) => booking.status),
          }),
          attemptId,
          row.intent_hash,
        ),
      ...(reviewReason
        ? [
            db
              .prepare(
                "UPDATE recovery_work SET state='manual_review',reason=?,updated_ms=?,ready_ms=?,claimant=NULL,attempt_version=NULL WHERE attempt_id=? AND state='claimed' AND claimant=? AND generation=? AND attempt_version=? AND changes()=1",
              )
              .bind(
                reviewReason,
                now,
                now,
                attemptId,
                claim.claimant,
                claim.generation,
                claim.attempt_version,
              ),
          ]
        : []),
    ]);
    if (results.some((result) => result.meta.changes !== 1))
      throw new ApiError(409, "native_recovery_fence_lost");
    return reviewReason ? "manual_review" : "pending";
  }
  // A missing original receipt timestamp is conservatively bounded by dispatch.
  // Computing the window at its original start also permits expired holds to be
  // accounted for without making a new payable deadline on recovery.
  const holdWindow = row.hold_window_ms ?? HOLD_WINDOW_MS;
  if (holdWindow !== 600000 && holdWindow !== 900000) return "pending";
  const holdEnd = nativeCheckoutDeadline(
    {
      invoiceId: verified.association.invoiceId,
      dueDatetime: verified.dueDatetime,
      handoffAtMs: row.created_ms,
      supervisionDeadlineMs: row.created_ms + holdWindow,
    },
    row.created_ms,
    holdWindow,
  );
  const payEnd = Math.min(
    holdEnd,
    row.created_ms + (row.payment_window_ms ?? PAYMENT_WINDOW_MS),
  );

  const commit = async (payment?: D1PreparedStatement) => {
    signal.throwIfAborted();
    const results = await db.batch([
      ...bindVerified(Date.now(), true, !!payment),
      ...(row.payment_window_ms === null
        ? [
            db
              .prepare(
                "INSERT INTO checkout_progress(attempt_id,booking_created_ms,payment_window_ms,hold_window_ms,checking_buffer_ms,recovery_buffer_ms) SELECT ?,?,?,?,?,? WHERE changes()=1",
              )
              .bind(
                attemptId,
                row.created_ms,
                PAYMENT_WINDOW_MS,
                HOLD_WINDOW_MS,
                CHECKING_BUFFER_MS,
                RECOVERY_BUFFER_MS,
              ),
          ]
        : []),
      hitpayHoldStatement(
        env,
        scope,
        association,
        row.intent_hash,
        holdEnd,
        version,
        "observed",
      ),
      db
        .prepare(
          "UPDATE native_checkout_grants SET state='complete',result_json=json_patch(json_remove(COALESCE(result_json,'{}'),'$.nativeCreationObservation'),?) WHERE attempt_id=? AND intent_hash=? AND state IN ('running','blocked') AND changes()=1",
        )
        .bind(
          JSON.stringify({
            attemptId,
            state: "associated",
            paymentAvailable: false,
          }),
          attemptId,
          row.intent_hash,
        ),
      ...(payment ? [payment] : []),
      db
        .prepare(
          "INSERT OR IGNORE INTO session_effects(attempt_id,step,outcome,reference_id) SELECT ?,'native-comments-pending','observed',? WHERE changes()=1",
        )
        .bind(attemptId, JSON.stringify(verified.association.bookingIds)),
    ]);
    if (results[0].meta.changes !== 1 || results.at(-2)?.meta.changes !== 1)
      throw new ApiError(409, "native_recovery_fence_lost");
  };
  if (row.hosted_checkout !== "true" || Date.now() + 80000 >= payEnd) {
    await commit();
  } else {
    let reserved = false;
    await prepareHitpay(
      env,
      scope,
      association,
      row.intent_hash,
      payEnd,
      async () => {
        signal.throwIfAborted();
        if (Date.now() + 80000 >= payEnd)
          throw new ApiError(409, "hitpay_hold_expired");
      },
      {
        access: row,
        chainedReservation: true,
        reserve: async (statement) => {
          await commit(statement);
          reserved = true;
        },
      },
    ).catch((error: unknown) => {
      // A lost hosted response is already owned by the durable HitPay journal.
      if (!reserved) throw error;
    });
  }
  return "associated";
}
