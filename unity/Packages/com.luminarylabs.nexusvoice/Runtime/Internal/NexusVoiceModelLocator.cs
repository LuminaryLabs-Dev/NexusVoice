using System.IO;
using UnityEngine;

namespace LuminaryLabs.NexusVoice
{
    internal static class NexusVoiceModelLocator
    {
        internal static string Resolve(string modelDirectory)
        {
            string value = string.IsNullOrWhiteSpace(modelDirectory)
                ? "NexusVoice"
                : modelDirectory.Trim();

            return Path.IsPathRooted(value)
                ? value
                : Path.Combine(Application.streamingAssetsPath, value);
        }
    }
}
