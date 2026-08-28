# NexusVoice native runtime boundary

This folder defines the stable C ABI used by `NexusVoiceEmitter`.

Implemented and locally testable:

- Runtime initialization and shutdown.
- Required model-file validation.
- Input validation and deterministic error messages.
- PCM buffer ownership and cleanup.
- CMake smoke-test target.

Not represented as complete:

- Kokoro text normalization and phonemization.
- Tokenization and voice-style selection.
- ONNX Runtime session execution.
- Platform plugin binaries.

Until those dependencies are pinned, bundled, licensed, and tested, `nexusvoice_synthesize` returns a clear preview-unavailable error. Unity customers should use Node Bridge mode for authoring and must not ship Native mode from this preview.
