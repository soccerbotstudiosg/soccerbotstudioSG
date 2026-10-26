import assert from "node:assert/strict";
import { loadTarget } from "./deployment-target.mjs";

// Public build inputs only. Neither profile grants delivery or provider access.
export const emailSitekey = loadTarget("staging").turnstileSitekey;
/** Validate public build inputs for the selected release composition. */
export function releaseProfile(env = process.env) {
  const name = env.RELEASE_PROFILE || "closed-demo";
  assert.ok(
    ["closed-demo", "live-email"].includes(name),
    "Unknown release profile",
  );
  const bookingMode = env.NEXT_PUBLIC_BOOKING_MODE || "demo";
  const sitekey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  if (name === "live-email") {
    assert.equal(bookingMode, "live", "Live email requires live composition");
    assert.equal(
      env.NEXT_PUBLIC_BASE_PATH || "",
      "",
      "Live email requires root path",
    );
    assert.equal(
      sitekey,
      env.RELEASE_TARGET
        ? loadTarget(env.RELEASE_TARGET).turnstileSitekey
        : emailSitekey,
      "Live email requires the supplied public sitekey",
    );
  } else {
    assert.equal(
      bookingMode,
      "demo",
      "Live builds require an explicit release profile",
    );
    assert.equal(sitekey, "", "Demo release must not bind a live widget");
  }
  return {
    name,
    bookingMode,
    sitekey,
    browserSuite: name === "live-email" ? "live-email" : "demo",
  };
}
