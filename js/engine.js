/*
 * ClearPaste offline engine.
 * Rule-based plain-language rewriter and information extractor.
 * Runs fully in the browser (or Node, for testing). No network calls.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Plain-language dictionary: [hard phrase, plain replacement].
  // Longer phrases are matched first, so "shall be" wins over "shall".
  // ---------------------------------------------------------------------------
  const JARGON = [
    // Legal / government phrasing
    ['hereinafter referred to as', 'called'],
    ['in pursuance of', 'following'],
    ['in accordance with', 'following'],
    ['in compliance with', 'following'],
    ['in respect of', 'about'],
    ['with respect to', 'about'],
    ['with regard to', 'about'],
    ['in this regard', 'about this'],
    ['pertaining to', 'about'],
    ['in the event of failure to', 'if you do not'],
    ['in the event of non-compliance with', 'if you do not follow'],
    ['the aforesaid requirement', 'this rule'],
    ['shall be furnished', 'must be given'],
    ['and to avoid', 'and avoid'],
    ['in the event that', 'if'],
    ['in the event of', 'if there is'],
    ['in the absence of', 'without'],
    ['prior to', 'before'],
    ['subsequent to', 'after'],
    ['in lieu of', 'instead of'],
    ['on or before', 'by'],
    ['no later than', 'by'],
    ['not later than', 'by'],
    ['with immediate effect', 'starting now'],
    ['with effect from', 'starting from'],
    ['w.e.f.', 'starting from'],
    ['pursuant to', 'under'],
    ['by virtue of', 'because of'],
    ['on account of', 'because of'],
    ['owing to', 'because of'],
    ['due to the fact that', 'because'],
    ['in order to', 'to'],
    ['for the purpose of', 'to'],
    ['at the earliest', 'as soon as possible'],
    ['is in receipt of', 'has received'],
    ['you are requested to', 'please'],
    ['you are hereby requested to', 'please'],
    ['kindly note that', 'please note:'],
    ['kindly', 'please'],
    ['it is mandatory to', 'you must'],
    ['is required to', 'must'],
    ['are required to', 'must'],
    ['shall be deemed', 'will be treated as'],
    ['shall be liable to be', 'may be'],
    ['liable to be', 'may be'],
    ['shall not exceed', 'must be no more than'],
    ['shall not', 'must not'],
    ['shall be', 'will be'],
    ['shall', 'must'],
    ['notwithstanding', 'despite'],
    ['aforementioned', 'mentioned above'],
    ['aforesaid', 'mentioned above'],
    ['herewith', 'with this'],
    ['therein', 'in it'],
    ['thereof', 'of it'],
    ['thereafter', 'after that'],
    ['heretofore', 'until now'],
    ['henceforth', 'from now on'],
    ['forthwith', 'immediately'],
    ['summarily', 'immediately'],
    ['whereby', 'by which'],
    ['wherein', 'where'],
    ['whereas', 'because'],
    ['whatsoever', 'at all'],
    ['inter alia', 'among other things'],
    ['bona fide', 'genuine'],
    ['null and void', 'cancelled'],
    ['indemnify', 'pay for any losses'],
    ['jurisdiction', 'legal authority'],
    ['lessee', 'tenant'],
    ['lessor', 'landlord'],
    ['premises', 'property'],
    ['cognizance', 'notice'],
    ['correspondence', 'letters or messages'],
    ['entertained', 'accepted'],
    ['grievance redressal', 'complaints'],
    ['grievances', 'complaints'],
    ['grievance', 'complaint'],
    ['redressal', 'solving'],
    ['adjudication', 'official decision'],
    ['non-compliance with', 'not following'],
    ['non-compliance', 'not following the rules'],
    ['competent authority', 'official in charge'],
    ['issuing authority', 'office that issued it'],
    ['eligible candidates', 'people who qualify'],
    ['eligible applicants', 'people who qualify'],
    ['eligibility criteria', 'rules for who can apply'],
    ['eligibility', 'who can apply'],
    ['ineligible', 'not allowed'],
    ['eligible', 'allowed'],
    ['applicants', 'people applying'],
    ['applicant', 'person applying'],
    ['candidates', 'people applying'],
    ['beneficiaries', 'people who get the benefit'],
    ['beneficiary', 'person who gets the benefit'],
    ['mandatory', 'required'],
    ['obligatory', 'required'],
    ['compulsory', 'required'],
    ['stipulated', 'set'],
    ['prescribed format', 'official format'],
    ['requisite', 'needed'],
    ['furnished', 'given'],
    ['furnish', 'give'],
    ['duly filled', 'fully filled in'],
    ['duly signed', 'signed'],
    ['a self-attested copy of', 'a copy, signed by you, of'],
    ['self-attested copies of', 'copies, signed by you, of'],
    ['must be duly self-attested', 'must be signed by you'],
    ['duly self-attested', 'signed by you'],
    ['self-attested', 'signed by you'],
    ['duly', 'properly'],
    ['attested', 'signed and stamped as true'],
    ['notarized', 'certified by a notary'],
    ['notarised', 'certified by a notary'],
    ['affidavit', 'signed sworn statement (affidavit)'],
    ['enclosed herewith', 'attached'],
    ['enclosed', 'attached'],
    ['enclosures', 'attachments'],
    ['annexure', 'attached page (annexure)'],
    ['intimated', 'told'],
    ['intimation', 'notice'],
    ['verification', 'checking'],
    ['rectification', 'correction'],
    ['rectify', 'fix'],
    ['discrepancies', 'mismatches'],
    ['discrepancy', 'mismatch'],
    ['remuneration', 'pay'],
    ['disbursement', 'payment'],
    ['disbursed', 'paid'],
    ['reimbursement', 'repayment of your costs'],
    ['reimbursed', 'paid back'],
    ['remittance', 'payment'],
    ['remit', 'pay'],
    ['levied', 'charged'],
    ['penal interest', 'extra interest as a fine'],
    ['penalty', 'fine'],
    ['arrears', 'unpaid money you owe'],
    ['outstanding dues', 'money you still owe'],
    ['outstanding amount', 'amount you still owe'],
    ['outstanding', 'unpaid'],
    ['dues', 'money owed'],
    ['principal amount', 'original loan amount'],
    ['debit transactions', 'withdrawals or payments'],
    ['inoperative', 'inactive'],
    ['classified as', 'marked as'],
    ['updation', 'update'],
    ['periodic', 'regular'],
    ['subsidy', 'government discount (subsidy)'],
    ['stipend', 'regular allowance (stipend)'],
    ['tenure', 'period'],
    ['commensurate with', 'matching'],
    ['in excess of', 'more than'],
    ['not exceeding', 'up to'],
    ['aggregate', 'total'],
    ['per annum', 'per year'],
    ['p.a.', 'per year'],
    ['per mensem', 'per month'],
    ['permitted', 'allowed'],
    ['prohibited', 'not allowed'],
    ['utilization', 'use'],
    ['utilisation', 'use'],
    ['utilize', 'use'],
    ['utilise', 'use'],
    ['commencement', 'start'],
    ['commence', 'start'],
    ['commenced', 'started'],
    ['terminated', 'ended'],
    ['termination', 'ending'],
    ['terminate', 'end'],
    ['revoked', 'cancelled'],
    ['rescinded', 'cancelled'],
    ['waived', 'cancelled'],
    ['accrue', 'build up'],
    ['accrued', 'built up'],
    ['deemed', 'treated as'],
    ['expedite', 'speed up'],
    ['ascertain', 'find out'],
    ['endeavour', 'try'],
    ['endeavor', 'try'],
    ['facilitate', 'help with'],
    ['approximately', 'about'],
    ['insufficient', 'not enough'],
    ['sufficient', 'enough'],
    ['subsequently', 'later'],
    ['nominal', 'small'],
    ['disqualified', 'removed'],
    ['vide', 'by'],

    // Medical
    ['acute myocardial infarction', 'sudden heart attack'],
    ['myocardial infarction', 'heart attack'],
    ['cerebrovascular accident', 'stroke'],
    ['type 2 diabetes mellitus', 'type 2 diabetes'],
    ['diabetes mellitus', 'diabetes'],
    ['hypertension', 'high blood pressure'],
    ['hypotension', 'low blood pressure'],
    ['coronary angioplasty', 'a procedure to open a blocked heart artery (angioplasty)'],
    ['antiplatelet medication', 'blood-thinning medicine'],
    ['antiplatelet', 'blood-thinning'],
    ['anticoagulant', 'blood thinner'],
    ['analgesics', 'painkillers'],
    ['analgesic', 'painkiller'],
    ['antipyretic', 'fever medicine'],
    ['antibiotics', 'germ-killing medicines (antibiotics)'],
    ['cardiology opd', 'heart clinic (outpatient)'],
    ['opd', 'outpatient clinic'],
    ['cardiologist', 'heart doctor'],
    ['neurologist', 'brain and nerve doctor'],
    ['nephrologist', 'kidney doctor'],
    ['physician', 'doctor'],
    ['seek immediate medical attention', 'get medical help right away'],
    ['is being discharged', 'is going home'],
    ['discharged', 'sent home'],
    ['stable condition', 'stable health'],
    ['underwent', 'had'],
    ['is advised to', 'should'],
    ['are advised to', 'should'],
    ['advised to', 'told to'],
    ['abstain from', 'avoid'],
    ['refrain from', 'avoid'],
    ['discontinue', 'stop'],
    ['consulting', 'asking'],
    ['strenuous', 'hard'],
    ['excessive', 'too much'],
    ['once daily', 'once a day'],
    ['twice daily', 'twice a day'],
    ['thrice daily', 'three times a day'],
    ['b.i.d.', 'twice a day'],
    ['t.i.d.', 'three times a day'],
    ['nil by mouth', 'nothing to eat or drink'],
    ['post-operative', 'after surgery'],
    ['postoperative', 'after surgery'],
    ['pre-operative', 'before surgery'],
    ['preoperative', 'before surgery'],
    ['prognosis', 'expected outcome'],
    ['benign', 'not cancer'],
    ['malignant', 'cancerous'],
    ['contraindicated', 'not safe to use'],
    ['adverse effects', 'side effects'],
    ['adverse reactions', 'side effects'],
    ['administer', 'give'],
    ['ambulate', 'walk'],
    ['oedema', 'swelling'],
    ['edema', 'swelling'],
    ['dyspnoea', 'shortness of breath'],
    ['dyspnea', 'shortness of breath'],
    ['pyrexia', 'fever'],
    ['sutures', 'stitches'],
    ['renal', 'kidney'],
    ['hepatic', 'liver'],
    ['pulmonary', 'lung'],
    ['gastric', 'stomach'],
    ['follow-up', 'check-up visit'],
    ['follow up', 'check-up visit'],
  ];

  // Phrases removed entirely because they add nothing.
  const FILLER = [
    /\bthis is to (?:inform|notify|bring to (?:your|the) notice(?: of)?)\b[^.]{0,60}?\bthat\s+/gi,
    /\bplease be (?:informed|advised) that\s+/gi,
    /\bit is hereby (?:informed|notified) that\s+/gi,
    /\bhereby\s+/gi,
  ];

  const ABBREV = ['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr', 'St', 'No', 'Nos', 'Rs', 'Govt', 'Dept',
    'Ltd', 'Pvt', 'vs', 'etc', 'approx', 'Ref', 'Sec', 'Art', 'Fig', 'Vol', 'Mob', 'Tel', 'Ph',
    'Tab', 'Cap', 'Inj', 'Syp', 'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept',
    'Oct', 'Nov', 'Dec', 'e\\.g', 'i\\.e', 'a\\.m', 'p\\.m', 'p\\.a', 'w\\.e\\.f', 'b\\.i\\.d', 't\\.i\\.d'];
  const DOT = '\u2024'; // placeholder for a protected full stop

  const ACTION_RE = /\b(must|need to|needs to|have to|has to|should|please|required|submit|apply|pay|bring|attend|visit|sign|contact|call|report|take|avoid|do not|don't|never|update|send|register|renew|carry|keep|stop|start|fill|upload|deadline|last date)\b/i;
  const WARN_RE = /\b(failure to|if you do not|fine|penalty|cancel(?:led)?|reject(?:ed)?|removed|disqualif\w*|suspend\w*|frozen|freeze|inactive|legal action|prosecut\w*|recover(?:ed)?|extra interest|emergency|right away|immediately|chest pain|warning|danger|not allowed|must not|do not|never)\b/i;

  const MONTHS = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
  const DATE_RES = [
    /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/gi,
    new RegExp('\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:' + MONTHS + ')\\.?,?(?:\\s+\\d{4})?\\b', 'gi'),
    new RegExp('\\b(?:' + MONTHS + ')\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b', 'gi'),
    /\b(?:within|for|after|in)\s+\d+\s+(?:working\s+|business\s+)?(?:days?|weeks?|months?|hours?|years?)\b/gi,
  ];
  const MONEY_RE = /(?:₹|\bRs\.?|\bINR|\$|USD|€|£)\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:lakhs?|crores?|thousand|million|k)\b)?|\b\d[\d,]*(?:\.\d+)?\s?(?:rupees|lakhs?|crores?)\b|\b\d+(?:\.\d+)?\s?%(?:\s(?:per|a)\s(?:month|year|annum))?/gi;
  const MED_RE = /\b(?:Tab|Tablet|Cap|Capsule|Syp|Syrup|Inj|Injection)\.?\s+[A-Z][A-Za-z-]+(?:\s+\d+(?:\.\d+)?\s?(?:mg|mcg|ml|g|iu|units?))?/g;
  const PHONE_RES = [
    /\b1800[\s-]?\d{3}[\s-]?\d{4}\b/g,
    /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g,
    /\+\d{1,3}[\s-]?\d[\d\s-]{7,12}\d\b/g,
  ];
  const EMERGENCY_RE = /\b(?:call|dial|ring)\s+(\d{3,4})\b/gi;
  const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const URL_RE = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/gi;

  const DOCUMENTS = ['Aadhaar card', 'Aadhaar', 'PAN card', 'passport', 'voter ID', 'driving licence', 'driving license',
    'ration card', 'birth certificate', 'income certificate', 'caste certificate', 'domicile certificate',
    'death certificate', 'marriage certificate', 'bank passbook', 'cancelled cheque', 'passport-size photographs',
    'passport-size photograph', 'photographs', 'photo identity proof', 'identity proof', 'ID proof', 'address proof',
    'marksheet', 'mark sheet', 'admit card', 'transfer certificate', 'fee receipt', 'salary slip', 'Form 16',
    'bank statement', 'electricity bill', 'rent agreement', 'disability certificate', 'insurance card',
    'prescription', 'reports', 'discharge summary', 'application form', 'affidavit'];

  const DOC_TYPES = [
    { type: 'Medical document', words: /\b(patient|diagnosis|tablet|tab\.|mg|dose|doctor|hospital|discharge|medication|symptoms?|surgery|blood pressure)\b/gi },
    { type: 'Government notice or scheme', words: /\b(government|govt|ministry|department|scheme|applicants?|certificate|aadhaar|official|authority|notice|scholarship|pension)\b/gi },
    { type: 'Bank or money letter', words: /\b(bank|account|loan|emi|interest|kyc|customer|branch|credit|debit|payment|₹|rs\.?)\b/gi },
    { type: 'Legal document or agreement', words: /\b(agreement|tenant|landlord|lessee|lessor|party|parties|clause|court|legal|hereinafter|liable|contract)\b/gi },
    { type: 'School or college notice', words: /\b(student|admission|exam|examination|semester|college|university|school|marks|fees)\b/gi },
  ];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Grammar fixes that are replaced in the text but are not "hard words".
  const NO_GLOSSARY = new Set(['and to avoid', 'shall be', 'shall', 'shall not', 'kindly', 'in order to',
    'once daily', 'twice daily', 'is being discharged', 'stable condition', 'is advised to', 'are advised to']);

  const JARGON_SORTED = JARGON.slice().sort((a, b) => b[0].length - a[0].length);
  const JARGON_MAP = new Map(JARGON_SORTED.map(([k, v]) => [k.toLowerCase(), v]));
  const JARGON_RE = new RegExp(
    '(?<![A-Za-z0-9])(' + JARGON_SORTED.map(([k]) => escapeRe(k).replace(/ /g, '\\s+')).join('|') + ')(?![A-Za-z0-9])',
    'gi'
  );

  function matchCase(original, replacement) {
    if (!replacement) return replacement;
    const first = original.charAt(0);
    if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  }

  function uniq(list) {
    const seen = new Set();
    return list.filter((x) => {
      const k = String(x).toLowerCase().replace(/\s+/g, ' ').trim();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function ensureEnd(s) {
    s = s.trim();
    return /[.!?:]$/.test(s) ? s : s + '.';
  }

  function protect(text) {
    const re = new RegExp('(?<![A-Za-z])(' + ABBREV.join('|') + ')\\.', 'g');
    return text.replace(re, (m, a) => a.replace(/\./g, DOT) + DOT);
  }

  function restore(text) {
    return text.split(DOT).join('.');
  }

  // Joins hard-wrapped lines (common when copying from PDFs) and splits paragraphs.
  function toParagraphs(text) {
    const lines = text.replace(/\r\n?/g, '\n').split('\n').map((l) => l.trim());
    const paras = [];
    let cur = '';
    for (const line of lines) {
      if (!line) {
        if (cur) paras.push(cur);
        cur = '';
        continue;
      }
      const isBullet = /^([-•*▪◦]|\d+[.)]|[a-z][.)])\s+/i.test(line);
      if (cur && !isBullet && !/[.!?:;]$/.test(cur) && /^[a-z(]/.test(line)) {
        cur += ' ' + line;
      } else {
        if (cur) paras.push(cur);
        cur = line;
      }
    }
    if (cur) paras.push(cur);
    return paras;
  }

  function splitSentences(paragraph) {
    const p = protect(paragraph.replace(/\s+/g, ' ').trim());
    return p
      .split(/(?<=[.!?])\s+(?=["'(\[]?[A-Z0-9₹$])/)
      .map((s) => restore(s).trim())
      .filter(Boolean);
  }

  function wordCount(s) {
    const m = s.match(/[A-Za-z0-9₹$][\w'’-]*/g);
    return m ? m.length : 0;
  }

  // Breaks long sentences at semicolons and some joining words.
  function splitLong(sentence) {
    if (wordCount(sentence) <= 22) return [sentence];

    let pieces = protect(sentence).split(/;\s+/).map(restore);
    const out = [];
    for (const piece of pieces) {
      if (wordCount(piece) <= 22) {
        out.push(piece);
        continue;
      }
      const parts = piece.split(/,\s+(?=(?:and|but|so|which|however)\b)/i);
      const merged = [];
      for (const part of parts) {
        if (merged.length && (wordCount(part) < 6 || wordCount(merged[merged.length - 1]) < 6)) {
          merged[merged.length - 1] += ', ' + part;
        } else {
          merged.push(part);
        }
      }
      out.push(...merged);
    }

    return out.map((s, i) => {
      s = s.trim().replace(/[,;]+$/, '');
      if (i > 0) {
        s = s.replace(/^and\s+/i, '')
          .replace(/^which\s+/i, 'This ')
          .replace(/^however,?\s+/i, 'However, ');
      }
      return ensureEnd(capitalize(s));
    });
  }

  // Replaces hard words. Returns parts: [{ t: text, orig?: original }].
  function plainParts(sentence) {
    let s = sentence;
    for (const re of FILLER) s = s.replace(re, '');
    s = capitalize(s.trim());

    const parts = [];
    const glossary = [];
    let last = 0;
    JARGON_RE.lastIndex = 0;
    let m;
    while ((m = JARGON_RE.exec(s)) !== null) {
      const original = m[0];
      const key = original.toLowerCase().replace(/\s+/g, ' ');
      const replacement = JARGON_MAP.get(key);
      if (replacement === undefined) continue;
      if (m.index > last) parts.push({ t: s.slice(last, m.index) });
      parts.push({ t: matchCase(original, replacement), orig: original });
      if (!NO_GLOSSARY.has(key)) glossary.push({ term: original, meaning: replacement });
      last = m.index + original.length;
    }
    if (last < s.length) parts.push({ t: s.slice(last) });

    // Tidy "please:" style colons and double spaces left by replacements.
    for (const p of parts) p.t = p.t.replace(/\s{2,}/g, ' ');
    return { parts, glossary };
  }

  const partsToText = (parts) => parts.map((p) => p.t).join('').replace(/\s{2,}/g, ' ').trim();

  // ---------------------------------------------------------------------------
  // Readability (Flesch-Kincaid grade level)
  // ---------------------------------------------------------------------------
  function syllables(word) {
    let w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return m ? m.length : 1;
  }

  function readability(text) {
    const sentences = toParagraphs(text).flatMap(splitSentences);
    const words = (text.match(/[A-Za-z][A-Za-z'’-]*/g) || []);
    const W = words.length;
    const S = Math.max(1, sentences.length);
    if (!W) return { grade: 0, label: 'n/a', words: 0, sentences: 0, longSentences: 0, hardWords: 0 };
    const syl = words.reduce((n, w) => n + syllables(w), 0);
    const hardWords = words.filter((w) => syllables(w) >= 3).length;
    const grade = Math.max(0, Math.min(20, 0.39 * (W / S) + 11.8 * (syl / W) - 15.59));
    const longSentences = sentences.filter((s) => wordCount(s) > 25).length;
    let label = 'Very hard';
    if (grade <= 6) label = 'Easy';
    else if (grade <= 9) label = 'Fairly easy';
    else if (grade <= 12) label = 'Hard';
    return { grade: Math.round(grade * 10) / 10, label, words: W, sentences: sentences.length, longSentences, hardWords };
  }

  // ---------------------------------------------------------------------------
  // Extraction
  // ---------------------------------------------------------------------------
  function findAll(re, text) {
    re.lastIndex = 0;
    return text.match(re) || [];
  }

  function trimUrl(u) {
    return u.replace(/[.,;:)\]]+$/, '');
  }

  function shorten(s, max) {
    return s.length <= max ? s : s.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  }

  function detectDocType(text) {
    let best = { type: 'General document', score: 0 };
    for (const d of DOC_TYPES) {
      const score = findAll(d.words, text).length;
      if (score > best.score) best = { type: d.type, score };
    }
    return best.score >= 2 ? best.type : 'General document';
  }

  function analyze(input) {
    const text = String(input || '').trim();
    if (!text) throw new Error('Paste some text first.');

    const paragraphs = toParagraphs(text);
    const plainParagraphs = [];
    const items = []; // { original, plain, index }
    let glossary = [];
    let index = 0;

    for (const para of paragraphs) {
      const sentences = splitSentences(para).flatMap(splitLong);
      const paraParts = [];
      for (const sentence of sentences) {
        const { parts, glossary: g } = plainParts(sentence);
        glossary = glossary.concat(g);
        if (paraParts.length) paraParts.push({ t: ' ' });
        paraParts.push(...parts);
        items.push({ original: sentence, plain: partsToText(parts), index: index++ });
      }
      plainParagraphs.push(paraParts);
    }

    // Dates with what they refer to.
    const dates = [];
    for (const it of items) {
      for (const re of DATE_RES) {
        for (const when of findAll(re, it.original)) {
          dates.push({ when: when.trim(), what: shorten(it.plain, 160) });
        }
      }
    }

    const money = [];
    for (const it of items) {
      for (const amount of findAll(MONEY_RE, it.original)) {
        money.push({ amount: amount.trim(), what: shorten(it.plain, 160) });
      }
    }

    const lower = text.toLowerCase();
    const documents = uniq(DOCUMENTS.filter((d) => lower.includes(d.toLowerCase())))
      // Drop shorter names covered by a longer one ("Aadhaar" when "Aadhaar card" exists).
      .filter((d, _, all) => !all.some((o) => o !== d && o.toLowerCase().includes(d.toLowerCase())));

    const medicines = uniq(findAll(MED_RE, text).map((m) => m.trim()));

    const contacts = uniq([
      ...PHONE_RES.flatMap((re) => findAll(re, text)).map((p) => p.trim()),
      ...Array.from(text.matchAll(EMERGENCY_RE), (m) => m[1] + ' (emergency)'),
      ...findAll(EMAIL_RE, text),
      ...findAll(URL_RE, text).map(trimUrl),
    ]).filter((c, _, all) => !all.some((o) => o !== c && o.replace(/\D/g, '').includes(c.replace(/\D/g, '')) && c.replace(/\D/g, '').length > 0 && o.length > c.length));

    const actions = uniq(items.filter((it) => ACTION_RE.test(it.plain)).map((it) => it.plain)).slice(0, 10);
    const warnings = uniq(items.filter((it) => WARN_RE.test(it.plain)).map((it) => it.plain)).slice(0, 6);

    // Summary: highest-scoring sentences, kept in document order.
    const scored = items
      .filter((it) => wordCount(it.plain) >= 5)
      .map((it) => {
        let score = 0;
        if (ACTION_RE.test(it.plain)) score += 2;
        if (WARN_RE.test(it.plain)) score += 2;
        if (DATE_RES.some((re) => findAll(re, it.original).length)) score += 2;
        if (findAll(MONEY_RE, it.original).length) score += 1;
        if (it.index === 0) score += 2;
        if (/^(diagnosis|subject|purpose)\b/i.test(it.original)) score += 4;
        else if (/\b(purpose|notice|invited|frozen|scheme)\b/i.test(it.original)) score += 1;
        return { ...it, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .sort((a, b) => a.index - b.index);
    const summary = scored.map((it) => it.plain);

    const plainText = plainParagraphs.map(partsToText).join('\n\n');

    return {
      source: 'local',
      language: 'English',
      docType: detectDocType(text),
      summary,
      actions,
      dates: uniqBy(dates, (d) => d.when.toLowerCase()),
      money: uniqBy(money, (m) => m.amount.toLowerCase()),
      documents,
      medicines,
      warnings,
      contacts,
      plain: plainParagraphs,
      plainText,
      glossary: uniqBy(glossary, (g) => g.term.toLowerCase().replace(/\s+/g, ' ')),
      readability: { before: readability(text), after: readability(plainText) },
    };
  }

  function uniqBy(list, key) {
    const seen = new Set();
    return list.filter((x) => {
      const k = key(x);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  const Engine = { analyze, readability, toParagraphs };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.ClearPasteEngine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
