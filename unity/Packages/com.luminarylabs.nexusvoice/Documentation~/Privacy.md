# Privacy and data behavior

The `0.0.1-preview.1` Node bridge binds to localhost. Speech text is sent from Unity
to that local process for synthesis. NexusVoice does not send text to Luminary Labs
and does not use customer text for model training.

If a developer changes the endpoint to a remote server, that developer is
responsible for transport security, disclosure, retention, and user consent.
