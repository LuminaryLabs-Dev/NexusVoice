# NexusVoice Node Engine

This is the external reference engine for NexusVoice.

It runs Kokoro's quantized ONNX model locally through `kokoro-js`, produces WAV files, and exposes a small localhost bridge for the Unity prototype.

```bash
npm run model:download
npm run generate:joke
npm run serve
```

The model is downloaded to `models/kokoro/onnx/model_quantized.onnx` and is intentionally excluded from Git source history. The current bridge is for development and authoring; the final shipped Unity runtime should use embedded native inference.
