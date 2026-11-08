/* Example documents for the demo. All names, numbers and links are made up. */
(function (root) {
  'use strict';

  const SAMPLES = {
    scholarship: {
      label: 'Scholarship notice',
      text: `NOTICE

This is to inform all eligible candidates that applications are invited for the Post-Matric Scholarship Scheme for the academic year 2026-27. Applicants are required to submit the duly filled application form in the prescribed format on or before 30th November 2026 through the National Scholarship Portal (https://scholarships.example.gov.in).

The following documents shall be furnished along with the application: Aadhaar card, income certificate issued by the competent authority, caste certificate, previous year marksheet, bank passbook and two passport-size photographs. All documents must be duly self-attested.

Eligibility criteria: The annual family income of the applicant shall not exceed Rs. 2,50,000 per annum from all sources. In the event of failure to furnish the requisite documents within the stipulated time, the application shall be liable to be summarily rejected and no correspondence in this regard shall be entertained.

Verification of documents will be done at the institute level within 15 days of submission. For grievance redressal, applicants may contact the helpline at 1800-111-2222 or write to help@scholarships.example.gov.in.`,
    },
    discharge: {
      label: 'Hospital discharge',
      text: `DISCHARGE SUMMARY

Patient Name: Ramesh Kumar        Age: 58 years

Diagnosis: Acute myocardial infarction with hypertension and type 2 diabetes mellitus.

The patient underwent coronary angioplasty and is being discharged in stable condition. The patient is advised to continue Tab. Aspirin 75 mg once daily after food and Tab. Atorvastatin 40 mg once daily at night. Tab. Metformin 500 mg twice daily should be continued.

The patient is advised to abstain from strenuous physical activity and to avoid excessive salt intake. Do not discontinue the antiplatelet medication without consulting the cardiologist.

Follow-up in Cardiology OPD after 7 days with all reports. In the event of chest pain, breathlessness or excessive sweating, seek immediate medical attention or call 108.`,
    },
    bank: {
      label: 'Bank KYC letter',
      text: `Dear Customer,

This is to bring to your notice that the KYC (Know Your Customer) details for your savings account ending 4521 are due for periodic updation as per the RBI guidelines. You are hereby requested to submit a self-attested copy of officially valid documents such as Aadhaar card or passport, along with a recent photograph, at your home branch on or before 15 December 2026.

Kindly note that in the event of non-compliance with the aforesaid requirement, your account shall be liable to be classified as inoperative and all debit transactions shall be frozen with immediate effect. A penalty of Rs. 500 may also be levied.

For any assistance, please call our toll-free number 1800-222-3333 or visit www.examplebank.in.`,
    },
  };

  root.ClearPasteSamples = SAMPLES;
})(typeof window !== 'undefined' ? window : globalThis);
