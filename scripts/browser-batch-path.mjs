import assert from "node:assert/strict";
export const batchCount = 57;
export const shardCount = 2;
/** Keep each short-lived browser batch's original evidence separate. */
export function browserEvidenceDirectory(env = process.env) {
  const batch = env.SOCCERBOT_BROWSER_BATCH;
  if (batch === undefined) return "test-results";
  assert.match(batch, /^[1-9][0-9]*$/);
  assert.ok(Number(batch) <= batchCount);
  return `test-results/browser-batches/${batch}`;
}
