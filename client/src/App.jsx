import { useEffect, useRef, useState, useCallback } from "react";

/* ── Particle + Beam Canvas ─────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMove);

    // Particles
    const COUNT = 120;
    const particles = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      color: i % 5 === 0 ? "#f5c542" : i % 3 === 0 ? "#00e5ff" : "#7b5ea7",
    }));

    // Beams
    const BEAMS = 6;
    const beams = Array.from({ length: BEAMS }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: 0,
      angle: Math.PI / 2 + (Math.random() - 0.5) * 0.4,
      speed: 0.15 + Math.random() * 0.2,
      width: 1 + Math.random() * 2,
      length: 120 + Math.random() * 180,
      alpha: 0.12 + Math.random() * 0.1,
      color: i % 2 === 0 ? "#00e5ff" : "#f5c542",
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);

      // Ambient glow spots
      const glows = [
        { x: W * 0.2, y: H * 0.3, r: 320, c1: "rgba(0,229,255,0.07)", c2: "transparent" },
        { x: W * 0.8, y: H * 0.6, r: 280, c1: "rgba(245,197,66,0.06)", c2: "transparent" },
        { x: W * 0.5, y: H * 0.8, r: 260, c1: "rgba(123,94,167,0.08)", c2: "transparent" },
      ];
      glows.forEach((g) => {
        const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        grad.addColorStop(0, g.c1);
        grad.addColorStop(1, g.c2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw beams
      beams.forEach((b) => {
        b.y += b.speed;
        if (b.y > H + b.length) { b.y = -b.length; b.x = Math.random() * W; }
        const x2 = b.x + Math.cos(b.angle) * b.length;
        const y2 = b.y + Math.sin(b.angle) * b.length;
        const pulse = 0.6 + 0.4 * Math.sin(t * 2 + b.phase);
        const grad = ctx.createLinearGradient(b.x, b.y, x2, y2);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.4, b.color + Math.floor(b.alpha * pulse * 255).toString(16).padStart(2, "0"));
        grad.addColorStop(1, "transparent");
        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = b.width * (0.8 + 0.2 * pulse);
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      });

      // Draw connections between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.save();
            ctx.strokeStyle = `rgba(0,229,255,${(1 - d / 100) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw + update particles
      particles.forEach((p) => {
        const mx = mouse.current.x, my = mouse.current.y;
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const force = (130 - dist) / 130;
          p.vx -= (dx / dist) * force * 0.08;
          p.vy -= (dy / dist) * force * 0.08;
        }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        const nearMouse = dist < 80;
        const glow = nearMouse ? 6 : 0;
        ctx.save();
        if (nearMouse) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = glow;
        }
        ctx.globalAlpha = nearMouse ? Math.min(p.alpha * 2, 1) : p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, nearMouse ? p.r * 1.8 : p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ── Scan-line grid overlay ─────────────────────────── */
function GridOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        backgroundImage:
          "linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
  );
}

/* ── Glitch text component ──────────────────────────── */
function GlitchText({ children, className = "" }) {
  return (
    <span className={`relative inline-block ${className}`} data-text={children}>
      <style>{`
        .glitch-wrap { position: relative; }
        .glitch-wrap::before,
        .glitch-wrap::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          opacity: 0;
        }
        .glitch-wrap:hover::before {
          opacity: 0.7;
          color: #00e5ff;
          clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
          transform: translateX(-3px);
          animation: glitch1 0.3s steps(2) forwards;
        }
        .glitch-wrap:hover::after {
          opacity: 0.7;
          color: #f5c542;
          clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
          transform: translateX(3px);
          animation: glitch2 0.3s steps(2) forwards;
        }
        @keyframes glitch1 { 0%,100%{opacity:0;transform:translateX(0)} 50%{opacity:0.7;transform:translateX(-3px)} }
        @keyframes glitch2 { 0%,100%{opacity:0;transform:translateX(0)} 50%{opacity:0.7;transform:translateX(3px)} }
      `}</style>
      <span className="glitch-wrap" data-text={children}>{children}</span>
    </span>
  );
}

/* ── Beam divider ───────────────────────────────────── */
function BeamDivider({ color = "#00e5ff" }) {
  return (
    <div className="relative flex items-center justify-center my-2">
      <div className="absolute inset-x-0 h-px" style={{
        background: `linear-gradient(90deg, transparent, ${color}55, ${color}, ${color}55, transparent)`,
        boxShadow: `0 0 12px ${color}`,
      }} />
      <div className="relative z-10 w-2 h-2 rotate-45 border" style={{ borderColor: color, background: color + "33", boxShadow: `0 0 10px ${color}` }} />
    </div>
  );
}

