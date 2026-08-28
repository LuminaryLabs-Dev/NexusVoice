using UnityEditor;
using UnityEngine;

namespace LuminaryLabs.NexusVoice.Editor
{
    [CustomEditor(typeof(NexusVoiceEmitter))]
    [CanEditMultipleObjects]
    public sealed class NexusVoiceEmitterEditor : UnityEditor.Editor
    {
        public override void OnInspectorGUI()
        {
            serializedObject.Update();
            DrawDefaultInspector();
            serializedObject.ApplyModifiedProperties();

            EditorGUILayout.Space();
            NexusVoiceEmitter emitter = target as NexusVoiceEmitter;
            if (emitter != null && emitter.RuntimeMode == NexusVoiceRuntimeMode.NodeBridge)
            {
                EditorGUILayout.HelpBox(
                    "Node Bridge mode requires the local reference server. Start it with "
                    + "`cd node && npm run serve` before generating speech.",
                    MessageType.Info);
            }
            else
            {
                EditorGUILayout.HelpBox(
                    "Native mode requires the platform plugin and prepared model pack. "
                    + "Run `cd node && npm run native:all` for Linux x64.",
                    MessageType.Info);
            }

            if (GUILayout.Button("Open NexusVoice Setup"))
            {
                NexusVoiceSettingsWindow.Open();
            }
        }
    }
}
