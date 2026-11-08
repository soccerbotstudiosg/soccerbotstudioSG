import { afterEach, expect, it, vi } from "vitest";
import {
  checkoutNow,
  protectedCheckoutService,
  confirmationResponseTime,
  readConfirmation,
} from "./confirmation";
const id = "00000000-0000-4000-8000-000000000001";
const context = {
  attemptId: id,
  mode: "synthetic",
  checkout: { state: "available", url: `/__experiment/checkout/${id}` },
  summary: {
    players: 2,
    totalMinor: 8800,
    currency: "SGD",
    sessions: [{ startMs: 1, players: 2 }],
  },
  checking: { deadlineMs: 999999, nextCheckMs: 0, pollAfterMs: 5000 },
};
const read = (mode: "synthetic" | "live" = "synthetic") =>
  protectedCheckoutService.context({
    attemptId: id,
    mode,
    signal: new AbortController().signal,
  });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("accepts only the protected synthetic checkout bound to the requested attempt", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(context));
  vi.stubGlobal("fetch", fetch);
  const before = performance.now();
  const result = await read();
  expect(result.checkout).toEqual(context.checkout);
  expect(confirmationResponseTime(result)).toBeGreaterThanOrEqual(before);
  expect(confirmationResponseTime(result)).toBeLessThanOrEqual(
    performance.now(),
  );
  for (const url of [
    "https://evil.example/pay",
    "http://pay.example",
    "//evil.example",
    "/__experiment/checkout/other",
    context.checkout.url + "?paid=true",
  ]) {
    fetch.mockResolvedValue(
      Response.json({ ...context, checkout: { state: "available", url } }),
    );
    await expect(read()).rejects.toThrow();
  }
  fetch.mockResolvedValue(
    Response.json({
      ...context,
      attemptId: "00000000-0000-4000-8000-000000000002",
    }),
  );
  await expect(read()).rejects.toThrow();
});
it("keeps unsupported live checkout unavailable without synthetic fallback", async () => {
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      ...context,
      mode: "live",
      checkout: { state: "unavailable" },
    }),
  );
  vi.stubGlobal("fetch", fetch);
  expect((await read("live")).checkout.state).toBe("unavailable");
  const rejected = {
    ...context,
    mode: "live",
    checkout: { state: "unavailable" },
    selectionRejection: {
      state: "selection_unavailable",
      rejectedSessionIndex: 0,
    },
  };
  fetch.mockResolvedValue(Response.json(rejected));
  expect((await read("live")).selectionRejection).toEqual(
    rejected.selectionRejection,
  );
  for (const change of [
    { payment: { status: "recorded", paidAtMs: 1 } },
    { bookingIssue: "incomplete" },
    {
      selectionRejection: {
        state: "selection_unavailable",
        rejectedSessionIndex: 1,
      },
    },
    { selectionRejection: { state: "recovery_required" } },
  ]) {
    fetch.mockResolvedValue(Response.json({ ...rejected, ...change }));
    await expect(read("live")).rejects.toThrow();
  }
  fetch.mockResolvedValue(
    Response.json({
      status: "invalid",
      reason: "checkout_selection_rejected",
      selectionRejection: rejected.selectionRejection,
    }),
  );
  expect(
    await readConfirmation(id, new AbortController().signal),
  ).toMatchObject({ selectionRejection: rejected.selectionRejection });
  fetch.mockResolvedValue(
    Response.json({
      status: "invalid",
      reason: "invoice_expired",
      selectionRejection: rejected.selectionRejection,
    }),
  );
  await expect(
    readConfirmation(id, new AbortController().signal),
  ).rejects.toThrow();
  fetch.mockResolvedValue(Response.json({ ...context, mode: "live" }));
  await expect(read("live")).rejects.toThrow();
  fetch.mockResolvedValue(Response.json(context));
  await expect(read("live")).rejects.toThrow();
});

