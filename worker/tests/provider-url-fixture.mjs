/** Identify HitPay API calls in synthetic histories, including wrong-environment dispatches. */
export function isHitPayApiCall(call) {
  const { hostname } = new URL(call.url);
  return (
    hostname === "api.sandbox.hit-pay.com" || hostname === "api.hit-pay.com"
  );
}
