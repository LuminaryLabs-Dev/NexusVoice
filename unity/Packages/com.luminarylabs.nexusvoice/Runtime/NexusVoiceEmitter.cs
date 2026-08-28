using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;

namespace LuminaryLabs.NexusVoice
{
    public enum NexusVoiceRuntimeMode
    {
        Native,
        NodeBridge
    }

    [Serializable]
    public sealed class AudioClipEventWrapper : UnityEvent<AudioClip> { }

    [Serializable]
    public sealed class StringEventWrapper : UnityEvent<string> { }

    [Serializable]
    public sealed class NexusVoiceEmitterEventWrapper : UnityEvent<NexusVoiceEmitter> { }

    [DisallowMultipleComponent]
    [RequireComponent(typeof(AudioSource))]
    [AddComponentMenu("NexusVoice/Nexus Voice Emitter")]
    public sealed class NexusVoiceEmitter : MonoBehaviour
    {
        [Header("Output")]
        [SerializeField] private AudioSource audioSource;

        [Header("Voice")]
        [SerializeField] private string defaultVoice = "af_heart";
        [SerializeField, Range(0.5f, 1.5f)] private float defaultSpeed = 0.96f;

        [Header("Focus")]
        [SerializeField] private bool takeFocusWhenSpeaking = true;
        [SerializeField] private bool interruptFocusedEmitter = true;
        [SerializeField, Min(0f)] private float transitionDuration = 0.15f;

        [Header("Runtime")]
        [SerializeField] private NexusVoiceRuntimeMode runtimeMode = NexusVoiceRuntimeMode.NodeBridge;
        [SerializeField] private string nodeEndpoint = "http://127.0.0.1:47831/synthesize";
        [SerializeField] private string modelDirectory = "NexusVoice";

        [Header("Events")]
        public NexusVoiceEmitterEventWrapper OnFocusGained = new NexusVoiceEmitterEventWrapper();
        public NexusVoiceEmitterEventWrapper OnFocusLost = new NexusVoiceEmitterEventWrapper();
        public StringEventWrapper OnTextStarted = new StringEventWrapper();
        public AudioClipEventWrapper OnAudioClipReady = new AudioClipEventWrapper();
        public UnityEvent OnSpeechStarted = new UnityEvent();
        public UnityEvent OnSpeechFinished = new UnityEvent();
        public StringEventWrapper OnError = new StringEventWrapper();

        public static NexusVoiceEmitter Focused { get; private set; }

        public bool IsFocused => Focused == this;
        public bool IsSpeaking { get; private set; }
        public bool IsGenerating { get; private set; }
        public AudioClip CurrentClip { get; private set; }

        private readonly Queue<SpeechRequest> queue = new Queue<SpeechRequest>();
        private Coroutine queueRoutine;
        private Coroutine fadeRoutine;
        private int operationVersion;
        private float normalVolume = 1f;

        private static readonly object NativeLock = new object();
        private static bool nativeInitialized;
        private static string initializedModelPath;
        private static bool nativeShutdownRegistered;

        private bool HasPendingSpeech => IsSpeaking || IsGenerating || queue.Count > 0 || queueRoutine != null;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetStatics()
        {
            Focused = null;
            nativeInitialized = false;
            initializedModelPath = null;
            nativeShutdownRegistered = false;
        }

        private void Awake()
        {
            if (audioSource == null)
            {
                audioSource = GetComponent<AudioSource>();
            }

            normalVolume = audioSource.volume;

            if (!nativeShutdownRegistered)
            {
                Application.quitting += ShutdownNative;
                nativeShutdownRegistered = true;
            }
        }

        private void OnDisable()
        {
            Stop();
        }

        public void Speak(string text)
        {
            Speak(text, defaultVoice, defaultSpeed);
        }

        public void Speak(string text, string voice, float speed = 1f)
        {
            ClearQueue();
            if (IsSpeaking || IsGenerating)
            {
                StopCurrentSpeech(false);
            }

            Enqueue(text, voice, speed);
        }

