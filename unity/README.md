# NexusVoice Unity demo project

Open this folder in Unity 6.

The embedded `0.0.1-preview.1` package supports Unity 2022.3 or newer and exposes
one component: `NexusVoiceEmitter`. The validated workflow uses Node Bridge mode:

```bash
cd ../node
npm run serve
```

Add `NexusVoiceEmitter` to any GameObject with an `AudioSource`, then call:

```csharp
emitter.Speak("Hello from NexusVoice.");
```

Run `npm run unity:model` from `node/` to populate ignored model and voice files under `Assets/StreamingAssets/NexusVoice`.

Native mode is visible for integration development but is not a shipping runtime in this preview.
