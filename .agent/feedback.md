# Feedback and deferred findings

These findings are outside the documentation-only MNT-369 pass.

## NV-001 — Unity Editor/runtime evidence remains open

- Unity Editor import/compile is not checked off in `docs/RELEASE_CHECKLIST.md`.
- Unity EditMode and PlayMode execution are also pending.
- Status: release gate

## NV-002 — Standalone and non-Linux platform proof remains open

- Clean Linux standalone-player validation is pending.
- Windows, macOS, Android and Quest native/player validation remain pending.
- Status: platform gate

## NV-003 — Commercial redistribution remains blocked

- Current native phonemizer path includes GPL-3.0-or-later eSpeak NG functionality/data.
- Unity Asset Store dependency-license approval and full model/runtime redistribution review remain required.
- Status: blocked for commercial release

## NV-004 — Store/release presentation material is incomplete

- Store screenshots, audio preview, demo video and support details remain unchecked in the release checklist.
- Status: release-content gate

## NV-005 — Studio inherits an upstream sharp audit finding

- `studio/README.md` records an unpatched `sharp` audit finding inherited through the Kokoro.js dependency tree.
- The authority says `sharp` is not used by Studio or emitted in its static browser bundle.
- Status: dependency follow-up

## NV-006 — Node Bridge is authoring/reference infrastructure, not a hardened production service

- `node/server.cjs` binds loopback and exposes health/synthesize without authentication, request limiting, or a synthesis-cancellation endpoint.
- Status: informational / harden only if the bridge becomes a shipped service
