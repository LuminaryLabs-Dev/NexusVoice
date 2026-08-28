const fs = require('node:fs');
const { synthesize } = require('../engine.cjs');

const request = JSON.parse(process.argv[2] || '{}');

async function main() {
  if (!request.text) throw new Error('text is required');
  const result = await synthesize(request);
  fs.mkdirSync(path.dirname(request.output), { recursive: true });
  fs.writeFileSync(request.output, result.wav);
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
