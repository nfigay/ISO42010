# ISO42010 — contractual direction for modular builds and events

## What the BPMNSM audit proves

- BPMNSM builds six targets locally via Vite (two standalone, two server, two preserved-module).
- BPMNSM runs test/build gates before deploying `dist/` to the `gh-pages` branch with `npx gh-pages -d dist --dotfiles`.
- ISO42010 currently publishes unbuilt `docs/` from GitHub Actions (`upload-pages-artifact` and `deploy-pages`).
- A separate `.gh-pages/vite.config.js` file exists in BPMNSM but differs from the root config; the root file and publication script are the active contract for the audited npm scripts.

## Decision: staged migration

1. Keep existing working `docs/index.html` and current Pages publication untouched.
2. Introduce ESM event contract, event bus and BroadcastChannel transport, with independent Node tests.
3. Integrate modules into a refactored application *only after* inspecting and testing the exact current HTML and migration semantics.
4. Add Vite builds for standalone HTML, standard web distribution, and preserved modules; verify equivalence and packaging with BPMNSM principles.
5. Switch Pages from workflow to branch publication only after all build and browser acceptance gates succeed. No GitHub Actions build required in target architecture.

## Event semantics

- `workspace.updated` means a durable write has completed; it is NOT an update request.
- Event fields: `protocol`, `version`, `type`, `workspaceId`, `revision`, `sender`, `eventId`, `committedAt`.
- Subscribers reload the authoritative IndexedDB record; events do not transport the full model.
- Revision comparison and write conflict protection belong in WorkspaceRepository, not in BroadcastChannelAdapter.
- On window focus/visibility restoration, consumers must compare repository revision to recover from missed messages.
- The current monolith publishes legacy `{type:'committed', workspaceId, sender}` notifications. The new protocol is NOT a drop-in wire replacement. Integrate with a compatibility bridge and test two old/new tabs before switching. The new adapter deliberately uses the old channel name, but new consumers ignore legacy messages until a bridge is added.
- Cross-browser/machine transport is out of scope: network connectivity, server-side durable authority, conflict handling, authorization and replay must be designed explicitly.

## Release gates

- Existing data remain readable; never delete `ISO42010_Architecture_State` during migration.
- Multi-tab sync and stale-write rejection.
- Stakeholder edit, framing/containment, graph Collapse All/Expand All, XML export remain functional.
- Changes to GitHub Pages are a separate, reversible release step.
