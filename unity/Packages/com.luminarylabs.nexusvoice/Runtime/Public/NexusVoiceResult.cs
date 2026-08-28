using UnityEngine;

namespace LuminaryLabs.NexusVoice
{
    public sealed class NexusVoiceResult
    {
        public AudioClip Clip { get; }
        public string Voice { get; }
        public int SampleRate { get; }
        public bool FromCache { get; }

        internal NexusVoiceResult(AudioClip clip, string voice, bool fromCache = false)
        {
            Clip = clip;
            Voice = voice;
            SampleRate = clip != null ? clip.frequency : 0;
            FromCache = fromCache;
        }

        internal NexusVoiceResult AsCached()
        {
            return new NexusVoiceResult(Clip, Voice, true);
        }
    }
}
