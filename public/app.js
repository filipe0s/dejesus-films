
'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let content;
let lastTrigger;
let heroVideo;
const carouselControllers = new Set();
const dialog = $('#project-dialog');
const menuToggle = $('.menu-toggle');
const navigation = $('#navigation');
function closeMenu() { navigation.classList.remove('is-open'); menuToggle.setAttribute('aria-expanded', 'false'); }
menuToggle.addEventListener('click', () => { const open = menuToggle.getAttribute('aria-expanded') !== 'true'; menuToggle.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); menuToggle.focus(); } });
matchMedia('(min-width: 801px)').addEventListener('change', closeMenu);
function whatsapp(message) { return 'https://wa.me/' + content.site.whatsapp + '?text=' + encodeURIComponent(message); }
function safeMedia(source) {
  if (!source || typeof source !== 'string') return null;
  try { const url = new URL(source, location.href); if (url.origin === location.origin || url.protocol === 'https:') return url.href; } catch (_) {}
  return null;
}
function allMedia() { return [...content.projects, ...(content.serviceExamples || [])]; }
function findProject(id) { return allMedia().find(project => project.id === id); }
function displayCards(group) {
  const real = content.projects.filter(p => p.group === group.id);
  const slots = content.site.preview ? content.previewSlots.filter(p => p.group === group.id && !real.some(project => project.slotId === p.id)).map(p => ({ ...p, temporary: true })) : [];
  return [...real, ...slots].sort((a, b) => (a.order || 0) - (b.order || 0));
}
function renderPortfolio() {
  $('#portfolio-groups').innerHTML = content.groups.map(group => {
    const cards = displayCards(group);
    if (!cards.length) return '';
    return '<article class="portfolio-group" aria-labelledby="group-' + escapeHTML(group.id) + '">' +
      '<div class="group-heading"><div><span class="group-number">' + escapeHTML(group.number) + ' / ' + (cards.every(c => c.temporary) ? 'COMPOSIÇÃO EM PRÉVIA' : 'TRABALHOS') + '</span><h3 id="group-' + escapeHTML(group.id) + '">' + escapeHTML(group.title) + '</h3><p>' + escapeHTML(group.description) + '</p></div>' +
      '<div class="carousel-controls"><button class="arrow-button" data-direction="-1" aria-label="Anterior — ' + escapeHTML(group.title) + '" aria-controls="carousel-' + escapeHTML(group.id) + '">←</button><button class="arrow-button" data-direction="1" aria-label="Próximo — ' + escapeHTML(group.title) + '" aria-controls="carousel-' + escapeHTML(group.id) + '">→</button></div></div>' +
      '<div class="carousel" id="carousel-' + escapeHTML(group.id) + '" tabindex="0" role="region" aria-roledescription="carrossel" aria-label="' + escapeHTML(group.title) + '">' + cards.map((p, index) => {
        const cover = safeMedia(p.cover);
        return '<article class="project-card' + (p.format === '16:9' ? ' landscape-card' : '') + '" aria-label="' + (index + 1) + ' de ' + cards.length + '"><button class="card-button" data-project="' + escapeHTML(p.id) + '" aria-haspopup="dialog" aria-label="' + (p.temporary ? 'Ver espaço temporário: ' : 'Assistir: ') + escapeHTML(p.title) + '"><div class="project-visual visual-' + escapeHTML(p.motif || 'film') + (p.format === '16:9' ? ' landscape' : '') + '">' +
        (cover ? '<img src="' + escapeHTML(cover) + '" alt="' + escapeHTML(p.coverAlt || 'Frame do vídeo fornecido: ' + p.title) + '" loading="lazy" decoding="async">' : '<span class="media-shape" aria-hidden="true"></span>') +
        (p.temporary ? '<span class="temporary-badge">MATERIAL REAL PENDENTE</span>' : '<span class="play-badge" aria-hidden="true">▶</span>') +
        '<div class="visual-meta"><span>' + escapeHTML(p.label || p.service) + '</span><span>' + escapeHTML(p.format) + '</span></div></div><div class="project-info"><h4>' + escapeHTML(p.title) + '<span aria-hidden="true">↗</span></h4><p>' + escapeHTML(p.service) + '</p>' + (p.temporary ? '<p class="preview-action">Espaço temporário · mídia pendente</p>' : '<p class="preview-action">Assistir' + (content.site.preview && p.metadataPending ? ' · identificação provisória' : ' e conhecer o projeto') + '</p>') + '</div></button></article>';
      }).join('') + '</div><div class="carousel-meta"><span class="carousel-position" aria-live="polite"></span><span>ARRASTE OU USE AS SETAS</span></div></article>';
  }).join('');
  $$('.portfolio-group').forEach(setupCarousel);
  $$('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
}
function setupCarousel(group) {
  const track = $('.carousel', group);
  track.addEventListener('dragstart', event => event.preventDefault());
  if (track.id === 'carousel-eventos') { setupEventLoop(group, track); return; }
  const cards = $$('.project-card', track);
  const previous = $('[data-direction="-1"]', group);
  const next = $('[data-direction="1"]', group);
  const positions = () => { const left = track.getBoundingClientRect().left; return cards.map(card => card.getBoundingClientRect().left - left + track.scrollLeft - 2); };
  const update = () => {
    const end = Math.max(0, track.scrollWidth - track.clientWidth);
    previous.disabled = track.scrollLeft <= 3;
    next.disabled = track.scrollLeft >= end - 3;
    $('.carousel-controls', group).hidden = end < 4;
    const distances = positions().map(left => Math.abs(left - track.scrollLeft));
    const index = distances.indexOf(Math.min(...distances)) + 1;
    $('.carousel-position', group).textContent = String(index).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
  };
  const move = direction => {
    const points = positions();
    const position = direction > 0 ? points.find(left => left > track.scrollLeft + 8) : points.filter(left => left < track.scrollLeft - 8).at(-1);
    const end = Math.max(0, track.scrollWidth - track.clientWidth);
    track.scrollTo({left: Math.max(0, Math.min(position ?? (direction > 0 ? end : 0), end)), behavior: reducedMotion() ? 'instant' : 'smooth'});
  };
  previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: reducedMotion() ? 'instant' : 'smooth' }); } });
  track.addEventListener('scroll', update, { passive: true }); new ResizeObserver(update).observe(track);
  let start = null; let suppressClick = false;
  track.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse' || event.button !== 0) return; start = { x: event.clientX, scroll: track.scrollLeft, id: event.pointerId }; suppressClick = false; });
  track.addEventListener('pointermove', event => { if (!start) return; const distance = event.clientX - start.x; if (Math.abs(distance) > 7) { suppressClick = true; track.classList.add('dragging'); track.setPointerCapture(start.id); track.scrollLeft = start.scroll - distance; } });
  const endDrag = () => { start = null; track.classList.remove('dragging'); };
  track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag); track.addEventListener('lostpointercapture', endDrag);
  track.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
  update();
}