        public void Queue(string text)
        {
            Queue(text, defaultVoice, defaultSpeed);
        }

        public void Queue(string text, string voice, float speed = 1f)
        {
            Enqueue(text, voice, speed);
        }

        public async Task<AudioClip> GenerateAsync(string text, string voice = null, float speed = 1f)
        {
            ValidateRequest(text, ref voice, ref speed);
            return runtimeMode == NexusVoiceRuntimeMode.Native
                ? await GenerateNativeAsync(text, voice, speed)
                : await GenerateBridgeAsync(text, voice, speed);
        }

        public void Focus()
        {
            if (Focused == this)
            {
                return;
            }

            NexusVoiceEmitter previous = Focused;
            Focused = this;

            if (previous != null)
            {
                previous.LoseFocus(interruptFocusedEmitter);
            }

            OnFocusGained.Invoke(this);
        }

        public void ReleaseFocus()
        {
            if (Focused != this)
            {
                return;
            }

            Focused = null;
            OnFocusLost.Invoke(this);
        }

        public void Skip()
        {
            StopCurrentSpeech(false);
            StartQueueIfNeeded();
        }

        public void Stop()
        {
            ClearQueue();
            StopCurrentSpeech(true);
        }

        public void ClearQueue()
        {
            queue.Clear();
        }

        private void Enqueue(string text, string voice, float speed)
        {
            try
            {
                ValidateRequest(text, ref voice, ref speed);
                queue.Enqueue(new SpeechRequest(text.Trim(), voice, speed));
                StartQueueIfNeeded();
            }
            catch (Exception exception)
            {
                ReportError(exception);
            }
        }

        private void StartQueueIfNeeded()
        {
            if (isActiveAndEnabled && queueRoutine == null && queue.Count > 0)
            {
                queueRoutine = StartCoroutine(ProcessQueue());
            }
        }

        private IEnumerator ProcessQueue()
        {
            while (queue.Count > 0)
            {
                SpeechRequest request = queue.Dequeue();
                int version = ++operationVersion;
                IsGenerating = true;
                OnTextStarted.Invoke(request.Text);

                Task<AudioClip> generation = GenerateAsync(request.Text, request.Voice, request.Speed);
                yield return WaitForTask(generation);

                IsGenerating = false;
                if (version != operationVersion)
                {
                    continue;
                }

                if (generation.IsFaulted)
                {
                    ReportError(generation.Exception?.GetBaseException() ?? new Exception("Voice generation failed."));
                    continue;
                }

                if (generation.IsCanceled)
                {
                    continue;
                }

                CurrentClip = generation.Result;
                OnAudioClipReady.Invoke(CurrentClip);

                if (takeFocusWhenSpeaking)
                {
                    while (!interruptFocusedEmitter
                           && Focused != null
                           && Focused != this
                           && Focused.HasPendingSpeech
                           && version == operationVersion)
                    {
                        yield return null;
                    }

                    if (version != operationVersion)
                    {
                        continue;
                    }

                    Focus();
                }

                yield return PlayCurrentClip(version);
            }

            queueRoutine = null;
        }

        private IEnumerator PlayCurrentClip(int version)
        {
            if (CurrentClip == null)
            {
                yield break;
            }

            IsSpeaking = true;
            audioSource.clip = CurrentClip;
            audioSource.volume = transitionDuration > 0f ? 0f : normalVolume;
            audioSource.Play();
            OnSpeechStarted.Invoke();

            StartFade(normalVolume, transitionDuration, false);

            while (version == operationVersion && audioSource.isPlaying)
            {
                yield return null;
            }

            if (version == operationVersion)
            {
                IsSpeaking = false;
                OnSpeechFinished.Invoke();
            }
        }

        private void LoseFocus(bool interrupt)
        {
            OnFocusLost.Invoke(this);
            if (interrupt && (IsSpeaking || IsGenerating))
            {
                queue.Clear();
                StartFade(0f, transitionDuration, true);
            }
        }

