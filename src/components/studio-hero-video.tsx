"use client";
import { useSyncExternalStore } from "react";
import { studioHero } from "@/content/media";

const mobileQuery = "(max-width: 700px)";
/** Keep the selected official video in sync with the responsive layout. */
function subscribe(notify: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;
/** Use the official close-up montage for the portrait mobile hero. */
export function StudioHeroVideo() {
  const mobile = useSyncExternalStore(
    subscribe,
    mobileSnapshot,
    serverSnapshot,
  );
  const video = mobile ? studioHero.mobile : studioHero;
  return (
    <video
      src={video.src}
      poster={video.poster}
      controls
      playsInline
      preload="none"
      aria-label="SOCCERBOT360 studio demonstration"
    />
  );
}
