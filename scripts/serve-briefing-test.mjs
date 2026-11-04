// Local-only preview of the published page with a simulated Brevo response.
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import submitBriefing from '../netlify/functions/submit-briefing.mjs';

const root = path.resolve('dist');
const port = 4175;
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.png': 'image/png' };
process.env.BREVO_API_KEY = 'local-test-only';
process.env.BREVO_SENDER_EMAIL = 'teste@example.com';
globalThis.fetch = async url => {
  if (url !== 'https://api.brevo.com/v3/smtp/email') throw new Error('URL inesperada');
  return new Response(JSON.stringify({ messageId: 'local-test' }), { status: 201 });
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (url.pathname === '/.netlify/functions/submit-briefing') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(url, { method: req.method, headers: req.headers, body: Buffer.concat(chunks) });
    const response = await submitBriefing(request);
    const bytes = Buffer.from(await response.arrayBuffer());
    res.writeHead(response.status, { ...Object.fromEntries(response.headers), 'Content-Length': bytes.length });
    res.end(bytes);
    return;
  }
  try {
    const route = url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname;
    const target = path.resolve(root, `.${route}`);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Outside root');
    const info = await stat(target);
    if (!info.isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-store' });
    createReadStream(target).pipe(res);
  } catch (_) {
    res.writeHead(404); res.end('Não encontrado');
  }
}).listen(port, '127.0.0.1', () => console.log(`Briefing local: http://127.0.0.1:${port}/briefing-casamento/`));
