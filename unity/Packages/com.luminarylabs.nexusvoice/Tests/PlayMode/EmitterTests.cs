using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace LuminaryLabs.NexusVoice.Tests
{
    public sealed class EmitterTests
    {
        [UnityTest]
        public IEnumerator EmitterStartsInNativePreviewState()
        {
            GameObject gameObject = new GameObject("NexusVoice Test");
            NexusVoiceEmitter emitter = gameObject.AddComponent<NexusVoiceEmitter>();

            yield return null;

            Assert.That(emitter.RuntimeMode, Is.EqualTo(NexusVoiceRuntimeMode.Native));
            Assert.That(emitter.IsGenerating, Is.False);
            Assert.That(emitter.IsSpeaking, Is.False);

            emitter.Stop();
            Object.Destroy(gameObject);
            yield return null;
        }
    }
}
