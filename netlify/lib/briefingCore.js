import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const MAX_TOTAL_CHARS = 12000;
const GOLD = rgb(1, 0.7, 0);
const INK = rgb(0.06, 0.06, 0.07);
const MUTED = rgb(0.38, 0.38, 0.4);
const YES_NO = ['Sim', 'Não'];

function read(input, key, { required = false, max = 1000 } = {}) {
  const raw = input[key];
  if (raw !== undefined && typeof raw !== 'string') throw new Error(`Campo inválido: ${key}`);
  const text = (raw || '').replace(/\r/g, '').trim();
  if (text.length > max) throw new Error(`Campo muito longo: ${key}`);
  if (required && !text) throw new Error(`Campo obrigatório: ${key}`);
  return text;
}

function choice(input, key, options) {
  const answer = read(input, key, { required: true, max: 80 });
  if (!options.includes(answer)) throw new Error(`Resposta inválida: ${key}`);
  return answer;
}

function section(title, rows) {
  return { title, rows: rows.filter(([, answer]) => answer !== '') };
}

export function prepareBriefing(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Respostas inválidas');
  if (JSON.stringify(input).length > MAX_TOTAL_CHARS) throw new Error('Briefing muito longo');
  if (input.reviewConfirmed !== true) throw new Error('Confirmação obrigatória');
  const coupleNames = read(input, 'coupleNames', { required: true, max: 160 });
  const eventCorrect = choice(input, 'eventCorrect', YES_NO);
  const makingSameVenue = choice(input, 'makingSameVenue', YES_NO);
  const musicChoice = choice(input, 'musicChoice', ['Sim', 'Ainda não', 'Gostaríamos de receber sugestões']);
  const videoStyle = choice(input, 'videoStyle', ['Romântico e emocionante', 'Cinematográfico', 'Natural e espontâneo', 'Dinâmico e animado', 'Ainda não sabemos']);
  const hasSurprise = choice(input, 'hasSurprise', YES_NO);
  const featurePerson = choice(input, 'featurePerson', YES_NO);
  const avoidPerson = choice(input, 'avoidPerson', YES_NO);

  const sections = [
    section('01 · Confirmação do evento', [
      ['Nome dos noivos', coupleNames],
      ['Informações previstas', '20/11 · 19h às 21h · Igreja Batista Betel'],
      ['Informações corretas?', eventCorrect],
      ...(eventCorrect === 'Não' ? [
        ['Data correta', read(input, 'correctDate', { required: true, max: 80 })],
        ['Horário correto', read(input, 'correctTime', { required: true, max: 80 })],
        ['Local e endereço corretos', read(input, 'correctVenue', { required: true, max: 300 })]
      ] : []),
      ['Making of no mesmo local?', makingSameVenue],
      ...(makingSameVenue === 'Não' ? [
        ['Local ou endereço do making of', read(input, 'makingVenue', { required: true, max: 300 })],
        ['Início da preparação', read(input, 'makingTime', { required: true, max: 80 })]
      ] : [])
    ]),
    section('02 · Música e estilo do vídeo', [
      ['Música escolhida?', musicChoice],
      ...(musicChoice === 'Sim' ? [
        ['Música e artista', read(input, 'musicTitle', { required: true, max: 200 })],
        ['Link da música', read(input, 'musicLink', { max: 500 })]
      ] : []),
      ...(musicChoice === 'Gostaríamos de receber sugestões' ? [
        ['Estilo musical', read(input, 'musicStyle', { required: true, max: 200 })],
        ['Música ou estilo a evitar', read(input, 'musicAvoid', { max: 600 })]
      ] : []),
      ['Estilo de vídeo', videoStyle],
      ['Paleta de cores do casamento', read(input, 'colorPalette', { max: 600 })],
      ['Vídeos de referência', read(input, 'videoReferences', { max: 1000 })]
    ]),
    section('03 · Preferências importantes', [
      ['Detalhes a enfatizar', read(input, 'importantDetails', { max: 1000 })],
      ['Surpresa ou homenagem?', hasSurprise],
      ...(hasSurprise === 'Sim' ? [
        ['Detalhes da surpresa', read(input, 'surpriseDescription', { required: true, max: 1000 })],
        ['Horário aproximado', read(input, 'surpriseTime', { required: true, max: 80 })]
      ] : []),
      ['Pessoa para aparecer mais?', featurePerson],
      ...(featurePerson === 'Sim' ? [
        ['Nome da pessoa', read(input, 'featuredName', { required: true, max: 160 })],
        ['Relação com o casal', read(input, 'featuredRelation', { required: true, max: 160 })]
      ] : []),
      ['Pessoa que não deve aparecer?', avoidPerson],
      ...(avoidPerson === 'Sim' ? [
        ['Nome ou identificação', read(input, 'avoidedDescription', { required: true, max: 500 })]
      ] : [])
    ]),
    section('04 · Informações finais', [
      ['Regras ou restrições do local', read(input, 'venueRules', { max: 1000 })],
      ['Situação familiar ou detalhe sensível', read(input, 'familyNotes', { max: 1000 })],
      ['Outras orientações', read(input, 'otherNotes', { max: 1000 })],
      ['Informações revisadas e confirmadas?', 'Sim']
    ])
  ];
  const slug = coupleNames.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'casal';
  return { coupleNames, sections, fileName: `briefing-casamento-${slug}.pdf` };
}

