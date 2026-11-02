import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useConfirmationRenderTrace } from "./confirmation-render-trace";
const attemptId = "00000000-0000-4000-8000-000000000001";
/** Control animation callbacks and diagnostic output without running a browser. */
function fixture() {
  const frames = new Map<number, FrameRequestCallback>();
  let serial = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++serial, callback);
    return serial;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  const digest = vi.fn(async (...args: unknown[]) => {
    expect(args).toHaveLength(2);
    return new Uint8Array(32).fill(1).buffer;
  });
  vi.stubGlobal("crypto", { subtle: { digest } });
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const visibility = vi
    .spyOn(document, "visibilityState", "get")
    .mockReturnValue("visible");
  return {
    log,
    digest,
    visibility,
    async frame() {
      await act(async () => {
        const pending = [...frames.values()];
        frames.clear();
        for (const callback of pending) callback(performance.now());
      });
    },
    events: () => log.mock.calls.map(([value]) => JSON.parse(value as string)),
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("confirmation timing separates pending from verified UI and emits only allowlisted local diagnostics", async () => {
  const f = fixture();
  const props: Parameters<typeof useConfirmationRenderTrace>[0] = {
    attemptId,
    revision: 0,
    state: "summary" as const,
    proofSource: "none" as const,
  };
  const { rerender } = renderHook(
    (p: Parameters<typeof useConfirmationRenderTrace>[0]) =>
      useConfirmationRenderTrace(p),
    { initialProps: props },
  );
  expect(f.events()).toEqual([]);
  await f.frame();
  expect(f.events().map((e) => e.stage)).toEqual(["summary"]);
  rerender({ ...props, state: "confirmed" });
  await f.frame();
  expect(f.events().map((e) => e.stage)).toEqual(["summary"]);
  rerender({
    ...props,
    state: "confirmed",
    proofSource: "status_proof",
    evidence: { contact: "private", token: "secret" },
  });
  await f.frame();
  expect(f.events().map((e) => e.stage)).toEqual(["summary", "confirmed"]);
  const event = f.events()[1];
  expect(event.proofSource).toBe("status_proof");
  expect(event.frameMs).toBeGreaterThanOrEqual(event.committedMs);
  expect(event.recoveryKey).toBe("01".repeat(32));
  expect(
    new TextDecoder().decode(f.digest.mock.calls[0][1] as Uint8Array),
  ).toBe("confirmation:" + attemptId);
  expect(Object.keys(event).sort()).toEqual(
    [
      "event",
      "stage",
      "proofSource",
      "recoveryKey",
      "buildRevision",
      "timeOriginMs",
      "committedMs",
      "frameMs",
      "responseReadyMs",
      "measurement",
    ].sort(),
  );
  expect(JSON.stringify(event)).not.toMatch(/private|secret|00000000/);
  rerender({
    ...props,
    state: "confirmed",
    proofSource: "receipt",
    receipt: {},
  });
  await f.frame();
  expect(f.events().map((e) => e.stage)).toEqual([
    "summary",
    "confirmed",
    "receipt_ready",
  ]);
});
it("confirmation timing defers hidden frames and discards stale unmounted callbacks without affecting UI", async () => {
  const f = fixture();
  f.visibility.mockReturnValue("hidden");
  const { unmount } = renderHook(() =>
    useConfirmationRenderTrace({
      attemptId,
      revision: 0,
      state: "confirmed",
      proofSource: "status_proof",
    }),
  );
  await f.frame();
  expect(f.events()).toEqual([]);
  f.visibility.mockReturnValue("visible");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  unmount();
  await f.frame();
  expect(f.events()).toEqual([]);
  f.digest.mockRejectedValueOnce(new Error("private diagnostic"));
  renderHook(() =>
    useConfirmationRenderTrace({
      attemptId,
      revision: 1,
      state: "payment_received",
      proofSource: "none",
    }),
  );
  await f.frame();
  expect(f.events()).toEqual([]);
});
