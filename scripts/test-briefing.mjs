import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { prepareBriefing } from '../netlify/lib/briefingCore.js';
import submitBriefing from '../netlify/functions/submit-briefing.mjs';

const url = 'https://www.fdejesus.com.br/.netlify/functions/submit-briefing';
const answers = {
  eventType: 'Casamento', coupleNames: 'Ana e Lucas', makingSameVenue: 'Sim',
  eventDate: '2026-11-20', eventVenue: 'Igreja Batista Betel', coverageStart: '19:00', coverageEnd: '21:00',
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
assert.equal((await submitBriefing(request({ ...answers, eventDate: '2026-02-30' }))).status, 400);
assert.equal((await submitBriefing(request(answers, 'https://example.com'))).status, 403);
assert.equal((await submitBriefing(new Request(url))).status, 405);

for (const [eventType, fields, expectedLabel] of [
  ['Casamento', { coupleNames: 'Ana e Lucas', makingSameVenue: 'Sim' }, 'Nome dos noivos'],
  ['Aniversário', { birthdayName: 'Luiza', birthdayAge: '18' }, 'Nome do aniversariante'],
  ['Bodas', { anniversaryNames: 'Rita e Paulo', anniversaryYears: '25' }, 'Anos de união'],
  ['Formatura', { graduateName: 'Turma de Direito' }, 'Formando ou turma'],
  ['Festa', { partyName: 'Festa de família' }, 'Nome ou ocasião da festa'],
  ['Show ou festival', { festivalName: 'Festival da Cidade' }, 'Nome do show ou festival'],
  ['Evento corporativo', { companyName: 'Acme', corporatePurpose: 'Lançamento' }, 'Objetivo do evento'],
  ['Evento religioso', { religiousName: 'Celebração da comunidade' }, 'Nome ou ocasião da celebração'],
  ['Outro', { otherType: 'Encontro cultural', otherName: 'Encontro da comunidade' }, 'Nome ou pessoa principal']
]) {
  const prepared = prepareBriefing({ ...answers, eventType, ...fields });
  assert(prepared.sections[0].rows.some(([label]) => label === expectedLabel));
  assert(prepared.fileName.startsWith('briefing-evento-'));
  if (eventType !== 'Casamento') assert(!prepared.sections[0].rows.some(([label]) => label.includes('Making of')));
}
assert.throws(() => prepareBriefing({ ...answers, eventType: 'Aniversário', birthdayName: 'Luiza' }), /birthdayAge/);

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
  assert.equal(data.fileName, 'briefing-evento-ana-e-lucas.pdf');
  assert.equal(Buffer.from(data.pdfBase64, 'base64').subarray(0, 4).toString(), '%PDF');
} finally {
  globalThis.fetch = priorFetch;
  if (priorKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = priorKey;
  if (priorSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
  else process.env.BREVO_SENDER_EMAIL = priorSender;
}
console.log('Briefing: validação, anexo PDF e destinatário verificados.');
