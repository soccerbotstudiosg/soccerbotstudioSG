import assert from "node:assert/strict";
import { test } from "node:test";
import { isHitPayApiCall } from "../worker/tests/provider-url-fixture.mjs";

test("HitPay call classification rejects URL lookalikes and retains both environments", () => {
  for (const host of ["api.sandbox.hit-pay.com", "api.hit-pay.com"])
    assert.equal(
      isHitPayApiCall({ url: `https://${host}/v1/payment-requests` }),
      true,
    );
  for (const url of [
    "https://evil.example/hit-pay.com",
    "https://evil.example/?next=https://api.sandbox.hit-pay.com",
    "https://api.sandbox.hit-pay.com.evil.example/v1/payment-requests",
    "https://fakehit-pay.com/v1/payment-requests",
    "https://api.hit-pay.com@evil.example/v1/payment-requests",
    "https://user-api.simplybook.me/",
  ])
    assert.equal(isHitPayApiCall({ url }), false, url);
});
