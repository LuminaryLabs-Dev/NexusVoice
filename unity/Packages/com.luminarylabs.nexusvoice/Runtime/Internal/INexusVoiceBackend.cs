using System.Threading;
using System.Threading.Tasks;

namespace LuminaryLabs.NexusVoice
{
    internal interface INexusVoiceBackend
    {
        string CacheNamespace { get; }

        Task<NexusVoiceResult> GenerateAsync(
            NexusVoiceRequest request,
            CancellationToken cancellationToken);
    }
}
