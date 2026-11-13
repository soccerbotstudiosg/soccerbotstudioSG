import { ProtectedConfirmation } from "./protected-confirmation";
import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  renderHook,
  render,
  screen,
} from "@testing-library/react";
import { useConfirmationChecking } from "./confirmation-checking";
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
}));
const id = "00000000-0000-4000-8000-000000000001";
const pending = () =>
  Response.json({ status: "pending", reason: "invoice_pending" });
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("coalesces manual and duplicate-page reads and preserves the deadline across reload", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn().mockImplementation(async () => pending());
  vi.stubGlobal("fetch", fetch);
  const first = renderHook(() => useConfirmationChecking(id));
  await act(async () => {});
  const initial = JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!);
  await act(async () => {
    first.result.current.check();
    first.result.current.check();
  });
  const second = renderHook(() => useConfirmationChecking(id));
  await act(async () => {});
  expect(fetch).toHaveBeenCalledTimes(1);
  first.unmount();
  second.unmount();
  renderHook(() => useConfirmationChecking(id));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!).deadline,
  ).toBe(initial.deadline);
});
it("pauses hidden checking and permits only one eligible foreground refresh", async () => {
  vi.useFakeTimers();
  let hidden = false;
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  const fetch = vi.fn().mockImplementation(async () => pending());
  vi.stubGlobal("fetch", fetch);
  renderHook(() => useConfirmationChecking(id));
  await act(async () => {});
  await act(async () => {
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => {
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("stops a hung read at the original deadline without claiming cancellation", async () => {
  vi.useFakeTimers();
  localStorage.setItem(
    `soccerbot-checking:${id}`,
    JSON.stringify({ deadline: Date.now() + 1000, next: 0, count: 0 }),
  );
  const fetch = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetch);
  const hook = renderHook(() => useConfirmationChecking(id));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(hook.result.current.view).toBe("unresolved");
  expect(fetch.mock.calls).toHaveLength(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100000);
    hook.result.current.check();
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("aborts stale session reads and cannot reuse their confirmed result", async () => {
  let finish: (r: Response) => void = () => {};
  const fetch = vi.fn(
    () =>
      new Promise<Response>((r) => {
        finish = r;
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const hook = renderHook(
    ({ revision }) => useConfirmationChecking(id, revision),
    { initialProps: { revision: 0 } },
  );
  const signal = (
    fetch.mock.calls as unknown as [string, { signal: AbortSignal }][]
  )[0][1].signal;
  hook.rerender({ revision: 1 });
  await act(async () => {
    finish(Response.json({ status: "confirmed", reason: "verified" }));
  });
  expect(signal.aborted).toBe(true);
  expect(hook.result.current.view).toBe("checking");
});
it("binds the server checkout deadline before a pending status read and preserves it across reload", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetch);
  const deadline = Date.now() + 590000;
  const first = renderHook(() => useConfirmationChecking(id));
  await act(async () => {
    first.result.current.bindWindow({ deadlineMs: deadline, nextCheckMs: 0 });
  });
  const saved = JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!);
  expect(saved.deadline).toBe(deadline);
  expect(saved.count).toBe(1);
  first.unmount();
  const second = renderHook(() => useConfirmationChecking(id));
  await act(async () => {
    second.result.current.bindWindow({
      deadlineMs: deadline + 5000,
      nextCheckMs: 0,
    });
  });
  expect(JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!)).toEqual(
    saved,
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("an elapsed protected checkout window aborts checking without resetting its allowance", async () => {
  vi.useFakeTimers();
  const fetch = vi.fn(() => new Promise<Response>(() => {}));
  vi.stubGlobal("fetch", fetch);
  const hook = renderHook(() => useConfirmationChecking(id));
  await act(async () => {
    hook.result.current.bindWindow({ deadlineMs: Date.now(), nextCheckMs: 0 });
  });
  expect(hook.result.current.view).toBe("unresolved");
  expect(hook.result.current.busy).toBe(false);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20000);
    hook.result.current.check();
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!).count,
  ).toBe(1);
});

it("hides the native payment capability at its expiry without claiming payment cancellation", async () => {
  vi.useFakeTimers();
  const serverStart = Math.floor(Date.now() / 1000) * 1000;
  vi.setSystemTime(serverStart);
  for (const url of [
    "https://soccerbotstudiosg.simplybook.asia/v2/client/pay-later/id/synthetic-id/hash/synthetic-hash",
    "https://checkout.sandbox.hit-pay.com/payment-request/@test/00000000-0000-4000-8000-000000000001/checkout",
  ]) {
    const hitpay = url.includes("hit-pay");
    const now = serverStart;
    let elapsed = 0;
    vi.spyOn(performance, "now").mockImplementation(() => elapsed);
    vi.setSystemTime(now + (hitpay ? 3600000 : -3600000));
    const fetch = vi.fn(async (path: string) =>
      path.endsWith("/checkout")
        ? Response.json(
            {
              attemptId: id,
              mode: "live",
              checkout: { state: "available", url, expiresAtMs: now + 3000 },
              summary: {
                players: 1,
                totalMinor: 8800,
                currency: "SGD",
                sessions: [{ startMs: now + 86400000, players: 1 }],
              },
              checking: {
                deadlineMs: now + 60000,
                nextCheckMs: 0,
                pollAfterMs: 5000,
              },
            },
            { headers: { Date: new Date(now + elapsed).toUTCString() } },
          )
        : pending(),
    );
    vi.stubGlobal("fetch", fetch);
    if (hitpay) {
      // A provider return is confirmation-only, even with a still-available
      // context and pending status before the webhook/recovery catches up.
      const returned = render(
        <ProtectedConfirmation attemptId={id} checkoutMode="live" />,
      );
      await act(async () => {});
      expect(
        screen.queryByRole("link", { name: "Continue payment" }),
      ).toBeNull();
      expect(screen.queryByRole("timer")).toBeNull();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      expect(
        screen.queryByRole("link", { name: "Continue payment" }),
      ).toBeNull();
      returned.unmount();
      localStorage.clear();
    }
    const first = render(
      <ProtectedConfirmation
        attemptId={id}
        checkoutMode="live"
        allowPaymentContinuation
      />,
    );
    await act(async () => {});
    const label = hitpay ? "Continue payment" : "Open checkout";
    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", url);
    if (hitpay) {
      expect(screen.getByRole("timer")).toHaveTextContent("00:03");
      const count = fetch.mock.calls.length;
      fireEvent.click(link);
      expect(fetch.mock.calls.length).toBe(count);
    }
    await act(async () => {
      elapsed += 1000;
      vi.setSystemTime(now - 7200000);
      await vi.advanceTimersByTimeAsync(1000);
    });
    first.unmount();
    render(
      <ProtectedConfirmation
        attemptId={id}
        checkoutMode="live"
        allowPaymentContinuation
      />,
    );
    await act(async () => {});
    if (hitpay) expect(screen.getByRole("timer")).toHaveTextContent("00:02");
    await act(async () => {
      elapsed += 2000;
      // Reject a click at expiry even before a throttled timer has rendered it.
      if (hitpay)
        expect(fireEvent.click(screen.getByRole("link", { name: label }))).toBe(
          false,
        );
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.queryByRole("link", { name: label })).toBeNull();
    expect(screen.queryByRole("timer")).toBeNull();
    expect(
      screen.getByRole("status", { name: "Checking payment…" }),
    ).toBeVisible();
    expect(document.querySelector(".booking-loading-inline")).toBeNull();
    await act(async () => {
      elapsed += 19999;
      await vi.advanceTimersByTimeAsync(19999);
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("link", { name: label })).toBeNull();
    await act(async () => {
      elapsed += 1;
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Your payment window has ended. These sessions may not be available to book again immediately. Please try again later.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("listitem")).toHaveTextContent(
      /\d{2}:\d{2}–\d{2}:\d{2}\./,
    );
    expect(
      screen.queryByRole("status", { name: "Checking payment…" }),
    ).toBeNull();
    // Link expiry changes the display only; it cannot cancel or recreate a booking.
    expect(
      fetch.mock.calls.every(
        ([path]) =>
          path.endsWith("/checkout") || path.endsWith("/confirmation"),
      ),
    ).toBe(true);
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
    if (hitpay) {
      // Without a usable server clock, retain checking but offer no payment link.
      vi.setSystemTime(now);
      fetch.mockImplementation(async (path: string) =>
        path.endsWith("/checkout")
          ? Response.json(
              {
                attemptId: id,
                mode: "live",
                checkout: { state: "available", url, expiresAtMs: now + 60000 },
                summary: {
                  players: 1,
                  totalMinor: 8800,
                  currency: "SGD",
                  sessions: [{ startMs: now + 86400000, players: 1 }],
                },
                checking: {
                  deadlineMs: now + 120000,
                  nextCheckMs: 0,
                  pollAfterMs: 5000,
                },
              },
              { headers: { Date: "invalid" } },
            )
          : pending(),
      );
      render(
        <ProtectedConfirmation
          attemptId={id}
          checkoutMode="live"
          allowPaymentContinuation
        />,
      );
      await act(async () => {});
      expect(screen.queryByRole("link", { name: label })).toBeNull();
      expect(screen.queryByRole("timer")).toBeNull();
      expect(
        screen.getByRole("status", { name: "Checking payment…" }),
      ).toBeVisible();
      cleanup();
    }
    vi.restoreAllMocks();
    localStorage.clear();
  }
});

it("uses a server-granted early check without extending the deadline or resetting the shared count", async () => {
  vi.useFakeTimers();
  const deadline = Date.now() + 600000;
  const fetch = vi.fn(async () =>
    Response.json(
      { status: "pending", reason: "payment_verification_pending" },
      {
        headers: {
          "X-Next-Check": String(Date.now() + 1000),
          "X-Checking-Deadline": String(deadline),
        },
      },
    ),
  );
  vi.stubGlobal("fetch", fetch);
  const hook = renderHook(() => useConfirmationChecking(id));
  await act(async () => {});
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  const saved = JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!);
  expect(saved.deadline).toBe(deadline);
  expect(saved.count).toBe(2);
  hook.unmount();
});

it("a return at minute seven keeps six minutes of checking and makes one final read without renewing on reload", async () => {
  vi.useFakeTimers();
  const created = Date.now() - 7 * 60000;
  const deadline = created + 13 * 60000;
  const times: number[] = [];
  const fetch = vi.fn(async () => {
    times.push(Date.now());
    return Response.json(
      { status: "pending", reason: "payment_pending" },
      {
        headers: {
          "X-Checking-Deadline": String(deadline),
          "X-Next-Check": String(Date.now() + 10000),
        },
      },
    );
  });
  vi.stubGlobal("fetch", fetch);
  const first = renderHook(() =>
    useConfirmationChecking(id, 0, true, deadline),
  );
  await act(async () => {});
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!).deadline -
      Date.now(),
  ).toBe(6 * 60000);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(180000);
  });
  first.unmount();
  const second = renderHook(() =>
    useConfirmationChecking(id, 0, true, deadline),
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(180001);
  });
  expect(second.result.current.view).toBe("unresolved");
  expect(times.filter((time) => time >= deadline)).toHaveLength(1);
  const count = fetch.mock.calls.length;
  second.unmount();
  renderHook(() => useConfirmationChecking(id, 0, true, deadline));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(30000);
  });
  expect(fetch).toHaveBeenCalledTimes(count);
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!).deadline,
  ).toBe(deadline);
});

