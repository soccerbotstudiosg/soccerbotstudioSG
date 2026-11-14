import { emailSchema } from "../src/domain/contact";
import { identitySenderSchema, turnstileSecretName } from "./policy";
import { z } from "zod";
import { authenticate } from "./access";
import { verifyBindings } from "./bindings";
import { ApiError, liveCustomerAccess } from "./policy";
import {
  keyedHash,
  requestIdentityChallenge,
  verifyIdentityChallenge,
} from "./identity";
import { identityRequest } from "./provider-transport";
import { edgeAddress } from "./reservation-abuse";

const unavailable = () => new ApiError(503, "identity_unavailable");
const windowSchema = z.object({
  singleton: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  source_revision: z.string().regex(/^[a-f0-9]{40}$/),
  origin: z.url(),
  sender: z.literal("SoccerBotStudioSG Dev <noreply@auth.app404.ai>"),
  recipient: z.literal("sheng@app404.ai"),
  opened_ms: z.number().int().safe().nonnegative(),
  expires_ms: z.number().int().safe().positive(),
  state: z.literal("open"),
});
function secret(env: Env, name: string) {
  const value: unknown = Reflect.get(env, name);
  if (
    typeof value !== "string" ||
    value.length < 32 ||
    value.length > 512 ||
    /\s/.test(value)
  )
    throw unavailable();
  return value;
}
/** Resolve the authorized email-delivery window for this request. */
async function windowFor(env: Env, now: number, reserve = false) {
  const mode: unknown = Reflect.get(env, "IDENTITY_DELIVERY");
  if (mode === "ongoing") {
    if (!liveCustomerAccess(env)) throw unavailable();
    const configuredSender = identitySenderSchema.safeParse(
      Reflect.get(env, "IDENTITY_SENDER"),
    );
    if (String(env.ENVIRONMENT) === "production" && !configuredSender.success)
      throw unavailable();
    return {
      singleton: 0,
      origin: env.APP_ORIGIN,
      sender: configuredSender.success
        ? configuredSender.data
        : "SoccerBotStudioSG Dev <noreply@auth.app404.ai>",
      recipient: null,
    };
  }
  if (mode !== "finite-test") throw unavailable();
  const parsed = windowSchema.safeParse(
    await env.STATE.withSession("first-primary")
      .prepare(
        "SELECT * FROM identity_delivery_window ORDER BY singleton DESC LIMIT 1",
      )
      .first(),
  );
  if (!parsed.success) throw unavailable();
  const window = parsed.data;
  if (
    window.source_revision !== env.SOURCE_REVISION ||
    window.origin !== env.APP_ORIGIN ||
    window.opened_ms > now ||
    window.expires_ms <= now + (reserve ? 5000 : 0) ||
    window.expires_ms - window.opened_ms >
      (window.singleton === 3 ? 3600000 : 1200000)
  )
    throw unavailable();
  return window;
}
// A provisioned finite-test proof also bounds identity reads and restoration.
/** Enforce the configured identity-proof window for reads and restoration. */
export async function assertIdentityProofOpen(env: Env) {
  const mode: unknown = Reflect.get(env, "IDENTITY_DELIVERY");
  if (mode === "ongoing") {
    await windowFor(env, Date.now());
    return;
  }
  const proof = await env.STATE.withSession("first-primary")
    .prepare("SELECT singleton FROM identity_delivery_window WHERE singleton=3")
    .first();
  if (proof) await windowFor(env, Date.now());
}
// Bounded before parsing, and never includes request bodies or provider errors in logs.
/** Read and validate the bounded identity request payload. */
export async function inputBody(
  request: Request,
  maximumBytes = 4096,
): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json" ||
    !request.body
  )
    throw new ApiError(400, "verification_unavailable");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });
  let size = 0,
    text = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > maximumBytes)
            throw new ApiError(413, "verification_unavailable");
          text += decoder.decode(part.value, { stream: true });
        }
        return JSON.parse(text + decoder.decode()) as unknown;
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new ApiError(408, "verification_unavailable")),
          1000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}
