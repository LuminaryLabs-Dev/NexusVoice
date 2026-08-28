using System;
using UnityEngine;
using UnityEngine.Events;

namespace LuminaryLabs.NexusVoice
{
    [Serializable]
    public sealed class AudioClipEventWrapper : UnityEvent<AudioClip> { }
}
