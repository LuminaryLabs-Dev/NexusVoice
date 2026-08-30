# NexusVoice Studio

NexusVoice Studio is the static browser companion for the NexusVoice Unity package.
It runs Kokoro locally with Kokoro.js and ONNX Runtime Web, produces playable WAV
files, and keeps generated takes in the current browser session.

## Run locally

```bash
npm ci --onnxruntime-node-install-cuda=skip
npm run validate
npm run preview
```

Open `http://127.0.0.1:4173/`.

## GitHub Pages build

```bash
NEXT_PUBLIC_BASE_PATH=/NexusVoice npm run build
NEXT_PUBLIC_BASE_PATH=/NexusVoice npm run preview
```

Open `http://127.0.0.1:4173/NexusVoice/`.

## Boundaries

- The browser engine validates the Kokoro voice experience, not the Unity C++ ABI.
- The first generation downloads the chosen model; browser caches handle later runs.
- The Q8 WASM path is the compatibility default. WebGPU uses the larger FP32 model
  and falls back to WASM when initialization fails.
- The current Kokoro.js dependency tree inherits an unpatched `sharp` audit finding.
  `sharp` is not used by Studio or emitted in the static browser bundle, but the
  upstream dependency must still be updated when a patched release is available.
- This remains a technical preview. Review repository third-party notices before
  commercial distribution.
