# NexusVoice Unity Package

NexusVoice `0.0.1-preview.1` exposes one required component: `NexusVoiceEmitter`.

```csharp
emitter.Speak("Hello from NexusVoice.");
```

This first preview uses the local Node bridge for authoring. Run `npm run serve`
from the repository's `node/` folder before generating speech in Unity.

## Public API

- `Speak(text)` interrupts this emitter and starts a line.
- `Queue(text)` adds a line after the current line.
- `GenerateAsync(text)` returns an `AudioClip` without playing it.
- `Focus()` and `ReleaseFocus()` control the focused emitter.
- `Skip()`, `Stop()`, `ClearQueue()`, and `ClearCache()` control runtime state.

Events use the `EventWrapper` naming scheme:

- `OnClipReady`
- `OnPlaybackStarted`
- `OnPlaybackFinished`
- `OnFocusGained`
- `OnFocusLost`
- `OnError`

## Native status

Native mode is an integration boundary in this release. It validates model files
and returns an explicit unavailable error because ONNX inference and phonemization
are scheduled for `0.1.0-preview.1`.

See `Documentation~/QuickStart.md` for setup and examples.
