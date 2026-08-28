# NexusVoice Unity Package

NexusVoice exposes one component: `NexusVoiceEmitter`.

```csharp
emitter.Speak("Hello from NexusVoice.");
```

Add the component to a GameObject with an `AudioSource`. The preview release defaults to **Node Bridge** mode: run `npm run serve` from the repository's `node` folder while authoring in Unity.

## API

- `Speak(text)` interrupts this emitter and starts a line.
- `Queue(text)` adds a line after the current line.
- `GenerateAsync(text)` returns an `AudioClip` without playing it.
- `Focus()` and `ReleaseFocus()` select the current speaker.
- `Skip()`, `Stop()`, and `ClearQueue()` control playback.

`OnAudioClipReady` exposes each generated clip. Focus, speech lifecycle, text, and error events are also available in the Inspector.

## Native status

The native ABI validates model installation and reports deterministic errors, but ONNX inference and phonemization are not bundled in this preview. Native mode is therefore not a shipping runtime yet. Games must not be released with Native mode until platform binaries pass the native and standalone validation gates documented in the repository.
