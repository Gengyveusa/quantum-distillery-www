import { Link, useNavigate } from 'react-router-dom';
import { conceptByName } from './lib/concepts';
import { useDocumentMeta } from './lib/useDocumentMeta';
import { useEffect, useRef, useState } from 'react';
import FluidStarfield from './components/FluidStarfield';

/* ---- Liquid Glass capability tier ----
 * Picks the best material the browser can render. See the inline comment on the
 * `native` branch: there is currently NO public web API for Liquid Glass, so that
 * branch is an inert, forward-compatible placeholder. Tier 'svg' is the real ceiling. */
type GlassTier = 'native' | 'svg' | 'blur' | 'solid';

function pickGlassTier(): GlassTier {
  if (typeof window === 'undefined' || !window.CSS || !CSS.supports) return 'blur';
  if (window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches) return 'solid';

  // Tier 1 — native WebKit Liquid Glass.
  // As of iOS/Safari 27 (June 2026) the only known property is the PRIVATE
  // `-apple-visual-effect`, gated behind the private WKPreferences flag
  // `useSystemAppearance`. It does NOT work on the open web and is not App
  // Store-safe. There is currently NO public web API for Liquid Glass. This
  // check stays inert until/unless Apple ships a standardized, publicly
  // detectable property — at which point this is the only edit needed.
  const NATIVE_GLASS_PROP = '-apple-visual-effect';
  if (CSS.supports(NATIVE_GLASS_PROP, 'liquid')) return 'native';

  const hasBackdrop =
    CSS.supports('backdrop-filter', 'blur(2px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(2px)');
  if (!hasBackdrop) return 'solid';

  // SVG displacement refraction needs a url() filter inside backdrop-filter, and
  // we drop it under reduced-motion. Otherwise fall back to plain blur.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'blur';
  const hasUrlBackdrop =
    CSS.supports('backdrop-filter', 'url(#x)') ||
    CSS.supports('-webkit-backdrop-filter', 'url(#x)');
  return hasUrlBackdrop ? 'svg' : 'blur';
}

/* ---- Quantum Distillery Brand Tokens ---- */
const C = {
  bg: '#0a0705',
  surface: '#120e08',
  card: '#1c1409',
  border: '#3d2a0a',
  amber: '#c8860a',
  amberBright: '#f0a522',
  gold: '#ffd060',
  orange: '#e05a0a',
  cream: '#f5e8c8',
  muted: '#8a7050',
  dim: '#5a4530',
  white: '#ffffff',
} as const;

const font = {
  serif: "'Georgia','Times New Roman',serif",
  sans: "'Inter','Helvetica Neue','Arial',sans-serif",
};

/* ---- Tab Content Data ---- */
// Concepts now live in src/lib/concepts.ts so the landing page and the
// per-concept routes render from one source. Keyed by tag label here because
// that is what the discipline `tags` arrays below contain.
const tabContent = conceptByName;

