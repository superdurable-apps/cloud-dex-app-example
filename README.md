# Minimal importable Dex app

The smallest repository that follows the
[Dex app manifest and repository rules](https://docs.superdurable.io/reference/dex-app/manifest) and that Dex
Cloud can import, run in Preview and build for Live without changes. It is a
TypeScript process: a page and an HTTP API start `GreetingFlow`, whose Steps
write and save a greeting, and the API reads the greeting back from the Flow.

It is the `typescript-greeting` example of the Dex Cloud application template,
exactly as a new project starts from it, plus this README and the MIT license.

## What each file shows

| Rule | Files |
| --- | --- |
| [S1: build manifest](https://docs.superdurable.io/reference/dex-app/manifest#s1) | `.dex/template.json`: build profile `node-ts-v1`, kind `process`, stack `typescript`, `openapi/openapi.yaml`, `AGENTS.md` and the three `make` commands |
| [S2: deployment manifest](https://docs.superdurable.io/reference/dex-app/manifest#s2) | `dex-app.yaml`: strict YAML with the port, the health path, one Flow source `src/greeting-flow.ts` and no connectors |
| [S3: build profile files](https://docs.superdurable.io/reference/dex-app/manifest#s3) | `package.json` with a `build` script and `main`, and `package-lock.json`; no Dockerfile |
| [S4: make targets](https://docs.superdurable.io/reference/dex-app/manifest#s4) | the root `Makefile` defines `bootstrap`, `check-static` and `test-app` |
| [S5: application tests](https://docs.superdurable.io/reference/dex-app/manifest#s5) | `apptest/greeting.test.ts`, run by `make test-app` against a real Dex engine |
| [S6: runtime contract](https://docs.superdurable.io/reference/dex-app/manifest#s6) | `src/main.ts`: `node . web` serves `/api/health` and the app on `PORT`, `node . worker` runs the Worker with `/readyz` |
| [S7: no connector mocks in production code](https://docs.superdurable.io/reference/dex-app/manifest#s7) | the app uses no connectors, so nothing to mock |
| [S8: repository shape](https://docs.superdurable.io/reference/dex-app/manifest#s8) | branch `main`, regular files only, no secrets, about 30 files |

`tools/appmanifest` is the platform's own `dex-app.yaml` decoder (MIT), which
`make check-static` uses to read the manifest exactly as the import does.

## Import it

1. Fork or copy this repository to a GitHub account or organization where the
   Dex GitHub App is installed, with `main` as the default branch.
2. Log in to [Dex Cloud](https://dex.superdurable.io/login), start a project
   and choose Import project.
3. Enter `owner/name` and check the repository. Dex reads `main`, reports a
   process in TypeScript and its Flow, and you create the project.

## Run the checks locally

Node.js 22.19 or later (or 24), Go, Python 3, `dexcli` and `dex-server-zd`:

```sh
make bootstrap          # npm ci and the manifest decoder's Go module
make check-static       # Flow check, type check and build
DEX_SERVER_ZD_BINARY=/path/to/dex-server-zd make test-app   # API tests on a real engine
```

## License

MIT, see [LICENSE](LICENSE).
