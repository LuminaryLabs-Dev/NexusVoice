using System;
using System.Collections;
using System.IO;
using UnityEngine;
using UnityEngine.Networking;

namespace LuminaryLabs.NexusVoice
{
    public sealed class NexusVoiceClient : MonoBehaviour
    {
        [SerializeField] private string endpoint = "http://127.0.0.1:47831/synthesize";
        [SerializeField] private AudioSource output;

        public event Action<AudioClip> AudioReady;
        public event Action<string> Failed;

        public void Speak(string text, string voice = "af_heart", float speed = 0.96f)
        {
            StartCoroutine(RequestAudio(new NexusVoiceRequest { text = text, voice = voice, speed = speed }));
        }

        private IEnumerator RequestAudio(NexusVoiceRequest request)
        {
            string json = JsonUtility.ToJson(request);
            using UnityWebRequest webRequest = new UnityWebRequest(endpoint, UnityWebRequest.kHttpVerbPOST);
            byte[] body = System.Text.Encoding.UTF8.GetBytes(json);
            webRequest.uploadHandler = new UploadHandlerRaw(body);
            webRequest.downloadHandler = new DownloadHandlerBuffer();
            webRequest.SetRequestHeader("Content-Type", "application/json");
            yield return webRequest.SendWebRequest();

            if (webRequest.result != UnityWebRequest.Result.Success)
            {
                Failed?.Invoke(webRequest.error);
                yield break;
            }

            string path = Path.Combine(Application.temporaryCachePath, "nexusvoice-response.wav");
            File.WriteAllBytes(path, webRequest.downloadHandler.data);
            using UnityWebRequest audioRequest = UnityWebRequestMultimedia.GetAudioClip("file://" + path, AudioType.WAV);
            yield return audioRequest.SendWebRequest();

            if (audioRequest.result != UnityWebRequest.Result.Success)
            {
                Failed?.Invoke(audioRequest.error);
                yield break;
            }

            AudioClip clip = DownloadHandlerAudioClip.GetContent(audioRequest);
            AudioReady?.Invoke(clip);
            if (output != null)
            {
                output.clip = clip;
                output.Play();
            }
        }
    }
}
