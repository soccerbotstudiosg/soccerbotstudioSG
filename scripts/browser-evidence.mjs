import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  statfsSync,
  writeFileSync,
} from "node:fs";
/** Read only numeric resource counters; unavailable counters stay null. */
export function runtimeResources(
  read = (file) => readFileSync(file, "utf8"),
  stat = statfsSync,
) {
  const numeric = (file, pattern) => {
    try {
      const matches = [...read(file).matchAll(pattern)];
      return matches.length
        ? Object.fromEntries(
            matches.map((match) => [match[1], Number(match[2])]),
          )
        : null;
    } catch {
      return null;
    }
  };
  return {
    storage: Object.fromEntries(
      [".", "/tmp", "/dev/shm", "/__w/_temp", "/github/home"].map(
        (directory) => {
          try {
            const fs = stat(directory);
            return [
              directory,
              {
                totalBytes: fs.blocks * fs.bsize,
                availableBytes: fs.bavail * fs.bsize,
                totalInodes: fs.files,
                freeInodes: fs.ffree,
              },
            ];
          } catch {
            return [directory, null];
          }
        },
      ),
    ),
    memoryKiB: numeric(
      "/proc/meminfo",
      /^(MemAvailable|SwapFree):\s+(\d+) kB$/gm,
    ),
    cpu: numeric(
      "/sys/fs/cgroup/cpu.stat",
      /^(usage_usec|nr_throttled|throttled_usec) (\d+)$/gm,
    ),
    memoryEvents: numeric(
      "/sys/fs/cgroup/memory.events",
      /^(high|oom|oom_kill) (\d+)$/gm,
    ),
    pressure: Object.fromEntries(
      ["cpu", "memory", "io"].map((kind) => [
        kind,
        numeric(`/proc/pressure/${kind}`, /^(some|full) .* total=(\d+)$/gm),
      ]),
    ),
  };
}
export default class BrowserEvidence {
  /** Preserve resource deltas across each test without polling or browser control. */
  record(test, event, result) {
    appendFileSync(
      "test-results/browser-resources.jsonl",
      JSON.stringify({
        event,
        testId: test.id,
        timeMs: Date.now(),
        ...(result
          ? { status: result.status, durationMs: result.duration }
          : {}),
        resources: runtimeResources(),
      }) + "\n",
    );
  }
  onTestBegin(test) {
    this.record(test, "begin");
  }
  onTestEnd(test, result) {
    this.record(test, "end", result);
  }

  /** Record the browser configuration before collecting test evidence. */
  onBegin(config) {
    mkdirSync("test-results", { recursive: true });
    writeFileSync("test-results/browser-resources.jsonl", "");
    writeFileSync(
      "test-results/browser-engines.json",
      JSON.stringify(
        config.projects.map((project) => ({
          name: project.name,
          browserName: project.use.browserName,
          retries: project.retries,
          repeatEach: project.repeatEach,
        })),
        null,
        2,
      ) + "\n",
    );
  }
}
