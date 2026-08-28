# Public API

## `NexusVoiceEmitter`

- `Speak(text)` clears this emitter's queue and begins a line.
- `Speak(text, voice, speed)` uses explicit voice settings.
- `Queue(text)` appends a line.
- `GenerateAsync(text)` generates an `AudioClip` without queueing it.
- `GenerateAsync(text, options, cancellationToken)` supports explicit cancellation.
- `Focus()` requests speaker focus.
- `ReleaseFocus()` releases speaker focus.
- `Skip()` cancels the current line and advances the queue.
- `Stop()` cancels the current line and clears the queue.
- `ClearQueue()` removes queued lines.
- `ClearCache()` removes cached generation results.

## Events

- `OnClipReady(AudioClip)` — generation completed.
- `OnPlaybackStarted(AudioClip)` — playback began.
- `OnPlaybackFinished(AudioClip)` — playback ended normally.
- `OnFocusGained(NexusVoiceEmitter)` — this emitter gained focus.
- `OnFocusLost(NexusVoiceEmitter)` — this emitter released or lost focus.
- `OnError(string)` — the request failed with a readable message.

## Focus

A focused emitter can block a lower-priority emitter. An equal- or higher-priority
emitter can interrupt when **Interrupt Focused Emitter** is enabled. Focus is
released when the queue finishes or `Stop()` is called.
