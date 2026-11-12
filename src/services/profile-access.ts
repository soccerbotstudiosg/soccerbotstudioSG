// Coordinate confirmed saved-profile access loss; this state never grants server authority.
let generation = 0;
let denied = false;
const listeners = new Set<() => void>();
/** Capture the credential generation before dispatching a protected request. */
export function profileAccessGeneration() {
  return generation;
}
/** Fence old denials after a successful explicit access establishment. */
export function establishedProfileAccess() {
  generation += 1;
  denied = false;
}
/** Notify once for the current credential generation, never for stale requests. */
export function reportProfileAccessLoss(own: number) {
  if (own !== generation || denied) return;
  denied = true;
  for (const listener of listeners) listener();
}
/** Observe access loss without adding polling or protected requests. */
export function onProfileAccessLoss(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
