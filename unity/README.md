# NexusVoice Unity demo project

Open this folder in Unity 6.

The embedded package exposes one component: `NexusVoiceEmitter`. The current validated workflow uses Node Bridge mode:

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
