"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
      const bannerContent = target.matches(
        ".abstract-promotion-mobile, .abstract-promotion-link",
      );
      if (
        target.closest(".interactive-promotion") ||
        (target.matches(controls) && !bannerContent) ||
        target instanceof SVGElement ||
        target.closest("form, [aria-live], [role='alert'], [role='status']")
      )
        return;
      // Fade banner contents together, keeping the white separator opaque.
      if (!bannerContent && target.querySelector(controls)) {
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

/** Show one scroll control during movement and for three seconds afterwards. */
function ScrollTopControl() {
  const control = useRef<HTMLButtonElement>(null);
  const [activity, setActivity] = useState({ visible: false });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      setActivity({ visible: window.scrollY > 0 });
      timer = setTimeout(
        () => setActivity((current) => ({ ...current, visible: false })),
        3000,
      );
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", update);
    };
  }, []);
  useLayoutEffect(() => {
    const circle = control.current;
    if (!activity.visible || !circle) return;
    const action = document.querySelector(".booking-primary-action > .button");
    /** Lift this single bottom-right control only when it overlaps the primary action. */
    function measure() {
      if (!circle) return;
      circle.style.removeProperty("--back-to-top-clearance");
      const cue = circle.getBoundingClientRect();
      // WebKit can retain the previously painted fixed rect after removing the
      // lift. Derive baseline vertical bounds from CSS instead of that rect.
      const baselineBottom =
        window.innerHeight - Number.parseFloat(getComputedStyle(circle).bottom);
      const button = action?.getBoundingClientRect();
      if (
        button &&
        cue.left < button.right &&
        cue.right > button.left &&
        baselineBottom + 12 > button.top &&
        baselineBottom - cue.height < button.bottom + 12
      ) {
        circle.style.setProperty(
          "--back-to-top-clearance",
          `${Math.ceil(window.innerHeight - button.top + 12)}px`,
        );
      }
    }
    measure();
    const observer =
      "ResizeObserver" in window ? new ResizeObserver(measure) : null;
    if (action) observer?.observe(action);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activity]);
  if (!activity.visible) return null;
  return (
    <button
      type="button"
      ref={control}
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
/** Mount one bottom-right scroll control and reset activity on route changes. */
export function BackToTop() {
  const pathname = usePathname();
  return <ScrollTopControl key={pathname} />;
}
