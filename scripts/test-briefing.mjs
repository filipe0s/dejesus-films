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

const priorKey = process.env.SENDGRID_API_KEY;
const priorSender = process.env.SENDGRID_SENDER_EMAIL;
const priorFetch = globalThis.fetch;
try {
  delete process.env.SENDGRID_API_KEY;
  delete process.env.SENDGRID_SENDER_EMAIL;
  assert.equal((await submitBriefing(request(answers))).status, 503);

  process.env.SENDGRID_API_KEY = 'test-key';
  process.env.SENDGRID_SENDER_EMAIL = 'remetente@example.com';
  globalThis.fetch = async (target, options) => {
    assert.equal(target, 'https://api.sendgrid.com/v3/mail/send');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    const mail = JSON.parse(options.body);
    assert.equal(mail.personalizations[0].to[0].email, 'dejesusfilms@gmail.com');
    assert.equal(mail.from.email, 'remetente@example.com');
    assert.equal(mail.attachments[0].type, 'application/pdf');
    const pdf = await PDFDocument.load(Buffer.from(mail.attachments[0].content, 'base64'));
    assert(pdf.getPageCount() >= 1);
    return new Response(null, { status: 202 });
  };
  const response = await submitBriefing(request(answers));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.type, 'sent');
  assert.equal(data.fileName, 'briefing-casamento-ana-e-lucas.pdf');
  assert.equal(Buffer.from(data.pdfBase64, 'base64').subarray(0, 4).toString(), '%PDF');
} finally {
  globalThis.fetch = priorFetch;
  if (priorKey === undefined) delete process.env.SENDGRID_API_KEY;
  else process.env.SENDGRID_API_KEY = priorKey;
  if (priorSender === undefined) delete process.env.SENDGRID_SENDER_EMAIL;
  else process.env.SENDGRID_SENDER_EMAIL = priorSender;
}
console.log('Briefing: validação, anexo PDF e destinatário verificados.');
