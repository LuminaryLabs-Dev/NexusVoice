# NexusVoice native runtime

NexusVoice `0.1.0-preview.1` runs Kokoro locally through a small C ABI backed by
Sherpa-ONNX `1.13.6` and ONNX Runtime.

Implemented:

- Runtime creation and destruction.
- Kokoro model, phonemizer, token and voice loading.
- 53 named Kokoro voices.
- Float PCM generation at 24 kHz.
- Cancellation and deterministic error codes.
- Caller-owned audio buffers with explicit cleanup.
- Non-finite, DC-pinned and rail-clipped output rejection.
- Linux x64 native synthesis and Node-reference validation.

Public native calls are declared in `include/nexusvoice.h`:

```c
nexusvoice_create(...);
nexusvoice_synthesize(...);
nexusvoice_reset_cancel(...);
nexusvoice_cancel(...);
nexusvoice_free_buffer(...);
nexusvoice_destroy(...);
```

## Build and test

```bash
cd node
npm ci --onnxruntime-node-install-cuda=skip
npm run model:download
npm run native:all
```

`native:all` downloads checksum-pinned development dependencies, prepares the
native model without changing its graph, builds the plugin, synthesizes a WAV,
compares native and Node signal metrics, and installs the Linux x64 Unity assets.

Generated models, vendor runtimes, binaries and WAV files are excluded from Git.
Windows, macOS and Android builds remain separate validation targets.
