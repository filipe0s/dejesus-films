(() => {
  'use strict';
  const form = document.getElementById('briefing-form');
  const steps = [...document.querySelectorAll('.form-step')];
  const formView = document.getElementById('form-view');
  const reviewView = document.getElementById('review-view');
  const successView = document.getElementById('success-view');
  const nextButton = document.getElementById('next-button');
  const backButton = document.getElementById('back-button');
  const error = document.getElementById('form-error');
  const submitButton = document.getElementById('submit-button');
  const submitStatus = document.getElementById('submit-status');
  const shareStatus = document.getElementById('share-status');
  const draftKey = 'dejesus-films-event-briefing-v1';
  const draftLifetime = 7 * 24 * 60 * 60 * 1000;
  let step = 0;
  let pdfBytes;
  let pdfFileName = 'briefing-evento.pdf';

  const value = name => {
    const field = form.elements.namedItem(name);
    if (!field) return '';
    if (field instanceof RadioNodeList) return field.value || '';
    return field.type === 'checkbox' ? (field.checked ? 'Sim' : 'Não') : field.value.trim();
  };
  const setConditional = (id, show) => {
    const container = document.getElementById(id);
    container.hidden = !show;
    container.querySelectorAll('input,textarea,select').forEach(field => { field.disabled = !show; });
  };
  const syncConditionals = () => {
    const eventType = value('eventType');
    for (const [type, id] of [
      ['Casamento', 'event-wedding'], ['Aniversário', 'event-birthday'], ['Bodas', 'event-anniversary'],
      ['Formatura', 'event-graduation'], ['Festa', 'event-party'], ['Show ou festival', 'event-festival'],
      ['Evento corporativo', 'event-corporate'], ['Evento religioso', 'event-religious'], ['Outro', 'event-other']
    ]) setConditional(id, eventType === type);
    setConditional('making-details', eventType === 'Casamento' && value('makingSameVenue') === 'Não');
    setConditional('chosen-music', value('musicChoice') === 'Sim');
    setConditional('music-suggestions', value('musicChoice') === 'Gostaríamos de receber sugestões');
    setConditional('surprise-details', value('hasSurprise') === 'Sim');
    setConditional('featured-person', value('featurePerson') === 'Sim');
    setConditional('avoided-person', value('avoidPerson') === 'Sim');
  };
  const getAnswers = () => {
    const answers = {};
    form.querySelectorAll('[name]:not(:disabled)').forEach(field => {
      if (field.type === 'radio') { if (field.checked) answers[field.name] = field.value; }
      else answers[field.name] = field.type === 'checkbox' ? field.checked : field.value;
    });
    return answers;
  };
  const saveDraft = () => {
    const answers = getAnswers();
    try { localStorage.setItem(draftKey, JSON.stringify({ savedAt: Date.now(), step, answers })); } catch (_) { /* The form remains usable if storage is unavailable. */ }
  };
  const restoreDraft = () => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (!draft || Date.now() - draft.savedAt > draftLifetime) { localStorage.removeItem(draftKey); return; }
      form.querySelectorAll('[name]').forEach(field => {
        if (!(field.name in draft.answers)) return;
        if (field.type === 'radio') field.checked = field.value === draft.answers[field.name];
        else if (field.type === 'checkbox') field.checked = Boolean(draft.answers[field.name]);
        else field.value = draft.answers[field.name];
      });
      step = Math.min(steps.length - 1, Math.max(0, Number(draft.step) || 0));
    } catch (_) { /* Ignore an invalid draft. */ }
  };
  const showStep = (index, focus = true) => {
    step = index;
    steps.forEach((section, i) => { section.hidden = i !== step; });
    const items = [...document.querySelectorAll('#step-list li')];
    items.forEach((item, i) => {
      item.classList.toggle('current', i === step);
      item.classList.toggle('done', i < step);
      if (i === step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    });
    document.getElementById('progress-count').textContent = `${String(step + 1).padStart(2, '0')} / 04`;
    document.getElementById('progress-fill').style.width = `${(step + 1) * 25}%`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', String(step + 1));
    backButton.hidden = step === 0;
    nextButton.innerHTML = step === 3 ? 'Revisar respostas <span aria-hidden="true">→</span>' : 'Continuar <span aria-hidden="true">→</span>';
    error.hidden = true;
    if (focus) { window.scrollTo({ top: 0, behavior: 'instant' }); steps[step].querySelector('h2').focus(); }
    saveDraft();
  };
  const validateStep = () => {
    const current = steps[step];
    current.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    const fields = [...current.querySelectorAll('input,textarea,select')].filter(field => !field.disabled);
    const invalid = fields.find(field => !field.checkValidity());
    error.hidden = !invalid;
    if (invalid) { invalid.setAttribute('aria-invalid', 'true'); invalid.focus(); invalid.reportValidity(); return false; }
    return true;
  };
  const section = (title, rows) => ({ title, rows: rows.filter(([, answer]) => answer !== '') });
  const getReviewSections = () => {
    const eventType = value('eventType');
    const music = value('musicChoice');
    const details = {
      Casamento: [['Nome dos noivos', value('coupleNames')], ['Making of no mesmo local?', value('makingSameVenue')], ...(value('makingSameVenue') === 'Não' ? [['Local do making of', value('makingVenue')], ['Início da preparação', value('makingTime')]] : [])],
      Aniversário: [['Nome do aniversariante', value('birthdayName')], ['Idade que irá completar', value('birthdayAge')]],
      Bodas: [['Nome do casal', value('anniversaryNames')], ['Anos de união', value('anniversaryYears')]],
      Formatura: [['Formando ou turma', value('graduateName')], ['Curso ou instituição', value('graduateCourse')]],
      Festa: [['Nome ou ocasião da festa', value('partyName')], ['Anfitrião ou organização', value('partyHost')]],
      'Show ou festival': [['Nome do show ou festival', value('festivalName')], ['Atrações ou momentos principais', value('festivalHighlights')]],
      'Evento corporativo': [['Empresa ou organização', value('companyName')], ['Objetivo do evento', value('corporatePurpose')]],
      'Evento religioso': [['Nome ou ocasião da celebração', value('religiousName')], ['Pessoas ou grupos em destaque', value('religiousPeople')]],
      Outro: [['Tipo de evento', value('otherType')], ['Nome ou pessoa principal', value('otherName')]]
    };
    const date = value('eventDate');
    const formattedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('/') : date;
    return [
      section('01 · Confirmação do evento', [
        ['Tipo de evento', eventType],
        ...(details[eventType] || []),
        ['Data', formattedDate],
        ['Local e endereço', value('eventVenue')],
        ['Horário da cobertura', `${value('coverageStart')} às ${value('coverageEnd')}`]
      ]),
      section('02 · Música e estilo do vídeo', [
        ['Música escolhida?', music],
        ...(music === 'Sim' ? [['Música e artista', value('musicTitle')], ['Link da música', value('musicLink')]] : []),
        ...(music === 'Gostaríamos de receber sugestões' ? [['Estilo musical', value('musicStyle')], ['Música ou estilo a evitar', value('musicAvoid')]] : []),
        ['Estilo de vídeo', value('videoStyle')], ['Paleta de cores do evento', value('colorPalette')], ['Vídeos de referência', value('videoReferences')]
      ]),
      section('03 · Preferências importantes', [
        ['Detalhes a enfatizar', value('importantDetails')], ['Surpresa ou homenagem?', value('hasSurprise')],
        ...(value('hasSurprise') === 'Sim' ? [['Detalhes da surpresa', value('surpriseDescription')], ['Horário aproximado', value('surpriseTime')]] : []),
        ['Pessoa para aparecer mais?', value('featurePerson')],
        ...(value('featurePerson') === 'Sim' ? [['Nome da pessoa', value('featuredName')], ['Relação com o evento', value('featuredRelation')]] : []),
        ['Pessoa que não deve aparecer?', value('avoidPerson')],
        ...(value('avoidPerson') === 'Sim' ? [['Nome ou identificação', value('avoidedDescription')]] : [])
      ]),
      section('04 · Informações finais', [
        ['Regras ou restrições do local', value('venueRules')], ['Situação familiar ou detalhe sensível', value('familyNotes')],
        ['Outras orientações', value('otherNotes')], ['Informações revisadas e confirmadas?', value('reviewConfirmed')]
      ])
    ];
  };
  const buildMessage = sections => ['BRIEFING DE EVENTO — deJesus Films', ...sections.flatMap(group => ['', group.title.toUpperCase(), ...group.rows.map(([label, answer]) => `${label}: ${answer}`)])].join('\n');
  const showReview = () => {
    const sections = getReviewSections();
    const content = document.getElementById('review-content');
    content.replaceChildren();
    sections.forEach(group => {
      const wrapper = document.createElement('section'); wrapper.className = 'review-section';
      const heading = document.createElement('h2'); heading.textContent = group.title; wrapper.append(heading);
      const list = document.createElement('dl');
      group.rows.forEach(([label, answer]) => {
        const row = document.createElement('div'); row.className = 'review-row';
        const term = document.createElement('dt'); term.textContent = label;
        const description = document.createElement('dd'); description.textContent = answer;
        row.append(term, description); list.append(row);
      });
      wrapper.append(list); content.append(wrapper);
    });
    const message = buildMessage(sections);
    document.getElementById('copy-button').dataset.message = message;
    submitStatus.hidden = true;
    formView.hidden = true; reviewView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('review-title').focus();
  };

  form.addEventListener('input', event => { event.target.removeAttribute('aria-invalid'); error.hidden = true; saveDraft(); });
  form.addEventListener('change', () => { syncConditionals(); saveDraft(); });
  nextButton.addEventListener('click', () => { if (!validateStep()) return; if (step < 3) showStep(step + 1); else showReview(); });
  backButton.addEventListener('click', () => showStep(step - 1));
  document.getElementById('edit-button').addEventListener('click', () => { reviewView.hidden = true; formView.hidden = false; showStep(3); });
  document.getElementById('copy-button').addEventListener('click', async event => {
    const status = document.getElementById('copy-status');
    try { await navigator.clipboard.writeText(event.currentTarget.dataset.message); status.textContent = 'Respostas copiadas.'; }
    catch (_) { status.textContent = 'Não foi possível copiar automaticamente neste navegador.'; }
  });
  const setSubmitState = (busy, message = '') => {
    submitButton.disabled = busy;
    submitButton.textContent = busy ? 'Enviando PDF…' : 'Finalizar e enviar';
    submitStatus.textContent = message;
    submitStatus.hidden = !message;
  };
  submitButton.addEventListener('click', async () => {
    if (submitButton.disabled) return;
    setSubmitState(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 60000);
    let data;
    try {
      const response = await fetch('/.netlify/functions/submit-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: getAnswers() }),
        signal: controller.signal
      });
      data = await response.json();
      if (!response.ok || data?.type !== 'sent') throw new Error('Delivery failed');
    } catch (_) {
      setSubmitState(false, 'Não foi possível confirmar o envio. Avisem a deJesus Films antes de tentar novamente.');
      return;
    } finally {
      window.clearTimeout(timeout);
    }
    try {
      if (typeof data.pdfBase64 !== 'string' || !data.pdfBase64.length) throw new Error('Missing PDF');
      pdfBytes = Uint8Array.from(atob(data.pdfBase64), character => character.charCodeAt(0));
      if (String.fromCharCode(...pdfBytes.slice(0, 4)) !== '%PDF') throw new Error('Invalid PDF');
      pdfFileName = String(data.fileName || 'briefing-evento.pdf').replace(/[^a-zA-Z0-9._-]/g, '-');
    } catch (_) {
      pdfBytes = undefined;
      document.getElementById('share-pdf-button').disabled = true;
      document.getElementById('download-pdf-button').disabled = true;
      shareStatus.textContent = 'O envio foi concluído, mas não foi possível preparar a cópia do PDF neste aparelho.';
    }
    try { localStorage.removeItem(draftKey); } catch (_) { /* Storage may be unavailable. */ }
    reviewView.hidden = true;
    successView.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('success-title').focus();
  });
  const downloadPdf = () => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = pdfFileName;
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  document.getElementById('download-pdf-button').addEventListener('click', () => { if (pdfBytes) downloadPdf(); });
  document.getElementById('share-pdf-button').addEventListener('click', async () => {
    if (!pdfBytes) return;
    const file = new File([pdfBytes], pdfFileName, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Briefing de evento' });
        shareStatus.textContent = 'Compartilhamento iniciado. Escolham o WhatsApp e confirmem o contato.';
        return;
      } catch (shareError) {
        if (shareError.name === 'AbortError') { shareStatus.textContent = 'Compartilhamento cancelado.'; return; }
      }
    }
    downloadPdf();
    shareStatus.textContent = 'O PDF foi baixado. Abram o WhatsApp e anexem o arquivo à conversa desejada.';
  });
  document.getElementById('no-share-button').addEventListener('click', () => {
    shareStatus.textContent = 'Tudo certo. O briefing já foi enviado à deJesus Films.';
  });
  document.getElementById('clear-button').addEventListener('click', () => {
    if (!window.confirm('Apagar todas as respostas salvas neste navegador?')) return;
    localStorage.removeItem(draftKey); form.reset(); step = 0; syncConditionals();
    reviewView.hidden = true; formView.hidden = false; showStep(0); localStorage.removeItem(draftKey);
  });
  restoreDraft(); syncConditionals(); showStep(step, false);
})();
