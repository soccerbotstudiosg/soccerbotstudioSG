import { z } from "zod";
import { authenticate, type Access } from "./access";
import { ApiError, digest, turnstileSecretName } from "./policy";
import { identityRequest } from "./provider-transport";
import { nativePrepareSchema } from "../src/domain/native-checkout";

const proofSchema = z.object({
  success: z.literal(true),
  hostname: z.string(),
  action: z.literal("create-checkout"),
  challenge_ts: z.iso.datetime({ offset: true }),
});
const required = () => new ApiError(400, "checkout_verification_required");
const unavailable = () =>
  new ApiError(503, "checkout_verification_unavailable");

/** Require action-bound bot proof only before a new customer attempt is prepared. */
export async function verifyCheckoutBotProof(
  request: Request,
  env: Env,
  input: z.infer<typeof nativePrepareSchema>,
  token: string | undefined,
  verifiedAccess?: Access,
) {
  const access =
    verifiedAccess ?? (await authenticate(request, env, Date.now()));
  const db = env.STATE.withSession("first-primary");
  // Existing attempts and permanently rejected keys retain their original
  // ownership/intent/state checks without a fresh interactive challenge.
  const [existing, retainedProof] = await db.batch<{
    owner_id?: string;
    original_key?: string;
    capability_hash?: string;
    input_hash?: string;
    expires_ms?: number;
  }>([
    db
      .prepare(
        "SELECT owner_id,idempotency_key AS original_key FROM attempts WHERE (owner_id=? AND idempotency_key=?) OR id=? UNION ALL SELECT owner_id,attempt_id AS original_key FROM checkout_preparation_rejections WHERE attempt_id=?",
      )
      .bind(access.owner_id, input.key, input.key, input.key),
    db
      .prepare(
        "SELECT capability_hash,input_hash,expires_ms FROM checkout_bot_proofs WHERE attempt_key=?",
      )
      .bind(input.key),
  ]);
  if (existing.results.length) {
    if (
      existing.results.some(
        (row) =>
          row.owner_id !== access.owner_id || row.original_key !== input.key,
      )
    )
      throw new ApiError(409, "native_attempt_unavailable");
    return;
  }
  const inputHash = await digest(JSON.stringify(input));
  const retained = retainedProof.results[0];
  if (retained) {
    if (
      retained.capability_hash !== access.capability_hash ||
      retained.input_hash !== inputHash
    )
      throw required();
    if ((retained.expires_ms ?? 0) > Date.now()) return;
  }
  if (typeof token !== "string" || !token.length || token.length > 2048)
    throw required();
  const secret: unknown = Reflect.get(env, turnstileSecretName(env));
  if (
    typeof secret !== "string" ||
    secret.length < 32 ||
    secret.length > 512 ||
    /\s/.test(secret)
  )
    throw unavailable();
  let raw: unknown;
  try {
    raw = await identityRequest(
      "bot",
      secret,
      { token },
      AbortSignal.timeout(10000),
    );
  } catch {
    throw unavailable();
  }
  const proof = proofSchema.safeParse(raw);
  const now = Date.now();
  if (
    !proof.success ||
    proof.data.hostname !== new URL(env.APP_ORIGIN).hostname
  )
    throw required();
  const issued = Date.parse(proof.data.challenge_ts);
  if (!Number.isSafeInteger(issued) || issued > now || issued + 300000 <= now)
    throw required();
  let accepted: unknown;
  try {
    accepted = await db
      .prepare(
        "INSERT INTO checkout_bot_proofs(attempt_key,capability_hash,input_hash,token_hash,verified_ms,expires_ms) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM guest_access WHERE capability_hash=? AND owner_id=? AND revoked_ms IS NULL AND issued_ms<=? AND expires_ms>?) ON CONFLICT(attempt_key) DO UPDATE SET token_hash=CASE WHEN checkout_bot_proofs.expires_ms<=excluded.verified_ms THEN excluded.token_hash ELSE checkout_bot_proofs.token_hash END,verified_ms=CASE WHEN checkout_bot_proofs.expires_ms<=excluded.verified_ms THEN excluded.verified_ms ELSE checkout_bot_proofs.verified_ms END,expires_ms=CASE WHEN checkout_bot_proofs.expires_ms<=excluded.verified_ms THEN excluded.expires_ms ELSE checkout_bot_proofs.expires_ms END WHERE checkout_bot_proofs.capability_hash=excluded.capability_hash AND checkout_bot_proofs.input_hash=excluded.input_hash RETURNING 1",
      )
      .bind(
        input.key,
        access.capability_hash,
        inputHash,
        await digest(token),
        now,
        issued + 300000,
        access.capability_hash,
        access.owner_id,
        now,
        now,
      )
      .first();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("checkout_bot_proofs.token_hash")
    )
      throw required();
    throw unavailable();
  }
  if (!accepted) throw required();
}
