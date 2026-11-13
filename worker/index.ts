import {
  nativePrepareSchema,
  checkoutSelectionRejectionSchema,
} from "../src/domain/native-checkout";
export { FoundationManagement } from "./foundation-management";
import {
  createConfirmationTrace,
  confirmationTraceKey,
  runConfirmationTrace,
  finishConfirmationTrace,
} from "./confirmation-tracing";
import { z } from "zod";
import { emailSchema } from "../src/domain/contact";
import { cachedEmailDomainStatus } from "./email-domain";
import { requestBookingHelp } from "./booking-support";
import { receiveHitpayWebhook } from "./hitpay-webhook";
import { bookingReceipt } from "./receipt";
import { webhookRoute } from "./webhook-contract";
import { captureWebhook } from "./webhook";
import { nativeCheckoutStatus, currentCustomerNative } from "./native-checkout";
import { coordinatorStub } from "./bindings";
import { runScheduledRecovery } from "./scheduled-recovery";
import { customerCatalogue } from "./customer-catalogue";
import {
  restoreRememberedIdentity,
  revokeAllIdentities,
  clearRememberedCookie,
  revokePresentedRemembered,
} from "./remembered-identity";
import { readVerifiedIdentity } from "./identity";
import { readContactProfile, saveContactProfile } from "./contact-profile";
import { inputBody } from "./identity-delivery";
import { identityDelivery, assertIdentityProofOpen } from "./identity-delivery";
import {
  createAccess,
  renewAccess,
  authenticateCheckout,
  authenticate,
  revokeAccess,
  clearAccessCookie,
} from "./access";
import { confirmation, checkoutContext } from "./confirmation";
import {
  ApiError,
  providerCredentialName,
  digest,
  policy,
  liveCustomerAccess,
  unwrapRpcOutcome,
} from "./policy";
import { verifyBindings, healthFoundation } from "./bindings";
import { traced, instrumentStorage, traceStatus } from "./diagnostics";
import { developerOperation } from "./developer-operation";
export {
  requestIdentityChallenge,
  verifyIdentityChallenge,
  readVerifiedIdentity,
  verifiedContact,
} from "./identity";
export { SoccerBotAccountCoordinator } from "./coordinator";
export {
  claimRecovery,
  completeRecovery,
  runRecoveryBatch,
  runNativeReadback,
  retentionPreview,
} from "./recovery";
export {
  nativeBookingOperations,
  readNativeAttempt,
  prepareNativeLink,
} from "./native-adapter";
export { orchestrateBooking } from "./orchestration";
// Journal operations are reachable only through trusted server composition, not HTTP.
export {
  prepareAttempt,
  claimDispatch,
  recordObservation,
  requireRecovery,
  bindAssociation,
} from "./journal";
const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};
export default {
  /** Run due recovery and configured display warming from the scheduler. */
  async scheduled(event: ScheduledController, env: Env) {
    event.noRetry();
    try {
      await runScheduledRecovery(env);
    } catch {
      console.error(
        JSON.stringify({ event: "scheduled_recovery_unavailable" }),
      );
    }
    try {
      if (liveCustomerAccess(env)) {
        await verifyBindings(env);
        await coordinatorStub(env).bookingComments();
      }
    } catch {
      console.error(JSON.stringify({ event: "booking_comments_deferred" }));
    }
    try {
      if (policy(env).PUBLIC_DISPLAY_WARMING === "enabled") {
        await verifyBindings(env);
        await coordinatorStub(env).warmDisplay();
      }
    } catch {
      console.error(JSON.stringify({ event: "display_refresh_unavailable" }));
    }
  },
  /** Route requests through environment, origin and operation-authority checks. */
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestStarted = performance.now();
    const correlationId = crypto.randomUUID(),
      url = new URL(request.url),
      now = Date.now();
    const checkingHeaders: Record<string, string> = {};
    const confirmationRead = async <T>(
      id: string,
      boundary: "status" | "context" | "receipt",
      operation: () => Promise<T>,
    ): Promise<T> => {
      const key = await confirmationTraceKey(id);
      const trace = createConfirmationTrace(correlationId);
      let failed = false;
      try {
        return await runConfirmationTrace(trace, boundary, operation);
      } catch (error) {
        failed = true;
        throw error;
      } finally {
        checkingHeaders["X-Recovery-Trace"] = key;
        checkingHeaders["Server-Timing"] =
          finishConfirmationTrace(trace, key, boundary, failed) +
          `, confirmation_http;dur=${Math.max(0, performance.now() - requestStarted).toFixed(2)}`;
      }
    };

    const json = (
      body: unknown,
      status = 200,
      extra: Record<string, string> = {},
    ) => {
      traceStatus(status);
      return new Response(JSON.stringify(body), {
        status,
        headers: {
          ...headers,
          ...checkingHeaders,
          "X-Request-ID": correlationId,
          ...extra,
        },
      });
    };
    return traced(correlationId, "http", async () => {
      try {
        if (!url.pathname.startsWith("/api")) {
          if (String(env.ENVIRONMENT) === "production") {
            policy(env);
            if (url.origin !== env.APP_ORIGIN)
              throw new ApiError(403, "origin_denied");
            if (request.method !== "GET" && request.method !== "HEAD")
              throw new ApiError(405, "method_not_allowed");
          }
          return env.ASSETS.fetch(request);
        }
        const configuration = policy(env);
        if (url.protocol !== "https:")
          throw new ApiError(400, "secure_transport_required");
        if (url.origin !== env.APP_ORIGIN)
          throw new ApiError(403, "origin_denied");
        if (
          request.headers.get("origin") &&
          request.headers.get("origin") !== env.APP_ORIGIN
        )
          throw new ApiError(403, "origin_denied");
        if (
          url.search &&
          !(
            (request.method === "GET" &&
              /^\/api\/booking\/availability\/[1-9]\d{0,14}\/\d{4}-\d{2}-\d{2}$/.test(
                url.pathname,
              ) &&
              url.search === "?refresh=1") ||
            (request.method === "POST" &&
              /^\/api\/booking\/native\/[a-f0-9-]{36}$/.test(url.pathname) &&
              url.search === "?hold=1")
          )
        )
          throw new ApiError(400, "unexpected_parameters");
        if (url.pathname === "/api/webhooks/hitpay") {
          return json(await receiveHitpayWebhook(request, env), 202);
        }
        if (webhookRoute(url.pathname)) {
          return json(await captureWebhook(request, env), 202);
        }
        if (
          request.method !== "GET" &&
          request.headers.get("origin") !== url.origin
        )
          throw new ApiError(403, "origin_denied");
        // Empty durable window and disabled deployment default keep delivery closed.
        if (
          ["/api/identity/challenges", "/api/identity/verify"].includes(
            url.pathname,
          )
        ) {
          const cookies: string[] = [];
          const response = json(await identityDelivery(request, env, cookies));
          for (const cookie of cookies)
            response.headers.append("Set-Cookie", cookie);
          return response;
        }
        const supportMatch = /^\/api\/attempts\/([a-f0-9-]{36})\/support$/.exec(
          url.pathname,
        );
        if (supportMatch) {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          return json(await requestBookingHelp(request, env, supportMatch[1]));
        }
        if (url.pathname === "/api/identity/email-domain") {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          await authenticate(request, env, Date.now());
          const input = z
            .strictObject({ email: emailSchema })
            .parse(await inputBody(request));
          const status = await cachedEmailDomainStatus(input.email);
          return json({ status }, status === "unavailable" ? 503 : 200);
        }
        if (url.pathname === "/api/identity/contact") {
          if (request.method !== "GET" && request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          await verifyBindings(env);
          await assertIdentityProofOpen(env);
          const result =
            request.method === "POST"
              ? await saveContactProfile(
                  request,
                  env,
                  await inputBody(request),
                  Date.now(),
                )
              : await readContactProfile(request, env, Date.now());
          await assertIdentityProofOpen(env);
          return json(result);
        }
        const holdMatch =
          /^\/api\/booking\/(hold|checkout)\/([a-f0-9-]{36})$/.exec(
            url.pathname,
          );
        if (holdMatch) {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          const value = bookingSelection(await inputBody(request));
          const checkoutAccess =
            holdMatch[1] === "checkout"
              ? await authenticateCheckout(
                  request,
                  {
                    ...env,
                    STATE: instrumentStorage(env.STATE, "d1"),
                  },
                  holdMatch[2],
                )
              : undefined;
          if (!checkoutAccess)
            await verifyBindings({
              ...env,
              STATE: instrumentStorage(env.STATE, "d1"),
            });
          if (checkoutAccess) {
            const renewed = await renewAccess(
              request,
              env,
              checkoutAccess,
              Date.now(),
            );
            checkoutAccess.expires_ms = renewed.expiresMs;
            checkingHeaders["Set-Cookie"] = renewed.cookie;
          }
          const outcome = await coordinatorStub(env).holdCustomer(
            {
              attemptId: holdMatch[2],
              sourceIp: request.headers.get("CF-Connecting-IP") || "",
              checkoutAccess,
              botToken: request.headers.get("X-Booking-Bot-Proof") || undefined,
              checkout: holdMatch[1] === "checkout",
              cookie: request.headers.get("cookie") || "",
              value,
            },
            correlationId,
          );
          if (outcome.serverTiming)
            checkingHeaders["Server-Timing"] =
              outcome.serverTiming +
              `, checkout_http;dur=${Math.max(0, performance.now() - requestStarted).toFixed(2)}`;
          return json(unwrapRpcOutcome(outcome));
        }
        if (url.pathname === "/api/booking/prepare") {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          await verifyBindings(env);
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).prepareCustomer(
                {
                  cookie: request.headers.get("cookie") || "",
                  sourceIp: request.headers.get("CF-Connecting-IP") || "",
                  value: bookingSelection(await inputBody(request)),
                  botToken:
                    request.headers.get("X-Booking-Bot-Proof") || undefined,
                },
                correlationId,
              ),
            ),
            201,
          );
        }
        // These initial named operations accept no payload at all.
        const hitpayPayment = /^\/api\/booking\/hitpay\/([a-f0-9-]{36})$/.exec(
          url.pathname,
        );
        if (hitpayPayment) {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          if (
            !z
              .strictObject({ accepted: z.literal(true) })
              .safeParse(await inputBody(request)).success
          )
            throw new ApiError(400, "payment_consent_required");
          await authenticate(request, env, Date.now());
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).hitpayPayment(
                {
                  attemptId: hitpayPayment[1],
                  cookie: request.headers.get("cookie") || "",
                },
                correlationId,
              ),
            ),
          );
        }
        if (request.body !== null) {
          const reader = request.body.getReader();
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            const first = await Promise.race([
              reader.read(),
              new Promise<never>((_, reject) => {
                timer = setTimeout(
                  () => reject(new ApiError(408, "request_body_timeout")),
                  1000,
                );
              }),
            ]);
            if (!first.done) throw new ApiError(413, "payload_not_supported");
          } finally {
            clearTimeout(timer);
            void reader.cancel().catch(() => {});
            reader.releaseLock();
          }
        }

        env = {
          ...env,
          STATE: env.STATE
            ? instrumentStorage(
                env.STATE,
                /^\/api\/attempts\/[a-f0-9-]{36}\/(confirmation|checkout|receipt)$/.test(
                  url.pathname,
                )
                  ? "d1"
                  : "storage",
              )
            : env.STATE,
        };
        if (url.pathname === "/api/health" && request.method === "GET")
          return json({
            environment: configuration.ENVIRONMENT,
            foundationRegistration: await healthFoundation(env),
            providerAccess: env.PROVIDER_ACCESS,
            revision: env.SOURCE_REVISION,
            versionId: env.CF_VERSION_METADATA?.id ?? null,
            origin: env.APP_ORIGIN,
            campaignEndMs: Number(env.CAMPAIGN_END_MS),
            liveCustomerAccess: configuration.LIVE_CUSTOMER_ACCESS,
            effectiveProviderAccess:
              configuration.PROVIDER_ACCESS === "trusted-reads" &&
              (now < Number(env.CAMPAIGN_END_MS) ||
                configuration.LIVE_CUSTOMER_ACCESS === "enabled")
                ? "trusted-reads"
                : "disabled",
            readinessNonce: /^[a-f0-9]{32}$/.test(
              request.headers.get("X-Readiness-Nonce") ?? "",
            )
              ? request.headers.get("X-Readiness-Nonce")
              : null,
            providerCredentialsPresent: (
              [
                "COMPANY_LOGIN",
                "ADMIN_LOGIN",
                "API_KEY",
                "ADMIN_API_USER_KEY",
              ] as const
            ).every((suffix) => {
              const value: unknown = Reflect.get(
                env,
                providerCredentialName(env, suffix),
              );
              return typeof value === "string" && value.length > 0;
            }),
          });
        await verifyBindings(env);
        const expire = /^\/api\/attempts\/([a-f0-9-]{36})\/expire$/.exec(
          url.pathname,
        );
        if (expire) {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).expireCheckout({
                attemptId: expire[1],
                cookie: request.headers.get("Cookie") ?? "",
              }),
            ),
          );
        }
        const dismiss = /^\/api\/attempts\/([a-f0-9-]{36})\/dismiss$/.exec(
          url.pathname,
        );
        if (dismiss) {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).dismissCompleted(
                {
                  attemptId: dismiss[1],
                  cookie: request.headers.get("cookie") || "",
                },
                correlationId,
              ),
            ),
          );
        }
        if (url.pathname === "/api/booking/current") {
          if (request.method !== "GET")
            throw new ApiError(405, "operation_unavailable");
          return json(await currentCustomerNative(request, env));
        }
        if (
          url.pathname === "/api/calendar/snapshot" &&
          request.method === "GET"
        )
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).publicCalendarSnapshot(correlationId),
            ),
          );
        const publicMonth = /^\/api\/calendar\/(\d{4}-(?:0[1-9]|1[0-2]))$/.exec(
          url.pathname,
        );
        if (publicMonth && request.method === "GET") {
          const calendar = unwrapRpcOutcome(
            await coordinatorStub(env).publicCalendar(
              publicMonth[1],
              correlationId,
            ),
          );
          return json(calendar, 200, {
            "X-Calendar-Observed-At": String(calendar.observedAtMs),
            ...(calendar.displayExpiresAtMs === undefined
              ? {}
              : {
                  "X-Calendar-Expires-At": String(calendar.displayExpiresAtMs),
                }),
          });
        }
        const calendarMatch =
          /^\/api\/booking\/calendar\/([1-9]\d{0,14})\/(\d{4}-(?:0[1-9]|1[0-2]))$/.exec(
            url.pathname,
          );
        if (calendarMatch) {
          if (request.method !== "GET")
            throw new ApiError(405, "operation_unavailable");
          await authenticate(request, env, Date.now());
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).nativeCalendar(
                {
                  serviceId: calendarMatch[1],
                  month: calendarMatch[2],
                  cookie: request.headers.get("cookie") || "",
                },
                correlationId,
              ),
            ),
          );
        }
        const availabilityMatch =
          /^\/api\/booking\/availability\/([1-9]\d{0,14})\/(\d{4}-\d{2}-\d{2})$/.exec(
            url.pathname,
          );
        if (availabilityMatch) {
          if (request.method !== "GET")
            throw new ApiError(405, "operation_unavailable");
          await authenticate(request, env, Date.now());
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).nativeAvailability(
                {
                  serviceId: availabilityMatch[1],
                  date: availabilityMatch[2],
                  fresh: url.searchParams.get("refresh") === "1",
                  cookie: request.headers.get("cookie") || "",
                },
                correlationId,
              ),
            ),
          );
        }
        const nativeCheckoutMatch =
          /^\/api\/booking\/native\/([a-f0-9-]{36})$/.exec(url.pathname);
        if (nativeCheckoutMatch) {
          const attemptId = nativeCheckoutMatch[1];
          if (request.method === "GET")
            return json(await nativeCheckoutStatus(request, env, attemptId));
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          await authenticate(request, env, Date.now());
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).nativeCheckout(
                {
                  attemptId,
                  sourceIp: request.headers.get("CF-Connecting-IP") || "",
                  holding: url.searchParams.get("hold") === "1",
                  cookie: request.headers.get("cookie") || "",
                },
                correlationId,
              ),
            ),
          );
        }
        const subscriptionOperation =
          /^\/api\/developer\/webhook-(create|cleanup)$/.exec(url.pathname);
        if (subscriptionOperation) {
          if (request.method !== "POST")
            throw new ApiError(405, "operation_unavailable");
          const bearer = request.headers.get("authorization") || "";
          if (!/^Bearer [a-f0-9]{64}$/.test(bearer))
            throw new ApiError(401, "operator_access_denied");
          return json(
            unwrapRpcOutcome(
              await coordinatorStub(env).webhookSubscription(
                await digest(bearer.slice(7)),
                subscriptionOperation[1] === "create" ? "create" : "cleanup",
                correlationId,
              ),
            ),
          );
        }

        if (
          (url.pathname === "/api/developer/provider-identity" ||
            url.pathname === "/api/developer/historical-comparison" ||
            url.pathname === "/api/developer/native-field-discovery" ||
            url.pathname === "/api/developer/native-readback" ||
            url.pathname === "/api/developer/native-creation-resolution") &&
          (request.method === "POST" || request.method === "GET")
        )
          return json(
            await developerOperation(
              request,
              env,
              now,
              url.pathname.endsWith("provider-identity")
                ? "provider_identity"
                : url.pathname.endsWith("native-creation-resolution")
                  ? "native_creation_resolution"
                  : url.pathname.endsWith("native-readback")
                    ? "native_recovery_window"
                    : url.pathname.endsWith("native-field-discovery")
                      ? "native_field_discovery"
                      : "historical_comparison",
            ),
          );
        if (url.pathname === "/api/access" && request.method === "POST") {
          if (
            request.headers.get("cookie")?.includes("__Host-soccerbot-access=")
          ) {
            try {
              const access = await authenticate(request, env, now);
              return json({ access: "guest" }, 200, {
                "Set-Cookie": (await renewAccess(request, env, access, now))
                  .cookie,
              });
            } catch (error) {
              if (!(error instanceof ApiError) || error.status !== 401)
                throw error;
              // A new guest never inherits the expired/revoked owner's attempts.
            }
          }
          return json({ access: "guest" }, 201, {
            "Set-Cookie": await createAccess(env, now),
          });
        }
        if (url.pathname === "/api/access" && request.method === "DELETE") {
          const access = await authenticate(request, env, now).catch(
            (error: unknown) => {
              if (error instanceof ApiError && error.status === 401)
                return null;
              throw error;
            },
          );
          await revokePresentedRemembered(request, env, now);
          const response = json({ access: "revoked" }, 200, {
            "Set-Cookie": access
              ? await revokeAccess(env, access, now)
              : clearAccessCookie(),
          });
          response.headers.append("Set-Cookie", clearRememberedCookie());
          return response;
        }
        if (
          url.pathname === "/api/identity/restore" &&
          request.method === "POST"
        ) {
          await assertIdentityProofOpen(env);
          const cookies: string[] = [];
          const pepper: unknown = Reflect.get(env, "IDENTITY_PEPPER");
          const identity = await restoreRememberedIdentity(
            request,
            env,
            typeof pepper === "string" ? pepper : "",
            cookies,
          );
          await assertIdentityProofOpen(env);
          const response = json(identity);
          for (const cookie of cookies)
            response.headers.append("Set-Cookie", cookie);
          return response;
        }
        if (
          url.pathname === "/api/identity/all-devices" &&
          request.method === "DELETE"
        ) {
          await revokeAllIdentities(request, env, now);
          const response = json({ access: "revoked" });
          response.headers.append("Set-Cookie", clearRememberedCookie());
          response.headers.append("Set-Cookie", clearAccessCookie());
          return response;
        }
        if (url.pathname === "/api/catalogue" && request.method === "GET")
          return json(await customerCatalogue(request, env, now));
        if (url.pathname === "/api/identity" && request.method === "GET") {
          await assertIdentityProofOpen(env);
          const identity = await readVerifiedIdentity(request, env, now);
          await assertIdentityProofOpen(env);
          return json(identity);
        }
        const match = /^\/api\/attempts\/([a-f0-9-]{36})\/confirmation$/.exec(
          url.pathname,
        );
        if (match && request.method === "GET")
          return json(
            await confirmationRead(match[1], "status", () =>
              confirmation(request, env, match[1], now, (window) => {
                checkingHeaders["X-Checking-Deadline"] = String(
                  window.deadlineMs,
                );
                checkingHeaders["X-Next-Check"] = String(window.nextCheckMs);
                checkingHeaders["X-Checks-Remaining"] = String(
                  window.remaining,
                );
              }),
            ),
          );
        const receipt = /^\/api\/attempts\/([a-f0-9-]{36})\/receipt$/.exec(
          url.pathname,
        );
        if (receipt && request.method === "GET")
          return json(
            await confirmationRead(receipt[1], "receipt", () =>
              request.headers.get("X-Booking-Refresh") === "1"
                ? coordinatorStub(env)
                    .receipt(
                      {
                        attemptId: receipt[1],
                        cookie: request.headers.get("cookie") || "",
                      },
                      correlationId,
                    )
                    .then(unwrapRpcOutcome)
                : bookingReceipt(request, env, receipt[1], now),
            ),
          );
        const checkout = /^\/api\/attempts\/([a-f0-9-]{36})\/checkout$/.exec(
          url.pathname,
        );
        if (checkout && request.method === "GET")
          return json(
            await confirmationRead(checkout[1], "context", () =>
              checkoutContext(request, env, checkout[1], now),
            ),
          );
        if (url.pathname === "/api/attempts" && request.method === "POST") {
          await authenticate(request, env, now);
          throw new ApiError(503, "booking_prerequisites_blocked");
        }
        throw new ApiError(404, "operation_unavailable");
      } catch (error) {
        if (error instanceof ApiError)
          return json(
            {
              error: error.code,
              ...(error.selectionRejection
                ? {
                    selectionRejection: checkoutSelectionRejectionSchema.parse(
                      error.selectionRejection,
                    ),
                  }
                : {}),
            },
            error.status,
            error.status === 429 &&
              Number.isSafeInteger(error.retryAfterSeconds) &&
              error.retryAfterSeconds! > 0 &&
              error.retryAfterSeconds! <= 3600
              ? { "Retry-After": String(error.retryAfterSeconds) }
              : {},
          );
        console.error(
          JSON.stringify({ event: "request_failed", correlationId }),
        );
        return json({ error: "temporarily_unavailable" }, 503);
      }
    });
  },
} satisfies ExportedHandler<Env>;

/** Reject invalid checkout selections before crossing the coordinator RPC boundary. */
function bookingSelection(value: unknown) {
  const parsed = nativePrepareSchema.safeParse(value);
  if (!parsed.success)
    throw new ApiError(
      400,
      parsed.error.issues.some(
        (issue) => issue.code === "too_big" && issue.path[0] === "sessions",
      )
        ? "session_limit_exceeded"
        : "invalid_booking_selection",
    );
  return parsed.data;
}
