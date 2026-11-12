import {
  CustomerMessageError,
  EMAIL_SECURITY_CHECK_REQUIRED,
  VerificationRequestLimitedError,
} from "./contracts";
import { z } from "zod";
import { blankContact } from "@/domain/contact";
import type { CustomerIdentityService, VerifiedIdentity } from "./contracts";

const accessSchema = z.strictObject({ access: z.literal("guest") });
const identitySchema = z.strictObject({
  email: z.email(),
  expiresAt: z.number().int().positive().safe(),
  remember: z.boolean().optional(),
});
const challengeSchema = z.strictObject({
  challengeId: z.string().uuid(),
  expiresAt: z.number().int().positive().safe(),
  resendAfter: z.number().int().nonnegative().safe(),
  requestLimited: z.boolean().optional(),
});
const profileSchema = z.strictObject({
  email: z.email(),
  contact: z
    .strictObject({
      name: z.string().min(2).max(80),
      phone: z.string().min(8).max(24),
    })
    .nullable(),
});
const savedSchema = z.strictObject({
  email: z.email(),
  saved: z.literal(true),
});
const unavailable = () =>
  new CustomerMessageError(
    "Email verification unavailable. Please continue as a guest.",
  );
/** Send an identity request with bounded transport and response validation. */
async function identityRequest(
  path: string,
  method: "GET" | "POST" | "DELETE",
  signal: AbortSignal,
  body?: unknown,
) {
  const startingBooking = path === "/api/access" && method === "POST";
  const requestUnavailable = startingBooking
    ? () =>
        new CustomerMessageError(
          "We couldn’t start your booking. Please try again.",
        )
    : unavailable;
  const response = await fetch(path, {
    method,
    signal,
    credentials: "same-origin",
    cache: "no-store",
    redirect: "error",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).catch((error: unknown) => {
    if (startingBooking && !signal.aborted) throw requestUnavailable();
    throw error;
  });
  if (!response.ok) {
    if (startingBooking) {
      if (response.status === 429)
        throw new CustomerMessageError(
          "Too many booking requests. Please wait a few minutes and try again.",
        );
      throw requestUnavailable();
    }
    if (path === "/api/identity/all-devices" && response.status === 401)
      throw new CustomerMessageError(
        "Verify your email again, then choose Sign out all devices.",
      );
    if (path === "/api/identity/all-devices")
      throw new CustomerMessageError(
        "Could not sign out all devices. Please try again.",
      );
    if (path === "/api/access" && method === "DELETE")
      throw new CustomerMessageError(
        "Could not sign out this browser. Please try again.",
      );
    if (response.status === 429) {
      const header = response.headers.get("Retry-After");
      // Accept bounded delta-seconds only; never display arbitrary response text.
      const seconds = header && /^\d{1,5}$/.test(header) ? Number(header) : 0;
      throw new VerificationRequestLimitedError(
        seconds > 0 && seconds <= 86400 ? Date.now() + seconds * 1000 : null,
      );
    }
    if (response.status === 401)
      throw new CustomerMessageError(
        "Return to booking options and verify your email again.",
      );
    if (path === "/api/identity/verify" && response.status === 400)
      throw new CustomerMessageError("Check your code or request a new one.");
    if (path === "/api/identity/challenges" && response.status === 400)
      throw new CustomerMessageError(EMAIL_SECURITY_CHECK_REQUIRED);
    throw unavailable();
  }
  if (!response.body) throw requestUnavailable();
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let text = "",
    size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 4096) throw requestUnavailable();
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    const value: unknown = JSON.parse(text);
    return startingBooking ? accessSchema.parse(value) : value;
  } catch (error) {
    if (startingBooking && !signal.aborted) throw requestUnavailable();
    throw error;
  } finally {
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
// Display cache only. The server cookie/challenge remains authoritative, and no
// browser storage can establish verified ownership or a provider client binding.
/** Create the server-backed customer identity service. */
export function createLiveIdentityService(): CustomerIdentityService {
  let current: VerifiedIdentity | null = null,
    generation = 0;
  const read = async (signal: AbortSignal) => {
    const own = ++generation;
    try {
      const raw = await identityRequest("/api/identity", "GET", signal);
      const value = identitySchema.nullable().parse(raw);
      if (signal.aborted || own !== generation) throw unavailable();
      current = value && value.expiresAt > Date.now() ? value : null;
      return current;
    } catch (error) {
      if (own === generation) current = null;
      throw error;
    }
  };
  return {
    mode: "live",
    current: () => (current && current.expiresAt > Date.now() ? current : null),
    readCurrent: read,
    refresh: async (signal) => {
      const own = ++generation;
      current = null;
      const check = () => {
        if (signal.aborted || own !== generation) throw unavailable();
      };
      await identityRequest("/api/access", "POST", signal);
      check();
      let value = identitySchema
        .nullable()
        .parse(await identityRequest("/api/identity", "GET", signal));
      check();
      if (!value || value.expiresAt <= Date.now()) {
        await identityRequest("/api/identity/restore", "POST", signal);
        check();
        value = identitySchema
          .nullable()
          .parse(await identityRequest("/api/identity", "GET", signal));
        check();
      }
      current = value && value.expiresAt > Date.now() ? value : null;
      return current;
    },
    guest: async (signal) => {
      await identityRequest("/api/access", "POST", signal);
    },
    challenge: async (email, signal, botToken) => {
      const normalized = z.email().parse(email.trim().toLowerCase());
      if (!botToken || botToken.length > 2048)
        throw new CustomerMessageError(EMAIL_SECURITY_CHECK_REQUIRED);
      const own = ++generation;
      current = null;
      await identityRequest("/api/access", "POST", signal);
      if (signal.aborted || own !== generation) throw unavailable();
      const response = challengeSchema.parse(
        await identityRequest("/api/identity/challenges", "POST", signal, {
          email: normalized,
          botToken,
        }),
      );
      if (
        signal.aborted ||
        own !== generation ||
        response.expiresAt <= Date.now()
      )
        throw unavailable();
      return { ...response, email: normalized };
    },
    verify: async (challenge, code, remember, signal) => {
      const own = ++generation;
      current = null;
      const value = identitySchema.parse(
        await identityRequest("/api/identity/verify", "POST", signal, {
          challengeId: challenge.challengeId,
          email: challenge.email,
          code,
          remember,
        }),
      );
      // Verification response is not cached: a subsequent authenticated read
      // detects session revocation/replacement during the in-flight operation.
      if (
        signal.aborted ||
        own !== generation ||
        value.email !== challenge.email ||
        value.expiresAt <= Date.now()
      )
        throw unavailable();
      const verified = await read(signal);
      if (!verified || verified.email !== challenge.email) throw unavailable();
      return verified;
    },
    profile: async (email, signal) => {
      if (
        !current ||
        current.expiresAt <= Date.now() ||
        current.email !== email
      )
        return null;
      const own = generation;
      const value = profileSchema.parse(
        await identityRequest("/api/identity/contact", "GET", signal),
      );
      if (
        signal.aborted ||
        own !== generation ||
        !current ||
        current.expiresAt <= Date.now() ||
        current.email !== email ||
        value.email !== email
      )
        throw unavailable();
      return value.contact
        ? { ...blankContact(), email, ...value.contact }
        : null;
    },
    saveProfile: async (contact, signal) => {
      if (
        !current ||
        current.remember !== true ||
        current.expiresAt <= Date.now() ||
        current.email !== contact.email
      )
        throw unavailable();
      const own = generation;
      const value = savedSchema.parse(
        await identityRequest("/api/identity/contact", "POST", signal, {
          email: contact.email,
          name: contact.name,
          phone: contact.phone,
        }),
      );
      if (
        signal.aborted ||
        own !== generation ||
        !current ||
        current.expiresAt <= Date.now() ||
        current.email !== contact.email ||
        value.email !== contact.email
      )
        throw unavailable();
    },
    signOut: async (signal, allDevices = false) => {
      ++generation;
      current = null;
      await identityRequest(
        allDevices ? "/api/identity/all-devices" : "/api/access",
        "DELETE",
        signal,
      );
    },
  };
}
export const liveCustomerIdentity = createLiveIdentityService();
