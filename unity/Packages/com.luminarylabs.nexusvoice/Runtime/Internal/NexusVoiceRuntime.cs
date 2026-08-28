using System;
using System.Threading;
using System.Threading.Tasks;

namespace LuminaryLabs.NexusVoice
{
    internal sealed class NexusVoiceRuntime
    {
        private readonly NexusVoiceCache cache = new NexusVoiceCache();

        internal async Task<NexusVoiceResult> GenerateAsync(
            NexusVoiceRequest request,
            NexusVoiceRuntimeMode runtimeMode,
            string nodeEndpoint,
            int timeoutSeconds,
            string modelDirectory,
            bool useCache,
            int cacheCapacity,
            CancellationToken cancellationToken)
        {
            INexusVoiceBackend backend = CreateBackend(
                runtimeMode,
                nodeEndpoint,
                timeoutSeconds,
                modelDirectory);

            if (useCache && cache.TryGet(backend.CacheNamespace, request, out NexusVoiceResult cached))
            {
                return cached;
            }

            NexusVoiceResult result = await backend.GenerateAsync(request, cancellationToken);
            if (result == null || result.Clip == null)
            {
                throw new InvalidOperationException(
                    "NexusVoice generation completed without an AudioClip.");
            }

            if (useCache)
            {
                cache.Store(backend.CacheNamespace, request, result, cacheCapacity);
            }

            return result;
        }

        internal void ClearCache()
        {
            cache.Clear();
        }

        private static INexusVoiceBackend CreateBackend(
            NexusVoiceRuntimeMode runtimeMode,
            string nodeEndpoint,
            int timeoutSeconds,
            string modelDirectory)
        {
            return runtimeMode == NexusVoiceRuntimeMode.Native
                ? (INexusVoiceBackend)new NativeBackend(modelDirectory)
                : new NodeBridgeBackend(nodeEndpoint, timeoutSeconds);
        }
    }
}
