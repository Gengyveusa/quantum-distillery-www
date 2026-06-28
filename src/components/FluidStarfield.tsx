import { useEffect, useRef } from 'react';

/**
 * FluidStarfield — fixed, full-viewport animated starfield rendered to <canvas>.
 *
 * Mounted once behind the page (position:fixed; inset:0; z-index:-1). The canvas
 * paints the base colour itself, so it *is* the page background — panels above it
 * (see .qd-glass in LandingPage) refract the drifting stars at their edges.
 *
 * - Multi-layer parallax: near stars are larger/brighter/faster, far ones tiny/dim.
 * - Flow-field drift (layered sines) so stars move like particles in liquid.
 * - Faint amber + indigo nebula wash, slowly drifting.
 * - DPR/retina aware, debounced resize, delta-time integration (framerate independent).
 * - Pauses on tab blur (visibilitychange); full cleanup on unmount.
 * - prefers-reduced-motion → a single static frame, no animation loop.
 */

interface Star {
  x: number;      // normalised 0..1 (resize-stable)
  y: number;
  r: number;      // radius in CSS px
  a: number;      // base alpha
  tw: number;     // twinkle speed
  ph: number;     // twinkle phase
  sp: number;     // drift speed multiplier (parallax)
  gold: boolean;  // ~20% tinted gold/amber, else soft white
}

const BASE_COLOR = '#0a0705';

export default function FluidStarfield({ baseColor = BASE_COLOR }: { baseColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let last = 0;
    let running = true;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function build() {
      const count = Math.max(120, Math.min(600, Math.round((w * h) / 6000)));
      stars = Array.from({ length: count }, () => {
        const layer = Math.random();
        const near = layer < 0.18;
        const mid = !near && layer < 0.5;
        const r = near ? rand(1.4, 2.6) : mid ? rand(0.8, 1.5) : rand(0.35, 0.9);
        const a = near ? rand(0.6, 1) : mid ? rand(0.4, 0.7) : rand(0.22, 0.5);
        const sp = near ? rand(1.1, 1.6) : mid ? rand(0.7, 1.0) : rand(0.35, 0.6);
        return {
          x: Math.random(),
          y: Math.random(),
          r,
          a,
          tw: rand(0.6, 2.2),
          ph: rand(0, Math.PI * 2),
          sp,
          gold: Math.random() < 0.2,
        };
      });
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function drawFrame(t: number) {
      // Base fill — the canvas is the page background.
      ctx!.fillStyle = baseColor;
      ctx!.fillRect(0, 0, w, h);

      // Nebula wash: amber + indigo radial gradients, slowly drifting, very low opacity.
      const dA = Math.sin(t * 0.00003) * 0.5 + 0.5;
      const dB = Math.cos(t * 0.000023) * 0.5 + 0.5;
      const maxD = Math.max(w, h);
      const ax = w * (0.25 + 0.1 * dA);
      const ay = h * (0.3 + 0.08 * dB);
      const g1 = ctx!.createRadialGradient(ax, ay, 0, ax, ay, maxD * 0.6);
      g1.addColorStop(0, 'rgba(200,134,10,0.10)');
      g1.addColorStop(1, 'rgba(200,134,10,0)');
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, w, h);
      const bx = w * (0.78 - 0.1 * dB);
      const by = h * (0.72 - 0.08 * dA);
      const g2 = ctx!.createRadialGradient(bx, by, 0, bx, by, maxD * 0.55);
      g2.addColorStop(0, 'rgba(60,70,140,0.10)');
      g2.addColorStop(1, 'rgba(60,70,140,0)');
      ctx!.fillStyle = g2;
      ctx!.fillRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        const tw = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph);
        ctx!.globalAlpha = Math.max(0, Math.min(1, s.a * tw));
        ctx!.fillStyle = s.gold ? '#ffd060' : '#e0e0e8';
        ctx!.beginPath();
        ctx!.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function update(dt: number, t: number) {
      for (const s of stars) {
        // Flow field: drift direction from layered sines of position + time.
        const ang = Math.sin(s.y * 6 + t * 0.00006) + Math.cos(s.x * 5 - t * 0.00005);
        const v = 0.000012 * s.sp * dt;
        s.x += Math.cos(ang) * v;
        s.y += Math.sin(ang) * v * 0.6 + 0.000004 * s.sp * dt; // gentle downward bias
        // Wrap seamlessly with a small margin so stars don't pop at the edge.
        if (s.x < -0.02) s.x += 1.04;
        else if (s.x > 1.02) s.x -= 1.04;
        if (s.y < -0.02) s.y += 1.04;
        else if (s.y > 1.02) s.y -= 1.04;
      }
    }

    function loop(t: number) {
      if (!running) return;
      const dt = Math.min(50, t - last || 16);
      last = t;
      update(dt, t);
      drawFrame(t);
      raf = requestAnimationFrame(loop);
    }

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        if (reduceMotion) drawFrame(0);
      }, 150);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    if (reduceMotion) {
      drawFrame(0);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [baseColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
