using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace LuminaryLabs.NexusVoice
{
    internal static class NexusVoiceAudioConverter
    {
        internal static async Task<AudioClip> LoadWavAsync(
            byte[] wavBytes,
            string clipName,
            CancellationToken cancellationToken)
        {
            ValidateWav(wavBytes);
            cancellationToken.ThrowIfCancellationRequested();

            string temporaryPath = Path.Combine(
                Application.temporaryCachePath,
                "nexusvoice-" + Guid.NewGuid().ToString("N") + ".wav");

            try
            {
                File.WriteAllBytes(temporaryPath, wavBytes);
                using (UnityWebRequest request = UnityWebRequestMultimedia.GetAudioClip(
                    new Uri(temporaryPath).AbsoluteUri,
                    AudioType.WAV))
                {
                    await SendAsync(request, cancellationToken);
                    cancellationToken.ThrowIfCancellationRequested();

                    if (request.result != UnityWebRequest.Result.Success)
                    {
                        throw new InvalidOperationException(
                            "NexusVoice could not load the generated WAV: " + request.error);
                    }

                    AudioClip clip = DownloadHandlerAudioClip.GetContent(request);
                    if (clip == null || clip.samples <= 0)
                    {
                        throw new InvalidOperationException(
                            "NexusVoice received a WAV response without playable audio.");
                    }

                    clip.name = clipName;
                    return clip;
                }
            }
            finally
            {
                if (File.Exists(temporaryPath))
                {
                    File.Delete(temporaryPath);
                }
            }
        }

        internal static Task SendAsync(
            UnityWebRequest request,
            CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();
            UnityWebRequestAsyncOperation operation = request.SendWebRequest();
            if (operation.isDone)
            {
                return Task.CompletedTask;
            }

            TaskCompletionSource<bool> completion = new TaskCompletionSource<bool>();
            CancellationTokenRegistration registration = cancellationToken.Register(() =>
            {
                request.Abort();
                completion.TrySetCanceled();
            });

            operation.completed += _ =>
            {
                registration.Dispose();
                completion.TrySetResult(true);
            };

            return completion.Task;
        }

        private static void ValidateWav(byte[] bytes)
        {
            if (bytes == null || bytes.Length < 44)
            {
                throw new InvalidOperationException(
                    "NexusVoice bridge returned an empty or incomplete WAV response.");
            }

            bool hasRiff = bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F';
            bool hasWave = bytes[8] == 'W' && bytes[9] == 'A' && bytes[10] == 'V' && bytes[11] == 'E';
            if (!hasRiff || !hasWave)
            {
                throw new InvalidOperationException(
                    "NexusVoice bridge returned data that is not a RIFF/WAVE audio file.");
            }
        }
    }
}
