# Quick start

Add one `NexusVoiceEmitter` and call:

```csharp
using LuminaryLabs.NexusVoice;
using UnityEngine;

public sealed class Greeter : MonoBehaviour
{
    [SerializeField] private NexusVoiceEmitter emitter;

    public void Greet()
    {
        emitter.Speak("Welcome to the village.");
    }
}
```

Queue another line:

```csharp
emitter.Queue("The blacksmith is around the corner.");
```

Generate without automatic playback:

```csharp
AudioClip clip = await emitter.GenerateAsync("Inventory updated.");
```

Import **Basic Emitter Demo** from Package Manager for a working sample scene.
