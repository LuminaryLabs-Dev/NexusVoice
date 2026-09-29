# Repository profile

## Identity

- Owner: `LuminaryLabs-Dev`
- Repository: `NexusVoice`
- Visibility: public
- Default branch: `main`
- Audit baseline: `98ea9dd8a898a4784cb0661bc9b50e149958f785`
- Audit baseline tree: `b476abb1fdabab2fcb761e45842d4a5b452993ab`
- Audited files: 205
- Current release: `0.1.0-preview.1`
- Root/source license: ISC

## Major repository areas

- `.github/` — NexusVoice Studio Pages workflow.
- `native/` — C++ C ABI and Kokoro runtime.
- `node/` — known-good Kokoro reference/authoring engine and loopback bridge.
- `studio/` — static Next.js/Kokoro.js browser companion.
- `unity/` — Unity demo project and embedded UPM package.
- `tools/` — native setup/model/build/install/release/package-validation tooling.
- `release/` — itch/Unity Asset Store release guidance.
- `docs/` — release/versioning authorities.

## Unity package

- package ID: `com.luminarylabs.nexusvoice`
- version: `0.1.0-preview.1`
- manifest compatibility: Unity `2022.3`, release `0f1`
- checked-in demo project: Unity `6000.0.23f1`
- required public component: `NexusVoiceEmitter`
- default runtime mode: Native
- optional runtime mode: Node Bridge
- public behavior includes `Speak`, `Queue`, `GenerateAsync`, `Focus`, `ReleaseFocus`, `Skip`, `Stop`, `ClearQueue`, and `ClearCache`
- events include clip-ready/playback/focus/error wrappers

## Native runtime

- C++ stable C ABI backed by Sherpa-ONNX `1.13.6` and ONNX Runtime.
- sample rate: 24,000 Hz float PCM.
- current native voice table: 53 IDs.
- validates required model/token/voice/lexicon/eSpeak assets.
- rejects non-finite, extreme DC and heavily rail-clipped output.
- explicit cancellation and deterministic status/error mapping.
- native output buffer is allocated by runtime and must be released with `nexusvoice_free_buffer`.

Public ABI includes:
`nexusvoice_runtime_version`, `nexusvoice_create`, `nexusvoice_synthesize`, `nexusvoice_reset_cancel`, `nexusvoice_cancel`, `nexusvoice_voice_count`, `nexusvoice_voice_id`, `nexusvoice_last_error`, `nexusvoice_free_buffer`, `nexusvoice_destroy`.

## Node reference/authoring engine

- package: `nexusvoice@0.1.0-preview.1`
- Node engine: `>=18`
- Kokoro.js: `1.2.1`
- local model ID: `kokoro-82m-q8`
- loopback service default: `127.0.0.1:47831`
- endpoints: `GET /health`, `POST /synthesize`
- curated bridge voice list: 7 voices
- current bridge has no authentication token and no synthesis-cancellation API; treat it as a local authoring/reference service.

## Studio

- package: `nexusvoice-studio@0.1.0-preview.1`
- Next.js `16.3.3`, React `19.2.8`, TypeScript `5.9.2`
- Node `>=22`, npm `11.9.0`
- seven curated voices
- compatibility default: WASM Q8
- optional WebGPU path: FP32 with automatic WASM fallback
- model runs in a Web Worker and generated takes remain browser-session local
- Pages workflow builds/validates `studio/out` under `/NexusVoice`.

## Validation and release state

- Linux x64 native synthesis: validated.
- Unity Editor import/compile: pending.
- Unity EditMode/PlayMode execution: pending.
- clean Linux standalone player: pending.
- Windows/macOS/Android/Quest native validation: pending.
- commercial redistribution: blocked pending formal eSpeak NG/dependency/model review.
- Studio is a separate browser experience and does not certify the native runtime.