it("rechecks unresolved status on focus without renewing the window and coalesces duplicate events", async () => {
  vi.useFakeTimers();
  const deadline = Date.now() - 1;
  localStorage.setItem(
    `soccerbot-checking:${id}`,
    JSON.stringify({ deadline, next: 0, count: 120, final: true }),
  );
  const fetch = vi.fn(async () =>
    Response.json({
      status: "unresolved",
      reason: "payment_verification_pending",
      expired: true,
    }),
  );
  vi.stubGlobal("fetch", fetch);
  const hook = renderHook(() => useConfirmationChecking(id, 0, true, deadline));
  renderHook(() => useConfirmationChecking(id, 0, true, deadline));
  await act(async () => {});
  expect(fetch).not.toHaveBeenCalled();
  await act(async () => {
    hook.result.current.check();
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(hook.result.current.expired).toBe(true);
  expect(hook.result.current.view).toBe("unresolved");
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!),
  ).toMatchObject({ deadline, count: 120, final: true });
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(hook.result.current.busy).toBe(false);
  fetch.mockRejectedValueOnce(new Error("synthetic failed status read"));
  await act(async () => {
    hook.result.current.check();
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(hook.result.current.busy).toBe(false);
  expect(hook.result.current.view).toBe("unresolved");
});

it("checks once at the original hold expiry after polling ends and preserves that check across reload", async () => {
  vi.useFakeTimers();
  const deadline = Date.now();
  const hold = deadline + 120000;
  const fetch = vi
    .fn()
    .mockImplementationOnce(async () => pending())
    .mockImplementationOnce(async () => new Response(null, { status: 503 }))
    .mockImplementation(async () => pending());
  vi.stubGlobal("fetch", fetch);
  const hook = renderHook(() =>
    useConfirmationChecking(id, 0, true, deadline, hold),
  );
  await act(async () => {});
  expect(hook.result.current.view).toBe("unresolved");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(119999);
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(hook.result.current.expired).toBe(false);
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!),
  ).not.toHaveProperty("holdChecked");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(29999);
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(hook.result.current.view).toBe("unresolved");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(fetch).toHaveBeenCalledTimes(3);
  hook.unmount();
  renderHook(() => useConfirmationChecking(id, 0, true, deadline, hold));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
  });
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(
    JSON.parse(localStorage.getItem(`soccerbot-checking:${id}`)!),
  ).toMatchObject({ deadline, count: 1, final: true, holdChecked: hold });
});

it("catches up a hidden hold expiry on focus and stops after authorization denial", async () => {
  vi.useFakeTimers();
  let hidden = false;
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  const deadline = Date.now();
  const hold = deadline + 120000;
  const fetch = vi
    .fn()
    .mockImplementationOnce(async () => pending())
    .mockImplementation(async () => new Response(null, { status: 403 }));
  vi.stubGlobal("fetch", fetch);
  const hook = renderHook(() =>
    useConfirmationChecking(id, 0, true, deadline, hold),
  );
  await act(async () => {});
  await act(async () => {
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(120000);
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  await act(async () => {
    hidden = false;
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(hook.result.current.view).toBe("denied");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000);
    window.dispatchEvent(new Event("focus"));
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
