using System.Collections.Generic;

namespace LuminaryLabs.NexusVoice
{
    internal sealed class NexusVoiceQueue
    {
        private readonly Queue<NexusVoiceRequest> requests = new Queue<NexusVoiceRequest>();

        internal int Count => requests.Count;

        internal void Enqueue(NexusVoiceRequest request)
        {
            requests.Enqueue(request);
        }

        internal bool TryDequeue(out NexusVoiceRequest request)
        {
            if (requests.Count == 0)
            {
                request = default;
                return false;
            }

            request = requests.Dequeue();
            return true;
        }

        internal void Clear()
        {
            requests.Clear();
        }
    }
}
