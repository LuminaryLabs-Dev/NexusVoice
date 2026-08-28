namespace LuminaryLabs.NexusVoice
{
    internal readonly struct NexusVoiceRequest
    {
        internal string Text { get; }
        internal string Voice { get; }
        internal float Speed { get; }

        internal NexusVoiceRequest(string text, string voice, float speed)
        {
            Text = text;
            Voice = voice;
            Speed = speed;
        }
    }
}
