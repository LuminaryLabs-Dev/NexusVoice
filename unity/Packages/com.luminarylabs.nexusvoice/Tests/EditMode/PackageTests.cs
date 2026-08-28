using System;
using System.Linq;
using NUnit.Framework;
using UnityEngine;

namespace LuminaryLabs.NexusVoice.Tests
{
    public sealed class PackageTests
    {
        [Test]
        public void OptionsClampSpeedToSupportedRange()
        {
            NexusVoiceOptions options = new NexusVoiceOptions("af_heart", 4f);
            Assert.That(options.Speed, Is.EqualTo(NexusVoiceOptions.MaximumSpeed));

            options.Speed = 0f;
            Assert.That(options.Speed, Is.EqualTo(NexusVoiceOptions.MinimumSpeed));
        }

        [Test]
        public void RuntimeAssemblyExposesOneMonoBehaviour()
        {
            Type[] components = typeof(NexusVoiceEmitter).Assembly
                .GetTypes()
                .Where(type => typeof(MonoBehaviour).IsAssignableFrom(type) && !type.IsAbstract)
                .ToArray();

            Assert.That(components, Is.EqualTo(new[] { typeof(NexusVoiceEmitter) }));
        }
    }
}
