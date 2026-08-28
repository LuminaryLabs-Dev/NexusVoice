# NexusVoice Unity demo project

Open this folder in Unity 6. The embedded package supports Unity 2022.3 or newer
and exposes one component: `NexusVoiceEmitter`.

Prepare the validated Linux x64 native runtime:

```bash
cd ../node
npm ci --onnxruntime-node-install-cuda=skip
npm run model:download
npm run native:all
```

Add `NexusVoiceEmitter` to a GameObject with an `AudioSource`, then call:

```csharp
emitter.Speak("Hello from NexusVoice.");
```

Native mode is the default in `0.1.0-preview.1`. Node Bridge mode remains
available for reference testing with `npm run serve`.
