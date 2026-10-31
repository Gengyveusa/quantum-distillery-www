import { Link } from 'react-router-dom';
import { useDocumentMeta } from './lib/useDocumentMeta';
import {
  LETTERS_CHOOSER_URL,
  LINKEDIN_URL,
  NEWSLETTERS,
  ORCID,
  ORCID_URL,
  ORG_ID,
  PERSON_ID,
  SITE,
  WEBSITE_ID,
  YOUTUBE_URL,
  newslettersJsonLd,
  personJsonLd,
} from './lib/hub';

/**
 * /about/ — the author page.
 *
 * This is the Person entity's home URL. Its job for answer engines is to be
 * the one page that ties the name, the credentials, the ORCID and every outlet
 * together, so "who writes The Quantum Distillery?" and "who is Thad
 * Connelly?" resolve to the same entity. The structured data does the linking;
 * the visible copy says the same things in words, because a page whose
 * markup claims more than its text is a page crawlers learn to distrust.
 */

const C = {
  bg: '#12100c',
  gold: '#f0a522',
  amber: '#d99a2b',
  cream: '#f5e8c8',
  muted: '#9a8f7a',
  border: 'rgba(240,165,34,0.18)',
  surface: 'rgba(245,232,200,0.04)',
};

const serif = "'Playfair Display', Georgia, serif";
const sans = "'Inter', system-ui, sans-serif";

const h2 = { fontFamily: serif, fontSize: 22, color: C.gold, margin: '56px 0 18px' } as const;
const body = { lineHeight: 1.85, fontSize: 17, opacity: 0.9, margin: '0 0 18px' } as const;
const link = { color: C.amber } as const;

const DESCRIPTION =
  'Thad Connelly, DDS, MD, PhD, FACS: oral and maxillofacial surgeon-scientist at UCSF and the San Francisco VA, and the writer behind The Quantum Distillery, The Practice Ledger and 1840.';

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': `${SITE}/about/#page`,
      url: `${SITE}/about/`,
      name: 'About Thad Connelly',
      description: DESCRIPTION,
      mainEntity: { '@id': PERSON_ID },
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': ORG_ID },
      inLanguage: 'en-US',
    },
    personJsonLd(),
    ...newslettersJsonLd(),
  ],
};

export default function AboutPage() {
  useDocumentMeta({
    title: 'Thad Connelly, DDS, MD, PhD, FACS | The Quantum Distillery',
    description: DESCRIPTION,
    path: '/about',
    jsonLd: JSON_LD,
  });

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.cream, fontFamily: sans }}>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Link to="/" style={{ color: C.amber, textDecoration: 'none', fontSize: 13, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700 }}>
          The Quantum Distillery
        </Link>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
          <a href="/#writing" style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>Writing</a>
          <a href={YOUTUBE_URL} style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>Watch</a>
          <Link to="/" style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>← Home</Link>
        </div>
      </nav>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 96px' }}>
        <p style={{ color: C.amber, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 14 }}>About the distiller</p>

        <h1 style={{ fontFamily: serif, fontSize: 'clamp(30px,5vw,46px)', fontWeight: 400, color: C.gold, lineHeight: 1.15, margin: '0 0 10px' }}>
          Thad Connelly
        </h1>
        <p style={{ color: C.muted, fontSize: 15, letterSpacing: '.12em', margin: '0 0 36px' }}>DDS • MD • PhD • FACS</p>

        <p style={body}>
          Thad Connelly is an oral and maxillofacial surgeon-scientist in San Francisco. He is a Clinical Professor of Oral and
          Maxillofacial Surgery at the University of California, San Francisco, and a staff surgeon at the San Francisco VA
          Medical Center.
        </p>
        <p style={body}>
          He trained in dentistry at Columbia University and earned his MD and PhD at UCSF. His research runs from the
          oral microbiome and oral-systemic disease to artificial intelligence in clinical care, with more than 60
          peer-reviewed publications and NIH R01 funding for AI work.
        </p>
        <p style={body}>
          The Quantum Distillery is where he follows the physics underneath biology, from proton gradients to
          consciousness. It is also home to SedSim, a sedation simulator built for surgical training.
        </p>

        <h2 style={h2}>Writing</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 18 }}>
          {NEWSLETTERS.map((n) => (
            <li key={n.id} style={{ background: C.surface, borderLeft: `2px solid ${C.amber}`, borderRadius: '0 4px 4px 0', padding: '18px 22px' }}>
              <p style={{ margin: '0 0 6px', fontFamily: serif, fontSize: 19, color: C.cream }}>
                <a href={n.readUrl} style={{ color: C.cream, textDecoration: 'none' }}>{n.name}</a>
              </p>
              <p style={{ margin: '0 0 10px', fontSize: 15, opacity: 0.85, lineHeight: 1.6 }}>{n.pitch} {n.cadence}.</p>
              <a href={n.signupUrl} style={{ ...link, fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase', textDecoration: 'none' }}>Subscribe →</a>
            </li>
          ))}
        </ul>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginTop: 16 }}>
          The Practice Ledger and 1840 share one list. <a href={LETTERS_CHOOSER_URL} style={link}>Choose just one</a>.
        </p>

        <h2 style={h2}>Watch</h2>
        <p style={body}>
          The Quantum Distillery series lives on his <a href={YOUTUBE_URL} style={link}>YouTube channel</a>.
        </p>

        <h2 style={h2}>Find him elsewhere</h2>
        <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2, fontSize: 16 }}>
          <li>ORCID: <a href={ORCID_URL} style={link}>{ORCID}</a></li>
          <li><a href={LINKEDIN_URL} style={link}>LinkedIn</a></li>
          <li><a href="https://www.threads.net/@connelly.thad" style={link}>Threads</a></li>
          <li><a href="https://www.ucsfdentalcenter.org/providers/stephen-connelly-dds-md-phd" style={link}>UCSF Dental Center profile</a></li>
        </ul>
      </article>
    </div>
  );
}
