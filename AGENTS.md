# Repository guide

## Current setup

- The app uses dependency-free browser ESM, native HTML/CSS, and a Node static server. There is no package manifest, lockfile, app dependency installation, lint command or build step.
- Verified launch: `node scripts/serve.mjs`, then open `http://localhost:4173`. Node.js and a modern browser are required. Stop with Ctrl+C.
- Verified checks:

  ```sh
  node --test tests/persistence/*.test.mjs
  node --check src/client/notes-app.mjs
  node --check scripts/serve.mjs
  ```

- Optional browser verification lives in `tests/browser/journey.mjs` and `tests/browser/states.mjs`. Exact external Playwright install/run commands and runner prerequisites are documented in `README.md`; tooling installs into `/tmp`, not app dependencies. The verified runner uses isolated Chromium libraries/fonts as documented there.
- Keep this guide synchronized with checked-in setup and successfully run commands. Do not infer npm application commands.

## Directory map

- `README.md` — repository overview.
- `index.html`, `src/client/notes.css`, and `src/client/notes-app.mjs` — frontend layout, styling and interactive application.
- `scripts/serve.mjs` — localhost static server.
- `tests/browser/` — isolated desktop/mobile and state/focus verification with screenshot capture.
- `docs/decisions/002-frontend.md` — frontend architecture and resolved all-word search decision.
- `docs/notes-contract.md` — jointly agreed persistence interface.
- `docs/decisions/001-browser-persistence.md` — browser persistence implementation decision and known limitations.
- `src/persistence/notes-store.mjs` — browser note persistence module.
- `tests/persistence/notes-store.test.mjs` — native Node test-runner coverage for persistence.

## Ownership and conventions

- The Senior Backend Engineer owns browser persistence implementation and tests in `src/persistence/` and `tests/persistence/`. The Senior Frontend Engineer owns UI, app setup, and browser journey evidence. Coordinate changes to their shared interface before editing across that boundary.
- Follow `docs/decisions/001-browser-persistence.md` for the implementation decision and limitations. Follow `docs/notes-contract.md` for the jointly agreed public contract; contract changes require both owners to agree.
- Keep the persistence module dependency-free and in native ESM. Add tests with Node's built-in `node:test` and `node:assert/strict` APIs; do not introduce a package dependency for persistence-only work.
- Keep repository-wide setup and verification guidance here. Document only commands supported by checked-in manifests/configuration and commands that have been run successfully.
