import { z } from "zod";
import {
  checkoutSelectionRejectionSchema,
  nativePrepareSchema,
  type CheckoutSelectionRejection,
} from "../src/domain/native-checkout";
import {
  MAX_PLAYERS,
  MAX_BOOKING_SESSIONS,
} from "../src/domain/booking-policy";
import { authenticate, type Access } from "./access";
import { ApiError, digest, policy } from "./policy";

const summarySchema = z.strictObject({
  players: z.number().int().min(1).max(MAX_PLAYERS),
  totalMinor: z.number().int().nonnegative().safe(),
  currency: z.literal("SGD"),
  sessions: z
    .array(
      z.strictObject({
        startMs: z.number().int().positive().safe(),
        players: z.number().int().min(1).max(MAX_PLAYERS),
      }),
    )
    .min(1)
    .max(MAX_BOOKING_SESSIONS),
});

/** Read immutable rejection evidence without inferring safety from an absent attempt. */
export async function preparationRejection(
  env: Env,
  id: string,
  owner: string,
) {
  const row = await env.STATE.withSession("first-primary")
    .prepare(
      "SELECT input_hash,summary_json,rejection_json,recorded_ms FROM checkout_preparation_rejections WHERE attempt_id=? AND owner_id=? AND NOT EXISTS(SELECT 1 FROM attempts WHERE id=? OR (owner_id=? AND idempotency_key=?))",
    )
    .bind(id, owner, id, owner, id)
    .first<{
      input_hash: string;
      summary_json: string;
      rejection_json: string;
      recorded_ms: number;
    }>();
  if (!row) return undefined;
  const summary = summarySchema.parse(JSON.parse(row.summary_json));
  const selectionRejection = checkoutSelectionRejectionSchema.parse(
    JSON.parse(row.rejection_json),
  );
  if (
    (selectionRejection.rejectedSessionIndices ?? []).some(
      (index) => index >= summary.sessions.length,
    )
  )
    throw new ApiError(503, "preparation_rejection_unavailable");
  return {
    inputHash: row.input_hash,
    recordedMs: row.recorded_ms,
    summary,
    selectionRejection,
  };
}

/** Persist an exact rejected key only while no attempt or effect could have started. */
export async function retainPreparationRejection(
  request: Request,
  env: Env,
  value: unknown,
  access: Access,
  selectionRejection: CheckoutSelectionRejection,
) {
  const input = nativePrepareSchema.parse(value);
  const inputHash = await digest(JSON.stringify(input));
  const summary = summarySchema.parse({
    players: input.sessions[0].players,
    totalMinor: input.sessions.reduce(
      (total, session) => total + session.totalMinor,
      0,
    ),
    currency: "SGD",
    sessions: input.sessions.map(({ startMs, players }) => ({
      startMs,
      players,
    })),
  });
  const rejection = checkoutSelectionRejectionSchema.parse(selectionRejection);
  if (
    (rejection.rejectedSessionIndices ?? []).some(
      (index) => index >= input.sessions.length,
    )
  )
    throw new ApiError(503, "preparation_rejection_unavailable");
  await authenticate(request, env, Date.now());
  await env.STATE.withSession("first-primary")
    .prepare(
      "INSERT INTO checkout_preparation_rejections(attempt_id,owner_id,input_hash,summary_json,rejection_json,recorded_ms) SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM attempts WHERE id=? OR (owner_id=? AND idempotency_key=?)) ON CONFLICT(attempt_id) DO NOTHING",
    )
    .bind(
      input.key,
      access.owner_id,
      inputHash,
      JSON.stringify(summary),
      JSON.stringify(rejection),
      Date.now(),
      input.key,
      access.owner_id,
      input.key,
    )
    .run();
  const retained = await preparationRejection(env, input.key, access.owner_id);
  if (retained && retained.inputHash !== inputHash)
    throw new ApiError(409, "native_attempt_unavailable");
  await authenticate(request, env, Date.now());
  return retained;
}

/** Expose a no-payment context for an authenticated, permanently fenced rejected key. */
export async function preparationRejectionContext(
  request: Request,
  env: Env,
  id: string,
  access: Access,
) {
  const retained = await preparationRejection(env, id, access.owner_id);
  if (!retained) return undefined;
  await authenticate(request, env, Date.now());
  return {
    attemptId: id,
    mode: "live" as const,
    checkout: { state: "unavailable" as const },
    confirmation: undefined,
    selectionRejection: retained.selectionRejection,
    summary: retained.summary,
    checking: {
      deadlineMs: retained.recordedMs,
      nextCheckMs: retained.recordedMs,
      pollAfterMs: policy(env).POLL_INTERVAL_MS,
    },
  };
}
