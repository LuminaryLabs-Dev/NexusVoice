# Troubleshooting

## Native plugin unavailable

Run `npm run native:all` from `node/`. Confirm the three Linux libraries exist
under `Runtime/Plugins/Linux/x86_64`.

## Native model missing

Run `npm run native:all`, then `npm run unity:model:verify` from `node/`.

## Bridge unavailable

Node Bridge mode requires `npm run serve` from `node/`. The bridge listens on
`127.0.0.1:47831`.

## Response is not a WAV

This applies to Node Bridge mode. Confirm the endpoint ends with `/synthesize`.

## Generation is slow

The first request loads the model. Later requests reuse the runtime and cache.
Keep the model on local storage and avoid running multiple CPU-heavy generators.

