# Troubleshooting

## Bridge unavailable

Run `npm run serve` from `node/`. The bridge listens on `127.0.0.1:47831`.
Use **Tools > NexusVoice > Setup** to check `/health`.

## Model missing

Run `npm run model:download`. For the Unity model folder, run
`npm run unity:model` and `npm run unity:model:verify`.

## Response is not a WAV

Confirm the emitter endpoint ends with `/synthesize`. The package rejects HTML,
JSON error pages, and incomplete audio before creating an `AudioClip`.

## Native plugin unavailable

This is expected in `0.0.1-preview.1`. Select **Node Bridge**. Native inference is
not bundled in this version.

## Request timed out

Confirm the Node process is running and the model has downloaded completely. Then
increase **Request Timeout Seconds** if the machine needs more inference time.
