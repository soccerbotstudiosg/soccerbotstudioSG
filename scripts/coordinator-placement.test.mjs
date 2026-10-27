import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
const { outputFiles } = await build({
  entryPoints: ["worker/bindings.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const { coordinatorStub } = await import(
  `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`
);
/** Capture stub selection without creating cloud objects or performing I/O. */
function fixture(environment, hint) {
  const calls = [];
  const stub = {};
  const env = {
    ENVIRONMENT: environment,
    COORDINATOR_NAME: "simplybook-production-account",
    COORDINATOR_LOCATION_HINT: hint,
    COORDINATOR: {
      getByName: (...args) => {
        calls.push(args);
        return stub;
      },
    },
  };
  return { env, calls, stub };
}
test("client coordinator selection supplies placement on every access and preserves identity", () => {
  for (const hint of ["apac-ne", "apac-se"]) {
    const { env, calls, stub } = fixture("production", hint);
    assert.equal(coordinatorStub(env), stub);
    assert.equal(coordinatorStub(env), stub);
    assert.deepEqual(calls, [
      ["simplybook-production-account", { locationHint: hint }],
      ["simplybook-production-account", { locationHint: hint }],
    ]);
  }
});
test("missing or invalid client placement fails before obtaining a coordinator", () => {
  for (const hint of [undefined, "", null, "invalid", "APAC-NE", 1]) {
    const { env, calls } = fixture("production", hint);
    assert.throws(() => coordinatorStub(env), {
      status: 503,
      code: "environment_unavailable",
    });
    assert.deepEqual(calls, []);
  }
});
test("developer placement stays unset and malformed names cannot create replacements", () => {
  for (const hint of [undefined, ""]) {
    const { env, calls } = fixture("developer", hint);
    env.COORDINATOR_NAME = "simplybook-developer-account";
    coordinatorStub(env);
    assert.deepEqual(calls, [["simplybook-developer-account"]]);
  }
  for (const name of [undefined, "", "bad/name"]) {
    const { env, calls } = fixture("production", "apac-ne");
    env.COORDINATOR_NAME = name;
    assert.throws(() => coordinatorStub(env), { status: 503 });
    assert.deepEqual(calls, []);
  }
  const { env, calls } = fixture("developer", "invalid");
  assert.throws(() => coordinatorStub(env), { status: 503 });
  assert.deepEqual(calls, []);
});
