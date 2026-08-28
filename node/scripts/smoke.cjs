const http = require('node:http');
const { spawn } = require('node:child_process');

function request(method, route, body) {
  return new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port: 47831, path: route, method, headers: body ? { 'Content-Type': 'application/json' } : {} }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, body: Buffer.concat(chunks) }));
    });
    request.on('error', reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

async function main() {
  const server = spawn(process.execPath, ['server.cjs'], { stdio: 'ignore' });
  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        const health = await request('GET', '/health');
        if (health.status === 200) break;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    const health = await request('GET', '/health');
    if (health.status !== 200) throw new Error(`health failed: ${health.status}`);
    const speech = await request('POST', '/synthesize', { text: 'NexusVoice smoke test.', voice: 'af_heart', speed: 0.96 });
    if (speech.status !== 200 || speech.body.subarray(0, 4).toString() !== 'RIFF') throw new Error(`synthesize failed: ${speech.status}`);
    console.log('NexusVoice Node smoke test passed:', speech.body.length, 'bytes');
  } finally {
    server.kill();
  }
}

main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
