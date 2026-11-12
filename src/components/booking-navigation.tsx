"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { ArenaEntry } from "./arena-entry";
import { BrandLoading } from "./brand-loading";
import { services } from "@/services";
import {
  prepareIdentityEntry,
  clearIdentityEntry,
  cancelIdentityEntry,
  type IdentityEntryPreparation,
} from "@/services/identity";
import {
  measurePitchOrigin,
  PITCH_ENTER_MS,
  PITCH_REVEAL_MS,
  type EntryOrigin,
  type Viewport,
} from "./arena-geometry";
type Entry = {
  generation: number;
  kind: "logo" | "arena";
  from: string;
  to: string;
  started: number;
  origin?: EntryOrigin;
  viewport?: Viewport;
  skip?: boolean;
};
const Navigation = createContext<{
  entering: boolean;
  active: boolean;
  enter: (href: string, arena?: HTMLElement) => void;
} | null>(null);
/** Read the shared booking navigation context. */
export function useBookingNavigation() {
  const context = useContext(Navigation);
  if (!context) throw new Error("Booking navigation provider missing");
  return context;
}
/** Avoid a second overlay while the global booking transition is visible. */
export function useBookingEntryTransition() {
  return useContext(Navigation)?.active ?? false;
}
/** Coordinate booking navigation with the current draft and route. */
export function BookingNavigation({ children }: { children: ReactNode }) {
  const router = useRouter(),
    pathname = usePathname();
  useEffect(() => {
    if (!pathname.startsWith("/book/"))
      clearIdentityEntry(services.customerIdentity);
  }, [pathname]);
  const [entry, setEntry] = useState<Entry | null>(null),
    [leaving, setLeaving] = useState(false),
    [identityReady, setIdentityReady] = useState(true);
  const generation = useRef(0);
  const preparation = useRef<IdentityEntryPreparation | null>(null);
  /** Release only an unconsumed preflight when this navigation is abandoned. */
  function discardPreparation() {
    if (preparation.current)
      cancelIdentityEntry(services.customerIdentity, preparation.current);
    preparation.current = null;
  }
  useEffect(
    () => () => {
      if (preparation.current)
        cancelIdentityEntry(services.customerIdentity, preparation.current);
    },
    [],
  );
  const active = useRef(false),
    committed = useRef(false);
  const arrived = !!entry && pathname !== entry.from;
  /** Enter the booking flow while respecting retained attempt state. */
  function enter(to: string, arena?: HTMLElement) {
    if (active.current) return;
    if (pathname.replace(/\/$/, "") === to.replace(/\/$/, "")) {
      router.push(to);
      return;
    }
    if (
      /^\/book\/account\/?$/.test(to) &&
      services.customerIdentity.mode === "live"
    ) {
      discardPreparation();
      preparation.current = prepareIdentityEntry(services.customerIdentity);
      const pending = preparation.current;
      setIdentityReady(false);
      void pending.promise.then(() => {
        if (preparation.current === pending) setIdentityReady(true);
      });
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (!preparation.current) {
        router.push(to);
        return;
      }
      arena = undefined;
    }
    active.current = true;
    const id = ++generation.current;
    if (arena) {
      // Back must cancel this transition on its origin page, not jump to the
      // page visited before it. The eventual destination replaces this entry.
      window.history.pushState(
        { ...window.history.state, soccerbotArena: id },
        "",
        window.location.href,
      );
    }
    committed.current = !arena;
    setLeaving(false);
    setEntry({
      generation: id,
      kind: arena ? "arena" : "logo",
      from: pathname,
      to,
      started: performance.now(),
      ...(arena
        ? {
            origin: measurePitchOrigin(arena),
            viewport: { width: window.innerWidth, height: window.innerHeight },
          }
        : {}),
    });
    if (!arena) router.push(to);
  }
  function finish() {
    if (!entry || entry.generation !== generation.current || !active.current)
      return;
    if (!committed.current) {
      committed.current = true;
      router.replace(entry.to);
    }
    if (arrived && identityReady) {
      setEntry(null);
      active.current = false;
    } else setEntry({ ...entry, kind: "logo", skip: true });
  }
  useEffect(() => {
    if (!entry) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const cancel = () => {
      generation.current++;
      if (preparation.current)
        cancelIdentityEntry(services.customerIdentity, preparation.current);
      preparation.current = null;
      setEntry(null);
      active.current = false;
    };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => {
      if (motion.matches) {
        if (!committed.current) {
          committed.current = true;
          router.replace(entry.to);
        }
        if (preparation.current && !arrived)
          setEntry({ ...entry, kind: "logo", skip: true });
        else cancel();
      }
    };
    motion.addEventListener("change", reduce);
    window.addEventListener("popstate", cancel);
    const watchdog = setTimeout(cancel, 15000);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      clearTimeout(watchdog);
      motion.removeEventListener("change", reduce);
      window.removeEventListener("popstate", cancel);
    };
  }, [entry, router, arrived]);
  useEffect(() => {
    if (!entry || entry.kind !== "arena" || committed.current) return;
    const timer = setTimeout(
      () => {
        if (!active.current || entry.generation !== generation.current) return;
        committed.current = true;
        router.replace(entry.to);
      },
      Math.max(0, PITCH_ENTER_MS - (performance.now() - entry.started)),
    );
    return () => clearTimeout(timer);
  }, [entry, router]);
  useEffect(() => {
    if (!entry || !arrived || !identityReady) return;
    const delay = entry.skip
      ? 0
      : entry.kind === "arena"
        ? PITCH_REVEAL_MS
        : Math.max(0, 480 - (performance.now() - entry.started));
    let fade: ReturnType<typeof setTimeout> | undefined;
    const complete = () => {
      // Account may mount after route arrival while booking readiness settles.
      // Preserve its one-use handoff; only departure/cancellation discards it.
      setEntry(null);
      active.current = false;
      document.getElementById("main")?.focus({ preventScroll: true });
    };
    const timer = setTimeout(() => {
      if (entry.kind === "logo" && !entry.skip) {
        setLeaving(true);
        fade = setTimeout(complete, 180);
      } else complete();
    }, delay);
    return () => {
      clearTimeout(timer);
      clearTimeout(fade);
    };
  }, [entry, arrived, identityReady]);
  useEffect(() => {
    if (entry || /^\/book\/account\/?$/.test(pathname)) return;
    if (preparation.current)
      cancelIdentityEntry(services.customerIdentity, preparation.current);
    preparation.current = null;
  }, [entry, pathname]);
  return (
    <Navigation.Provider
      value={{
        entering: entry?.kind === "arena" && !arrived,
        active: !!entry,
        enter,
      }}
    >
      <div
        inert={!!entry}
        aria-busy={entry ? true : undefined}
        data-booking-reveal={
          entry?.kind === "arena" && arrived && !entry.skip ? "true" : undefined
        }
      >
        {children}
      </div>
      {entry?.kind === "logo" && (
        <BrandLoading
          leaving={leaving}
          label={entry.to === "/studio/" ? "Opening studio" : "Opening booking"}
        />
      )}
      {entry?.kind === "arena" && entry.origin && entry.viewport && (
        <ArenaEntry
          origin={entry.origin}
          viewport={entry.viewport}
          started={entry.started}
          revealing={arrived}
          finish={finish}
        />
      )}
    </Navigation.Provider>
  );
}
/** Navigate through the shared booking entry controls. */
export function BookingLink({
  onClick,
  ...props
}: ComponentProps<typeof Link>) {
  const { enter } = useBookingNavigation();
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          props.target === "_blank"
        )
          return;
        if (typeof props.href === "string") {
          event.preventDefault();
          enter(props.href);
        }
      }}
    />
  );
}
