import { z } from "zod";
import {
  customerCatalogueSchema,
  DISPLAY_SNAPSHOT_MAX_AGE_MS,
} from "../src/domain/catalog";
import { SESSION_MINUTES } from "../src/domain/booking-policy";
import {
  publicCalendarSchema,
  nativeAvailabilitySchema,
} from "../src/domain/native-checkout";

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
      if (result.success && result.data.observedAtMs <= Date.now())
        return result.data;
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
    const parsed = schemas[kind].parse(value);
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
    sharedStudio = true,
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
                  SESSION_MINUTES * 60000 &&
                (sharedStudio ||
                  (offer.instructorId === session.instructorId &&
                    offer.serviceId === session.serviceId)),
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
  /** Retry an interrupted warm-up on the next scheduler turn without expiring data. */
  deferRefresh() {
    this.sql.exec(
      "UPDATE display_refresh SET dirty=1 WHERE scope=?",
      this.scope,
    );
  }
  claimRefresh(now: number) {
    // Persist the claim before queueing: overlapping cron/booking triggers and
    // restarts cannot duplicate the refresh. Failure retries on the next cycle.
    return (
      this.sql
        .exec(
          "UPDATE display_refresh SET started_ms=?,dirty=0 WHERE scope=? AND (dirty=1 OR started_ms<=?) RETURNING scope",
          now,
          this.scope,
          now - 15 * 60_000,
        )
        .toArray().length === 1
    );
  }
  /** Select the calendar months eligible for display warming. */
  months() {
    const today = new Date(Date.now() + 28800000).toISOString().slice(0, 7);
    const end = new Date(today + "-01T00:00:00Z");
    end.setUTCMonth(end.getUTCMonth() + 3);
    const last = end.toISOString().slice(0, 7);
    const rows = this.sql
      .exec<{ key: string }>(
        "SELECT key FROM display_snapshots WHERE scope=? AND key LIKE 'calendar:%' ORDER BY key",
        this.scope,
      )
      .toArray();
    return [
      ...new Set([
        today,
        ...rows
          .map((row) => row.key.slice(9))
          .filter((month) => month >= today && month <= last),
      ]),
    ].slice(0, 4);
  }
}
