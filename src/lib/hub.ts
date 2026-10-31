/**
 * The front door: every outlet, channel and profile that belongs to Thad
 * Connelly, in one place.
 *
 * The landing page, the /about/ author page and the Person structured data all
 * render from this file, so a new newsletter or a renamed channel is one edit
 * here rather than a hunt through three components. Answer engines connect an
 * author to their work through repeated, consistent sameAs links; keeping the
 * list single-sourced is what keeps them consistent.
 */

export const SITE = 'https://thequantumdistillery.com';

/** Stable entity ids. Shared with the graph in index.html; never change them. */
export const PERSON_ID = `${SITE}/#founder`;
export const ORG_ID = `${SITE}/#organization`;
export const WEBSITE_ID = `${SITE}/#website`;

export const ORCID = '0009-0003-4800-3913';
export const ORCID_URL = `https://orcid.org/${ORCID}`;
export const LINKEDIN_URL = 'https://www.linkedin.com/in/stephen-thaddeus-connelly-8954024b';

/**
 * The channel ID URL rather than the @handle: it survives the channel rename
 * (GengyveUSA -> Dr Thaddeus Connelly), which a handle URL would not.
 */
export const YOUTUBE_URL = 'https://www.youtube.com/channel/UC3thFE5bh0MLD2ywJ1KQ-rg';

export type Newsletter = {
  id: 'pours' | 'ledger' | '1840';
  name: string;
  /** One-line pitch shown on the home page. */
  pitch: string;
  /** Who it is written for. */
  audience: string;
  cadence: string;
  /** Where the issues live. */
  readUrl: string;
  /** The Ghost Portal signup for the site that sends it. */
  signupUrl: string;
  /** Ghost site that sends it; two newsletters share one. */
  site: string;
};

const POURS_SITE = 'https://pours.thequantumdistillery.com';
const LETTERS_SITE = 'https://letters.ovnnexus.com';

export const NEWSLETTERS: Newsletter[] = [
  {
    id: 'pours',
    name: 'The Quantum Distillery',
    pitch: 'Quantum mechanics meets biology, one word per pour.',
    audience: 'Curious minds in science and medicine',
    cadence: 'Every other Wednesday',
    readUrl: `${POURS_SITE}/`,
    signupUrl: `${POURS_SITE}/#/portal/signup`,
    site: POURS_SITE,
  },
  {
    id: 'ledger',
    name: 'The Practice Ledger',
    pitch: 'What AI is changing in the economics of dental practice, and what it costs.',
    audience: 'Dentists, practice owners and DSO leaders',
    cadence: 'Sundays',
    readUrl: `${LETTERS_SITE}/`,
    signupUrl: `${LETTERS_SITE}/#/portal/signup`,
    site: LETTERS_SITE,
  },
  {
    id: '1840',
    name: '1840',
    pitch: 'Undo 1840. The dispatch on putting the mouth back in the body.',
    audience: 'Dentists, hygienists and physicians',
    cadence: 'Thursdays',
    readUrl: `${LETTERS_SITE}/`,
    signupUrl: `${LETTERS_SITE}/#/portal/signup`,
    site: LETTERS_SITE,
  },
];

/** Lets a reader take only one of the two OVN Nexus letters. */
export const LETTERS_CHOOSER_URL = `${LETTERS_SITE}/newsletters/`;

/**
 * Profiles that are the same person. Order is not significant to crawlers but
 * is kept stable so diffs stay readable.
 */
export const SAME_AS = [
  ORCID_URL,
  LINKEDIN_URL,
  YOUTUBE_URL,
  'https://www.threads.net/@connelly.thad',
  `${POURS_SITE}/author/thad/`,
  `${LETTERS_SITE}/author/thad/`,
  'https://www.ucsfdentalcenter.org/providers/stephen-connelly-dds-md-phd',
];

/**
 * The Person entity. index.html carries a copy under the same @id for the
 * home page; this is the fuller version the /about/ page publishes.
 */
export function personJsonLd() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Thad Connelly',
    givenName: 'Stephen',
    additionalName: 'Thaddeus',
    familyName: 'Connelly',
    alternateName: [
      'Stephen Thaddeus Connelly',
      'S. Thaddeus Connelly',
      'Thaddeus Connelly',
      'Dr Thaddeus Connelly',
      'Stephen Connelly',
    ],
    honorificSuffix: 'DDS, MD, PhD, FACS',
    url: `${SITE}/about/`,
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'ORCID',
      value: ORCID,
      url: ORCID_URL,
    },
    jobTitle: 'Oral and maxillofacial surgeon-scientist',
    description:
      'Oral and maxillofacial surgeon-scientist. Clinical Professor of Oral and Maxillofacial Surgery at the University of California, San Francisco, and staff surgeon at the San Francisco VA Medical Center. Writes The Quantum Distillery, The Practice Ledger and 1840.',
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Oral and maxillofacial surgeon',
    },
    affiliation: [
      { '@type': 'CollegeOrUniversity', name: 'University of California, San Francisco', url: 'https://www.ucsf.edu/' },
      { '@type': 'Hospital', name: 'San Francisco VA Medical Center' },
    ],
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Columbia University' },
      { '@type': 'CollegeOrUniversity', name: 'University of California, San Francisco' },
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: 'DDS', recognizedBy: { '@type': 'CollegeOrUniversity', name: 'Columbia University' } },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: 'MD', recognizedBy: { '@type': 'CollegeOrUniversity', name: 'University of California, San Francisco' } },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'degree', name: 'PhD', recognizedBy: { '@type': 'CollegeOrUniversity', name: 'University of California, San Francisco' } },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'certification', name: 'Fellow, American College of Surgeons (FACS)' },
    ],
    knowsAbout: [
      'Oral and maxillofacial surgery',
      'Quantum biology',
      'Oral-systemic health',
      'Artificial intelligence in dentistry',
      'Medical simulation',
      'Pharmacokinetics',
    ],
    worksFor: { '@id': ORG_ID },
    sameAs: SAME_AS,
  };
}

/** The three newsletters as entities, each authored by the Person. */
export function newslettersJsonLd() {
  return NEWSLETTERS.map((n) => ({
    '@type': 'Periodical',
    '@id': `${SITE}/#newsletter-${n.id}`,
    name: n.name,
    description: n.pitch,
    url: n.readUrl,
    author: { '@id': PERSON_ID },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  }));
}
