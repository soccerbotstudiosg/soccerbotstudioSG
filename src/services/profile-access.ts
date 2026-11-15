import { safeRead, safeWrite } from "./storage";
// Coordinate booking/profile access loss; this state never grants server authority.
const expiryKey = "soccerbot-booking-access-expiry";
let rememberedExpiry: number | null = null;
let generation = 0;
let denied = false;
type AccessLoss = "profile" | "session";
const listeners = new Set<(reason: AccessLoss) => void>();
/** Capture the credential generation before dispatching a protected request. */
export function profileAccessGeneration() {
  return generation;
}
/** Fence old denials after a successful explicit access establishment. */
export function establishedProfileAccess(expiryHeader: string | null = null) {
  generation += 1;
  denied = false;
  rememberBookingAccessExpiry(expiryHeader);
}
/** Notify once for the current credential generation, never for stale requests. */
export function reportProfileAccessLoss(
  own: number,
  reason: AccessLoss = "profile",
) {
  if (own !== generation || denied) return;
  denied = true;
  for (const listener of listeners) listener(reason);
}
/** Observe access loss without adding polling or protected requests. */
export function onProfileAccessLoss(listener: (reason: AccessLoss) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Recover only explicit access denials, excluding network failures and stale responses. */
export async function reportExpiredBookingAccess(
  response: Response,
  own: number,
  signal?: AbortSignal,
) {
  if (response.status !== 401 || signal?.aborted) return;
  const body: unknown = await response
    .clone()
    .json()
    .catch(() => null);
  if (
    !signal?.aborted &&
    body &&
    typeof body === "object" &&
    "error" in body &&
    body.error === "access_denied"
  )
    reportProfileAccessLoss(own, "session");
}

/** Retain the server deadline only as a navigation hint, never as access authority. */
export function rememberBookingAccessExpiry(header: string | null) {
  const expiresAt = Number(header);
  rememberedExpiry =
    Number.isSafeInteger(expiresAt) && expiresAt > 0 ? expiresAt : null;
  safeWrite(expiryKey, rememberedExpiry);
}
/** Check the server deadline at navigation boundaries without restricting local edits. */
export function bookingAccessExpired() {
  const deadline = safeRead(expiryKey) ?? rememberedExpiry;
  return (
    typeof deadline === "number" &&
    Number.isSafeInteger(deadline) &&
    deadline > 0 &&
    deadline <= Date.now()
  );
}
