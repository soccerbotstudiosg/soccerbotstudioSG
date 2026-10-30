import { browserEvidenceDirectory } from "./browser-batch-path.mjs";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  statfsSync,
  writeFileSync,
} from "node:fs";
import { performance } from "node:perf_hooks";
/** Measure unlinked allocations without reading file contents or emitting paths. */
export function deletedOpenFiles(procRoot = "/proc") {
  const start = performance.now();
  const files = new Map();
  let inaccessible = 0;
  let truncated = false;
  let processes;
  try {
    processes = readdirSync(procRoot).filter((pid) => /^\d+$/.test(pid));
  } catch {
    return null;
  }
  // Visit descriptors first; mapped files may remain allocated after fd closure.
  outer: for (const source of ["fd", "map_files"]) {
    for (const pid of processes) {
      let entries;
      let processClass = "other";
      try {
        const name = readFileSync(`${procRoot}/${pid}/comm`, "utf8").trim();
        processClass = /^(WebKit|MiniBrowser)/.test(name)
          ? "webkit"
          : /^(chrome|chromium)/.test(name)
            ? "chromium"
            : /^(node|workerd)$/.test(name)
              ? name
              : "other";
        entries = readdirSync(`${procRoot}/${pid}/${source}`);
      } catch {
        inaccessible++;
        continue;
      }
      for (const entry of entries) {
        if (performance.now() - start > 250) {
          truncated = true;
          break outer;
        }
        try {
          const target = `${procRoot}/${pid}/${source}/${entry}`;
          const file = statSync(target);
          if (!file.isFile() || file.nlink !== 0) continue;
          const key = `${file.dev}:${file.ino}`;
          if (files.has(key)) continue;
          files.set(key, {
            processClass,
            source,
            filesystemType: statfsSync(target).type,
            allocatedBytes: file.blocks * 512,
            logicalBytes: file.size,
          });
        } catch {
          inaccessible++;
        }
      }
    }
  }
  const allocations = [...files.values()];
  return {
    count: allocations.length,
    allocatedBytes: allocations.reduce(
      (sum, file) => sum + file.allocatedBytes,
      0,
    ),
    largest: allocations
      .sort((a, b) => b.allocatedBytes - a.allocatedBytes)
      .slice(0, 10),
    inaccessible,
    truncated,
    durationMs: performance.now() - start,
  };
}
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
    const resources = runtimeResources();
    const free = resources.storage["."]?.availableBytes;
    // Scan only after a material capacity change, outside test execution.
    const inspect =
      event === "end" &&
      typeof free === "number" &&
      Math.abs(free - (this.lastInspectedFree ?? free)) >= 128 * 1024 * 1024;
    if (this.lastInspectedFree === undefined || inspect)
      this.lastInspectedFree = free;
    const deletedFiles = inspect ? deletedOpenFiles() : null;
    if (deletedFiles)
      console.log(
        JSON.stringify({
          event: "deleted_file_storage",
          testId: test.id,
          deletedFiles,
        }),
      );
    appendFileSync(
      `${browserEvidenceDirectory()}/browser-resources.jsonl`,
      JSON.stringify({
        event,
        testId: test.id,
        timeMs: Date.now(),
        ...(result
          ? { status: result.status, durationMs: result.duration }
          : {}),
        resources,
        deletedFiles,
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
    mkdirSync(browserEvidenceDirectory(), { recursive: true });
    writeFileSync(`${browserEvidenceDirectory()}/browser-resources.jsonl`, "");
    writeFileSync(
      `${browserEvidenceDirectory()}/browser-engines.json`,
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
