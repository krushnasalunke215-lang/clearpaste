/* ClearPaste UI. */
(function () {
  'use strict';

  const Engine = window.ClearPasteEngine;
  const AI = window.ClearPasteAI;
  const SAMPLES = window.ClearPasteSamples;

  const $ = (id) => document.getElementById(id);
  const els = {
    input: $('input'), inputWrap: $('inputWrap'), pasteBtn: $('pasteBtn'), clearBtn: $('clearBtn'), charCount: $('charCount'),
    language: $('language'), runBtn: $('runBtn'), status: $('status'), how: $('how'), results: $('results'),
    resultsTitle: $('resultsTitle'), docBadge: $('docBadge'), sourceBadge: $('sourceBadge'), readability: $('readability'),
    layout: $('layout'), summary: $('summary'), warnings: $('warnings'), actions: $('actions'),
    actionsCount: $('actionsCount'), actionsBar: $('actionsBar'), dates: $('dates'),
    money: $('money'), documents: $('documents'), medicines: $('medicines'), contacts: $('contacts'),
    plain: $('plain'), original: $('original'), plainHint: $('plainHint'), compare: $('compare'), viewTabs: $('viewTabs'),
    glossary: $('glossary'), glossaryCount: $('glossaryCount'),
    speakBtn: $('speakBtn'), rate: $('rate'), copyBtn: $('copyBtn'), downloadBtn: $('downloadBtn'), printBtn: $('printBtn'),
    settings: $('settings'), settingsForm: $('settingsForm'), apiKey: $('apiKey'), model: $('model'),
    forgetKey: $('forgetKey'), openSettings: $('openSettings'), toast: $('toast'),
    fontUp: $('fontUp'), fontDown: $('fontDown'), toggleDyslexia: $('toggleDyslexia'), toggleContrast: $('toggleContrast'),
  };

  // Language name -> BCP 47 code for speech.
  const LANG_CODES = {
    English: 'en-IN', Hindi: 'hi-IN', Bengali: 'bn-IN', Marathi: 'mr-IN', Telugu: 'te-IN', Tamil: 'ta-IN',
    Gujarati: 'gu-IN', Kannada: 'kn-IN', Malayalam: 'ml-IN', Punjabi: 'pa-IN', Odia: 'or-IN', Urdu: 'ur-IN',
    Spanish: 'es-ES', French: 'fr-FR', Arabic: 'ar-SA', Portuguese: 'pt-BR', Swahili: 'sw-KE',
  };

  const SIDE_CARDS = ['warningsCard', 'datesCard', 'moneyCard', 'documentsCard', 'medicinesCard', 'contactsCard'];

  // ---------------------------------------------------------------------------
  // Preferences (saved in localStorage)
  // ---------------------------------------------------------------------------
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('clearpaste.' + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('clearpaste.' + key, JSON.stringify(value)); } catch (_) { /* private mode */ }
    },
    remove(key) {
      try { localStorage.removeItem('clearpaste.' + key); } catch (_) { /* ignore */ }
    },
  };

  const prefs = {
    scale: store.get('scale', 1),
    dyslexia: store.get('dyslexia', false),
    contrast: store.get('contrast', false),
    language: store.get('language', 'English'),
    mode: store.get('mode', 'local'),
    model: store.get('model', AI.DEFAULT_MODEL),
    apiKey: store.get('apiKey', ''),
  };

  function applyView() {
    document.documentElement.style.setProperty('--scale', prefs.scale);
    document.documentElement.classList.toggle('dyslexia', prefs.dyslexia);
    document.documentElement.classList.toggle('contrast', prefs.contrast);
    els.toggleDyslexia.setAttribute('aria-pressed', String(prefs.dyslexia));
    els.toggleContrast.setAttribute('aria-pressed', String(prefs.contrast));
  }

  function setScale(delta) {
    prefs.scale = Math.round(Math.min(1.6, Math.max(0.85, prefs.scale + delta)) * 100) / 100;
    store.set('scale', prefs.scale);
    applyView();
    toast('Text size ' + Math.round(prefs.scale * 100) + '%');
  }

  // ---------------------------------------------------------------------------
  // Small DOM helpers. All user and AI text is inserted with textContent.
  // ---------------------------------------------------------------------------
  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === 'text') node.textContent = v;
        else if (k === 'class') node.className = v;
        else node.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => node.append(c));
    return node;
  }

  function setStatus(msg, kind) {
    els.status.textContent = msg || '';
    els.status.className = 'status' + (kind ? ' ' + kind : '');
  }

  let toastTimer = null;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }

  function setLabel(btn, text) {
    const label = btn.querySelector('span') || btn;
    label.textContent = text;
  }

  function setIcon(btn, id) {
    const use = btn.querySelector('use');
    if (use) use.setAttribute('href', '#' + id);
  }

  function countWords(text) {
    const m = text.trim().match(/\S+/g);
    return m ? m.length : 0;
  }

  function updateCount() {
    const n = countWords(els.input.value);
    els.charCount.textContent = n === 1 ? '1 word' : n + ' words';
    els.inputWrap.classList.toggle('has-text', els.input.value.length > 0);
  }

  function getMode() {
    return document.querySelector('input[name="mode"]:checked').value;
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function fillList(ul, items, { checklist = false, render } = {}) {
    ul.replaceChildren();
    const card = ul.closest('.card');
    if (!items || !items.length) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    for (const item of items) {
      const content = render ? render(item) : document.createTextNode(String(item));
      if (checklist) {
        const box = el('input', { type: 'checkbox' });
        ul.append(el('li', null, [el('label', null, [box, el('span', null, [content])])]));
      } else {
        ul.append(el('li', null, [content]));
      }
    }
  }

  function icon(id) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'i');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#' + id);
    svg.append(use);
    return svg;
  }

  // Contacts become tap-to-call / tap-to-email / open-link buttons.
  function contactNode(text) {
    const t = String(text).trim();
    const label = t.match(/\s*\((emergency|helpline)\)$/i);
    const value = label ? t.slice(0, label.index) : t;
    const digits = value.replace(/[^\d+]/g, '');
    const tagged = (a) => {
      if (label) a.append(el('span', { class: 'contact-tag' + (/emergency/i.test(label[1]) ? ' urgent' : ''), text: label[1] }));
      return a;
    };
    if (/^\S+@\S+\.\S+$/.test(value)) {
      return el('a', { class: 'contact', href: 'mailto:' + value }, [icon('i-mail'), el('span', { text: value })]);
    }
    if (/^(https?:\/\/|www\.)\S+$/i.test(value)) {
      return el('a', { class: 'contact', href: /^https?:/i.test(value) ? value : 'https://' + value, target: '_blank', rel: 'noopener' },
        [icon('i-globe'), el('span', { text: value.replace(/^https?:\/\//i, '') })]);
    }
    if (digits.replace('+', '').length >= 3 && /^[\d\s+()-]+$/.test(value)) {
      return tagged(el('a', { class: 'contact', href: 'tel:' + digits }, [icon('i-phone'), el('span', { text: value })]));
    }
    return document.createTextNode(t);
  }

  // "Tab. Metformin 500 mg twice a day after food" -> name + how to take it.
  function medicineNode(text) {
    const m = String(text).match(/^(.*?\d+(?:\.\d+)?\s?(?:mg|mcg|µg|ml|gm|g|iu|units?))\b\s*(.*)$/i);
    if (!m || !m[2]) return el('div', null, [el('strong', { text: String(text) })]);
    return el('div', null, [el('strong', { text: m[1] }), el('span', { text: m[2].charAt(0).toUpperCase() + m[2].slice(1) })]);
  }

  function renderReadability(r) {
    els.readability.replaceChildren();
    if (!r || !r.before || !r.after || !r.before.words) return;
    const item = (cls, title, data) => el('div', { class: 'rl-item ' + cls }, [
      el('span', { class: 'rl-grade', text: String(data.grade), title: 'US school grade level' }),
      el('div', { class: 'rl-text' }, [el('small', { text: title }), el('strong', { text: data.label })]),
    ]);
    const drop = Math.max(0, Math.round((r.before.grade - r.after.grade) * 10) / 10);
    els.readability.append(
      item('before', 'Original', r.before),
      el('span', { class: 'rl-arrow', 'aria-hidden': 'true', text: '→' }),
      item('after', 'Plain version', r.after),
      el('div', { class: 'rl-gain' }, [
        el('strong', { text: drop > 0 ? `${drop} grades easier to read` : 'Reading level checked' }),
        el('span', { text: 'Reading level by school grade (Flesch-Kincaid)' }),
      ])
    );
  }

  function renderPlain(result) {
    els.plain.replaceChildren();
    if (Array.isArray(result.plain)) {
      // Local result: paragraphs made of parts, changed words are highlighted.
      for (const parts of result.plain) {
        const p = el('p');
        for (const part of parts) {
          if (part.orig) {
            p.append(el('mark', { class: 'swap', title: 'Original: ' + part.orig, tabindex: '0', 'aria-label': part.t + ' (original: ' + part.orig + ')', text: part.t }));
          } else {
            p.append(document.createTextNode(part.t));
          }
        }
        els.plain.append(p);
      }
      els.plainHint.hidden = false;
    } else {
      for (const para of String(result.plainText || '').split(/\n\s*\n/)) {
        if (para.trim()) els.plain.append(el('p', { text: para.trim() }));
      }
      els.plainHint.hidden = true;
    }
  }

  function renderOriginal(text) {
    els.original.replaceChildren();
    for (const para of Engine.toParagraphs(text)) els.original.append(el('p', { text: para }));
  }

  function setView(view) {
    els.viewTabs.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.view === view)));
    els.plain.hidden = view === 'original';
    els.original.hidden = view === 'plain';
    els.compare.classList.toggle('side', view === 'side');
    els.plainHint.classList.toggle('sr-only', view === 'original');
  }

  function updateProgress() {
    const boxes = els.actions.querySelectorAll('input[type="checkbox"]');
    const done = Array.from(boxes).filter((b) => b.checked).length;
    const total = boxes.length;
    els.actionsCount.textContent = total ? (done === total ? 'All done!' : `${done} of ${total} done`) : '';
    els.actionsBar.style.width = total ? (done / total) * 100 + '%' : '0';
  }

  let lastResult = null;

  function render(result, inputText) {
    lastResult = result;

    els.docBadge.textContent = result.docType;
    els.sourceBadge.textContent = result.source === 'ai'
      ? `AI · ${result.language}`
      : 'Offline · English';

    renderReadability(result.readability);

    els.summary.replaceChildren();
    const summary = result.summary.length ? result.summary : ['We could not find a clear summary. Read the plain version below.'];
    summary.forEach((s) => els.summary.append(el('p', { text: s })));

    fillList(els.warnings, result.warnings);
    fillList(els.actions, result.actions, { checklist: true });
    fillList(els.dates, result.dates, {
      render: (d) => el('div', null, [el('strong', { text: d.when }), el('span', { text: d.what || '' })]),
    });
    fillList(els.money, result.money, {
      render: (m) => el('div', null, [el('strong', { text: m.amount }), el('span', { text: m.what || '' })]),
    });
    fillList(els.documents, result.documents, { checklist: true });
    fillList(els.medicines, result.medicines, { render: medicineNode });
    fillList(els.contacts, result.contacts, { render: contactNode });
    updateProgress();

    els.layout.classList.toggle('no-side', SIDE_CARDS.every((id) => $(id).hidden));

    renderPlain(result);
    renderOriginal(inputText);
    setView('plain');

    els.glossary.replaceChildren();
    $('glossaryCard').hidden = !result.glossary.length;
    els.glossaryCount.textContent = String(result.glossary.length);
    for (const g of result.glossary) {
      els.glossary.append(el('div', null, [el('dt', { text: g.term }), el('dd', { text: g.meaning })]));
    }

    els.how.hidden = true;
    els.results.hidden = false;
    els.resultsTitle.focus({ preventScroll: true });
    els.results.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  // ---------------------------------------------------------------------------
  // Running
  // ---------------------------------------------------------------------------
  let busy = false;

  function setBusy(on, label) {
    busy = on;
    els.runBtn.disabled = on;
    els.runBtn.classList.toggle('loading', on);
    setLabel(els.runBtn, on ? (label || 'Working…') : 'Make it clear');
  }

  async function run() {
    const text = els.input.value.trim();
    if (!text) {
      setStatus('Paste or type some text first.', 'error');
      els.input.focus();
      return;
    }
    if (busy) return;
    stopSpeaking();

    const mode = getMode();
    const language = els.language.value;

    if (mode === 'ai' && !prefs.apiKey) {
      setStatus('AI mode needs a Gemini API key. Add it in Settings, or switch to Offline.', 'error');
      openSettings();
      return;
    }

    setBusy(true, mode === 'ai' ? 'Asking AI…' : 'Working…');

    try {
      if (mode === 'ai') {
        setStatus('Asking the AI to explain this in ' + language + '…', 'busy');
        try {
          const result = await AI.analyze(text, { apiKey: prefs.apiKey, model: prefs.model, language });
          if (language === 'English') {
            result.readability = { before: Engine.readability(text), after: Engine.readability(result.plainText) };
          }
          render(result, text);
          setStatus('Done. Explained in ' + language + '.');
        } catch (err) {
          const local = Engine.analyze(text);
          render(local, text);
          setStatus(err.message + ' Showing the offline version instead.', 'error');
          toast('AI failed. Showing the offline version.');
        }
      } else {
        const result = Engine.analyze(text);
        render(result, text);
        setStatus(language === 'English'
          ? ''
          : 'Offline mode explains in English only. Switch to AI mode for ' + language + '.');
      }
    } catch (err) {
      setStatus(err.message || 'Something went wrong.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function loadText(text, autoRun) {
    els.input.value = text;
    updateCount();
    if (autoRun && text.trim()) run();
  }

  // ---------------------------------------------------------------------------
  // Read aloud (Web Speech API)
  // ---------------------------------------------------------------------------
  const synth = window.speechSynthesis;
  let speaking = false;

  function pickVoice(code) {
    if (!synth) return null;
    const voices = synth.getVoices();
    const base = code.split('-')[0];
    return voices.find((v) => v.lang === code)
      || voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(base))
      || null;
  }

  function speechChunks(result) {
    const chunks = [];
    const add = (card, label, items) => {
      if (items && items.length) chunks.push({ card, text: label + '. ' + items.join(' ') });
    };
    add('summaryCard', 'In short', result.summary);
    add('warningsCard', 'Be careful', result.warnings);
    add('actionsCard', 'What you need to do', result.actions.map((a, i) => `Step ${i + 1}. ${a}`));
    add('datesCard', 'Dates', result.dates.map((d) => `${d.when}: ${d.what}`));
    add('moneyCard', 'Money', result.money.map((m) => `${m.amount}: ${m.what}`));
    add('documentsCard', 'Keep these ready', result.documents.map((d) => d + '.'));
    add('medicinesCard', 'Medicines', result.medicines.map((m) => m + '.'));
    return chunks;
  }

  function clearSpeakingMarks() {
    document.querySelectorAll('.speaking').forEach((n) => n.classList.remove('speaking'));
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
    speaking = false;
    clearSpeakingMarks();
    setLabel(els.speakBtn, 'Read aloud');
    setIcon(els.speakBtn, 'i-volume');
    els.speakBtn.setAttribute('aria-pressed', 'false');
  }

  function speak() {
    if (!synth) {
      toast('Your browser does not support reading aloud.');
      return;
    }
    if (speaking) {
      stopSpeaking();
      return;
    }
    if (!lastResult) return;

    const code = LANG_CODES[lastResult.language] || 'en-IN';
    const voice = pickVoice(code);
    if (!voice && lastResult.language !== 'English') {
      toast(`No ${lastResult.language} voice on this device. Using the default voice.`);
    }

    const chunks = speechChunks(lastResult);
    if (!chunks.length) return;
    synth.cancel();
    speaking = true;
    setLabel(els.speakBtn, 'Stop');
    setIcon(els.speakBtn, 'i-stop');
    els.speakBtn.setAttribute('aria-pressed', 'true');

    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk.text);
      u.lang = code;
      if (voice) u.voice = voice;
      u.rate = parseFloat(els.rate.value) || 0.9;
      u.onstart = () => {
        clearSpeakingMarks();
        const card = $(chunk.card);
        if (card) {
          card.classList.add('speaking');
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };
      if (i === chunks.length - 1) u.onend = stopSpeaking;
      u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') stopSpeaking(); };
      synth.speak(u);
    });
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------
  function reportText(r) {
    const lines = [];
    const section = (title, items) => {
      if (!items || !items.length) return;
      lines.push('', title.toUpperCase());
      items.forEach((x) => lines.push('- ' + x));
    };
    lines.push('ClearPaste: ' + r.docType);
    section('In short', r.summary);
    section('Be careful', r.warnings);
    section('What you need to do', r.actions.map((a) => '[ ] ' + a));
    section('Dates and deadlines', r.dates.map((d) => `${d.when}: ${d.what}`));
    section('Money', r.money.map((m) => `${m.amount}: ${m.what}`));
    section('Keep these ready', r.documents.map((d) => '[ ] ' + d));
    section('Medicines', r.medicines);
    section('Who to contact', r.contacts);
    lines.push('', 'PLAIN VERSION', r.plainText);
    if (r.glossary.length) {
      lines.push('', 'HARD WORDS EXPLAINED');
      r.glossary.forEach((g) => lines.push(`- ${g.term}: ${g.meaning}`));
    }
    lines.push('', 'This is not legal, medical or financial advice. Check important details with the sender.');
    return lines.join('\n');
  }

  async function copyReport() {
    if (!lastResult) return;
    const text = reportText(lastResult);
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied. Paste it into WhatsApp, email or notes.');
    } catch (_) {
      const ta = el('textarea');
      ta.value = text;
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      toast(ok ? 'Copied.' : 'Could not copy. Use Download instead.');
    }
  }

  function downloadReport() {
    if (!lastResult) return;
    const blob = new Blob([reportText(lastResult)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: 'clearpaste-' + lastResult.docType.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Downloaded as a text file.');
  }

  // ---------------------------------------------------------------------------
  // Settings dialog
  // ---------------------------------------------------------------------------
  function openSettings() {
    els.apiKey.value = prefs.apiKey;
    els.model.value = prefs.model;
    if (typeof els.settings.showModal === 'function') els.settings.showModal();
    else els.settings.setAttribute('open', '');
    els.apiKey.focus();
  }

  els.settingsForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'cancel') return;
    prefs.apiKey = els.apiKey.value.trim();
    prefs.model = els.model.value.trim() || AI.DEFAULT_MODEL;
    store.set('apiKey', prefs.apiKey);
    store.set('model', prefs.model);
    if (prefs.apiKey) {
      document.querySelector('input[name="mode"][value="ai"]').checked = true;
      prefs.mode = 'ai';
      store.set('mode', 'ai');
    }
    toast(prefs.apiKey ? 'Saved. AI mode is on.' : 'Settings saved.');
  });

  els.forgetKey.addEventListener('click', () => {
    prefs.apiKey = '';
    els.apiKey.value = '';
    store.remove('apiKey');
    document.querySelector('input[name="mode"][value="local"]').checked = true;
    prefs.mode = 'local';
    store.set('mode', 'local');
    toast('API key removed from this browser.');
  });

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  els.input.addEventListener('input', updateCount);
  els.runBtn.addEventListener('click', run);
  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run();
  });

  els.clearBtn.addEventListener('click', () => {
    loadText('', false);
    stopSpeaking();
    els.results.hidden = true;
    els.how.hidden = false;
    setStatus('');
    els.input.focus();
  });

  els.pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setStatus('Your clipboard is empty. Copy some text first.', 'error');
        return;
      }
      loadText(text, true);
    } catch (_) {
      els.input.focus();
      setStatus('Your browser blocked clipboard access. Click in the box and press Ctrl + V.', 'error');
    }
  });

  // Ctrl+V anywhere on the page (outside form fields) pastes and runs.
  document.addEventListener('paste', (e) => {
    const t = e.target;
    if (t && (t.closest('input, textarea, select, [contenteditable="true"]'))) return;
    const text = e.clipboardData && e.clipboardData.getData('text/plain');
    if (!text || !text.trim()) return;
    e.preventDefault();
    loadText(text, true);
  });

  // Pasting into the empty box also runs automatically.
  els.input.addEventListener('paste', () => {
    const wasEmpty = !els.input.value.trim();
    setTimeout(() => {
      updateCount();
      if (wasEmpty && els.input.value.trim()) run();
    }, 0);
  });

  // Drag and drop text or a .txt file.
  ['dragenter', 'dragover'].forEach((type) => els.input.addEventListener(type, (e) => {
    e.preventDefault();
    els.input.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((type) => els.input.addEventListener(type, () => els.input.classList.remove('dragover')));
  els.input.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) {
      if (!/^text\/|\.txt$|\.md$/i.test(file.type || file.name)) {
        setStatus('Only text files can be dropped here. For a PDF, open it, select the text and copy it.', 'error');
        return;
      }
      file.text().then((t) => loadText(t, true));
      return;
    }
    const text = e.dataTransfer.getData('text/plain');
    if (text) loadText(text, true);
  });

  document.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => loadText(SAMPLES[btn.dataset.sample].text, true));
  });

  els.language.addEventListener('change', () => {
    prefs.language = els.language.value;
    store.set('language', prefs.language);
    if (prefs.language !== 'English' && getMode() === 'local') {
      setStatus('Offline mode explains in English only. Switch to AI mode for ' + prefs.language + '.');
    } else {
      setStatus('');
    }
  });

  document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener('change', () => {
    prefs.mode = getMode();
    store.set('mode', prefs.mode);
    if (prefs.mode === 'ai' && !prefs.apiKey) openSettings();
  }));

  els.viewTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) setView(tab.dataset.view);
  });

  els.actions.addEventListener('change', updateProgress);

  els.speakBtn.addEventListener('click', speak);
  els.copyBtn.addEventListener('click', copyReport);
  els.downloadBtn.addEventListener('click', downloadReport);
  els.printBtn.addEventListener('click', () => window.print());
  els.openSettings.addEventListener('click', openSettings);

  els.fontUp.addEventListener('click', () => setScale(0.1));
  els.fontDown.addEventListener('click', () => setScale(-0.1));
  els.toggleDyslexia.addEventListener('click', () => {
    prefs.dyslexia = !prefs.dyslexia;
    store.set('dyslexia', prefs.dyslexia);
    applyView();
    toast(prefs.dyslexia ? 'Easy-read font on' : 'Easy-read font off');
  });
  els.toggleContrast.addEventListener('click', () => {
    prefs.contrast = !prefs.contrast;
    store.set('contrast', prefs.contrast);
    applyView();
    toast(prefs.contrast ? 'High contrast on' : 'High contrast off');
  });

  // Show a divider under the sticky results bar once it is stuck.
  const bar = document.querySelector('.results-bar');
  if (bar && 'IntersectionObserver' in window) {
    const sentinel = el('div', { 'aria-hidden': 'true' });
    bar.before(sentinel);
    new IntersectionObserver(([entry]) => bar.classList.toggle('stuck', !entry.isIntersecting)).observe(sentinel);
  }

  window.addEventListener('beforeunload', () => synth && synth.cancel());

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  applyView();
  els.language.value = prefs.language;
  document.querySelector(`input[name="mode"][value="${prefs.mode === 'ai' ? 'ai' : 'local'}"]`).checked = true;
  updateCount();

  // Demo link support: index.html#sample=discharge loads and explains an example.
  const sampleMatch = location.hash.match(/sample=(\w+)/);
  if (sampleMatch && SAMPLES[sampleMatch[1]]) loadText(SAMPLES[sampleMatch[1]].text, true);
})();
