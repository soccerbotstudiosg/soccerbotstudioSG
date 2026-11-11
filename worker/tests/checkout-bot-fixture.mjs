import assert from "node:assert/strict";

/** Exercise real checkout proof validation with an intercepted, single-use provider. */
export function checkoutBotFixture(origin, { automatic = true, result } = {}) {
  const calls = [];
  const used = new Set();
  return {
    calls,
    bindings: {
      TURNSTILE_SECRET: "synthetic-checkout-turnstile-secret-32-characters",
      TURNSTILE_SECRET_KEY: "synthetic-checkout-turnstile-secret-32-characters",
    },
    async respond(request, body) {
      if (new URL(request.url).hostname !== "challenges.cloudflare.com") return;
      assert.equal(new URL(request.url).pathname, "/turnstile/v0/siteverify");
      assert.equal(request.method, "POST");
      assert.equal(
        body.secret,
        "synthetic-checkout-turnstile-secret-32-characters",
      );
      calls.push({ token: body.response });
      if (result) return result(body);
      if (used.has(body.response)) return Response.json({ success: false });
      used.add(body.response);
      return Response.json({
        success: true,
        action: "create-checkout",
        hostname: new URL(origin).hostname,
        challenge_ts: new Date().toISOString(),
      });
    },
    attach(mf) {
      if (!automatic) return;
      const dispatch = mf.dispatchFetch.bind(mf);
      // Existing financial tests supply an explicit synthetic valid proof for
      // each creation request. Recovery/read/callback routes never receive it.
      mf.dispatchFetch = (input, init) => {
        const url = new URL(
          typeof input === "string" || input instanceof URL ? input : input.url,
        );
        if (
          init?.method === "POST" &&
          /^\/api\/booking\/(?:prepare|(?:hold|checkout)\/[a-f0-9-]{36})$/.test(
            url.pathname,
          )
        ) {
          const headers = new Headers(init.headers);
          if (!headers.has("X-Booking-Bot-Proof"))
            headers.set(
              "X-Booking-Bot-Proof",
              `synthetic-checkout-${crypto.randomUUID()}`,
            );
          init = { ...init, headers };
        }
        return dispatch(input, init);
      };
    },
  };
}
