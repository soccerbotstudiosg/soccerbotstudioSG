import { z } from "zod";
import { authenticate } from "./access";
import { ApiError, digest, keyedHash } from "./policy";

export { keyedHash } from "./policy";
import {
  rememberedIssuance,
  replaceRememberedIdentity,
  clearRememberedCookie,
  rememberedConsentSql,
} from "./remembered-identity";
const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));
const challengeInput = z.strictObject({
  email: emailSchema,
  botToken: z.string().min(1).max(2048),
});
const verifyInput = z.strictObject({
  challengeId: z.string().uuid(),
  remember: z.boolean().default(false),
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/),
});
const purpose = "verify-email";
// Server-owned dependencies, never derived from a request's mode/URL/flags.
// Delivery composition requires explicit environment-owned sender and bot scope.
export type IdentityDelivery = {
  pepper: string;
  source: string;
  hostname: string;
  verifyBot(
    token: string,
    signal: AbortSignal,
  ): Promise<{
    success: boolean;
    hostname: string;
    action: string;
    challengeAtMs: number;
  }>;
  send(
    input: { email: string; code: string; idempotencyKey: string },
    signal: AbortSignal,
  ): Promise<{ accepted: boolean }>;
  now?: () => number;
};
function denied() {
  return new ApiError(400, "verification_unavailable");
}
function randomCode() {
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= 4294000000);
  return String(value[0] % 1000000).padStart(6, "0");
}
/** Bound an identity operation by its permitted duration. */
async function bounded<T>(work: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => work(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("identity_transport_unknown"));
        }, 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

/** Read the next permitted request time from durable session/IP/email limits and observed denials. */
async function identityRequestWindow(
  env: Env,
  ownerId: string,
  sourceHash: string,
  emailHash: string,
  now: number,
) {
  const session = env.STATE.withSession("first-primary");
  const observed = await session
    .prepare(
      "SELECT blocked_until_ms FROM identity_request_denials WHERE owner_id=? AND blocked_until_ms>?",
    )
    .bind(ownerId, now)
    .first<{ blocked_until_ms: number }>();
  if (observed)
    return {
      resendAfter: observed.blocked_until_ms,
      requestLimited: true,
      observedDenial: true,
    };
  const row = await session
    .prepare(
      `SELECT MAX(deadline) AS deadline, MAX(request_limited) AS request_limited FROM (
        SELECT last_request_ms+CASE request_count WHEN 3 THEN 600000 ELSE 120000 END AS deadline,
          CASE WHEN request_count=3 AND last_request_ms+600000>? THEN 1 ELSE 0 END AS request_limited
        FROM identity_request_counters WHERE (scope='session' AND subject_key=?)
          OR (scope='source' AND subject_key=? AND request_count=3)
          OR (scope='email' AND subject_key=?)
        UNION ALL
        SELECT blocked_until_ms AS deadline, CASE WHEN blocked_until_ms>? THEN 1 ELSE 0 END AS request_limited
          FROM identity_request_denials WHERE owner_id=?
      )`,
    )
    .bind(now, ownerId, sourceHash, emailHash, now, ownerId)
    .first<{ deadline: number | null; request_limited: number | null }>();
  return {
    resendAfter: Math.max(now, row?.deadline ?? now),
    requestLimited: row?.request_limited === 1,
    observedDenial: false,
  };
}
/** Preserve an observed shared-subject block for the session without extending its original deadline. */
async function retainIdentityDenial(
  env: Env,
  ownerId: string,
  deadline: number,
  now: number,
) {
  const session = env.STATE.withSession("first-primary");
  const retained = await session
    .prepare(
      "INSERT INTO identity_request_denials(owner_id,blocked_until_ms) VALUES(?,?) ON CONFLICT(owner_id) DO UPDATE SET blocked_until_ms=excluded.blocked_until_ms WHERE identity_request_denials.blocked_until_ms<=? RETURNING blocked_until_ms",
    )
    .bind(ownerId, deadline, now)
    .first<{ blocked_until_ms: number }>();
  if (retained) return retained.blocked_until_ms;
  // A concurrent observer may already have retained its winning active deadline.
  // The conditional UPSERT makes that conflict read-only instead of rewriting it.
  const existing = await session
    .prepare(
      "SELECT blocked_until_ms FROM identity_request_denials WHERE owner_id=? AND blocked_until_ms>?",
    )
    .bind(ownerId, now)
    .first<{ blocked_until_ms: number }>();
  if (!existing) throw new ApiError(503, "identity_unavailable");
  return existing.blocked_until_ms;
}

/** Keep request-limit timing separate from the customer-facing message. */
function requestLimited(retryAt: number, now: number) {
  return new ApiError(
    429,
    "verification_request_limited",
    undefined,
    Math.max(1, Math.ceil((retryAt - now) / 1000)),
  );
}

