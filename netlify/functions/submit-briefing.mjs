import { prepareBriefing, buildBriefingPdf } from '../lib/briefingCore.js';

const RECIPIENT = 'dejesusfilms@gmail.com';
const MAX_REQUEST_CHARS = 16000;

function json(status, data) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export default async function submitBriefing(request) {
  if (request.method !== 'POST') return json(405, { type: 'error' });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json(403, { type: 'error' });
  if (Number(request.headers.get('content-length')) > MAX_REQUEST_CHARS) return json(413, { type: 'error' });

  let prepared;
  try {
    const body = await request.text();
    if (body.length > MAX_REQUEST_CHARS) return json(413, { type: 'error' });
    prepared = prepareBriefing(JSON.parse(body).answers);
  } catch (_) {
    return json(400, { type: 'error' });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.error('Briefing: SendGrid não configurado.');
    return json(503, { type: 'error' });
  }

  try {
    const pdf = await buildBriefingPdf(prepared);
    const pdfBase64 = pdf.toString('base64');
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: RECIPIENT }] }],
        from: { email: senderEmail },
        subject: `Briefing de casamento — ${prepared.coupleNames.replace(/\s+/g, ' ')}`,
        content: [{ type: 'text/plain', value: `Novo briefing de casamento de ${prepared.coupleNames.replace(/\s+/g, ' ')}. O PDF com todas as respostas está em anexo.` }],
        attachments: [{ content: pdfBase64, type: 'application/pdf', filename: prepared.fileName, disposition: 'attachment' }]
      })
    });
    if (response.status !== 202) {
      console.error(`Briefing: SendGrid respondeu HTTP ${response.status}.`);
      return json(502, { type: 'error' });
    }
    return json(200, { type: 'sent', pdfBase64, fileName: prepared.fileName });
  } catch (error) {
    console.error('Briefing: falha no envio.', error?.message || error);
    return json(502, { type: 'error' });
  }
}
