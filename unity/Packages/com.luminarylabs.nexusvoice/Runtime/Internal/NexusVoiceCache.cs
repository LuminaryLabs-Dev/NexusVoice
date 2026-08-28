using System.Collections.Generic;
using System.Globalization;

namespace LuminaryLabs.NexusVoice
{
    internal sealed class NexusVoiceCache
    {
        private readonly Dictionary<string, NexusVoiceResult> entries =
            new Dictionary<string, NexusVoiceResult>();
        private readonly Queue<string> insertionOrder = new Queue<string>();

        internal bool TryGet(string backend, NexusVoiceRequest request, out NexusVoiceResult result)
        {
            string key = CreateKey(backend, request);
            if (entries.TryGetValue(key, out NexusVoiceResult cached) && cached.Clip != null)
            {
                result = cached.AsCached();
                return true;
            }

            entries.Remove(key);
            result = null;
            return false;
        }

        internal void Store(string backend, NexusVoiceRequest request, NexusVoiceResult result, int capacity)
        {
            if (result == null || result.Clip == null || capacity <= 0)
            {
                return;
            }

            string key = CreateKey(backend, request);
            if (entries.ContainsKey(key))
            {
                entries[key] = result;
                return;
            }

            entries.Add(key, result);
            insertionOrder.Enqueue(key);
            while (entries.Count > capacity && insertionOrder.Count > 0)
            {
                entries.Remove(insertionOrder.Dequeue());
            }
        }

        internal void Clear()
        {
            entries.Clear();
            insertionOrder.Clear();
        }

        private static string CreateKey(string backend, NexusVoiceRequest request)
        {
            return string.Concat(
                backend,
                "\n",
                request.Voice,
                "\n",
                request.Speed.ToString("R", CultureInfo.InvariantCulture),
                "\n",
                request.Text);
        }
    }
}
