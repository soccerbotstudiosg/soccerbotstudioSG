"use client";
import { useSyncExternalStore } from "react";

const touchQuery = "(max-width: 700px), (hover: none), (any-pointer: coarse)";
const touchSnapshot = () => window.matchMedia(touchQuery).matches;
/** Observe touch-first controls independently of the page's column layout. */
function subscribeTouch(notify: () => void) {
  const media = window.matchMedia(touchQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
/** Reveal touch interactions on phones and tablets, including attached-pointer iPads. */
export function useTouchControls() {
  return useSyncExternalStore(subscribeTouch, touchSnapshot, () => false);
}
