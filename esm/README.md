# NexusVoice browser ESM

The existing Unity native runtime and browser Studio remain unchanged. This folder adds a standalone JavaScript ESM client for other LuminaryLabs modules.

```js
import { NexusVoiceBrowser } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusVoice@main/esm/index.js";
const voice = new NexusVoiceBrowser({ backend: "auto" });
await voice.load();
await voice.speak("Hello from NexusVoice.");
```

The ESM adapter spins up a same-origin Blob bootstrap worker, imports its sibling `tts-worker.js` via ESM, and loads [onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) from Hugging Face. It tries WebGPU FP32, then WASM Q8. Model download requires the user's connection once, then relies on browser caching. Audio playback is real-time but synthesis currently generates the full WAV first.

`speak()` fulfills after playback ends, not when synthesis finishes. Use `on("started")`, `on("finished")`, `on("error")`, and `stop()` to orchestrate half-duplex interaction. In the browser, `speak()` must follow a suitable user gesture/permission policy.

**Note:** The external ESM CDN bridge and WebGPU Kokoro runtime require a live browser smoke test; Node-only tests cannot verify model downloads or GPU drivers. Pin a GitHub tag/SHA instead of `@main` for production delivery.
