import { z } from "zod";
import { ApiError } from "./policy";
import {
  isSingleBookPrecondition,
  type CompletedBookRpcError,
  type SingleBookPrecondition,
} from "./provider-transport";

const proofSchema = z.strictObject({
  attemptId: z.string().uuid(),
  intentHash: z.string().regex(/^[a-f0-9]{64}$/),
  version: z.number().int().nonnegative(),
  dispatchFence: z.number().int().positive(),
  verifiedMs: z.number().int().positive().safe(),
  evidenceReference: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/),
  processingFinished: z.literal(true),
  noBookingCreated: z.literal(true),
});
type Proof = z.infer<typeof proofSchema>;
export type CreationLookupClaim = {
  claimant: string;
  generation: number;
  attempt_version: number;
};
export const creationLookupLease =
  "EXISTS(SELECT 1 FROM recovery_work r WHERE r.attempt_id=a.id AND r.attempt_version=a.version AND r.state='claimed' AND r.claimant=? AND r.generation=? AND r.ready_ms>?)";
/** Bind a completed provider error to its exact outstanding dispatch before readback. */
export async function retainCompletedBookRpc(
  env: Env,
  id: string,
  hash: string,
  fence: number,
  error: CompletedBookRpcError,
) {
  await env.STATE.withSession("first-primary")
    .prepare(
      `INSERT INTO native_creation_checks(attempt_id,intent_hash,dispatch_fence,book_rpc_id,book_rpc_code,book_rpc_ended_ms)
       SELECT a.id,a.intent_hash,d.fence,?,?,? FROM attempts a JOIN dispatches d ON d.attempt_id=a.id
       WHERE a.id=? AND a.intent_hash=? AND d.operation='booking.create' AND d.outcome='unknown' AND d.fence=? AND d.started_ms<=?
       ON CONFLICT(attempt_id) DO UPDATE SET book_rpc_id=excluded.book_rpc_id,book_rpc_code=excluded.book_rpc_code,book_rpc_ended_ms=excluded.book_rpc_ended_ms,first_empty_ms=NULL
       WHERE native_creation_checks.intent_hash=excluded.intent_hash AND native_creation_checks.dispatch_fence=excluded.dispatch_fence AND native_creation_checks.book_rpc_id IS NULL`,
    )
    .bind(
      error.requestId,
      error.rpcCode,
      error.receivedAtMs,
      id,
      hash,
      fence,
      error.receivedAtMs,
    )
    .run();
}
type Authority =
  | {
      kind: "correlated_rpc_search";
      rpcCode: number;
      dispatchFence: number;
      requestId: string;
      claim: CreationLookupClaim;
    }
  | { kind: "operator"; capabilityHash: string; grantJson: string }
  | {
      kind: "correlated_rpc_rejection";
      rpcCode: SingleBookPrecondition;
      dispatchFence: number;
    };

/** Project only the actionable contact rejection from an immutable, correlated single-book proof. */
function publicCreationResolution(source: string, reference: string) {
  if (
    source === "correlated_rpc_rejection" &&
    reference.length === "book:-32062:".length + 36 &&
    /^book:-32062:[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      reference,
    )
  )
    return { state: "not_created", reason: "contact_email_rejected" } as const;
  return { state: "not_created" } as const;
}

