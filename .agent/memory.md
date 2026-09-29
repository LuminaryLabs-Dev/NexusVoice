# Maintainer memory

## Versioning

- current release: `0.1.0-preview.1`
- small preview iteration → increment preview suffix
- meaningful compatible revision → increment patch
- major preview milestone → increment minor
- stable commercial API → `1.0.0`
- published versions are immutable and releases synchronize Unity manifest, Node manifest, changelogs, archives, notes and tag

## Unity

- package ID: `com.luminarylabs.nexusvoice`
- package compatibility: Unity `2022.3 / 0f1`
- checked-in demo project editor: `6000.0.23f1`
- required component: `NexusVoiceEmitter`
- default backend: Native
- Node Bridge remains optional
- emitter public surface includes speak/queue/generate/focus/skip/stop/cache operations

## Native ABI

- `nexusvoice_create` / `nexusvoice_destroy` own runtime lifecycle
- `nexusvoice_synthesize` returns float PCM
- `nexusvoice_reset_cancel` / `nexusvoice_cancel` manage cancellation
- `nexusvoice_free_buffer` releases runtime-allocated samples
- voice enumeration and last-error access are exposed
- sample rate: 24 kHz
- native voice table: 53 IDs
- Sherpa-ONNX pinned line: `1.13.6`

## Node reference

- Node `>=18`
- bridge listens on `127.0.0.1:47831` by default
- health: `GET /health`
- synthesis: `POST /synthesize`
- curated bridge voices: `af_heart`, `af_bella`, `af_nicole`, `am_michael`, `am_fenrir`, `bf_emma`, `bm_george`
- current bridge is local authoring/reference infrastructure; no auth token or cancellation endpoint is implemented

## Studio

- Node `>=22`, npm `11.9.0`
- seven curated voices
- WASM Q8 compatibility default
- WebGPU FP32 optional path; initialization failure falls back to WASM
- GitHub Pages workflow builds `studio/out`
- Studio dependency tree currently inherits an unpatched `sharp` audit finding documented in `studio/README.md`; `sharp` is not used/emitted by the static Studio bundle according to that authority

## Evidence memory

- Linux x64 native synthesis is validated
- Unity Editor import/compile is pending
- Unity EditMode/PlayMode is pending
- clean standalone player proof is pending
- Windows/macOS/Android/Quest are pending
- commercial distribution is blocked by current licensing review
- Studio/browser success does not prove Unity/native behavior

## Generated artifacts

Generated model packs, vendor runtimes, native binaries, WAV files and release archives remain outside normal Git source history.
