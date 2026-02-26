import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

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

export default function LandingPage() {
  const navigate = useNavigate();
  const obs = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    obs.current = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('qd-visible'); } });
    }, { threshold: 0.15 });
    document.querySelectorAll('.qd-fade').forEach(el => obs.current?.observe(el));
    return () => obs.current?.disconnect();
  }, []);

  return (
    <div style={{ background: C.bg, color: C.cream, fontFamily: font.serif, minHeight: '100vh' }}>

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
      `}</style>

      {/* ---- NAV ---- */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 48px', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100, background:C.bg, backdropFilter:'blur(8px)' }}>
        <span style={{ fontSize:13, letterSpacing:'.2em', textTransform:'uppercase', color:C.amber, fontFamily:font.sans, fontWeight:700 }}>The Quantum Distillery</span>
        <div style={{ display:'flex', gap:32 }}>
          <a href="https://thequantumdistillery.substack.com" target="_blank" rel="noreferrer" className="qd-link" style={{ color:C.muted, textDecoration:'none', fontSize:13, letterSpacing:'.1em', fontFamily:font.sans, transition:'color .2s' }}>Substack</a>
          <a href="https://gengyve.com" target="_blank" rel="noreferrer" className="qd-link" style={{ color:C.muted, textDecoration:'none', fontSize:13, letterSpacing:'.1em', fontFamily:font.sans, transition:'color .2s' }}>Gengyve</a>
          <span onClick={() => navigate('/sim')} className="qd-link" style={{ color:C.muted, cursor:'pointer', fontSize:13, letterSpacing:'.1em', fontFamily:font.sans, transition:'color .2s' }}>SedSim</span>
        </div>
      </nav>

      {/* ---- HERO ---- */}
      <section style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', padding:'120px 48px 100px', position:'relative', borderBottom:`1px solid ${C.border}`, background:`radial-gradient(ellipse at center top, #2a1a04 0%, ${C.bg} 65%)`, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-200, left:'50%', transform:'translateX(-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(200,134,10,.15) 0%, transparent 70%)', pointerEvents:'none' }} />
        <span className="qd-fade" style={{ fontSize:11, letterSpacing:'.35em', textTransform:'uppercase', color:C.amber, fontFamily:font.sans, marginBottom:24, display:'block' }}>Est. 2024 &mdash; San Francisco</span>
        <h1 className="qd-fade" style={{ fontSize:'clamp(48px,8vw,96px)', fontWeight:400, color:C.white, margin:'0 0 12px', lineHeight:1.05, fontStyle:'italic', fontFamily:"'Playfair Display',Georgia,serif", textShadow:'0 0 80px rgba(200,134,10,.3)' }}>the quantum distillery</h1>
        <p className="qd-fade" style={{ fontSize:'clamp(13px,1.5vw,16px)', color:C.muted, fontFamily:font.sans, letterSpacing:'.12em', marginBottom:32, textTransform:'uppercase' }}>Thad Connelly &bull; MD &bull; DDS &bull; PhD</p>
        <p className="qd-fade" style={{ fontSize:'clamp(17px,2.5vw,22px)', color:C.amberBright, fontStyle:'italic', marginBottom:48, maxWidth:650 }}>Distilling complexity into clarity &mdash; from the quantum to the clinical</p>
        <div className="qd-fade" style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center' }}>
          <button onClick={() => navigate('/sim')} className="qd-btn" style={{ background:C.amber, color:C.bg, border:'none', padding:'14px 32px', fontSize:13, letterSpacing:'.12em', textTransform:'uppercase', fontFamily:font.sans, fontWeight:700, cursor:'pointer', transition:'all .2s' }}>Launch SedSim</button>
          <a href="https://thequantumdistillery.substack.com" target="_blank" rel="noreferrer" className="qd-btn2" style={{ background:'transparent', color:C.amber, border:`1px solid ${C.amber}`, padding:'14px 32px', fontSize:13, letterSpacing:'.12em', textTransform:'uppercase', fontFamily:font.sans, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>Read the Pours</a>
        </div>
      </section>

      {/* ---- DEFINITION I: DISTILLERY ---- */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'80px 48px 0' }}>
        <div className="qd-fade" style={{ border:`1px solid ${C.border}`, background:C.surface, padding:56, position:'relative' }}>
          <span style={{ position:'absolute', top:24, right:40, fontSize:100, color:C.card, lineHeight:1, fontFamily:"'Playfair Display',serif", userSelect:'none' }}>I</span>
          <span style={{ display:'block', fontSize:14, color:C.muted, fontFamily:font.sans, marginBottom:12, fontStyle:'italic' }}>noun &bull; /d&#618;&#712;st&#618;l&#601;ri/</span>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:400, color:C.gold, margin:'0 0 24px' }}>Distillery</h2>
          <p style={{ fontSize:18, lineHeight:1.9 }}>A place where raw, complex ingredients are subjected to heat and pressure, separated into their essential components, and refined into something pure, potent, and concentrated. The crude is transformed into the clear. The chaotic is reduced to its essence.</p>
          <blockquote style={{ borderLeft:`3px solid ${C.amber}`, paddingLeft:28, margin:'32px 0 0', fontStyle:'italic', color:C.amberBright, fontSize:19, lineHeight:1.7 }}>The distiller does not invent the spirit. The spirit was always there, hidden inside the grain. The distiller simply removes everything that is not the spirit.</blockquote>
        </div>
      </section>

      {/* ---- DEFINITION II: QUANTUM DISTILLERY ---- */}
      <section style={{ maxWidth:900, margin:'0 auto', padding:'40px 48px 0' }}>
        <div className="qd-fade" style={{ border:`1px solid ${C.border}`, background:C.surface, padding:56, position:'relative' }}>
          <span style={{ position:'absolute', top:24, right:40, fontSize:100, color:C.card, lineHeight:1, fontFamily:"'Playfair Display',serif", userSelect:'none' }}>II</span>
          <span style={{ display:'block', fontSize:14, color:C.muted, fontFamily:font.sans, marginBottom:12, fontStyle:'italic' }}>noun &bull; /&#712;kw&#594;nt&#601;m d&#618;&#712;st&#618;l&#601;ri/</span>
          <h2 style={{ fontSize:'clamp(28px,4vw,44px)', fontWeight:400, color:C.gold, margin:'0 0 24px' }}>The Quantum Distillery</h2>
          <p style={{ fontSize:18, lineHeight:1.9 }}>An intellectual framework where the deepest principles of mathematics, physics, and biology are distilled from their native complexity into accessible, interconnected understanding. We take the raw substrate of scientific knowledge &mdash; wave functions, thermodynamic gradients, enzyme kinetics, information entropy &mdash; and refine them into clear, potent insight about how life actually works, from the subatomic to the surgical.</p>
          <blockquote style={{ borderLeft:`3px solid ${C.amber}`, paddingLeft:28, margin:'32px 0 0', fontStyle:'italic', color:C.amberBright, fontSize:19, lineHeight:1.7 }}>Life is not chemistry. Life is not physics. Life is the conversation between them &mdash; and mathematics is the language they speak.</blockquote>
        </div>
      </section>

      {/* ---- CONVERGENCE HEADER ---- */}
      <section className="qd-fade" style={{ maxWidth:900, margin:'0 auto', padding:'100px 48px 60px', textAlign:'center' }}>
        <span style={{ fontSize:11, letterSpacing:'.35em', textTransform:'uppercase', color:C.amber, fontFamily:font.sans, marginBottom:16, display:'block' }}>The Convergence</span>
        <h2 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:400, color:C.white, margin:'0 0 24px', lineHeight:1.2 }}>Understanding Life from Top to Bottom</h2>
        <p style={{ fontSize:18, lineHeight:1.85, maxWidth:700, margin:'0 auto' }}>Life cannot be fully understood from within a single discipline. It demands the convergence of three fundamental languages &mdash; each incomplete alone, each essential together. The Quantum Distillery exists at their intersection.</p>
      </section>

      {/* ---- CONVERGENCE LADDER ---- */}
      <div style={{ maxWidth:1000, margin:'0 auto', border:`1px solid ${C.border}`, borderBottom:'none' }}>
        {[{role:'Foundation',name:'Mathematics',q:'What are the patterns that govern all systems?',a:'Mathematics is the language of structure itself. It gives us the tools to describe probability distributions governing electron behavior, the differential equations modeling cardiac rhythms, and the information theory underlying consciousness.',tags:['Information Theory','Topology','Stochastic Modeling','Bayesian Inference']},{role:'Mechanism',name:'Physics',q:'What forces and fields make life possible?',a:'Physics reveals the machinery beneath biology. Quantum tunneling drives enzyme catalysis. Proton gradients across mitochondrial membranes generate the electrochemical potential that powers every cell. Thermodynamic entropy dictates why living systems must constantly import energy or die.',tags:['Quantum Tunneling','Thermodynamics','Electrodynamics','Negative Entropy']},{role:'Expression',name:'Biology',q:'How does matter become alive?',a:'Biology is where mathematics and physics become visible. DNA encodes information. Proteins fold into functional machines governed by quantum forces. Neurons fire in patterns that somehow produce experience. Disease is not a biological failure alone \u2014 it is a failure of physics at the molecular scale.',tags:['Molecular Biology','Quantum Biology','Consciousness','Epoch #4']}].map((d,i) => (
          <div key={i} className="qd-fade" style={{ display:'flex', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ width:220, flexShrink:0, padding:'40px 32px', borderRight:`1px solid ${C.border}`, background:C.surface, display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <span style={{ fontSize:11, letterSpacing:'.3em', textTransform:'uppercase', color:C.amber, fontFamily:font.sans, marginBottom:8 }}>{d.role}</span>
              <h3 style={{ fontSize:24, fontWeight:400, color:C.white, margin:0 }}>{d.name}</h3>
            </div>
            <div style={{ flex:1, padding:'40px 48px' }}>
              <p style={{ fontSize:20, color:C.gold, fontStyle:'italic', marginBottom:12 }}>{d.q}</p>
              <p style={{ fontSize:16, lineHeight:1.8, fontFamily:font.sans, fontWeight:300 }}>{d.a}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20 }}>
                {d.tags.map(t => <span key={t} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.amber, fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', padding:'5px 14px', fontFamily:font.sans }}>{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---- ORB DIAGRAM ---- */}
      <section className="qd-fade" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, padding:'80px 48px', flexWrap:'wrap', borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, background:`radial-gradient(ellipse at center, #1a0f03 0%, ${C.bg} 70%)` }}>
        {['Mathematics','Physics','Biology'].map((n,i) => (
          <>
            <div key={n} className="qd-glow" style={{ width:150, height:150, borderRadius:'50%', border:`1px solid ${C.amber}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', background:C.surface, fontSize:15, color:C.gold, fontFamily:font.sans, fontWeight:600, letterSpacing:'.05em' }}>
              {n}<br /><small style={{ fontSize:11, color:C.muted, fontWeight:300, marginTop:4 }}>{['The Language','The Engine','The Expression'][i]}</small>
            </div>
            {i < 2 && <span style={{ color:C.amber, fontSize:28, fontFamily:font.sans, fontWeight:300 }}>+</span>}
          </>
        ))}
        <span style={{ color:C.amber, fontSize:28, fontFamily:font.sans, fontWeight:300 }}>=</span>
        <div className="qd-glow" style={{ width:180, height:180, borderRadius:'50%', border:`2px solid ${C.amberBright}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', background:C.card, fontSize:18, color:C.gold, fontFamily:font.sans, fontWeight:700 }}>
          Life<br /><small style={{ fontSize:11, color:C.muted, fontWeight:300, marginTop:4 }}>Fully Understood</small>
        </div>
      </section>

      {/* ---- TOOLS HEADER ---- */}
      <section className="qd-fade" style={{ maxWidth:900, margin:'0 auto', padding:'100px 48px 60px', textAlign:'center' }}>
        <span style={{ fontSize:11, letterSpacing:'.35em', textTransform:'uppercase', color:C.amber, fontFamily:font.sans, marginBottom:16, display:'block' }}>Distilled Tools</span>
        <h2 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:400, color:C.white, margin:'0 0 24px', lineHeight:1.2 }}>From Understanding to Application</h2>
        <p style={{ fontSize:18, lineHeight:1.85, maxWidth:700, margin:'0 auto' }}>The Quantum Distillery produces instruments for learning and clinical practice &mdash; each one forged at the convergence of these disciplines.</p>
      </section>

      {/* ---- PRODUCT GRID ---- */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:1, background:C.border, border:`1px solid ${C.border}`, maxWidth:1200, margin:'0 auto' }}>
        {[{icon:'\uD83D\uDC89',name:'SedSim',desc:'High-fidelity anesthesia and sedation simulation. Real-time vital sign modeling, AI clinical mentor, and pharmacokinetic engine for oral surgery training.',live:true},{icon:'\uD83D\uDCDA',name:'The Learning Shed',desc:'AI-powered didactic engine with Socratic, Narrative, and Visual pedagogical agents. Phase 1 of the AI Pedagogical Synergy Study. Content learning, distilled.',live:false},{icon:'\uD83E\uDD16',name:'AI Assist Lab',desc:'Investigating how AI should assist during live sedation. Passive alerting, conversational co-pilot, and predictive dashboard modalities under clinical evaluation.',live:false},{icon:'\u269B\uFE0F',name:'It from Qubit',desc:'Quantum biology, information theory, and the Epoch #4 framework. Exploring how energy becomes information, how information becomes life, and what that means for medicine.',live:false}].map(p => (
          <div key={p.name} className="qd-card" style={{ background:C.bg, padding:'48px 36px', display:'flex', flexDirection:'column', transition:'background .2s', borderLeft: p.live ? `2px solid ${C.orange}` : 'none' }}>
            <span style={{ fontSize:10, letterSpacing:'.2em', textTransform:'uppercase', fontFamily:font.sans, border:`1px solid ${p.live ? C.orange : C.border}`, color: p.live ? C.orange : C.muted, display:'inline-block', padding:'4px 12px', marginBottom:20, width:'fit-content', boxShadow: p.live ? `0 0 12px rgba(224,90,10,.3)` : 'none' }}>{p.live ? 'Live' : 'Coming Soon'}</span>
            <span style={{ fontSize:36, marginBottom:16 }}>{p.icon}</span>
            <h3 style={{ fontSize:22, fontWeight:400, color:C.white, marginBottom:12 }}>{p.name}</h3>
            <p style={{ fontSize:15, lineHeight:1.7, color:C.muted, fontFamily:font.sans, fontWeight:300, flexGrow:1 }}>{p.desc}</p>
            {p.live && <button onClick={() => navigate('/sim')} className="qd-btn" style={{ background:C.amber, color:C.bg, border:'none', padding:'14px 32px', fontSize:13, letterSpacing:'.12em', textTransform:'uppercase', fontFamily:font.sans, fontWeight:700, cursor:'pointer', marginTop:20, textAlign:'center', transition:'all .2s' }}>Launch SedSim &rarr;</button>}
          </div>
        ))}
      </div>

      {/* ---- RESEARCH BANNER ---- */}
      <section className="qd-fade" style={{ maxWidth:900, margin:'0 auto', padding:'100px 48px', textAlign:'center', borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:11, letterSpacing:'.35em', textTransform:'uppercase', color:C.amber, fontFamily:font.sans, marginBottom:16, display:'block' }}>Active Research</span>
        <h2 style={{ fontSize:'clamp(28px,4vw,46px)', fontWeight:400, color:C.white, margin:'0 0 24px', lineHeight:1.2 }}>The AI Pedagogical Synergy Study</h2>
        <p style={{ fontSize:18, lineHeight:1.85, maxWidth:700, margin:'0 auto' }}>A closed-loop investigation evaluating how distinct AI teaching personas affect knowledge acquisition and clinical performance across students, residents, and attendings. Validated using Kirkpatrick evaluation and NASA-TLX cognitive load metrics. From the didactic to the simulated to the surgical.</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:24, justifyContent:'center' }}>
          {['Kirkpatrick Model','NASA-TLX','Cognitive Load Theory','SedSim Platform','Operant.ai'].map(t => <span key={t} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.amber, fontSize:11, letterSpacing:'.12em', textTransform:'uppercase', padding:'5px 14px', fontFamily:font.sans }}>{t}</span>)}
        </div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer style={{ textAlign:'center', padding:48, borderTop:`1px solid ${C.border}`, fontSize:14, color:C.muted, fontFamily:font.sans }}>
        <p>The Quantum Distillery &copy; 2026 &bull; Thad Connelly MD DDS PhD</p>
        <p style={{ fontSize:12, marginTop:8, color:C.dim }}>GengyveUSA &bull; Boutique Venture Partners &bull; San Francisco</p>
      </footer>

    </div>
  );
}
