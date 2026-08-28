using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

namespace LuminaryLabs.NexusVoice
{
    internal sealed class NativeBackend : INexusVoiceBackend
    {
        private const string Library = "nexusvoice";
        private static readonly object NativeLock = new object();
        private static bool initialized;
        private static string initializedModelPath;

        private readonly string modelPath;

        public string CacheNamespace => "native:" + modelPath;

        internal NativeBackend(string modelDirectory)
        {
            modelPath = NexusVoiceModelLocator.Resolve(modelDirectory);
        }

        public async Task<NexusVoiceResult> GenerateAsync(
            NexusVoiceRequest speech,
            CancellationToken cancellationToken)
        {
            NativeAudioData data;
            try
            {
                data = await Task.Run(
                    () => Synthesize(speech, cancellationToken),
                    cancellationToken);
            }
            catch (DllNotFoundException exception)
            {
                throw new InvalidOperationException(
                    "NexusVoice native mode is unavailable because the platform plugin is not installed. "
                    + "Use Node Bridge mode in 0.0.1-preview.1.",
                    exception);
            }
            catch (EntryPointNotFoundException exception)
            {
                throw new InvalidOperationException(
                    "NexusVoice found an incompatible native plugin. "
                    + "Use the plugin matching this package version.",
                    exception);
            }

            cancellationToken.ThrowIfCancellationRequested();
            AudioClip clip = AudioClip.Create(
                "NexusVoice_" + speech.Voice,
                data.Samples.Length,
                1,
                data.SampleRate,
                false);
            clip.SetData(data.Samples, 0);
            return new NexusVoiceResult(clip, speech.Voice);
        }

        internal static void Reset()
        {
            lock (NativeLock)
            {
                initialized = false;
                initializedModelPath = null;
            }
        }

        internal static void Shutdown()
        {
            lock (NativeLock)
            {
                if (!initialized)
                {
                    return;
                }

                try
                {
                    nexusvoice_shutdown();
                }
                catch (DllNotFoundException)
                {
                    // The preview can run entirely through the Node bridge.
                }
                catch (EntryPointNotFoundException)
                {
                    // An incompatible plugin must not break application shutdown.
                }

                initialized = false;
                initializedModelPath = null;
            }
        }

        private NativeAudioData Synthesize(
            NexusVoiceRequest speech,
            CancellationToken cancellationToken)
        {
            lock (NativeLock)
            {
                cancellationToken.ThrowIfCancellationRequested();
                if (!initialized
                    || !string.Equals(initializedModelPath, modelPath, StringComparison.Ordinal))
                {
                    int initializeResult = nexusvoice_initialize(modelPath);
                    if (initializeResult != 0)
                    {
                        throw new InvalidOperationException(GetNativeError(
                            "NexusVoice native initialization failed."));
                    }

                    initialized = true;
                    initializedModelPath = modelPath;
                }

                NativeBuffer buffer = default;
                int result = nexusvoice_synthesize(
                    speech.Text,
                    speech.Voice,
                    speech.Speed,
                    ref buffer);
                if (result != 0)
                {
                    throw new InvalidOperationException(GetNativeError(
                        "NexusVoice native synthesis failed."));
                }

                try
                {
                    if (buffer.Samples == IntPtr.Zero
                        || buffer.SampleCount <= 0
                        || buffer.SampleRate <= 0)
                    {
                        throw new InvalidOperationException(
                            "NexusVoice native synthesis returned an empty audio buffer.");
                    }

                    float[] samples = new float[buffer.SampleCount];
                    Marshal.Copy(buffer.Samples, samples, 0, buffer.SampleCount);
                    return new NativeAudioData(samples, buffer.SampleRate);
                }
                finally
                {
                    nexusvoice_free_buffer(ref buffer);
                }
            }
        }

        private static string GetNativeError(string fallback)
        {
            IntPtr pointer = nexusvoice_last_error();
            return pointer == IntPtr.Zero
                ? fallback
                : Marshal.PtrToStringAnsi(pointer) ?? fallback;
        }

        private readonly struct NativeAudioData
        {
            internal float[] Samples { get; }
            internal int SampleRate { get; }

            internal NativeAudioData(float[] samples, int sampleRate)
            {
                Samples = samples;
                SampleRate = sampleRate;
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct NativeBuffer
        {
            internal IntPtr Samples;
            internal int SampleCount;
            internal int SampleRate;
        }

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern int nexusvoice_initialize(string modelDirectory);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern int nexusvoice_synthesize(
            string text,
            string voice,
            float speed,
            ref NativeBuffer output);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr nexusvoice_last_error();

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern void nexusvoice_free_buffer(ref NativeBuffer output);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern void nexusvoice_shutdown();
    }
}
