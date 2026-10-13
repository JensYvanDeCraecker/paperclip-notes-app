# Frontend implementation

Use native HTML, CSS and browser ECMAScript modules, without dependencies or a build step. This follows the jointly agreed frontend stack and the accepted screen-local component vocabulary in BAGA-13 specification revision 9bdbbabd-01e4-4771-b072-5c9537f81e64. The company-wide design system remains provisional.

Initial structure: `index.html` owns semantic regions, labelled fields and the native confirmation dialog; `src/client/notes.css` implements the specified colors, dimensions and responsive panes. Interactive application state and public persistence integration are pending. The scaffold deliberately keeps controls disabled until an application module completes loading.

Open integration question: the accepted spec uses complete-phrase search, whereas `docs/notes-contract.md` specifies all-word search. Designer response is required before implementing search. No persistence contract or implementation is changed by the client scaffold.