/* ── Animated counter ───────────────────────────────── */
function Counter({ to, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let start = 0;
        const steps = 60;
        const inc = to / steps;
        const id = setInterval(() => {
          start += inc;
          if (start >= to) { setVal(to); clearInterval(id); }
          else setVal(Math.floor(start));
        }, 1200 / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Holographic card ───────────────────────────────── */
function HoloCard({ children, className = "", accent = "#00e5ff" }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 20;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -20;
    ref.current.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
    ref.current.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    ref.current.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const onLeave = () => {
    ref.current.style.transform = "perspective(800px) rotateY(0) rotateX(0) scale(1)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden transition-transform duration-200 ${className}`}
      style={{
        background: "rgba(10,10,18,0.85)",
        border: `1px solid ${accent}22`,
        borderRadius: "16px",
        "--mx": "50%", "--my": "50%",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at var(--mx) var(--my), ${accent}18 0%, transparent 60%)`,
          borderRadius: "inherit",
        }}
      />
      <div className="absolute inset-0 pointer-events-none" style={{
        borderRadius: "inherit",
        boxShadow: `inset 0 0 0 1px ${accent}15`,
      }} />
      {children}
    </div>
  );
}

/* ── Data ──────────────────────────────────────────── */
const features = [
  { icon: "◈", title: "Quantum Sync", desc: "Real-time bank sync with military-grade encryption. Every transaction captured in milliseconds.", accent: "#00e5ff" },
  { icon: "◉", title: "Neural Budget AI", desc: "Self-learning AI adapts to your spending DNA and predicts future patterns with 94% accuracy.", accent: "#f5c542" },
  { icon: "⬡", title: "Holographic Charts", desc: "Immersive 3D data visualizations that reveal hidden patterns in your financial universe.", accent: "#b06aff" },
  { icon: "⟁", title: "Beam Alerts", desc: "Instantaneous multi-channel alerts the moment unusual transactions are detected.", accent: "#00e5ff" },
  { icon: "◫", title: "Shared Matrix", desc: "Multi-user synchronized expense grids for families, teams, and collectives.", accent: "#f5c542" },
  { icon: "⬢", title: "Warp Export", desc: "Export to any format — CSV, PDF, JSON — with one command. Instant, formatted, complete.", accent: "#b06aff" },
];

const steps = [
  { n: "01", title: "Connect", desc: "Link your bank or card in under 30 seconds using 256-bit encrypted OAuth." },
  { n: "02", title: "Analyze", desc: "Our AI scans 12 months of history and builds your spending fingerprint." },
  { n: "03", title: "Control", desc: "Set goals, budgets, and alerts. Watch the dashboard come alive." },
];

const testimonials = [
  { name: "Lena Zhao", role: "Startup Founder", q: "The beam alerts saved me $4,000 in fraudulent charges. Nothing else comes close.", init: "LZ", c: "#00e5ff" },
  { name: "Devraj Patel", role: "Software Architect", q: "The AI budget predictions were off by less than $12 last month. It's uncanny.", init: "DP", c: "#f5c542" },
  { name: "Mara Voss", role: "Creative Director", q: "Finally a finance app that doesn't feel like punishment. It's actually beautiful.", init: "MV", c: "#b06aff" },
];

/* ── MAIN ───────────────────────────────────────────── */
export default function App() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [billing, setBilling] = useState("monthly");
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);

  // Typewriter
  const words = ["Expenses.", "Subscriptions.", "Budgets.", "Future."];
  const [wIdx, setWIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wIdx];
    let timeout;
    if (!deleting && typed.length < word.length) {
      timeout = setTimeout(() => setTyped(word.slice(0, typed.length + 1)), 80);
    } else if (!deleting && typed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && typed.length > 0) {
      timeout = setTimeout(() => setTyped(typed.slice(0, -1)), 45);
    } else if (deleting && typed.length === 0) {
      setDeleting(false);
      setWIdx((i) => (i + 1) % words.length);
    }
    return () => clearTimeout(timeout);
  }, [typed, deleting, wIdx]);

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#07070f", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        .font-orb { font-family: 'Orbitron', monospace; }
        .cyan { color: #00e5ff; }
        .gold { color: #f5c542; }
        .violet { color: #b06aff; }
        .text-grad-cg { background: linear-gradient(135deg, #00e5ff, #f5c542); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .text-grad-cv { background: linear-gradient(135deg, #00e5ff, #b06aff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glow-cyan { box-shadow: 0 0 30px rgba(0,229,255,0.3), 0 0 60px rgba(0,229,255,0.1); }
        .glow-gold { box-shadow: 0 0 30px rgba(245,197,66,0.3), 0 0 60px rgba(245,197,66,0.1); }
        .pulse-ring { animation: pulseRing 2s ease-in-out infinite; }
        @keyframes pulseRing {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,229,255,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(0,229,255,0); }
        }
        .beam-line { position: absolute; height: 1px; background: linear-gradient(90deg, transparent, #00e5ff, transparent); animation: beamMove 3s linear infinite; }
        @keyframes beamMove { from { transform: scaleX(0) translateX(-100%); } to { transform: scaleX(1) translateX(100%); } }
        .float-slow { animation: floatSlow 6s ease-in-out infinite; }
        @keyframes floatSlow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .scan-line {
          background: linear-gradient(180deg, transparent 0%, rgba(0,229,255,0.04) 50%, transparent 100%);
          animation: scanDown 4s linear infinite;
          height: 80px;
        }
        @keyframes scanDown { from{top:-80px} to{top:100%} }
        .hex-grid {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-2l26-15V18L28 2 2 18v31z' fill='none' stroke='rgba(0,229,255,0.04)' stroke-width='1'/%3E%3C/svg%3E");
          background-size: 56px 100px;
        }
        .ticker-wrap { overflow: hidden; }
        .ticker { display: flex; animation: ticker 20s linear infinite; white-space: nowrap; }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .fade-in-up { opacity: 0; transform: translateY(30px); animation: fadeInUp 0.7s ease forwards; }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
        .caret { display: inline-block; width: 3px; height: 1.1em; background: #00e5ff; margin-left: 2px; vertical-align: middle; animation: blink 0.8s step-end infinite; box-shadow: 0 0 8px #00e5ff; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .holo-btn {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, rgba(0,229,255,0.1), rgba(0,229,255,0.03));
          border: 1px solid rgba(0,229,255,0.4);
          transition: all 0.3s ease;
        }
        .holo-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(0,229,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.4s ease;
        }
        .holo-btn:hover::before { transform: translateX(0); }
        .holo-btn:hover { border-color: rgba(0,229,255,0.8); box-shadow: 0 0 20px rgba(0,229,255,0.3); }
        .solid-btn {
          background: linear-gradient(135deg, #00e5ff, #0099b8);
          border: none; transition: all 0.3s ease;
        }
        .solid-btn:hover { transform: scale(1.04); box-shadow: 0 0 30px rgba(0,229,255,0.5); }
        .corner-tl::before, .corner-tr::after, .corner-bl::before, .corner-br::after {
          content: ''; position: absolute; width: 12px; height: 12px;
        }
        .corner-frame::before { content:''; position:absolute; top:0; left:0; width:16px; height:16px; border-top:2px solid #00e5ff; border-left:2px solid #00e5ff; }
        .corner-frame::after { content:''; position:absolute; top:0; right:0; width:16px; height:16px; border-top:2px solid #00e5ff; border-right:2px solid #00e5ff; }
        .corner-frame-b::before { content:''; position:absolute; bottom:0; left:0; width:16px; height:16px; border-bottom:2px solid #00e5ff; border-left:2px solid #00e5ff; }
        .corner-frame-b::after { content:''; position:absolute; bottom:0; right:0; width:16px; height:16px; border-bottom:2px solid #00e5ff; border-right:2px solid #00e5ff; }
        .number-glow { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
        .orbit { animation: orbit 12s linear infinite; }
        @keyframes orbit { from{transform:rotate(0deg) translateX(80px) rotate(0deg)} to{transform:rotate(360deg) translateX(80px) rotate(-360deg)} }
        .orbit2 { animation: orbit2 8s linear infinite; }
        @keyframes orbit2 { from{transform:rotate(0deg) translateX(50px) rotate(0deg)} to{transform:rotate(-360deg) translateX(50px) rotate(360deg)} }
        .neon-border { box-shadow: 0 0 0 1px rgba(0,229,255,0.15), inset 0 0 0 1px rgba(0,229,255,0.05); }
        .progress-beam { position: relative; overflow: hidden; }
        .progress-beam::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent); animation:shimmer 2s infinite; }
        @keyframes shimmer { to{left:200%} }
        .feature-active { border-color: rgba(0,229,255,0.5) !important; background: rgba(0,229,255,0.05) !important; }
        .particle-dot { width:4px; height:4px; border-radius:50%; position:absolute; animation:particleDrift var(--dur,4s) ease-in-out infinite alternate; }
        @keyframes particleDrift { from{transform:translate(0,0)} to{transform:translate(var(--tx,10px),var(--ty,-15px))} }
      `}</style>

      <ParticleCanvas />
      <GridOverlay />

      {/* Scan overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
        <div className="scan-line absolute w-full" />
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{
        background: "rgba(7,7,15,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,229,255,0.08)",
      }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 flex items-center justify-center pulse-ring rounded-sm"
              style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.4)" }}>
              <span className="font-orb text-sm font-bold cyan">$</span>
            </div>
            <span className="font-orb text-sm tracking-widest uppercase" style={{ color: "#e0f7ff" }}>SPENDLY</span>
            <span className="font-orb text-xs text-cyan-400 opacity-50 tracking-widest">v2.0</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Protocol", "Features", "Pricing", "Docs"].map((item) => (
              <a key={item} href="#" className="font-orb text-xs tracking-wider text-white/40 hover:text-cyan-400 transition-colors uppercase">{item}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button className="font-orb text-xs tracking-wider text-white/40 hover:cyan px-4 py-2 uppercase transition-colors">Access</button>
            <button className="holo-btn font-orb text-xs tracking-wider cyan px-5 py-2 rounded-sm uppercase">Launch App</button>
          </div>
          <button className="md:hidden cyan" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="font-orb text-xs">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 py-4 flex flex-col gap-4 border-t" style={{ borderColor: "rgba(0,229,255,0.08)", background: "rgba(7,7,15,0.95)" }}>
            {["Protocol", "Features", "Pricing", "Docs"].map(i => (
              <a key={i} href="#" className="font-orb text-xs tracking-wider text-white/50 uppercase">{i}</a>
            ))}
            <button className="holo-btn font-orb text-xs cyan px-4 py-2 rounded-sm uppercase w-fit">Launch App</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-24 hex-grid" style={{ zIndex: 10 }}>
        {/* Orbital decoration */}
        <div className="absolute left-16 top-1/3 hidden lg:block" style={{ opacity: 0.4 }}>
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ border: "1px dashed rgba(0,229,255,0.2)" }} />
            <div className="absolute" style={{ width: "130%", height: "130%", top: "-15%", left: "-15%", borderRadius: "50%", border: "1px dashed rgba(245,197,66,0.15)" }} />
            <div className="w-3 h-3 rounded-full orbit" style={{ background: "#00e5ff", boxShadow: "0 0 12px #00e5ff" }} />
            <div className="w-2 h-2 rounded-full orbit2" style={{ background: "#f5c542", boxShadow: "0 0 8px #f5c542" }} />
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}>
              <span className="font-orb text-xs cyan">⬡</span>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-sm fade-in-up"
            style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.2)" }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ boxShadow: "0 0 8px #00e5ff" }} />
            <span className="font-orb text-xs tracking-widest cyan uppercase">System Online · All nodes active</span>
          </div>

          {/* Headline */}
          <h1 className="font-orb font-900 leading-tight mb-3 fade-in-up" style={{ fontSize: "clamp(2.2rem, 6vw, 5.5rem)", animationDelay: "0.1s" }}>
            <span className="text-grad-cg">COMMAND</span><br />
            <span style={{ color: "#e8f4ff" }}>YOUR</span>{" "}
          </h1>
          <h1 className="font-orb font-900 leading-none mb-8 fade-in-up" style={{ fontSize: "clamp(2.2rem, 6vw, 5.5rem)", animationDelay: "0.2s", minHeight: "1.3em" }}>
            <span className="text-grad-cv">{typed}</span>
            <span className="caret" />
          </h1>

          <p className="text-white/50 max-w-lg mx-auto mb-10 leading-relaxed fade-in-up text-lg" style={{ animationDelay: "0.3s" }}>
            Military-grade expense intelligence. Real-time beam tracking. AI that learns your financial DNA.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 fade-in-up" style={{ animationDelay: "0.4s" }}>
            <button className="solid-btn font-orb text-sm tracking-wider text-[#07070f] font-bold px-8 py-4 rounded-sm uppercase">
              Initialize Free
            </button>
            <button className="holo-btn font-orb text-sm tracking-wider cyan px-8 py-4 rounded-sm uppercase flex items-center gap-3 justify-center">
              <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,229,255,0.2)" }}>▶</span>
              Watch Protocol
            </button>
          </div>

          {/* Live stats strip */}
          <div className="inline-flex gap-8 fade-in-up" style={{ animationDelay: "0.5s" }}>
            {[
              { v: "2.4M+", l: "Users" },
              { v: "$840M", l: "Tracked" },
              { v: "99.9%", l: "Uptime" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="font-orb text-xl font-bold cyan number-glow">{s.v}</p>
                <p className="font-orb text-xs text-white/30 tracking-widest uppercase mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right orbital */}
        <div className="absolute right-16 bottom-1/3 hidden lg:block" style={{ opacity: 0.35 }}>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ border: "1px dashed rgba(176,106,255,0.3)" }} />
            <div className="w-2 h-2 rounded-full" style={{ background: "#b06aff", boxShadow: "0 0 10px #b06aff", animation: "orbit 9s linear infinite reverse" }} />
            <span className="font-orb text-2xl violet">◈</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ opacity: 0.4 }}>
          <span className="font-orb text-xs tracking-widest text-white/40 uppercase">Scroll</span>
          <div className="w-px h-12" style={{ background: "linear-gradient(180deg, #00e5ff, transparent)" }} />
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="relative py-4 overflow-hidden" style={{
        zIndex: 10,
        background: "rgba(0,229,255,0.04)",
        borderTop: "1px solid rgba(0,229,255,0.1)",
        borderBottom: "1px solid rgba(0,229,255,0.1)",
      }}>
        <div className="ticker">
          {[...Array(2)].map((_, rep) => (
            <div key={rep} className="flex gap-12 mr-12">
              {["Real-time sync", "AI-powered", "Bank-grade encryption", "Zero-fee transfers", "Smart budgets", "Beam alerts", "Auto-categorize", "Multi-currency"].map((t) => (
                <span key={t} className="font-orb text-xs tracking-widest text-white/30 uppercase flex items-center gap-3">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 opacity-60" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="relative py-28 px-6 hex-grid" style={{ zIndex: 10 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-sm"
              style={{ border: "1px solid rgba(245,197,66,0.3)", background: "rgba(245,197,66,0.05)" }}>
              <span className="font-orb text-xs gold tracking-widest uppercase">Core Modules</span>
            </div>
            <h2 className="font-orb text-4xl md:text-5xl font-bold mb-4" style={{ color: "#e8f4ff" }}>
              FINANCIAL<br />
              <span className="text-grad-cg">INTELLIGENCE</span>
            </h2>
            <BeamDivider color="#f5c542" />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Feature list */}
            <div className="flex flex-col gap-3">
              {features.map((f, i) => (
                <HoloCard
                  key={f.title}
                  accent={f.accent}
                  className={`p-5 cursor-pointer transition-all duration-300 ${activeFeature === i ? "feature-active" : ""}`}
                  onClick={() => setActiveFeature(i)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm relative corner-frame corner-frame-b"
                      style={{ background: `${f.accent}10` }}>
                      <span className="font-orb text-lg" style={{ color: f.accent }}>{f.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-orb text-sm tracking-wider font-600 mb-1" style={{ color: activeFeature === i ? f.accent : "#e8f4ff" }}>
                        {f.title}
                      </h3>
                      <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                    </div>
                    {activeFeature === i && (
                      <div className="ml-auto flex-shrink-0 w-2 h-2 rounded-full" style={{ background: f.accent, boxShadow: `0 0 8px ${f.accent}` }} />
                    )}
                  </div>
                </HoloCard>
              ))}
            </div>

            {/* Feature display panel */}
            <div className="sticky top-24 h-fit">
              <HoloCard accent={features[activeFeature].accent} className="p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px" style={{
                  background: `linear-gradient(90deg, transparent, ${features[activeFeature].accent}, transparent)`,
                  boxShadow: `0 0 10px ${features[activeFeature].accent}`,
                }} />
                <div className="text-6xl mb-6 font-orb" style={{ color: features[activeFeature].accent }}>
                  {features[activeFeature].icon}
                </div>
                <div className="font-orb text-xs tracking-widest mb-2 uppercase" style={{ color: features[activeFeature].accent }}>
                  Module {String(activeFeature + 1).padStart(2, "0")}
                </div>
                <h3 className="font-orb text-2xl font-bold text-white mb-4">{features[activeFeature].title}</h3>
                <p className="text-white/50 leading-relaxed mb-8">{features[activeFeature].desc}</p>

                {/* Fake metric bars */}
                <div className="space-y-3">
                  {["Accuracy", "Speed", "Security"].map((m, i) => (
                    <div key={m}>
                      <div className="flex justify-between mb-1">
                        <span className="font-orb text-xs text-white/40 uppercase tracking-wider">{m}</span>
                        <span className="font-orb text-xs" style={{ color: features[activeFeature].accent }}>{94 - i * 3}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full progress-beam"
                          style={{
                            width: `${94 - i * 3}%`,
                            background: `linear-gradient(90deg, ${features[activeFeature].accent}88, ${features[activeFeature].accent})`,
                            boxShadow: `0 0 8px ${features[activeFeature].accent}`,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Corner decorations */}
                <div className="absolute bottom-4 right-4 flex gap-2 items-center">
                  <div className="w-1 h-1 rounded-full" style={{ background: features[activeFeature].accent, opacity: 0.5 }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: features[activeFeature].accent, opacity: 0.3 }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: features[activeFeature].accent, opacity: 0.15 }} />
                </div>
              </HoloCard>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-6 relative" style={{ zIndex: 10, background: "rgba(0,229,255,0.02)", borderTop: "1px solid rgba(0,229,255,0.07)", borderBottom: "1px solid rgba(0,229,255,0.07)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { to: 2400000, pre: "", suf: "+", label: "Users Globally", c: "#00e5ff" },
            { to: 840, pre: "$", suf: "M", label: "Tracked Monthly", c: "#f5c542" },
            { to: 99, pre: "", suf: ".9%", label: "System Uptime", c: "#b06aff" },
            { to: 150, pre: "", suf: "+", label: "Countries Active", c: "#00e5ff" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-orb text-3xl md:text-4xl font-bold number-glow mb-2" style={{ color: s.c }}>
                <Counter to={s.to} prefix={s.pre} suffix={s.suf} />
              </p>
              <p className="font-orb text-xs tracking-widest text-white/30 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 px-6 relative hex-grid" style={{ zIndex: 10 }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-sm"
              style={{ border: "1px solid rgba(176,106,255,0.3)", background: "rgba(176,106,255,0.05)" }}>
              <span className="font-orb text-xs violet tracking-widest uppercase">Boot Sequence</span>
            </div>
            <h2 className="font-orb text-4xl md:text-5xl font-bold" style={{ color: "#e8f4ff" }}>
              <span className="text-grad-cv">THREE STEPS</span><br />TO COMMAND
            </h2>
          </div>

          <div className="relative">
            {/* Vertical beam connector */}
            <div className="absolute left-8 md:left-1/2 top-8 bottom-8 w-px hidden md:block"
              style={{ background: "linear-gradient(180deg, #00e5ff22, #b06aff22, #00e5ff22)" }} />

            <div className="space-y-8">
              {steps.map((s, i) => (
                <div key={s.n} className={`flex gap-6 items-start ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                  <div className="relative flex-shrink-0 z-10">
                    <div className="w-16 h-16 rounded-sm flex items-center justify-center float-slow"
                      style={{
                        animationDelay: `${i * 0.8}s`,
                        background: "rgba(7,7,15,0.9)",
                        border: "1px solid rgba(0,229,255,0.3)",
                        boxShadow: "0 0 30px rgba(0,229,255,0.15)",
                      }}>
                      <span className="font-orb text-lg font-bold text-grad-cg">{s.n}</span>
                    </div>
                  </div>
                  <HoloCard accent="#00e5ff" className="flex-1 p-6">
                    <h3 className="font-orb text-lg font-bold cyan mb-2 tracking-wider">{s.title}</h3>
                    <p className="text-white/50 leading-relaxed">{s.desc}</p>
                    <div className="mt-4 h-px" style={{ background: "linear-gradient(90deg, rgba(0,229,255,0.3), transparent)" }} />
                  </HoloCard>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-28 px-6 relative" style={{ zIndex: 10, background: "rgba(0,0,0,0.3)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-sm"
              style={{ border: "1px solid rgba(245,197,66,0.3)", background: "rgba(245,197,66,0.05)" }}>
              <span className="font-orb text-xs gold tracking-widest uppercase">Access Tiers</span>
            </div>
            <h2 className="font-orb text-4xl md:text-5xl font-bold mb-8" style={{ color: "#e8f4ff" }}>
              SELECT YOUR<br /><span className="text-grad-cg">PROTOCOL</span>
            </h2>
            {/* Toggle */}
            <div className="inline-flex rounded-sm overflow-hidden" style={{ border: "1px solid rgba(0,229,255,0.2)" }}>
              {["monthly", "annually"].map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className="font-orb text-xs tracking-widest uppercase px-5 py-2.5 transition-all"
                  style={{
                    background: billing === b ? "rgba(0,229,255,0.15)" : "transparent",
                    color: billing === b ? "#00e5ff" : "rgba(255,255,255,0.3)",
                    borderRight: b === "monthly" ? "1px solid rgba(0,229,255,0.2)" : "none",
                  }}
                >
                  {b}{b === "annually" && " -20%"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Scout", price: billing === "annually" ? 0 : 0, desc: "Entry protocol", features: ["50 tx/month", "3 categories", "Basic charts", "Mobile app"], accent: "#00e5ff", cta: "Initialize" },
              { name: "Operative", price: billing === "annually" ? 6 : 7, desc: "Active intel mode", features: ["Unlimited tx", "AI categorize", "All analytics", "5 shared wallets", "CSV/PDF export", "Priority uplink"], accent: "#f5c542", cta: "Deploy", hot: true },
              { name: "Commander", price: billing === "annually" ? 15 : 19, desc: "Full command center", features: ["Everything in Operative", "Unlimited wallets", "Team permissions", "Accounting API", "Custom protocols", "Dedicated ops line"], accent: "#b06aff", cta: "Command" },
            ].map((p) => (
              <HoloCard key={p.name} accent={p.accent} className={`p-6 relative ${p.hot ? "ring-1" : ""}`}
                style={p.hot ? { ringColor: p.accent } : {}}>
                {p.hot && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 font-orb text-xs tracking-widest rounded-sm uppercase"
                    style={{ background: p.accent, color: "#07070f" }}>
                    Recommended
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 h-px" style={{
                  background: `linear-gradient(90deg, transparent, ${p.accent}88, transparent)`,
                  boxShadow: `0 0 8px ${p.accent}66`,
                }} />

                <div className="mb-6">
                  <div className="font-orb text-xs tracking-widest uppercase mb-1" style={{ color: p.accent }}>{p.name}</div>
                  <div className="font-orb text-xs text-white/30 tracking-wider mb-4">{p.desc}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-orb text-4xl font-bold" style={{ color: "#e8f4ff" }}>
                      ${p.price}
                    </span>
                    {p.price > 0 && <span className="font-orb text-xs text-white/30">/mo</span>}
                    {p.price === 0 && <span className="font-orb text-xs" style={{ color: p.accent }}>Free forever</span>}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/50">
                      <span className="text-xs" style={{ color: p.accent }}>◆</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  className="w-full py-3 font-orb text-xs tracking-widest uppercase rounded-sm transition-all hover:scale-[1.02]"
                  style={p.hot
                    ? { background: `linear-gradient(135deg, ${p.accent}, ${p.accent}bb)`, color: "#07070f", fontWeight: "bold" }
                    : { background: `${p.accent}10`, border: `1px solid ${p.accent}40`, color: p.accent }
                  }
                >
                  {p.cta}
                </button>
              </HoloCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 px-6 relative hex-grid" style={{ zIndex: 10 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-sm"
              style={{ border: "1px solid rgba(0,229,255,0.2)", background: "rgba(0,229,255,0.04)" }}>
              <span className="font-orb text-xs cyan tracking-widest uppercase">Field Reports</span>
            </div>
            <h2 className="font-orb text-4xl md:text-5xl font-bold" style={{ color: "#e8f4ff" }}>
              OPERATOR<br /><span className="text-grad-cv">TESTIMONIALS</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <HoloCard key={t.name} accent={t.c} className="p-6">
                <div className="absolute top-0 left-0 right-0 h-px" style={{
                  background: `linear-gradient(90deg, transparent, ${t.c}66, transparent)`,
                }} />
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: t.c, fontSize: "12px" }}>★</span>
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-6 italic">"{t.q}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center font-orb text-xs font-bold"
                    style={{ background: `${t.c}15`, border: `1px solid ${t.c}40`, color: t.c }}>
                    {t.init}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{t.name}</p>
                    <p className="font-orb text-xs text-white/30 tracking-wider uppercase">{t.role}</p>
                  </div>
                </div>
              </HoloCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6 relative" style={{ zIndex: 10 }}>
        <div className="max-w-3xl mx-auto relative">
          {/* Multi-layer glow */}
          <div className="absolute inset-0 rounded-sm" style={{
            background: "radial-gradient(ellipse at center, rgba(0,229,255,0.08) 0%, transparent 70%)",
          }} />
          <HoloCard accent="#00e5ff" className="p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px" style={{
              background: "linear-gradient(90deg, transparent, #00e5ff, transparent)",
              boxShadow: "0 0 15px #00e5ff",
            }} />
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{
              background: "linear-gradient(90deg, transparent, #f5c542, transparent)",
              boxShadow: "0 0 15px #f5c542",
            }} />

            {/* Floating particles inside card */}
            {[...Array(8)].map((_, i) => (
              <div key={i} className="particle-dot"
                style={{
                  left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%`,
                  background: i % 2 === 0 ? "#00e5ff" : "#f5c542",
                  opacity: 0.3,
                  "--dur": `${3 + i * 0.5}s`,
                  "--tx": `${(i % 3 - 1) * 15}px`,
                  "--ty": `-${10 + i * 3}px`,
                }}
              />
            ))}

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-sm"
                style={{ border: "1px solid rgba(0,229,255,0.3)", background: "rgba(0,229,255,0.06)" }}>
                <span className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 8px #00e5ff" }} />
                <span className="font-orb text-xs cyan tracking-widest uppercase">Ready to Deploy</span>
              </div>
              <h2 className="font-orb text-4xl md:text-5xl font-bold mb-4" style={{ color: "#e8f4ff" }}>
                TAKE CONTROL<br />
                <span className="text-grad-cg">IN 2 MINUTES</span>
              </h2>
              <BeamDivider />
              <p className="text-white/40 mb-8 max-w-md mx-auto leading-relaxed">
                Connect your bank. Let the AI analyze. Watch your financial universe come alive on the dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="solid-btn font-orb text-sm tracking-wider text-[#07070f] font-bold px-10 py-4 rounded-sm uppercase">
                  Initialize Free Account
                </button>
                <button className="holo-btn font-orb text-sm tracking-wider cyan px-8 py-4 rounded-sm uppercase">
                  View Live Demo
                </button>
              </div>
              <p className="font-orb text-xs text-white/20 mt-5 tracking-widest">
                NO CARD · CANCEL ANYTIME · GDPR COMPLIANT
              </p>
            </div>
          </HoloCard>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 relative" style={{ zIndex: 10, borderTop: "1px solid rgba(0,229,255,0.07)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-sm flex items-center justify-center"
                  style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)" }}>
                  <span className="font-orb text-sm cyan font-bold">$</span>
                </div>
                <span className="font-orb text-sm tracking-widest uppercase" style={{ color: "#e0f7ff" }}>SPENDLY</span>
              </div>
              <p className="text-xs text-white/25 max-w-xs leading-relaxed">
                Next-generation financial intelligence for operators who demand precision.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-10">
              {[
                { title: "Protocol", links: ["Features", "Pricing", "API", "Changelog"] },
                { title: "Network", links: ["About", "Blog", "Careers", "Press"] },
                { title: "Secure", links: ["Privacy", "Terms", "Security", "GDPR"] },
              ].map((col) => (
                <div key={col.title}>
                  <p className="font-orb text-xs tracking-widest cyan uppercase mb-4">{col.title}</p>
                  <ul className="space-y-2">
                    {col.links.map((l) => (
                      <li key={l}>
                        <a href="#" className="font-orb text-xs text-white/25 hover:text-white/60 uppercase tracking-wider transition-colors">{l}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6" style={{ borderTop: "1px solid rgba(0,229,255,0.06)" }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="font-orb text-xs text-white/20 tracking-widest">© 2026 SPENDLY INC. ALL SYSTEMS OPERATIONAL.</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #34d399" }} />
                <span className="font-orb text-xs text-white/20 tracking-widest">ALL NODES ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


// import { useEffect, useRef, useState, useCallback } from "react";
 
// /* ─────────────────────────────────────────────
//    PARTICLE CANVAS  — subtle financial data feel
// ───────────────────────────────────────────── */
// function ParticleField() {
//   const cvs = useRef(null);
//   const mouse = useRef({ x: -9999, y: -9999 });
//   const raf = useRef(null);
 
//   useEffect(() => {
//     const canvas = cvs.current;
//     const ctx = canvas.getContext("2d");
//     let W = (canvas.width = window.innerWidth);
//     let H = (canvas.height = window.innerHeight);
 
//     const onResize = () => {
//       W = canvas.width = window.innerWidth;
//       H = canvas.height = window.innerHeight;
//     };
//     const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
//     window.addEventListener("resize", onResize);
//     window.addEventListener("mousemove", onMove);
 
//     // Ambient gradient orbs
//     const orbs = [
//       { x: W * 0.15, y: H * 0.25, r: 340, h: 158, a: 0.055 },
//       { x: W * 0.85, y: H * 0.65, r: 280, h: 142, a: 0.04  },
//       { x: W * 0.5,  y: H * 0.9,  r: 220, h: 170, a: 0.035 },
//     ];
 
//     // Floating dots
//     const N = 90;
//     const dots = Array.from({ length: N }, () => ({
//       x: Math.random() * W, y: Math.random() * H,
//       vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
//       r: Math.random() * 1.4 + .3,
//       a: Math.random() * .28 + .06,
//       c: Math.random() > .55 ? "#10b981" : Math.random() > .5 ? "#6ee7b7" : "#94a3b8",
//     }));
 
//     // Horizontal beam streaks
//     const beams = Array.from({ length: 5 }, (_, i) => ({
//       y: (H / 6) * (i + 1) + (Math.random() - .5) * 60,
//       x: -300, speed: .4 + Math.random() * .35,
//       len: 100 + Math.random() * 180,
//       a: .025 + Math.random() * .025,
//       c: i % 2 === 0 ? "#10b981" : "#6ee7b7",
//     }));
 
//     let t = 0;
//     const frame = () => {
//       t += .005;
//       ctx.clearRect(0, 0, W, H);
 
//       // Orbs
//       orbs.forEach(o => {
//         const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
//         g.addColorStop(0, `hsla(${o.h},80%,60%,${o.a})`);
//         g.addColorStop(1, "transparent");
//         ctx.fillStyle = g;
//         ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
//       });
 
//       // Beam streaks
//       beams.forEach(b => {
//         b.x += b.speed;
//         if (b.x > W + b.len) b.x = -b.len;
//         const pulse = .55 + .45 * Math.sin(t * 1.8 + b.y);
//         const g = ctx.createLinearGradient(b.x, 0, b.x + b.len, 0);
//         g.addColorStop(0, "transparent");
//         g.addColorStop(.5, b.c + Math.floor(b.a * pulse * 255).toString(16).padStart(2,"0"));
//         g.addColorStop(1, "transparent");
//         ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = .8;
//         ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.len, b.y); ctx.stroke();
//         ctx.restore();
//       });
 
//       // Dot connections
//       for (let i = 0; i < N; i++) {
//         for (let j = i + 1; j < N; j++) {
//           const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
//           const d = Math.sqrt(dx*dx + dy*dy);
//           if (d < 85) {
//             ctx.save(); ctx.globalAlpha = (1 - d/85) * .065;
//             ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = .4;
//             ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
//             ctx.restore();
//           }
//         }
//       }
 
//       // Dots
//       dots.forEach(p => {
//         const dx = mouse.current.x - p.x, dy = mouse.current.y - p.y;
//         const d2 = Math.sqrt(dx*dx + dy*dy);
//         if (d2 < 110) { p.vx -= (dx/d2) * .035; p.vy -= (dy/d2) * .035; }
//         p.vx *= .99; p.vy *= .99;
//         p.x += p.vx; p.y += p.vy;
//         if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
//         if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
//         ctx.save();
//         ctx.globalAlpha = d2 < 90 ? Math.min(p.a * 2.8, .85) : p.a;
//         if (d2 < 90) { ctx.shadowColor = p.c; ctx.shadowBlur = 6; }
//         ctx.fillStyle = p.c;
//         ctx.beginPath(); ctx.arc(p.x, p.y, d2 < 90 ? p.r * 2.2 : p.r, 0, Math.PI * 2); ctx.fill();
//         ctx.restore();
//       });
 
//       raf.current = requestAnimationFrame(frame);
//     };
//     frame();
//     return () => {
//       cancelAnimationFrame(raf.current);
//       window.removeEventListener("resize", onResize);
//       window.removeEventListener("mousemove", onMove);
//     };
//   }, []);
 
//   return <canvas ref={cvs} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
// }
 
// /* ─────────────────────────────────────────────
//    SCROLL REVEAL HOOK
// ───────────────────────────────────────────── */
// function useReveal(threshold = 0.15) {
//   const ref = useRef(null);
//   const [visible, setVisible] = useState(false);
//   useEffect(() => {
//     const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
//     if (ref.current) obs.observe(ref.current);
//     return () => obs.disconnect();
//   }, [threshold]);
//   return [ref, visible];
// }
 
// /* ─────────────────────────────────────────────
//    ANIMATED COUNTER
// ───────────────────────────────────────────── */
// function Counter({ to, prefix = "", suffix = "" }) {
//   const [v, setV] = useState(0);
//   const [ref, vis] = useReveal(0.4);
//   const done = useRef(false);
//   useEffect(() => {
//     if (!vis || done.current) return;
//     done.current = true;
//     let cur = 0;
//     const id = setInterval(() => {
//       cur += to / 55;
//       if (cur >= to) { setV(to); clearInterval(id); }
//       else setV(Math.floor(cur));
//     }, 18);
//     return () => clearInterval(id);
//   }, [vis, to]);
//   const fmt = v >= 1_000_000 ? (v/1_000_000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(0)+"K" : v;
//   return <span ref={ref}>{prefix}{fmt}{suffix}</span>;
// }
 
// /* ─────────────────────────────────────────────
//    TYPEWRITER
// ───────────────────────────────────────────── */
// function Typewriter({ words, className = "" }) {
//   const [wi, setWi] = useState(0);
//   const [txt, setTxt] = useState("");
//   const [del, setDel] = useState(false);
//   useEffect(() => {
//     const w = words[wi];
//     const id = setTimeout(() => {
//       if (!del && txt.length < w.length) setTxt(w.slice(0, txt.length + 1));
//       else if (!del && txt.length === w.length) setDel(true);
//       else if (del && txt.length > 0) setTxt(txt.slice(0, -1));
//       else { setDel(false); setWi((i) => (i + 1) % words.length); }
//     }, del ? 42 : txt.length === words[wi].length ? 1800 : 78);
//     return () => clearTimeout(id);
//   }, [txt, del, wi, words]);
//   return (
//     <span className={className}>
//       {txt}
//       <span className="inline-block w-0.5 h-[0.9em] bg-emerald-400 ml-0.5 align-middle" style={{ animation: "blink .75s step-end infinite", boxShadow: "0 0 8px #10b981" }} />
//     </span>
//   );
// }
 
// /* ─────────────────────────────────────────────
//    GLASS CARD
// ───────────────────────────────────────────── */
// function GlassCard({ children, className = "", accent = "#10b981", hover = true, glow = false }) {
//   const r = useRef(null);
//   const onMove = useCallback((e) => {
//     if (!hover) return;
//     const rect = r.current.getBoundingClientRect();
//     const x = ((e.clientX - rect.left) / rect.width - .5) * 14;
//     const y = ((e.clientY - rect.top) / rect.height - .5) * -14;
//     r.current.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg) translateY(-2px)`;
//     r.current.style.setProperty("--cx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
//     r.current.style.setProperty("--cy", `${((e.clientY - rect.top) / rect.height) * 100}%`);
//   }, [hover]);
//   const onLeave = useCallback(() => {
//     if (!r.current) return;
//     r.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0)";
//   }, []);
//   return (
//     <div
//       ref={r}
//       onMouseMove={onMove}
//       onMouseLeave={onLeave}
//       className={`relative overflow-hidden rounded-2xl ${className}`}
//       style={{
//         background: "rgba(13,16,28,0.72)",
//         border: `1px solid rgba(255,255,255,0.07)`,
//         backdropFilter: "blur(16px)",
//         transition: "transform .2s ease, box-shadow .25s ease",
//         "--cx": "50%", "--cy": "50%",
//         boxShadow: glow
//           ? `0 0 0 1px ${accent}22, 0 8px 40px rgba(0,0,0,.5), 0 0 60px ${accent}0f`
//           : "0 4px 30px rgba(0,0,0,.35)",
//       }}
//     >
//       <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(circle at var(--cx) var(--cy), ${accent}12 0%, transparent 55%)` }} />
//       {children}
//     </div>
//   );
// }
 
// /* ─────────────────────────────────────────────
//    BADGE
// ───────────────────────────────────────────── */
// function Badge({ children, color = "emerald" }) {
//   const styles = {
//     emerald: { bg: "rgba(16,185,129,.1)", border: "rgba(16,185,129,.22)", text: "#6ee7b7" },
//     amber:   { bg: "rgba(245,158,11,.09)", border: "rgba(245,158,11,.2)",  text: "#fcd34d" },
//     violet:  { bg: "rgba(139,92,246,.09)", border: "rgba(139,92,246,.2)",  text: "#c4b5fd" },
//     slate:   { bg: "rgba(148,163,184,.07)", border: "rgba(148,163,184,.15)", text: "#94a3b8" },
//   };
//   const s = styles[color];
//   return (
//     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text, letterSpacing: ".03em" }}>
//       {children}
//     </span>
//   );
// }
 
// /* ─────────────────────────────────────────────
//    DASHBOARD MOCKUP
// ───────────────────────────────────────────── */
// const TRANSACTIONS = [
//   { icon: "🛒", name: "Whole Foods Market",  cat: "Groceries",      amt: "−$84.20",    pos: false, date: "Today"     },
//   { icon: "☕", name: "Blue Bottle Coffee",  cat: "Dining",          amt: "−$6.50",     pos: false, date: "Today"     },
//   { icon: "💼", name: "Freelance Invoice",   cat: "Income",          amt: "+$2,400.00", pos: true,  date: "Yesterday" },
//   { icon: "🚇", name: "Transit Monthly",     cat: "Transport",       amt: "−$32.00",    pos: false, date: "Jun 28"    },
//   { icon: "📺", name: "Netflix",             cat: "Subscriptions",   amt: "−$15.99",    pos: false, date: "Jun 25"    },
// ];
 
// function DashboardMockup() {
//   const [tab, setTab] = useState("overview");
//   return (
//     <GlassCard accent="#10b981" hover={false} glow className="w-full overflow-hidden">
//       {/* Top accent */}
//       <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,#10b981 35%,#6ee7b7 65%,transparent)", boxShadow: "0 0 16px #10b98155" }} />
 
//       {/* Browser chrome */}
//       <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
//         <div className="flex gap-1.5">
//           <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,.55)" }} />
//           <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(234,179,8,.55)" }} />
//           <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(34,197,94,.55)" }} />
//         </div>
//         <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.22)" }}>
//           app.spendly.io/dashboard
//         </div>
//         <div className="flex items-center gap-1.5">
//           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #10b981" }} />
//           <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Live</span>
//         </div>
//       </div>
 
//       {/* Tabs */}
//       <div className="flex gap-1 px-5 pt-3 pb-0 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
//         {["overview", "transactions", "insights"].map(t => (
//           <button key={t} onClick={() => setTab(t)}
//             className="px-3.5 pb-2.5 pt-1 text-xs capitalize font-medium border-b-2 transition-all -mb-px"
//             style={{ borderColor: tab === t ? "#10b981" : "transparent", color: tab === t ? "#6ee7b7" : "rgba(255,255,255,0.3)" }}>
//             {t}
//           </button>
//         ))}
//       </div>
 
//       <div className="p-5">
//         {/* OVERVIEW TAB */}
//         {tab === "overview" && (
//           <div className="space-y-4">
//             {/* Metric cards */}
//             <div className="grid grid-cols-3 gap-3">
//               {[
//                 { label: "Spent this month", val: "$3,240", delta: "↑ 4.2%", bad: true },
//                 { label: "Net income",        val: "$6,800", delta: "↑ 12%",  bad: false },
//                 { label: "Saved",             val: "$1,560", delta: "↑ 8.1%", bad: false },
//               ].map(m => (
//                 <div key={m.label} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
//                   <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</p>
//                   <p className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-.01em" }}>{m.val}</p>
//                   <p className="text-xs mt-1 font-medium" style={{ color: m.bad ? "#f87171" : "#4ade80" }}>{m.delta}</p>
//                 </div>
//               ))}
//             </div>
//             {/* Sparkline */}
//             <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,.03)", border: "1px solid rgba(16,185,129,.08)" }}>
//               <div className="flex justify-between items-center mb-3">
//                 <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Spending — last 6 months</p>
//                 <span className="text-xs font-semibold" style={{ color: "#6ee7b7" }}>−8% vs avg</span>
//               </div>
//               <div className="flex items-end gap-2" style={{ height: 56 }}>
//                 {[38, 62, 47, 71, 55, 82].map((h, i) => (
//                   <div key={i} className="flex-1 rounded-sm transition-all duration-500"
//                     style={{ height: `${h}%`, background: i === 5 ? "linear-gradient(180deg,#10b981,#059669)" : "rgba(255,255,255,0.07)", boxShadow: i === 5 ? "0 0 10px #10b98155" : "none" }} />
//                 ))}
//               </div>
//               <div className="flex justify-between mt-2" style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
//                 {["Jan","Feb","Mar","Apr","May","Jun"].map(m => <span key={m}>{m}</span>)}
//               </div>
//             </div>
//             {/* Category bar */}
//             <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
//               <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Top categories</p>
//               <div className="space-y-2.5">
//                 {[
//                   { l: "Housing", pct: 38, c: "#10b981" },
//                   { l: "Food & Dining", pct: 24, c: "#6ee7b7" },
//                   { l: "Transport", pct: 16, c: "#fbbf24" },
//                   { l: "Shopping", pct: 12, c: "#a78bfa" },
//                 ].map(c => (
//                   <div key={c.l} className="flex items-center gap-3">
//                     <span className="text-xs w-24 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{c.l}</span>
//                     <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
//                       <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.c, boxShadow: `0 0 6px ${c.c}55`, transition: "width .8s ease" }} />
//                     </div>
//                     <span className="text-xs w-8 text-right" style={{ color: "rgba(255,255,255,0.3)" }}>{c.pct}%</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}
 
//         {/* TRANSACTIONS TAB */}
//         {tab === "transactions" && (
//           <div className="space-y-2">
//             <div className="flex justify-between items-center mb-3">
//               <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Recent transactions</p>
//               <span className="text-xs" style={{ color: "#6ee7b7" }}>View all →</span>
//             </div>
//             {TRANSACTIONS.map((t, i) => (
//               <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
//                 <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>{t.icon}</div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{t.name}</p>
//                   <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{t.cat} · {t.date}</p>
//                 </div>
//                 <span className="text-sm font-semibold flex-shrink-0" style={{ color: t.pos ? "#4ade80" : "#f87171" }}>{t.amt}</span>
//               </div>
//             ))}
//           </div>
//         )}
 
//         {/* INSIGHTS TAB */}
//         {tab === "insights" && (
//           <div className="space-y-3">
//             <p className="text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>AI-powered recommendations</p>
//             {[
//               { icon: "💡", t: "Reduce dining spend", d: "You're 23% over your dining budget. Cooking at home 3× a week saves ~$120.", c: "#10b981" },
//               { icon: "📈", t: "Savings rate up 5%",   d: "Your savings rate reached 23% this month — your best in 6 months.", c: "#fbbf24" },
//               { icon: "🔔", t: "3 bills due soon",     d: "Netflix, Spotify, and electricity total $78 due within 5 days.", c: "#a78bfa" },
//               { icon: "✅", t: "Under budget overall", d: "You're tracking $340 under your overall monthly budget. Great work.", c: "#4ade80" },
//             ].map(ins => (
//               <div key={ins.t} className="flex gap-3 p-4 rounded-xl" style={{ background: `${ins.c}08`, border: `1px solid ${ins.c}1a` }}>
//                 <span className="text-lg leading-none mt-0.5">{ins.icon}</span>
//                 <div>
//                   <p className="text-sm font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>{ins.t}</p>
//                   <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{ins.d}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </GlassCard>
//   );
// }
 
// /* ─────────────────────────────────────────────
//    SECTION WRAPPER (scroll reveal)
// ───────────────────────────────────────────── */
// function Section({ children, className = "", delay = 0 }) {
//   const [ref, vis] = useReveal(0.1);
//   return (
//     <div ref={ref} className={className} style={{
//       opacity: vis ? 1 : 0,
//       transform: vis ? "translateY(0)" : "translateY(28px)",
//       transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
//     }}>
//       {children}
//     </div>
//   );
// }
 
// /* ─────────────────────────────────────────────
//    FEATURE DATA
// ───────────────────────────────────────────── */
// const FEATURES = [
//   { emoji: "🏦", title: "Instant Bank Sync",    desc: "Connect any bank or card in 30 seconds. Every transaction pulled in automatically with read-only, bank-grade OAuth.", accent: "#10b981" },
//   { emoji: "🤖", title: "AI Categorization",     desc: "Our model categorizes every transaction with 97% accuracy. It learns your habits and gets smarter over time.", accent: "#fbbf24" },
//   { emoji: "📊", title: "Visual Analytics",      desc: "Beautiful interactive charts that reveal trends, patterns, and opportunities hidden in your spending data.", accent: "#a78bfa" },
//   { emoji: "🔔", title: "Smart Alerts",          desc: "Unusual charge detection, bill reminders, and budget warnings — delivered the moment they matter.", accent: "#38bdf8" },
//   { emoji: "👥", title: "Shared Wallets",        desc: "Split expenses with roommates, partners, or teams. Real-time sync keeps everyone aligned automatically.", accent: "#fbbf24" },
//   { emoji: "🔐", title: "Zero-Trust Security",   desc: "256-bit AES encryption, biometric auth, and SOC 2 Type II compliance. Your data is never sold or shared.", accent: "#4ade80" },
// ];
 
// const TESTIMONIALS = [
//   { name: "Priya Nair",     role: "Product Designer",      init: "PN", tc: "#10b981", q: "After 6 apps I finally found one I actually use. The AI predictions are genuinely uncanny — it flagged a duplicate subscription I'd forgotten about." },
//   { name: "Marcus Osei",    role: "Senior Engineer",        init: "MO", tc: "#fbbf24", q: "The dashboard is clean and fast. I check it every morning like I check my email. It changed how I make decisions entirely." },
//   { name: "Aisha Brennan",  role: "Small Business Owner",   init: "AB", tc: "#a78bfa", q: "Shared wallets made team expense tracking effortless. We cut overspending by 30% in our first month. Nothing else comes close." },
// ];
 
// const PLANS = [
//   { name: "Free",    price: 0,  annualPrice: 0,  desc: "For individuals starting out", accent: "#10b981",
//     features: ["50 transactions / month","Basic categorization","Spending charts","iOS & Android app"] },
//   { name: "Pro",     price: 9,  annualPrice: 7,  desc: "For serious personal finance",  accent: "#fbbf24", hot: true,
//     features: ["Unlimited transactions","AI auto-categorization","Advanced analytics","Shared wallets (up to 5)","CSV & PDF exports","Priority support"] },
//   { name: "Business",price: 22, annualPrice: 17, desc: "For teams and growing businesses", accent: "#a78bfa",
//     features: ["Everything in Pro","Unlimited wallets","Team roles & permissions","Accounting integrations","Custom categories","Dedicated account manager"] },
// ];
 
// /* ─────────────────────────────────────────────
//    MAIN APP
// ───────────────────────────────────────────── */
// export default function App() {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [billing, setBilling] = useState("monthly");
//   const [activeFeature, setActiveFeature] = useState(0);
//   const [scrolled, setScrolled] = useState(false);
 
//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 20);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);
 
//   return (
//     <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#070c14", fontFamily: "var(--font-body)" }}>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
//         :root {
//           --font-display: 'Cabinet Grotesk', sans-serif;
//           --font-body:    'Instrument Sans', sans-serif;
//           --emerald:      #10b981;
//           --emerald-light: #6ee7b7;
//           --emerald-dim:   #059669;
//           --amber:         #fbbf24;
//           --violet:        #a78bfa;
//           --bg:            #070c14;
//           --surface:       #0d1120;
//           --border:        rgba(255,255,255,0.07);
//         }
//         * { font-family: var(--font-body); box-sizing: border-box; }
//         h1,h2,h3,.display { font-family: var(--font-display); }
//         @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
//         @keyframes fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
//         @keyframes floatA  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
//         @keyframes floatB  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
//         @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }
//         @keyframes ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
//         @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)} 50%{box-shadow:0 0 0 10px rgba(16,185,129,0)} }
 
//         .float-a { animation: floatA 5.5s ease-in-out infinite; }
//         .float-b { animation: floatB 7s ease-in-out infinite; animation-delay: -2.5s; }
//         .float-c { animation: floatA 6.5s ease-in-out infinite; animation-delay: -4s; }
 
//         .shimmer-green {
//           background: linear-gradient(90deg, #e2fef5 0%, #6ee7b7 25%, #10b981 50%, #6ee7b7 75%, #e2fef5 100%);
//           background-size: 200% auto;
//           -webkit-background-clip: text; -webkit-text-fill-color: transparent;
//           animation: shimmer 4.5s linear infinite;
//         }
 
//         .dot-grid {
//           background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px);
//           background-size: 30px 30px;
//         }
 
//         .ticker-inner { display:inline-flex; gap:56px; animation: ticker 25s linear infinite; white-space:nowrap; }
 
//         .btn-primary {
//           background: linear-gradient(135deg, #10b981, #059669);
//           color: #fff; font-weight: 600; border: none;
//           font-family: var(--font-display);
//           transition: all .25s ease;
//           position: relative; overflow: hidden;
//         }
//         .btn-primary::after {
//           content:''; position:absolute; inset:0;
//           background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.12) 100%);
//           opacity:0; transition: opacity .25s;
//         }
//         .btn-primary:hover::after { opacity:1; }
//         .btn-primary:hover { transform:translateY(-1px); box-shadow:0 10px 28px rgba(16,185,129,0.35); }
 
//         .btn-ghost {
//           background: rgba(255,255,255,0.04);
//           border: 1px solid rgba(255,255,255,0.1);
//           color: rgba(255,255,255,0.65);
//           font-family: var(--font-display);
//           transition: all .22s ease;
//         }
//         .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color:#fff; transform:translateY(-1px); }
 
//         .nav-link { color:rgba(255,255,255,.42); font-size:14px; transition:color .18s; text-decoration:none; }
//         .nav-link:hover { color:rgba(255,255,255,.85); }
 
//         .feature-item { transition: all .22s ease; cursor:pointer; }
//         .feature-item:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.1) !important; }
//         .feature-item.is-active { background: rgba(16,185,129,0.05) !important; border-color: rgba(16,185,129,0.22) !important; }
 
//         .card-lift { transition: transform .25s ease, box-shadow .25s ease; }
//         .card-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important; }
 
//         .plan-cta-primary { background:linear-gradient(135deg,var(--amber),#d97706); color:#07070f; font-weight:700; font-family:var(--font-display); transition:all .22s; }
//         .plan-cta-primary:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(251,191,36,0.35); }
//         .plan-cta-ghost { background:transparent; font-family:var(--font-display); font-weight:600; transition:all .22s; }
 
//         .divider { height:1px; background:linear-gradient(90deg,transparent,rgba(16,185,129,0.25),rgba(251,191,36,0.2),transparent); }
 
//         .progress-fill { position:relative; overflow:hidden; }
//         .progress-fill::after { content:''; position:absolute; top:0; left:-60%; width:40%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent); animation:shimmer 2.2s ease-in-out infinite; }
 
//         .pulse-dot { animation: pulseGlow 2.2s ease-in-out infinite; }
//       `}</style>
 
//       <ParticleField />
 
//       {/* ── DOT GRID BACKGROUND ── */}
//       <div className="fixed inset-0 dot-grid pointer-events-none" style={{ zIndex: 1, opacity: .5 }} />
 
//       {/* ── NAV ── */}
//       <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300" style={{
//         background: scrolled ? "rgba(7,12,20,0.88)" : "transparent",
//         backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
//         borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
//       }}>
//         <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ height: 64 }}>
//           {/* Logo */}
//           <a href="#" className="flex items-center gap-2.5 no-underline">
//             <div className="w-8 h-8 rounded-xl flex items-center justify-center pulse-dot" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
//               <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <span className="display font-800 text-white text-lg tracking-tight">spendly</span>
//           </a>
 
//           {/* Desktop links */}
//           <nav className="hidden md:flex items-center gap-7">
//             {["Features", "Pricing", "Blog", "Company"].map(l => <a key={l} href="#" className="nav-link">{l}</a>)}
//           </nav>
 
//           {/* Desktop CTAs */}
//           <div className="hidden md:flex items-center gap-3">
//             <button className="btn-ghost text-sm px-4 py-2 rounded-lg">Sign in</button>
//             <button className="btn-primary text-sm px-5 py-2.5 rounded-xl">Get started free</button>
//           </div>
 
//           {/* Mobile hamburger */}
//           <button onClick={() => setMenuOpen(o => !o)} className="md:hidden text-white/50 hover:text-white transition-colors p-1">
//             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//               <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
//             </svg>
//           </button>
//         </div>
 
//         {/* Mobile menu */}
//         <div className="md:hidden overflow-hidden transition-all duration-300" style={{ maxHeight: menuOpen ? 300 : 0 }}>
//           <div className="px-6 py-5 flex flex-col gap-4 border-t" style={{ background: "rgba(7,12,20,0.97)", borderColor: "rgba(255,255,255,0.06)" }}>
//             {["Features","Pricing","Blog","Company"].map(l => <a key={l} href="#" className="nav-link text-sm">{l}</a>)}
//             <button className="btn-primary text-sm px-5 py-2.5 rounded-xl w-fit mt-1">Get started free</button>
//           </div>
//         </div>
//       </header>
 
//       {/* ═══════════════════════════════════
//           HERO
//       ═══════════════════════════════════ */}
//       <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden" style={{ zIndex: 10 }}>
//         {/* Radial spotlight */}
//         <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(16,185,129,0.07) 0%, transparent 70%)" }} />
 
//         {/* Floating stat cards */}
//         <div className="absolute left-8 lg:left-20 top-1/3 hidden xl:block float-a">
//           <GlassCard hover={false} className="px-4 py-3" accent="#10b981">
//             <div className="flex items-center gap-2.5">
//               <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(16,185,129,0.12)" }}>💰</div>
//               <div>
//                 <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Saved this month</p>
//                 <p className="display font-700 text-emerald-400 text-sm">+$420.00</p>
//               </div>
//             </div>
//           </GlassCard>
//         </div>
 
//         <div className="absolute right-8 lg:right-20 top-[28%] hidden xl:block float-b">
//           <GlassCard hover={false} className="px-4 py-3" accent="#fbbf24">
//             <div className="flex items-center gap-2.5">
//               <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(251,191,36,0.12)" }}>📊</div>
//               <div>
//                 <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Budget used</p>
//                 <p className="display font-700 text-amber-400 text-sm">72% <span className="text-white/25 text-xs font-normal">of $4k</span></p>
//               </div>
//             </div>
//           </GlassCard>
//         </div>
 
//         <div className="absolute right-10 lg:right-24 bottom-[28%] hidden xl:block float-c">
//           <GlassCard hover={false} className="px-4 py-3" accent="#a78bfa">
//             <div className="flex items-center gap-2.5">
//               <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(167,139,250,0.12)" }}>🔔</div>
//               <div>
//                 <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Alert</p>
//                 <p className="display font-700 text-violet-400 text-xs">Bill due in 2 days</p>
//               </div>
//             </div>
//           </GlassCard>
//         </div>
 
//         {/* Main headline */}
//         <div style={{ animation: "fadeUp .7s ease both", animationDelay: ".05s" }}>
//           <Badge color="emerald">
//             <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" style={{ boxShadow: "0 0 6px #10b981" }} />
//             AI-powered expense intelligence
//           </Badge>
//         </div>
 
//         <h1 className="display font-900 leading-[1.04] mt-5 mb-5" style={{ fontSize: "clamp(2.6rem,5.8vw,5rem)", letterSpacing: "-.025em", animation: "fadeUp .7s ease both", animationDelay: ".15s" }}>
//           Know exactly where<br />
//           your{" "}
//           <span className="shimmer-green">
//             <Typewriter words={["money goes.", "budget stands.", "savings grow.", "spending trends."]} />
//           </span>
//         </h1>
 
//         <p className="text-lg max-w-xl mx-auto leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)", animation: "fadeUp .7s ease both", animationDelay: ".25s" }}>
//           Spendly connects to your bank, categorizes every transaction with AI, and gives you the clarity to make smarter financial decisions — automatically.
//         </p>
 
//         <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10" style={{ animation: "fadeUp .7s ease both", animationDelay: ".35s" }}>
//           <button className="btn-primary text-base px-9 py-3.5 rounded-xl">Start for free — no card needed</button>
//           <button className="btn-ghost text-base px-7 py-3.5 rounded-xl flex items-center gap-2.5 justify-center">
//             <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-400">
//               <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
//             </svg>
//             Watch 90-sec demo
//           </button>
//         </div>
 
//         <p className="text-sm mb-12" style={{ color: "rgba(255,255,255,0.25)", animation: "fadeUp .7s ease both", animationDelay: ".4s" }}>
//           Trusted by <strong style={{ color: "rgba(255,255,255,0.5)" }}>180,000+</strong> people in 150+ countries
//         </p>
 
//         {/* Dashboard preview */}
//         <div className="w-full max-w-3xl mx-auto" style={{ animation: "fadeUp .85s ease both", animationDelay: ".5s" }}>
//           <DashboardMockup />
//           {/* Bottom fade */}
//           <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none" style={{ background: "linear-gradient(transparent, #070c14)", zIndex: 2 }} />
//         </div>
//       </section>
 
//       {/* ═══════════════════════════════════
//           TICKER
//       ═══════════════════════════════════ */}
//       <div className="relative overflow-hidden py-3.5" style={{ zIndex: 10, background: "rgba(16,185,129,0.04)", borderTop: "1px solid rgba(16,185,129,0.1)", borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
//         <div className="ticker-inner">
//           {[...Array(2)].map((_, r) => (
//             <span key={r} className="flex gap-14">
//               {["Real-time bank sync","AI categorization","Shared expenses","Bill reminders","Smart budgets","Visual analytics","Multi-currency","SOC 2 certified"].map(item => (
//                 <span key={item} className="flex items-center gap-2.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.28)", letterSpacing: ".04em" }}>
//                   <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#10b981" }} />
//                   {item}
//                 </span>
//               ))}
//             </span>
//           ))}
//         </div>
//       </div>
 
//       {/* ═══════════════════════════════════
//           STATS
//       ═══════════════════════════════════ */}
//       <section className="py-16 px-6 relative" style={{ zIndex: 10 }}>
//         <Section>
//           <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
//             {[
//               { to: 2400000, pre: "",  suf: "+",  label: "Active users",    color: "#10b981" },
//               { to: 840,     pre: "$", suf: "M+", label: "Tracked monthly", color: "#fbbf24" },
//               { to: 99,      pre: "",  suf: ".9%",label: "Uptime SLA",      color: "#a78bfa" },
//               { to: 150,     pre: "",  suf: "+",  label: "Countries",       color: "#38bdf8" },
//             ].map(s => (
//               <div key={s.label}>
//                 <p className="display font-900 text-3xl md:text-4xl mb-1" style={{ color: s.color }}>
//                   <Counter to={s.to} prefix={s.pre} suffix={s.suf} />
//                 </p>
//                 <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
//               </div>
//             ))}
//           </div>
//         </Section>
//       </section>
 
//       <div className="divider max-w-5xl mx-auto" />
 
//       {/* ═══════════════════════════════════
//           FEATURES
//       ═══════════════════════════════════ */}
//       <section className="py-24 px-6 relative dot-grid" style={{ zIndex: 10 }}>
//         <div className="max-w-6xl mx-auto">
//           <Section>
//             <div className="text-center mb-16">
//               <Badge color="amber" className="mb-4">Core features</Badge>
//               <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4 mb-4" style={{ letterSpacing: "-.02em" }}>
//                 Everything you need to<br />
//                 <span style={{ color: "#10b981" }}>spend smarter</span>
//               </h2>
//               <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
//                 From automatic syncing to AI-powered insights, Spendly handles the complexity so you don't have to.
//               </p>
//             </div>
//           </Section>
 
//           <div className="grid md:grid-cols-2 gap-6">
//             {/* Feature list */}
//             <div className="flex flex-col gap-3">
//               {FEATURES.map((f, i) => (
//                 <Section key={f.title} delay={i * 0.05}>
//                   <div
//                     onClick={() => setActiveFeature(i)}
//                     className={`feature-item p-5 rounded-2xl border ${activeFeature === i ? "is-active" : ""}`}
//                     style={{ background: "rgba(13,17,28,0.65)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
//                   >
//                     <div className="flex items-start gap-4">
//                       <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${f.accent}14` }}>{f.emoji}</div>
//                       <div className="flex-1">
//                         <h3 className="display font-700 text-white text-base mb-1">{f.title}</h3>
//                         <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{f.desc}</p>
//                       </div>
//                       <div className={`w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0 transition-all duration-300`} style={{ background: activeFeature === i ? f.accent : "rgba(255,255,255,0.1)", boxShadow: activeFeature === i ? `0 0 8px ${f.accent}` : "none" }} />
//                     </div>
//                   </div>
//                 </Section>
//               ))}
//             </div>
 
//             {/* Detail panel */}
//             <div className="sticky top-24 h-fit">
//               <Section>
//                 <GlassCard accent={FEATURES[activeFeature].accent} glow className="p-8 overflow-hidden">
//                   <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${FEATURES[activeFeature].accent},transparent)`, boxShadow: `0 0 12px ${FEATURES[activeFeature].accent}66` }} />
//                   <div className="text-5xl mb-5">{FEATURES[activeFeature].emoji}</div>
//                   <Badge color={activeFeature % 2 === 0 ? "emerald" : activeFeature % 3 === 1 ? "amber" : "violet"}>
//                     Feature {String(activeFeature + 1).padStart(2,"0")} of {FEATURES.length}
//                   </Badge>
//                   <h3 className="display font-800 text-2xl text-white mt-4 mb-3">{FEATURES[activeFeature].title}</h3>
//                   <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.75 }}>{FEATURES[activeFeature].desc}</p>
//                   <div className="space-y-4">
//                     {[["Precision", 96], ["Speed", 94], ["Reliability", 99]].map(([lbl, pct]) => (
//                       <div key={lbl}>
//                         <div className="flex justify-between text-xs mb-1.5">
//                           <span style={{ color: "rgba(255,255,255,0.38)" }}>{lbl}</span>
//                           <span className="font-semibold" style={{ color: FEATURES[activeFeature].accent }}>{pct}%</span>
//                         </div>
//                         <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
//                           <div className="h-full rounded-full progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${FEATURES[activeFeature].accent}66, ${FEATURES[activeFeature].accent})`, transition: "width .6s ease", boxShadow: `0 0 6px ${FEATURES[activeFeature].accent}55` }} />
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                   <div className="mt-7 flex items-center gap-2 text-sm font-semibold" style={{ color: FEATURES[activeFeature].accent }}>
//                     Learn more
//                     <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
//                       <path fillRule="evenodd" d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z" clipRule="evenodd" />
//                     </svg>
//                   </div>
//                 </GlassCard>
//               </Section>
//             </div>
//           </div>
//         </div>
//       </section>
 
//       {/* ═══════════════════════════════════
//           HOW IT WORKS
//       ═══════════════════════════════════ */}
//       <section className="py-24 px-6 relative" style={{ zIndex: 10, background: "rgba(0,0,0,0.2)" }}>
//         <div className="max-w-4xl mx-auto">
//           <Section>
//             <div className="text-center mb-16">
//               <Badge color="slate">How it works</Badge>
//               <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4" style={{ letterSpacing: "-.02em" }}>
//                 Up and running in<br /><span style={{ color: "#fbbf24" }}>under 2 minutes</span>
//               </h2>
//             </div>
//           </Section>
 
//           <div className="relative">
//             {/* Connector line */}
//             <div className="absolute left-7 top-10 bottom-10 w-px hidden md:block" style={{ background: "linear-gradient(180deg,rgba(16,185,129,0.35),rgba(251,191,36,0.25),rgba(167,139,250,0.25))" }} />
 
//             <div className="space-y-6">
//               {[
//                 { n: "01", title: "Connect your bank",   desc: "Link any bank, card, or account in 30 seconds using encrypted read-only OAuth. We never store credentials.", color: "#10b981" },
//                 { n: "02", title: "AI does the heavy lifting", desc: "Our model scans your transaction history, auto-categorizes everything, and builds your personal spending profile.", color: "#fbbf24" },
//                 { n: "03", title: "Gain full financial clarity", desc: "Set budgets, receive smart alerts, and get actionable weekly insights delivered straight to your dashboard.", color: "#a78bfa" },
//               ].map((s, i) => (
//                 <Section key={s.n} delay={i * 0.1}>
//                   <div className="flex gap-6 items-start">
//                     <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center z-10" style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, boxShadow: `0 0 20px ${s.color}18` }}>
//                       <span className="display font-900 text-lg" style={{ color: s.color }}>{s.n}</span>
//                     </div>
//                     <GlassCard hover accent={s.color} className="flex-1 p-6 card-lift">
//                       <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl" style={{ background: `linear-gradient(90deg,transparent,${s.color}44,transparent)` }} />
//                       <h3 className="display font-700 text-white text-lg mb-2">{s.title}</h3>
//                       <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.75 }}>{s.desc}</p>
//                       <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold" style={{ color: s.color }}>
//                         Learn more <span>→</span>
//                       </div>
//                     </GlassCard>
//                   </div>
//                 </Section>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>
 
//       {/* ═══════════════════════════════════
//           PRICING
//       ═══════════════════════════════════ */}
//       <section className="py-24 px-6 relative dot-grid" style={{ zIndex: 10 }}>
//         <div className="max-w-5xl mx-auto">
//           <Section>
//             <div className="text-center mb-12">
//               <Badge color="violet">Pricing</Badge>
//               <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4 mb-6" style={{ letterSpacing: "-.02em" }}>
//                 Simple, honest pricing
//               </h2>
 
//               {/* Billing toggle */}
//               <div className="inline-flex rounded-xl p-1 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
//                 {["monthly", "annually"].map(b => (
//                   <button key={b} onClick={() => setBilling(b)}
//                     className="px-5 py-2 rounded-lg text-sm capitalize transition-all"
//                     style={{
//                       background: billing === b ? "rgba(16,185,129,0.12)" : "transparent",
//                       color: billing === b ? "#6ee7b7" : "rgba(255,255,255,0.38)",
//                       fontFamily: "var(--font-display)",
//                       fontWeight: billing === b ? 600 : 400,
//                     }}>
//                     {b === "annually" ? "Annually — save 20%" : "Monthly"}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </Section>
 
//           <div className="grid md:grid-cols-3 gap-5">
//             {PLANS.map((p, i) => (
//               <Section key={p.name} delay={i * 0.08}>
//                 <div className={`relative rounded-2xl overflow-hidden card-lift h-full flex flex-col`}
//                   style={{ background: "rgba(13,17,28,0.72)", border: `1px solid ${p.hot ? p.accent+"33" : "rgba(255,255,255,0.07)"}`, backdropFilter: "blur(16px)", boxShadow: p.hot ? `0 0 50px ${p.accent}0f, 0 4px 30px rgba(0,0,0,.4)` : "0 4px 24px rgba(0,0,0,0.3)" }}>
 
//                   {p.hot && (
//                     <div className="flex justify-center">
//                       <span className="display text-xs font-700 px-4 py-1 rounded-b-xl" style={{ background: p.accent, color: "#07070f", letterSpacing: ".03em" }}>
//                         Most popular
//                       </span>
//                     </div>
//                   )}
 
//                   {/* Accent top line */}
//                   <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${p.accent}66,transparent)` }} />
 
//                   <div className="p-7 flex flex-col flex-1" style={{ paddingTop: p.hot ? "1.25rem" : "1.75rem" }}>
//                     <div className="mb-1">
//                       <p className="display font-700 text-sm mb-1" style={{ color: p.accent }}>{p.name}</p>
//                       <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.32)" }}>{p.desc}</p>
//                     </div>
 
//                     <div className="flex items-baseline gap-1 mb-6">
//                       <span className="display font-900 text-4xl text-white">${billing === "annually" ? p.annualPrice : p.price}</span>
//                       {(billing === "annually" ? p.annualPrice : p.price) > 0
//                         ? <span className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>/month</span>
//                         : <span className="text-sm" style={{ color: p.accent }}>free forever</span>
//                       }
//                     </div>
 
//                     <ul className="space-y-3 mb-7 flex-1">
//                       {p.features.map(f => (
//                         <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.52)" }}>
//                           <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
//                             <circle cx="8" cy="8" r="7" stroke={p.accent} strokeWidth="1" strokeOpacity=".35" />
//                             <path d="M5.5 8l1.8 1.8L10.5 6" stroke={p.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
//                           </svg>
//                           {f}
//                         </li>
//                       ))}
//                     </ul>
 
//                     <button
//                       className={`w-full py-3 rounded-xl text-sm transition-all mt-auto ${p.hot ? "plan-cta-primary" : "plan-cta-ghost border"}`}
//                       style={p.hot ? {} : { borderColor: `${p.accent}33`, color: p.accent }}
//                     >
//                       {p.price === 0 ? "Get started free" : p.hot ? "Start 14-day free trial" : "Contact us"}
//                     </button>
//                   </div>
//                 </div>
//               </Section>
//             ))}
//           </div>
 
//           <Section delay={0.2}>
//             <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
//               All plans include a 14-day free trial. No credit card required. Cancel anytime.
//             </p>
//           </Section>
//         </div>
//       </section>
 
//       {/* ═══════════════════════════════════
//           TESTIMONIALS
//       ═══════════════════════════════════ */}
//       <section className="py-24 px-6 relative" style={{ zIndex: 10, background: "rgba(0,0,0,0.18)" }}>
//         <div className="max-w-5xl mx-auto">
//           <Section>
//             <div className="text-center mb-16">
//               <Badge color="emerald">Customer stories</Badge>
//               <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4" style={{ letterSpacing: "-.02em" }}>
//                 Loved by people who<br />
//                 <span style={{ color: "#10b981" }}>take their finances seriously</span>
//               </h2>
//             </div>
//           </Section>
 
//           <div className="grid md:grid-cols-3 gap-5">
//             {TESTIMONIALS.map((t, i) => (
//               <Section key={t.name} delay={i * 0.08}>
//                 <GlassCard accent={t.tc} hover className="p-6 h-full card-lift">
//                   <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl" style={{ background: `linear-gradient(90deg,transparent,${t.tc}44,transparent)` }} />
//                   <div className="flex gap-0.5 mb-4">
//                     {[...Array(5)].map((_,i) => <span key={i} className="text-sm" style={{ color: "#fbbf24" }}>★</span>)}
//                   </div>
//                   <p className="text-sm leading-[1.8] mb-6" style={{ color: "rgba(255,255,255,0.52)" }}>"{t.q}"</p>
//                   <div className="flex items-center gap-3 mt-auto">
//                     <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-700 display flex-shrink-0" style={{ background: `${t.tc}14`, color: t.tc, border: `1px solid ${t.tc}25` }}>{t.init}</div>
//                     <div>
//                       <p className="text-sm font-600 text-white" style={{ fontFamily: "var(--font-display)" }}>{t.name}</p>
//                       <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{t.role}</p>
//                     </div>
//                   </div>
//                 </GlassCard>
//               </Section>
//             ))}
//           </div>
//         </div>
//       </section>
 
//       {/* ═══════════════════════════════════
//           CTA
//       ═══════════════════════════════════ */}
//       <section className="py-24 px-6 relative" style={{ zIndex: 10 }}>
//         <div className="max-w-3xl mx-auto">
//           <Section>
//             <GlassCard accent="#10b981" hover={false} glow className="p-12 md:p-16 text-center overflow-hidden relative">
//               {/* Background glow */}
//               <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 70%)" }} />
 
//               {/* Animated top beam */}
//               <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#10b981 40%,#6ee7b7 60%,transparent)", boxShadow: "0 0 18px #10b98177" }} />
//               <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent)" }} />
 
//               <div className="relative z-10">
//                 <Badge color="emerald" className="mb-5">
//                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
//                   Ready to start?
//                 </Badge>
 
//                 <h2 className="display font-900 text-4xl md:text-5xl tracking-tight mb-4 mt-2" style={{ letterSpacing: "-.025em" }}>
//                   Take control of your<br />
//                   <span style={{ color: "#10b981" }}>financial future</span>
//                 </h2>
 
//                 <p className="text-base max-w-md mx-auto leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.75 }}>
//                   Connect your bank and Spendly builds a clear, real-time picture of your finances. Free to start, takes 2 minutes, no credit card ever needed.
//                 </p>
 
//                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                   <button className="btn-primary text-base px-10 py-3.5 rounded-xl">Create free account</button>
//                   <button className="btn-ghost text-base px-8 py-3.5 rounded-xl">Explore all features</button>
//                 </div>
 
//                 <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)", letterSpacing: ".03em" }}>
//                   No credit card · Cancel anytime · SOC 2 Type II · GDPR compliant
//                 </p>
//               </div>
//             </GlassCard>
//           </Section>
//         </div>
//       </section>
 
//       {/* ═══════════════════════════════════
//           FOOTER
//       ═══════════════════════════════════ */}
//       <footer className="py-14 px-6 relative" style={{ zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
//         <div className="max-w-5xl mx-auto">
//           <div className="flex flex-col md:flex-row gap-12 justify-between mb-10">
//             {/* Brand */}
//             <div className="max-w-xs">
//               <div className="flex items-center gap-2.5 mb-4">
//                 <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
//                   <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <span className="display font-800 text-white text-lg tracking-tight">spendly</span>
//               </div>
//               <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
//                 Intelligent expense tracking for people who want clarity over complexity.
//               </p>
//               <div className="flex gap-3 mt-5">
//                 {["𝕏", "in", "gh"].map(s => (
//                   <a key={s} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
//                     {s}
//                   </a>
//                 ))}
//               </div>
//             </div>
 
//             {/* Links */}
//             <div className="grid grid-cols-3 gap-10">
//               {[
//                 { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
//                 { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
//                 { title: "Legal",   links: ["Privacy", "Terms", "Security", "GDPR"] },
//               ].map(col => (
//                 <div key={col.title}>
//                   <p className="display font-700 text-xs uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: ".06em" }}>{col.title}</p>
//                   <ul className="space-y-2.5">
//                     {col.links.map(l => (
//                       <li key={l}>
//                         <a href="#" className="text-sm hover:text-white/65 transition-colors" style={{ color: "rgba(255,255,255,0.28)" }}>{l}</a>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               ))}
//             </div>
//           </div>
 
//           <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
//             <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>© 2026 Spendly, Inc. All rights reserved.</p>
//             <div className="flex items-center gap-2">
//               <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #10b981" }} />
//               <span className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>All systems operational</span>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
 