/** Atomically retire one exact attempt only after explicit no-creation evidence. */
export async function recordNoCreation(
  env: Env,
  input: Proof,
  authority: Authority,
) {
  const proof = proofSchema.parse(input);
  const now = Date.now();
  if (proof.verifiedMs > now || proof.dispatchFence > proof.version)
    return undefined;
  const operator = authority.kind === "operator";
  if (
    !operator &&
    (authority.dispatchFence !== proof.dispatchFence ||
      (authority.kind === "correlated_rpc_rejection" &&
        !isSingleBookPrecondition(authority.rpcCode)))
  )
    return undefined;
  const source = operator
    ? "operator_verified_provider"
    : "correlated_rpc_rejection";
  const reference = operator
    ? proof.evidenceReference
    : authority.kind === "correlated_rpc_search"
      ? `book-search:${authority.rpcCode}:${authority.requestId}`
      : `book:${authority.rpcCode}:${proof.evidenceReference}`;
  if (reference.length > 128) return undefined;
  const db = env.STATE.withSession("first-primary");
  const guard = `a.id=? AND a.intent_hash=? AND a.version=? AND a.state IN ('dispatching','recovery_required')
    AND a.association_json IS NULL AND a.observation_json IS NULL
    AND EXISTS(SELECT 1 FROM dispatches d WHERE d.attempt_id=a.id AND d.operation='booking.create' AND d.outcome='unknown' AND d.fence=? AND d.started_ms<=?)
    AND EXISTS(SELECT 1 FROM native_checkout_grants g WHERE g.attempt_id=a.id AND g.intent_hash=a.intent_hash AND COALESCE(json_array_length(g.result_json,'$.holdEvidence'),0)=0)
    AND NOT EXISTS(SELECT 1 FROM no_creation_resolutions n WHERE n.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id AND (e.outcome='observed' OR e.reference_id IS NOT NULL))
    AND NOT EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM hitpay_holds h WHERE h.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM checkout_progress c WHERE c.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM invoice_documents i WHERE i.attempt_id=a.id)
    ${authority.kind === "correlated_rpc_search" ? `AND EXISTS(SELECT 1 FROM native_creation_checks c WHERE c.attempt_id=a.id AND c.intent_hash=a.intent_hash AND c.dispatch_fence=? AND c.book_rpc_id=? AND c.book_rpc_code=? AND c.book_rpc_ended_ms<=c.first_empty_ms AND c.list_result='empty' AND c.windows_available IS NOT NULL AND c.checked_ms=? AND c.checked_ms-c.first_empty_ms>=5000) AND ${creationLookupLease}` : ""}
    ${
      operator
        ? "AND EXISTS(SELECT 1 FROM developer_operations o WHERE o.capability_hash=? AND o.operation='native_creation_resolution' AND o.state='granted' AND o.expires_ms>? AND o.result_json=?)"
        : "AND json_array_length(a.intent_json,'$.sessions')=1 AND EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id AND e.step='session:0' AND e.outcome='unknown' AND e.reference_id IS NULL) AND NOT EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id AND e.step!='session:0')"
    }`;
  const creationResolution = publicCreationResolution(source, reference);
  const terminal = JSON.stringify({
    state: "recovery_required",
    paymentAvailable: false,
    creationResolution,
  });
  const results = await db.batch([
    db
      .prepare(
        `UPDATE attempts AS a SET version=version+1,state='recovery_required' WHERE ${guard}`,
      )
      .bind(
        proof.attemptId,
        proof.intentHash,
        proof.version,
        proof.dispatchFence,
        proof.verifiedMs,
        ...(authority.kind === "correlated_rpc_search"
          ? [
              proof.dispatchFence,
              authority.requestId,
              authority.rpcCode,
              proof.verifiedMs,
              authority.claim.claimant,
              authority.claim.generation,
              now,
            ]
          : []),
        ...(operator
          ? [authority.capabilityHash, now, authority.grantJson]
          : []),
      ),
    db
      .prepare(
        "INSERT INTO no_creation_resolutions SELECT id,intent_hash,version,?,?,?,?,?,? FROM attempts WHERE id=? AND version=? AND changes()=1",
      )
      .bind(
        proof.dispatchFence,
        source,
        reference,
        proof.verifiedMs,
        now,
        operator ? authority.capabilityHash : null,
        proof.attemptId,
        proof.version + 1,
      ),
    db
      .prepare(
        "UPDATE native_checkout_grants SET state='blocked',result_json=? WHERE attempt_id=? AND EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=? AND attempt_version=?)",
      )
      .bind(terminal, proof.attemptId, proof.attemptId, proof.version + 1),
    db
      .prepare(
        "INSERT INTO rejected_native_checkout_grants SELECT * FROM native_checkout_grants WHERE attempt_id=? AND EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=? AND attempt_version=?)",
      )
      .bind(proof.attemptId, proof.attemptId, proof.version + 1),
    db
      .prepare(
        "DELETE FROM native_checkout_grants WHERE attempt_id=? AND EXISTS(SELECT 1 FROM rejected_native_checkout_grants r JOIN no_creation_resolutions n ON n.attempt_id=r.attempt_id WHERE r.attempt_id=? AND n.attempt_version=?)",
      )
      .bind(proof.attemptId, proof.attemptId, proof.version + 1),
    db
      .prepare(
        "UPDATE recovery_work SET state='complete',reason='creation_not_created',generation=generation+1,claimant=NULL,attempt_version=NULL,updated_ms=? WHERE attempt_id=? AND EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=? AND attempt_version=?)",
      )
      .bind(now, proof.attemptId, proof.attemptId, proof.version + 1),
    ...(operator
      ? [
          db
            .prepare(
              "UPDATE developer_operations SET state=CASE WHEN EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=? AND operator_capability_hash=?) THEN 'complete' ELSE 'blocked' END,result_json=? WHERE capability_hash=? AND operation='native_creation_resolution' AND state='granted' AND result_json=?",
            )
            .bind(
              proof.attemptId,
              authority.capabilityHash,
              JSON.stringify({
                attemptId: proof.attemptId,
                reason: "creation_resolution_checked",
              }),
              authority.capabilityHash,
              authority.grantJson,
            ),
        ]
      : []),
  ]);
  return results[1].meta.changes === 1 ? creationResolution : undefined;
}

/** Consume only a pre-scoped private operator attestation, never customer input. */
export async function operatorCreationResolution(
  env: Env,
  hash: string,
  grantJson: string | null,
) {
  let input: unknown;
  try {
    input = JSON.parse(grantJson || "null");
  } catch {
    throw new ApiError(409, "creation_resolution_proof_invalid");
  }
  const parsed = proofSchema.safeParse(input);
  if (!parsed.success)
    throw new ApiError(409, "creation_resolution_proof_invalid");
  const resolved = await recordNoCreation(env, parsed.data, {
    kind: "operator",
    capabilityHash: hash,
    grantJson: grantJson!,
  });
  return {
    state: resolved ? "complete" : "blocked",
    result: {
      attemptId: parsed.data.attemptId,
      ...(resolved
        ? { creationResolution: resolved }
        : { reason: "creation_resolution_not_permitted" }),
    },
  };
}

/** Read immutable terminal evidence only for the exact authenticated owner. */
export async function retainedCreationResolution(
  env: Env,
  id: string,
  owner: string,
) {
  const found = await env.STATE.withSession("first-primary")
    .prepare(
      "SELECT n.evidence_source,n.evidence_reference FROM no_creation_resolutions n JOIN attempts a ON a.id=n.attempt_id WHERE a.id=? AND a.owner_id=? AND a.intent_hash=n.intent_hash AND a.version=n.attempt_version AND a.association_json IS NULL AND a.observation_json IS NULL",
    )
    .bind(id, owner)
    .first<{ evidence_source: string; evidence_reference: string }>();
  return found
    ? publicCreationResolution(found.evidence_source, found.evidence_reference)
    : undefined;
}
