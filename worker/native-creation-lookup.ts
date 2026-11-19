import { intentSchema } from "./journal";
import { lookupUnknownCreationEvidence } from "./native-creation-lookup-evidence";
import { retainedCreationMarkers } from "./native-creation-marker";
import { reconcileKnownCreation } from "./native-creation-positive";
import {
  creationLookupLease,
  type CreationLookupClaim,
  recordNoCreation,
} from "./native-creation-resolution";
import { digest, liveCustomerAccess, sandboxPolicy } from "./policy";
import { nativeAccountContractSchema } from "./prebooking";
import type { ProviderControl, ProviderSession } from "./provider-session";
import { providerSecrets } from "./provider-transport";

const pending = { state: "pending" as const };
const resolved = { state: "resolved" as const };

/** Reconcile only the original dispatched booking under the current durable claim. */
export async function reconcileUnknownCreation(
  env: Env,
  id: string,
  provider: ProviderSession,
  control: ProviderControl,
  claim: CreationLookupClaim,
) {
  const db = env.STATE.withSession("first-primary");
  const row = await db
    .prepare(
      `SELECT a.intent_json,a.intent_hash,a.owner_id,a.association_json IS NOT NULL AS associated,a.version,d.fence,g.contract_json,g.creation_markers_json,c.first_empty_ms,c.book_rpc_code,c.book_rpc_id,
       (SELECT count(*) FROM session_effects e WHERE e.attempt_id=a.id AND (e.step='native-booking-key' OR e.step GLOB 'native-booking-key:[0-9]*') AND e.outcome='observed') AS retained_keys
       FROM attempts a JOIN native_checkout_grants g ON g.attempt_id=a.id
       JOIN dispatches d ON d.attempt_id=a.id LEFT JOIN native_creation_checks c ON c.attempt_id=a.id AND c.intent_hash=a.intent_hash AND c.dispatch_fence=d.fence
       WHERE a.id=? AND a.version=? AND a.state='recovery_required' AND a.observation_json IS NULL
       AND d.operation='booking.create' AND ((a.association_json IS NULL AND d.outcome='unknown') OR (a.association_json IS NOT NULL AND d.outcome='observed')) AND g.ongoing=1 AND a.intent_hash=g.intent_hash
       AND EXISTS(SELECT 1 FROM checkout_payment_routes p WHERE p.attempt_id=a.id AND p.route='hitpay') AND ${creationLookupLease}`,
    )
    .bind(
      id,
      claim.attempt_version,
      claim.claimant,
      claim.generation,
      Date.now(),
    )
    .first<{
      intent_json: string;
      intent_hash: string;
      owner_id: string;
      associated: number;
      retained_keys: number;
      version: number;
      fence: number;
      contract_json: string;
      creation_markers_json: string | null;
      first_empty_ms: number | null;
      book_rpc_code: number | null;
      book_rpc_id: string | null;
    }>();
  if (!row) return pending;
  const policy = sandboxPolicy(env);
  const intent = intentSchema.parse(JSON.parse(row.intent_json));
  const contract = nativeAccountContractSchema.parse(
    JSON.parse(row.contract_json),
  );
  if (
    !liveCustomerAccess(env) ||
    intent.customerMode !== "booking-contact" ||
    intent.customerId !== row.owner_id ||
    intent.accountId !== policy.DEPLOYMENT_ACCOUNT_ID ||
    intent.environmentId !== policy.ENVIRONMENT ||
    contract.accountId !== intent.accountId ||
    contract.environmentId !== intent.environmentId ||
    contract.companyLogin !== providerSecrets(env).company ||
    (await digest(row.intent_json)) !== row.intent_hash
  )
    return pending;
  if (row.retained_keys === intent.sessions.length) {
    const positive = await reconcileKnownCreation(
      env,
      id,
      provider,
      control,
      claim,
    );
    return positive === "associated" ? resolved : pending;
  }
  if (row.associated) return pending;
  const started = Date.now();
  if (row.first_empty_ms !== null && started < row.first_empty_ms + 5000)
    return pending;
  await provider.identity(env, control);
  const evidence = await lookupUnknownCreationEvidence({
    intent,
    marker: retainedCreationMarkers(
      contract.recoveryIntakeField,
      row.creation_markers_json,
      intent.sessions.length,
    ),
    exchange: (operation, signal) =>
      provider.nativeRead(env, control, operation, signal),
    signal: AbortSignal.timeout(12000),
  });
  const checked = Date.now();
  const available =
    evidence.windowsAvailable === null
      ? null
      : Number(evidence.windowsAvailable);
  const eligible = evidence.match === "empty" && available !== null;
  const recorded = await db
    .prepare(
      `INSERT INTO native_creation_checks(attempt_id,intent_hash,dispatch_fence,list_result,windows_available,checked_ms,first_empty_ms)
       SELECT a.id,a.intent_hash,?,?,?,?,? FROM attempts a WHERE a.id=? AND a.version=? AND a.intent_hash=? AND a.state='recovery_required' AND a.association_json IS NULL AND a.observation_json IS NULL AND ${creationLookupLease}
       ON CONFLICT(attempt_id) DO UPDATE SET list_result=excluded.list_result,windows_available=excluded.windows_available,checked_ms=excluded.checked_ms,
       first_empty_ms=CASE WHEN excluded.first_empty_ms IS NULL OR native_creation_checks.book_rpc_ended_ms IS NULL OR native_creation_checks.book_rpc_ended_ms>? THEN NULL
       WHEN native_creation_checks.windows_available=excluded.windows_available THEN COALESCE(native_creation_checks.first_empty_ms,excluded.first_empty_ms) ELSE excluded.first_empty_ms END
       WHERE native_creation_checks.intent_hash=excluded.intent_hash AND native_creation_checks.dispatch_fence=excluded.dispatch_fence`,
    )
    .bind(
      row.fence,
      evidence.match,
      available,
      checked,
      eligible && row.book_rpc_id !== null ? checked : null,
      id,
      row.version,
      row.intent_hash,
      claim.claimant,
      claim.generation,
      checked,
      started,
    )
    .run();
  if (
    recorded.meta.changes !== 1 ||
    !eligible ||
    row.first_empty_ms === null ||
    row.book_rpc_code === null ||
    row.book_rpc_id === null
  )
    return pending;
  const retired = await recordNoCreation(
    env,
    {
      attemptId: id,
      intentHash: row.intent_hash,
      version: row.version,
      dispatchFence: row.fence,
      verifiedMs: checked,
      evidenceReference: row.book_rpc_id,
      processingFinished: true,
      noBookingCreated: true,
    },
    {
      kind: "correlated_rpc_search",
      rpcCode: row.book_rpc_code,
      requestId: row.book_rpc_id,
      dispatchFence: row.fence,
      claim,
    },
  );
  return retired ? resolved : pending;
}
