"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { studioHero } from "@/content/media";

const mobileQuery = "(max-width: 700px)";
const motionQuery = "(prefers-reduced-motion: reduce)";
/** Subscribe to responsive video and motion-preference changes. */
function subscribe(notify: () => void) {
  const queries = [mobileQuery, motionQuery].map((query) =>
    window.matchMedia(query),
  );
  queries.forEach((query) => query.addEventListener("change", notify));
  return () =>
    queries.forEach((query) => query.removeEventListener("change", notify));
}
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const motionSnapshot = () => window.matchMedia(motionQuery).matches;
/** Use the official close-up montage for the portrait mobile hero. */
export function StudioHeroVideo() {
  const mobile = useSyncExternalStore(subscribe, mobileSnapshot, () => false);
  const reducedMotion = useSyncExternalStore(
    subscribe,
    motionSnapshot,
    () => true,
  );
  const video = mobile ? studioHero.mobile : studioHero;
  return (
    <StudioPlayback
      key={video.src}
      src={video.src}
      poster={video.poster}
      reducedMotion={reducedMotion}
      mobile={mobile}
    />
  );
}
/** Play silently once with one accessible playback control and no native chrome. */
function StudioPlayback({
  src,
  poster,
  reducedMotion,
  mobile,
}: {
  src: string;
  poster: string;
  reducedMotion: boolean;
  mobile: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"play" | "playing" | "replay">("play");
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (reducedMotion) video.pause();
    else void video.play().catch(() => setStatus("play"));
    return () => video.pause();
  }, [reducedMotion]);
  function activate() {
    const video = ref.current;
    if (!video) return;
    if (!video.paused) video.pause();
    else {
      if (video.ended) video.currentTime = 0;
      void video.play().catch(() => setStatus("play"));
    }
  }
  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        autoPlay={!reducedMotion}
        playsInline
        preload="metadata"
        aria-label="SOCCERBOT360 studio demonstration"
        onPlay={() => setStatus("playing")}
        onPause={() => setStatus(ref.current?.ended ? "replay" : "play")}
        onEnded={() => setStatus("replay")}
      />
      {mobile && status === "replay" && (
        <a
          className="studio-scroll-cue"
          href="#studio-title"
          aria-label="Explore the studio below"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 6 6 6 6-6M6 12l6 6 6-6" />
          </svg>
        </a>
      )}
      <button
        type="button"
        className="studio-playback"
        onClick={activate}
        aria-label={`${status === "replay" ? "Replay" : status === "playing" ? "Pause" : "Play"} studio video`}
      >
        {status === "replay"
          ? "Replay"
          : status === "playing"
            ? "Pause"
            : "Play"}
      </button>
    </>
  );
}
