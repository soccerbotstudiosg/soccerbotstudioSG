import assert from "node:assert/strict";
import { test } from "node:test";
import { runtimeResources } from "./browser-evidence.mjs";

test("browser resource evidence preserves unavailable counters and never copies arbitrary input", () => {
  const missing = runtimeResources(() => {
    throw new Error("unavailable");
  });
  assert.deepEqual(missing, {
    memoryKiB: null,
    cpu: null,
    memoryEvents: null,
    pressure: { cpu: null, memory: null, io: null },
  });
  const sample = runtimeResources(
    () =>
      "secret=do-not-record\nMemAvailable: 123 kB\nusage_usec 400\noom_kill 0\nsome avg10=0.00 avg60=0.00 avg300=0.00 total=22\n",
  );
  assert.deepEqual(sample.memoryKiB, { MemAvailable: 123 });
  assert.deepEqual(sample.cpu, { usage_usec: 400 });
  assert.deepEqual(sample.memoryEvents, { oom_kill: 0 });
  assert.deepEqual(sample.pressure.cpu, { some: 22 });
  assert.equal(JSON.stringify(sample).includes("do-not-record"), false);
});
