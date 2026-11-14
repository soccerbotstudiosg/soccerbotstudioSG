import { z } from "zod";
import { enquiryErrors } from "../src/domain/enquiry";
import { emailSchema } from "../src/domain/contact";
import { verifyBindings } from "./bindings";
import { inputBody } from "./identity-delivery";
import { identityRequest } from "./provider-transport";
import { edgeAddress } from "./reservation-abuse";
import {
  ApiError,
  digest,
  identitySenderSchema,
  keyedHash,
  liveCustomerAccess,
  turnstileSecretName,
} from "./policy";

const inputSchema = z.strictObject({
  key: z.string().uuid(),
  botToken: z.string().max(2048),
  values: z.strictObject({
    name: z.string().trim().max(80),
    email: emailSchema,
    phone: z.string().trim().max(64),
    organisation: z.string().trim().max(120),
    purpose: z.string().trim().max(160),
    guests: z.string().max(3),
    date: z.string().max(10),
    time: z.string().max(5),
    message: z.string().trim().max(2000),
  }),
});
const botSchema = z.object({
  success: z.literal(true),
  action: z.literal("send-enquiry"),
  hostname: z.string(),
  challenge_ts: z.iso.datetime({ offset: true }),
});
type EnquiryRow = {
  input_hash: string;
  created_ms: number;
  state: "pending" | "sent";
  verified_ms: number | null;
};
const unavailable = () => new ApiError(503, "enquiry_unavailable");
const retryLater = () =>
  new ApiError(429, "enquiry_retry_later", undefined, 30);