/** Issue a rate-limited email challenge after validating bot proof. */
export async function requestIdentityChallenge(
  request: Request,
  env: Env,
  raw: unknown,
  delivery: IdentityDelivery,
) {
  const input = challengeInput.safeParse(raw);
  if (!input.success) throw denied();
  const clock = delivery.now ?? Date.now;
  const access = await authenticate(request, env, clock());
  if (!delivery.source || delivery.source.length > 128 || !delivery.hostname)
    throw new ApiError(503, "identity_unavailable");
  const emailHash = await keyedHash(delivery.pepper, [
    "email",
    input.data.email,
  ]);
  const sourceHash = await keyedHash(delivery.pepper, [
    "source",
    delivery.source,
  ]);
  const beforeProof = clock();
  const retryAt = await identityRequestWindow(
    env,
    access.owner_id,
    sourceHash,
    emailHash,
    beforeProof,
  );
  if (retryAt.resendAfter > beforeProof) {
    const deadline =
      retryAt.requestLimited && !retryAt.observedDenial
        ? await retainIdentityDenial(
            env,
            access.owner_id,
            retryAt.resendAfter,
            beforeProof,
          )
        : retryAt.resendAfter;
    throw requestLimited(deadline, beforeProof);
  }
  const proof = await bounded((signal) =>
    delivery.verifyBot(input.data.botToken, signal),
  );
  const now = clock();
  if (
    !proof.success ||
    proof.hostname !== delivery.hostname ||
    proof.action !== purpose ||
    !Number.isSafeInteger(proof.challengeAtMs) ||
    proof.challengeAtMs > now ||
    now - proof.challengeAtMs >= 300000
  )
    throw denied();
  const id = crypto.randomUUID(),
    code = randomCode();
  const expires = Math.min(now + 600000, access.expires_ms);
  if (expires <= now) throw denied();
  const codeHash = await keyedHash(delivery.pepper, [
    purpose,
    id,
    access.capability_hash,
    input.data.email,
    code,
  ]);
  let inserted: D1Result<{ id: string }>[];
  try {
    inserted = await env.STATE.batch<{ id: string }>([
      env.STATE.prepare("INSERT INTO identity_bot_tokens VALUES(?,?)").bind(
        await digest(input.data.botToken),
        now,
      ),
      env.STATE.prepare(
        "INSERT INTO identity_challenges(id,owner_id,access_hash,email,email_hash,source_hash,code_hash,created_ms,expires_ms,state) SELECT ?,?,?,?,?,?,?,?,?,'reserved' WHERE EXISTS(SELECT 1 FROM guest_access WHERE capability_hash=? AND owner_id=? AND revoked_ms IS NULL AND issued_ms<=? AND expires_ms>?) RETURNING id",
      ).bind(
        id,
        access.owner_id,
        access.capability_hash,
        input.data.email,
        emailHash,
        sourceHash,
        codeHash,
        now,
        expires,
        access.capability_hash,
        access.owner_id,
        now,
        now,
      ),
      env.STATE.prepare(
        "UPDATE identity_challenges SET state='superseded' WHERE access_hash=? AND id<>? AND state IN ('reserved','sent','unknown') AND EXISTS(SELECT 1 FROM identity_challenges WHERE id=?)",
      ).bind(access.capability_hash, id, id),
      env.STATE.prepare(
        "UPDATE verified_identity SET revoked_ms=? WHERE access_hash=? AND EXISTS(SELECT 1 FROM identity_challenges WHERE id=?)",
      ).bind(now, access.capability_hash, id),
    ]);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "";
    if (reason.includes("identity_request_limited")) {
      const checkedAt = clock();
      const window = await identityRequestWindow(
        env,
        access.owner_id,
        sourceHash,
        emailHash,
        checkedAt,
      );
      const deadline =
        window.requestLimited && !window.observedDenial
          ? await retainIdentityDenial(
              env,
              access.owner_id,
              window.resendAfter,
              checkedAt,
            )
          : window.resendAfter;
      throw requestLimited(deadline, checkedAt);
    }
    if (reason.includes("identity_bot_tokens.token_hash"))
      throw new ApiError(400, "verification_unavailable");
    throw new ApiError(503, "identity_unavailable");
  }
  if (inserted[1].results.length !== 1 || inserted[1].results[0].id !== id)
    throw denied();
  // Unknown mail delivery is retained under this challenge; no retry or replay.
  let accepted = false;
  try {
    await authenticate(request, env, clock());
    if (clock() < expires)
      accepted =
        (
          await bounded((signal) =>
            delivery.send(
              {
                email: input.data.email,
                code,
                idempotencyKey: `verification/${id}`,
              },
              signal,
            ),
          )
        ).accepted === true;
  } catch {
    /* The durable reservation remains authoritative. */
  }
  await env.STATE.prepare(
    "UPDATE identity_challenges SET state=? WHERE id=? AND state='reserved'",
  )
    .bind(accepted ? "sent" : "unknown", id)
    .run();
  // A delayed send can observe a later request's shared-IP/email block. Persist that
  // observed deadline before responding, just as for a rejected request.
  const observedAt = clock();
  const window = await identityRequestWindow(
    env,
    access.owner_id,
    sourceHash,
    emailHash,
    observedAt,
  );
  if (window.requestLimited && !window.observedDenial)
    await retainIdentityDenial(
      env,
      access.owner_id,
      window.resendAfter,
      observedAt,
    );
  // Successful responses expose the normal next-attempt timer, not guaranteed
  // admission. A subsequent denied request reveals the enforced remaining block.
  // Same envelope for unknown/existing/shared addresses and uncertain delivery.
  return {
    challengeId: id,
    expiresAt: expires,
    requestLimited: false,
    resendAfter: now + 120000,
  };
}

