using System.IO;
using UnityEditor;
using UnityEngine;

namespace LuminaryLabs.NexusVoice.Editor
{
    public static class NexusVoiceModelInstaller
    {
        private static readonly string[] RequiredFiles =
        {
            "model.onnx",
            "voices.bin",
            "tokens.txt",
            "lexicon-us-en.txt",
            "model-manifest.json"
        };

        private static string ModelDirectory =>
            Path.Combine(Application.streamingAssetsPath, "NexusVoice", "Model");

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
                message = "Native model directory not found. Run `npm run native:all` from node/.";
                return false;
            }

            foreach (string file in RequiredFiles)
            {
                if (!File.Exists(Path.Combine(ModelDirectory, file)))
                {
                    message = file + " is missing. Run `npm run native:all` from node/.";
                    return false;
                }
            }

            string phonemizerDirectory = Path.Combine(ModelDirectory, "espeak-ng-data");
            if (!Directory.Exists(phonemizerDirectory)
                || !File.Exists(Path.Combine(phonemizerDirectory, "phontab")))
            {
                message = "Native phonemizer data is missing. Run `npm run native:all` from node/.";
                return false;
            }

            message = "Native model, 53 voices and phonemizer data are installed. "
                + "Run `npm run unity:model:verify` for SHA-256 verification.";
            return true;
        }
    }
}
