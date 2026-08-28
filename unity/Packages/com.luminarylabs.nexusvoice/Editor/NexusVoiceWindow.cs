using UnityEditor;
using UnityEngine;

namespace LuminaryLabs.NexusVoice.Editor
{
    public sealed class NexusVoiceWindow : EditorWindow
    {
        private string text = "The dragon has filed a complaint about the treasure map.";
        private string voice = "af_heart";
        private float speed = 0.96f;

        [MenuItem("NexusVoice/Voice Preview")]
        private static void Open()
        {
            GetWindow<NexusVoiceWindow>("NexusVoice");
        }

        private void OnGUI()
        {
            EditorGUILayout.LabelField("NexusVoice Preview", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox("Start the sibling node bridge before using a scene component. Native embedded inference will replace this bridge in the production release.", MessageType.Info);
            text = EditorGUILayout.TextArea(text, GUILayout.MinHeight(70));
            voice = EditorGUILayout.TextField("Voice", voice);
            speed = EditorGUILayout.Slider("Speed", speed, 0.5f, 1.5f);
            using (new EditorGUI.DisabledScope(true))
            {
                GUILayout.Button("Generate Preview (bridge wiring next)");
            }
        }
    }
}
