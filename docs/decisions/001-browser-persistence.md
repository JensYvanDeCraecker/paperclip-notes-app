# Browser persistence implementation

Status: accepted implementation decision; jointly agreed public contract in `docs/notes-contract.md`.

The release needs personal notes in one browser and no server. Use a dependency-free browser ES module and a versioned localStorage document under `personal-notes:v1`. Each mutation reads the latest document, validates it, applies one operation and commits with one setItem. A successful return means that the browser storage API accepted the write. Read/write failures are explicit typed errors. Invalid or unsupported documents are never replaced automatically.

No storage read is treated as an empty collection unless the key is absent. No failed mutation updates a cached successful state. The UI owns drafts, retry controls, navigation, accessible feedback and rendering; persistence owns stored records and lookup. Search matches all query words, case-insensitively, across title and body. Empty titles/bodies are allowed at the storage layer; display labels belong to the UI.

Limitations: browser storage can be cleared by the user and private sessions may be ephemeral. localStorage offers no cross-tab compare-and-swap; a pre-write conflict check detects intervening changes but cannot guarantee isolation against simultaneous tabs. Cross-device sync and simultaneous-tab collaboration are outside this release. No automatic migration or destructive recovery is introduced.

Verification: `node --test tests/persistence/*.test.mjs`. Browser journey evidence belongs to the frontend delivery, including actual reloads, keyboard/mobile use and visible unsaved failure handling.
