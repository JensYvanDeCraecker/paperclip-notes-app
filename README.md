# Personal notes

A dependency-free browser app for creating, editing, finding and deleting plain-text personal notes. Saved notes stay in this browser. Search finds all entered words anywhere in title/body, ignoring case.

Requires Node.js and a modern browser with localStorage and crypto.randomUUID. From the repository root:

```sh
node scripts/serve.mjs
```

Open http://localhost:4173. There is no app dependency installation or build step. Keep the same browser profile and localhost origin to reopen saved notes. Stop with Ctrl+C. `PORT` optionally selects another port; a different port has separate storage.

Save explicitly with **Save note**. Closing a dirty draft requests the browser's leave warning where supported; unsaved drafts are not recovered after closing. Private browsing and cleared site data can lose saved notes. No accounts, backup, sync, multi-tab editing guarantee or production deployment is provided.

## Verification

```sh
node --test tests/persistence/*.test.mjs
node --check src/client/notes-app.mjs
node --check scripts/serve.mjs
```

Browser verification uses optional Playwright tooling installed outside the repository, leaving app dependencies unchanged:

```sh
npm install --prefix /tmp/baga-browser playwright
PLAYWRIGHT_BROWSERS_PATH=/tmp/baga-browser/browsers /tmp/baga-browser/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/baga-browser/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/tmp/baga-browser/browsers node tests/browser/journey.mjs
PLAYWRIGHT_MODULE=/tmp/baga-browser/node_modules/playwright/index.mjs PLAYWRIGHT_BROWSERS_PATH=/tmp/baga-browser/browsers node tests/browser/states.mjs
```

Start the server first. Chromium requires its platform libraries and installed fonts. The delivery runner lacked these, so verification additionally used `LD_LIBRARY_PATH=/tmp/baga-browser/runtime/usr/lib/x86_64-linux-gnu` and `FONTCONFIG_FILE=/tmp/baga-browser/fonts.conf` with isolated downloaded Debian libraries/fonts. These temporary runner paths are not app requirements. Screenshots default to `/tmp/baga-notes-evidence`; override with `EVIDENCE_DIR`. `NOTES_URL` selects another localhost port.

Each browser test creates isolated contexts; it does not clear your regular browser data. To manually reset, use a disposable browser profile and clear only this localhost site's data. This permanently removes its notes.

To simulate denied operations in a disposable profile's developer console:

```js
window.realWrite = Storage.prototype.setItem;
Storage.prototype.setItem = () => { throw new DOMException('Simulated denial', 'SecurityError'); };
// Save an edited/new note or confirm deletion: it must fail without changing saved content.
Storage.prototype.setItem = window.realWrite; // Restore, then retry.
```

For initial read failure, replace `Storage.prototype.getItem` similarly before loading the app module (the browser test uses addInitScript). Retry after restoring it; the collection must never become an editable empty state while reading fails. For a full-storage outcome, throw `QuotaExceededError` instead. These injections are test-only and never appear in the application module.

See `docs/notes-contract.md`, `docs/decisions/002-frontend.md` and the issue's built-screen evidence for the contract, implementation and review status.
