# NexusVoice

Sandbox workspace for an offline, local text-to-speech toolkit.

## Layout

- `node/` — working Kokoro ONNX engine, model files, WAV generation, and localhost bridge.
- `unity/` — Unity project and C# client package prototype.
- `native/` — stable C ABI and CMake boundary for the future embedded runtime.

## Local proof

From `node/`:

```bash
npm run model:download
npm run generate:joke
npm run serve
```

The Unity prototype currently calls the localhost bridge at `http://127.0.0.1:47831/synthesize`. This is a development integration path. The production package will embed a native inference runtime so shipped games do not require Node.

## Repository policy

All work is being validated in the sandbox first. GitHub has not been modified.