function setupEventLoop(group, track) {
  const originals = $$('.project-card', track);
  if (originals.length < 2) return;
  track.classList.add('events-loop');
  const cloneCard = card => {
    const clone = card.cloneNode(true); clone.classList.add('carousel-clone'); clone.setAttribute('aria-hidden', 'true');
    $$('button,a,[tabindex]', clone).forEach(control => control.tabIndex = -1);
    return clone;
  };
  const before = originals.map(cloneCard), after = originals.map(cloneCard);
  track.prepend(...before); track.append(...after);
  const previous = $('[data-direction="-1"]', group), next = $('[data-direction="1"]', group);
  const toggle = document.createElement('button'); toggle.className = 'arrow-button carousel-toggle'; toggle.type = 'button'; toggle.textContent = 'Ⅱ';
  toggle.setAttribute('aria-label', 'Pausar carrossel'); toggle.setAttribute('aria-pressed', 'false'); $('.carousel-controls', group).append(toggle);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 3000;
  let start = 0, cycle = 0, initialized = false, held = false, visible = false, userPaused = false;
  let nextAt = performance.now() + interval, animation = null, drag = null, suppressClick = false, userScrollUntil = 0;
  const relativeLeft = card => card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - parseFloat(getComputedStyle(track).paddingLeft || 0);
  const setPosition = position => { track.scrollLeft = position; };
  const normalize = () => {
    if (!cycle || held || animation) return;
    const left = track.scrollLeft, normalized = start + ((left - start) % cycle + cycle) % cycle;
    if (Math.abs(left - normalized) > 1) setPosition(normalized);
  };
  const update = () => {
    const left = start + ((track.scrollLeft - start) % (cycle || 1) + (cycle || 1)) % (cycle || 1);
    const distances = originals.map(card => Math.abs(relativeLeft(card) - left));
    const index = distances.indexOf(Math.min(...distances)) + 1, counter = $('.carousel-position', group);
    const value = String(index).padStart(2, '0') + ' / ' + String(originals.length).padStart(2, '0');
    if (counter.textContent !== value) counter.textContent = value;
    previous.disabled = false; next.disabled = false; $('.carousel-controls', group).hidden = false;
  };
  const interact = () => { nextAt = performance.now() + interval; };
  const measure = () => {
    const progress = initialized && cycle ? ((track.scrollLeft - start) % cycle + cycle) % cycle / cycle : 0;
    animation = null; start = relativeLeft(originals[0]); cycle = relativeLeft(after[0]) - start;
    if (!cycle) return;
    setPosition(start + progress * cycle); initialized = true; interact(); update();
  };
  const moveTo = (target, manual = true) => {
    if (manual) interact();
    if (motion.matches) { setPosition(target); normalize(); update(); }
    else animation = {from: track.scrollLeft, to: target, at: performance.now(), duration: 650, manual};
  };
  const move = (direction, manual = true) => {
    const points = $$('.project-card', track).map(relativeLeft);
    const target = direction > 0 ? points.find(left => left > track.scrollLeft + 8) : points.filter(left => left < track.scrollLeft - 8).at(-1);
    moveTo(target ?? (direction > 0 ? start + cycle : start), manual);
  };
  previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  toggle.addEventListener('click', () => {
    userPaused = !userPaused; toggle.textContent = userPaused ? '▶' : 'Ⅱ'; toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? 'Reproduzir carrossel' : 'Pausar carrossel'); animation = null; interact();
  });
  track.addEventListener('keydown', event => {
    if (['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) {
      event.preventDefault(); if (event.key === 'Home') moveTo(start); else if (event.key === 'End') moveTo(relativeLeft(originals.at(-1))); else move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  // Foco ou ponteiro parado não bloqueiam indefinidamente a próxima troca.
  group.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') interact(); }, {passive: true});
  group.addEventListener('focusin', interact);
  track.addEventListener('wheel', () => { animation = null; userScrollUntil = performance.now() + 1200; interact(); }, {passive: true});
  track.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    held = true; animation = null; suppressClick = false; interact();
    if (event.pointerType === 'mouse') drag = {x: event.clientX, scroll: track.scrollLeft, id: event.pointerId};
  });
  track.addEventListener('pointermove', event => {
    if (!drag) return; const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 7) { suppressClick = true; track.classList.add('dragging'); track.setPointerCapture(drag.id); setPosition(drag.scroll - distance); }
  });
  const release = () => { held = false; drag = null; track.classList.remove('dragging'); normalize(); userScrollUntil = performance.now() + 1200; interact(); update(); };
  track.addEventListener('pointerup', release); track.addEventListener('pointercancel', release); track.addEventListener('lostpointercapture', release);
  window.addEventListener('pointerup', () => { if (held) release(); });
  track.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
  track.addEventListener('scroll', () => { normalize(); update(); if (!animation && performance.now() < userScrollUntil) interact(); }, {passive: true});
  new ResizeObserver(measure).observe(track);
  new IntersectionObserver(entries => { const nowVisible = entries.some(entry => entry.isIntersecting); if (nowVisible && !visible) interact(); visible = nowVisible; }, {threshold: 0.1}).observe(track);
  const motionChanged = () => { toggle.hidden = motion.matches; animation = null; interact(); };
  motion.addEventListener('change', motionChanged); motionChanged();
  carouselControllers.add({pause: () => { animation = null; interact(); }, resume: interact});
  document.addEventListener('visibilitychange', interact);
  const tick = time => {
    if (animation) {
      const progress = Math.min(1, (time - animation.at) / animation.duration), eased = 1 - Math.pow(1 - progress, 3);
      setPosition(animation.from + (animation.to - animation.from) * eased);
      if (progress >= 1) { const manual = animation.manual; animation = null; normalize(); if (manual) interact(); }
    } else if (initialized && visible && !motion.matches && !held && !userPaused && !dialog.open && !document.hidden && time >= nextAt) {
      nextAt = time + interval; move(1, false);
    }
    requestAnimationFrame(tick);
  };
  measure(); requestAnimationFrame(tick);
}