/** Read a configured delivery secret without exposing its value. */
function deliverySecret(env: Env, name: string) {
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

/** Submit one public enquiry through existing bot and mail admission controls. */
export async function submitEnquiry(request: Request, env: Env) {
  if (request.method !== "POST")
    throw new ApiError(405, "operation_unavailable");
  const deliveryMode: unknown = Reflect.get(env, "IDENTITY_DELIVERY");
  if (!liveCustomerAccess(env) || deliveryMode !== "ongoing")
    throw unavailable();
  await verifyBindings(env);
  const sender = identitySenderSchema.safeParse(
    Reflect.get(env, "IDENTITY_SENDER"),
  );
  if (!sender.success) throw unavailable();
  const mailKey = deliverySecret(env, "RESEND_API_KEY");
  const botKey = deliverySecret(env, turnstileSecretName(env));
  const pepper = deliverySecret(env, "IDENTITY_PEPPER");
  let raw: unknown;
  try {
    raw = await inputBody(request, 16384);
  } catch (error) {
    throw new ApiError(
      error instanceof ApiError ? error.status : 400,
      "enquiry_invalid",
    );
  }
  const input = inputSchema.safeParse(raw);
  if (!input.success || Object.keys(enquiryErrors(input.data.values)).length)
    throw new ApiError(400, "enquiry_invalid");
  const { key, botToken, values } = input.data;
  const inputHash = await digest(
    JSON.stringify({ sender: sender.data, values }),
  );
  const sourceHash = await keyedHash(pepper, [
    "delivery-source",
    edgeAddress(request),
  ]);
  const subjectHash = await keyedHash(pepper, ["enquiry-request", key]);
  const db = env.STATE.withSession("first-primary");
  const read = () =>
    db
      .prepare(
        "SELECT input_hash,created_ms,state,verified_ms FROM enquiry_requests WHERE request_key=?",
      )
      .bind(key)
      .first<EnquiryRow>();
  const previous = await read();
  if (previous?.input_hash && previous.input_hash !== inputHash)
    throw new ApiError(409, "enquiry_changed");
  if (previous?.state === "sent") return { status: "sent" as const };
  const now = Date.now();
  // Resend retains idempotency keys for 24 hours; uncertain sends never cross that window.
  if (previous && now - previous.created_ms >= 23 * 3600000)
    throw unavailable();
  const claim = crypto.randomUUID();
  const botDispatch = crypto.randomUUID();
  let claimed: EnquiryRow | undefined;
  try {
    const results = await db.batch<EnquiryRow>([
      db
        .prepare(
          "INSERT OR IGNORE INTO enquiry_requests(request_key,input_hash,created_ms,state) VALUES(?,?,?,'pending')",
        )
        .bind(key, inputHash, now),
      db
        .prepare(
          "UPDATE enquiry_requests SET claim_id=?,next_ms=? WHERE request_key=? AND input_hash=? AND state='pending' AND next_ms<=? AND created_ms>? RETURNING input_hash,created_ms,state,verified_ms",
        )
        .bind(claim, now + 30000, key, inputHash, now, now - 23 * 3600000),
      // The shared admission trigger rolls back the claim and new row if the bot budget is closed.
      db
        .prepare(
          "INSERT INTO identity_delivery_dispatches(id,kind,access_hash,source_hash,created_ms,state,ongoing) SELECT ?,'bot',?,?,?,'reserved',1 WHERE EXISTS(SELECT 1 FROM enquiry_requests WHERE request_key=? AND claim_id=? AND verified_ms IS NULL)",
        )
        .bind(botDispatch, subjectHash, sourceHash, now, key, claim),
    ]);
    claimed = results[1].results[0];
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("identity_delivery_limited")
    )
      throw retryLater();
    throw unavailable();
  }
  if (!claimed) {
    const current = await read();
    if (current?.input_hash !== inputHash)
      throw new ApiError(409, "enquiry_changed");
    if (current.state === "sent") return { status: "sent" as const };
    throw retryLater();
  }
  /** Complete one reserved transport slot without refunding uncertain work. */
  async function dispatch(
    kind: "bot" | "enquiry",
    id: string,
    payload: Record<string, string>,
  ) {
    let state = "unknown";
    try {
      const value = await identityRequest(
        kind,
        kind === "bot" ? botKey : mailKey,
        payload,
        AbortSignal.timeout(8000),
      );
      state = "responded";
      return value;
    } finally {
      await db
        .prepare(
          "UPDATE identity_delivery_dispatches SET state=? WHERE id=? AND state='reserved'",
        )
        .bind(state, id)
        .run();
    }
  }
  try {
    if (claimed.verified_ms === null) {
      if (!botToken) throw new ApiError(400, "enquiry_verification_required");
      const proof = botSchema.safeParse(
        await dispatch("bot", botDispatch, { token: botToken }),
      );
      const issued = proof.success ? Date.parse(proof.data.challenge_ts) : NaN;
      const checkedAt = Date.now();
      if (
        !proof.success ||
        proof.data.hostname !== new URL(env.APP_ORIGIN).hostname ||
        !Number.isSafeInteger(issued) ||
        issued > checkedAt ||
        issued + 300000 <= checkedAt
      )
        throw new ApiError(400, "enquiry_verification_required");
      const stored = await db
        .prepare(
          "UPDATE enquiry_requests SET verified_ms=?,token_hash=? WHERE request_key=? AND claim_id=? AND state='pending' AND next_ms>? AND verified_ms IS NULL RETURNING request_key",
        )
        .bind(checkedAt, await digest(botToken), key, claim, checkedAt)
        .first();
      if (!stored) throw unavailable();
    }
    const mailDispatch = crypto.randomUUID();
    const reserved = await db
      .prepare(
        "INSERT INTO identity_delivery_dispatches(id,kind,access_hash,source_hash,created_ms,state,ongoing) SELECT ?,'email',?,?,?,'reserved',1 WHERE EXISTS(SELECT 1 FROM enquiry_requests WHERE request_key=? AND claim_id=? AND state='pending' AND verified_ms IS NOT NULL AND next_ms>?)",
      )
      .bind(
        mailDispatch,
        subjectHash,
        sourceHash,
        Date.now(),
        key,
        claim,
        Date.now(),
      )
      .run();
    if (reserved.meta.changes !== 1) throw unavailable();
    const text = [
      "Website enquiry",
      "",
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone}`,
      `Organisation: ${values.organisation || "Not provided"}`,
      `Enquiry type: ${values.purpose}`,
      `Guests: ${values.guests || "Not provided"}`,
      `Preferred date: ${values.date || "Not provided"}`,
      `Preferred time (SGT): ${values.time || "Not provided"}`,
      "",
      values.message,
    ].join("\n");
    z.object({ id: z.string().uuid() }).parse(
      await dispatch("enquiry", mailDispatch, {
        sender: sender.data,
        replyTo: values.email,
        text,
        idempotencyKey: `enquiry/${key}`,
      }),
    );
    const sent = await db
      .prepare(
        "UPDATE enquiry_requests SET state='sent',sent_ms=? WHERE request_key=? AND claim_id=? AND state='pending' RETURNING request_key",
      )
      .bind(Date.now(), key, claim)
      .first();
    if (!sent) throw unavailable();
    return { status: "sent" as const };
  } catch (error) {
    if (error instanceof ApiError && error.code.startsWith("enquiry_"))
      throw error;
    if (
      error instanceof Error &&
      error.message.includes("enquiry_requests.token_hash")
    )
      throw new ApiError(400, "enquiry_verification_required");
    if (
      error instanceof Error &&
      error.message.includes("identity_delivery_limited")
    )
      throw retryLater();
    throw unavailable();
  }
}
