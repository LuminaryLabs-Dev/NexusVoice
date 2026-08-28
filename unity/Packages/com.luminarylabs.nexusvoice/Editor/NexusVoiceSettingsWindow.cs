using UnityEditor;
using UnityEngine;
using UnityEngine.Networking;

namespace LuminaryLabs.NexusVoice.Editor
{
    public sealed class NexusVoiceSettingsWindow : EditorWindow
    {
        private const string HealthEndpoint = "http://127.0.0.1:47831/health";
        private string bridgeStatus = "Not checked";
        private UnityWebRequest healthRequest;

        [MenuItem("Tools/NexusVoice/Setup")]
        public static void Open()
        {
            NexusVoiceSettingsWindow window = GetWindow<NexusVoiceSettingsWindow>();
            window.titleContent = new GUIContent("NexusVoice Setup");
            window.minSize = new Vector2(440f, 260f);
            window.Show();
        }

        private void OnGUI()
        {
            EditorGUILayout.LabelField("NexusVoice 0.0.1 Preview", EditorStyles.boldLabel);
            EditorGUILayout.Space();
            EditorGUILayout.HelpBox(
                "This preview uses the local Node authoring engine. From the repository's "
                + "node folder, run `npm install`, `npm run model:download`, then `npm run serve`.",
                MessageType.Info);

            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Bridge", bridgeStatus);
            using (new EditorGUI.DisabledScope(healthRequest != null))
            {
                if (GUILayout.Button("Check Local Bridge"))
                {
                    CheckBridge();
                }
            }

            if (GUILayout.Button("Validate Model Installation"))
            {
                NexusVoiceModelInstaller.ValidateAndReport();
            }

            if (GUILayout.Button("Open Documentation"))
            {
                Application.OpenURL("https://github.com/LuminaryLabs-Dev/NexusVoice");
            }
        }

        private void OnDisable()
        {
            healthRequest?.Abort();
            healthRequest?.Dispose();
            healthRequest = null;
        }

        private void CheckBridge()
        {
            bridgeStatus = "Checking...";
            healthRequest = UnityWebRequest.Get(HealthEndpoint);
            healthRequest.timeout = 5;
            healthRequest.SendWebRequest().completed += _ => EditorApplication.delayCall += FinishBridgeCheck;
        }

        private void FinishBridgeCheck()
        {
            if (healthRequest == null)
            {
                return;
            }

            bridgeStatus = healthRequest.result == UnityWebRequest.Result.Success
                ? "Available"
                : "Unavailable — start `npm run serve` in node/";
            healthRequest.Dispose();
            healthRequest = null;
            Repaint();
        }
    }
}
