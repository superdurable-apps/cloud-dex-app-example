import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";

import { apptest, type AppEnv } from "./apptest.ts";

async function awaitReady(env: AppEnv, requestId: string): Promise<any> {
  let greeting: any;
  await env.eventually(20_000, async () => {
    greeting = (await env.request("GET", `/api/greetings/${requestId}`)).body;
    return greeting?.status === "ready";
  });
  return greeting;
}

apptest("TestGreetingWritesTheGreeting", async (env) => {
  const requestId = randomUUID();
  const submitted = await env.request("POST", "/api/greetings", { requestId, name: "  Ada  " });
  assert.deepEqual([submitted.status, submitted.body], [202, { requestId, status: "composing" }]);
  const ready = await awaitReady(env, requestId);
  assert.deepEqual(ready, { requestId, status: "ready", name: "Ada", language: "english", greeting: "Hello, Ada!" });
  await env.eventually(20_000, async () => (await env.dex.describeFlow(`greeting-${requestId}`)).status === "completed");
});

apptest("TestGreetingWritesTheChosenLanguage", async (env) => {
  for (const [language, greeting] of [["spanish", "Hola, Grace!"], ["french", "Bonjour, Grace!"]]) {
    const requestId = randomUUID();
    assert.equal((await env.request("POST", "/api/greetings", { requestId, name: "Grace", language })).status, 202);
    assert.equal((await awaitReady(env, requestId)).greeting, greeting);
  }
});

apptest("TestGreetingStartsOncePerRequest", async (env) => {
  const requestId = randomUUID();
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.equal((await env.request("POST", "/api/greetings", { requestId, name: "Edsger" })).status, 202);
  }
  await awaitReady(env, requestId);
  const runs = await env.dex.searchFlows("", 10);
  assert.equal(runs.flows.filter((flow) => flow.flowId === `greeting-${requestId}`).length, 1);
});

apptest("TestGreetingRefusesInvalidInput", async (env) => {
  const requestId = randomUUID();
  for (const name of ["", "   ", "x".repeat(81)]) {
    assert.equal((await env.request("POST", "/api/greetings", { requestId, name })).status, 400);
  }
  assert.equal((await env.request("POST", "/api/greetings", { requestId, name: "Ada", language: "klingon" })).status, 400);
  assert.equal((await env.request("POST", "/api/greetings", { requestId: "not-a-uuid", name: "Ada" })).status, 400);
  assert.equal((await env.request("GET", `/api/greetings/${requestId}`)).status, 404);
  // A refused submission starts nothing.
  assert.equal((await env.dex.searchFlows("", 10)).flows.length, 0);
});
