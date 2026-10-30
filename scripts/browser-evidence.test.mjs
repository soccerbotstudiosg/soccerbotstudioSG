import assert from "node:assert/strict";
import { test } from "node:test";
import { runtimeResources } from "./browser-evidence.mjs";

test("browser resource evidence preserves unavailable counters and never copies arbitrary input", () => {
  const unavailable = () => {
    throw new Error("unavailable");
  };
  const missing = runtimeResources(unavailable, unavailable);
  assert.deepEqual(missing, {
    storage: Object.fromEntries(
      [".", "/tmp", "/dev/shm", "/__w/_temp", "/github/home"].map((path) => [
        path,
        null,
      ]),
    ),
    memoryKiB: null,
    cpu: null,
    memoryEvents: null,
    pressure: { cpu: null, memory: null, io: null },
  });
  const sample = runtimeResources(
    () =>
      "secret=do-not-record\nMemAvailable: 123 kB\nusage_usec 400\noom_kill 0\nsome avg10=0.00 avg60=0.00 avg300=0.00 total=22\n",
  );
  const storage = runtimeResources(unavailable, () => ({
    blocks: 10,
    bsize: 4096,
    bavail: 0,
    files: 100,
    ffree: 7,
    secret: "do-not-record",
  })).storage;
  assert.deepEqual(storage["."], {
    totalBytes: 40960,
    availableBytes: 0,
    totalInodes: 100,
    freeInodes: 7,
  });
  assert.equal(JSON.stringify(storage).includes("do-not-record"), false);
  assert.deepEqual(sample.memoryKiB, { MemAvailable: 123 });
  assert.deepEqual(sample.cpu, { usage_usec: 400 });
  assert.deepEqual(sample.memoryEvents, { oom_kill: 0 });
  assert.deepEqual(sample.pressure.cpu, { some: 22 });
  assert.equal(JSON.stringify(sample).includes("do-not-record"), false);
});
