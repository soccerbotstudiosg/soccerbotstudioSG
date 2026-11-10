import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTarget } from "./deployment-target.mjs";
import {
  validateFoundationSettings,
  runFoundationPhase,
} from "./foundation-setup.mjs";
// First-install fixtures remain explicitly closed, independently of the active release.
const target = { ...loadTarget("production"), access: "closed" };
const revision = "a".repeat(40),
  namespaceId = "b".repeat(32),
  coordinatorId = "c".repeat(64),
  digest = "d".repeat(64);
const expected = {
  accountId: target.accountId,
  databaseId: target.databaseId,
  coordinatorName: target.coordinatorName,
  locationHint: target.coordinatorLocationHint,
  revision,
};
/** Model remote effects independently of the management implementation. */
function fixture() {
  let registered = false,
    writes = 0,
    starts = 0,
    loseReply = false;
  const service = {
    async inspect() {
      return {
        ...expected,
        coordinatorId,
        registration: registered ? "registered" : "pending",
      };
    },
    async register() {
      if (!registered) {
        registered = true;
        writes++;
      }
      if (loseReply) {
        loseReply = false;
        throw new Error("Lost acknowledgement");
      }
      return this.inspect();
    },
    async initialize() {
      starts++;
      return { coordinatorId, alarm: null, pendingWakeups: 0, location: null };
    },
  };
  const run = (phase, receipt) =>
    runFoundationPhase({
      phase,
      receipt,
      service,
      expected,
      namespaceId,
      digest,
    });
  return {
    service,
    run,
    counts: () => ({ writes, starts }),
    lose: () => {
      loseReply = true;
    },
  };
}
test("foundation phases require matching receipt before registration or initialization", async () => {
  const f = fixture(),
    receipt = await f.run("inspect");
  assert.deepEqual(f.counts(), { writes: 0, starts: 0 });
  await assert.rejects(f.run("register"));
  for (const changed of [
    { namespaceId: "f".repeat(32) },
    { targetDigest: "other" },
    { identity: { ...receipt.identity, revision: "f".repeat(40) } },
  ])
    await assert.rejects(f.run("register", { ...receipt, ...changed }));
  await assert.rejects(f.run("initialize", receipt));
  assert.deepEqual(f.counts(), { writes: 0, starts: 0 });
  await f.run("register", receipt);
  assert.deepEqual(f.counts(), { writes: 1, starts: 0 });
  await f.run("initialize", receipt);
  assert.deepEqual(f.counts(), { writes: 1, starts: 1 });
});
test("foundation lost acknowledgement recovers through inspection without duplicate writes", async () => {
  const f = fixture(),
    receipt = await f.run("inspect");
  f.lose();
  await assert.rejects(f.run("register", receipt), /Lost acknowledgement/);
  assert.equal((await f.run("inspect")).result.registration, "registered");
  await f.run("register", receipt);
  assert.deepEqual(f.counts(), { writes: 1, starts: 0 });
});
test("foundation rejects foreign runtime identity and unexpected retained work", async () => {
  const f = fixture(),
    receipt = await f.run("inspect");
  f.service.inspect = async () => ({
    ...expected,
    coordinatorId: "f".repeat(64),
    registration: "pending",
  });
  await assert.rejects(f.run("register", receipt));
  assert.deepEqual(f.counts(), { writes: 0, starts: 0 });
  const g = fixture(),
    good = await g.run("inspect");
  await g.run("register", good);
  for (const overrides of [
    { alarm: 123 },
    { pendingWakeups: 1 },
    { coordinatorId: "f".repeat(64) },
  ]) {
    g.service.initialize = async () => ({
      coordinatorId,
      alarm: null,
      pendingWakeups: 0,
      location: null,
      ...overrides,
    });
    await assert.rejects(g.run("initialize", good));
  }
});
test("foundation preflight rejects wrong binding, namespace, revision and open effects", () => {
  const vars = {
    DEPLOYMENT_ACCOUNT_ID: target.accountId,
    STATE_DATABASE_ID: target.databaseId,
    ENVIRONMENT: "production",
    SOURCE_REVISION: revision,
    COORDINATOR_NAME: target.coordinatorName,
    COORDINATOR_LOCATION_HINT: target.coordinatorLocationHint,
    APP_ORIGIN: target.origin,
    ...Object.fromEntries(
      [
        "LIVE_CUSTOMER_ACCESS",
        "PROVIDER_ACCESS",
        "IDENTITY_DELIVERY",
        "HITPAY_CHECKOUT",
        "HITPAY_RECOVERY",
        "HITPAY_WEBHOOK",
        "PUBLIC_DISPLAY_WARMING",
        "PUBLIC_TOKEN_REFRESH_AHEAD",
      ].map((x) => [x, "disabled"]),
    ),
  };
  const settings = {
    bindings: [
      ...Object.entries(vars).map(([name, text]) => ({
        name,
        text,
        type: "plain_text",
      })),
      { name: "STATE", type: "d1", id: target.databaseId },
      {
        name: "COORDINATOR",
        type: "durable_object_namespace",
        namespace_id: namespaceId,
        class_name: "SoccerBotAccountCoordinator",
      },
    ],
  };
  validateFoundationSettings(settings, target, revision, namespaceId);
  for (const item of settings.bindings) {
    const broken = structuredClone(settings);
    const binding = broken.bindings.find((b) => b.name === item.name);
    if (binding.type === "plain_text") binding.text = "wrong";
    else if (binding.name === "STATE") binding.id = "wrong";
    else binding.namespace_id = "wrong";
    assert.throws(() =>
      validateFoundationSettings(broken, target, revision, namespaceId),
    );
  }
});
