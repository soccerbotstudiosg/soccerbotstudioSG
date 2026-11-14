import { authenticate } from "./access";
import { ApiError, identitySenderSchema, liveCustomerAccess } from "./policy";
import { intentSchema } from "./journal";
import { identityRequest } from "./provider-transport";
import { z } from "zod";
import { dateLabel, endTime, money } from "../src/domain/dates";

/** Send one staff report for an owned unresolved booking attempt. */
export async function requestBookingHelp(
  request: Request,
  env: Env,
  attemptId: string,
  now = Date.now(),
) {
  if (!liveCustomerAccess(env)) throw new ApiError(503, "support_unavailable");
  const access = await authenticate(request, env, now);
  const db = env.STATE.withSession("first-primary");
  const attempt = await db
    .prepare(
      "SELECT intent_json,association_json,state,created_ms,EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=a.id AND p.paid_ms IS NOT NULL) AS paid FROM attempts a WHERE id=? AND owner_id=? AND NOT EXISTS(SELECT 1 FROM no_creation_resolutions r WHERE r.attempt_id=a.id)",
    )
    .bind(attemptId, access.owner_id)
    .first<{
      intent_json: string;
      association_json: string | null;
      state: string;
      created_ms: number;
      paid: number;
    }>();
  if (!attempt) throw new ApiError(404, "support_unavailable");
  const intent = intentSchema.parse(JSON.parse(attempt.intent_json));
  if (
    !intent.contact ||
    now < attempt.created_ms + 30000 ||
    !["dispatching", "observed", "recovery_required"].includes(attempt.state)
  )
    throw new ApiError(409, "support_unavailable");
  const sender = identitySenderSchema.safeParse(
    Reflect.get(env, "IDENTITY_SENDER"),
  );
  const key: unknown = Reflect.get(env, "RESEND_API_KEY");
  if (
    !sender.success ||
    typeof key !== "string" ||
    key.length < 20 ||
    /\s/.test(key)
  )
    throw new ApiError(503, "support_unavailable");
  await db
    .prepare(
      "INSERT OR IGNORE INTO booking_support_reports(attempt_id,created_ms,category,state,next_ms) VALUES(?,?,?,'pending',0)",
    )
    .bind(
      attemptId,
      now,
      attempt.paid
        ? "payment_confirmation_pending"
        : attempt.association_json
          ? "checkout_unconfirmed"
          : "booking_unconfirmed",
    )
    .run();
  const report = await db
    .prepare(
      "SELECT created_ms,category,state,next_ms FROM booking_support_reports WHERE attempt_id=?",
    )
    .bind(attemptId)
    .first<{
      created_ms: number;
      category: string;
      state: string;
      next_ms: number;
    }>();
  if (!report) throw new ApiError(503, "support_unavailable");
  if (report.state === "sent") return { status: "sent" as const };
  // Resend retains idempotency keys for 24 hours. Do not replay an uncertain send beyond that window.
  if (now - report.created_ms >= 23 * 3600000)
    throw new ApiError(503, "support_unavailable");
  const claim = await db
    .prepare(
      "UPDATE booking_support_reports SET next_ms=? WHERE attempt_id=? AND state='pending' AND next_ms<=? RETURNING attempt_id",
    )
    .bind(now + 30000, attemptId, now)
    .first();
  if (!claim) throw new ApiError(429, "support_retry_later", undefined, 30);
  const contact = intent.contact;
  // Build report content from retained evidence; callers cannot choose recipients.
  const text = [
    "Customer requested booking help",
    "",
    `Attempt: ${attemptId}`,
    `Stage: ${report.category}`,
    `Requested: ${new Date(report.created_ms).toISOString()}`,
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone}`,
    `Preferred contact: ${contact.contactMethod}`,
    "",
    "Selected sessions (Singapore time):",
    ...intent.sessions.map((session) => {
      const wall = new Date(session.startMs + 8 * 3600000).toISOString();
      const time = wall.slice(11, 16);
      return `${dateLabel(wall.slice(0, 10))}, ${time}–${endTime(time)} SGT; service ${session.serviceId}; trainer ${session.instructorId}; ${session.players} player(s)`;
    }),
    "",
    `Booking amount: SGD ${money(intent.totalMinor)}`,
    "Check the original attempt and provider records before making changes. This report does not prove failure or nonpayment.",
  ].join("\n");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    z.object({ id: z.string().uuid() }).parse(
      await identityRequest(
        "support",
        key,
        {
          sender: sender.data,
          text,
          idempotencyKey: `booking-support/${attemptId}`,
        },
        controller.signal,
      ),
    );
    await db
      .prepare(
        "UPDATE booking_support_reports SET state='sent',sent_ms=? WHERE attempt_id=? AND state='pending'",
      )
      .bind(now, attemptId)
      .run();
    return { status: "sent" as const };
  } catch {
    throw new ApiError(503, "support_unavailable");
  } finally {
    clearTimeout(timer);
  }
}
