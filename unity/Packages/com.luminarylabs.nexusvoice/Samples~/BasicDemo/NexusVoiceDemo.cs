using LuminaryLabs.NexusVoice;
using System.Collections;
using UnityEngine;

public sealed class NexusVoiceDemo : MonoBehaviour
{
    [SerializeField] private NexusVoiceEmitter guard;
    [SerializeField] private NexusVoiceEmitter wizard;

    public void PlayConversation()
    {
        StartCoroutine(PlayConversationRoutine());
    }

    public void StopConversation()
    {
        guard.Stop();
        wizard.Stop();
    }

    private IEnumerator PlayConversationRoutine()
    {
        guard.Speak("You cannot enter.");
        while (guard.IsGenerating || guard.IsSpeaking)
        {
            yield return null;
        }

        wizard.Speak("We shall see about that.");
    }
}
