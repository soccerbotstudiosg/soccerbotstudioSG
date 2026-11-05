import { z } from "zod";
import {
  customerCatalogueSchema,
  DISPLAY_SNAPSHOT_MAX_AGE_MS,
} from "../src/domain/catalog";
import {
  START_INTERVAL_MINUTES,
  BOOKING_MONTH_COUNT,
} from "../src/domain/booking-policy";
import {
  publicCalendarSchema,
  studioDisplayCalendar,
  nativeAvailabilitySchema,
} from "../src/domain/native-checkout";

// Short release probes followed by bounded backoff; never provider write retries.
const releaseProbeOffsets = [
  0, 10000, 30000, 60000, 120000, 300000, 600000, 900000,
];

const schemas = {
  catalogue: customerCatalogueSchema,
  calendar: publicCalendarSchema,
};
// Account-DO SQLite retains only public display DTOs, never customer/payment
// authority. Provider caches retain their separate short freshness windows.
export class DisplaySnapshots {
  /** Initialize account-scoped display snapshot storage. */
  constructor(
    private sql: SqlStorage,
    private scope: string,
  ) {
    sql.exec(
      "CREATE TABLE IF NOT EXISTS display_snapshots(scope TEXT NOT NULL,key TEXT NOT NULL,payload TEXT NOT NULL,expires_ms INTEGER NOT NULL,PRIMARY KEY(scope,key))",
    );
    sql.exec(
      "CREATE TABLE IF NOT EXISTS display_refresh(scope TEXT PRIMARY KEY,generation INTEGER NOT NULL DEFAULT 0,started_ms INTEGER NOT NULL DEFAULT 0,dirty INTEGER NOT NULL DEFAULT 0)",
    );
    sql.exec("INSERT OR IGNORE INTO display_refresh(scope) VALUES(?)", scope);
    sql.exec(
      "CREATE TABLE IF NOT EXISTS display_release_probes(scope TEXT NOT NULL,attempt_id TEXT NOT NULL,date TEXT NOT NULL,starts_json TEXT NOT NULL,base_ms INTEGER NOT NULL,step INTEGER NOT NULL DEFAULT 0,ready_ms INTEGER NOT NULL,PRIMARY KEY(scope,attempt_id,date))",
    );
    sql.exec(
      "CREATE TABLE IF NOT EXISTS display_warm_month(scope TEXT NOT NULL,month TEXT NOT NULL,started_ms INTEGER NOT NULL,PRIMARY KEY(scope,month))",
    );
  }
  /** Retain one bounded release-read schedule per attempt/date without extending replays. */
  scheduleRelease(
    attemptId: string,
    sessions: { startMs: number }[],
    dueMs: number,
  ) {
    for (const date of new Set(
      sessions.map((s) =>
        new Date(s.startMs + 28800000).toISOString().slice(0, 10),
      ),
    )) {
      const starts = sessions
        .filter(
          (s) =>
            new Date(s.startMs + 28800000).toISOString().slice(0, 10) === date,
        )
        .map((s) => s.startMs);
      this.sql.exec(
        "INSERT OR IGNORE INTO display_release_probes(scope,attempt_id,date,starts_json,base_ms,ready_ms) VALUES(?,?,?,?,?,?)",
        this.scope,
        attemptId,
        date,
        JSON.stringify(starts),
        dueMs,
        dueMs,
      );
    }
  }
  /** Select the next retained release read, including completed tombstones only for cleanup. */
  nextRelease() {
    this.sql.exec(
      "DELETE FROM display_release_probes WHERE scope=? AND base_ms<?",
      this.scope,
      Date.now() - 86400000,
    );
    return this.sql
      .exec<{
        attempt_id: string;
        date: string;
        starts_json: string;
        base_ms: number;
        step: number;
        ready_ms: number;
      }>(
        "SELECT attempt_id,date,starts_json,base_ms,step,ready_ms FROM display_release_probes WHERE scope=? AND step>=0 ORDER BY ready_ms,attempt_id,date LIMIT 1",
        this.scope,
      )
      .toArray()[0];
  }
  /** Advance a claimed release read without replaying overdue probes in a burst. */
  finishRelease(
    job: NonNullable<ReturnType<DisplaySnapshots["nextRelease"]>>,
    released: boolean,
  ) {
    const step = released
      ? -1
      : releaseProbeOffsets.findIndex(
          (offset, index) =>
            index > job.step && job.base_ms + offset > Date.now(),
        );
    this.sql.exec(
      "UPDATE display_release_probes SET step=?,ready_ms=? WHERE scope=? AND attempt_id=? AND date=? AND step=?",
      step,
      step < 0 ? 0 : job.base_ms + releaseProbeOffsets[step],
      this.scope,
      job.attempt_id,
      job.date,
      job.step,
    );
  }
  generation() {
    return this.sql
      .exec<{ generation: number }>(
        "SELECT generation FROM display_refresh WHERE scope=?",
        this.scope,
      )
      .one().generation;
  }
  read(
    kind: "calendar",
    key: string,
  ): z.infer<typeof publicCalendarSchema> | undefined;
  read(
    kind: "catalogue",
    key: string,
  ): z.infer<typeof customerCatalogueSchema> | undefined;
  /** Read an unexpired snapshot from the current display generation. */
  read(kind: keyof typeof schemas, key: string) {
    const row = this.sql
      .exec<{ payload: string }>(
        "SELECT payload FROM display_snapshots WHERE scope=? AND key=? AND expires_ms>?",
        this.scope,
        key,
        Date.now(),
      )
      .toArray()[0];
    if (!row) return;
    try {
      const result = schemas[kind].safeParse(JSON.parse(row.payload));
      if (result.success && result.data.observedAtMs <= Date.now()) {
        if (kind === "calendar") {
          const clean = studioDisplayCalendar(
            publicCalendarSchema.parse(result.data),
          );
          // Repair retained legacy snapshots without renewing their deadline.
          if (JSON.stringify(clean) !== JSON.stringify(result.data))
            this.sql.exec(
              "UPDATE display_snapshots SET payload=? WHERE scope=? AND key=?",
              JSON.stringify(clean),
              this.scope,
              key,
            );
          return clean;
        }
        return result.data;
      }
    } catch {
      /* Corrupt display data is a cache miss, never write authority. */
    }
  }
  /** Save a display snapshot only for the expected generation. */
  save(
    kind: keyof typeof schemas,
    key: string,
    value: unknown,
    generation: number,
  ) {
    if (generation !== this.generation()) return;
    const parsed =
      kind === "calendar"
        ? studioDisplayCalendar(publicCalendarSchema.parse(value))
        : schemas[kind].parse(value);
    if (parsed.observedAtMs > Date.now()) return;
    const expires = parsed.observedAtMs + DISPLAY_SNAPSHOT_MAX_AGE_MS;
    if (expires <= Date.now()) return;
    const payload = JSON.stringify({ ...parsed, displayExpiresAtMs: expires });
    this.sql.exec(
      "DELETE FROM display_snapshots WHERE scope<>? OR expires_ms<?",
      this.scope,
      Date.now() - DISPLAY_SNAPSHOT_MAX_AGE_MS,
    );
    this.sql.exec(
      "INSERT INTO display_snapshots(scope,key,payload,expires_ms) VALUES(?,?,?,?) ON CONFLICT(scope,key) DO UPDATE SET payload=excluded.payload,expires_ms=excluded.expires_ms",
      this.scope,
      key,
      payload,
      expires,
    );
  }
  /** Remove occupied studio times without expiring unrelated display data. */
  excludeSessions(
    sessions: { startMs: number; instructorId?: string; serviceId?: string }[],
  ) {
    if (!sessions.length) return;
    this.sql.exec(
      "UPDATE display_refresh SET generation=generation+1 WHERE scope=?",
      this.scope,
    );
    for (const month of new Set(
      sessions.map((session) =>
        new Date(session.startMs + 28800000).toISOString().slice(0, 7),
      ),
    )) {
      const key = `calendar:${month}`;
      const value = this.read("calendar", key);
      if (!value) continue;
      const dates = value.dates.map((day) => {
        if (!day.offers) return day;
        // All trainers share one studio; changing trainer cannot restore capacity.
        const offers = day.offers.filter(
          (offer) =>
            !sessions.some(
              (session) =>
                Math.abs(offer.startMs - session.startMs) <
                START_INTERVAL_MINUTES * 60000,
            ),
        );
        return { ...day, offers, available: offers.length > 0 };
      });
      this.save("calendar", key, { ...value, dates }, this.generation());
    }
  }
  /** Replace only an authoritative day; retain the month's original deadline. */
  updateDay(day: z.infer<typeof nativeAvailabilitySchema>) {
    const parsed = nativeAvailabilitySchema.parse(day);
    const key = `calendar:${parsed.date.slice(0, 7)}`;
    const value = this.read("calendar", key);
    if (
      !value ||
      parsed.observedAtMs < value.observedAtMs ||
      parsed.observedAtMs > Date.now()
    )
      return;
    this.sql.exec(
      "UPDATE display_refresh SET generation=generation+1 WHERE scope=?",
      this.scope,
    );
    this.save(
      "calendar",
      key,
      {
        ...value,
        dates: value.dates.map((current) =>
          current.date === parsed.date
            ? {
                date: parsed.date,
                offers: parsed.offers,
                available: parsed.offers.length > 0,
              }
            : current,
        ),
      },
      this.generation(),
    );
  }
  invalidateCalendars() {
    this.sql.exec(
      "UPDATE display_refresh SET generation=generation+1,dirty=1 WHERE scope=?",
      this.scope,
    );
    this.sql.exec(
      "UPDATE display_snapshots SET expires_ms=? WHERE scope=? AND key LIKE 'calendar:%'",
      Date.now(),
      this.scope,
    );
  }
  /** Claim one due month per scheduler turn, prioritizing missing and oldest work. */
  claimRefresh(now: number): string | undefined {
    const candidates = this.months()
      .map((month) => ({
        month,
        snapshot: this.read("calendar", `calendar:${month}`),
        started:
          this.sql
            .exec<{ started_ms: number }>(
              "SELECT started_ms FROM display_warm_month WHERE scope=? AND month=?",
              this.scope,
              month,
            )
            .toArray()[0]?.started_ms ?? 0,
      }))
      .filter(
        ({ snapshot, started }) =>
          (!snapshot || snapshot.observedAtMs <= now - 15 * 60000) &&
          started <= now - 60000,
      )
      .sort(
        (a, b) =>
          Number(!!a.snapshot) - Number(!!b.snapshot) ||
          a.started - b.started ||
          a.month.localeCompare(b.month),
      );
    const month = candidates[0]?.month;
    if (!month) return;
    this.sql.exec(
      "INSERT INTO display_warm_month(scope,month,started_ms) VALUES(?,?,?) ON CONFLICT(scope,month) DO UPDATE SET started_ms=excluded.started_ms",
      this.scope,
      month,
      now,
    );
    return month;
  }
  /** Select the calendar months eligible for display warming. */
  months() {
    const today = new Date(Date.now() + 28800000).toISOString().slice(0, 7);
    return Array.from({ length: BOOKING_MONTH_COUNT }, (_, offset) => {
      const date = new Date(today + "-01T00:00:00Z");
      date.setUTCMonth(date.getUTCMonth() + offset);
      return date.toISOString().slice(0, 7);
    });
  }
}
