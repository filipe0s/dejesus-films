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

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    console.error('Briefing: Brevo não configurado.');
    return json(503, { type: 'error' });
  }

  try {
    const pdf = await buildBriefingPdf(prepared);
    const pdfBase64 = pdf.toString('base64');
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: [{ email: RECIPIENT }],
        sender: { email: senderEmail, name: 'deJesus Films' },
        subject: `Briefing de casamento — ${prepared.coupleNames.replace(/\s+/g, ' ')}`,
        textContent: `Novo briefing de casamento de ${prepared.coupleNames.replace(/\s+/g, ' ')}. O PDF com todas as respostas está em anexo.`,
        attachment: [{ content: pdfBase64, name: prepared.fileName }]
      })
    });
    if (response.status !== 201) {
      console.error(`Briefing: Brevo respondeu HTTP ${response.status}.`);
      return json(502, { type: 'error' });
    }
    return json(200, { type: 'sent', pdfBase64, fileName: prepared.fileName });
  } catch (error) {
    console.error('Briefing: falha no envio.', error?.message || error);
    return json(502, { type: 'error' });
  }
}
