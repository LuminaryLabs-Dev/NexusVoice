# Start here

NexusVoice provides local Kokoro text-to-speech through a Unity package backed primarily by a native C++ runtime, with a Node reference/authoring engine and a static browser Studio as separate supporting surfaces.

## Snapshot

- Repository: `LuminaryLabs-Dev/NexusVoice`
- Default branch: `main`
- Documentation baseline: `98ea9dd8a898a4784cb0661bc9b50e149958f785`
- Audited files: 205
- Current version: `0.1.0-preview.1`
- Source/package license: ISC
- Unity package: `com.luminarylabs.nexusvoice`
- Unity package compatibility: `2022.3 / 0f1`
- Checked-in demo project editor: `6000.0.23f1`
- Node reference engine: Node `>=18`
- Studio: Node `>=22`, npm `11.9.0`
- Upkeep pass: `MNT-369`

## Surface map

```text
Unity public API
  ↓ Native mode (default)
Native C ABI + Sherpa-ONNX + ONNX Runtime + Kokoro

Unity optional authoring fallback
  ↓ Node Bridge
localhost Node Kokoro reference engine

Browser companion
  ↓
NexusVoice Studio / Kokoro.js / ONNX Runtime Web
```

## Read routing

- Unity API/package → `unity/Packages/com.luminarylabs.nexusvoice/README.md` + `Documentation~/`
- Native runtime/C ABI → `native/README.md` + `native/include/nexusvoice.h`
- Node bridge/reference → `node/README.md`
- Browser Studio → `studio/README.md`
- Release gates → `docs/RELEASE_CHECKLIST.md`
- Version policy → `docs/VERSIONING.md`
- Licensing/redistribution → `THIRD_PARTY_NOTICES.md`

## Current evidence boundary

Linux x64 native Kokoro synthesis is validated in repository evidence. Unity Editor import/compile, EditMode/PlayMode execution, clean standalone player validation, Windows, macOS, Android/Quest, and commercial redistribution remain release gates.

## Immediate warnings

- The Unity package compatibility version and checked-in demo-project editor version are different facts; do not conflate them.
- Node Bridge listens on loopback and is an authoring/reference path, not the production standalone runtime.
- Studio WebGPU/WASM success does not prove the Unity native ABI.
- Commercial release remains blocked by the current eSpeak NG GPL path and broader dependency/model review.
