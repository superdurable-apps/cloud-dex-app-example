# Application Instructions

Dex `node-ts-v1`, TypeScript on Node.js 22: the page calls an API which starts
GreetingFlow; its Steps write and save the greeting, and the API reads the
Flow's Attribute. Studio owns management.

## Files to change for a feature

1. `src/<name>-flow.ts`: one Flow per file with its Attributes, Channels and
   Steps, following `greeting-flow.ts`. Import only `@superdurable/dex` there:
   the Flow check reads that one file and skips relative imports.
2. `src/application.ts`: `loadApplication`, which returns the Flow list, the
   routes and the page.
3. `dex-app.yaml`, written in YAML: one `flowDefinitions` entry per Flow file,
   and one `connectors` entry per connection to an outside service. A
   connector is an `@superdurable/connector-<name>` package installed with
   `npm install --save-exact`; its entry names that `package` and `version`
   (fields: https://docs.superdurable.io/reference/dex-app/manifest#s2), and
   tests use the package's `mock` export.
4. `openapi/openapi.yaml`, the HTTP contract, then the handlers in
   `src/<name>-api.ts` (see `greeting-api.ts`).
5. `src/page.ts` for the page.
6. `apptest/<name>.test.ts`: the API tests (below).

The base files `src/main.ts`, `src/dex.ts`, `src/runtime.ts`, `src/http.ts`
and `apptest/apptest.ts` are the platform contract: `npm run build` writes
`dist/`, `node . web` serves the API and page on `PORT` with `/api/health`,
`node . worker` runs the Worker with readiness on `/readyz`, both read
`/tmp/superverse-app/runtime.yaml`, write only under `/tmp` and stop on
SIGTERM, the Worker after draining its tasks. Keep them.

If the application does not write greetings, delete `greeting-flow.ts`,
`greeting-api.ts`, its `dex-app.yaml` entry, endpoints, page and tests.

## What the Flow check accepts

The strict FDG 2.0 check (dexcli 1.47.3) reads Step registration and the direct
decisions `goTo`, `goToMany`, `gracefulComplete`, `forceComplete`,
`forceFail` and `deadEnd`. It also reads `waitFor` when it returns a `Wait`
factory call written in the `return` (`Wait.until`, `Wait.anyOf` and the
others) whose conditions are written in place, RPC handlers that return an
`RPCResult` object literal, and `handleTimeout`. A Wait, RPC result or resource
access it cannot prove, and several Flows in one file, are blocking
diagnostics: keep these shapes direct and one Flow per file.

## References

| Feature | Where |
| --- | --- |
| TypeScript SDK: Flows, Steps, Attributes, locks | the documented typings in `node_modules/@superdurable/dex/dist/src/*.d.ts` |
| Business time, polling | `/opt/superverse/dex-skills/dex-sdk/references/core/patterns.md` |
| Strict FDG 2.0 groups and explanations | `/opt/superverse/dex-skills/dex-app-builder/references/fdg-authoring.md` |

## Rules

- A clear request authorizes its edits and checks. Decide names, storage and
  Flow design yourself; ask only for business facts the request leaves open.
  Confirm a new application or a change of the confirmed requirements once
  with `confirm_requirements` before code. Make a small change directly.
- Keep records in Dex Flows: an Attribute for one value, an AttributeMap for a
  keyed collection. No files or databases.
- Never put credentials in source, state or logs; never log payloads.
- Keep external effects in Step `execute`. Register every primitive in
  `getPersistenceSchema`. Start Flows with a stable FlowID and `requestId`,
  `ignoreAlreadyStarted: true`.
- A Step that writes an Attribute an RPC also writes locks it
  (`executeLockAttributes`). AttributeMap reads and Channel pending messages
  need a declared load or fail at run time.
- Read a single record with `client.getAttributes`; a run that ended without
  saving reads as failed with a pointer to Studio Runs.
- Every Flow is strict FDG 2.0; every Step has one `// dex:group` and one
  `// dex:explanation` comment. A Flow or Step type is its durable identity:
  name it after its domain and do not rename a type with open runs.
- `package-lock.json` pins every dependency: change dependencies with
  `npm install --save-exact`, commit the lockfile, never commit `node_modules`
  or `dist`. No package script runs in the build.

## Tests

- Test each Flow through the API: `apptest("TestName", async (env) => ...)`,
  then `env.request`; use `env.dex` only for what Studio does. Wait with
  `env.eventually`, never sleep.
- Cover every confirmed requirement: the happy path, each visible outcome, a
  repeated `requestId` and 4xx input.
- Never start your own Dex; `apptest` gives each test its own engine.

## Commands

- `make bootstrap` restores `node_modules`; `make check-static` checks the
  Flows, the types and the build.
- `make check-fdg-v2` validates Flows; `make test-app RUN=<regexp>` runs API tests.
- `commit_and_push` runs the source gate and requirement trace before pushing.
