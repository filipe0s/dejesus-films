import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import submitBriefing from '../netlify/functions/submit-briefing.mjs';

const url = 'https://www.fdejesus.com.br/.netlify/functions/submit-briefing';
const answers = {
  coupleNames: 'Ana e Lucas', eventCorrect: 'Sim', makingSameVenue: 'Sim',
  musicChoice: 'Ainda não', videoStyle: 'Cinematográfico',
  colorPalette: 'Verde oliva, branco e dourado', hasSurprise: 'Não',
  featurePerson: 'Não', avoidPerson: 'Não', reviewConfirmed: true
};
const request = (data, origin = 'https://www.fdejesus.com.br') => new Request(url, {
  method: 'POST',
  headers: { Origin: origin, 'Content-Type': 'application/json' },
  body: JSON.stringify({ answers: data })
});

assert.equal((await submitBriefing(request({ ...answers, coupleNames: '' }))).status, 400);
assert.equal((await submitBriefing(request(answers, 'https://example.com'))).status, 403);
assert.equal((await submitBriefing(new Request(url))).status, 405);

const priorKey = process.env.BREVO_API_KEY;
const priorSender = process.env.BREVO_SENDER_EMAIL;
const priorFetch = globalThis.fetch;
try {
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_SENDER_EMAIL;
  assert.equal((await submitBriefing(request(answers))).status, 503);

  process.env.BREVO_API_KEY = 'test-key';
  process.env.BREVO_SENDER_EMAIL = 'remetente@example.com';
  globalThis.fetch = async (target, options) => {
    assert.equal(target, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(options.headers['api-key'], 'test-key');
    const mail = JSON.parse(options.body);
    assert.equal(mail.to[0].email, 'dejesusfilms@gmail.com');
    assert.equal(mail.sender.email, 'remetente@example.com');
    assert(mail.attachment[0].name.endsWith('.pdf'));
    const pdf = await PDFDocument.load(Buffer.from(mail.attachment[0].content, 'base64'));
    assert(pdf.getPageCount() >= 1);
    return new Response(JSON.stringify({ messageId: 'test-message' }), { status: 201 });
  };
  const response = await submitBriefing(request(answers));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.type, 'sent');
  assert.equal(data.fileName, 'briefing-casamento-ana-e-lucas.pdf');
  assert.equal(Buffer.from(data.pdfBase64, 'base64').subarray(0, 4).toString(), '%PDF');
} finally {
  globalThis.fetch = priorFetch;
  if (priorKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = priorKey;
  if (priorSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
  else process.env.BREVO_SENDER_EMAIL = priorSender;
}
console.log('Briefing: validação, anexo PDF e destinatário verificados.');
