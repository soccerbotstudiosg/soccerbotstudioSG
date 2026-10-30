import assert from "node:assert/strict";
import { test } from "node:test";
import { runtimeResources, deletedOpenFiles } from "./browser-evidence.mjs";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  openSync,
  closeSync,
  unlinkSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

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
  const root = mkdtempSync(path.join(tmpdir(), "soccerbot-proc-evidence-"));
  let descriptor;
  try {
    mkdirSync(`${root}/1/fd`, { recursive: true });
    mkdirSync(`${root}/1/map_files`);
    writeFileSync(`${root}/1/comm`, "do-not-record");
    const target = `${root}/private-content`;
    writeFileSync(target, Buffer.alloc(4096, 7));
    descriptor = openSync(target, "r");
    unlinkSync(target);
    for (const name of ["1", "2"])
      symlinkSync(`/proc/self/fd/${descriptor}`, `${root}/1/fd/${name}`);
    const evidence = deletedOpenFiles(root);
    assert.equal(
      evidence.count,
      1,
      "duplicate descriptors must not double-count an inode",
    );
    assert.ok(evidence.allocatedBytes >= 4096);
    assert.equal(evidence.largest[0].logicalBytes, 4096);
    assert.equal(evidence.largest[0].processClass, "other");
    assert.equal(JSON.stringify(evidence).includes("private-content"), false);
    assert.equal(JSON.stringify(evidence).includes("do-not-record"), false);
    assert.equal(deletedOpenFiles(`${root}/missing`), null);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(root, { recursive: true, force: true });
  }
});
