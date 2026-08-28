using UnityEngine;

namespace LuminaryLabs.NexusVoice.Samples
{
    public sealed class NexusVoiceDemo : MonoBehaviour
    {
        private NexusVoiceEmitter emitter;
        private string speechText = "The dragon filed a complaint about the treasure map.";
        private string status = "Start the Node bridge, then generate speech.";

        private void Awake()
        {
            if (GetComponent<AudioSource>() == null)
            {
                gameObject.AddComponent<AudioSource>();
            }

            emitter = GetComponent<NexusVoiceEmitter>();
            if (emitter == null)
            {
                emitter = gameObject.AddComponent<NexusVoiceEmitter>();
            }

            emitter.OnClipReady.AddListener(_ => status = "Audio ready");
            emitter.OnPlaybackStarted.AddListener(_ => status = "Playing");
            emitter.OnPlaybackFinished.AddListener(_ => status = "Finished");
            emitter.OnError.AddListener(error => status = "Error: " + error);
        }

        private void OnGUI()
        {
            GUILayout.BeginArea(new Rect(24f, 24f, 560f, 240f), GUI.skin.box);
            GUILayout.Label("NexusVoice 0.0.1 Preview");
            speechText = GUILayout.TextArea(speechText, GUILayout.Height(80f));

            GUILayout.BeginHorizontal();
            if (GUILayout.Button("Generate and Play", GUILayout.Height(36f)))
            {
                status = "Generating...";
                emitter.Speak(speechText);
            }

            if (GUILayout.Button("Stop", GUILayout.Height(36f)))
            {
                emitter.Stop();
                status = "Stopped";
            }
            GUILayout.EndHorizontal();

            GUILayout.Label(status);
            GUILayout.EndArea();
        }
    }
}