export default function LandingPage() {
  const navigate = useNavigate();

  // The home route claims the site-level title. Without this, whichever route
  // the visitor happened to load first would leave its title in place.
  useDocumentMeta({
    title: 'The Quantum Distillery — From the Quantum to the Clinical',
    description:
      'Quantum biology, information theory, and the Epoch #4 framework — plus clinical instruments like SedSim. Distilling complexity into clarity.',
    path: '/',
  });
  const obs = useRef<IntersectionObserver | null>(null);
  // Resolve the glass tier on the client (defaults to 'blur' for the first paint).
  const [glassTier, setGlassTier] = useState<GlassTier>('blur');
  useEffect(() => { setGlassTier(pickGlassTier()); }, []);
  const [activeTabs, setActiveTabs] = useState<Record<string, string | null>>({
    Mathematics: null,
    Physics: null,
    Biology: null,
  });

  const toggleTab = (section: string, tag: string) => {
    setActiveTabs(prev => ({
      ...prev,
      [section]: prev[section] === tag ? null : tag,
    }));
  };

  useEffect(() => {
    obs.current = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('qd-visible'); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.qd-fade').forEach(el => obs.current?.observe(el));
    return () => obs.current?.disconnect();
  }, []);

  return (
    <div className={`qd-root qd-tier-${glassTier}`} style={{ background:'transparent', minHeight:'100vh', color:C.cream, fontFamily:font.sans, position:'relative' }}>

      {/* ---- FLUID STARFIELD (fixed, behind everything; paints the base colour) ---- */}
      <FluidStarfield baseColor={C.bg} />

      {/* ---- SHARED SVG DISPLACEMENT FILTER (one def, reused by every glass panel) ---- */}
      <svg width="0" height="0" aria-hidden="true" style={{ position:'absolute' }}>
        <filter id="qd-glass-distort" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={2} seed={7} result="noise" />
          <feGaussianBlur in="noise" stdDeviation="1.2" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale={14} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* ---- GLOBAL ANIMATION STYLES ---- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;600;700&display=swap');
        .qd-fade { opacity:0; transform:translateY(24px); transition:opacity .7s ease,transform .7s ease; }
        .qd-visible { opacity:1!important; transform:translateY(0)!important; }
        .qd-glow { animation: qdPulse 4s ease-in-out infinite alternate; }
        @keyframes qdPulse { 0%{box-shadow:0 0 30px rgba(200,134,10,.12)} 100%{box-shadow:0 0 60px rgba(240,165,34,.25)} }
        .qd-btn:hover { background:${C.amberBright}!important; }
        .qd-btn2:hover { background:${C.amber}!important; color:${C.bg}!important; }
        .qd-card:hover { background:${C.surface}!important; }
        .qd-link:hover { color:${C.amberBright}!important; }
        .qd-tab-content { max-height:0; overflow:hidden; transition:max-height .5s ease, opacity .5s ease, padding .5s ease; opacity:0; padding:0 24px; }
        .qd-tab-content.open { max-height:600px; opacity:1; padding:24px; }

        /* ---- LIQUID GLASS MATERIAL ---- */
        html, body { background:${C.bg}; }
        .qd-root {
          --qd-glass-blur: 18px;
          --qd-glass-sat: 180%;
          --qd-glass-tint: rgba(245,232,200,0.05);   /* low-alpha cream */
          --qd-glass-radius: 18px;
          --qd-glass-border: rgba(255,208,96,0.22);
        }
        /* Frosted base + specular rim + depth. Sits over the starfield, so the
           drifting stars show through and bend at the edges. */
        .qd-glass {
          position: relative;
          background: var(--qd-glass-tint);
          -webkit-backdrop-filter: blur(var(--qd-glass-blur)) saturate(var(--qd-glass-sat));
          backdrop-filter: blur(var(--qd-glass-blur)) saturate(var(--qd-glass-sat));
          border: 1px solid var(--qd-glass-border);
          border-radius: var(--qd-glass-radius);
          box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18);
          transition: background .25s ease, transform .25s ease, box-shadow .25s ease;
        }
        /* Specular rim: bright top-left highlight fading out. */
        .qd-glass::before {
          content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
          background: linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 42%);
          mix-blend-mode: screen; opacity:.6;
        }
        /* Faint gold inner glow. */
        .qd-glass::after {
          content:''; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
          box-shadow: inset 0 0 40px rgba(240,165,34,0.06);
        }
        .qd-glass:hover { background: rgba(245,232,200,0.09); transform: translateY(-2px); }

        /* Tier 2/native — add edge refraction by chaining the SVG displacement
           into the backdrop filter (one shared #qd-glass-distort def). */
        .qd-tier-svg .qd-glass, .qd-tier-native .qd-glass {
          -webkit-backdrop-filter: blur(var(--qd-glass-blur)) saturate(var(--qd-glass-sat)) url(#qd-glass-distort);
          backdrop-filter: blur(var(--qd-glass-blur)) saturate(var(--qd-glass-sat)) url(#qd-glass-distort);
        }
        /* Tier 3 (blur) uses the base class as-is. Tier 4 (solid) drops transparency. */
        .qd-tier-solid .qd-glass {
          -webkit-backdrop-filter:none; backdrop-filter:none;
          background: rgba(28,20,9,0.92);
        }
        .qd-tier-solid .qd-glass::before { display:none; }

        /* Nav variant: full-width sticky bar, flat (no radius / side borders). */
        .qd-nav { position:sticky; top:0; z-index:20; }
        .qd-nav.qd-glass { border-radius:0; border-left:none; border-right:none; border-top:none; }
        .qd-nav.qd-glass::before { border-radius:0; }
        /* Narrow screens: stop the links crowding the brand — wrap and centre. */
        @media (max-width: 640px) {
          .qd-nav { flex-wrap:wrap; justify-content:center; gap:8px 18px; padding:14px 20px; text-align:center; }
          .qd-nav > div { flex-wrap:wrap; justify-content:center; gap:12px 18px; }
        }

        @media (prefers-reduced-transparency: reduce) {
          .qd-glass { -webkit-backdrop-filter:none; backdrop-filter:none; background: rgba(28,20,9,0.92); }
          .qd-glass::before { display:none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .qd-tier-svg .qd-glass, .qd-tier-native .qd-glass {
            -webkit-backdrop-filter: blur(var(--qd-glass-blur)) saturate(var(--qd-glass-sat));
            backdrop-filter: blur(var(--qd-glass-blur)) saturate(var(--qd-glass-sat));
          }
          .qd-glass:hover { transform:none; }
        }
      `}</style>

      {/* ---- NAV ---- */}
      <nav className="qd-nav qd-glass" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px' }}>
        <span style={{ color:C.amber, fontSize:13, letterSpacing:'.2em', textTransform:'uppercase', fontFamily:font.sans, fontWeight:700 }}>The Quantum Distillery</span>
        <div style={{ display:'flex', gap:28 }}>
          <a href="https://thequantumdistillery.substack.com" className="qd-link" style={{ color:C.muted, textDecoration:'none', fontSize:13, letterSpacing:'.1em', fontFamily:font.sans, transition:'color .2s' }}>Substack</a>
          <a href="https://www.gengyveusa.com" className="qd-link" style={{ color:C.muted, textDecoration:'none', fontSize:13, letterSpacing:'.1em', fontFamily:font.sans, transition:'color .2s' }}>Gengyve</a>
          <span onClick={() => navigate('/sim')} className="qd-link" style={{ color:C.muted, cursor:'pointer', fontSize:13, letterSpacing:'.1em', fontFamily:font.sans, transition:'color .2s' }}>SedSim</span>
          <span onClick={() => navigate('/instructor')} className="qd-link" style={{ color:C.muted, cursor:'pointer', fontSize:13, letterSpacing:'.1em', fontFamily:font.sans, transition:'color .2s' }}>Instructor</span>
        </div>
      </nav>

      {/* ---- HERO ---- */}
      <section className="qd-fade" style={{ textAlign:'center', padding:'100px 24px 80px' }}>
        <p style={{ color:C.muted, fontSize:12, letterSpacing:'.3em', textTransform:'uppercase', marginBottom:20 }}>Est. 2024 — San Francisco</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(36px,6vw,72px)', fontWeight:400, color:C.gold, lineHeight:1.1, margin:'0 0 16px' }}>the quantum distillery</h1>
        <p style={{ color:C.muted, fontSize:15, letterSpacing:'.15em', marginBottom:40 }}>Thad Connelly • MD • DDS • PhD</p>
        <p style={{ color:C.cream, fontSize:17, maxWidth:560, margin:'0 auto 48px', lineHeight:1.7, fontFamily:font.serif, fontStyle:'italic', opacity:.85 }}>Distilling complexity into clarity — from the quantum to the clinical</p>
        <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/sim')} className="qd-btn" style={{ background:C.amber, color:C.bg, border:'none', padding:'14px 32px', fontSize:13, letterSpacing:'.12em', textTransform:'uppercase', fontFamily:font.sans, fontWeight:700, cursor:'pointer', transition:'all .2s' }}>Launch SedSim</button>
          <a href="https://thequantumdistillery.substack.com" className="qd-btn2 qd-glass" style={{ border:`1px solid ${C.amber}`, color:C.amber, borderRadius:6, padding:'14px 32px', fontSize:13, letterSpacing:'.12em', textTransform:'uppercase', fontFamily:font.sans, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>Read the Pours</a>
        </div>
      </section>

      {/* ---- DEFINITION I: DISTILLERY ---- */}
      <section className="qd-fade qd-glass" style={{ maxWidth:780, margin:'48px auto', padding:'56px 44px' }}>
        <p style={{ color:C.amber, fontSize:12, letterSpacing:'.3em', marginBottom:8 }}><span style={{ fontFamily:font.serif, fontStyle:'italic', fontSize:20, marginRight:8 }}>I</span>&nbsp;&nbsp;noun &bull; /dɪˈstɪləri/</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:C.gold, marginBottom:20 }}>Distillery</h2>
        <p style={{ color:C.cream, lineHeight:1.8, fontSize:16, opacity:.85 }}>A place where raw, complex ingredients are subjected to heat and pressure, separated into their essential components, and refined into something pure, potent, and concentrated. The crude is transformed into the clear. The chaotic is reduced to its essence.</p>
        <blockquote style={{ borderLeft:`2px solid ${C.amber}`, margin:'30px 0 0 0', padding:'12px 24px', color:C.muted, fontFamily:font.serif, fontStyle:'italic', fontSize:15, lineHeight:1.7 }}>The distiller does not invent the spirit. The spirit was always there, hidden inside the grain. The distiller simply removes everything that is not the spirit.</blockquote>
      </section>

      {/* ---- DEFINITION II: QUANTUM DISTILLERY ---- */}
      <section className="qd-fade qd-glass" style={{ maxWidth:780, margin:'48px auto', padding:'56px 44px' }}>
        <p style={{ color:C.amber, fontSize:12, letterSpacing:'.3em', marginBottom:8 }}><span style={{ fontFamily:font.serif, fontStyle:'italic', fontSize:20, marginRight:8 }}>II</span>&nbsp;&nbsp;noun &bull; /ˈkwɒntəm dɪˈstɪləri/</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:C.gold, marginBottom:20 }}>The Quantum Distillery</h2>
        <p style={{ color:C.cream, lineHeight:1.8, fontSize:16, opacity:.85 }}>An intellectual framework where the deepest principles of mathematics, physics, and biology are distilled from their native complexity into accessible, interconnected understanding. We take the raw substrate of scientific knowledge — wave functions, thermodynamic gradients, enzyme kinetics, information entropy — and refine them into clear, potent insight about how life actually works, from the subatomic to the surgical.</p>
        <blockquote style={{ borderLeft:`2px solid ${C.amber}`, margin:'30px 0 0 0', padding:'12px 24px', color:C.muted, fontFamily:font.serif, fontStyle:'italic', fontSize:15, lineHeight:1.7 }}>Life is not chemistry. Life is not physics. Life is the conversation between them — and mathematics is the language they speak.</blockquote>
      </section>

      {/* ---- CONVERGENCE HEADER ---- */}
      <section className="qd-fade" style={{ textAlign:'center', padding:'80px 24px 40px' }}>
        <p style={{ color:C.amber, fontSize:12, letterSpacing:'.3em', textTransform:'uppercase', marginBottom:12 }}>The Convergence</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(24px,4vw,40px)', color:C.gold, marginBottom:16 }}>Understanding Life from Top to Bottom</h2>
        <p style={{ color:C.cream, maxWidth:680, margin:'0 auto', lineHeight:1.8, fontSize:16, opacity:.85 }}>Life cannot be fully understood from within a single discipline. It demands the convergence of three fundamental languages — each incomplete alone, each essential together. The Quantum Distillery exists at their intersection.</p>
      </section>

      {/* ---- CONVERGENCE LADDER ---- */}
      {[{role:'Foundation',name:'Mathematics',q:'What are the patterns that govern all systems?',a:'Mathematics is the language of structure itself. It gives us the tools to describe probability distributions governing electron behavior, the differential equations modeling cardiac rhythms, and the information theory underlying consciousness.',tags:['Information Theory','Topology','Stochastic Modeling','Bayesian Inference']},{role:'Mechanism',name:'Physics',q:'What forces and fields make life possible?',a:'Physics reveals the machinery beneath biology. Quantum tunneling drives enzyme catalysis. Proton gradients across mitochondrial membranes generate the electrochemical potential that powers every cell. Thermodynamic entropy dictates why living systems must constantly import energy or die.',tags:['Quantum Tunneling','Thermodynamics','Electrodynamics','Negative Entropy']},{role:'Expression',name:'Biology',q:'How does matter become alive?',a:'Biology is where mathematics and physics become visible. DNA encodes information. Proteins fold into functional machines governed by quantum forces. Neurons fire in patterns that somehow produce experience. Disease is not a biological failure alone — it is a failure of physics at the molecular scale.',tags:['Molecular Biology','Quantum Biology','Consciousness','Epoch #4']}].map((d,i) => (
        <section key={i} className="qd-fade" style={{ display:'grid', gridTemplateColumns:'280px 1fr', borderTop:`1px solid ${C.border}`, maxWidth:1100, margin:'0 auto' }}>
          <div style={{ padding:'60px 40px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <p style={{ color:C.amber, fontSize:11, letterSpacing:'.25em', textTransform:'uppercase', marginBottom:8 }}>{d.role}</p>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.white }}>{d.name}</h3>
          </div>
          <div style={{ padding:'60px 40px', borderLeft:`1px solid ${C.border}` }}>
            <p style={{ fontFamily:font.serif, fontStyle:'italic', fontSize:20, color:C.gold, marginBottom:16, lineHeight:1.5 }}>{d.q}</p>
            <p style={{ color:C.cream, lineHeight:1.8, fontSize:15, opacity:.85, marginBottom:24 }}>{d.a}</p>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:8 }}>
              {d.tags.map(t => (
                <span
                  key={t}
                  onClick={() => toggleTab(d.name, t)}
                  style={{
                    border: activeTabs[d.name] === t ? `1px solid ${C.amberBright}` : `1px solid ${C.border}`,
                    background: activeTabs[d.name] === t ? C.card : 'transparent',
                    color: activeTabs[d.name] === t ? C.amberBright : C.muted,
                    padding:'8px 18px',
                    fontSize:11,
                    letterSpacing:'.12em',
                    textTransform:'uppercase',
                    cursor:'pointer',
                    transition:'all .3s ease',
                    borderRadius:2,
                  }}
                >{t}</span>
              ))}
            </div>
            {d.tags.map(t => {
              const content = tabContent[t];
              if (!content) return null;
              const isOpen = activeTabs[d.name] === t;
              return (
                <div
                  key={t}
                  className={`qd-tab-content ${isOpen ? 'open' : ''}`}
                  style={{
                    background: C.surface,
                    borderLeft: `2px solid ${C.amber}`,
                    borderRadius: '0 4px 4px 0',
                    marginTop: isOpen ? 16 : 0,
                  }}
                >
                  <h4 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:C.gold, marginBottom:12 }}>{content.title}</h4>
                  <p style={{ color:C.cream, lineHeight:1.8, fontSize:14, opacity:.85, marginBottom:16 }}>{content.body}</p>
                  <p style={{ color:C.amber, lineHeight:1.7, fontSize:13, fontStyle:'italic', fontFamily:font.serif, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>{content.insight}</p>
                  <Link
                    to={`/concepts/${content.slug}`}
                    style={{ display:'inline-block', marginTop:14, color:C.amberBright, fontSize:12, letterSpacing:'.12em', textTransform:'uppercase', textDecoration:'none', fontFamily:font.sans }}
                  >
                    Read the full entry →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* ---- ORB DIAGRAM ---- */}
      <section className="qd-fade" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, padding:'80px 24px', flexWrap:'wrap' }}>
        {['Mathematics','Physics','Biology'].map((n,i) => (<>
          <div key={n} style={{ textAlign:'center' }}>
            <div className="qd-glow" style={{ width:100, height:100, borderRadius:'50%', border:`2px solid ${C.amber}`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', margin:'0 auto 12px' }}>
              <span style={{ color:C.gold, fontSize:13, fontWeight:600 }}>{n}</span>
            </div>
            <span style={{ color:C.muted, fontSize:11, letterSpacing:'.1em' }}>{['The Language','The Engine','The Expression'][i]}</span>
          </div>
          {i < 2 && <span style={{ color:C.amber, fontSize:28, fontWeight:300 }}>+</span>}
        </>))}
        <span style={{ color:C.amber, fontSize:28, fontWeight:300, margin:'0 12px' }}>=</span>
        <div style={{ textAlign:'center' }}>
          <div className="qd-glow" style={{ width:120, height:120, borderRadius:'50%', border:`2px solid ${C.gold}`, background:`radial-gradient(circle,${C.card},${C.bg})`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', margin:'0 auto 12px' }}>
            <span style={{ color:C.gold, fontSize:15, fontWeight:700 }}>Life</span>
            <span style={{ color:C.muted, fontSize:10 }}>Fully Understood</span>
          </div>
        </div>
      </section>

      {/* ---- TOOLS HEADER ---- */}
      <section className="qd-fade" style={{ textAlign:'center', padding:'80px 24px 40px', borderTop:`1px solid ${C.border}` }}>
        <p style={{ color:C.amber, fontSize:12, letterSpacing:'.3em', textTransform:'uppercase', marginBottom:12 }}>Distilled Tools</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(24px,4vw,40px)', color:C.gold, marginBottom:16 }}>From Understanding to Application</h2>
        <p style={{ color:C.cream, maxWidth:680, margin:'0 auto', lineHeight:1.8, fontSize:16, opacity:.85 }}>The Quantum Distillery produces instruments for learning and clinical practice — each one forged at the convergence of these disciplines.</p>
      </section>

      {/* ---- PRODUCT GRID ---- */}
      <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:24, maxWidth:1100, margin:'0 auto', padding:'0 24px 80px' }}>
        {[{icon:'💉',name:'SedSim',desc:'High-fidelity anesthesia and sedation simulation. Real-time vital sign modeling, AI clinical mentor, and pharmacokinetic engine for oral surgery training.',live:true},{icon:'📚',name:'The Learning Shed',desc:'AI-powered didactic engine with Socratic, Narrative, and Visual pedagogical agents. Phase 1 of the AI Pedagogical Synergy Study. Content learning, distilled.',live:false},{icon:'🤖',name:'AI Assist Lab',desc:'Investigating how AI should assist during live sedation. Passive alerting, conversational co-pilot, and predictive dashboard modalities under clinical evaluation.',live:false},{icon:'⚛️',name:'It from Qubit',desc:'Quantum biology, information theory, and the Epoch #4 framework. Exploring how energy becomes information, how information becomes life, and what that means for medicine.',live:false}].map(p => (
          <div key={p.name} className="qd-glass qd-fade" style={{ padding:32, position:'relative' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
              <span style={{ fontSize:10, letterSpacing:'.15em', textTransform:'uppercase', color: p.live ? C.amber : C.dim, border:`1px solid ${p.live ? C.amber : C.dim}`, padding:'4px 10px' }}>{p.live ? 'Live' : 'Coming Soon'}</span>
              <span style={{ fontSize:32 }}>{p.icon}</span>
            </div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.white, marginBottom:12 }}>{p.name}</h3>
            <p style={{ color:C.muted, lineHeight:1.7, fontSize:14 }}>{p.desc}</p>
            {p.live && <button onClick={() => navigate('/sim')} className="qd-btn" style={{ background:C.amber, color:C.bg, border:'none', padding:'14px 32px', fontSize:13, letterSpacing:'.12em', textTransform:'uppercase', fontFamily:font.sans, fontWeight:700, cursor:'pointer', marginTop:20, textAlign:'center', transition:'all .2s' }}>Launch SedSim →</button>}
          </div>
        ))}
      </section>

      {/* ---- RESEARCH BANNER ---- */}
      <section className="qd-fade qd-glass" style={{ maxWidth:900, margin:'48px auto', padding:'56px 44px', textAlign:'center' }}>
        <p style={{ color:C.amber, fontSize:12, letterSpacing:'.3em', textTransform:'uppercase', marginBottom:12 }}>Active Research</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(24px,4vw,36px)', color:C.gold, marginBottom:16 }}>The AI Pedagogical Synergy Study</h2>
        <p style={{ color:C.cream, maxWidth:700, margin:'0 auto 30px', lineHeight:1.8, fontSize:15, opacity:.85 }}>A closed-loop investigation evaluating how distinct AI teaching personas affect knowledge acquisition and clinical performance across students, residents, and attendings. Validated using Kirkpatrick evaluation and NASA-TLX cognitive load metrics. From the didactic to the simulated to the surgical.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          {['Kirkpatrick Model','NASA-TLX','Cognitive Load Theory','SedSim Platform','Operant.ai'].map(t => <span key={t} style={{ border:`1px solid ${C.border}`, color:C.muted, padding:'8px 18px', fontSize:11, letterSpacing:'.12em', textTransform:'uppercase' }}>{t}</span>)}
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer style={{ textAlign:'center', padding:'40px 24px', borderTop:`1px solid ${C.border}` }}>
        <p style={{ color:C.dim, fontSize:12, letterSpacing:'.15em', marginBottom:8 }}>The Quantum Distillery © 2026 • Thad Connelly MD DDS PhD</p>
        <p style={{ color:C.dim, fontSize:11, letterSpacing:'.1em' }}>GengyveUSA • Boutique Venture Partners • San Francisco</p>
      </footer>

    </div>
  );
}
