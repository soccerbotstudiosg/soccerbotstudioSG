import { z } from "zod";
import { ApiError } from "./policy";

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
type Authority =
  | { kind: "operator"; capabilityHash: string; grantJson: string }
  | {
      kind: "correlated_rpc_rejection";
      rpcCode: -32053 | -32054;
      dispatchFence: number;
    };

/** Atomically retire one exact attempt only after explicit no-creation evidence. */
export async function recordNoCreation(
  env: Env,
  input: Proof,
  authority: Authority,
) {
  const proof = proofSchema.parse(input);
  const now = Date.now();
  if (proof.verifiedMs > now || proof.dispatchFence > proof.version)
    return false;
  const operator = authority.kind === "operator";
  if (
    !operator &&
    (authority.dispatchFence !== proof.dispatchFence ||
      ![-32053, -32054].includes(authority.rpcCode))
  )
    return false;
  const source = operator
    ? "operator_verified_provider"
    : "correlated_rpc_rejection";
  const reference = operator
    ? proof.evidenceReference
    : `book:${authority.rpcCode}:${proof.evidenceReference}`;
  if (reference.length > 128) return false;
  const db = env.STATE.withSession("first-primary");
  const guard = `a.id=? AND a.intent_hash=? AND a.version=? AND a.state IN ('dispatching','recovery_required')
    AND a.association_json IS NULL AND a.observation_json IS NULL
    AND EXISTS(SELECT 1 FROM dispatches d WHERE d.attempt_id=a.id AND d.operation='booking.create' AND d.outcome='unknown' AND d.fence=? AND d.started_ms<=?)
    AND EXISTS(SELECT 1 FROM native_checkout_grants g WHERE g.attempt_id=a.id AND g.intent_hash=a.intent_hash)
    AND NOT EXISTS(SELECT 1 FROM no_creation_resolutions n WHERE n.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id AND (e.outcome='observed' OR e.reference_id IS NOT NULL))
    AND NOT EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM hitpay_holds h WHERE h.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM checkout_progress c WHERE c.attempt_id=a.id)
    AND NOT EXISTS(SELECT 1 FROM invoice_documents i WHERE i.attempt_id=a.id)
    ${
      operator
        ? "AND EXISTS(SELECT 1 FROM developer_operations o WHERE o.capability_hash=? AND o.operation='native_creation_resolution' AND o.state='granted' AND o.expires_ms>? AND o.result_json=?)"
        : "AND json_array_length(a.intent_json,'$.sessions')=1 AND EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id AND e.step='session:0' AND e.outcome='unknown' AND e.reference_id IS NULL) AND NOT EXISTS(SELECT 1 FROM session_effects e WHERE e.attempt_id=a.id AND e.step!='session:0')"
    }`;
  const terminal = JSON.stringify({
    state: "recovery_required",
    paymentAvailable: false,
    creationResolution: { state: "not_created" },
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
  return results[1].meta.changes === 1;
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
        ? { creationResolution: { state: "not_created" } }
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
      "SELECT 1 FROM no_creation_resolutions n JOIN attempts a ON a.id=n.attempt_id WHERE a.id=? AND a.owner_id=? AND a.intent_hash=n.intent_hash AND a.version=n.attempt_version AND a.association_json IS NULL AND a.observation_json IS NULL",
    )
    .bind(id, owner)
    .first();
  return found ? { state: "not_created" as const } : undefined;
}
