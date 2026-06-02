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