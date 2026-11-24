import { traceKeyboard } from "./keyboard-trace";
/** Focus a rejected field and reveal it below the current sticky navigation. */
export function focusField(field: HTMLElement | null) {
  if (!field) return;
  traceKeyboard("validation:focus", undefined, field);
  field.focus({ preventScroll: true });
  requestAnimationFrame(() => {
    if (!field.isConnected || document.activeElement !== field) return;
    if (field.closest("dialog")) {
      field.scrollIntoView({ block: "nearest", behavior: "instant" });
      return;
    }
    const top =
      Math.max(
        document.querySelector(".site-header")?.getBoundingClientRect()
          .bottom ?? 0,
        document.querySelector(".booking-navigation")?.getBoundingClientRect()
          .bottom ?? 0,
        window.visualViewport?.offsetTop ?? 0,
      ) + 16;
    const bottom = Math.min(
      window.innerHeight,
      (window.visualViewport?.offsetTop ?? 0) +
        (window.visualViewport?.height ?? window.innerHeight),
    );
    const box = field.getBoundingClientRect();
    if (!box.height) return;
    if (box.top < top || box.bottom > bottom - 16) {
      traceKeyboard("validation:scroll", undefined, field);
      window.scrollBy({ top: box.top - top, behavior: "instant" });
    }
  });
}

/** Choose the first rejected control in visual DOM order, independent of error-key order. */
export function focusFormError(form: HTMLFormElement, ids: string[]) {
  const invalid = new Set(ids);
  const field = Array.from(
    form.querySelectorAll<HTMLElement>("input, select, textarea, button"),
  ).find((element) => invalid.has(element.id) && !element.matches(":disabled"));
  focusField(field ?? null);
}
