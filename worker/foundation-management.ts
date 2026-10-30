import { WorkerEntrypoint } from "cloudflare:workers";
import { z } from "zod";
import {
  assertClosedFoundation,
  assertBindingShape,
  coordinatorName,
  coordinatorStub,
  foundationStatement,
  assertFoundation,
  verifyBindings,
} from "./bindings";
import { ApiError } from "./policy";

const expectedSchema = z.strictObject({
  accountId: z.string().regex(/^[a-f0-9]{32}$/),
  databaseId: z.string().uuid(),
  coordinatorName: z.string(),
  locationHint: z.enum(["apac-ne", "apac-se"]),
  revision: z.string().regex(/^[a-f0-9]{40}$/),
});
const registrationSchema = expectedSchema.extend({
  coordinatorId: z.string().regex(/^[a-f0-9]{64}$/),
});

/** Resolve the deployed identity without obtaining a stub or starting the object. */
function candidate(env: Env, input: unknown) {
  const expected = expectedSchema.parse(input);
  assertClosedFoundation(env);
  assertBindingShape(env);
  if (
    expected.accountId !== env.DEPLOYMENT_ACCOUNT_ID ||
    expected.databaseId !== env.STATE_DATABASE_ID ||
    expected.coordinatorName !== coordinatorName(env) ||
    expected.locationHint !==
      String(Reflect.get(env, "COORDINATOR_LOCATION_HINT")) ||
    expected.revision !== env.SOURCE_REVISION
  )
    throw new ApiError(409, "foundation_target_mismatch");
  return {
    ...expected,
    coordinatorId: env.COORDINATOR.idFromName(
      expected.coordinatorName,
    ).toString(),
  };
}

/** Expose closed-install management only through explicitly granted service bindings. */
export class FoundationManagement extends WorkerEntrypoint<Env> {
  /** Read the real namespace-derived identity without changing either storage system. */
  async inspect(input: unknown) {
    const identity = candidate(this.env, input);
    const existing = await foundationStatement(this.env).first<{
      account_id: string;
      environment: string;
      database_id: string;
      coordinator_id: string;
    }>();
    if (existing) assertFoundation(this.env, existing);
    return { ...identity, registration: existing ? "registered" : "pending" };
  }
  /** Claim an empty foundation once and verify the winner after duplicate or concurrent calls. */
  async register(input: unknown) {
    const { coordinatorId, ...expected } = registrationSchema.parse(input);
    const identity = await this.inspect(expected);
    if (identity.coordinatorId !== coordinatorId)
      throw new ApiError(409, "foundation_target_mismatch");
    await this.env.STATE.withSession("first-primary")
      .prepare(
        "INSERT INTO foundation_identity(singleton,account_id,environment,database_id,coordinator_id) VALUES(1,?,'production',?,?) ON CONFLICT(singleton) DO NOTHING",
      )
      .bind(identity.accountId, identity.databaseId, coordinatorId)
      .run();
    await verifyBindings(this.env);
    return { ...identity, registration: "registered" };
  }
  /** Start only the registered coordinator through the reviewed placement owner. */
  async initialize(input: unknown) {
    const { coordinatorId, ...expected } = registrationSchema.parse(input);
    const identity = await this.inspect(expected);
    if (
      identity.registration !== "registered" ||
      identity.coordinatorId !== coordinatorId
    )
      throw new ApiError(409, "foundation_target_mismatch");
    const result = await coordinatorStub(this.env).inspectFoundation();
    return {
      coordinatorId: result.coordinatorId,
      alarm: result.alarm,
      pendingWakeups: result.pendingWakeups,
      location: result.location,
    };
  }
}
