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
    ['is liable to be', 'may be'],
    ['are liable to be', 'may be'],
    ['liable to be', 'may be'],
    ['as per our records,', 'our records show that'],
    ['as per our records', 'our records show that'],
    ['shall be applicable', 'will apply'],
    ['is applicable', 'applies'],
    ['may result in', 'can lead to'],
    ['and to keep', 'and keep'],
    ['and to take', 'and take'],
    ['and to follow', 'and follow'],
    ['closed reduction', 'setting the bone without surgery'],
    ['cast application', 'a plaster cast'],
    ['distal radius', 'forearm bone near the wrist'],
    ['discolouration', 'colour change'],
    ['discoloration', 'color change'],
    ['elevated', 'raised'],
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
    ['as per', 'under'],
    ['in view of', 'because of'],
    ['with reference to', 'about'],
    ['in case of', 'if there is'],
    ['hitherto', 'until now'],
    ['vis-a-vis', 'compared with'],
    ['ex-gratia', 'goodwill'],
    ['suo motu', 'on its own'],
    ['pro rata', 'in proportion'],
    ['herein', 'in this document'],
    ['hereunder', 'below'],
    ['the undersigned', 'the person signing this'],
    ['the said', 'this'],
    ['do the needful', 'take the needed action'],
    ['prior intimation', 'advance notice'],
    ['kindly intimate', 'please tell'],
    ['intimate', 'tell'],
    ['revert back', 'reply'],
    ['revert', 'reply'],
    ['availed', 'used'],
    ['avail', 'use'],
    ['repudiated', 'rejected'],
    ['ailment', 'illness'],
    ['hospitalisation', 'hospital stay'],
    ['hospitalization', 'hospital stay'],
    ['pre-existing disease', 'illness you already had (pre-existing disease)'],
    ['sum insured', 'most the insurance will pay (sum insured)'],
    ['grievance redressal officer', 'complaints officer'],
    ['ombudsman', 'free complaints officer (ombudsman)'],
    ['nominee', 'person who gets the money if you die (nominee)'],
    ['guarantor', 'person who promises to repay if you cannot (guarantor)'],
    ['collateral', 'security for the loan'],
    ['moratorium', 'pause on payments'],
    ['foreclosure', 'paying off the loan early'],
    ['overdue amount', 'amount you owe'],
    ['overdue', 'late'],
    ['adverse reporting to credit bureaus', 'a bad report to credit agencies'],
    ['credit bureaus', 'credit agencies'],
    ['insufficient funds', 'not enough money in your account'],
    ['returned unpaid', 'bounced'],
    ['nach mandate', 'automatic payment instruction (NACH)'],
    ['inclusive of', 'including'],
    ['till the date of payment', 'until you pay'],
    ['surcharge', 'extra charge'],
    ['disconnected', 'cut off'],
    ['consecutive months', 'months in a row'],
    ['consecutive days', 'days in a row'],
    ['consecutive', 'back-to-back'],
    ['in the event of non-payment of', 'if there is no payment of'],
    ['in the event of non-submission of', 'if you do not submit'],
    ['insurance ombudsman', 'Insurance Ombudsman (a free complaints service)'],
    ['is subject to', 'depends on'],
    ['are subject to', 'depend on'],
    ['self-attested photocopy', 'photocopy signed by you'],
    ['self-attested photocopies', 'photocopies signed by you'],
    ['self-attested copy', 'copy signed by you'],
    ['subsequent', 'later'],
    ['from the date of issue of this notice', 'from the date of this notice'],
    ['if you wish to contest', 'if you want to challenge'],
    ['being discharged', 'going home'],
    ['late payment surcharge', 'late payment charge'],
    ['payments may be made', 'you can pay'],
    ['payment may be made', 'you can pay'],
    ['sublet', 'rent out to someone else'],
    ['part with possession of', 'give away'],
    ['licensee', 'tenant (licensee)'],
    ['licensor', 'owner (licensor)'],
    ['license fee', 'rent (license fee)'],
    ['refundable', 'returnable'],
    ['refunded', 'paid back'],
    ['subject to', 'depending on'],
    ['shall be entitled to', 'will be allowed to'],
    ['entitled to', 'allowed to'],
    ['shall stand enhanced by', 'will go up by'],
    ['stand enhanced by', 'go up by'],
    ['upon expiry of', 'at the end of'],
    ['strictly prohibited', 'not allowed at all'],
    ['shall not be permitted to', 'will not be allowed to'],
    ['shall lead to', 'will lead to'],
    ['shall result in', 'will result in'],
    ['shall apply', 'will apply'],
    ['shall remain', 'will remain'],
    ['shall continue', 'will continue'],
    ['shall not be', 'will not be'],
    ['virtual court', 'online court'],
    ['wish to contest', 'want to challenge'],
    ['if you wish to', 'if you want to'],
    ['supporting evidence', 'proof'],
    ['imposed', 'charged'],
    ['violating', 'breaking'],
    ['satisfactory', 'good'],
    ['background verification', 'background check'],
    ['probation', 'trial period (probation)'],
    ['relieving letter', 'relieving letter (proof you left your last job)'],
    ['annual cost to company', 'total yearly pay'],
    ['cost to company', 'total pay'],
    ['applications are invited for', 'you can apply for'],
    ['applications are invited from', 'applications are open to'],
    ['seeded with', 'linked to'],
    ['maintained', 'kept'],
    ['maintain', 'keep'],
    ['ensure that', 'make sure that'],
    ['ensure', 'make sure'],
    ['we regret to inform you that', 'we are sorry to tell you that'],
    ['receipt of this letter', 'getting this letter'],
    ['non-submission of', 'not submitting'],
    ['non-payment of', 'not paying'],
    ['suspended', 'stopped for now'],
    ['forwarded', 'sent'],
    ['issued by', 'given by'],
    ['date of issue', 'date it was sent'],
    ['are informed that', 'should know that'],
    ['is informed that', 'should know that'],
    ['commence from', 'start from'],
    ['hrs', 'hours'],

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
    ['subcutaneously', 'under the skin'],
    ['subcutaneous', 'under the skin'],
    ['intravenously', 'through a vein'],
    ['intravenous', 'through a vein'],
    ['intramuscular', 'into a muscle'],
    ['iv fluids', 'fluids through a drip (IV)'],
    ['orally', 'by mouth'],
    ['oral fluid intake', 'how much water you drink'],
    ['fluid intake', 'how much water you drink'],
    ['salt intake', 'salt'],
    ['hyperglycaemia', 'high blood sugar'],
    ['hyperglycemia', 'high blood sugar'],
    ['hypoglycaemia', 'low blood sugar'],
    ['hypoglycemia', 'low blood sugar'],
    ['diabetic ketoacidosis', 'a dangerous diabetes emergency (ketoacidosis)'],
    ['dyslipidaemia', 'high cholesterol'],
    ['dyslipidemia', 'high cholesterol'],
    ['hyperlipidemia', 'high cholesterol'],
    ['pharyngitis', 'sore throat (pharyngitis)'],
    ['tonsillitis', 'swollen tonsils'],
    ['gastroenteritis', 'stomach infection'],
    ['urinary tract infection', 'urine infection'],
    ['pneumonia', 'lung infection (pneumonia)'],
    ['anaemia', 'low blood count (anaemia)'],
    ['anemia', 'low blood count (anemia)'],
    ['fracture', 'broken bone'],
    ['haemorrhage', 'bleeding'],
    ['hemorrhage', 'bleeding'],
    ['nausea', 'feeling sick'],
    ['vertigo', 'dizziness'],
    ['syncope', 'fainting'],
    ['tachycardia', 'fast heartbeat'],
    ['bradycardia', 'slow heartbeat'],
    ['arrhythmia', 'uneven heartbeat'],
    ['angina', 'heart-related chest pain (angina)'],
    ['hypothyroidism', 'underactive thyroid'],
    ['hyperthyroidism', 'overactive thyroid'],
    ['abdominal', 'belly'],
    ['abdomen', 'belly'],
    ['incision', 'cut'],
    ['inflammation', 'swelling'],
    ['dehydration', 'not enough water in the body (dehydration)'],
    ['symptoms subside', 'you feel better'],
    ['symptoms persist', 'you still feel unwell'],
    ['subside', 'go away'],
    ['persist', 'continue'],
    ['saline gargles', 'salt-water gargles'],
    ['complete the full course of', 'finish all the'],
    ['monitor', 'check'],
    ['endocrinology', 'diabetes and hormone'],
    ['endocrinologist', 'diabetes and hormone doctor'],
    ['dermatologist', 'skin doctor'],
    ['orthopaedic', 'bone'],
    ['orthopedic', 'bone'],
    ['paediatrician', "children's doctor"],
    ['pediatrician', "children's doctor"],
    ['gynaecologist', "women's health doctor"],
    ['gynecologist', "women's health doctor"],
    ['review in', 'come back to'],
    ['review after', 'come back after'],
    ['managed with', 'treated with'],
    ['was admitted with', 'came to hospital with'],
    ['were admitted with', 'came to hospital with'],
    ['for which treatment was availed', 'you were treated for'],
    ['medications', 'medicines'],
    ['medication', 'medicine'],
    ['difficulty in breathing', 'trouble breathing'],
    ['emergency department', 'emergency room'],
    ['cibil score', 'credit score (CIBIL)'],
  ];

  // Case-sensitive abbreviations. Skipped when already explained, as in "KYC (Know Your Customer)".
  const ABBR = [
    ['OD', 'once a day'], ['QD', 'once a day'], ['BD', 'twice a day'], ['BID', 'twice a day'],
    ['TDS', 'three times a day'], ['TID', 'three times a day'], ['QID', 'four times a day'],
    ['HS', 'at bedtime'], ['SOS', 'only when needed'], ['PRN', 'only when needed'],
    ['A/F', 'after food'], ['B/F', 'before food'], ['Rx', 'Medicines'],
    ['BP', 'blood pressure'], ['ECG', 'heart tracing (ECG)'], ['ICU', 'intensive care unit (ICU)'],
    ['IPD', 'inpatient'], ['ENT', 'ear, nose and throat'], ['HbA1c', '3-month blood sugar test (HbA1c)'],
    ['EMI', 'monthly loan payment (EMI)'], ['KYC', 'identity check (KYC)'], ['A/c', 'account'],
    ['GST', 'tax (GST)'], ['T&C', 'terms and conditions'], ['DOB', 'date of birth'],
    ['NOC', 'no-objection certificate (NOC)'], ['FIR', 'police complaint (FIR)'], ['CTC', 'total yearly pay (CTC)'],
  ];

  // Abbreviations that only mean this in medical papers ("SOS" elsewhere means emergency).
  const MEDICAL_ONLY = new Set(['OD', 'QD', 'BD', 'BID', 'TDS', 'TID', 'QID', 'HS', 'SOS', 'PRN', 'A/F', 'B/F', 'Rx']);

  // Speak to the reader: "the applicant must" -> "you must", "his/her" -> "your".
  const SUBJ_SING = 'patient|applicant|candidate|customer|consumer|borrower|beneficiary|policy ?holder|account holder|pensioner|student|vehicle owner|subscriber|employee';
  const SUBJ_PL = 'patients|applicants|candidates|customers|consumers|borrowers|beneficiaries|policy ?holders|account holders|pensioners|students|subscribers|employees';
  const DET = '(?:(?:the|every|each|all|all the|eligible|interested|concerned|such)\\s+)?';
  const SUBJ = '(?:' + DET + '(?:' + SUBJ_PL + '|' + SUBJ_SING + '))';
  const SUBJ_PL_RE = new RegExp('\\b(?:' + SUBJ_PL + ')\\b', 'i');
  const AGREE = { is: 'are', are: 'are', was: 'were', were: 'were', has: 'have', have: 'have', needs: 'need',
    does: 'do', fails: 'fail', wishes: 'wish', wants: 'want', agrees: 'agree' };
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  const PERSON_RULES = [
    { re: /^((?:all|the|every)\s[^,.;:]{2,80}?)\s+(?:are|is)\s+(?:hereby\s+)?(?:informed|notified)\s+that\s+/i,
      to: (m, who) => 'This is for ' + lowerFirst(who) + '. ' },
    { re: new RegExp('\\bit is (?:mandatory|compulsory|necessary|required|obligatory) for ' + SUBJ + ' to\\b', 'gi'), to: () => 'you must' },
    { re: new RegExp('\\b' + SUBJ + '\\s+(?:is|are)\\s+(?:hereby\\s+)?advised\\s+to\\b', 'gi'), to: () => 'you should' },
    { re: new RegExp('\\b' + SUBJ + '\\s+(?:is|are)\\s+(?:hereby\\s+)?requested\\s+to\\b', 'gi'), to: () => 'please' },
    { re: new RegExp('\\b' + SUBJ + '\\s+(?:is|are)\\s+(?:hereby\\s+)?(?:directed|instructed|required)\\s+to\\b', 'gi'), to: () => 'you must' },
    { re: new RegExp('\\b' + SUBJ + '\\s+(?:is|are)\\s+being\\s+discharged\\b', 'gi'), to: () => 'you are going home' },
    { re: new RegExp('\\b' + SUBJ + '\\s+(who|whose)\\b', 'gi'), to: (m, w) => 'those of you ' + w.toLowerCase() },
    { re: new RegExp('\\bthe\\s+((?:[a-z-]+\\s+){0,3}?[a-z-]+)\\s+of\\s+the\\s+(?:' + SUBJ_SING + ')\\b', 'gi'), to: (m, what) => 'your ' + what },
    { re: new RegExp('\\b(?:the\\s+)?(?:' + SUBJ_SING + ')\'s\\b', 'gi'), to: () => 'your' },
    { re: new RegExp('\\b' + SUBJ + '\\s+(is|are|was|were|has|have|needs|does|fails|wishes|wants|agrees)\\b', 'gi'),
      to: (m, v) => 'you ' + AGREE[v.toLowerCase()] },
    { re: new RegExp('\\b' + SUBJ + '(?=\\s+(?:also\\s+)?(?:should|must|may|can|could|will|would|shall|need|had|did|do|fail|wish|want|agree|underwent|received|went|took|got|came|[a-z]+ed)\\b)', 'gi'),
      to: () => 'you' },
    { re: new RegExp('\\b(to|by|for|from|with)\\s+' + SUBJ + '\\b(?!\\s+(?:card|portal|care|id|number|no\\.?)\\b)', 'gi'), to: (m, prep) => prep + ' you' },
    { re: /\bhe\s*\/\s*she\s+(is|was|has)\b/gi, to: (m, v) => 'you ' + AGREE[v.toLowerCase()] },
    { re: /\b(?:he\s*\/\s*she|he or she|s\/he)\b/gi, to: () => 'you' },
    { re: /\b(?:his\s*\/\s*her|his or her|her\s*\/\s*his)\b/gi, to: () => 'your' },
    { re: /\b(?:him\s*\/\s*her|him or her)\b/gi, to: () => 'you' },
  ];

  // Indian dosing notation "1-0-1" = morning, afternoon, night.
  const DOSING_RE = /(?<![\d-])([0-2]|½)-([0-2]|½)-([0-2]|½)(?![\d-])/g;
  const COURSE_RE = /\bx\s?(\d+)\s?(days?|weeks?|months?)\b/gi;

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
    new RegExp('\\b\\d{1,2}[-\\s](?:' + MONTHS + ')[-\\s,]+\\d{2,4}\\b', 'gi'),
    /\b\d{4}-\d{2}-\d{2}\b/g,
    /\b(?:within|after)\s+\d+\s+(?:working\s+|business\s+)?(?:days?|weeks?|months?|hours?|years?)\b(?!\s+(?:old|of age))/gi,
    /\bin\s+\d+\s+(?:working\s+|business\s+)?(?:days?|weeks?|months?)\b/gi,
    /\b(?:within|after|in)\s+(?:one|two|three|four|five|six|seven|ten|fifteen|thirty)\s+(?:working\s+)?(?:days?|weeks?|months?)\b/gi,
  ];
  const MONEY_RE = /(?:₹|\bRs\.?|\bINR|\$|USD|€|£)\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:lakhs?|crores?|thousand|million|k)\b)?|\b\d[\d,]*(?:\.\d+)?\s?(?:rupees|lakhs?|crores?)\b/gi;
  const PERCENT_RE = /\b\d+(?:\.\d+)?\s?%(?:\s(?:per|a)\s(?:month|year|annum))?/gi;
  // A percentage only counts as money when the sentence is about money.
  const MONEY_CONTEXT_RE = /\b(interest|rate|fee|fees|rent|charge[sd]?|surcharge|penalty|fine|discount|tax|gst|emi|loan|premium|salary|pay|paid|price|cost|deposit|enhanced|increase[sd]?|return)\b/i;
  const DOSE = '\\d+(?:\\.\\d+)?\\s?(?:mg|mcg|µg|ml|g|gm|iu|IU|units?)\\b';
  const MED_RE = new RegExp('\\b(?:Tab|Tablet|Cap|Capsule|Syp|Syrup|Inj|Injection|Oint|Ointment|Drops?)\\.?\\s+[A-Z][A-Za-z-]+(?:\\s+[A-Z][a-z]+)?(?:\\s+' + DOSE + ')?', 'g');
  // Medicines written without a prefix: "Paracetamol 650 mg".
  const MED_BARE_RE = new RegExp('\\b[A-Z][a-z]{3,}(?:\\s+[A-Z][a-z]{3,})?\\s+' + DOSE, 'g');
  const MED_STOP = new Set(['Dose', 'Total', 'Daily', 'Take', 'Give', 'Each', 'Every', 'Sugar', 'Salt', 'Water', 'Weight', 'Upto', 'Only', 'With', 'After', 'Before']);
  const PHONE_RES = [
    /\b1800[\s-]?\d{3}[\s-]?\d{4}\b/g,
    /(?:\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g,
    /\+\d{1,3}[\s-]?\d[\d\s-]{7,12}\d\b/g,
    /\b0\d{2,4}[\s-]\d{6,8}\b/g,
    /\(0\d{2,4}\)\s?\d{3,4}[\s-]?\d{4}\b/g,
  ];
  const EMERGENCY_RE = /\b(?:call|dial|ring|helpline|care at|number)\s+(?:no\.?\s*|number\s+)?(\d{3,5})\b(?![\d-])/gi;
  const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const URL_RE = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/gi;

  const DOCUMENTS = ['Aadhaar card', 'Aadhaar', 'PAN card', 'passport', 'voter ID', 'driving licence', 'driving license',
    'ration card', 'birth certificate', 'income certificate', 'caste certificate', 'domicile certificate',
    'death certificate', 'marriage certificate', 'bank passbook', 'cancelled cheque', 'passport-size photographs',
    'passport-size photograph', 'photographs', 'photo identity proof', 'identity proof', 'ID proof', 'address proof',
    'marksheet', 'mark sheet', 'admit card', 'transfer certificate', 'fee receipt', 'salary slip', 'Form 16',
    'bank statement', 'electricity bill', 'rent agreement', 'disability certificate', 'insurance card',
    'discharge summary', 'application form', 'affidavit', 'ID card', 'college ID card', 'identity card',
    'life certificate', 'pension payment order', 'degree certificate', 'relieving letter', 'experience letter',
    'offer letter', 'salary slips', 'bonafide certificate', 'character certificate', 'migration certificate',
    'medical certificate', 'fitness certificate', 'EWS certificate', 'non-creamy layer certificate',
    'residence certificate', 'utility bill', 'property tax receipt', 'sale deed', 'lease deed', 'NOC',
    'police verification', 'income tax return', 'ITR', 'cancelled cheque', 'blood sugar chart',
    'blood sugar record', 'lab reports', 'test reports', 'x-ray', 'scan reports', 'previous prescriptions'];

  // Generic document names: "<word> certificate", "<word> report", "<word> proof".
  const DOC_GENERIC_RE = /\b([A-Za-z][A-Za-z0-9-]{1,20})\s+(certificate|report|proof|receipt|passbook|chart|voucher|slip|statement)s?\b/g;
  const DOC_STOP = new Set(['the', 'a', 'an', 'this', 'that', 'your', 'their', 'his', 'her', 'any', 'all', 'valid', 'such',
    'each', 'every', 'original', 'same', 'said', 'above', 'following', 'required', 'necessary', 'relevant', 'other',
    'no', 'of', 'and', 'or', 'with', 'by', 'to', 'for', 'annual', 'one', 'two', 'credit', 'adverse', 'final', 'is', 'the']);
  // Sentences that ask the reader to bring, send or keep papers.
  const DOC_CONTEXT_RE = /\b(submit|bring|carry|attach|upload|enclose|produce|furnish|keep|documents?|papers|with)\b/i;

  const DOC_TYPES = [
    { type: 'Medical document', words: /\b(patient|diagnosis|tablet|tab\.|mg|dose|doctor|hospital|discharge|medication|symptoms?|surgery|blood pressure)\b/gi },
    { type: 'Government notice or scheme', words: /\b(government|govt|ministry|department|scheme|applicants?|certificate|aadhaar|official|authority|notice|scholarship|pension)\b/gi },
    { type: 'Bank or money letter', words: /\b(bank|account|loan|emi|interest|kyc|customer|branch|credit|debit|payment|₹|rs\.?)\b/gi },
    { type: 'Legal document or agreement', words: /\b(agreement|tenant|landlord|lessee|lessor|party|parties|clause|court|legal|hereinafter|liable|contract)\b/gi },
    { type: 'School or college notice', words: /\b(students?|admission|exams?|examinations?|semester|college|university|school|marks|admit card)\b/gi },
    { type: 'Insurance letter', words: /\b(policy|policyholder|insur\w+|claim|premium|ombudsman|sum insured|waiting period)\b/gi },
    { type: 'Job offer or work letter', words: /\b(candidate|joining|employer|employee|salary|ctc|probation|offer|position|interview)\b/gi },
    { type: 'Utility bill or notice', words: /\b(electricity|consumer|connection|meter|billing|supply|water bill|gas)\b/gi },
    { type: 'Traffic or police notice', words: /\b(challan|vehicle|motor vehicles act|traffic|police|over-speeding|licence)\b/gi },
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

  // Replacements keep their own case. Sentence starts are capitalised later in one pass,
  // so mid-sentence title case ("Insurance Ombudsman") does not leak into the new words.
  function matchCase(original, replacement) {
    return replacement;
  }

  // Fixes "a illness" / "an notice" where a replacement changed the next word.
  function fixArticles(parts) {
    for (let i = 0; i < parts.length - 1; i++) {
      const next = parts[i + 1].t.replace(/^\s+/, '');
      if (!next) continue;
      const vowel = /^[aeiou]/i.test(next) && !/^(?:u[nsr]i|one|eu)/i.test(next);
      if (vowel) parts[i].t = parts[i].t.replace(/\b([Aa])(\s+)$/, (m, a, sp) => a + 'n' + sp);
      else if (/^[a-z]/i.test(next)) parts[i].t = parts[i].t.replace(/\b([Aa])n(\s+)$/, (m, a, sp) => a + sp);
    }
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

  // Always split at linking phrases that hide a consequence or condition.
  function splitLinks(sentence) {
    const marked = sentence
      .replace(/,?\s+failing which,?\s+/gi, '\u0004If not, ')
      .replace(/,\s+otherwise,?\s+/gi, '\u0004Otherwise, ')
      .replace(/,\s+provided\s+(?:that\s+)?/gi, '\u0004This applies only if ')
      .replace(/,\s+in which case\s+/gi, '\u0004In that case, ');
    const pieces = marked.split('\u0004');
    if (pieces.length === 1) return splitLong(sentence);
    return pieces.flatMap((p) => splitLong(ensureEnd(p.trim().replace(/[,;]+$/, ''))));
  }

  // Breaks long sentences at semicolons and some joining words.
  function splitLong(sentence) {
    if (wordCount(sentence) <= 22) return [sentence];

    // "X has been rejected as the illness is ..." -> "X has been rejected. This is because the illness is ..."
    const because = sentence.match(/^(.{15,}?\b(?:has|have|is|are|was|were) (?:not )?been \w+)\s+as\s+((?:the|your|it|you|we|this|there)\b.{20,})$/i);
    if (because) return [ensureEnd(because[1]), ...splitLong(ensureEnd('This is because ' + because[2]))];

    let pieces = protect(sentence).split(/;\s+/).map(restore);
    const out = [];
    for (const piece of pieces) {
      if (wordCount(piece) <= 22) {
        out.push(piece);
        continue;
      }
      // Keep embedded clauses together: "Your EMI, which was due on 5 Nov, has not been received".
      const guarded = piece.replace(/,\s+(which\b[^,]*),(\s+(?:has|have|is|are|was|were|will|shall|may|must|can)\b)/gi, '\u0005$1\u0006$2');
      const parts = guarded.split(/,\s+(?=(?:and|but|so|which|however)\b)/i)
        .map((x) => x.replace(/\u0005/g, ', ').replace(/\u0006/g, ','));
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

  function insideParens(s, idx) {
    let depth = 0;
    for (let i = 0; i < idx; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth = Math.max(0, depth - 1);
    }
    return depth > 0;
  }

  function dosingText(a, b, c) {
    const out = [];
    if (a !== '0') out.push(a + ' in the morning');
    if (b !== '0') out.push(b + ' in the afternoon');
    if (c !== '0') out.push(c + ' at night');
    return out.length > 1 ? out.slice(0, -1).join(', ') + ' and ' + out[out.length - 1] : (out[0] || 'none');
  }

  // Replaces matches with numbered tokens so later rules cannot touch them.
  // Each token keeps the original text so the UI can show what changed.
  function tokenize(s, ctx) {
    const store = [];
    const put = (orig, t, kind) => {
      store.push({ orig, t: kind === 'abbr' ? once(t, ctx.seen) : t, kind });
      return '\u0001' + (store.length - 1) + '\u0002';
    };
    let plural = false;

    for (const rule of PERSON_RULES) {
      s = s.replace(rule.re, (...args) => {
        if (SUBJ_PL_RE.test(args[0])) plural = true;
        return put(args[0], rule.to(...args), 'person');
      });
    }
    if (plural) s = s.replace(/\btheir\b/gi, (m) => put(m, 'your', 'person'));
    // Keep verbs agreeing with "you" later in the sentence: "you are stable and is going home".
    if (store.some((x) => x.kind === 'person' && /^you\b/i.test(x.t))) {
      s = s.replace(/\band\s+(is|was|has)\b/gi, (m, v) => put(m, 'and ' + AGREE[v.toLowerCase()], 'person'));
    }

    s = s.replace(DOSING_RE, (m, a, b, c) => (ctx.medical ? put(m, dosingText(a, b, c), 'abbr') : m));
    s = s.replace(COURSE_RE, (m, n, unit) => (ctx.medical ? put(m, 'for ' + n + ' ' + unit, 'abbr') : m));

    for (const [abbr, meaning] of ABBR) {
      if (MEDICAL_ONLY.has(abbr) && !ctx.medical) continue;
      const re = new RegExp('(?<![A-Za-z0-9/])' + escapeRe(abbr) + '(?![A-Za-z0-9/])', 'g');
      s = s.replace(re, (m, offset, str) => {
        if (/^\s*\(/.test(str.slice(offset + m.length)) || insideParens(str, offset)) return m;
        return put(m, meaning, 'abbr');
      });
    }
    return { s, store };
  }

  // Replaces hard words. Returns parts: [{ t: text, orig?: original }].
  function plainParts(sentence, ctx = {}) {
    let s = sentence;
    for (const re of FILLER) s = s.replace(re, '');
    s = capitalize(s.trim());

    // Leave headings in capitals as they are.
    if (!/[a-z]/.test(s)) return { parts: [{ t: s }], glossary: [] };

    const tok = tokenize(s, ctx);
    const parts = [];
    const glossary = [];
    const segments = tok.s.split(/\u0001(\d+)\u0002/);
    for (let i = 0; i < segments.length; i++) {
      if (i % 2 === 1) {
        const item = tok.store[Number(segments[i])];
        parts.push({ t: item.t, orig: item.orig });
        if (item.kind === 'abbr' && !/^\d/.test(item.orig)) glossary.push({ term: item.orig, meaning: item.t });
        continue;
      }
      jargonParts(segments[i], parts, glossary, ctx.seen);
    }

    fixArticles(parts);

    // Capitalise the first letter of each sentence, including ones created by the rules above.
    let text = '';
    for (const p of parts) {
      const atStart = !text.trim() || /[.!?]\s+$/.test(text) || /^[^:]{1,30}:\s+$/.test(text);
      if (atStart && /^\s*[a-z]/.test(p.t)) {
        p.t = p.t.replace(/^(\s*)([a-z])/, (m, sp, c) => sp + c.toUpperCase());
      }
      text += p.t;
    }
    for (const p of parts) p.t = p.t.replace(/\s{2,}/g, ' ');
    return { parts, glossary };
  }

  // Shows a bracketed explanation only the first time: "tenant (licensee)", then "tenant".
  function once(rep, seen) {
    const m = rep.match(/^(.*\S)\s+\(([^()]+)\)$/);
    if (!m || !seen) return rep;
    const key = rep.toLowerCase();
    if (seen.has(key)) return m[1];
    seen.add(key);
    return rep;
  }

  function jargonParts(s, parts, glossary, seen) {
    let last = 0;
    JARGON_RE.lastIndex = 0;
    let m;
    while ((m = JARGON_RE.exec(s)) !== null) {
      const original = m[0];
      const key = original.toLowerCase().replace(/\s+/g, ' ');
      const replacement = JARGON_MAP.get(key);
      if (replacement === undefined) continue;
      if (m.index > last) parts.push({ t: s.slice(last, m.index) });
      parts.push({ t: once(replacement, seen), orig: original });
      if (!NO_GLOSSARY.has(key)) glossary.push({ term: original, meaning: replacement });
      last = m.index + original.length;
    }
    if (last < s.length) parts.push({ t: s.slice(last) });
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

  // ---------------------------------------------------------------------------
  // Actions and warnings
  // ---------------------------------------------------------------------------
  const VERBS = 'submit|apply|pay|bring|attend|visit|sign|contact|call|dial|report|take|avoid|update|send|register|renew|carry|keep|stop|fill|upload|continue|follow|check|finish|complete|come|go|get|give|write|email|reply|make|use|eat|drink|rest|return|collect|download|print|link|show|wear|book|see|deposit|attach|enclose|remember|do|read|ask|tell|join|raise|file|approach|increase|reduce|walk|wait|inform';
  const IMPERATIVE_RE = new RegExp("^(?:please\\s+|also\\s+)?(?:do not\\s+|don't\\s+|never\\s+|always\\s+)?(?:" + VERBS + ')\\b(?!\\s+of\\b)', 'i');
  const YOU_DUTY_RE = /\byou\s+(?:must|should|need to|have to|will need to)\b|\bplease\b(?!\s+note)/i;
  const PASSIVE_DUTY_RE = /^(.*?)\s*\b(?:must|should|has to|have to|needs to|need to)\s+be\s+(paid|submitted|given|sent|filled in|filled|signed|uploaded|completed|carried|brought|returned|deposited|collected|renewed|updated|attached|done|continued|taken|followed|kept|shown|produced|cleared)\b(?:\s+by you\b)?\s*(.*)$/i;
  const BASE = { paid: 'pay', submitted: 'submit', given: 'give', sent: 'send', filled: 'fill in', 'filled in': 'fill in',
    signed: 'sign', uploaded: 'upload', completed: 'complete', carried: 'carry', brought: 'bring', returned: 'return',
    deposited: 'deposit', collected: 'collect', renewed: 'renew', updated: 'update', attached: 'attach', done: 'do',
    continued: 'continue', taken: 'take', followed: 'follow', kept: 'keep', shown: 'show', produced: 'show', cleared: 'clear' };
  const CONSEQUENCE_RE = /\b(reject\w*|cut off|stopped|suspend\w*|cancel\w*|court|frozen|inactive|not be allowed|not allowed|withdrawn|fine|penalty|extra charge|late fee|extra interest|bad report|credit score|bounced|emergency|right away|legal action|if not|if you do not|do not stop|never)\b/i;
  const WARN_RE2 = new RegExp(WARN_RE.source.replace(/\)\\b$/, '|will not be allowed|cut off|stopped for now|withdrawn|court|bounced|credit score|bad report|late fee|extra charge|if not)\\b'), 'i');

  // Strips lead-ins such as "1. ", "Advice: ", "If X, Y, " and "For queries, ".
  // Tries every comma so "If there is chest pain, breathlessness or sweating, call 108" works.
  function mainClause(s) {
    const t = s.replace(/^\d+[.)]\s+/, '').replace(/^[A-Z][A-Za-z ]{0,20}:\s+/, '');
    if (!/^(?:if|in case|when|for|before|after|during|once|to)\b/i.test(t)) return t;
    const re = /,\s+/g;
    let m;
    let first = null;
    while ((m = re.exec(t)) !== null) {
      const rest = t.slice(m.index + m[0].length);
      if (first === null) first = rest;
      if (IMPERATIVE_RE.test(rest) || /^you\b/i.test(rest)) return rest;
    }
    return first === null ? t : first;
  }

  function isAction(plain) {
    const clause = mainClause(plain);
    const direct = IMPERATIVE_RE.test(clause) || YOU_DUTY_RE.test(clause)
      || (/\bmust\b/i.test(clause) && !/\bmust be\b/i.test(clause));
    if (/^(?:if|in case|if there is)\b/i.test(plain)) {
      return direct || (/^if you\b/i.test(plain) && /^you\s+(?:may|can)\b/i.test(clause));
    }
    if (/\b(?:will not be allowed|not allowed|may be|will be (?:cut off|charged|stopped|rejected|sent))\b/i.test(plain) && !direct) return false;
    return direct || PASSIVE_DUTY_RE.test(plain) || /^(?:check-up visit|come back)\b/i.test(clause);
  }

  function isWarning(plain, action) {
    if (!WARN_RE2.test(plain)) return false;
    if (/^(?:for (?:any )?(?:help|queries|assistance|complaints)|call|contact|(?:final\s+)?diagnosis)\b/i.test(plain)) return false;
    // A to-do only doubles as a warning when it is a safety step.
    if (action) return /^(?:do not|never)\b|\b(?:emergency|right away|immediately)\b/i.test(mainClause(plain));
    return true;
  }

  // Turns duties into short instructions: "The fee must be paid by 5 Dec" -> "Pay the fee by 5 Dec".
  function toImperative(plain) {
    let s = plain.replace(/^\d+[.)]\s+/, '').replace(/^Advice:\s+/i, '');
    if (/^(?:if|in case|if there is)\b/i.test(s)) return ensureEnd(s);
    const p = s.match(PASSIVE_DUTY_RE);
    if (p && p[1].trim() && !/\b(?:you|we|i)\b/i.test(p[1])) {
      const obj = p[1].trim().replace(/^(The|A|An|All|Your|This|These|Those|Each|Every)\b/, (w) => w.toLowerCase());
      const verb = BASE[p[2].toLowerCase()] || p[2];
      s = capitalize(verb) + ' ' + obj + (p[3] ? ' ' + p[3] : '');
    }
    s = s.replace(/^you\s+(?:must|should|need to|have to|will need to)\s+not\s+/i, 'Do not ')
      .replace(/^you\s+(?:must|should|need to|have to|will need to)\s+(?:also\s+)?/i, '')
      .replace(/^please\s+(?:also\s+)?/i, '')
      .replace(/^check-up visit\b/i, 'Go for a check-up visit');
    return ensureEnd(capitalize(s.replace(/\s+([.,;:])/g, '$1').trim()));
  }

  // Medicines with their instructions, cut at the next medicine in the same sentence.
  function findMedicines(text, items) {
    const prefixed = findAll(MED_RE, text).map((m) => m.trim());
    const bare = findAll(MED_BARE_RE, text).map((m) => m.trim())
      .filter((m) => !MED_STOP.has(m.split(/\s+/)[0]));
    const names = uniq(prefixed.concat(bare))
      .filter((n, _, all) => !all.some((o) => o !== n && o.length > n.length && o.includes(n)));
    return names.map((name) => {
      for (const it of items) {
        const i = it.plain.indexOf(name);
        if (i < 0) continue;
        let seg = it.plain.slice(i);
        let cut = seg.length;
        for (const other of names) {
          if (other === name) continue;
          const j = seg.indexOf(other, name.length);
          if (j > 0 && j < cut) cut = j;
        }
        seg = seg.slice(0, cut).replace(/[\s,;.]+(?:and|or)?\s*$/i, '').replace(/\s+(?:and|or)$/i, '')
          .replace(/\s+(?:should|must)\s+be\s+\w+$/i, '').trim();
        return wordCount(seg) <= 20 ? seg : name;
      }
      return name;
    });
  }

  function findDocuments(items) {
    const found = [];
    for (const it of items) {
      if (!DOC_CONTEXT_RE.test(it.original)) continue;
      const low = it.original.toLowerCase();
      for (const d of DOCUMENTS) {
        const re = new RegExp('(?<![a-z])' + escapeRe(d.toLowerCase()) + '(?![a-z])');
        if (re.test(low)) found.push(d);
      }
      DOC_GENERIC_RE.lastIndex = 0;
      let m;
      while ((m = DOC_GENERIC_RE.exec(it.original)) !== null) {
        if (!DOC_STOP.has(m[1].toLowerCase())) found.push(m[0]);
      }
    }
    return uniq(found).filter((d, _, all) => !all.some((o) => o !== d && o.toLowerCase().includes(d.toLowerCase())));
  }

  const EMERGENCY_NUMBERS = new Set(['100', '101', '102', '104', '108', '112', '1091', '1098', '1930']);

  // Summary: what this is, the main thing to do, and the main risk.
  function buildSummary(items, medicines) {
    const head = [];
    const body = []; // { s, index } kept in document order
    const all = () => head.concat(body.map((b) => b.s));
    const addHead = (s) => {
      if (s && wordCount(s) >= 3 && !all().includes(s)) head.push(s);
    };
    const addBody = (it, s) => {
      if (it && s && wordCount(s) >= 3 && !all().includes(s)) body.push({ s, index: it.index });
    };
    const hasDate = (it) => DATE_RES.some((re) => findAll(re, it.original).length);

    const intro = items.find((it) => /^(?:sub|subject|re)\s*[:.-]/i.test(it.original));
    if (intro) addHead('This is about ' + intro.plain.replace(/^(?:sub|subject|re)\s*[:.-]\s*/i, '').replace(/[.]$/, '') + '.');
    const diag = items.find((it) => /^(?:final\s+)?diagnosis\s*:/i.test(it.original));
    if (diag) addHead(diag.plain);
    const invite = items.find((it) => /^you can apply for\b|^this is for\b/i.test(it.plain));
    if (invite) addHead(invite.plain.split(/(?<=\.)\s+/)[0]);

    const dated = items.find((it) => it.isAction && hasDate(it)) || items.find((it) => it.isAction);
    if (dated) addBody(dated, dated.short);

    // Skip sentences that only make sense after the previous one ("This is because ...").
    // "If not, ..." is fine when it follows the chosen action.
    const standsAlone = (it) => !/^(?:this|it|that|these|they)\b/i.test(it.core)
      && (!/^(?:if not|otherwise)\b/i.test(it.core) || (dated && it.index === dated.index + 1));
    const risk = items.find((it) => it.isWarning && CONSEQUENCE_RE.test(it.core) && standsAlone(it) && !all().includes(it.short));
    if (risk) addBody(risk, risk.short);

    if (head.length + body.length < 2) {
      const first = items.find((it) => /[a-z]/.test(it.core) && wordCount(it.core) >= 6 && !/:\s*$/.test(it.core));
      if (first) addBody(first, first.short);
    }

    const out = head.concat(body.sort((a, b) => a.index - b.index).map((b) => b.s));
    if (medicines.length) out.push(`You have ${medicines.length} medicine${medicines.length > 1 ? 's' : ''} to take. See the Medicines list.`);
    return out.slice(0, 4);
  }

  function analyze(input) {
    const text = String(input || '').trim();
    if (!text) throw new Error('Paste some text first.');

    const docType = detectDocType(text);
    const ctx = { medical: docType === 'Medical document', seen: new Set() };
    const paragraphs = toParagraphs(text);
    const plainParagraphs = [];
    const items = []; // { original, plain, index }
    let glossary = [];
    let index = 0;

    for (const para of paragraphs) {
      const sentences = splitSentences(para).flatMap(splitLinks);
      const paraParts = [];
      for (const sentence of sentences) {
        const { parts, glossary: g } = plainParts(sentence, ctx);
        glossary = glossary.concat(g);
        if (paraParts.length) paraParts.push({ t: ' ' });
        paraParts.push(...parts);
        items.push({ original: sentence, plain: partsToText(parts), index: index++ });
      }
      plainParagraphs.push(paraParts);
    }

    for (const it of items) {
      // "This is for all students." is a lead-in; judge the sentence after it.
      it.core = it.plain.replace(/^This is for [^.]+\.\s+/, '');
      it.isAction = /[a-z]/.test(it.core) && isAction(it.core);
      it.isWarning = isWarning(it.core, it.isAction);
      it.short = it.isAction ? toImperative(it.core) : it.core;
    }

    // Dates with what they refer to.
    const dates = [];
    for (const it of items) {
      for (const re of DATE_RES) {
        for (const when of findAll(re, it.original)) {
          dates.push({ when: when.trim(), what: shorten(it.short, 160) });
        }
      }
    }

    const money = [];
    for (const it of items) {
      const amounts = findAll(MONEY_RE, it.original);
      if (MONEY_CONTEXT_RE.test(it.original)) amounts.push(...findAll(PERCENT_RE, it.original));
      for (const amount of amounts) {
        money.push({ amount: amount.trim().replace(/\/-$/, ''), what: shorten(it.short, 160) });
      }
    }

    const documents = findDocuments(items);
    const medicines = findMedicines(text, items);

    const contacts = uniq([
      ...PHONE_RES.flatMap((re) => findAll(re, text)).map((p) => p.trim()),
      ...Array.from(text.matchAll(EMERGENCY_RE), (m) => m[1] + (EMERGENCY_NUMBERS.has(m[1]) ? ' (emergency)' : ' (helpline)')),
      ...findAll(EMAIL_RE, text),
      ...findAll(URL_RE, text).map(trimUrl),
    ]).filter((c, _, all) => !all.some((o) => o !== c && o.replace(/\D/g, '').includes(c.replace(/\D/g, '')) && c.replace(/\D/g, '').length > 0 && o.length > c.length));

    const actions = uniq(items.filter((it) => it.isAction).map((it) => it.short)).slice(0, 12);
    const warnings = uniq(items.filter((it) => it.isWarning).map((it) => it.core)).slice(0, 6);

    const summary = buildSummary(items, medicines);

    // Fallback summary: highest-scoring sentences, kept in document order.
    const scored = items
      .filter((it) => wordCount(it.core) >= 5 && /[a-z]/.test(it.core))
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
    for (const it of scored) {
      if (summary.length >= 4) break;
      if (!summary.includes(it.short)) summary.push(it.short);
    }

    const plainText = plainParagraphs.map(partsToText).join('\n\n');

    return {
      source: 'local',
      language: 'English',
      docType,
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
