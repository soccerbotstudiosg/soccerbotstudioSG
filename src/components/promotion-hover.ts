const subscribers = new Map<HTMLElement, (hovered: boolean) => void>();
let pointer: { x: number; y: number } | null = null;
let frame: number | undefined;

/** Resolve the visible card beneath the stationary cursor once per animation frame. */
function checkHover() {
  frame = undefined;
  const target = pointer
    ? document
        .elementFromPoint(pointer.x, pointer.y)
        ?.closest(".interactive-promotion")
    : null;
  for (const [element, notify] of subscribers) notify(element === target);
}

/** Share one hit test across all cards while scrolling or moving the pointer. */
function scheduleHover() {
  if (!pointer || frame !== undefined) return;
  frame = requestAnimationFrame(checkHover);
}

/** Track mouse coordinates without treating touch scrolling as hover. */
function movePointer(event: PointerEvent) {
  if (event.pointerType !== "mouse") {
    resetPointer();
    return;
  }
  pointer = { x: event.clientX, y: event.clientY };
  scheduleHover();
}

/** Stop mouse tracking without overriding the card's own touch interaction. */
function resetPointer() {
  pointer = null;
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
}

/** Clear hover when the pointer or browser window loses contact. */
function clearPointer() {
  resetPointer();
  checkHover();
}

/** Ignore pointer transitions between elements inside the document. */
function leaveWindow(event: PointerEvent) {
  if (event.relatedTarget === null) clearPointer();
}

/** Keep scroll-driven hover detection shared and release listeners after the final card. */
export function subscribePromotionHover(
  element: HTMLElement,
  notify: (hovered: boolean) => void,
) {
  subscribers.set(element, notify);
  if (subscribers.size === 1) {
    window.addEventListener("pointermove", movePointer, { passive: true });
    window.addEventListener("pointerdown", movePointer, { passive: true });
    window.addEventListener("pointerout", leaveWindow, { passive: true });
    window.addEventListener("scroll", scheduleHover, {
      passive: true,
      capture: true,
    });
    window.addEventListener("resize", scheduleHover, { passive: true });
    window.addEventListener("blur", clearPointer);
  }
  return () => {
    subscribers.delete(element);
    if (subscribers.size) return;
    window.removeEventListener("pointermove", movePointer);
    window.removeEventListener("pointerdown", movePointer);
    window.removeEventListener("pointerout", leaveWindow);
    window.removeEventListener("scroll", scheduleHover, true);
    window.removeEventListener("resize", scheduleHover);
    window.removeEventListener("blur", clearPointer);
    clearPointer();
  };
}
