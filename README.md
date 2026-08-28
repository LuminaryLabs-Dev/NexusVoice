# NexusVoice

NexusVoice is a Kokoro text-to-speech toolkit with one public Unity component:

```csharp
emitter.Speak("Welcome to NexusVoice.");
```

## Repository layout

- `unity/` — Unity demo project and embedded UPM package.
- `node/` — validated Kokoro engine and localhost authoring bridge.
- `native/` — stable C ABI and future embedded inference runtime.
- `tools/` — package validation and release preparation.
- `release/` — store-specific release requirements, without generated archives.

## Current version

`0.0.1-preview.1` is the first package preview. It provides:

- One required component: `NexusVoiceEmitter`.
- Direct and queued speech.
- `AudioClip` lifecycle events using the `EventWrapper` naming scheme.
- Focus priority, interruption, fades, cancellation, and bounded caching.
- Node Bridge authoring mode.
- Editor setup checks, a sample scene, and package tests.

The Node path is validated. Native ONNX inference and phonemization are not bundled,
so this version is not an offline standalone Unity runtime.

## Start the preview

```bash
cd node
npm install
npm run model:download
npm run validate:source
npm run smoke
npm run serve
```

Open `unity/` in Unity, import the Basic Emitter Demo sample, and keep the emitter
in **Node Bridge** mode.

## Native boundary

```bash
cmake -S native -B native/build
cmake --build native/build
ctest --test-dir native/build --output-on-failure
```

The native boundary deliberately returns an unavailable error until pinned ONNX
Runtime and phonemizer dependencies are integrated for `0.1.0-preview.1`.

## Versioning

- Small iteration: increment `preview.N`.
- Meaningful compatible revision: increment the patch number.
- Major preview milestone: increment the minor number.
- Stable commercial API: `1.0.0`.

See `docs/VERSIONING.md` and `docs/RELEASE_CHECKLIST.md`.

## License

NexusVoice source code uses the ISC License. Third-party components and model data
retain their own terms; review `THIRD_PARTY_NOTICES.md` before redistribution.
