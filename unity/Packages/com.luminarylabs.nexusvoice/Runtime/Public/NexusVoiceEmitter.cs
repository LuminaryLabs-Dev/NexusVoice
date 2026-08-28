using System;
using System.Collections;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;

namespace LuminaryLabs.NexusVoice
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(AudioSource))]
    [AddComponentMenu("NexusVoice/Nexus Voice Emitter")]
    public sealed class NexusVoiceEmitter : MonoBehaviour
    {
        [Header("Output")]
        [SerializeField] private AudioSource audioSource;
        [SerializeField] private bool autoPlay = true;

        [Header("Voice")]
        [SerializeField] private string defaultVoice = "af_heart";
        [SerializeField, Range(NexusVoiceOptions.MinimumSpeed, NexusVoiceOptions.MaximumSpeed)]
        private float defaultSpeed = 0.96f;

        [Header("Focus")]
        [SerializeField] private bool takeFocusWhenSpeaking = true;
        [SerializeField] private bool interruptFocusedEmitter = true;
        [SerializeField] private int focusPriority;
        [SerializeField, Min(0f)] private float transitionDuration = 0.15f;

        [Header("Cache")]
        [SerializeField] private bool cacheEnabled = true;
        [SerializeField, Min(1)] private int cacheCapacity = 32;

        [Header("Runtime")]
        [SerializeField] private NexusVoiceRuntimeMode runtimeMode = NexusVoiceRuntimeMode.Native;
        [SerializeField] private string nodeEndpoint = "http://127.0.0.1:47831/synthesize";
        [SerializeField, Min(1)] private int requestTimeoutSeconds = 120;
        [SerializeField] private string modelDirectory = "NexusVoice/Model";

        [Header("Events")]
        public AudioClipEventWrapper OnClipReady = new AudioClipEventWrapper();
        public AudioClipEventWrapper OnPlaybackStarted = new AudioClipEventWrapper();
        public AudioClipEventWrapper OnPlaybackFinished = new AudioClipEventWrapper();
        public NexusVoiceEmitterEventWrapper OnFocusGained = new NexusVoiceEmitterEventWrapper();
        public NexusVoiceEmitterEventWrapper OnFocusLost = new NexusVoiceEmitterEventWrapper();
        public StringEventWrapper OnError = new StringEventWrapper();

        private readonly NexusVoiceQueue speechQueue = new NexusVoiceQueue();
        private readonly NexusVoiceRuntime runtime = new NexusVoiceRuntime();

        private Coroutine queueRoutine;
        private Coroutine fadeRoutine;
        private CancellationTokenSource generationCancellation;
        private int operationVersion;
        private float normalVolume = 1f;

        public static NexusVoiceEmitter Focused => NexusVoiceFocus.Focused;

        public bool IsFocused => Focused == this;
        public bool IsSpeaking { get; private set; }
        public bool IsGenerating { get; private set; }
        public AudioClip CurrentClip { get; private set; }
        public NexusVoiceRuntimeMode RuntimeMode
        {
            get => runtimeMode;
            set => runtimeMode = value;
        }

        public int FocusPriority => focusPriority;

        internal bool HasPendingSpeech =>
            IsSpeaking || IsGenerating || speechQueue.Count > 0 || queueRoutine != null;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetStatics()
        {
            NexusVoiceFocus.Reset();
            NativeBackend.Reset();
            Application.quitting -= NativeBackend.Shutdown;
            Application.quitting += NativeBackend.Shutdown;
        }

        private void Awake()
        {
            if (audioSource == null)
            {
                audioSource = GetComponent<AudioSource>();
            }

            normalVolume = audioSource.volume;
        }

        private void OnValidate()
        {
            defaultSpeed = Mathf.Clamp(
                defaultSpeed,
                NexusVoiceOptions.MinimumSpeed,
                NexusVoiceOptions.MaximumSpeed);
            requestTimeoutSeconds = Mathf.Max(1, requestTimeoutSeconds);
            cacheCapacity = Mathf.Max(1, cacheCapacity);
            transitionDuration = Mathf.Max(0f, transitionDuration);
        }

        private void OnDisable()
        {
            Stop();
        }

        private void OnDestroy()
        {
            Stop();
            runtime.ClearCache();
        }

        public void Speak(string text)
        {
            Speak(text, defaultVoice, defaultSpeed);
        }

        public void Speak(string text, string voice, float speed = 1f)
        {
            ClearQueue();
            StopCurrentSpeech(false);
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

        public Task<AudioClip> GenerateAsync(string text)
        {
            return GenerateAsync(
                text,
                new NexusVoiceOptions(defaultVoice, defaultSpeed),
                CancellationToken.None);
        }

        public Task<AudioClip> GenerateAsync(string text, string voice, float speed = 1f)
        {
            return GenerateAsync(
                text,
                new NexusVoiceOptions(voice, speed),
                CancellationToken.None);
        }

        public async Task<AudioClip> GenerateAsync(
            string text,
            NexusVoiceOptions options,
            CancellationToken cancellationToken = default)
        {
            NexusVoiceRequest request = CreateRequest(
                text,
                options?.Voice,
                options?.Speed ?? defaultSpeed);

            NexusVoiceResult result = await runtime.GenerateAsync(
                request,
                runtimeMode,
                nodeEndpoint,
                requestTimeoutSeconds,
                modelDirectory,
                cacheEnabled,
                cacheCapacity,
                cancellationToken);

            return result.Clip;
        }

        public void Focus()
        {
            NexusVoiceFocus.TryAcquire(this, interruptFocusedEmitter);
        }

        public void ReleaseFocus()
        {
            NexusVoiceFocus.Release(this);
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
            speechQueue.Clear();
        }

        public void ClearCache()
        {
            runtime.ClearCache();
        }

        internal void HandleFocusGained()
        {
            OnFocusGained.Invoke(this);
        }

        internal void HandleFocusLost(bool interrupt)
        {
            OnFocusLost.Invoke(this);
            if (!interrupt || (!IsSpeaking && !IsGenerating))
            {
                return;
            }

            speechQueue.Clear();
            operationVersion++;
            CancelGeneration();

            if (queueRoutine != null)
            {
                StopCoroutine(queueRoutine);
                queueRoutine = null;
            }

            IsGenerating = false;
            if (IsSpeaking && audioSource != null && audioSource.isPlaying && transitionDuration > 0f)
            {
                StartFade(0f, transitionDuration, true);
            }
            else
            {
                ResetAudioState();
            }
        }

        private void Enqueue(string text, string voice, float speed)
        {
            try
            {
                speechQueue.Enqueue(CreateRequest(text, voice, speed));
                StartQueueIfNeeded();
            }
            catch (Exception exception)
            {
                ReportError(exception);
            }
        }

        private NexusVoiceRequest CreateRequest(string text, string voice, float speed)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                throw new ArgumentException("Speech text cannot be empty.", nameof(text));
            }

            string resolvedVoice = string.IsNullOrWhiteSpace(voice)
                ? defaultVoice
                : voice.Trim();
            if (string.IsNullOrWhiteSpace(resolvedVoice))
            {
                throw new ArgumentException("A NexusVoice voice id is required.", nameof(voice));
            }

            float resolvedSpeed = Mathf.Clamp(
                speed,
                NexusVoiceOptions.MinimumSpeed,
                NexusVoiceOptions.MaximumSpeed);
            return new NexusVoiceRequest(text.Trim(), resolvedVoice, resolvedSpeed);
        }

        private void StartQueueIfNeeded()
        {
            if (isActiveAndEnabled && queueRoutine == null && speechQueue.Count > 0)
            {
                queueRoutine = StartCoroutine(ProcessQueue());
            }
        }

        private IEnumerator ProcessQueue()
        {
            while (speechQueue.TryDequeue(out NexusVoiceRequest request))
            {
                int version = ++operationVersion;
                IsGenerating = true;
                generationCancellation = new CancellationTokenSource();

                Task<AudioClip> generation = GenerateAsync(
                    request.Text,
                    new NexusVoiceOptions(request.Voice, request.Speed),
                    generationCancellation.Token);
                yield return WaitForTask(generation);

                DisposeGenerationCancellation();
                IsGenerating = false;
                if (version != operationVersion || generation.IsCanceled)
                {
                    continue;
                }

                if (generation.IsFaulted)
                {
                    ReportError(generation.Exception?.GetBaseException()
                        ?? new InvalidOperationException("NexusVoice generation failed."));
                    continue;
                }

                CurrentClip = generation.Result;
                OnClipReady.Invoke(CurrentClip);
                if (!autoPlay)
                {
                    continue;
                }

                if (takeFocusWhenSpeaking)
                {
                    while (version == operationVersion
                           && !NexusVoiceFocus.TryAcquire(this, interruptFocusedEmitter))
                    {
                        yield return null;
                    }

                    if (version != operationVersion)
                    {
                        continue;
                    }
                }

                yield return PlayCurrentClip(version);
            }

            queueRoutine = null;
            if (IsFocused)
            {
                ReleaseFocus();
            }
        }

        private IEnumerator PlayCurrentClip(int version)
        {
            if (CurrentClip == null || audioSource == null)
            {
                yield break;
            }

            AudioClip playingClip = CurrentClip;
            IsSpeaking = true;
            audioSource.clip = playingClip;
            audioSource.volume = transitionDuration > 0f ? 0f : normalVolume;
            audioSource.Play();
            OnPlaybackStarted.Invoke(playingClip);
            StartFade(normalVolume, transitionDuration, false);

            while (version == operationVersion && audioSource.isPlaying)
            {
                yield return null;
            }

            if (version == operationVersion)
            {
                IsSpeaking = false;
                OnPlaybackFinished.Invoke(playingClip);
            }
        }

        private void StopCurrentSpeech(bool releaseFocus)
        {
            operationVersion++;
            CancelGeneration();

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

            ResetAudioState();
            if (releaseFocus)
            {
                ReleaseFocus();
            }
        }

        private void ResetAudioState()
        {
            IsGenerating = false;
            IsSpeaking = false;
            if (audioSource != null)
            {
                audioSource.Stop();
                audioSource.clip = null;
                audioSource.volume = normalVolume;
            }

            CurrentClip = null;
        }

        private void StartFade(float target, float duration, bool stopAfterFade)
        {
            if (audioSource == null)
            {
                return;
            }

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
                    audioSource.volume = Mathf.Lerp(
                        start,
                        target,
                        Mathf.Clamp01(elapsed / duration));
                    yield return null;
                }

                audioSource.volume = target;
            }

            fadeRoutine = null;
            if (stopAfterFade)
            {
                ResetAudioState();
            }
        }

        private void CancelGeneration()
        {
            if (generationCancellation == null)
            {
                return;
            }

            generationCancellation.Cancel();
            DisposeGenerationCancellation();
        }

        private void DisposeGenerationCancellation()
        {
            generationCancellation?.Dispose();
            generationCancellation = null;
        }

        private void ReportError(Exception exception)
        {
            string message = exception?.Message ?? "Unknown NexusVoice error.";
            Debug.LogError("NexusVoice: " + message, this);
            OnError.Invoke(message);
        }

        private static IEnumerator WaitForTask(Task task)
        {
            while (!task.IsCompleted)
            {
                yield return null;
            }
        }
    }
}