/** Verify the challenge and issue the permitted customer identity state. */
export async function verifyIdentityChallenge(
  request: Request,
  env: Env,
  raw: unknown,
  pepper: string,
  clock: () => number = Date.now,
  cookies: string[] = [],
) {
  const input = verifyInput.safeParse(raw);
  if (!input.success) throw denied();
  const access = await authenticate(request, env, clock());
  const { challengeId, email, code } = input.data;
  const hash = await keyedHash(pepper, [
    purpose,
    challengeId,
    access.capability_hash,
    email,
    code,
  ]);
  const now = clock();
  const issuance = input.data.remember
    ? await rememberedIssuance(env, access, email, now, challengeId)
    : null;
  const replaceRemembered = await replaceRememberedIdentity(
    request,
    env,
    now,
    challengeId,
  );
  // Wrong codes consume attempts atomically. Only the single matching transition
  // can establish a session; replay/concurrent followers cannot renew expiry.
  const result = await env.STATE.batch([
    env.STATE.prepare(
      "UPDATE identity_challenges SET attempts=attempts+1,state=CASE WHEN code_hash=? THEN 'consumed' ELSE state END WHERE id=? AND access_hash=? AND email=? AND state='sent' AND attempts<5 AND created_ms>COALESCE((SELECT cutoff_ms FROM identity_revocations WHERE email=identity_challenges.email),-1) AND created_ms<=? AND expires_ms>? AND EXISTS(SELECT 1 FROM guest_access WHERE capability_hash=? AND revoked_ms IS NULL AND issued_ms<=? AND expires_ms>?) RETURNING state",
    ).bind(
      hash,
      challengeId,
      access.capability_hash,
      email,
      now,
      now,
      access.capability_hash,
      now,
      now,
    ),
    env.STATE.prepare(
      "INSERT INTO verified_identity(access_hash,owner_id,email,verified_ms,expires_ms,revoked_ms) SELECT access_hash,owner_id,email,?,MIN(?,?),NULL FROM identity_challenges WHERE id=? AND code_hash=? AND state='consumed' AND changes()=1 ON CONFLICT(access_hash) DO UPDATE SET email=excluded.email,verified_ms=excluded.verified_ms,expires_ms=excluded.expires_ms,revoked_ms=NULL",
    ).bind(now, now + 1800000, access.expires_ms, challengeId, hash),
    ...(issuance?.statements ?? []),
    replaceRemembered,
  ]);
  if (result[1].meta.changes !== 1) throw denied();
  if (issuance) {
    if (result[2].meta.changes !== 1 || result[3].meta.changes !== 1)
      throw denied();
    cookies.push(issuance.cookie);
  } else cookies.push(clearRememberedCookie());
  return readVerifiedIdentity(request, env, clock());
}

/** Read current verified identity without exposing unrelated customer records. */
export async function readVerifiedIdentity(
  request: Request,
  env: Env,
  now: number,
) {
  const access = await authenticate(request, env, now);
  const row = await env.STATE.withSession("first-primary")
    .prepare(
      `SELECT email,expires_ms AS expiresAt,${rememberedConsentSql} AS remember FROM verified_identity v WHERE access_hash=? AND owner_id=? AND revoked_ms IS NULL AND verified_ms<=? AND expires_ms>?`,
    )
    .bind(
      env.APP_ORIGIN,
      env.DEPLOYMENT_ACCOUNT_ID,
      now,
      now,
      access.capability_hash,
      access.owner_id,
      now,
      now,
    )
    .first<{ email: string; expiresAt: number; remember: number }>();
  return row ? { ...row, remember: row.remember === 1 } : null;
}

// An authenticated email never authorizes a directory listing. Missing/shared
// matches return no prefill. A future provider mapper supplies only exact matches.
/** Resolve contact details only under current verified identity. */
export function verifiedContact(email: string, matches: unknown) {
  const parsed = z
    .array(
      z.strictObject({
        email: emailSchema,
        name: z.string().min(1).max(200),
        phone: z.string().max(40),
      }),
    )
    .max(2)
    .safeParse(matches);
  if (
    !parsed.success ||
    parsed.data.length !== 1 ||
    parsed.data[0].email !== emailSchema.parse(email)
  )
    return null;
  return { name: parsed.data[0].name, phone: parsed.data[0].phone };
}