function renderServices() {
  $('#services-list').innerHTML = content.services.map((service, index) => {
    const example = findProject(service.exampleProjectId);
    const cover = safeMedia(example?.cover);
    const thumbnail = example ? '<button class="service-example example-button" data-project="' + escapeHTML(example.id) + '" aria-haspopup="dialog" aria-label="Assistir exemplo de ' + escapeHTML(service.name) + '">' + (cover ? '<img src="' + escapeHTML(cover) + '" alt="Frame do exemplo de ' + escapeHTML(service.name) + '" loading="lazy" decoding="async">' : '') + '<span class="play-badge" aria-hidden="true">▶</span><span class="example-caption">VER EXEMPLO</span></button>' : '';
    return '<article class="service-row"><div class="service-content"><div class="service-heading"><div class="service-title-line"><span class="service-number">' + String(index + 1).padStart(2, '0') + '</span><h3>' + escapeHTML(service.name) + '</h3></div><p class="service-audience">' + escapeHTML(service.audience) + '</p></div><div class="service-description"><p>' + escapeHTML(service.description) + '</p><p class="service-delivery">' + escapeHTML(service.delivery) + '</p><div class="service-tags">' + service.tags.map(t => '<span>' + escapeHTML(t) + '</span>').join('') + '</div>' + (!example && content.site.preview ? '<span class="pending-example">PRÉVIA · exemplo real pendente</span>' : '') + '</div>' + thumbnail + '<a class="service-cta" href="' + escapeHTML(whatsapp(service.message)) + '" target="_blank" rel="noopener noreferrer">Conversar sobre o serviço <span aria-hidden="true">↗</span></a></div></article>';
  }).join('');
  $$('.example-button').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project, button)));
}
function missingMedia(temporary, message) {
  return '<div class="missing-media"><span class="empty-frame" aria-hidden="true"></span><strong>' + (temporary ? 'Material real pendente' : 'Não foi possível carregar a mídia') + '</strong><p>' + escapeHTML(message || (temporary ? 'Este espaço aguarda um vídeo real. Você pode conhecer os trabalhos enviados nos outros cartões.' : 'Tente reabrir o vídeo ou converse com Filipe pelo WhatsApp.')) + '</p></div>';
}
function openProject(id, trigger) {
  const realProject = findProject(id);
  const p = realProject || (content.site.preview ? content.previewSlots.find(p => p.id === id) : null);
  if (!p) return;
  const temporary = !realProject;
  lastTrigger = trigger?.closest('.carousel-clone') ? $$('.card-button', trigger.closest('.carousel')).find(button => button.dataset.project === id && !button.closest('.carousel-clone')) || trigger : trigger;
  carouselControllers.forEach(controller => controller.pause());
  $$('video').forEach(video => { if (video !== heroVideo) video.pause(); });
  const group = content.groups.find(g => g.id === p.group);
  const category = group?.title || 'Exemplo de serviço';
  $('#dialog-category').textContent = (temporary ? 'PRÉVIA TEMPORÁRIA / ' : '') + category;
  $('#dialog-title').textContent = p.title;
  $('#dialog-description').textContent = p.description + (content.site.preview && p.metadataPending ? ' Identificação provisória: nome do trabalho, cliente e participação de Filipe ainda não informados.' : '');
  const details = [['Serviço', p.service], ['Formato', p.format], ['Cliente', p.client], ['Participação de Filipe', p.role], ['Entrega', p.deliveryPhase === 'during' ? 'Durante o evento' : p.deliveryPhase === 'after' ? 'Editado após o evento' : null]];
  $('#dialog-details').innerHTML = details.filter(([, value]) => value).map(([label, value]) => '<dt>' + escapeHTML(label) + '</dt><dd>' + escapeHTML(value) + '</dd>').join('');
  $('#dialog-contact').href = whatsapp(temporary ? content.contactMessages[p.group] : p.serviceId ? content.services.find(service => service.id === p.serviceId).message : 'Olá, Filipe! Vi o vídeo “' + p.title + '” no seu portfólio e quero conversar sobre uma produção semelhante.');
  const media = $('#dialog-media'); $$('video', media).forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); }); media.replaceChildren();
  media.classList.toggle('portrait-media', p.format === '9:16');
  const source = safeMedia(p.media?.src);
  if (temporary || !source) { media.innerHTML = missingMedia(temporary); }
  else if (p.media.type === 'video') {
    const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.muted = false; video.defaultMuted = false; video.volume = 1; video.removeAttribute('muted'); video.src = source;
    if (safeMedia(p.cover)) video.poster = safeMedia(p.cover);
    video.setAttribute('aria-label', p.title);
    video.addEventListener('error', () => { video.pause(); if (media.contains(video)) media.innerHTML = missingMedia(false); }, { once: true });
    media.append(video);
  } else if (p.media.type === 'image') {
    const image = document.createElement('img'); image.src = source; image.alt = p.media.alt || p.title; image.addEventListener('error', () => { media.innerHTML = missingMedia(false); }, { once: true }); media.append(image);
  } else if (p.media.type === 'embed') {
    const url = new URL(source); const valid = (url.hostname === 'www.youtube-nocookie.com' && url.pathname.startsWith('/embed/')) || (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/'));
    if (valid) { const iframe = document.createElement('iframe'); iframe.src = source; iframe.title = p.title; iframe.allow = 'fullscreen; picture-in-picture'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin'; media.append(iframe); const fallback = document.createElement('p'); fallback.textContent = 'Se o vídeo não carregar, converse com Filipe pelo WhatsApp.'; media.style.flexDirection = 'column'; media.append(fallback); }
    else media.innerHTML = missingMedia(false);
  } else media.innerHTML = missingMedia(false);
  document.body.classList.add('modal-open'); if (!dialog.open) dialog.showModal(); $('.close-dialog', dialog).focus();
  $('video', media)?.play().catch(() => {});
}
function cleanupDialog() {
  const media = $('#dialog-media'); $$('video', media).forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); }); media.replaceChildren(); media.style.flexDirection = ''; document.body.classList.remove('modal-open'); if (lastTrigger?.isConnected) lastTrigger.focus(); carouselControllers.forEach(controller => controller.resume());
}
function pauseDialogVideos() { $$('video', $('#dialog-media')).forEach(video => video.pause()); }
function closeProject() { pauseDialogVideos(); dialog.close(); }
$('.close-dialog', dialog).addEventListener('click', closeProject);
dialog.addEventListener('cancel', pauseDialogVideos);
dialog.addEventListener('close', cleanupDialog);
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeProject(); } });
document.addEventListener('play', event => {
  if (event.target instanceof HTMLVideoElement && event.target !== heroVideo) $$('video').forEach(video => { if (video !== event.target && video !== heroVideo) video.pause(); });
}, true);
const sectionObserver = new IntersectionObserver(entries => { const entry = entries.find(e => e.isIntersecting); if (entry) $$('#navigation a[href^="#"]').forEach(link => { if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); }, { rootMargin: '-15% 0px -55% 0px' });
$$('main section[id]').forEach(section => sectionObserver.observe(section));

function initializeShowreel() {
  const showreel = content.site.showreel, poster = safeMedia(showreel.poster);
  const mobile = matchMedia('(max-width: 800px)');
  let fallbackImage, userPaused = false, failed = false;
  if (poster) {
    const image = document.createElement('img'); image.src = poster; image.alt = ''; image.className = 'hero-poster'; image.setAttribute('aria-hidden', 'true'); image.fetchPriority = 'high'; fallbackImage = image; $('.hero').prepend(image);
  }
  heroVideo = document.createElement('video'); heroVideo.muted = true; heroVideo.defaultMuted = true; heroVideo.volume = 0; heroVideo.setAttribute('muted', ''); heroVideo.autoplay = true; heroVideo.loop = true; heroVideo.playsInline = true; heroVideo.preload = 'metadata'; heroVideo.hidden = true; heroVideo.poster = poster || ''; heroVideo.className = 'hero-video'; heroVideo.setAttribute('aria-hidden', 'true');
  const keepSilent = () => { if (!heroVideo.muted) heroVideo.muted = true; if (heroVideo.volume !== 0) heroVideo.volume = 0; };
  const play = () => { keepSilent(); if (!userPaused && !failed) heroVideo.play().catch(() => {}); };
  heroVideo.addEventListener('volumechange', keepSilent); heroVideo.addEventListener('play', keepSilent);
  $('.hero').prepend(heroVideo); $('.temporary-note')?.remove();
  const control = document.createElement('button'); control.className = 'showreel-control'; control.textContent = 'Reproduzir showreel'; control.setAttribute('aria-pressed', 'false');
  control.addEventListener('click', () => { userPaused = !heroVideo.paused; heroVideo.autoplay = !userPaused; control.setAttribute('aria-pressed', String(userPaused)); if (userPaused) heroVideo.pause(); else play(); }); $('.hero-bottom').append(control);
  heroVideo.addEventListener('play', () => { control.textContent = 'Pausar showreel'; });
  heroVideo.addEventListener('playing', () => { heroVideo.hidden = false; if (fallbackImage) fallbackImage.hidden = true; });
  heroVideo.addEventListener('pause', () => { control.textContent = 'Reproduzir showreel'; });
  heroVideo.addEventListener('ended', () => { if (!userPaused && !failed) { heroVideo.currentTime = 0; play(); } });
  heroVideo.addEventListener('error', () => { failed = true; heroVideo.pause(); heroVideo.hidden = true; if (fallbackImage) fallbackImage.hidden = false; control.hidden = true; });
  const selectSource = () => {
    failed = false; control.hidden = false; heroVideo.autoplay = !userPaused; heroVideo.src = safeMedia(mobile.matches && showreel.mobileSrc ? showreel.mobileSrc : showreel.src); heroVideo.load(); play();
  };
  mobile.addEventListener('change', selectSource); selectSource();
}

async function initialize() {
  try {
    const response = await fetch('data/portfolio.json'); if (!response.ok) throw new Error('Dados indisponíveis'); content = await response.json();
    if (!/^\d{12,13}$/.test(content.site.whatsapp)) throw new Error('WhatsApp inválido');
    $$('[data-contact]').forEach(link => { link.href = whatsapp(content.contactMessages[link.dataset.contact] || content.contactMessages.geral); });
    $$('a[href^="https://wa.me/"]:not([data-contact])').forEach(link => { link.href = whatsapp(content.contactMessages.geral); });
    renderPortfolio(); renderServices();
    if (!content.site.preview) { $('#preview-banner')?.remove(); $$('.temporary-note,.footer-preview').forEach(el => el.remove()); $('meta[name="robots"]').content = 'index, follow'; }
    else { const missing = []; if (!content.site.showreel) missing.push('vídeo de abertura'); if (content.previewSlots.some(slot => !content.projects.some(project => project.slotId === slot.id))) missing.push('institucional'); if (!content.site.portrait) missing.push('foto'); $('#preview-banner p').textContent = allMedia().length + ' vídeos reais incorporados. Identificações dos trabalhos provisórias. Ainda pendentes: ' + missing.join(', ') + '.'; }
    if (safeMedia(content.site.portrait?.src)) {
      const image = document.createElement('img'); image.src = safeMedia(content.site.portrait.src); image.alt = content.site.portrait.alt || 'Filipe de Jesus'; image.className = 'about-portrait'; image.width = 1000; image.height = 1776; image.loading = 'lazy'; image.decoding = 'async'; $('.about-photo').append(image);
    }
    if (safeMedia(content.site.showreel?.src)) initializeShowreel();
  } catch (error) {
    console.error(error); $('#portfolio-groups').innerHTML = '<p>Não foi possível carregar o portfólio. Entre em contato pelo WhatsApp para conhecer os trabalhos.</p>'; $('#site-status').textContent = 'Não foi possível carregar os dados. Os contatos de WhatsApp continuam disponíveis.';
  }
}
initialize();
