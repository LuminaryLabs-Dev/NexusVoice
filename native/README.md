# NexusVoice Native Runtime Boundary

This is the stable C ABI that the Unity package will eventually call directly.

The current implementation intentionally returns `-1` for synthesis because the Kokoro ONNX execution backend has not yet been ported into this native target. Node remains the validated reference engine and Unity currently uses its localhost bridge.

Next native step:

1. Add pinned ONNX Runtime native dependencies.
2. Implement model/session loading.
3. Implement Kokoro phonemization and voice embedding inputs.
4. Return owned PCM buffers through this ABI.
5. Build platform libraries for Windows, macOS, Linux, and Android.
