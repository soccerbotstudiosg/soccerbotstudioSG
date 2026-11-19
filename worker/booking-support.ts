import { ADDRESS, CONTACT_METHODS } from "../src/domain/catalog";
import {
  bookingHelpHtml,
  rejectedBookingEmailNotice,
} from "./notification-template";
import { authenticate } from "./access";
import { retainedCreationResolution } from "./native-creation-resolution";
import {
  ApiError,
  digest,
  identitySenderSchema,
  liveCustomerAccess,
} from "./policy";
import { intentSchema } from "./journal";
import { identityRequest } from "./provider-transport";
import { z } from "zod";
import { dateLabel, endTime, money } from "../src/domain/dates";

/** Send one staff report and customer acknowledgement for an owned unresolved attempt. */
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
      "SELECT a.intent_json,a.intent_hash,a.association_json,a.state,a.created_ms,EXISTS(SELECT 1 FROM no_creation_resolutions n WHERE n.attempt_id=a.id) AS has_resolution,EXISTS(SELECT 1 FROM hitpay_payments p WHERE p.attempt_id=a.id AND p.paid_ms IS NOT NULL) AS paid FROM attempts a WHERE a.id=? AND a.owner_id=?",
    )
    .bind(attemptId, access.owner_id)
    .first<{
      intent_json: string;
      intent_hash: string;
      has_resolution: number;
      association_json: string | null;
      state: string;
      created_ms: number;
      paid: number;
    }>();
  if (!attempt) throw new ApiError(404, "support_unavailable");
  const resolved = attempt.has_resolution === 1;
  if (
    resolved &&
    (await retainedCreationResolution(env, attemptId, access.owner_id))
      ?.reason !== "contact_email_rejected"
  )
    throw new ApiError(404, "support_unavailable");
  const intent = intentSchema.parse(JSON.parse(attempt.intent_json));
  if (
    !intent.contact ||
    (resolved
      ? intent.customerMode !== "booking-contact" ||
        intent.customerId !== access.owner_id ||
        intent.accountId !== env.DEPLOYMENT_ACCOUNT_ID ||
        intent.environmentId !== env.ENVIRONMENT ||
        (await digest(attempt.intent_json)) !== attempt.intent_hash
      : now < attempt.created_ms + 30000) ||
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
  // A pre-resolution report for an ultimately uncreated booking can only have been
  // booking_unconfirmed. Any observed association or payment permanently excludes
  // no-creation. Keep new checkout-level help distinct so retries need no clock ordering.
  const category = attempt.paid
    ? "payment_confirmation_pending"
    : resolved || attempt.association_json
      ? "checkout_unconfirmed"
      : "booking_unconfirmed";
  const sameResolution =
    "EXISTS(SELECT 1 FROM no_creation_resolutions WHERE attempt_id=?)=?";
  await db
    .prepare(
      `INSERT OR IGNORE INTO booking_support_reports(attempt_id,created_ms,category,state,next_ms,notification_version) SELECT ?,?,?,'pending',0,1 WHERE ${sameResolution}`,
    )
    .bind(attemptId, now, category, attemptId, attempt.has_resolution)
    .run();
  const report = await db
    .prepare(
      "SELECT created_ms,category,state,next_ms,notification_version FROM booking_support_reports WHERE attempt_id=?",
    )
    .bind(attemptId)
    .first<{
      created_ms: number;
      category: string;
      notification_version: number;
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
      `UPDATE booking_support_reports SET next_ms=? WHERE attempt_id=? AND state='pending' AND next_ms<=? AND ${sameResolution} RETURNING attempt_id`,
    )
    .bind(now + 30000, attemptId, now, attemptId, attempt.has_resolution)
    .first();
  if (!claim) throw new ApiError(429, "support_retry_later", undefined, 30);
  const contact = intent.contact;
  const rejectionReport =
    resolved && report.category === "checkout_unconfirmed";
  const stage = rejectionReport ? "contact_email_rejected" : report.category;
  // Build report content from retained evidence; callers cannot choose recipients.
  const text = [
    "Customer requested booking help",
    "",
    `Attempt: ${attemptId}`,
    `Stage: ${stage}`,
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
    rejectionReport
      ? rejectedBookingEmailNotice +
        " Please help the customer check their booking email."
      : "Check the original attempt and provider records before making changes. This report does not prove failure or nonpayment.",
  ].join("\n");
  const acknowledgement = [
    `${report.notification_version === 1 ? "Hello" : "Hi"} ${contact.name},`,
    "",
    "Help has been requested. We will get back as soon as we can.",
    "",
    "Your selected sessions (Singapore time):",
    ...intent.sessions.map((session) => {
      const wall = new Date(session.startMs + 8 * 3600000).toISOString();
      const time = wall.slice(11, 16);
      return `${dateLabel(wall.slice(0, 10))}, ${time}–${endTime(time)} SGT; ${session.players} player(s)`;
    }),
    "",
    `Booking amount: SGD ${money(intent.totalMinor)}`,
    "",
    rejectionReport
      ? rejectedBookingEmailNotice +
        " The studio will help you check the email address before trying again."
      : "This email acknowledges your help request, not a confirmed booking. Please do not pay again while we check your original booking and payment status.",
    "You can reply to this email to contact the studio.",
    "",
    "SoccerBotStudio Singapore",
  ].join("\n");
  const fields: [string, string][] = [
    [
      "Help requested",
      new Date(report.created_ms).toLocaleString("en-SG", {
        timeZone: "Asia/Singapore",
        hour12: false,
      }) + " SGT",
    ],
    ["Full name", contact.name],
    ["Email address", contact.email],
    ["Mobile number", contact.phone],
    [
      "Preferred contact",
      Object.entries(CONTACT_METHODS).find(
        ([method]) => method === contact.contactMethod,
      )?.[1] ?? contact.contactMethod,
    ],
    ["Location", ADDRESS],
    [
      "Selected sessions (SGT)",
      intent.sessions
        .map((session) => {
          const wall = new Date(session.startMs + 8 * 3600000).toISOString();
          const time = wall.slice(11, 16);
          return `${dateLabel(wall.slice(0, 10))}, ${time}–${endTime(time)}; ${session.players} player(s)`;
        })
        .join("\n"),
    ],
    ["Booking amount", `SGD ${money(intent.totalMinor)}`],
  ];
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
          ...(report.notification_version === 1
            ? {
                html: bookingHelpHtml(
                  env.APP_ORIGIN,
                  stage,
                  contact.name,
                  [...fields, ["Internal attempt", attemptId]],
                  true,
                ),
              }
            : {}),
          idempotencyKey: `booking-support/${attemptId}`,
        },
        controller.signal,
      ),
    );
    // Both messages keep distinct stable keys. A partial/uncertain send retries
    // the original payloads within the existing bounded idempotency window.
    try {
      z.object({ id: z.string().uuid() }).parse(
        await identityRequest(
          "support-acknowledgement",
          key,
          {
            sender: sender.data,
            recipient: contact.email,
            text: acknowledgement,
            ...(report.notification_version === 1
              ? {
                  html: bookingHelpHtml(
                    env.APP_ORIGIN,
                    stage,
                    contact.name,
                    fields,
                    false,
                  ),
                }
              : {}),
            idempotencyKey: `booking-support-acknowledgement/${attemptId}`,
          },
          controller.signal,
        ),
      );
    } catch (error) {
      // Staff already has the request. Its booking contact may also be unreachable by email.
      if (!resolved) throw error;
    }
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
