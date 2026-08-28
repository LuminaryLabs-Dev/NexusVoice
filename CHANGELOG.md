# Changelog

## 0.1.0-preview.1 — 2026-08-28

- Added real Kokoro inference through a C++ C ABI and Sherpa-ONNX 1.13.6.
- Added deterministic native model preparation for 53 Kokoro voices.
- Added cancellation, explicit runtime ownership, PCM cleanup and signal safety checks.
- Connected Unity Native mode to the compiled runtime and made it the default backend.
- Added checksum-pinned native setup, Linux x64 build, Unity installation and Node-reference validation.
- Validated Linux x64 synthesis at 24 kHz; Unity player and other platforms remain release gates.

## 0.0.1-preview.1 — 2026-08-28

- Established the first NexusVoice preview version line.
- Kept `NexusVoiceEmitter` as the only required Unity runtime component.
- Split public API, internal runtime, backends, editor tools, samples, and tests.
- Added focus priority, cancellation, bounded caching, fades, and readable errors.
- Added Node bridge health checks and WAV response validation.
- Added package documentation, release guidance, deterministic metadata, and validation tooling.
- Preserved the explicit native boundary; native inference remains deferred to `0.1.0-preview.1`.
