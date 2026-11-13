import {
  profileAccessGeneration,
  establishedProfileAccess,
  reportProfileAccessLoss,
} from "./profile-access";
import {
  CustomerMessageError,
  ProfileAccessRevokedError,
  customerMessage,
  EMAIL_SECURITY_CHECK_REQUIRED,
  VerificationRequestLimitedError,
} from "./contracts";
import { z } from "zod";
import {
  blankContact,
  emailSchema,
  contactProfileInputSchema,
} from "@/domain/contact";
import type { CustomerIdentityService, VerifiedIdentity } from "./contracts";

class IdentityReverificationRequired extends CustomerMessageError {}
export type IdentitySignOutTask = {
  promise: Promise<void>;
  allDevices: boolean;
  pending: boolean;
  failed: boolean;
  revoked: boolean;
  warning: string;
};
const signOutTasks = new WeakMap<
  CustomerIdentityService,
  IdentitySignOutTask
>();
/** Inspect explicit sign-out work retained across internal navigation. */
export function identitySignOutTask(service: CustomerIdentityService) {
  return signOutTasks.get(service);
}
/** Revoke in the background, then prepare anonymous access without blocking local navigation. */
export function beginIdentitySignOut(
  service: CustomerIdentityService,
  allDevices = false,
) {
  const previous = signOutTasks.get(service);
  if (previous?.pending) return previous;
  const controller = new AbortController();
  const task: IdentitySignOutTask = {
    promise: Promise.resolve(),
    allDevices,
    pending: true,
    failed: false,
    revoked:
      previous?.failed === true &&
      previous.allDevices === allDevices &&
      previous.revoked,
    warning: "",
  };
  signOutTasks.set(service, task);
  let timeout: ReturnType<typeof setTimeout>;
  task.promise = Promise.race([
    (async () => {
      if (!task.revoked) {
        try {
          await service.signOut(controller.signal, allDevices);
        } catch (error) {
          // An unauthenticated all-device request cannot revoke other devices.
          // Clear this browser explicitly so verification can safely establish a new identity.
          if (
            !(error instanceof IdentityReverificationRequired) ||
            controller.signal.aborted
          )
            throw error;
          task.warning = error.message;
          await service.signOut(controller.signal, false);
        }
        if (controller.signal.aborted)
          throw new DOMException("Aborted", "AbortError");
        task.revoked = !task.warning;
      }
      await service.guest(controller.signal);
      if (controller.signal.aborted)
        throw new DOMException("Aborted", "AbortError");
    })(),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(
          new CustomerMessageError(
            "Could not finish signing out. Please try again.",
          ),
        );
      }, 10_000);
    }),
  ])
    .then(
      () => {
        if (!task.warning && signOutTasks.get(service) === task)
          signOutTasks.delete(service);
      },
      (error: unknown) => {
        task.failed = true;
        task.warning = customerMessage(
          error,
          "Could not finish signing out. Please try again.",
        );
        throw new CustomerMessageError(task.warning);
      },
    )
    .finally(() => {
      clearTimeout(timeout);
      task.pending = false;
    });
  // Navigation can remove the observing screen; failure remains retained and retryable.
  void task.promise.catch(() => {});
  return task;
}
/** Wait only at identity or protected-action boundaries; never cancel background revocation on Back. */
export async function waitForIdentitySignOut(
  service: CustomerIdentityService,
  signal?: AbortSignal,
) {
  await signOutTasks.get(service)?.promise;
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

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
  const accessGeneration = profileAccessGeneration();
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
  if (
    response.status === 401 &&
    !signal.aborted &&
    path === "/api/identity/contact"
  ) {
    if (method === "GET") reportProfileAccessLoss(accessGeneration);
    else if (method === "POST") {
      const rejection = await response
        .clone()
        .json()
        .catch(() => null);
      if (rejection?.error === "identity_unavailable")
        throw new ProfileAccessRevokedError();
    }
  }
  if (response.ok && startingBooking) establishedProfileAccess();
  if (!response.ok) {
    if (startingBooking) {
      if (response.status === 429)
        throw new CustomerMessageError(
          "Too many booking requests. Please wait a few minutes and try again.",
        );
      throw requestUnavailable();
    }
    if (path === "/api/identity/all-devices" && response.status === 401)
      throw new IdentityReverificationRequired(
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
    invalidate() {
      ++generation;
      current = null;
    },
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
      const normalized = emailSchema.parse(email);
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
      const input = contactProfileInputSchema.parse({
        email: contact.email,
        name: contact.name,
        phone: contact.phone,
      });
      if (
        !current ||
        current.remember !== true ||
        current.expiresAt <= Date.now() ||
        current.email !== input.email
      )
        throw unavailable();
      const own = generation;
      let value;
      try {
        value = savedSchema.parse(
          await identityRequest("/api/identity/contact", "POST", signal, input),
        );
      } catch (error) {
        if (error instanceof ProfileAccessRevokedError && own === generation) {
          ++generation;
          current = null;
        }
        throw error;
      }
      if (
        signal.aborted ||
        own !== generation ||
        !current ||
        current.expiresAt <= Date.now() ||
        current.email !== input.email ||
        value.email !== input.email
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

export type IdentityEntryPreparation = {
  promise: Promise<VerifiedIdentity | null>;
  cancel: () => void;
};
const checkedEntries = new WeakSet<CustomerIdentityService>();
const entryGenerations = new WeakMap<CustomerIdentityService, number>();
/** Report whether this booking flow has already restored its identity. */
export function hasIdentityEntry(service: CustomerIdentityService) {
  return checkedEntries.has(service);
}
/** End the flow-local identity check without changing authenticated state. */
export function clearIdentityEntry(service: CustomerIdentityService) {
  checkedEntries.delete(service);
  entryGenerations.set(service, (entryGenerations.get(service) ?? 0) + 1);
  entryPreparations.get(service)?.cancel();
  entryPreparations.delete(service);
}
const entryPreparations = new WeakMap<
  CustomerIdentityService,
  IdentityEntryPreparation
>();
/** Bound one entry identity read and fence its late completion without retrying. */
function createIdentityEntryPreparation(
  service: CustomerIdentityService,
  readOnly = false,
): IdentityEntryPreparation {
  const controller = new AbortController();
  const generation = entryGenerations.get(service) ?? 0;
  let resolve!: (identity: VerifiedIdentity | null) => void;
  let settled = false;
  const promise = new Promise<VerifiedIdentity | null>((complete) => {
    resolve = complete;
  });
  const finish = (identity: VerifiedIdentity | null) => {
    if (settled) return;
    settled = true;
    if (
      !controller.signal.aborted &&
      generation === (entryGenerations.get(service) ?? 0)
    )
      checkedEntries.add(service);
    clearTimeout(timeout);
    resolve(identity);
  };
  const cancel = () => {
    controller.abort();
    finish(null);
  };
  const timeout = setTimeout(cancel, 10_000);
  try {
    const read =
      readOnly && service.readCurrent ? service.readCurrent : service.refresh;
    const operation = identitySignOutTask(service)
      ? waitForIdentitySignOut(service, controller.signal).then(() =>
          read(controller.signal),
        )
      : read(controller.signal);
    void operation.then(
      (identity) => {
        if (!controller.signal.aborted) finish(identity);
      },
      () => finish(null),
    );
  } catch {
    finish(null);
  }
  return { promise, cancel };
}
/** Start identity preparation only for an explicit booking entry. */
export function prepareIdentityEntry(service: CustomerIdentityService) {
  clearIdentityEntry(service);
  const preparation = createIdentityEntryPreparation(service);
  entryPreparations.set(service, preparation);
  return preparation;
}
/** Adopt this entry's existing read once, or prepare a direct account visit. */
export function takeIdentityEntry(
  service: CustomerIdentityService,
  readOnly = false,
) {
  const preparation = entryPreparations.get(service);
  entryPreparations.delete(service);
  if (preparation) return preparation;
  if (hasIdentityEntry(service))
    return { promise: Promise.resolve(service.current()), cancel: () => {} };
  return createIdentityEntryPreparation(service, readOnly);
}
/** Cancel an abandoned navigation without aborting an operation adopted by Account. */
export function cancelIdentityEntry(
  service: CustomerIdentityService,
  preparation: IdentityEntryPreparation,
) {
  if (entryPreparations.get(service) !== preparation) return;
  entryPreparations.delete(service);
  preparation.cancel();
}
