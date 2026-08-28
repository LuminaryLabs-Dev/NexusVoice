# Changelog

## 0.1.0-preview.1

- Added embedded Kokoro generation through the NexusVoice native C API.
- Added 53 native voice IDs, cancellation and safe PCM buffer transfer.
- Made Native the default emitter backend while retaining Node Bridge mode.
- Validated the Linux x64 native engine against the Node reference output.

## 0.0.1-preview.1

- Established the first preview version line.
- Kept `NexusVoiceEmitter` as the only required runtime component.
- Separated public API, internal runtime, Node, native, editor, sample, and tests.
- Added queueing, focus priority, cancellation, fades, bounded caching, and clear errors.
- Added Node bridge health checks and malformed-WAV validation.
- Added Edit Mode and Play Mode test assemblies.
- Added package documentation and a self-contained sample scene.
