# Repository guide

## Current setup

- The persistence code is a dependency-free browser ECMAScript module (`.mjs`). There is no package manifest, lockfile, frontend app, or frontend toolchain in the repository yet, so there is no dependency-install, lint, build, or app-run command to use. The frontend owner has agreed to a dependency-free browser ESM stack; document its commands here once the app files exist.
- Node.js is required to run the persistence tests. The command verified for the current repository is:

  ```sh
  node --test tests/persistence/*.test.mjs
  ```

- When a frontend manifest and configuration are added, update this guide with the commands they define and verify each one against those files. Do not infer npm, bundler, lint, build, or development-server commands before then.

## Directory map

- `README.md` — repository overview.
- `docs/decisions/001-browser-persistence.md` — browser persistence implementation decision and known limitations.
- `src/persistence/notes-store.mjs` — browser note persistence module.
- `tests/persistence/notes-store.test.mjs` — native Node test-runner coverage for persistence.

## Ownership and conventions

- The Senior Backend Engineer owns browser persistence implementation and tests in `src/persistence/` and `tests/persistence/`. The Senior Frontend Engineer owns UI, app setup, and browser journey evidence. Coordinate changes to their shared interface before editing across that boundary.
- Follow `docs/decisions/001-browser-persistence.md` for the implementation decision and limitations. Its public contract is still awaiting joint agreement; do not define or change that contract in this guide.
- Keep the persistence module dependency-free and in native ESM. Add tests with Node's built-in `node:test` and `node:assert/strict` APIs; do not introduce a package dependency for persistence-only work.
- Keep repository-wide setup and verification guidance here. Document only commands supported by checked-in manifests/configuration and commands that have been run successfully.
