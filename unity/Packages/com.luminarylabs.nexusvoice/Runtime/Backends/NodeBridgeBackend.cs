using System;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace LuminaryLabs.NexusVoice
{
    internal sealed class NodeBridgeBackend : INexusVoiceBackend
    {
        private readonly string endpoint;
        private readonly int timeoutSeconds;

        public string CacheNamespace => "node:" + endpoint;

        internal NodeBridgeBackend(string endpoint, int timeoutSeconds)
        {
            if (!Uri.TryCreate(endpoint, UriKind.Absolute, out Uri uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                throw new ArgumentException(
                    "NexusVoice Node endpoint must be an absolute HTTP or HTTPS URL.",
                    nameof(endpoint));
            }

            this.endpoint = endpoint;
            this.timeoutSeconds = Math.Max(1, timeoutSeconds);
        }

        public async Task<NexusVoiceResult> GenerateAsync(
            NexusVoiceRequest speech,
            CancellationToken cancellationToken)
        {
            string json = JsonUtility.ToJson(new BridgeRequest(
                speech.Text,
                speech.Voice,
                speech.Speed));

            byte[] responseBytes;
            using (UnityWebRequest request = new UnityWebRequest(endpoint, UnityWebRequest.kHttpVerbPOST))
            {
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.timeout = timeoutSeconds;
                request.SetRequestHeader("Content-Type", "application/json");

                await NexusVoiceAudioConverter.SendAsync(request, cancellationToken);
                cancellationToken.ThrowIfCancellationRequested();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    throw new InvalidOperationException(
                        "NexusVoice could not reach the Node bridge at "
                        + endpoint
                        + ". Start it with `cd node && npm run serve`. "
                        + request.error);
                }

                responseBytes = request.downloadHandler.data;
            }

            AudioClip clip = await NexusVoiceAudioConverter.LoadWavAsync(
                responseBytes,
                "NexusVoice_" + speech.Voice,
                cancellationToken);

            return new NexusVoiceResult(clip, speech.Voice);
        }

        [Serializable]
        private sealed class BridgeRequest
        {
            public string text;
            public string voice;
            public float speed;

            internal BridgeRequest(string text, string voice, float speed)
            {
                this.text = text;
                this.voice = voice;
                this.speed = speed;
            }
        }
    }
}
