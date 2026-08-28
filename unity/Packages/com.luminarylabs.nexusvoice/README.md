# NexusVoice Unity Package

NexusVoice `0.1.0-preview.1` exposes one required component:
`NexusVoiceEmitter`.

```csharp
emitter.Speak("Hello from NexusVoice.");
```

Native mode generates a Unity `AudioClip` locally through the NexusVoice C++
plugin, Sherpa-ONNX, ONNX Runtime and Kokoro. Node Bridge mode remains available
as an optional reference backend.

## Public API

- `Speak(text)` interrupts this emitter and starts a line.
- `Queue(text)` adds a line after the current line.
- `GenerateAsync(text)` returns an `AudioClip` without playing it.
- `Focus()` and `ReleaseFocus()` control the focused emitter.
- `Skip()`, `Stop()`, `ClearQueue()` and `ClearCache()` control runtime state.

Events use the `EventWrapper` naming scheme:

- `OnClipReady`
- `OnPlaybackStarted`
- `OnPlaybackFinished`
- `OnFocusGained`
- `OnFocusLost`
- `OnError`

Linux x64 native generation is validated. Other platform binaries and Unity
player builds remain preview release gates.

Commercial redistribution is not yet cleared because the current phonemizer path
includes GPL-3.0-or-later eSpeak NG functionality and data. See
`THIRD_PARTY_NOTICES.md` before building a customer package.

See `Documentation~/Installation.md` and `Documentation~/QuickStart.md`.
