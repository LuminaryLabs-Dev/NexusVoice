const { synthesize } = require('../engine.cjs');

const voices = ['af_heart', 'af_bella', 'af_nicole', 'am_michael', 'am_fenrir', 'bf_emma', 'bm_george'];

async function main() {
  for (const voice of voices) {
    const result = await synthesize({ text: 'NexusVoice is ready.', voice, speed: 0.96 });
    if (result.wav.subarray(0, 4).toString() !== 'RIFF' || result.samples <= 0 || result.sampleRate !== 24000) {
      throw new Error(`Voice smoke test failed for ${voice}`);
    }
    console.log(`${voice}: ${result.samples} samples`);
  }
  console.log(`NexusVoice voice smoke test passed: ${voices.length} voices`);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
