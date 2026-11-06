"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Reveal arriving sections once without hiding content or delaying interaction. */
export function SectionReveals() {
  const pathname = usePathname();
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new Set<Element>();
    const revealed = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (motion.matches || entry.target.contains(document.activeElement))
            continue;
          entry.target.classList.add("section-reveal");
          revealed.add(entry.target);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    function register() {
      for (const target of main!.querySelectorAll("section, form")) {
        if (seen.has(target) || target.querySelector("section, form")) continue;
        seen.add(target);
        const box = target.getBoundingClientRect();
        // Already-visible content and live payment/status announcements remain immediate.
        if (
          motion.matches ||
          box.top < window.innerHeight ||
          target.closest('[aria-live], [role="alert"], [role="status"]')
        )
          continue;
        observer.observe(target);
      }
    }
    function clearMotion() {
      for (const target of revealed) target.classList.remove("section-reveal");
      revealed.clear();
      if (motion.matches) observer.disconnect();
    }
    function focus(event: FocusEvent) {
      if (!(event.target instanceof Element)) return;
      event.target
        .closest(".section-reveal")
        ?.classList.remove("section-reveal");
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
