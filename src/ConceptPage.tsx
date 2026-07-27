import { Link, useParams } from 'react-router-dom';
import { CONCEPTS, conceptBySlug } from './lib/concepts';
import { useDocumentMeta } from './lib/useDocumentMeta';

/**
 * A single concept at its own URL.
 *
 * The point is citability: an answer engine asked "what is quantum biology?"
 * can now be pointed at a page that is about exactly that, rather than at a
 * landing page where the answer is one of twelve collapsed tabs.
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

export default function ConceptPage() {
  const { slug = '' } = useParams();
  const concept = conceptBySlug[slug];

  // Hooks must run unconditionally, so the not-found case feeds the same hook
  // rather than returning before it.
  useDocumentMeta({
    title: concept
      ? `${concept.title} — The Quantum Distillery`
      : 'Not found — The Quantum Distillery',
    description: concept
      ? concept.body.slice(0, 155).trimEnd() + '…'
      : 'That concept does not exist.',
    path: `/concepts/${slug}`,
    noindex: !concept,
    jsonLd: concept
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'DefinedTerm',
              '@id': `https://thequantumdistillery.com/concepts/${concept.slug}#term`,
              name: concept.title,
              alternateName: concept.name,
              description: concept.body,
              inDefinedTermSet: {
                '@type': 'DefinedTermSet',
                name: 'The Connelly Lexicon',
                url: 'https://corpus.gengyveusa.com/',
              },
            },
            {
              '@type': 'Article',
              '@id': `https://thequantumdistillery.com/concepts/${concept.slug}#article`,
              headline: concept.title,
              description: concept.body.slice(0, 300),
              about: { '@id': `https://thequantumdistillery.com/concepts/${concept.slug}#term` },
              articleSection: concept.discipline,
              author: { '@id': 'https://thequantumdistillery.com/#founder' },
              publisher: { '@id': 'https://thequantumdistillery.com/#organization' },
              isPartOf: { '@id': 'https://thequantumdistillery.com/#website' },
              inLanguage: 'en-US',
            },
          ],
        }
      : undefined,
  });

  if (!concept) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream, fontFamily: sans, padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: serif, color: C.gold, fontSize: 32, marginBottom: 16 }}>Not found</h1>
        <p style={{ color: C.muted, marginBottom: 28 }}>No concept lives at that address.</p>
        <Link to="/" style={{ color: C.amber }}>Back to the distillery</Link>
      </div>
    );
  }

  const related = CONCEPTS.filter(
    (c) => c.discipline === concept.discipline && c.slug !== concept.slug
  );

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.cream, fontFamily: sans }}>
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Link to="/" style={{ color: C.amber, textDecoration: 'none', fontSize: 13, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700 }}>
          The Quantum Distillery
        </Link>
        <Link to="/" style={{ color: C.muted, textDecoration: 'none', fontSize: 13 }}>← All concepts</Link>
      </nav>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 96px' }}>
        <p style={{ color: C.amber, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 14 }}>
          {concept.discipline}
        </p>

        <h1 style={{ fontFamily: serif, fontSize: 'clamp(30px,5vw,46px)', fontWeight: 400, color: C.gold, lineHeight: 1.15, margin: '0 0 28px' }}>
          {concept.title}
        </h1>

        <p style={{ lineHeight: 1.85, fontSize: 17, opacity: 0.9, marginBottom: 32 }}>{concept.body}</p>

        <aside style={{ background: C.surface, borderLeft: `2px solid ${C.amber}`, borderRadius: '0 4px 4px 0', padding: '22px 26px' }}>
          <p style={{ color: C.amber, fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 10 }}>
            The insight
          </p>
          <p style={{ color: C.cream, lineHeight: 1.75, fontSize: 15, fontStyle: 'italic', fontFamily: serif, margin: 0 }}>
            {concept.insight}
          </p>
        </aside>

        {related.length > 0 && (
          <section style={{ marginTop: 64, borderTop: `1px solid ${C.border}`, paddingTop: 32 }}>
            <h2 style={{ fontFamily: serif, fontSize: 20, color: C.gold, marginBottom: 18 }}>
              More in {concept.discipline}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link to={`/concepts/${r.slug}`} style={{ color: C.cream, opacity: 0.85, textDecoration: 'none', fontSize: 15 }}>
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
