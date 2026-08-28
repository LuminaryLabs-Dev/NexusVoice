using LuminaryLabs.NexusVoice;
using UnityEngine;
using UnityEngine.UI;

public sealed class NexusVoiceDemoBootstrap : MonoBehaviour
{
    private NexusVoiceEmitter emitter;
    private InputField input;
    private Text status;

    private void Awake()
    {
        emitter = gameObject.AddComponent<NexusVoiceEmitter>();
        emitter.OnClipReady.AddListener(_ => status.text = "Audio ready");
        emitter.OnError.AddListener(error => status.text = "Error: " + error);

        Canvas canvas = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster)).GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.GetComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvas.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1280, 720);

        input = CreateInput(canvas.transform, new Vector2(0, 80), new Vector2(760, 120));
        input.text = "The dragon has filed a complaint about the treasure map.";

        Button button = CreateButton(canvas.transform, new Vector2(0, -80), new Vector2(260, 70));
        button.onClick.AddListener(() => {
            status.text = "Generating...";
            emitter.Speak(input.text);
        });

        status = CreateLabel(canvas.transform, new Vector2(0, -170), new Vector2(760, 50));
        status.text = "Start node/server.cjs, then press Generate";
    }

    private static InputField CreateInput(Transform parent, Vector2 position, Vector2 size)
    {
        GameObject objectRoot = new GameObject("Text Input", typeof(RectTransform), typeof(Image), typeof(InputField));
        objectRoot.transform.SetParent(parent, false);
        RectTransform rect = objectRoot.GetComponent<RectTransform>();
        rect.anchoredPosition = position;
        rect.sizeDelta = size;
        Image image = objectRoot.GetComponent<Image>();
        image.color = new Color(0.08f, 0.09f, 0.12f, 0.96f);
        Text text = CreateLabel(objectRoot.transform, Vector2.zero, size);
        text.alignment = TextAnchor.UpperLeft;
        text.color = Color.white;
        text.supportRichText = false;
        InputField input = objectRoot.GetComponent<InputField>();
        input.textComponent = text;
        input.lineType = InputField.LineType.MultiLineNewline;
        return input;
    }

    private static Button CreateButton(Transform parent, Vector2 position, Vector2 size)
    {
        GameObject objectRoot = new GameObject("Generate", typeof(RectTransform), typeof(Image), typeof(Button));
        objectRoot.transform.SetParent(parent, false);
        RectTransform rect = objectRoot.GetComponent<RectTransform>();
        rect.anchoredPosition = position;
        rect.sizeDelta = size;
        objectRoot.GetComponent<Image>().color = new Color(0.2f, 0.65f, 0.95f, 1f);
        Text label = CreateLabel(objectRoot.transform, Vector2.zero, size);
        label.text = "Generate Voice";
        label.alignment = TextAnchor.MiddleCenter;
        label.color = Color.white;
        objectRoot.GetComponent<Button>().targetGraphic = objectRoot.GetComponent<Image>();
        return objectRoot.GetComponent<Button>();
    }

    private static Text CreateLabel(Transform parent, Vector2 position, Vector2 size)
    {
        GameObject objectRoot = new GameObject("Label", typeof(RectTransform), typeof(Text));
        objectRoot.transform.SetParent(parent, false);
        RectTransform rect = objectRoot.GetComponent<RectTransform>();
        rect.anchoredPosition = position;
        rect.sizeDelta = size;
        Text label = objectRoot.GetComponent<Text>();
        label.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        label.fontSize = 24;
        label.color = Color.white;
        label.horizontalOverflow = HorizontalWrapMode.Wrap;
        label.verticalOverflow = VerticalWrapMode.Overflow;
        return label;
    }
}
