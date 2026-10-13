# Notes persistence contract

Status: jointly agreed by Senior Backend Engineer and Senior Frontend Engineer on 2026-10-13 in BAGA-14 (SFE agreement comment 94feaa28-525e-4734-b25d-620563d61724).

Import `createNotesStore` and `NotesStorageError` from `src/persistence/notes-store.mjs`. This dependency-free browser ESM module exports `createNotesStore({ storage?, key? } = {})`. The default storage is browser `localStorage`; the default key is `personal-notes:v1`. An injected storage implements synchronous `getItem(key)` (string or null) and `setItem(key, string)`. Creation requires browser `crypto.randomUUID()` (serve the app on localhost or HTTPS).

All methods are synchronous: they return the following values or throw; they do not return promises. Constructing the store performs no storage access. Each method reads current storage, without cached saved state.

| Method | Return value and behavior |
| --- | --- |
| `list(query = '')` | Array of matching notes; absent storage key or no matches returns `[]`. Query must be a string. Trim, lowercase using the runtime locale, and split on whitespace; every query word must occur as a substring across title and body. An empty query includes all notes. Order is descending `updatedAt` string, then ascending `id`, using `localeCompare`. |
| `get(id)` | Matching note or `null` when missing. |
| `create({title, body})` | The committed new note, with generated UUID and equal creation/update timestamps. |
| `update(id, {title, body})` | The committed replacement note; both fields are required. Preserves id and createdAt, refreshes updatedAt. Missing id throws `not_found`. |
| `remove(id)` | `true` after committed deletion. Missing id throws `not_found`. |

Every note has string fields `id`, `title`, `body`, `createdAt`, and `updatedAt`. Generated timestamps use UTC ISO 8601. Title and body must be strings; empty or whitespace-only strings are preserved verbatim and allowed. Extra input fields are ignored. The UI owns fallback display titles. Treat returned records as snapshots; editing them does not save anything. Pass an existing note's string id for lookup/update/deletion.

Errors from validation and storage are `NotesStorageError` with `name`, `message`, `code`, and optional `cause`:

| Code | Meaning |
| --- | --- |
| `invalid` | Non-string title/body or query. |
| `unavailable` | Storage access or initial read failed. |
| `corrupt` | Stored JSON, version, note fields, timestamps, or unique ids are invalid. Existing raw data is preserved. |
| `not_found` | Update/delete target no longer exists. |
| `conflict` | Pre-write reread differs from the initial read. Keep draft and retry. |
| `write_failed` | Commit or pre-write storage access failed. Keep draft and retry. |

A mutation returns only after one `setItem` succeeds. Success means the browser storage API accepted the write; there is no separate disk-flush guarantee. A thrown mutation must never be shown as saved. The UI retains drafts, reports an understandable error, and offers retry; it never accesses storage directly. Invalid/corrupt data is not automatically overwritten or migrated. The persisted envelope is `{version: 1, notes: [...]}`.

The conflict check is best effort, not an atomic multi-tab lock. The release supports personal notes in one browser, with no concurrent-editing guarantee. User-cleared storage and ephemeral private sessions can lose data. Cross-device sync, accounts, and collaboration are out of scope.

Ownership: SBE owns this contract, persistence module/tests, and decision records; changes to the public contract require joint agreement. SFE owns the client, launch setup, visible failure states, and desktop/mobile/keyboard browser journey evidence.

Verification: `node --test tests/persistence/*.test.mjs`. Browser journey and launch instructions are delivered in BAGA-15.
