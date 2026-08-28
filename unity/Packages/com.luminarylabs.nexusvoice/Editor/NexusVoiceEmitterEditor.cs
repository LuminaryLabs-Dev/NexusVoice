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
                    "0.0.1-preview.1 uses the local Node bridge. Start it with "
                    + "`cd node && npm run serve` before generating speech.",
                    MessageType.Info);
            }
            else
            {
                EditorGUILayout.HelpBox(
                    "Native inference is not included in 0.0.1-preview.1. "
                    + "Use Node Bridge mode for this preview.",
                    MessageType.Warning);
            }

            if (GUILayout.Button("Open NexusVoice Setup"))
            {
                NexusVoiceSettingsWindow.Open();
            }
        }
    }
}
