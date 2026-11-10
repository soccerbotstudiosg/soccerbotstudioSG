import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
// jsdom does not implement the native dialog lifecycle used by the shared modal.
HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function () {
  this.removeAttribute("open");
};
// jsdom omits media queries and viewport scrolling used by date navigation.
// Tests can override these defaults to exercise mobile and reduced-motion paths.
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  sessionStorage.removeItem("soccerbot-live-draft");
  sessionStorage.removeItem("soccerbot-suppressed-slots");
  sessionStorage.removeItem("soccerbot-conflict-notice");
  sessionStorage.removeItem("soccerbot-pending-conflict");
});
