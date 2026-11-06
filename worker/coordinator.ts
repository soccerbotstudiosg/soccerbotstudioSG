import {
  assertClosedFoundation,
  coordinatorName,
  verifyBindings,
} from "./bindings";
import {
  createConfirmationTrace,
  confirmationTraceKey,
  runConfirmationTrace,
  finishConfirmationTrace,
} from "./confirmation-tracing";
import {
  createCheckoutTrace,
  runCheckoutTrace,
  finishCheckoutTrace,
} from "./checkout-tracing";
import { annotatePendingBooking } from "./native-comments";
import { DisplaySnapshots } from "./display-snapshots";
import { bookingReceipt } from "./receipt";
import {
  assertPaymentScope,
  paymentScopeSchema,
  hitpaySetting,
} from "./hitpay-contract";
import { expireCheckout } from "./checkout-progress";
import { dismissCompletedCheckout } from "./completed-checkout";
import {
  BOOKING_LEAD_MS,
  isStudioSessionStart,
} from "../src/domain/booking-policy";
import { ProviderQueue } from "./provider-queue";
import { payHitpayHold } from "./hitpay-hold";
import { hitpayRecoveryEnabled } from "./hitpay-contract";
import { recoverHitpay } from "./hitpay-recovery";
import { ongoingReadbackDue } from "./ongoing-readback";
import {
  authorizeCustomerCheckout,
  rejectedCheckoutReadback,
} from "./customer-authority";
import {
  publicCalendar,
  calendarWindow,
  hasPublicCalendarWindow,
  windowCatalogue,
  windowCalendar,
  windowAvailability,
} from "./public-calendar";
import { authenticate } from "./access";
import { NativeCalendarReads } from "./native-calendar";
import { manageWebhookSubscription } from "./webhook-subscriptions";
import {
  prepareCustomerNative,
  executeNativeCheckout,
  customerNativeAvailability,
  customerNativeCalendar,
} from "./native-checkout";
import { z } from "zod";
import { nativePrepareSchema } from "../src/domain/native-checkout";
import { intentSchema, associationSchema } from "./journal";
import { runNativeReadback } from "./recovery";
import {
  readNativeAttempt,
  storedNativeSignature,
  recoverNativeAssociation,
} from "./native-adapter";
import { providerSecrets } from "./provider-transport";
import { bookingWallTime } from "./provider-normalization";
import { offeredStarts } from "./prebooking";
import {
  inspectNativeSetup,
  webhookSubscriptionStructure,
} from "./native-setup";
import {
  residualGrant,
  recoverNativeResidual,
  type ResidualAuthority,
} from "./native-residual";
import { DurableObject } from "cloudflare:workers";
import {
  traced,
  measure,
  instrumentStorage,
  traceCalendar,
} from "./diagnostics";
import {
  providerCredentialName,
  ApiError,
  policy,
  rpcOutcome,
  liveCustomerAccess,
} from "./policy";
import { ProviderSession, type ProviderControl } from "./provider-session";
// One instance per actual provider account. No booking or customer data here.
export class SoccerBotAccountCoordinator extends DurableObject<Env> {
  private readonly instanceId = crypto.randomUUID();
  private provider: ProviderSession;
  private calendarReads = new NativeCalendarReads();
  private providerQueue = new ProviderQueue();
  private admissionTurn: Promise<void> = Promise.resolve();
  private async reserveInOrder<T>(reserve: () => Promise<T>): Promise<T> {
    const previous = this.admissionTurn;
    let release!: () => void;
    this.admissionTurn = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await reserve();
    } finally {
      release();
    }
  }
  private get sql() {
    return instrumentStorage(this.ctx.storage.sql);
  }
  /** Initialize durable account coordination and recover interrupted transport accounting. */
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.provider = new ProviderSession(this.sql);
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS budget (campaign TEXT PRIMARY KEY, used INTEGER NOT NULL, cooldown_ms INTEGER NOT NULL DEFAULT 0)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS refreshes (key TEXT PRIMARY KEY, generation INTEGER NOT NULL, claim TEXT NOT NULL, expires_ms INTEGER NOT NULL, completed_ms INTEGER)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS admissions (id TEXT PRIMARY KEY, campaign TEXT NOT NULL, started_ms INTEGER NOT NULL, finished INTEGER NOT NULL DEFAULT 0)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS admission_releases (id TEXT PRIMARY KEY, campaign TEXT NOT NULL, started_ms INTEGER NOT NULL, reason TEXT NOT NULL CHECK(reason IN ('read_transport_ended','reviewed_historical_read_timeout')), recorded_ms INTEGER NOT NULL, evidence TEXT)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS financial_releases(id TEXT PRIMARY KEY,attempt_id TEXT NOT NULL,recorded_ms INTEGER NOT NULL)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS payment_wakeups(attempt_id TEXT PRIMARY KEY, correlation_id TEXT NOT NULL, generation INTEGER NOT NULL)",
    );
    if (
      !ctx.storage.sql
        .exec<{ name: string }>("PRAGMA table_info(payment_wakeups)")
        .toArray()
        .some((column) => column.name === "ready_ms")
    )
      ctx.storage.sql.exec(
        "ALTER TABLE payment_wakeups ADD COLUMN ready_ms INTEGER NOT NULL DEFAULT 0",
      );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS provider_request_admissions(id TEXT PRIMARY KEY,operation TEXT NOT NULL,read_only INTEGER NOT NULL CHECK(read_only IN (0,1)),instance_id TEXT NOT NULL,expires_ms INTEGER NOT NULL)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS provider_transport_releases(id TEXT PRIMARY KEY,operation TEXT NOT NULL,read_only INTEGER NOT NULL,recorded_ms INTEGER NOT NULL,reason TEXT NOT NULL)",
    );
    // Keep pacing/rate reads independent of retained admission history. The
    // partial index contains only reservations that still hold concurrency.
    ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS admissions_started_ms ON admissions(started_ms)",
    );
    ctx.storage.sql.exec(
      "CREATE INDEX IF NOT EXISTS admissions_unfinished ON admissions(finished) WHERE finished=0",
    );
  }
  /** Inspect initialized storage without invoking providers or scheduling work. */
  async inspectFoundation() {
    assertClosedFoundation(this.env);
    await verifyBindings(this.env);
    if (
      this.ctx.id.toString() !==
      this.env.COORDINATOR.idFromName(coordinatorName(this.env)).toString()
    )
      throw new Error("Coordinator identity mismatch");
    return {
      coordinatorId: this.ctx.id.toString(),
      alarm: await this.ctx.storage.getAlarm(),
      pendingWakeups: this.sql
        .exec<{ count: number }>(
          "SELECT COUNT(*) AS count FROM payment_wakeups",
        )
        .one().count,
      location: null,
    };
  }
  /** Reconcile interrupted transport accounting without replaying uncertain writes. */
  private recoverInterruptedTransports() {
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.sql.exec(
        "INSERT INTO admission_releases(id,campaign,started_ms,reason,recorded_ms,evidence) SELECT a.id,a.campaign,a.started_ms,'read_transport_ended',?,r.operation FROM admissions a INDEXED BY admissions_unfinished JOIN provider_request_admissions r ON r.id=a.id WHERE a.finished=0 AND r.expires_ms<=? AND r.instance_id<>? AND r.read_only=1 ON CONFLICT(id) DO NOTHING",
        now,
        now,
        this.instanceId,
      );
      this.sql.exec(
        "INSERT INTO provider_transport_releases SELECT a.id,r.operation,r.read_only,?,'instance_ended' FROM admissions a INDEXED BY admissions_unfinished JOIN provider_request_admissions r ON r.id=a.id WHERE a.finished=0 AND r.expires_ms<=? AND r.instance_id<>? ON CONFLICT(id) DO NOTHING",
        now,
        now,
        this.instanceId,
      );
      this.sql.exec(
        "UPDATE admissions SET finished=1 WHERE id IN (SELECT a.id FROM admissions a INDEXED BY admissions_unfinished JOIN provider_request_admissions r ON r.id=a.id WHERE a.finished=0 AND r.expires_ms<=? AND r.instance_id<>?)",
        now,
        this.instanceId,
      );
    });
  }
  /** Reserve provider capacity under the account's durable admission limits. */
  admit(
    recovery: boolean,
    customer = false,
    financial = false,
    metadata?: { operation: string; readOnly: boolean },
  ) {
    this.recoverInterruptedTransports();
    const p = policy(this.env);
    const now = Date.now();
    const ongoing =
      (customer && liveCustomerAccess(this.env)) ||
      (financial && recovery && hitpayRecoveryEnabled(this.env));
    if (!["disabled", "trusted-reads"].includes(this.env.PROVIDER_ACCESS))
      throw new Error("Unsupported provider mode");
    // Synthetic admission exercises accounting only. No outbound provider path is enabled.
    if (
      !ongoing &&
      (!Number.isSafeInteger(Number(this.env.CAMPAIGN_END_MS)) ||
        now >= Number(this.env.CAMPAIGN_END_MS))
    )
      return { allowed: false, reason: "campaign_closed" };
    const sql = this.sql;
    return this.ctx.storage.transactionSync(() => {
      sql.exec(
        "INSERT OR IGNORE INTO budget(campaign,used) VALUES(?,0)",
        this.env.CAMPAIGN_ID,
      );
      const budget = sql
        .exec<{ used: number; cooldown_ms: number }>(
          "SELECT used,cooldown_ms FROM budget WHERE campaign=?",
          this.env.CAMPAIGN_ID,
        )
        .one();
      if (
        !ongoing &&
        budget.used >= p.PROVIDER_CALL_CEILING - (recovery ? 0 : 16)
      )
        return { allowed: false, reason: "budget_exhausted" };
      if (budget.cooldown_ms > now)
        return { allowed: false, reason: "cooldown" };
      // Active transports and unidentified legacy reservations retain their slots.
      // Identified ended transports are independent of durable write outcomes.
      if (
        sql
          .exec<{ n: number }>(
            "SELECT count(*) n FROM admissions WHERE finished=0",
          )
          .one().n >= 2
      )
        return { allowed: false, reason: "concurrency" };
      if (
        sql
          .exec<{ n: number }>(
            "SELECT count(*) n FROM admissions WHERE started_ms>?",
            now - 1000,
          )
          .one().n >= 4
      )
        return { allowed: false, reason: "rate" };
      const id = crypto.randomUUID();
      sql.exec(
        "INSERT INTO admissions(id,campaign,started_ms) VALUES(?,?,?)",
        id,
        this.env.CAMPAIGN_ID,
        now,
      );
      if (metadata)
        sql.exec(
          "INSERT INTO provider_request_admissions(id,operation,read_only,instance_id,expires_ms) VALUES(?,?,?,?,?)",
          id,
          metadata.operation,
          metadata.readOnly ? 1 : 0,
          this.instanceId,
          now + 30000,
        );
      sql.exec(
        "UPDATE budget SET used=used+1 WHERE campaign=?",
        this.env.CAMPAIGN_ID,
      );
      return { allowed: true, id, used: budget.used + 1 };
    });
  }
  /** Provide transport admission and completion accounting to provider operations. */
  private providerControl(
    recovery = false,
    customer = false,
    financial = false,
  ): ProviderControl {
    this.recoverInterruptedTransports();
    return {
      liveCustomer: customer,
      // A retained unknown request still owns its physical slot. Use the one
      // remaining slot sequentially rather than launching a two-read burst.
      parallelReads: this.providerAccounting().active === 0,
      financialRecovery: financial,
      reconciled: (id, attemptId) => {
        if (!financial || !recovery)
          throw new ApiError(403, "financial_recovery_required");
        this.ctx.storage.transactionSync(() => {
          this.sql.exec(
            "INSERT INTO financial_releases SELECT id,?,? FROM admissions WHERE id=? AND finished=0 ON CONFLICT(id) DO NOTHING",
            attemptId,
            Date.now(),
            id,
          );
          this.sql.exec(
            "UPDATE admissions SET finished=1 WHERE id=? AND finished=0",
            id,
          );
        });
      },
      reserve: async (metadata) =>
        this.reserveInOrder(() =>
          measure("coordinator", async () => {
            if (
              (customer && liveCustomerAccess(this.env)) ||
              (financial && recovery && hitpayRecoveryEnabled(this.env))
            ) {
              const last =
                this.sql
                  .exec<{ latest: number | null }>(
                    "SELECT MAX(started_ms) AS latest FROM admissions",
                  )
                  .one().latest ?? 0;
              const delay = Math.max(0, last + 300 - Date.now());
              if (delay)
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            const admitted = this.admit(
              recovery,
              customer,
              financial,
              metadata,
            );
            if (!admitted.allowed || !admitted.id)
              throw new ApiError(
                503,
                admitted.reason || "provider_admission_denied",
              );
            await measure("storage", () => this.ctx.storage.sync());
            return admitted.id;
          }),
        ),
      finish: (id, cooldown, reason) => this.finish(id, cooldown, reason),
      claim: (family) => {
        const row = this.sql
          .exec<{
            generation: number;
            expires_ms: number;
            completed_ms: number | null;
          }>(
            "SELECT generation,expires_ms,completed_ms FROM refreshes WHERE key=?",
            `token:${family}`,
          )
          .toArray()[0];
        if (row && row.completed_ms === null && row.expires_ms > Date.now())
          throw new ApiError(503, "provider_refresh_busy");
        const generation = (row?.generation ?? 0) + 1;
        const claimed = this.claimRefresh(`token:${family}`, generation);
        if (!claimed.granted || !claimed.claim)
          throw new ApiError(503, "provider_refresh_busy");
        return { generation, claim: claimed.claim };
      },
      complete: (family, claim, generation) =>
        this.completeRefresh(`token:${family}`, claim, generation),
      pause: () => this.finish("", 60000),
    };
  }
  /** Execute an authorized provider read through account coordination. */
  async providerRead(
    operation:
      "provider_identity" | "historical_comparison" | "native_field_discovery",
    correlationId: string,
    expiresMs?: number,
  ) {
    return traced(correlationId, "coordinator", async () => {
      policy(this.env);
      if (String(this.env.PROVIDER_ACCESS) !== "trusted-reads")
        throw new ApiError(503, "provider_access_disabled");
      try {
        if (Date.now() >= Number(this.env.CAMPAIGN_END_MS))
          throw new ApiError(503, "campaign_closed");
        if (
          operation !== "provider_identity" &&
          operation !== "historical_comparison" &&
          operation !== "native_field_discovery"
        )
          throw new ApiError(503, "provider_operation_unavailable");
        const control = this.providerControl();
        if (operation === "native_field_discovery") {
          const now = Date.now();
          if (
            !Number.isSafeInteger(expiresMs) ||
            !expiresMs ||
            expiresMs <= now ||
            expiresMs > now + 180000
          )
            throw new ApiError(503, "discovery_window_invalid");
          const initial = this.providerAccounting();
          if (initial.used !== 8 || initial.active !== 0)
            throw new ApiError(503, "discovery_accounting_changed");
          let reserved = 0;
          let lastDispatch = 0;
          const bounded: ProviderControl = {
            ...control,
            reserve: async (metadata) => {
              const delay = Math.max(0, lastDispatch + 300 - Date.now());
              if (delay)
                await new Promise((resolve) => setTimeout(resolve, delay));
              if (
                Date.now() + 15000 >= expiresMs ||
                reserved >= 5 ||
                this.providerAccounting().used >= 13
              )
                throw new ApiError(503, "discovery_limit_reached");
              reserved++;
              lastDispatch = Date.now();
              return control.reserve(metadata);
            },
          };
          const result = await this.provider.discoverFields(this.env, bounded);
          if (Date.now() >= expiresMs)
            throw new ApiError(503, "discovery_expired");
          return { ...result, accounting: this.providerAccounting() };
        }
        const result =
          operation === "provider_identity"
            ? await this.provider.identity(this.env, control)
            : await this.provider.comparison(this.env, control);
        return { ...result, accounting: this.providerAccounting() };
      } catch (error) {
        return {
          verified: false,
          reason:
            error instanceof ApiError
              ? error.code
              : "provider_proof_incomplete",
          accounting: this.providerAccounting(),
        };
      }
    });
  }
  // A one-use operator grant owns this read-only calendar range. Customer
  // grants still admit only their two exact dates after operator selection.
  /** Coordinate a scoped provider webhook-subscription operation. */
  async webhookSubscription(
    capabilityHash: string,
    action: "create" | "cleanup",
    correlationId: string,
  ) {
    return traced(correlationId, "coordinator", () =>
      rpcOutcome(() =>
        manageWebhookSubscription(
          this.env,
          this.provider,
          this.providerControl(),
          () => this.providerAccounting(),
          capabilityHash,
          action,
        ),
      ),
    );
  }
  /** Run the bounded native discovery operation under its retained grant. */
  async nativeDiscoveryProbe(
    rawScope: unknown,
    expiresMs: number,
    correlationId: string,
  ) {
    return traced(correlationId, "coordinator", async () => {
      const p = policy(this.env),
        now = Date.now();
      const webhookScope = z
        .strictObject({
          kind: z.literal("native-webhook-structure"),
          sourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
          accountId: z.string().min(1).max(128),
          startingUsed: z.number().int().nonnegative().safe(),
          maxCalls: z.literal(6),
        })
        .safeParse(rawScope);
      if (webhookScope.success) {
        const scope = webhookScope.data,
          initial = this.providerAccounting();
        if (
          p.PROVIDER_ACCESS !== "trusted-reads" ||
          p.CAMPAIGN_END_MS <= now ||
          scope.sourceRevision !== p.SOURCE_REVISION ||
          scope.accountId !== p.DEPLOYMENT_ACCOUNT_ID ||
          !Number.isSafeInteger(expiresMs) ||
          expiresMs <= now ||
          expiresMs > now + 180000 ||
          expiresMs > p.CAMPAIGN_END_MS ||
          initial.used !== scope.startingUsed ||
          initial.active !== 0 ||
          scope.startingUsed + 6 > p.PROVIDER_CALL_CEILING - 16
        ) {
          throw new ApiError(503, "webhook_inspection_scope_unavailable");
        }
        const control = this.providerControl();
        let count = 0,
          last = Date.now();
        const bounded: ProviderControl = {
          ...control,
          reserve: async (metadata) => {
            const delay = Math.max(0, last + 300 - Date.now());
            if (delay)
              await new Promise((resolve) => setTimeout(resolve, delay));
            if (
              Date.now() + 15000 >= Math.min(expiresMs, p.CAMPAIGN_END_MS) ||
              count >= 6 ||
              this.providerAccounting().used >= scope.startingUsed + 6
            )
              throw new ApiError(503, "webhook_inspection_exhausted");
            count++;
            last = Date.now();
            return control.reserve(metadata);
          },
        };
        await this.provider.identity(this.env, bounded);
        const response = await this.provider.nativeRead(this.env, bounded, {
          kind: "webhook-subscriptions",
        });
        if (Date.now() >= expiresMs)
          throw new ApiError(503, "webhook_inspection_expired");
        return {
          verified: true,
          evidence: "subscription_structure_only",
          normalized: false,
          representation: webhookSubscriptionStructure(response.body),
          accounting: this.providerAccounting(),
        };
      }
      const parsed = z
        .strictObject({
          kind: z.enum(["native-calendar", "native-setup"]),
          sourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
          accountId: z.string().min(1).max(128),
          serviceId: z.literal("2"),
          instructorId: z.literal("3"),
          from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          startingUsed: z.number().int().nonnegative().safe(),
          maxCalls: z.union([z.literal(6), z.literal(16)]),
        })
        .refine(
          (value) =>
            value.maxCalls === (value.kind === "native-calendar" ? 6 : 16),
        )
        .safeParse(rawScope);
      if (!parsed.success)
        throw new ApiError(503, "calendar_scope_unavailable");
      const scope = parsed.data;
      const from = bookingWallTime(scope.from + " 00:00:00", "Asia/Singapore");
      const to = bookingWallTime(scope.to + " 00:00:00", "Asia/Singapore");
      const initial = this.providerAccounting();
      if (
        p.ENVIRONMENT !== "developer" ||
        p.PROVIDER_ACCESS !== "trusted-reads" ||
        p.CAMPAIGN_END_MS <= now ||
        scope.sourceRevision !== String(this.env.SOURCE_REVISION) ||
        scope.accountId !== p.DEPLOYMENT_ACCOUNT_ID ||
        !Number.isSafeInteger(expiresMs) ||
        expiresMs <= now ||
        expiresMs > now + 180000 ||
        expiresMs > p.CAMPAIGN_END_MS ||
        from - now < 48 * 3600000 ||
        to < from ||
        to - from > 14 * 86400000 ||
        (scope.kind === "native-setup" && to - from > 86400000) ||
        initial.used !== scope.startingUsed ||
        initial.active !== 0 ||
        scope.startingUsed + scope.maxCalls > p.PROVIDER_CALL_CEILING - 16
      )
        throw new ApiError(503, "calendar_scope_unavailable");
      const control = this.providerControl();
      let count = 0,
        last = 0;
      const bounded: ProviderControl = {
        ...control,
        reserve: async (metadata) => {
          const delay = Math.max(0, last + 300 - Date.now());
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          if (
            Date.now() + 15000 >= Math.min(expiresMs, p.CAMPAIGN_END_MS) ||
            count >= scope.maxCalls ||
            this.providerAccounting().used >=
              scope.startingUsed + scope.maxCalls
          )
            throw new ApiError(503, "calendar_scope_exhausted");
          count++;
          last = Date.now();
          return control.reserve(metadata);
        },
      };
      try {
        if (scope.kind === "native-setup") {
          const result = await inspectNativeSetup(
            async (request) => {
              await this.provider.identity(this.env, bounded);
              return this.provider.nativeRead(this.env, bounded, request);
            },
            scope.from,
            scope.to,
          );
          if (Date.now() >= expiresMs)
            throw new ApiError(503, "calendar_scope_expired");
          return {
            ...result,
            kind: scope.kind,
            from: scope.from,
            to: scope.to,
            serviceId: scope.serviceId,
            instructorId: scope.instructorId,
            accounting: this.providerAccounting(),
          };
        }
        await this.provider.identity(this.env, bounded);
        const response = await this.provider.nativeRead(this.env, bounded, {
          kind: "availability-range",
          serviceId: scope.serviceId,
          instructorId: scope.instructorId,
          from: scope.from,
          to: scope.to,
        });
        if (Date.now() >= expiresMs)
          throw new ApiError(503, "calendar_scope_expired");
        const matrix = z.record(z.string(), z.unknown()).parse(response.body);
        if (Object.keys(matrix).length > 15)
          throw new ApiError(503, "calendar_representation_unavailable");
        const dates = Object.keys(matrix)
          .sort()
          .map((date) => {
            const start = bookingWallTime(date + " 00:00:00", "Asia/Singapore");
            if (start < from || start > to)
              throw new ApiError(503, "calendar_representation_unavailable");
            return {
              date,
              starts: offeredStarts({ [date]: matrix[date] }, date).sort(),
            };
          })
          .filter((entry) => entry.starts.length > 0);
        return {
          verified: true,
          kind: scope.kind,
          from: scope.from,
          to: scope.to,
          serviceId: scope.serviceId,
          instructorId: scope.instructorId,
          dates,
          accounting: this.providerAccounting(),
        };
      } catch (error) {
        return {
          verified: false,
          reason:
            error instanceof ApiError
              ? error.code
              : "calendar_proof_incomplete",
          accounting: this.providerAccounting(),
        };
      }
    });
  }
  /** Read the customer catalogue through the serialized provider queue. */
  async customerCatalogue(
    scope: { startingUsed: number; maxCalls: number; expiresMs: number },
    correlationId: string,
  ) {
    return traced(correlationId, "coordinator", async () => {
      const p = policy(this.env),
        initial = this.providerAccounting();
      if (
        p.PROVIDER_ACCESS !== "trusted-reads" ||
        Date.now() >= p.CAMPAIGN_END_MS ||
        !Number.isSafeInteger(scope.expiresMs) ||
        scope.expiresMs <= Date.now() ||
        scope.expiresMs > Date.now() + 180000 ||
        scope.maxCalls !== 6 ||
        !Number.isSafeInteger(scope.startingUsed) ||
        scope.startingUsed < 0 ||
        scope.startingUsed > 58 ||
        initial.used !== scope.startingUsed ||
        initial.active !== 0
      )
        throw new ApiError(503, "catalogue_scope_unavailable");
      const control = this.providerControl();
      let count = 0,
        last = 0;
      const bounded: ProviderControl = {
        ...control,
        reserve: async (metadata) => {
          const delay = Math.max(0, last + 300 - Date.now());
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          if (
            Date.now() + 15000 >=
              Math.min(scope.expiresMs, p.CAMPAIGN_END_MS) ||
            count >= 6 ||
            this.providerAccounting().used >= scope.startingUsed + 6
          )
            throw new ApiError(503, "catalogue_scope_exhausted");
          count++;
          last = Date.now();
          return control.reserve(metadata);
        },
      };
      await this.provider.identity(this.env, bounded);
      const result = await this.provider.catalogue(this.env, bounded, true);
      return {
        environment: result.binding.environmentId,
        observedAtMs: result.observedAtMs,
        complete: result.complete,
        services: result.services,
        instructors: result.instructors,
      };
    });
  }
  /** Read native slot availability under the granted operation scope. */
  async nativeAvailability(
    scope: { date: string; serviceId: string; cookie: string; fresh?: boolean },
    correlationId: string,
  ) {
    const pending = this.providerQueue.run("foreground", () =>
      traced(correlationId, "coordinator", async () => {
        if (hasPublicCalendarWindow(this.env)) {
          await authenticate(
            new Request(this.env.APP_ORIGIN, {
              headers: { cookie: scope.cookie },
            }),
            this.env,
            Date.now(),
          );
          const result = await windowAvailability({
            ...this.calendarReadOptions(),
            ...scope,
          });
          await authenticate(
            new Request(this.env.APP_ORIGIN, {
              headers: { cookie: scope.cookie },
            }),
            this.env,
            Date.now(),
          );
          return result;
        }
        return customerNativeAvailability({
          request: new Request(this.env.APP_ORIGIN, {
            headers: { cookie: scope.cookie },
          }),
          env: this.env,
          date: scope.date,
          fresh: scope.fresh,
          invalidate: () => this.calendarReads.invalidateDate(scope.date),
          serviceId: scope.serviceId,
          provider: this.provider,
          control: this.providerControl(),
          accounting: () => this.providerAccounting(),
        });
      }),
    );
    return rpcOutcome(() => pending);
  }
  private displayWarmingEnabled() {
    return (
      liveCustomerAccess(this.env) &&
      policy(this.env).PUBLIC_DISPLAY_WARMING === "enabled"
    );
  }
  private snapshots() {
    const { binding, p } = calendarWindow(this.calendarReadOptions());
    return new DisplaySnapshots(
      this.sql,
      JSON.stringify([binding, p.SOURCE_REVISION, p.PREMIUM_SERVICE_ID]),
    );
  }
  /** Serve a valid display snapshot or queue a provider calendar read. */
  async publicCalendar(month: string, correlationId: string) {
    const started = performance.now();
    const outcome = await rpcOutcome(() =>
      traced(correlationId, "coordinator", async () => {
        const store = liveCustomerAccess(this.env)
          ? this.snapshots()
          : undefined;
        const cached = store?.read("calendar", `calendar:${month}`);
        let value;
        let persisted = false;
        if (cached && store?.months().includes(month)) {
          traceCalendar(correlationId, "hit", { trigger: "customer", month });
          value = this.filterDisplayCalendar(cached);
          persisted = true;
        } else {
          traceCalendar(correlationId, "miss", { trigger: "customer", month });
          const generation = store?.generation() ?? 0;
          traceCalendar(correlationId, "build_started", {
            trigger: "customer",
            month,
          });
          const built = await this.displayRead((cacheOnly) =>
            publicCalendar({ ...this.calendarReadOptions(), month, cacheOnly }),
          );
          store?.save("calendar", `calendar:${month}`, built, generation);
          const saved = store?.read("calendar", `calendar:${month}`);
          persisted = saved !== undefined;
          value = saved ?? built;
          const savedBuild = persisted && store?.generation() === generation;
          traceCalendar(
            correlationId,
            savedBuild ? "build_saved" : "build_discarded",
            {
              trigger: "customer",
              month,
              persisted: savedBuild,
            },
          );
        }
        traceCalendar(correlationId, "serve", {
          trigger: "customer",
          month,
          persisted,
          durationMs: performance.now() - started,
          observedAtMs: value.observedAtMs,
          ageMs: Math.max(0, Date.now() - value.observedAtMs),
          dateCount: value.dates.length,
          offerCount: value.dates.reduce(
            (n, day) => n + (day.offers?.length ?? 0),
            0,
          ),
        });
        return value;
      }),
    ).catch((error: unknown) => {
      traceCalendar(correlationId, "build_failed", {
        trigger: "customer",
        month,
        code: "temporarily_unavailable",
        durationMs: performance.now() - started,
      });
      throw error;
    });
    if (!outcome.ok)
      traceCalendar(correlationId, "build_failed", {
        trigger: "customer",
        month,
        code: outcome.error.code,
        durationMs: performance.now() - started,
      });
    return outcome;
  }

  /** Filter cached display dates using the current booking cutoff. */
  private filterDisplayCalendar(
    value: Awaited<ReturnType<typeof publicCalendar>>,
  ) {
    const now = Date.now();
    return {
      ...value,
      dates: value.dates
        .filter(
          (day) =>
            day.date >= new Date(now + 28800000).toISOString().slice(0, 10),
        )
        .map((day) => {
          const offers = day.offers?.filter(
            (offer) =>
              isStudioSessionStart(offer.startMs) &&
              offer.startMs - now >= BOOKING_LEAD_MS,
          );
          return {
            ...day,
            ...(offers ? { offers, available: offers.length > 0 } : {}),
          };
        }),
    };
  }
  /** Apply retained dispatch evidence to display without starting a month rebuild. */
  private async refreshDisplayAfterWrite(attemptId: string, ownerId: string) {
    if (!liveCustomerAccess(this.env)) {
      this.calendarReads.invalidate();
      return;
    }
    try {
      const rows = await this.env.STATE.withSession("first-primary")
        .prepare(
          "SELECT a.intent_json,e.step,g.result_json FROM attempts a LEFT JOIN session_effects e ON e.attempt_id=a.id AND e.step GLOB 'session:[0-9]*' LEFT JOIN native_checkout_grants g ON g.attempt_id=a.id WHERE a.id=? AND a.owner_id=?",
        )
        .bind(attemptId, ownerId)
        .all<{
          intent_json: string;
          step: string | null;
          result_json: string | null;
        }>();
      const sessions = rows.results.flatMap((row) => {
        const intent = intentSchema.parse(JSON.parse(row.intent_json));
        if (row.step === null) {
          const result = z
            .object({
              state: z.string(),
              rejectedSessionIndex: z.number().int().nonnegative().optional(),
            })
            .safeParse(JSON.parse(row.result_json ?? "null"));
          if (result.success && result.data.state === "selection_unavailable") {
            const rejected =
              intent.sessions[result.data.rejectedSessionIndex ?? 0];
            if (rejected) return [rejected];
          }
          return [];
        }
        const session =
          intent.sessions[Number(row.step.slice("session:".length))];
        return session ? [session] : [];
      });
      this.snapshots().excludeSessions(sessions);
      for (const session of sessions)
        this.calendarReads.invalidateDate(
          new Date(session.startMs + 28800000).toISOString().slice(0, 10),
        );
      const hold = await this.env.STATE.prepare(
        "SELECT expires_ms FROM hitpay_holds WHERE attempt_id=?",
      )
        .bind(attemptId)
        .first<{ expires_ms: number }>();
      if (hold && sessions.length) {
        this.snapshots().scheduleRelease(attemptId, sessions, hold.expires_ms);
        await this.schedulePaymentAlarm();
      }
    } catch {
      // Display maintenance cannot replace a durable checkout/payment outcome.
      // Stale display grants no booking authority; preserve the original result.
      console.error(JSON.stringify({ event: "display_update_unavailable" }));
    }
  }
  private releaseRead: Promise<void> | undefined;
  /** Share concurrent alarm/cron reads of the same release job. */
  private refreshReleasedDay() {
    if (!this.releaseRead)
      this.releaseRead = this.readReleasedDay().finally(() => {
        this.releaseRead = undefined;
      });
    return this.releaseRead;
  }
  /** Refresh only a due release date from current provider capacity, independent of browser life. */
  private async readReleasedDay() {
    if (!liveCustomerAccess(this.env)) return;
    const store = this.snapshots();
    const job = store.nextRelease();
    if (!job || job.ready_ms > Date.now()) return;
    let released = false;
    try {
      await this.providerQueue.run("display", async () => {
        const paid = await this.env.STATE.prepare(
          "SELECT 1 FROM hitpay_payments WHERE attempt_id=? AND (paid_ms IS NOT NULL OR payment_id IS NOT NULL OR external_state!='none')",
        )
          .bind(job.attempt_id)
          .first();
        if (paid || !store.months().includes(job.date.slice(0, 7))) {
          released = true;
          return;
        }
        const options = this.calendarReadOptions();
        const { window } = calendarWindow(options);
        const day = await windowAvailability({
          ...options,
          date: job.date,
          serviceId: window.serviceId,
          fresh: true,
        });
        const starts = z.array(z.number()).parse(JSON.parse(job.starts_json));
        released = starts.every(
          (start) =>
            start - Date.now() < BOOKING_LEAD_MS ||
            day.offers.some((offer) => offer.startMs === start),
        );
      });
    } catch {
      console.error(
        JSON.stringify({
          event: "display_release_probe_failed",
          date: job.date,
        }),
      );
    } finally {
      store.finishRelease(job, released);
      await this.schedulePaymentAlarm();
    }
  }
  /** Refresh display snapshots and eligible tokens through the display queue. */
  async warmDisplay() {
    const correlationId = crypto.randomUUID();
    return traced(correlationId, "scheduled", async () => {
      if (!this.displayWarmingEnabled()) return;
      await this.refreshReleasedDay();
      const store = this.snapshots();
      const month = store.claimRefresh(Date.now());
      const started = performance.now();
      if (!month) {
        traceCalendar(correlationId, "refresh_skipped", { trigger: "warming" });
        return;
      }
      const beforeProviderRead = () => {
        if (this.providerQueue.hasCustomerWaiting())
          throw new ApiError(503, "display_refresh_deferred");
      };
      try {
        await this.providerQueue.run("display", async () => {
          beforeProviderRead();
          await this.provider.refreshPublicTokenAhead(
            this.env,
            this.providerControl(false, true),
          );
          const generation = store.generation();
          traceCalendar(correlationId, "build_started", {
            trigger: "warming",
            month,
          });
          // One month per scheduler invocation bounds provider calls and lets
          // failed or missing months make progress on subsequent turns.
          // Reuse only reads still inside their independent 60-second deadline.
          // Known writes invalidate affected dates; partial refreshes never
          // replace the retained complete month.
          const calendar = await publicCalendar({
            ...this.calendarReadOptions(),
            month,
            beforeProviderRead,
          });
          beforeProviderRead();
          const catalogue = await windowCatalogue(this.calendarReadOptions());
          store.save("calendar", `calendar:${month}`, calendar, generation);
          store.save("catalogue", "catalogue", catalogue, generation);
          const persisted =
            store.generation() === generation &&
            store.read("calendar", `calendar:${month}`) !== undefined;
          traceCalendar(
            correlationId,
            persisted ? "build_saved" : "build_discarded",
            {
              trigger: "warming",
              month,
              persisted,
              observedAtMs: calendar.observedAtMs,
              durationMs: performance.now() - started,
              dateCount: calendar.dates.length,
              offerCount: calendar.dates.reduce(
                (n, day) => n + (day.offers?.length ?? 0),
                0,
              ),
            },
          );
        });
      } catch (error) {
        if (
          !(error instanceof ApiError) ||
          error.code !== "display_refresh_deferred"
        ) {
          traceCalendar(correlationId, "build_failed", {
            trigger: "warming",
            code:
              error instanceof ApiError
                ? error.code
                : "temporarily_unavailable",
            durationMs: performance.now() - started,
          });
          throw error;
        }
        traceCalendar(correlationId, "refresh_deferred", {
          trigger: "warming",
        });
      }
    });
  }

  private async displayRead<T>(
    read: (cacheOnly: boolean) => Promise<T>,
  ): Promise<T> {
    try {
      // Valid public display snapshots need no provider runner. A miss may not
      // dispatch or wait for provider I/O outside the existing bounded admission.
      return await read(true);
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== "display_cache_miss")
        throw error;
      return this.providerQueue.run("display", () => read(false));
    }
  }

  /** Bind calendar reads to this account's provider and controls. */
  private calendarReadOptions() {
    return {
      env: this.env,
      cache: this.calendarReads,
      onFreshDay: (day: Parameters<DisplaySnapshots["updateDay"]>[0]) => {
        if (!liveCustomerAccess(this.env)) return;
        try {
          this.snapshots().updateDay(day);
        } catch {
          console.error(
            JSON.stringify({ event: "display_update_unavailable" }),
          );
        }
      },
      provider: this.provider,
      control: this.providerControl(false, true),
      accounting: () => this.providerAccounting(),
      // Carry pacing across consecutive month/day requests and DO restarts.
      lastDispatchMs: () =>
        this.sql
          .exec<{ latest: number | null }>(
            "SELECT MAX(started_ms) AS latest FROM admissions",
          )
          .one().latest ?? 0,
    };
  }
  /** Refresh export evidence through the existing bounded read-only provider queue. */
  async receipt(
    scope: { attemptId: string; cookie: string },
    correlationId: string,
  ) {
    return rpcOutcome(() =>
      traced(correlationId, "coordinator", () =>
        bookingReceipt(
          new Request(this.env.APP_ORIGIN, {
            headers: { cookie: scope.cookie },
          }),
          this.env,
          scope.attemptId,
          Date.now(),
          (snapshot, signal) =>
            this.providerQueue.run("foreground", async () => {
              signal.throwIfAborted();
              const intent = intentSchema.parse(
                JSON.parse(snapshot.row.intent_json),
              );
              if (
                intent.accountId !== this.env.DEPLOYMENT_ACCOUNT_ID ||
                intent.environmentId !== this.env.ENVIRONMENT
              )
                throw new ApiError(409, "receipt_scope_mismatch");
              let paymentProcessor: string | undefined;
              if (snapshot.payment.route === "hitpay") {
                const payment = paymentScopeSchema.parse(
                  JSON.parse(snapshot.payment.payment!.scope_json),
                );
                await assertPaymentScope(this.env, payment);
                if (
                  payment.attemptId !== scope.attemptId ||
                  payment.intentHash !== snapshot.row.intent_hash ||
                  payment.associationJson !== snapshot.row.association_json
                )
                  throw new ApiError(409, "receipt_scope_mismatch");
                paymentProcessor = payment.externalProcessor;
              }
              const control = this.providerControl(false, true);
              const bounded = {
                ...control,
                reserve: (metadata: Parameters<typeof control.reserve>[0]) => {
                  signal.throwIfAborted();
                  return control.reserve(metadata);
                },
              };
              const secret = hitpaySetting(
                this.env,
                providerCredentialName(this.env, "SIGNING_SECRET"),
              );
              if (!secret)
                throw new ApiError(503, "native_signing_unavailable");
              await this.provider.identity(this.env, bounded);
              const result = await readNativeAttempt({
                scope: {
                  attemptId: scope.attemptId,
                  companyLogin: providerSecrets(this.env).company,
                  timezone: "Asia/Singapore",
                  intent,
                },
                association: JSON.parse(snapshot.row.association_json!),
                paymentProcessor,
                signal,
                exchange: (operation, abort) =>
                  this.provider.nativeRead(this.env, bounded, operation, abort),
                signature: (bookingId) =>
                  storedNativeSignature(
                    this.env.STATE,
                    scope.attemptId,
                    bookingId,
                    secret,
                  ),
              });
              return result.observation;
            }),
        ),
      ),
    );
  }
  async expireCheckout(scope: { attemptId: string; cookie: string }) {
    return rpcOutcome(() =>
      this.providerQueue.run("foreground", async () => {
        const result = await expireCheckout(
          new Request(this.env.APP_ORIGIN, {
            headers: { cookie: scope.cookie },
          }),
          this.env,
          scope.attemptId,
        );
        // Release authority is already committed. Availability is read from the
        // provider, never reconstructed by adding the old selection back.
        try {
          if (liveCustomerAccess(this.env)) {
            const attempt = await this.env.STATE.prepare(
              "SELECT intent_json FROM attempts WHERE id=?",
            )
              .bind(scope.attemptId)
              .first<{ intent_json: string }>();
            if (attempt) {
              const intent = intentSchema.parse(
                JSON.parse(attempt.intent_json),
              );
              this.snapshots().scheduleRelease(
                scope.attemptId,
                intent.sessions,
                Date.now(),
              );
              await this.schedulePaymentAlarm();
              const options = this.calendarReadOptions();
              const { window } = calendarWindow(options);
              for (const date of new Set(
                intent.sessions.map((session) =>
                  new Date(session.startMs + 28800000)
                    .toISOString()
                    .slice(0, 10),
                ),
              )) {
                if (
                  !this.snapshots().read(
                    "calendar",
                    `calendar:${date.slice(0, 7)}`,
                  )
                )
                  continue;
                try {
                  await windowAvailability({
                    ...options,
                    date,
                    serviceId: window.serviceId,
                    fresh: true,
                  });
                } catch {
                  // Never replace the durable release with a display failure.
                  console.error(
                    JSON.stringify({ event: "display_update_unavailable" }),
                  );
                }
              }
            }
          }
        } catch {
          // A failed cache/storage read cannot undo an already committed release.
          console.error(
            JSON.stringify({ event: "display_update_unavailable" }),
          );
        }
        return result;
      }),
    );
  }
  /** Coordinate authenticated dismissal of a completed attempt. */
  async dismissCompleted(
    scope: { attemptId: string; cookie: string },
    correlationId: string,
  ) {
    return rpcOutcome(() =>
      traced(correlationId, "coordinator", () =>
        dismissCompletedCheckout(
          new Request(this.env.APP_ORIGIN, {
            headers: { cookie: scope.cookie },
          }),
          this.env,
          scope.attemptId,
        ),
      ),
    );
  }

  /** Read catalogue data within the bounded calendar window. */
  async windowCatalogue(correlationId: string) {
    return rpcOutcome(() =>
      traced(correlationId, "coordinator", async () => {
        const store = liveCustomerAccess(this.env)
          ? this.snapshots()
          : undefined;
        const cached = store?.read("catalogue", "catalogue");
        if (cached) return cached;
        const generation = store?.generation() ?? 0;
        const value = await this.displayRead((cacheOnly) =>
          windowCatalogue({ ...this.calendarReadOptions(), cacheOnly }),
        );
        store?.save("catalogue", "catalogue", value, generation);
        return store?.read("catalogue", "catalogue") ?? value;
      }),
    );
  }

  /** Read native calendar evidence under the authorized scope. */
  async nativeCalendar(
    scope: { month: string; serviceId: string; cookie: string },
    correlationId: string,
  ) {
    const pending = this.providerQueue.run("display", () =>
      traced(correlationId, "coordinator", async () => {
        if (hasPublicCalendarWindow(this.env)) {
          await authenticate(
            new Request(this.env.APP_ORIGIN, {
              headers: { cookie: scope.cookie },
            }),
            this.env,
            Date.now(),
          );
          const result = await windowCalendar({
            ...this.calendarReadOptions(),
            ...scope,
          });
          await authenticate(
            new Request(this.env.APP_ORIGIN, {
              headers: { cookie: scope.cookie },
            }),
            this.env,
            Date.now(),
          );
          return result;
        }
        return customerNativeCalendar({
          request: new Request(this.env.APP_ORIGIN, {
            headers: { cookie: scope.cookie },
          }),
          env: this.env,
          month: scope.month,
          serviceId: scope.serviceId,
          provider: this.provider,
          control: this.providerControl(),
          accounting: () => this.providerAccounting(),
          cache: this.calendarReads,
        });
      }),
    );
    return rpcOutcome(() => pending);
  }
  /** Serialize customer checkout preparation and return a safe RPC outcome. */
  async prepareCustomer(
    scope: { cookie: string; value: unknown; sourceIp: string },
    correlationId: string,
  ) {
    const pending = this.providerQueue.run("foreground", () =>
      traced(correlationId, "coordinator", async () => {
        const request = new Request(this.env.APP_ORIGIN, {
          headers: { cookie: scope.cookie, "CF-Connecting-IP": scope.sourceIp },
        });
        if (liveCustomerAccess(this.env))
          await authorizeCustomerCheckout(
            request,
            scope.value,
            this.calendarReadOptions(),
          );
        return prepareCustomerNative(request, this.env, scope.value);
      }),
    );
    return rpcOutcome(() => pending);
  }
  /** Coordinate booking holds while retaining durable effect evidence. */
  async holdCustomer(
    scope: {
      attemptId: string;
      cookie: string;
      value: unknown;
      checkout?: boolean;
      sourceIp: string;
      checkoutAccess?: import("./access").Access;
    },
    correlationId: string,
  ) {
    const attemptId = z.string().uuid().parse(scope.attemptId);
    const checkoutTrace = scope.checkout
      ? createCheckoutTrace(correlationId)
      : undefined;
    const pending = this.providerQueue.run("foreground", () =>
      runCheckoutTrace(checkoutTrace, () =>
        traced(correlationId, "coordinator", async () => {
          const request = new Request(this.env.APP_ORIGIN, {
            headers: {
              cookie: scope.cookie,
              "CF-Connecting-IP": scope.sourceIp,
            },
          });
          const input = nativePrepareSchema.parse(scope.value);
          if (
            !liveCustomerAccess(this.env) ||
            !input.holding ||
            input.key !== attemptId ||
            (scope.checkout && !input.accepted)
          )
            throw new ApiError(400, "combined_hold_unavailable");
          const env = {
            ...this.env,
            STATE: instrumentStorage(this.env.STATE, "d1"),
          };
          const creationOnly = !!scope.checkout;
          const access =
            scope.checkoutAccess ??
            (await authenticate(request, env, Date.now()));
          const preparation = await (async () => {
            const retainedGrant = await authorizeCustomerCheckout(
              request,
              input,
              { ...this.calendarReadOptions(), env },
              true,
              access,
              !!scope.checkout,
              !!scope.checkout && access.fresh_checkout === 1,
            );
            return prepareCustomerNative(
              request,
              env,
              input,
              attemptId,
              () =>
                creationOnly
                  ? this.provider.checkoutToken(
                      env,
                      this.providerControl(false, true),
                    )
                  : this.provider.identity(
                      env,
                      this.providerControl(false, true),
                    ),
              access,
              retainedGrant,
            );
          })().catch(async (error: unknown) => {
            if (
              !(error instanceof ApiError) ||
              !(
                error.code === "native_customer_window_unavailable" ||
                error.status === 409
              )
            )
              throw error;
            const code = await rejectedCheckoutReadback(request, input, {
              ...this.calendarReadOptions(),
              env,
            }).catch(() =>
              error.status === 409
                ? "checkout_recovery_required"
                : "checkout_window_unresolved",
            );
            throw new ApiError(error.status, code);
          });
          return executeNativeCheckout({
            request,
            env,
            attemptId,
            holding: true,
            combinedHold: true,
            creationOnly,
            displayCatalogue: creationOnly
              ? this.snapshots().read("catalogue", "catalogue")
              : undefined,
            prepared:
              "snapshot" in preparation ? preparation.snapshot : undefined,
            access,
            onVerifiedHold: scope.checkout
              ? (proof) =>
                  payHitpayHold(
                    request,
                    env,
                    attemptId,
                    this.provider,
                    this.providerControl(false, true),
                    proof,
                  )
              : undefined,
            provider: this.provider,
            control: this.providerControl(false, true),
            recoveryControl: this.providerControl(true, true),
            accounting: () => this.providerAccounting(),
          }).finally(async () => {
            if (scope.checkout)
              this.ctx.waitUntil(
                this.bookingComments(attemptId).catch(() => {
                  console.error(
                    JSON.stringify({ event: "booking_comments_deferred" }),
                  );
                }),
              );
            await this.refreshDisplayAfterWrite(attemptId, access.owner_id);
          });
        }),
      ),
    );
    let serverTiming: string | undefined;
    const outcome = await rpcOutcome(() => pending).finally(() => {
      serverTiming = finishCheckoutTrace(checkoutTrace);
    });
    return { ...outcome, serverTiming };
  }
  async bookingComments(attemptId?: string) {
    return this.providerQueue.run("display", () =>
      annotatePendingBooking(
        this.env,
        this.provider,
        this.providerControl(false, true),
        attemptId,
      ),
    );
  }
  /** Serialize native checkout under the original attempt identity. */
  async nativeCheckout(
    scope: {
      attemptId: string;
      cookie: string;
      holding?: boolean;
      sourceIp: string;
    },
    correlationId: string,
  ) {
    const pending = this.providerQueue.run("foreground", () =>
      traced(correlationId, "coordinator", async () => {
        const request = new Request(this.env.APP_ORIGIN, {
          headers: { cookie: scope.cookie, "CF-Connecting-IP": scope.sourceIp },
        });
        const access = await authenticate(request, this.env, Date.now());
        return executeNativeCheckout({
          request,
          access,
          env: { ...this.env, STATE: instrumentStorage(this.env.STATE, "d1") },
          attemptId: scope.attemptId,
          holding: scope.holding,
          provider: this.provider,
          control: this.providerControl(false, true),
          recoveryControl: this.providerControl(true, true),
          accounting: () => this.providerAccounting(),
        }).finally(() =>
          this.refreshDisplayAfterWrite(scope.attemptId, access.owner_id),
        );
      }),
    );
    return rpcOutcome(() => pending);
  }
  /** Serialize hosted payment creation for the retained booking hold. */
  async hitpayPayment(
    scope: { attemptId: string; cookie: string },
    correlationId: string,
  ) {
    const pending = this.providerQueue.run("foreground", () =>
      traced(correlationId, "coordinator", () =>
        payHitpayHold(
          new Request(this.env.APP_ORIGIN, {
            headers: { cookie: scope.cookie },
          }),
          this.env,
          scope.attemptId,
          this.provider,
          this.providerControl(false, true),
        ),
      ),
    );
    return rpcOutcome(() => pending);
  }
  // Only authenticated, account-bound webhook ingress calls this RPC. Persist
  // the wake-up before acknowledging; the minute cron remains the fallback.
  async wakeHitpayRecovery(attemptId: string, correlationId: string) {
    z.string().uuid().parse(attemptId);
    z.string().uuid().parse(correlationId);
    if (!hitpayRecoveryEnabled(this.env)) return;
    this.sql.exec(
      "INSERT INTO payment_wakeups(attempt_id,correlation_id,generation,ready_ms) VALUES(?,?,1,0) ON CONFLICT(attempt_id) DO UPDATE SET correlation_id=excluded.correlation_id,generation=payment_wakeups.generation+1,ready_ms=0",
      attemptId,
      correlationId,
    );
    await this.schedulePaymentAlarm();
  }
  /** Process retained payment wakeups without discarding newer generations. */
  async alarm() {
    const wake = this.sql
      .exec<{
        attempt_id: string;
        correlation_id: string;
        generation: number;
        ready_ms: number;
      }>(
        "SELECT attempt_id,correlation_id,generation,ready_ms FROM payment_wakeups ORDER BY ready_ms,rowid LIMIT 1",
      )
      .toArray()[0];
    if (wake && wake.ready_ms <= Date.now()) {
      await this.hitpayRecovery(wake.attempt_id, wake.correlation_id);
      // Keep a newer receipt generation even when it arrives during recovery.
      this.sql.exec(
        "DELETE FROM payment_wakeups WHERE attempt_id=? AND generation=?",
        wake.attempt_id,
        wake.generation,
      );
    }
    await this.refreshReleasedDay();
    await this.schedulePaymentAlarm();
  }
  private paymentAlarmSchedule: Promise<void> = Promise.resolve();
  /** Serialize alarm writes so a concurrent receipt cannot be postponed. */
  private schedulePaymentAlarm() {
    const pending = this.paymentAlarmSchedule.then(async () => {
      const next = this.sql
        .exec<{ ready_ms: number }>(
          "SELECT ready_ms FROM payment_wakeups ORDER BY ready_ms LIMIT 1",
        )
        .toArray()[0];
      const release = liveCustomerAccess(this.env)
        ? this.snapshots().nextRelease()
        : undefined;
      const deadline = Math.min(
        next?.ready_ms ?? Infinity,
        release?.ready_ms ?? Infinity,
      );
      if (Number.isFinite(deadline))
        await this.ctx.storage.setAlarm(Math.max(Date.now(), deadline));
    });
    this.paymentAlarmSchedule = pending.catch(() => {});
    return pending;
  }
  /** Run HitPay reconciliation with recovery priority and sanitized tracing. */
  async hitpayRecovery(attemptId: string, correlationId: string) {
    const generation = this.sql
      .exec<{ generation: number }>(
        "SELECT generation FROM payment_wakeups WHERE attempt_id=?",
        attemptId,
      )
      .toArray()[0]?.generation;
    const schedule = async (readyMs: number) => {
      // Do not postpone an authenticated receipt that arrived while recovery ran.
      this.sql.exec(
        "INSERT INTO payment_wakeups(attempt_id,correlation_id,generation,ready_ms) VALUES(?,?,1,?) ON CONFLICT(attempt_id) DO UPDATE SET ready_ms=excluded.ready_ms,generation=payment_wakeups.generation+1 WHERE payment_wakeups.generation=?",
        attemptId,
        correlationId,
        readyMs,
        generation ?? 0,
      );
      await this.schedulePaymentAlarm();
    };
    const key = await confirmationTraceKey(attemptId);
    const trace = createConfirmationTrace(correlationId);
    let failed = false;
    try {
      return await this.providerQueue.run("recovery", () =>
        runConfirmationTrace(trace, "claim", () =>
          traced(correlationId, "coordinator", () =>
            recoverHitpay(
              { ...this.env, STATE: instrumentStorage(this.env.STATE, "d1") },
              attemptId,
              this.provider,
              this.providerControl(true, false, true),
              schedule,
            ),
          ),
        ),
      );
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      finishConfirmationTrace(trace, key, "recovery", failed);
    }
  }
  /** Queue authoritative readback for an ongoing customer attempt. */
  async ongoingRecovery(attemptId: string, correlationId: string) {
    const run = this.providerQueue.run("recovery", async () => {
      const due = await ongoingReadbackDue(this.env, Date.now(), attemptId);
      if (!due) return { outcomes: [], reads: 0 };
      const used = this.providerAccounting().used;
      return this.nativeRecovery(
        {
          attemptId,
          startingUsed: used,
          maximumUsed: used + 30,
          expiresMs: Date.now() + 90000,
          invocationId:
            crypto.randomUUID().replaceAll("-", "") +
            crypto.randomUUID().replaceAll("-", ""),
          ongoing: true,
        },
        correlationId,
      );
    });
    return run;
  }
  /** Reconcile a native attempt within its bounded recovery grant. */
  async nativeRecovery(
    scope: {
      attemptId: string;
      startingUsed: number;
      maximumUsed: number;
      expiresMs: number;
      invocationId: string;
      ongoing?: boolean;
      useRecoveryReserve?: boolean;
      residual?: ResidualAuthority;
    },
    correlationId: string,
  ) {
    return traced(correlationId, "coordinator", async () => {
      const p = policy(this.env),
        initial = this.providerAccounting(),
        now = Date.now();
      const ongoing = scope.ongoing === true;
      if (
        ongoing &&
        (scope.residual ||
          scope.useRecoveryReserve ||
          !(await ongoingReadbackDue(this.env, now, scope.attemptId)))
      )
        return { outcomes: [], reads: 0 };
      z.string().uuid().parse(scope.attemptId);
      z.string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(scope.invocationId);
      if (
        p.PROVIDER_ACCESS !== "trusted-reads" ||
        (!ongoing && now >= p.CAMPAIGN_END_MS) ||
        !Number.isSafeInteger(scope.expiresMs) ||
        scope.expiresMs <= now ||
        scope.expiresMs > now + 180000 ||
        !Number.isSafeInteger(scope.startingUsed) ||
        !Number.isSafeInteger(scope.maximumUsed) ||
        scope.startingUsed < 0 ||
        (!ongoing &&
          scope.maximumUsed >
            p.PROVIDER_CALL_CEILING -
              (scope.useRecoveryReserve === true ? 0 : 16)) ||
        (scope.useRecoveryReserve === true &&
          scope.maximumUsed - scope.startingUsed > 16) ||
        scope.maximumUsed - scope.startingUsed > 30 ||
        scope.maximumUsed - scope.startingUsed < 6 ||
        initial.used < scope.startingUsed ||
        initial.used + 6 > scope.maximumUsed ||
        (scope.residual?.mode === "inspect" &&
          (scope.useRecoveryReserve === true ||
            scope.maximumUsed - scope.startingUsed !== 6)) ||
        (ongoing ? initial.active >= 2 : initial.active !== 0)
      )
        throw new ApiError(503, "recovery_window_unavailable");
      const row = await this.env.STATE.withSession("first-primary")
        .prepare(
          scope.residual?.mode === "inspect"
            ? "SELECT intent_json,association_json FROM attempts WHERE id=? AND state='recovery_required' AND association_json IS NULL AND ?>0"
            : "SELECT a.intent_json,a.association_json FROM attempts a JOIN recovery_work r ON r.attempt_id=a.id WHERE a.id=? AND a.state IN ('dispatching','observed','recovery_required') AND r.state IN ('due','claimed') AND r.ready_ms<=? AND r.tries<5",
        )
        .bind(scope.attemptId, now)
        .first<{ intent_json: string; association_json: string | null }>();
      if (!row) return { outcomes: [], reads: 0 };
      const intent = intentSchema.parse(JSON.parse(row.intent_json)),
        refs = row.association_json
          ? associationSchema.parse(JSON.parse(row.association_json))
          : null;
      if (
        intent.accountId !== p.DEPLOYMENT_ACCOUNT_ID ||
        intent.environmentId !== p.ENVIRONMENT ||
        (refs !== null && refs.bookingIds.length !== intent.sessions.length)
      )
        throw new ApiError(503, "native_recovery_scope_mismatch");
      const secret: unknown = Reflect.get(
        this.env,
        providerCredentialName(this.env, "SIGNING_SECRET"),
      );
      if (typeof secret !== "string")
        throw new ApiError(503, "native_signing_unavailable");
      const maximumCalls = scope.residual
        ? Math.min(16, scope.maximumUsed - initial.used)
        : intent.sessions.length + 5;
      if (initial.used + maximumCalls > scope.maximumUsed)
        throw new ApiError(503, "recovery_window_unavailable");
      const control = this.providerControl(
        scope.useRecoveryReserve === true,
        ongoing,
      );
      let count = 0,
        last = 0;
      const bounded: ProviderControl = {
        ...control,
        reserve: async (metadata) => {
          if (scope.residual)
            await residualGrant(this.env, {
              ...scope,
              residual: scope.residual,
            });
          const delay = Math.max(0, last + 300 - Date.now());
          if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
          if (
            Date.now() + 15000 >=
              Math.min(
                scope.expiresMs,
                ongoing ? scope.expiresMs : p.CAMPAIGN_END_MS,
              ) ||
            count >= maximumCalls ||
            this.providerAccounting().used >= scope.maximumUsed
          )
            throw new ApiError(503, "recovery_window_exhausted");
          count++;
          last = Date.now();
          return control.reserve(metadata);
        },
      };
      if (scope.residual) {
        const authority = scope.residual;
        const assertGranted = () =>
          residualGrant(this.env, { ...scope, residual: authority });
        await assertGranted();
        return recoverNativeResidual({
          db: this.env.STATE,
          scope: {
            attemptId: scope.attemptId,
            companyLogin: providerSecrets(this.env).company,
            timezone: "Asia/Singapore",
            intent,
          },
          authority,
          expiresMs: scope.expiresMs,
          signingSecret: secret,
          assertGranted,
          invalidate: () => this.provider.invalidateCatalogue(this.env),
          exchange: async (operation, signal) => {
            await assertGranted();
            signal?.throwIfAborted();
            if (
              authority.mode === "inspect" &&
              operation.kind !== "booking-read"
            )
              throw new ApiError(
                503,
                "native_inspection_operation_unavailable",
              );
            if (operation.kind === "booking-cancel")
              return this.provider.nativeWrite(
                this.env,
                bounded,
                operation,
                assertGranted,
              );
            if (
              operation.kind !== "booking-read" &&
              operation.kind !== "invoice-read"
            )
              throw new ApiError(503, "native_residual_operation_unavailable");
            await this.provider.identity(this.env, bounded);
            return this.provider.nativeRead(
              this.env,
              bounded,
              operation,
              signal,
            );
          },
        });
      }
      if (!ongoing) await this.provider.identity(this.env, bounded);
      const company = providerSecrets(this.env).company;
      if (!refs) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const recovered = await recoverNativeAssociation({
            db: this.env.STATE,
            scope: {
              attemptId: scope.attemptId,
              companyLogin: company,
              timezone: "Asia/Singapore",
              intent,
            },
            exchange: (operation, signal) =>
              this.provider.nativeRead(this.env, bounded, operation, signal),
            signingSecret: secret,
            signal: controller.signal,
          });
          return {
            outcomes: [
              {
                attemptId: scope.attemptId,
                state: "observed",
                reason: "association_reconciled",
              },
            ],
            reads: recovered.reads,
          };
        } finally {
          clearTimeout(timer);
          controller.abort();
        }
      }
      return runNativeReadback(this.env, {
        scope: {
          attemptId: scope.attemptId,
          companyLogin: company,
          timezone: "Asia/Singapore",
          intent,
        },
        claimant: `background-${scope.invocationId.slice(0, 32)}`,
        phase: "background",
        invocationId: scope.invocationId,
        grantExpiresMs: scope.expiresMs,
        ongoing,
        // Claim the durable try before setup; stop new dispatches after timeout.
        prepare: ongoing
          ? (signal) =>
              this.provider.identity(this.env, {
                ...bounded,
                reserve: (metadata) => {
                  signal.throwIfAborted();
                  return bounded.reserve(metadata);
                },
              })
          : undefined,
        exchange: (operation, signal) =>
          this.provider.nativeRead(this.env, bounded, operation, signal),
        signature: async (bookingId) => {
          if (!refs.bookingIds.includes(bookingId))
            throw new ApiError(503, "native_recovery_scope_mismatch");
          return storedNativeSignature(
            this.env.STATE,
            scope.attemptId,
            bookingId,
            secret,
          );
        },
      });
    });
  }
  // Retain the earlier RPC during rolling deployment; it grants no authority.
  discoveryAccounting() {
    policy(this.env);
    return this.providerAccounting();
  }
  /** Report bounded discovery readiness without exposing provider credentials. */
  discoveryReadiness() {
    const p = policy(this.env),
      now = Date.now();
    // Only exposed through the authenticated, existing operator grant. Read the
    // coordinator's own bindings: Worker health cannot establish RPC readiness.
    return {
      accounting: this.providerAccounting(),
      coordinator: {
        revision: p.SOURCE_REVISION,
        versionId: this.env.CF_VERSION_METADATA?.id ?? null,
        providerAccess: p.PROVIDER_ACCESS,
        campaignEndMs: p.CAMPAIGN_END_MS,
        effectiveProviderAccess:
          p.PROVIDER_ACCESS === "trusted-reads" && now < p.CAMPAIGN_END_MS
            ? "trusted-reads"
            : "disabled",
      },
    };
  }
  /** Read the account's retained provider admission counters. */
  private providerAccounting() {
    const used =
      this.sql
        .exec<{ used: number }>(
          "SELECT used FROM budget WHERE campaign=?",
          this.env.CAMPAIGN_ID,
        )
        .toArray()[0]?.used ?? 0;
    const active = this.sql
      .exec<{ n: number }>("SELECT count(*) n FROM admissions WHERE finished=0")
      .one().n;
    return {
      used,
      active,
      ceiling: policy(this.env).PROVIDER_CALL_CEILING,
      recoveryReserve: 16,
    };
  }
  /** Finalize retained transport accounting for the admitted operation. */
  finish(
    id: string,
    cooldownMs = 0,
    reason?: "read_transport_ended" | "write_transport_ended",
  ) {
    if (!Number.isInteger(cooldownMs) || cooldownMs < 0 || cooldownMs > 3600000)
      throw new Error("Invalid cooldown");
    if (reason !== undefined)
      z.enum(["read_transport_ended", "write_transport_ended"]).parse(reason);
    this.ctx.storage.transactionSync(() => {
      if (reason === "read_transport_ended")
        this.sql.exec(
          "INSERT INTO admission_releases(id,campaign,started_ms,reason,recorded_ms) SELECT id,campaign,started_ms,?,? FROM admissions WHERE id=? AND finished=0 ON CONFLICT(id) DO NOTHING",
          reason,
          Date.now(),
          id,
        );
      if (reason)
        this.sql.exec(
          "INSERT INTO provider_transport_releases SELECT id,operation,read_only,?,? FROM provider_request_admissions WHERE id=? ON CONFLICT(id) DO NOTHING",
          Date.now(),
          reason,
          id,
        );
      this.sql.exec(
        "UPDATE admissions SET finished=1 WHERE id=? AND finished=0",
        id,
      );
      this.sql.exec(
        "UPDATE budget SET cooldown_ms=max(cooldown_ms,?) WHERE campaign=?",
        Date.now() + cooldownMs,
        this.env.CAMPAIGN_ID,
      );
    });
  }
  /** Claim an eligible refresh without exceeding the retained admission scope. */
  claimRefresh(key: string, generation: number) {
    if (
      !/^(confirmation:[a-f0-9-]{36}|token:(public|admin))$/.test(key) ||
      !Number.isSafeInteger(generation) ||
      generation < 0
    )
      throw new Error("Invalid refresh identity");
    const now = Date.now(),
      sql = this.sql;
    return this.ctx.storage.transactionSync(() => {
      const row = sql
        .exec<{
          generation: number;
          expires_ms: number;
          completed_ms: number | null;
        }>(
          "SELECT generation,expires_ms,completed_ms FROM refreshes WHERE key=?",
          key,
        )
        .toArray()[0];
      if (row && generation < row.generation)
        return { granted: false, reason: "stale_generation" };
      if (
        row &&
        generation === row.generation &&
        (row.expires_ms > now ||
          (row.completed_ms !== null && now - row.completed_ms < 5000))
      )
        return { granted: false, reason: "shared_refresh" };
      const claim = crypto.randomUUID();
      sql.exec(
        "INSERT INTO refreshes(key,generation,claim,expires_ms) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET generation=excluded.generation,claim=excluded.claim,expires_ms=excluded.expires_ms,completed_ms=NULL",
        key,
        generation,
        claim,
        now + 30000,
      );
      return { granted: true, claim };
    });
  }
  completeRefresh(key: string, claim: string, generation: number) {
    const now = Date.now();
    this.sql.exec(
      "UPDATE refreshes SET completed_ms=?,expires_ms=? WHERE key=? AND claim=? AND generation=? AND expires_ms>?",
      now,
      now,
      key,
      claim,
      generation,
      now,
    );
    return this.sql.exec<{ n: number }>("SELECT changes() n").one().n === 1;
  }
}
