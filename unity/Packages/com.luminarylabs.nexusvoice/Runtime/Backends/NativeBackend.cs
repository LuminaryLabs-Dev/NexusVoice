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
        private const int CancelledStatus = -7;
        private static readonly object RuntimeLock = new object();
        private static readonly object NativeCallLock = new object();
        private static IntPtr runtimeHandle;
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
                    CancellationToken.None);
            }
            catch (DllNotFoundException exception)
            {
                throw new InvalidOperationException(
                    "NexusVoice native mode is unavailable because its platform plugin "
                    + "is not installed.",
                    exception);
            }
            catch (EntryPointNotFoundException exception)
            {
                throw new InvalidOperationException(
                    "NexusVoice found an incompatible native plugin. Install the plugin "
                    + "matching this package version.",
                    exception);
            }

            cancellationToken.ThrowIfCancellationRequested();
            AudioClip clip = AudioClip.Create(
                "NexusVoice_" + speech.Voice,
                data.Samples.Length,
                1,
                data.SampleRate,
                false);
            if (!clip.SetData(data.Samples, 0))
            {
                UnityEngine.Object.Destroy(clip);
                throw new InvalidOperationException(
                    "Unity could not copy the generated NexusVoice audio samples.");
            }
            return new NexusVoiceResult(clip, speech.Voice);
        }

        internal static void Reset()
        {
            Shutdown();
        }

        internal static void Shutdown()
        {
            lock (NativeCallLock)
            {
                IntPtr handle;
                lock (RuntimeLock)
                {
                    handle = runtimeHandle;
                    runtimeHandle = IntPtr.Zero;
                    initializedModelPath = null;
                }

                if (handle == IntPtr.Zero)
                {
                    return;
                }

                try
                {
                    nexusvoice_cancel(handle);
                    nexusvoice_destroy(handle);
                }
                catch (DllNotFoundException)
                {
                    // Node Bridge mode does not install a native plugin.
                }
                catch (EntryPointNotFoundException)
                {
                    // An incompatible plugin must not break application shutdown.
                }
            }
        }

        private NativeAudioData Synthesize(
            NexusVoiceRequest speech,
            CancellationToken cancellationToken)
        {
            lock (NativeCallLock)
            {
                IntPtr handle = GetOrCreateRuntime();
                nexusvoice_reset_cancel(handle);
                using CancellationTokenRegistration registration = cancellationToken.Register(
                    state => nexusvoice_cancel((IntPtr)state),
                    handle,
                    useSynchronizationContext: false);
                cancellationToken.ThrowIfCancellationRequested();

                NativeBuffer buffer = default;
                int result = nexusvoice_synthesize(
                    handle,
                    speech.Text,
                    speech.Voice,
                    speech.Speed,
                    ref buffer);
                if (result == CancelledStatus)
                {
                    throw new OperationCanceledException(cancellationToken);
                }
                if (result != 0)
                {
                    throw new InvalidOperationException(GetNativeError(
                        handle,
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

        private IntPtr GetOrCreateRuntime()
        {
            lock (RuntimeLock)
            {
                if (runtimeHandle != IntPtr.Zero
                    && string.Equals(
                        initializedModelPath,
                        modelPath,
                        StringComparison.Ordinal))
                {
                    return runtimeHandle;
                }

                if (runtimeHandle != IntPtr.Zero)
                {
                    nexusvoice_destroy(runtimeHandle);
                    runtimeHandle = IntPtr.Zero;
                    initializedModelPath = null;
                }

                int result = nexusvoice_create(modelPath, out IntPtr created);
                if (result != 0 || created == IntPtr.Zero)
                {
                    throw new InvalidOperationException(GetNativeError(
                        IntPtr.Zero,
                        "NexusVoice native initialization failed."));
                }

                runtimeHandle = created;
                initializedModelPath = modelPath;
                return runtimeHandle;
            }
        }

        private static string GetNativeError(IntPtr handle, string fallback)
        {
            IntPtr pointer = nexusvoice_last_error(handle);
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
        private static extern int nexusvoice_create(
            [MarshalAs(UnmanagedType.LPUTF8Str)] string modelDirectory,
            out IntPtr runtime);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern int nexusvoice_synthesize(
            IntPtr runtime,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string text,
            [MarshalAs(UnmanagedType.LPUTF8Str)] string voice,
            float speed,
            ref NativeBuffer output);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern void nexusvoice_reset_cancel(IntPtr runtime);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern void nexusvoice_cancel(IntPtr runtime);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr nexusvoice_last_error(IntPtr runtime);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern void nexusvoice_free_buffer(ref NativeBuffer output);

        [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
        private static extern void nexusvoice_destroy(IntPtr runtime);
    }
}
