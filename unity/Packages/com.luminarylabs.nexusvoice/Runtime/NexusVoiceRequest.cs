using System;

namespace LuminaryLabs.NexusVoice
{
    [Serializable]
    public sealed class NexusVoiceRequest
    {
        public string text;
        public string voice = "af_heart";
        public float speed = 0.96f;
    }
}
