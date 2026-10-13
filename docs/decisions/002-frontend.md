# Frontend implementation

Use native HTML, CSS and browser ECMAScript modules, without dependencies or a build step. This follows the jointly agreed frontend stack and the accepted screen-local component vocabulary in BAGA-13 specification revision 9bdbbabd-01e4-4771-b072-5c9537f81e64. The company-wide design system remains provisional.

Initial structure: `index.html` owns semantic regions, labelled fields and the native confirmation dialog; `src/client/notes.css` implements the specified colors, dimensions and responsive panes. Application state and public persistence integration live in `src/client/notes-app.mjs`; the UI consumes only the agreed public store methods. The scaffold deliberately keeps controls disabled until an application module completes loading.

Search clarification: the authenticated board answer on 2026-10-13 approved all entered words anywhere in title/body (interaction 036d2182-01d8-4b51-b7d9-b9bc970727ee). The UI uses `list(query)` unchanged. No persistence contract or implementation changed.

Explicit saves hold exact drafts until a successful mutation. Native modal dialogs guard dirty navigation and deletion; native beforeunload requests a leave warning. Plain text is rendered with textContent. A dependency-free Node static server supplies localhost browser ESM without a build step.