function safeText(text, font) {
  return [...String(text)].map(character => {
    if (character === '\n') return '\n';
    try { font.encodeText(character); return character; } catch (_) { return '?'; }
  }).join('');
}

function wrapLine(text, font, size, width) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) { line = candidate; continue; }
    if (line) { lines.push(line); line = ''; }
    if (font.widthOfTextAtSize(word, size) <= width) { line = word; continue; }
    let part = '';
    for (const character of word) {
      if (part && font.widthOfTextAtSize(part + character, size) > width) { lines.push(part); part = ''; }
      part += character;
    }
    line = part;
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildBriefingPdf(prepared) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const width = 595.28;
  const height = 841.89;
  const margin = 52;
  let page;
  let y;

  const addPage = () => {
    page = pdf.addPage([width, height]);
    page.drawRectangle({ x: 0, y: height - 78, width, height: 78, color: INK });
    page.drawText('deJesus Films', { x: margin, y: height - 48, size: 18, font: bold, color: GOLD });
    y = height - 112;
  };
  const ensure = needed => { if (y - needed < 65) addPage(); };
  const drawLines = (text, font, size, color, lineHeight) => {
    const safe = safeText(text, font);
    for (const paragraph of safe.split('\n')) {
      for (const line of wrapLine(paragraph, font, size, width - 2 * margin)) {
        ensure(lineHeight);
        page.drawText(line, { x: margin, y, size, font, color });
        y -= lineHeight;
      }
    }
  };

  addPage();
  drawLines('Briefing de casamento', bold, 22, INK, 29);
  drawLines(prepared.coupleNames, regular, 13, MUTED, 21);
  y -= 13;

  for (const group of prepared.sections) {
    ensure(48);
    y -= 8;
    page.drawRectangle({ x: margin, y: y + 3, width: width - 2 * margin, height: 1.5, color: GOLD });
    y -= 21;
    drawLines(group.title, bold, 12, INK, 18);
    y -= 8;
    for (const [label, answer] of group.rows) {
      ensure(42);
      drawLines(label, bold, 9.5, MUTED, 14);
      drawLines(answer, regular, 10.5, INK, 15);
      y -= 6;
    }
  }
  pdf.getPages().forEach((item, index) => {
    item.drawText(`deJesus Films  ·  ${index + 1} / ${pdf.getPageCount()}`, { x: margin, y: 34, size: 8, font: regular, color: MUTED });
  });
  return Buffer.from(await pdf.save());
}
