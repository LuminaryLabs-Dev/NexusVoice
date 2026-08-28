using System.IO;
using UnityEditor;
using UnityEngine;

namespace LuminaryLabs.NexusVoice.Editor
{
    public static class NexusVoiceModelInstaller
    {
        private static readonly string[] RequiredFiles =
        {
            "model_quantized.onnx",
            "config.json",
            "tokenizer.json",
            "tokenizer_config.json",
            "model-manifest.json"
        };

        private static string ModelDirectory =>
            Path.Combine(Application.streamingAssetsPath, "NexusVoice");

        [MenuItem("Tools/NexusVoice/Validate Model Installation")]
        public static void ValidateAndReport()
        {
            if (Validate(out string message))
            {
                Debug.Log("NexusVoice: " + message);
                EditorUtility.DisplayDialog("NexusVoice", message, "OK");
            }
            else
            {
                Debug.LogWarning("NexusVoice: " + message);
                EditorUtility.DisplayDialog("NexusVoice Model Missing", message, "OK");
            }
        }

        public static bool Validate(out string message)
        {
            if (!Directory.Exists(ModelDirectory))
            {
                message = "Model directory not found. Run `npm run unity:model` from node/.";
                return false;
            }

            foreach (string file in RequiredFiles)
            {
                if (!File.Exists(Path.Combine(ModelDirectory, file)))
                {
                    message = file + " is missing. Run `npm run unity:model` from node/.";
                    return false;
                }
            }

            string voicesDirectory = Path.Combine(ModelDirectory, "voices");
            if (!Directory.Exists(voicesDirectory)
                || Directory.GetFiles(voicesDirectory, "*.bin").Length == 0)
            {
                message = "Voice files are missing. Run `npm run unity:model` from node/.";
                return false;
            }

            message = "Model and voice files are installed. Run `npm run unity:model:verify` "
                + "for SHA-256 verification.";
            return true;
        }
    }
}
