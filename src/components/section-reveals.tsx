"use client";
import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

const isBookingFlow = (pathname: string) =>
  /^\/(?:book(?:\/|$)|confirmation(?:\/|$))/.test(pathname);

/** Stage offscreen sections before a single entrance while preserving accessible interaction. */
export function SectionReveals() {
  const pathname = usePathname();
  useEffect(() => {
    // Scroll effects belong to public browsing, never transactional booking UI.
    if (isBookingFlow(pathname)) return;
    const main = document.getElementById("main");
    if (!main || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new Set<Element>();
    const revealed = new Set<Element>();
    const pending = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.01) continue;
          observer.unobserve(entry.target);
          pending.delete(entry.target);
          entry.target.classList.remove("section-reveal-pending");
          if (motion.matches || entry.target.contains(document.activeElement))
            continue;
          entry.target.classList.add("section-reveal");
          revealed.add(entry.target);
        }
      },
      { threshold: 0.01 },
    );
    /** Animate visual blocks without ever moving a clickable control or form. */
    function observeVisual(target: Element) {
      const controls =
        "a, button, input, select, textarea, [tabindex], [role='button']";
      if (
        target.matches(controls) ||
        target instanceof SVGElement ||
        target.closest("form, [aria-live], [role='alert'], [role='status']")
      )
        return;
      if (target.querySelector(controls)) {
        for (const child of target.children) observeVisual(child);
        return;
      }
      if (seen.has(target)) return;
      seen.add(target);
      const box = target.getBoundingClientRect();
      if (motion.matches || box.top < window.innerHeight || box.height === 0)
        return;
      target.classList.add("section-reveal-pending");
      pending.add(target);
      observer.observe(target);
    }
    function register() {
      for (const section of main!.querySelectorAll("section")) {
        if (!section.querySelector("section")) observeVisual(section);
      }
    }
    /** Remove reveal effects when reduced motion is enabled. */
    function clearMotion() {
      for (const target of pending)
        target.classList.remove("section-reveal-pending");
      pending.clear();
      for (const target of revealed) target.classList.remove("section-reveal");
      revealed.clear();
      if (motion.matches) observer.disconnect();
    }
    /** Reveal focused content immediately and stop observing it. */
    function focus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest(
        ".section-reveal, .section-reveal-pending",
      );
      if (!target) return;
      observer.unobserve(target);
      pending.delete(target);
      revealed.delete(target);
      target.classList.remove("section-reveal", "section-reveal-pending");
    }
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(main, { childList: true, subtree: true });
    motion.addEventListener("change", clearMotion);
    main.addEventListener("focusin", focus);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      motion.removeEventListener("change", clearMotion);
      main.removeEventListener("focusin", focus);
      clearMotion();
    };
  }, [pathname]);
  return null;
}

/** Subscribe only the public-page control to passive scroll updates. */
function subscribeScroll(notify: () => void) {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
}
const scrolledSnapshot = () => window.scrollY > 200;
const topSnapshot = () => false;
/** Restore top navigation focus and scroll without motion when requested. */
function ScrollTopControl() {
  const visible = useSyncExternalStore(
    subscribeScroll,
    scrolledSnapshot,
    topSnapshot,
  );
  if (!visible) return null;
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => {
        document
          .querySelector<HTMLElement>(".site-header .brand")
          ?.focus({ preventScroll: true });
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
        });
      }}
    >
      <Icon name="chevron" />
    </button>
  );
}
/** Keep the floating scroll control entirely outside transactional routes. */
export function BackToTop() {
  const pathname = usePathname();
  return isBookingFlow(pathname) ? null : <ScrollTopControl />;
}
