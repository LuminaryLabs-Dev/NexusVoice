# NexusVoice

NexusVoice is an offline Kokoro text-to-speech toolkit with a deliberately small Unity API.

```csharp
emitter.Speak("Welcome to NexusVoice.");
```

## Repository layout

- `node/` — validated Kokoro reference engine, WAV generation, model installer, and localhost authoring bridge.
- `unity/` — Unity 6 demo project and embedded `com.luminarylabs.nexusvoice` package.
- `native/` — stable C ABI, model validation, memory ownership, and native-runtime integration boundary.

## Current release status

Version `0.2.0-preview.1` provides one Unity component, `NexusVoiceEmitter`, with direct and queued speech, generated `AudioClip` events, speaker focus transitions, configurable fades, stop/skip controls, and Node Bridge authoring mode.

The Node path is validated. The native ABI builds and validates inputs, but native ONNX inference and phonemization are **not yet bundled**. This preview is not an offline standalone Unity release.

## Run the reference engine

```bash
cd node
npm install
npm run model:download
npm run smoke
npm run serve
```

Open `unity/` as a Unity 6 project and keep the emitter in **Node Bridge** mode.

## Install the Unity model pack

```bash
cd node
npm run unity:model
```

This copies the ignored ONNX model and seven selected voice embeddings into `unity/Assets/StreamingAssets/NexusVoice`. The tracked manifest records expected SHA-256 hashes.

## Build the native boundary

```bash
cmake -S native -B native/build
cmake --build native/build
ctest --test-dir native/build --output-on-failure
```

The boundary intentionally returns a clear unavailable error for synthesis until pinned ONNX Runtime and phonemizer dependencies are integrated and validated on each target platform.

## Supported voices

- `af_heart`
- `af_bella`
- `af_nicole`
- `am_michael`
- `am_fenrir`
- `bf_emma`
- `bm_george`

## Large files

The model, voice packs, generated WAV files, native binaries, Unity build cache, and release archives are ignored. They belong in release packages rather than ordinary Git history.

## License

NexusVoice source code is available under the ISC License. Third-party dependencies and model files retain their own licenses; see `THIRD_PARTY_NOTICES.md` before redistribution.
