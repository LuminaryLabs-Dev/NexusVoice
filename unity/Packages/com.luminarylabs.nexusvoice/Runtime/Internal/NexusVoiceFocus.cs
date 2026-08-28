namespace LuminaryLabs.NexusVoice
{
    internal static class NexusVoiceFocus
    {
        internal static NexusVoiceEmitter Focused { get; private set; }

        internal static bool TryAcquire(NexusVoiceEmitter emitter, bool interrupt)
        {
            if (emitter == null)
            {
                return false;
            }

            if (Focused == emitter)
            {
                return true;
            }

            NexusVoiceEmitter previous = Focused;
            if (previous != null && previous.HasPendingSpeech)
            {
                if (!interrupt || emitter.FocusPriority < previous.FocusPriority)
                {
                    return false;
                }
            }

            Focused = emitter;
            previous?.HandleFocusLost(interrupt);
            emitter.HandleFocusGained();
            return true;
        }

        internal static void Release(NexusVoiceEmitter emitter)
        {
            if (Focused != emitter)
            {
                return;
            }

            Focused = null;
            emitter.HandleFocusLost(false);
        }

        internal static void Reset()
        {
            Focused = null;
        }
    }
}
