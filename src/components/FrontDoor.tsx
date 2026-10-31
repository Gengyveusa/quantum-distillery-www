import { Link } from 'react-router-dom';
import { LETTERS_CHOOSER_URL, NEWSLETTERS, YOUTUBE_URL } from '../lib/hub';

/**
 * The home page's front-door sections: Writing (with subscribe) and Watch.
 *
 * Subscribing goes to each newsletter's own Ghost Portal signup rather than an
 * embedded third-party form, so the email lands on the real list with Ghost's
 * own double opt-in, and nothing here can drift out of sync with Ghost.
 *
 * The Practice Ledger and 1840 are sent from one Ghost site, where a single
 * signup subscribes to both; the chooser link lets a reader keep just one.
 */

const C = {
  border: '#3d2a0a',
  amber: '#c8860a',
  amberBright: '#f0a522',
  gold: '#ffd060',
  cream: '#f5e8c8',
  muted: '#8a7050',
  bg: '#0a0705',
  white: '#ffffff',
} as const;

const serif = "'Playfair Display',serif";
const sans = "'Inter','Helvetica Neue','Arial',sans-serif";

const eyebrow = {
  color: C.amber,
  fontSize: 12,
  letterSpacing: '.3em',
  textTransform: 'uppercase' as const,
  marginBottom: 12,
};

const primaryBtn = {
  display: 'inline-block',
  background: C.amber,
  color: C.bg,
  border: 'none',
  padding: '12px 22px',
  fontSize: 12,
  letterSpacing: '.12em',
  textTransform: 'uppercase' as const,
  fontFamily: sans,
  fontWeight: 700,
  textDecoration: 'none',
  transition: 'all .2s',
};

const quietLink = {
  color: C.amberBright,
  fontSize: 12,
  letterSpacing: '.12em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  fontFamily: sans,
};

export function WritingSection() {
  return (
    <section id="writing" className="qd-fade" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 40px', scrollMarginTop: 80 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={eyebrow}>Writing</p>
        <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px,4vw,40px)', color: C.gold, marginBottom: 16 }}>Three letters, one distiller</h2>
        <p style={{ color: C.cream, maxWidth: 640, margin: '0 auto', lineHeight: 1.8, fontSize: 16, opacity: 0.85 }}>
          Free by email. Pick the ones that fit how you spend your days.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24 }}>
        {NEWSLETTERS.map((n) => (
          <article key={n.id} className="qd-glass" style={{ padding: 32, display: 'flex', flexDirection: 'column' }}>
            <p style={{ color: C.muted, fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>{n.cadence}</p>
            <h3 style={{ fontFamily: serif, fontSize: 24, color: C.white, marginBottom: 12 }}>{n.name}</h3>
            <p style={{ color: C.cream, lineHeight: 1.7, fontSize: 15, opacity: 0.9, marginBottom: 10 }}>{n.pitch}</p>
            <p style={{ color: C.muted, lineHeight: 1.6, fontSize: 13, marginBottom: 24 }}>For {n.audience.charAt(0).toLowerCase() + n.audience.slice(1)}.</p>
            <div style={{ marginTop: 'auto', display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href={n.signupUrl} className="qd-btn" style={primaryBtn} aria-label={`Subscribe to ${n.name}`}>Subscribe</a>
              <a href={n.readUrl} className="qd-link" style={quietLink}>Read →</a>
            </div>
          </article>
        ))}
      </div>

      <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7, textAlign: 'center', maxWidth: 640, margin: '28px auto 0' }}>
        The Practice Ledger and 1840 go out from the same list, so one signup brings both.{' '}
        <a href={LETTERS_CHOOSER_URL} className="qd-link" style={{ color: C.amberBright }}>Choose just one</a> any time.
      </p>
    </section>
  );
}

export function WatchSection() {
  return (
    <section id="watch" className="qd-fade qd-glass" style={{ maxWidth: 900, margin: '48px auto', padding: '56px 44px', textAlign: 'center', scrollMarginTop: 80 }}>
      <p style={eyebrow}>Watch</p>
      <h2 style={{ fontFamily: serif, fontSize: 'clamp(24px,4vw,36px)', color: C.gold, marginBottom: 16 }}>The Distillery on YouTube</h2>
      <p style={{ color: C.cream, maxWidth: 620, margin: '0 auto 30px', lineHeight: 1.8, fontSize: 15, opacity: 0.85 }}>
        The channel where the pours become episodes: the surgeon on camera, the physics in motion.
      </p>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <a href={YOUTUBE_URL} className="qd-btn" style={primaryBtn}>Watch on YouTube</a>
        <Link to="/about" className="qd-link" style={quietLink}>About Thad →</Link>
      </div>
    </section>
  );
}