        private void StopCurrentSpeech(bool releaseFocus)
        {
            operationVersion++;
            IsGenerating = false;
            IsSpeaking = false;

            if (queueRoutine != null)
            {
                StopCoroutine(queueRoutine);
                queueRoutine = null;
            }

            if (fadeRoutine != null)
            {
                StopCoroutine(fadeRoutine);
                fadeRoutine = null;
            }

            audioSource.Stop();
            audioSource.clip = null;
            audioSource.volume = normalVolume;
            CurrentClip = null;

            if (releaseFocus)
            {
                ReleaseFocus();
            }
        }

        private void StartFade(float target, float duration, bool stopAfterFade)
        {
            if (fadeRoutine != null)
            {
                StopCoroutine(fadeRoutine);
            }

            fadeRoutine = StartCoroutine(FadeVolume(target, duration, stopAfterFade));
        }

        private IEnumerator FadeVolume(float target, float duration, bool stopAfterFade)
        {
            float start = audioSource.volume;
            if (duration <= 0f)
            {
                audioSource.volume = target;
            }
            else
            {
                float elapsed = 0f;
                while (elapsed < duration)
                {
                    elapsed += Time.unscaledDeltaTime;
                    audioSource.volume = Mathf.Lerp(start, target, Mathf.Clamp01(elapsed / duration));
                    yield return null;
                }

                audioSource.volume = target;
            }

            if (stopAfterFade)
            {
                audioSource.Stop();
                IsSpeaking = false;
                operationVersion++;
            }

            fadeRoutine = null;
        }

        private async Task<AudioClip> GenerateBridgeAsync(string text, string voice, float speed)
        {
            string json = JsonUtility.ToJson(new BridgeRequest(text, voice, speed));
            byte[] responseBytes;

            using (UnityWebRequest request = new UnityWebRequest(nodeEndpoint, UnityWebRequest.kHttpVerbPOST))
            {
                request.uploadHandler = new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(json));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                await SendAsync(request);

                if (request.result != UnityWebRequest.Result.Success)
                {
                    throw new InvalidOperationException("NexusVoice bridge failed: " + request.error);
                }

                responseBytes = request.downloadHandler.data;
            }

            string temporaryPath = Path.Combine(
                Application.temporaryCachePath,
                "nexusvoice-" + Guid.NewGuid().ToString("N") + ".wav");

