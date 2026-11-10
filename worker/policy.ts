import { z } from "zod";
import type { CheckoutSelectionRejection } from "../src/domain/native-checkout";
const duration = (minimum: number, maximum: number) =>
  z.coerce.number().int().min(minimum).max(maximum);
const schema = z.object({
  DEPLOYMENT_ACCOUNT_ID: z.string().regex(/^[a-f0-9]{32}$/),
  STATE_DATABASE_ID: z.string().uuid(),
  APP_ORIGIN: z
    .string()
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.origin === value &&
        !url.username &&
        !url.password
      );
    }),
  CAMPAIGN_ID: z.string().regex(/^[a-z][a-z0-9-]{1,62}$/),
  CAMPAIGN_END_MS: duration(0, Number.MAX_SAFE_INTEGER),
  SOURCE_REVISION: z.string().regex(/^(unpublished|[a-f0-9]{40})$/),
  ENVIRONMENT: z.enum(["developer", "production"]),
  CLIENT_SANDBOX_ACCESS: z.enum(["disabled", "enabled"]).default("disabled"),
  PRIMARY_SERVICE_ID: z
    .string()
    .regex(/^(?:[1-9]\d{0,14})?$/)
    .default(""),
  SIMPLYBOOK_EXPECTED_COMPANY_LOGIN: z.string().max(128).default(""),
  PREMIUM_SERVICE_ID: z
    .string()
    .regex(/^(?:[1-9]\d{0,14})?$/)
    .default(""),
  PUBLIC_DISPLAY_WARMING: z.enum(["disabled", "enabled"]).default("disabled"),
  PUBLIC_TOKEN_REFRESH_AHEAD: z
    .enum(["disabled", "enabled"])
    .default("disabled"),
  LIVE_CUSTOMER_ACCESS: z.enum(["disabled", "enabled"]).default("disabled"),
  PROVIDER_ACCESS: z.enum(["disabled", "trusted-reads"]),
  PROVIDER_CALL_CEILING: z
    .enum(["80", "128", "192", "224", "256", "512", "640", "704", "1024"])
    .default("80")
    .transform(Number),
  ACCESS_LIFETIME_MS: duration(60000, 3600000),
  OBSERVATION_MAX_AGE_MS: duration(1000, 60000),
  POLL_INTERVAL_MS: duration(1000, 30000),
  CHECKING_DEADLINE_MS: duration(60000, 1800000),
});
/** Validate environment configuration against the supported deployment policy. */
export function policy(env: Env) {
  return schema.parse(env);
}
/** Select credential names without falling back across deployment environments. */
export function providerCredentialName(
  env: Env,
  suffix:
    | "COMPANY_LOGIN"
    | "ADMIN_LOGIN"
    | "API_KEY"
    | "ADMIN_API_USER_KEY"
    | "SIGNING_SECRET",
) {
  const environment = z
    .enum(["developer", "production"])
    .parse(env.ENVIRONMENT);
  return `SIMPLYBOOK_${environment === "production" ? "PROD" : "DEV"}_${suffix}`;
}
/** Select the installed bot-verification binding for each deployment environment. */
export function turnstileSecretName(env: Env) {
  return z.enum(["developer", "production"]).parse(env.ENVIRONMENT) ===
    "production"
    ? "TURNSTILE_SECRET_KEY"
    : "TURNSTILE_SECRET";
}
/** Require explicit client service mappings while retaining developer defaults. */
export function providerServiceIds(env: Env) {
  const p = policy(env);
  const primary =
    p.PRIMARY_SERVICE_ID || (p.ENVIRONMENT === "developer" ? "2" : "");
  const premium = p.PREMIUM_SERVICE_ID;
  if (
    !primary ||
    primary === premium ||
    (p.ENVIRONMENT === "production" &&
      (!premium || !p.SIMPLYBOOK_EXPECTED_COMPANY_LOGIN))
  )
    throw new ApiError(503, "native_pricing_configuration_invalid");
  return { primary, premium };
}
/** Require the explicitly reviewed client pairing before sandbox operations. */
export function clientSandboxAccess(env: Env) {
  const p = policy(env);
  const read = (name: string): unknown => Reflect.get(env, name);
  return (
    p.ENVIRONMENT === "production" &&
    p.CLIENT_SANDBOX_ACCESS === "enabled" &&
    !!p.PRIMARY_SERVICE_ID &&
    !!p.PREMIUM_SERVICE_ID &&
    p.PRIMARY_SERVICE_ID !== p.PREMIUM_SERVICE_ID &&
    !!p.SIMPLYBOOK_EXPECTED_COMPANY_LOGIN &&
    read("SIMPLYBOOK_PROD_COMPANY_LOGIN") ===
      p.SIMPLYBOOK_EXPECTED_COMPANY_LOGIN &&
    typeof read("HITPAY_EXPECTED_BUSINESS_ID") === "string" &&
    z.uuid().safeParse(read("HITPAY_EXPECTED_BUSINESS_ID")).success &&
    read("HITPAY_BUSINESS_ID") === read("HITPAY_EXPECTED_BUSINESS_ID") &&
    typeof read("HITPAY_EXPECTED_MERCHANT") === "string" &&
    /^[a-zA-Z0-9_-]{1,80}$/.test(String(read("HITPAY_EXPECTED_MERCHANT"))) &&
    read("HITPAY_MERCHANT") === read("HITPAY_EXPECTED_MERCHANT") &&
    read("HITPAY_CONTRACT_ACCEPTED") === "sandbox-reviewed" &&
    read("SIMPLYBOOK_EXTERNAL_PAYMENT") === "sandbox-reviewed" &&
    read("SIMPLYBOOK_EXTERNAL_PROCESSOR") === "manual"
  );
}
/** Keep native workflows within developer or explicitly scoped client sandbox contracts. */
export function sandboxPolicy(env: Env) {
  const p = policy(env);
  if (p.ENVIRONMENT !== "developer" && !clientSandboxAccess(env))
    throw new ApiError(503, "provider_access_disabled");
  return p;
}
// Ongoing customer operations have no campaign expiry. Operator experiments
// retain their separately installed grants, deadlines and cumulative budgets.
/** Require explicit provider and customer access for a published revision. */
export function liveCustomerAccess(env: Env) {
  const p = policy(env);
  return (
    (p.ENVIRONMENT === "developer" || clientSandboxAccess(env)) &&
    p.LIVE_CUSTOMER_ACCESS === "enabled" &&
    p.PROVIDER_ACCESS === "trusted-reads" &&
    /^[a-f0-9]{40}$/.test(p.SOURCE_REVISION)
  );
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public selectionRejection?: CheckoutSelectionRejection,
  ) {
    super(code);
  }
}
// RPC serializes exceptions without preserving our ApiError prototype. Carry
// only the same safe status/code already allowed at the HTTP boundary.
export type RpcOutcome<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      error: {
        status: number;
        code: string;
        selectionRejection?: CheckoutSelectionRejection;
      };
    };
/** Convert known API failures into safe serializable RPC outcomes. */
export async function rpcOutcome<T>(
  operation: () => Promise<T>,
): Promise<RpcOutcome<T>> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return {
      ok: false,
      error: {
        status: error.status,
        code: error.code,
        ...(error.selectionRejection
          ? { selectionRejection: error.selectionRejection }
          : {}),
      },
    };
  }
}
/** Restore a known API failure from its safe RPC representation. */
export function unwrapRpcOutcome<T>(outcome: RpcOutcome<T>): T {
  if (!outcome.ok)
    throw new ApiError(
      outcome.error.status,
      outcome.error.code,
      outcome.error.selectionRejection,
    );
  return outcome.value;
}
/** Hash a string using SHA-256 for retained identity comparisons. */
export async function digest(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
/** Generate an unpredictable server-issued capability value. */
export function capability() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Hash scoped identity parts using the validated server-side key. */
export async function keyedHash(pepper: string, parts: string[]) {
  if (pepper.length < 32 || pepper.length > 512)
    throw new ApiError(503, "identity_unavailable");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(JSON.stringify(parts)),
  );
  return Array.from(new Uint8Array(signature), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
