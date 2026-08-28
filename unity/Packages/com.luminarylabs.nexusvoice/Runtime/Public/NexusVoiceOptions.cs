using System;
using UnityEngine;

namespace LuminaryLabs.NexusVoice
{
    [Serializable]
    public sealed class NexusVoiceOptions
    {
        public const float MinimumSpeed = 0.5f;
        public const float MaximumSpeed = 1.5f;

        [SerializeField] private string voice = "af_heart";
        [SerializeField, Range(MinimumSpeed, MaximumSpeed)] private float speed = 1f;

        public string Voice
        {
            get => voice;
            set => voice = value;
        }

        public float Speed
        {
            get => speed;
            set => speed = Mathf.Clamp(value, MinimumSpeed, MaximumSpeed);
        }

        public NexusVoiceOptions() { }

        public NexusVoiceOptions(string voice, float speed = 1f)
        {
            Voice = voice;
            Speed = speed;
        }
    }
}