            try
            {
                File.WriteAllBytes(temporaryPath, responseBytes);
                using (UnityWebRequest audioRequest = UnityWebRequestMultimedia.GetAudioClip(
                    new Uri(temporaryPath).AbsoluteUri,
                    AudioType.WAV))
                {
                    await SendAsync(audioRequest);
                    if (audioRequest.result != UnityWebRequest.Result.Success)
                    {
                        throw new InvalidOperationException("NexusVoice WAV load failed: " + audioRequest.error);
                    }

                    AudioClip clip = DownloadHandlerAudioClip.GetContent(audioRequest);
                    clip.name = "NexusVoice_" + voice;
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

        private async Task<AudioClip> GenerateNativeAsync(string text, string voice, float speed)
        {
            string path = ResolveModelDirectory();
            NativeAudioData data = await Task.Run(() => SynthesizeNative(path, text, voice, speed));

            AudioClip clip = AudioClip.Create(
                "NexusVoice_" + voice,
                data.Samples.Length,
                1,
                data.SampleRate,
                false);
            clip.SetData(data.Samples, 0);
            return clip;
        }

        private static NativeAudioData SynthesizeNative(string path, string text, string voice, float speed)
        {
            lock (NativeLock)
            {
                if (!nativeInitialized || !string.Equals(initializedModelPath, path, StringComparison.Ordinal))
                {
                    int initializeResult = Native.nexusvoice_initialize(path);
                    if (initializeResult != 0)
                    {
                        throw new InvalidOperationException(GetNativeError("Native initialization failed."));
                    }

                    nativeInitialized = true;
                    initializedModelPath = path;
                }

                NativeBuffer buffer = default;
                int result = Native.nexusvoice_synthesize(text, voice, speed, ref buffer);
                if (result != 0)
                {
                    throw new InvalidOperationException(GetNativeError("Native synthesis failed."));
                }

                try
                {
                    if (buffer.Samples == IntPtr.Zero || buffer.SampleCount <= 0)
                    {
                        throw new InvalidOperationException("Native synthesis returned an empty audio buffer.");
                    }

                    float[] samples = new float[buffer.SampleCount];
                    Marshal.Copy(buffer.Samples, samples, 0, buffer.SampleCount);
                    return new NativeAudioData(samples, buffer.SampleRate);
                }
                finally
                {
                    Native.nexusvoice_free_buffer(ref buffer);
                }
            }
        }

        private string ResolveModelDirectory()
        {
            return Path.IsPathRooted(modelDirectory)
                ? modelDirectory
                : Path.Combine(Application.streamingAssetsPath, modelDirectory);
        }

        private static string GetNativeError(string fallback)
        {
            IntPtr pointer = Native.nexusvoice_last_error();
            return pointer == IntPtr.Zero ? fallback : Marshal.PtrToStringAnsi(pointer) ?? fallback;
        }

        private static void ShutdownNative()
        {
            lock (NativeLock)
            {
                if (!nativeInitialized)
                {
                    return;
                }

                try
                {
                    Native.nexusvoice_shutdown();
                }
                catch (DllNotFoundException)
                {
                    // Native mode was never available in this build.
                }

                nativeInitialized = false;
                initializedModelPath = null;
            }
        }

        private static Task SendAsync(UnityWebRequest request)
        {
            UnityWebRequestAsyncOperation operation = request.SendWebRequest();
            if (operation.isDone)
            {
                return Task.CompletedTask;
            }

            TaskCompletionSource<bool> completion = new TaskCompletionSource<bool>();
            operation.completed += _ => completion.TrySetResult(true);
            return completion.Task;
        }

        private static IEnumerator WaitForTask(Task task)
        {
            while (!task.IsCompleted)
            {
                yield return null;
            }
        }

        private void ReportError(Exception exception)
        {
            Debug.LogError("NexusVoice: " + exception.Message, this);
            OnError.Invoke(exception.Message);
        }

        private void ValidateRequest(string text, ref string voice, ref float speed)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                throw new ArgumentException("Speech text cannot be empty.", nameof(text));
            }

            voice = string.IsNullOrWhiteSpace(voice) ? defaultVoice : voice.Trim();
            speed = Mathf.Clamp(speed, 0.5f, 1.5f);
        }

        [Serializable]
        private sealed class BridgeRequest
        {
            public string text;
            public string voice;
            public float speed;

            public BridgeRequest(string text, string voice, float speed)
            {
                this.text = text;
                this.voice = voice;
                this.speed = speed;
            }
        }

        private readonly struct SpeechRequest
        {
            public readonly string Text;
            public readonly string Voice;
            public readonly float Speed;

            public SpeechRequest(string text, string voice, float speed)
            {
                Text = text;
                Voice = voice;
                Speed = speed;
            }
        }

        private readonly struct NativeAudioData
        {
            public readonly float[] Samples;
            public readonly int SampleRate;

            public NativeAudioData(float[] samples, int sampleRate)
            {
                Samples = samples;
                SampleRate = sampleRate;
            }
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct NativeBuffer
        {
            public IntPtr Samples;
            public int SampleCount;
            public int SampleRate;
        }

        private static class Native
        {
            private const string Library = "nexusvoice";

            [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
            public static extern int nexusvoice_initialize(string modelDirectory);

            [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
            public static extern int nexusvoice_synthesize(
                string text,
                string voice,
                float speed,
                ref NativeBuffer output);

            [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
            public static extern IntPtr nexusvoice_last_error();

            [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
            public static extern void nexusvoice_free_buffer(ref NativeBuffer output);

            [DllImport(Library, CallingConvention = CallingConvention.Cdecl)]
            public static extern void nexusvoice_shutdown();
        }
    }
}
