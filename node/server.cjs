const http = require('node:http');
const path = require('node:path');
const { modelInfo, synthesize } = require('./engine.cjs');

const port = Number(process.env.NEXUSVOICE_PORT || 47831);

function send(response, status, body, type = 'application/json') {
  response.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  response.end(body);
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', chunk => { body += chunk; });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' });
    response.end();
    return;
  }
  if (request.method === 'GET' && request.url === '/health') {
    send(response, 200, JSON.stringify({ ok: true, service: 'NexusVoice Node bridge', model: modelInfo() }));
    return;
  }
  if (request.method !== 'POST' || request.url !== '/synthesize') {
    send(response, 404, JSON.stringify({ error: 'Not found' }));
    return;
  }
  try {
    const payload = await parseBody(request);
    if (typeof payload.text !== 'string' || payload.text.trim().length === 0) {
      send(response, 400, JSON.stringify({ error: 'text is required' }));
      return;
    }
    const result = await synthesize(payload);
    send(response, 200, result.wav, 'audio/wav');
  } catch (error) {
    send(response, 400, JSON.stringify({ error: error.message }));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`NexusVoice Node bridge listening on http://127.0.0.1:${port}`);
});