it("accepts only the backend-issued native path for the matching protected attempt", async () => {
  const expiresAtMs = Date.now() + 60000;
  const url =
    "https://soccerbotstudiosg.simplybook.asia/v2/client/pay-later/id/synthetic-id/hash/synthetic-hash";
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      ...context,
      mode: "live",
      checking: { ...context.checking, deadlineMs: Date.now() + 120000 },
      checkout: { state: "available", url, expiresAtMs },
    }),
  );
  vi.stubGlobal("fetch", fetch);
  expect((await read("live")).checkout).toEqual({
    state: "available",
    url,
    expiresAtMs,
  });
  for (const invalid of [
    url + "?redirect=evil",
    url + "\n",
    url.replace("securecheckout.", "checkout.") + "\n",
    url + "#paid",
    url.replace(".asia", ".asia.evil.test"),
    url.replace("https:", "http:"),
    url.replace("/hash/", "/other/"),
    url.replace("/id/", "/id/%2f"),
  ]) {
    fetch.mockResolvedValue(
      Response.json({
        ...context,
        mode: "live",
        checking: { ...context.checking, deadlineMs: Date.now() + 120000 },
        checkout: { state: "available", url: invalid, expiresAtMs },
      }),
    );
    await expect(read("live")).rejects.toThrow();
  }
  for (const expiry of [undefined, Date.now() - 1, Date.now() + 180000]) {
    fetch.mockResolvedValue(
      Response.json({
        ...context,
        mode: "live",
        checking: { ...context.checking, deadlineMs: Date.now() + 120000 },
        checkout: { state: "available", url, expiresAtMs: expiry },
      }),
    );
    await expect(read("live")).rejects.toThrow();
  }
  fetch.mockResolvedValue(
    Response.json({
      ...context,
      attemptId: "00000000-0000-4000-8000-000000000002",
      mode: "live",
      checking: { ...context.checking, deadlineMs: Date.now() + 120000 },
      checkout: { state: "available", url, expiresAtMs },
    }),
  );
  await expect(read("live")).rejects.toThrow();
});

it("accepts only a bounded protected HitPay sandbox checkout URL", async () => {
  const url = `https://securecheckout.sandbox.hit-pay.com/payment-request/@soccerbot/${id}/checkout`;
  const expiresAtMs = Date.now() + 60000;
  const reply = (
    destination: string,
    expiry: number | undefined = expiresAtMs,
  ) =>
    Response.json({
      ...context,
      mode: "live",
      checking: { ...context.checking, deadlineMs: Date.now() + 120000 },
      checkout: { state: "available", url: destination, expiresAtMs: expiry },
    });
  const fetch = vi.fn().mockResolvedValue(reply(url));
  vi.stubGlobal("fetch", fetch);
  expect((await read("live")).checkout).toEqual({
    state: "available",
    url,
    expiresAtMs,
  });
  fetch.mockResolvedValue(reply(url.replace("securecheckout.", "checkout.")));
  expect((await read("live")).checkout).toEqual({
    state: "available",
    url: url.replace("securecheckout.", "checkout."),
    expiresAtMs,
  });
  for (const invalid of [
    url.replace("securecheckout.", "checkout.sandbox.hit-pay.com.evil."),
    url.replace("securecheckout.", "attacker@checkout."),
    url.replace("securecheckout.sandbox", "checkout"),
    url.replace("hit-pay.com/", "hit-pay.com:444/"),
    url.replace("https:", "http:"),
    url.replace(".sandbox", ""),
    url.replace("hit-pay.com", "hit-pay.com.evil.test"),
    url.replace("securecheckout.", "attacker@securecheckout."),
    url + "?redirect=evil",
    url + "\n",
    url.replace("securecheckout.", "checkout.") + "\n",
    url + "#paid",
    url + "/",
    url.replace("@soccerbot", "%40soccerbot"),
    url.replace(id, "invalid"),
  ]) {
    fetch.mockResolvedValue(reply(invalid));
    await expect(read("live")).rejects.toThrow();
  }
  for (const expiry of [0, Date.now() - 1, Date.now() + 180000]) {
    fetch.mockResolvedValue(reply(url, expiry));
    await expect(read("live")).rejects.toThrow();
  }
  const serverTime = Math.floor(Date.now() / 1000) * 1000;
  let elapsed = 0;
  vi.spyOn(performance, "now").mockImplementation(() => elapsed);
  const wall = vi.spyOn(Date, "now");
  for (const skew of [-3600000, 3600000]) {
    wall.mockReturnValue(serverTime + skew);
    fetch.mockResolvedValue(
      Response.json(
        {
          ...context,
          mode: "live",
          checking: { ...context.checking, deadlineMs: serverTime + 120000 },
          checkout: {
            state: "available",
            url,
            expiresAtMs: serverTime + 60000,
          },
        },
        { headers: { Date: new Date(serverTime).toUTCString() } },
      ),
    );
    const result = await read("live");
    expect(result.checkout.state).toBe("available");
    expect(checkoutNow(result.clock)).toBe(serverTime);
    expect(checkoutNow(result.clock, true)).toBe(serverTime + 999);
    elapsed += 1000.25;
    wall.mockReturnValue(serverTime + skew * 2);
    expect(checkoutNow(result.clock)).toBe(serverTime + 1000);
    expect(checkoutNow(result.clock, true)).toBe(serverTime + 1999);
    expect(Number.isSafeInteger(checkoutNow(result.clock))).toBe(true);
  }
});
