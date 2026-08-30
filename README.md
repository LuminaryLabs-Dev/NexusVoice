# NexusVoice

NexusVoice is a local Kokoro text-to-speech toolkit with one public Unity
component:

```csharp
emitter.Speak("Welcome to NexusVoice.");
```

## Repository layout

- `unity/` — Unity demo project and embedded UPM package.
- `native/` — C++ runtime and stable C ABI.
- `node/` — known-good Kokoro reference engine and optional authoring bridge.
- `studio/` — static browser studio powered by Kokoro.js and ONNX Runtime Web.
- `tools/` — native setup, validation and release tooling.
- `release/` — store release requirements.

## NexusVoice Studio

The browser Studio provides a visible way to test the voice experience without
installing Unity. It generates speech locally in a Web Worker, uses WebGPU when
requested and available, falls back to Q8 WASM, and exports ordinary WAV files.

After GitHub Pages is enabled for GitHub Actions, the deployment target is
<https://luminarylabs-dev.github.io/NexusVoice/>.

The Studio validates Kokoro model behavior and product UX. It does not execute or
replace the Unity package's native C++ runtime.

## Current version

`0.1.0-preview.1` adds real embedded Kokoro inference:

- One required component: `NexusVoiceEmitter`.
- Native float PCM generation through Sherpa-ONNX and ONNX Runtime.
- 53 native Kokoro voices, including the seven curated package voices.
- Direct speech, queues, focus, interruption, fades and bounded caching.
- Cancellation, native buffer cleanup and malformed-audio protection.
- Node Bridge mode retained as a reference and authoring fallback.

Linux x64 native synthesis is validated in the sandbox. Unity Editor import,
player builds, Windows, macOS and Android remain release gates.

This preview is not cleared for commercial distribution. Its current phonemizer
path includes GPL-3.0-or-later eSpeak NG functionality and data; complete formal
license review or replace that path before selling it on itch or submitting it to
the Unity Asset Store.

## Build the native preview

```bash
cd node
npm ci --onnxruntime-node-install-cuda=skip
npm run model:download
npm run native:all
```

Then open `unity/` and use the default **Native** runtime mode.

For Node Bridge mode instead:

```bash
cd node
npm run serve
```

## Versioning

- Small iteration: increment `preview.N`.
- Meaningful compatible revision: increment the patch number.
- Major preview milestone: increment the minor number.
- Stable commercial API: `1.0.0`.

See `docs/VERSIONING.md` and `docs/RELEASE_CHECKLIST.md`.

## License

NexusVoice source uses the ISC License. Sherpa-ONNX, ONNX Runtime, Kokoro,
eSpeak-NG and model assets retain their own terms; review
`THIRD_PARTY_NOTICES.md` before redistribution.
