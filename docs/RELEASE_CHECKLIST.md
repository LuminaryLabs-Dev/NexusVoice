# Release checklist

## `0.1.0-preview.1`

- [x] Stable C ABI with explicit runtime and PCM-buffer ownership.
- [x] Real Kokoro inference through Sherpa-ONNX and ONNX Runtime.
- [x] Kokoro model, voice, token, lexicon, and eSpeak data preparation.
- [x] Linux x64 native build and signal-level smoke test.
- [x] Unity native backend, cancellation, error mapping, and Node fallback.
- [x] Reproducible native setup, build, install, and validation commands.
- [x] Local UPM and itch preview archives with checksums.
- [ ] Unity Editor import, compile, Edit Mode, and Play Mode evidence.
- [ ] Clean Linux standalone-player validation.
- [ ] Windows, macOS, Android, and Quest native validation.
- [ ] Legal review of GPL-3.0-or-later eSpeak NG integration before commercial distribution.
- [ ] Store screenshots, audio preview, demo video, and support details.

## `0.0.1-preview.1`

- [x] Final embedded UPM folder.
- [x] One required runtime component.
- [x] Runtime, Editor, Samples, Edit Mode, and Play Mode assemblies.
- [x] Node backend, timeout, cancellation, and WAV validation.
- [x] Focus, queue, fade, cache, and error handling.
- [x] Editor setup and model validation commands.
- [x] Sample scene and package documentation.
- [x] Source and native-boundary validation.
- [ ] Unity Editor import and compile evidence.
- [ ] Unity Edit Mode and Play Mode execution evidence.
- [ ] Store screenshots, audio preview, and demo video.

## Native release gates

- [x] ONNX Runtime inference on Linux x64.
- [x] Text normalization and phonemization on Linux x64.
- [x] Token and voice tensor loading.
- [ ] Windows, macOS, and Android native builds.
- [ ] Clean standalone player validation on every advertised platform.
- [ ] Model, voice, runtime, and phonemizer redistribution approval.
- [ ] Unity Asset Store dependency-license approval.