/** Dispatch authorized identity operations under delivery and abuse limits. */
export async function identityDelivery(
  request: Request,
  env: Env,
  cookies: string[] = [],
) {
  if (request.method !== "POST")
    throw new ApiError(405, "operation_unavailable");
  await verifyBindings(env);
  const access = await authenticate(request, env, Date.now());
  const window = await windowFor(env, Date.now());
  const pepper = secret(env, "IDENTITY_PEPPER");
  const raw = await inputBody(request);
  const email = z.object({ email: emailSchema }).safeParse(raw);
  if (
    !email.success ||
    (window.recipient !== null && email.data.email !== window.recipient)
  )
    throw new ApiError(400, "verification_unavailable");
  if (new URL(request.url).pathname === "/api/identity/verify") {
    const result = await verifyIdentityChallenge(
      request,
      env,
      raw,
      pepper,
      Date.now,
      cookies,
    );
    if ((await windowFor(env, Date.now())).singleton !== window.singleton)
      throw unavailable();
    return result;
  }
  // CF-Connecting-IP is supplied by the Worker edge, never X-Forwarded-For or JSON.
  const source = edgeAddress(request);
  const sourceHash = await keyedHash(pepper, ["delivery-source", source]);
  const resendKey = secret(env, "RESEND_API_KEY");
  const botKey = secret(env, turnstileSecretName(env));
  /** Read when the active source or hourly transport budget permits another dispatch. */
  async function dispatchRetryAt(kind: "bot" | "email", now: number) {
    const session = env.STATE.withSession("first-primary");
    const source = await session
      .prepare(
        "SELECT created_ms+60000 AS deadline FROM identity_delivery_dispatches WHERE ?='bot' AND kind='bot' AND source_hash=? AND created_ms>? ORDER BY created_ms DESC LIMIT 1 OFFSET 2",
      )
      .bind(kind, sourceHash, now - 60000)
      .first<{ deadline: number }>();
    const global =
      window.singleton === 0
        ? await session
            .prepare(
              "SELECT created_ms+3600000 AS deadline FROM identity_delivery_dispatches WHERE ongoing=1 AND kind=? AND created_ms>? ORDER BY created_ms DESC LIMIT 1 OFFSET ?",
            )
            .bind(kind, now - 3600000, kind === "bot" ? 119 : 59)
            .first<{ deadline: number }>()
        : null;
    return Math.max(now, source?.deadline ?? now, global?.deadline ?? now);
  }
  /** Dispatch the authorized identity action within its delivery window. */
  async function dispatch(
    kind: "bot" | "email",
    id: string,
    payload: Record<string, string>,
    signal: AbortSignal,
  ) {
    signal.throwIfAborted();
    await authenticate(request, env, Date.now());
    if ((await windowFor(env, Date.now(), true)).singleton !== window.singleton)
      throw unavailable();
    try {
      await env.STATE.prepare(
        window.singleton === 0
          ? "INSERT INTO identity_delivery_dispatches(id,kind,access_hash,source_hash,created_ms,state,ongoing) VALUES(?,?,?,?,?,'reserved',1)"
          : "INSERT INTO identity_delivery_dispatches(id,kind,access_hash,source_hash,created_ms,state) VALUES(?,?,?,?,?,'reserved')",
      )
        .bind(id, kind, access.capability_hash, sourceHash, Date.now())
        .run();
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      if (reason.includes("identity_delivery_limited")) {
        const now = Date.now();
        const retryAt = await dispatchRetryAt(kind, now);
        throw new ApiError(
          429,
          "verification_service_limited",
          undefined,
          retryAt > now ? Math.ceil((retryAt - now) / 1000) : undefined,
        );
      }
      if (reason.includes("identity_delivery_dispatches.id"))
        throw new ApiError(400, "verification_unavailable");
      throw unavailable();
    }
    let state = "unknown";
    try {
      // Re-sample time and access after durable reservation; an unknown slot is never refunded.
      await authenticate(request, env, Date.now());
      if (
        (await windowFor(env, Date.now(), true)).singleton !== window.singleton
      )
        throw unavailable();
      signal.throwIfAborted();
      const result = await identityRequest(
        kind,
        kind === "bot" ? botKey : resendKey,
        payload,
        signal,
      );
      state = "responded";
      return result;
    } finally {
      await env.STATE.prepare(
        "UPDATE identity_delivery_dispatches SET state=? WHERE id=? AND state='reserved'",
      )
        .bind(state, id)
        .run();
    }
  }
  return requestIdentityChallenge(request, env, raw, {
    pepper,
    source,
    hostname: new URL(window.origin).hostname,
    verifyBot: async (token, signal) => {
      if (window.singleton === 0) {
        const now = Date.now();
        const retryAt = Math.max(
          await dispatchRetryAt("bot", now),
          await dispatchRetryAt("email", now),
        );
        if (retryAt > now)
          throw new ApiError(
            429,
            "verification_service_limited",
            undefined,
            Math.ceil((retryAt - now) / 1000),
          );
      }
      const id = await keyedHash(pepper, ["bot-dispatch", token]);
      const body = await dispatch("bot", id, { token }, signal);
      const proof = z
        .object({
          success: z.literal(true),
          hostname: z.string(),
          action: z.string(),
          challenge_ts: z.string(),
        })
        .safeParse(body);
      if (!proof.success) throw new ApiError(400, "verification_unavailable");
      return {
        success: true,
        hostname: proof.data.hostname,
        action: proof.data.action,
        challengeAtMs: Date.parse(proof.data.challenge_ts),
      };
    },
    send: async (message, signal) => {
      if (window.recipient !== null && message.email !== window.recipient)
        throw unavailable();
      const body = await dispatch(
        "email",
        message.idempotencyKey,
        {
          recipient: message.email,
          sender: window.sender,
          code: message.code,
          idempotencyKey: message.idempotencyKey,
        },
        signal,
      );
      return {
        accepted: z.object({ id: z.string().uuid() }).safeParse(body).success,
      };
    },
  });
}
