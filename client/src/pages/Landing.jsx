import { useEffect, useRef, useState, useCallback } from "react";
 
/* ─────────────────────────────────────────────
   PARTICLE CANVAS  — subtle financial data feel
───────────────────────────────────────────── */
function ParticleField() {
  const cvs = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef(null);
 
  useEffect(() => {
    const canvas = cvs.current;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
 
    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
 
    // Ambient gradient orbs
    const orbs = [
      { x: W * 0.15, y: H * 0.25, r: 340, h: 158, a: 0.055 },
      { x: W * 0.85, y: H * 0.65, r: 280, h: 142, a: 0.04  },
      { x: W * 0.5,  y: H * 0.9,  r: 220, h: 170, a: 0.035 },
    ];
 
    // Floating dots
    const N = 90;
    const dots = Array.from({ length: N }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22,
      r: Math.random() * 1.4 + .3,
      a: Math.random() * .28 + .06,
      c: Math.random() > .55 ? "#10b981" : Math.random() > .5 ? "#6ee7b7" : "#94a3b8",
    }));
 
    // Horizontal beam streaks
    const beams = Array.from({ length: 5 }, (_, i) => ({
      y: (H / 6) * (i + 1) + (Math.random() - .5) * 60,
      x: -300, speed: .4 + Math.random() * .35,
      len: 100 + Math.random() * 180,
      a: .025 + Math.random() * .025,
      c: i % 2 === 0 ? "#10b981" : "#6ee7b7",
    }));
 
    let t = 0;
    const frame = () => {
      t += .005;
      ctx.clearRect(0, 0, W, H);
 
      // Orbs
      orbs.forEach(o => {
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.h},80%,60%,${o.a})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
      });
 
      // Beam streaks
      beams.forEach(b => {
        b.x += b.speed;
        if (b.x > W + b.len) b.x = -b.len;
        const pulse = .55 + .45 * Math.sin(t * 1.8 + b.y);
        const g = ctx.createLinearGradient(b.x, 0, b.x + b.len, 0);
        g.addColorStop(0, "transparent");
        g.addColorStop(.5, b.c + Math.floor(b.a * pulse * 255).toString(16).padStart(2,"0"));
        g.addColorStop(1, "transparent");
        ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.len, b.y); ctx.stroke();
        ctx.restore();
      });
 
      // Dot connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 85) {
            ctx.save(); ctx.globalAlpha = (1 - d/85) * .065;
            ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = .4;
            ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y); ctx.stroke();
            ctx.restore();
          }
        }
      }
 
      // Dots
      dots.forEach(p => {
        const dx = mouse.current.x - p.x, dy = mouse.current.y - p.y;
        const d2 = Math.sqrt(dx*dx + dy*dy);
        if (d2 < 110) { p.vx -= (dx/d2) * .035; p.vy -= (dy/d2) * .035; }
        p.vx *= .99; p.vy *= .99;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.save();
        ctx.globalAlpha = d2 < 90 ? Math.min(p.a * 2.8, .85) : p.a;
        if (d2 < 90) { ctx.shadowColor = p.c; ctx.shadowBlur = 6; }
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, d2 < 90 ? p.r * 2.2 : p.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
 
      raf.current = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
 
  return <canvas ref={cvs} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}
 
/* ─────────────────────────────────────────────
   SCROLL REVEAL HOOK
───────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}
 
/* ─────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────── */
function Counter({ to, prefix = "", suffix = "" }) {
  const [v, setV] = useState(0);
  const [ref, vis] = useReveal(0.4);
  const done = useRef(false);
  useEffect(() => {
    if (!vis || done.current) return;
    done.current = true;
    let cur = 0;
    const id = setInterval(() => {
      cur += to / 55;
      if (cur >= to) { setV(to); clearInterval(id); }
      else setV(Math.floor(cur));
    }, 18);
    return () => clearInterval(id);
  }, [vis, to]);
  const fmt = v >= 1_000_000 ? (v/1_000_000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(0)+"K" : v;
  return <span ref={ref}>{prefix}{fmt}{suffix}</span>;
}
 
/* ─────────────────────────────────────────────
   TYPEWRITER
───────────────────────────────────────────── */
function Typewriter({ words, className = "" }) {
  const [wi, setWi] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const w = words[wi];
    const id = setTimeout(() => {
      if (!del && txt.length < w.length) setTxt(w.slice(0, txt.length + 1));
      else if (!del && txt.length === w.length) setDel(true);
      else if (del && txt.length > 0) setTxt(txt.slice(0, -1));
      else { setDel(false); setWi((i) => (i + 1) % words.length); }
    }, del ? 42 : txt.length === words[wi].length ? 1800 : 78);
    return () => clearTimeout(id);
  }, [txt, del, wi, words]);
  return (
    <span className={className}>
      {txt}
      <span className="inline-block w-0.5 h-[0.9em] bg-emerald-400 ml-0.5 align-middle" style={{ animation: "blink .75s step-end infinite", boxShadow: "0 0 8px #10b981" }} />
    </span>
  );
}
 
/* ─────────────────────────────────────────────
   GLASS CARD
───────────────────────────────────────────── */
function GlassCard({ children, className = "", accent = "#10b981", hover = true, glow = false }) {
  const r = useRef(null);
  const onMove = useCallback((e) => {
    if (!hover) return;
    const rect = r.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - .5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - .5) * -14;
    r.current.style.transform = `perspective(900px) rotateY(${x}deg) rotateX(${y}deg) translateY(-2px)`;
    r.current.style.setProperty("--cx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    r.current.style.setProperty("--cy", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }, [hover]);
  const onLeave = useCallback(() => {
    if (!r.current) return;
    r.current.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) translateY(0)";
  }, []);
  return (
    <div
      ref={r}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: "rgba(13,16,28,0.72)",
        border: `1px solid rgba(255,255,255,0.07)`,
        backdropFilter: "blur(16px)",
        transition: "transform .2s ease, box-shadow .25s ease",
        "--cx": "50%", "--cy": "50%",
        boxShadow: glow
          ? `0 0 0 1px ${accent}22, 0 8px 40px rgba(0,0,0,.5), 0 0 60px ${accent}0f`
          : "0 4px 30px rgba(0,0,0,.35)",
      }}
    >
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(circle at var(--cx) var(--cy), ${accent}12 0%, transparent 55%)` }} />
      {children}
    </div>
  );
}
 
/* ─────────────────────────────────────────────
   BADGE
───────────────────────────────────────────── */
function Badge({ children, color = "emerald" }) {
  const styles = {
    emerald: { bg: "rgba(16,185,129,.1)", border: "rgba(16,185,129,.22)", text: "#6ee7b7" },
    amber:   { bg: "rgba(245,158,11,.09)", border: "rgba(245,158,11,.2)",  text: "#fcd34d" },
    violet:  { bg: "rgba(139,92,246,.09)", border: "rgba(139,92,246,.2)",  text: "#c4b5fd" },
    slate:   { bg: "rgba(148,163,184,.07)", border: "rgba(148,163,184,.15)", text: "#94a3b8" },
  };
  const s = styles[color];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text, letterSpacing: ".03em" }}>
      {children}
    </span>
  );
}
 
/* ─────────────────────────────────────────────
   DASHBOARD MOCKUP
───────────────────────────────────────────── */
const TRANSACTIONS = [
  { icon: "🛒", name: "Whole Foods Market",  cat: "Groceries",      amt: "−$84.20",    pos: false, date: "Today"     },
  { icon: "☕", name: "Blue Bottle Coffee",  cat: "Dining",          amt: "−$6.50",     pos: false, date: "Today"     },
  { icon: "💼", name: "Freelance Invoice",   cat: "Income",          amt: "+$2,400.00", pos: true,  date: "Yesterday" },
  { icon: "🚇", name: "Transit Monthly",     cat: "Transport",       amt: "−$32.00",    pos: false, date: "Jun 28"    },
  { icon: "📺", name: "Netflix",             cat: "Subscriptions",   amt: "−$15.99",    pos: false, date: "Jun 25"    },
];
 
function DashboardMockup() {
  const [tab, setTab] = useState("overview");
  return (
    <GlassCard accent="#10b981" hover={false} glow className="w-full overflow-hidden">
      {/* Top accent */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,#10b981 35%,#6ee7b7 65%,transparent)", boxShadow: "0 0 16px #10b98155" }} />
 
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(239,68,68,.55)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(234,179,8,.55)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(34,197,94,.55)" }} />
        </div>
        <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-center" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.22)" }}>
          app.spendly.io/dashboard
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #10b981" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Live</span>
        </div>
      </div>
 
      {/* Tabs */}
      <div className="flex gap-1 px-5 pt-3 pb-0 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        {["overview", "transactions", "insights"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-3.5 pb-2.5 pt-1 text-xs capitalize font-medium border-b-2 transition-all -mb-px"
            style={{ borderColor: tab === t ? "#10b981" : "transparent", color: tab === t ? "#6ee7b7" : "rgba(255,255,255,0.3)" }}>
            {t}
          </button>
        ))}
      </div>
 
      <div className="p-5">
        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Spent this month", val: "$3,240", delta: "↑ 4.2%", bad: true },
                { label: "Net income",        val: "$6,800", delta: "↑ 12%",  bad: false },
                { label: "Saved",             val: "$1,560", delta: "↑ 8.1%", bad: false },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</p>
                  <p className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)", letterSpacing: "-.01em" }}>{m.val}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: m.bad ? "#f87171" : "#4ade80" }}>{m.delta}</p>
                </div>
              ))}
            </div>
            {/* Sparkline */}
            <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,.03)", border: "1px solid rgba(16,185,129,.08)" }}>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Spending — last 6 months</p>
                <span className="text-xs font-semibold" style={{ color: "#6ee7b7" }}>−8% vs avg</span>
              </div>
              <div className="flex items-end gap-2" style={{ height: 56 }}>
                {[38, 62, 47, 71, 55, 82].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all duration-500"
                    style={{ height: `${h}%`, background: i === 5 ? "linear-gradient(180deg,#10b981,#059669)" : "rgba(255,255,255,0.07)", boxShadow: i === 5 ? "0 0 10px #10b98155" : "none" }} />
                ))}
              </div>
              <div className="flex justify-between mt-2" style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
                {["Jan","Feb","Mar","Apr","May","Jun"].map(m => <span key={m}>{m}</span>)}
              </div>
            </div>
            {/* Category bar */}
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Top categories</p>
              <div className="space-y-2.5">
                {[
                  { l: "Housing", pct: 38, c: "#10b981" },
                  { l: "Food & Dining", pct: 24, c: "#6ee7b7" },
                  { l: "Transport", pct: 16, c: "#fbbf24" },
                  { l: "Shopping", pct: 12, c: "#a78bfa" },
                ].map(c => (
                  <div key={c.l} className="flex items-center gap-3">
                    <span className="text-xs w-24 flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{c.l}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.c, boxShadow: `0 0 6px ${c.c}55`, transition: "width .8s ease" }} />
                    </div>
                    <span className="text-xs w-8 text-right" style={{ color: "rgba(255,255,255,0.3)" }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
 
        {/* TRANSACTIONS TAB */}
        {tab === "transactions" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>Recent transactions</p>
              <span className="text-xs" style={{ color: "#6ee7b7" }}>View all →</span>
            </div>
            {TRANSACTIONS.map((t, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{t.cat} · {t.date}</p>
                </div>
                <span className="text-sm font-semibold flex-shrink-0" style={{ color: t.pos ? "#4ade80" : "#f87171" }}>{t.amt}</span>
              </div>
            ))}
          </div>
        )}
 
        {/* INSIGHTS TAB */}
        {tab === "insights" && (
          <div className="space-y-3">
            <p className="text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>AI-powered recommendations</p>
            {[
              { icon: "💡", t: "Reduce dining spend", d: "You're 23% over your dining budget. Cooking at home 3× a week saves ~$120.", c: "#10b981" },
              { icon: "📈", t: "Savings rate up 5%",   d: "Your savings rate reached 23% this month — your best in 6 months.", c: "#fbbf24" },
              { icon: "🔔", t: "3 bills due soon",     d: "Netflix, Spotify, and electricity total $78 due within 5 days.", c: "#a78bfa" },
              { icon: "✅", t: "Under budget overall", d: "You're tracking $340 under your overall monthly budget. Great work.", c: "#4ade80" },
            ].map(ins => (
              <div key={ins.t} className="flex gap-3 p-4 rounded-xl" style={{ background: `${ins.c}08`, border: `1px solid ${ins.c}1a` }}>
                <span className="text-lg leading-none mt-0.5">{ins.icon}</span>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.8)" }}>{ins.t}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{ins.d}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
 
/* ─────────────────────────────────────────────
   SECTION WRAPPER (scroll reveal)
───────────────────────────────────────────── */
function Section({ children, className = "", delay = 0 }) {
  const [ref, vis] = useReveal(0.1);
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(28px)",
      transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}
 
/* ─────────────────────────────────────────────
   FEATURE DATA
───────────────────────────────────────────── */
const FEATURES = [
  { emoji: "🏦", title: "Instant Bank Sync",    desc: "Connect any bank or card in 30 seconds. Every transaction pulled in automatically with read-only, bank-grade OAuth.", accent: "#10b981" },
  { emoji: "🤖", title: "AI Categorization",     desc: "Our model categorizes every transaction with 97% accuracy. It learns your habits and gets smarter over time.", accent: "#fbbf24" },
  { emoji: "📊", title: "Visual Analytics",      desc: "Beautiful interactive charts that reveal trends, patterns, and opportunities hidden in your spending data.", accent: "#a78bfa" },
  { emoji: "🔔", title: "Smart Alerts",          desc: "Unusual charge detection, bill reminders, and budget warnings — delivered the moment they matter.", accent: "#38bdf8" },
  { emoji: "👥", title: "Shared Wallets",        desc: "Split expenses with roommates, partners, or teams. Real-time sync keeps everyone aligned automatically.", accent: "#fbbf24" },
  { emoji: "🔐", title: "Zero-Trust Security",   desc: "256-bit AES encryption, biometric auth, and SOC 2 Type II compliance. Your data is never sold or shared.", accent: "#4ade80" },
];
 
const TESTIMONIALS = [
  { name: "Priya Nair",     role: "Product Designer",      init: "PN", tc: "#10b981", q: "After 6 apps I finally found one I actually use. The AI predictions are genuinely uncanny — it flagged a duplicate subscription I'd forgotten about." },
  { name: "Marcus Osei",    role: "Senior Engineer",        init: "MO", tc: "#fbbf24", q: "The dashboard is clean and fast. I check it every morning like I check my email. It changed how I make decisions entirely." },
  { name: "Aisha Brennan",  role: "Small Business Owner",   init: "AB", tc: "#a78bfa", q: "Shared wallets made team expense tracking effortless. We cut overspending by 30% in our first month. Nothing else comes close." },
];
 
const PLANS = [
  { name: "Free",    price: 0,  annualPrice: 0,  desc: "For individuals starting out", accent: "#10b981",
    features: ["50 transactions / month","Basic categorization","Spending charts","iOS & Android app"] },
  { name: "Pro",     price: 9,  annualPrice: 7,  desc: "For serious personal finance",  accent: "#fbbf24", hot: true,
    features: ["Unlimited transactions","AI auto-categorization","Advanced analytics","Shared wallets (up to 5)","CSV & PDF exports","Priority support"] },
  { name: "Business",price: 22, annualPrice: 17, desc: "For teams and growing businesses", accent: "#a78bfa",
    features: ["Everything in Pro","Unlimited wallets","Team roles & permissions","Accounting integrations","Custom categories","Dedicated account manager"] },
];
 
/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState("monthly");
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);
 
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
 
  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#070c14", fontFamily: "var(--font-body)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        :root {
          --font-display: 'Cabinet Grotesk', sans-serif;
          --font-body:    'Instrument Sans', sans-serif;
          --emerald:      #10b981;
          --emerald-light: #6ee7b7;
          --emerald-dim:   #059669;
          --amber:         #fbbf24;
          --violet:        #a78bfa;
          --bg:            #070c14;
          --surface:       #0d1120;
          --border:        rgba(255,255,255,0.07);
        }
        * { font-family: var(--font-body); box-sizing: border-box; }
        h1,h2,h3,.display { font-family: var(--font-display); }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatA  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
        @keyframes floatB  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer { from{background-position:200% center} to{background-position:-200% center} }
        @keyframes ticker  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.4)} 50%{box-shadow:0 0 0 10px rgba(16,185,129,0)} }
 
        .float-a { animation: floatA 5.5s ease-in-out infinite; }
        .float-b { animation: floatB 7s ease-in-out infinite; animation-delay: -2.5s; }
        .float-c { animation: floatA 6.5s ease-in-out infinite; animation-delay: -4s; }
 
        .shimmer-green {
          background: linear-gradient(90deg, #e2fef5 0%, #6ee7b7 25%, #10b981 50%, #6ee7b7 75%, #e2fef5 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer 4.5s linear infinite;
        }
 
        .dot-grid {
          background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px);
          background-size: 30px 30px;
        }
 
        .ticker-inner { display:inline-flex; gap:56px; animation: ticker 25s linear infinite; white-space:nowrap; }
 
        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff; font-weight: 600; border: none;
          font-family: var(--font-display);
          transition: all .25s ease;
          position: relative; overflow: hidden;
        }
        .btn-primary::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.12) 100%);
          opacity:0; transition: opacity .25s;
        }
        .btn-primary:hover::after { opacity:1; }
        .btn-primary:hover { transform:translateY(-1px); box-shadow:0 10px 28px rgba(16,185,129,0.35); }
 
        .btn-ghost {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
          font-family: var(--font-display);
          transition: all .22s ease;
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color:#fff; transform:translateY(-1px); }
 
        .nav-link { color:rgba(255,255,255,.42); font-size:14px; transition:color .18s; text-decoration:none; }
        .nav-link:hover { color:rgba(255,255,255,.85); }
 
        .feature-item { transition: all .22s ease; cursor:pointer; }
        .feature-item:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.1) !important; }
        .feature-item.is-active { background: rgba(16,185,129,0.05) !important; border-color: rgba(16,185,129,0.22) !important; }
 
        .card-lift { transition: transform .25s ease, box-shadow .25s ease; }
        .card-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 50px rgba(0,0,0,0.5) !important; }
 
        .plan-cta-primary { background:linear-gradient(135deg,var(--amber),#d97706); color:#07070f; font-weight:700; font-family:var(--font-display); transition:all .22s; }
        .plan-cta-primary:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(251,191,36,0.35); }
        .plan-cta-ghost { background:transparent; font-family:var(--font-display); font-weight:600; transition:all .22s; }
 
        .divider { height:1px; background:linear-gradient(90deg,transparent,rgba(16,185,129,0.25),rgba(251,191,36,0.2),transparent); }
 
        .progress-fill { position:relative; overflow:hidden; }
        .progress-fill::after { content:''; position:absolute; top:0; left:-60%; width:40%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent); animation:shimmer 2.2s ease-in-out infinite; }
 
        .pulse-dot { animation: pulseGlow 2.2s ease-in-out infinite; }
      `}</style>
 
      <ParticleField />
 
      {/* ── DOT GRID BACKGROUND ── */}
      <div className="fixed inset-0 dot-grid pointer-events-none" style={{ zIndex: 1, opacity: .5 }} />
 
      {/* ── NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300" style={{
        background: scrolled ? "rgba(7,12,20,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
      }}>
        <div className="max-w-8xl mx-auto px-6 flex items-center justify-between" style={{ height: 74 }}>
          {/* Logo */}
          <a href="#" className="flex items-center gap-5 no-underline">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center pulse-dot" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              <svg viewBox="0 0 20 20" fill="white" className="w-8 h-8">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="display font-800 font-bold text-shadow-emerald-800 text-3xl tracking-tight">Spendly</span>
          </a>
 
          {/* Desktop links */}
          <nav className="hidden md:flex items-center p-3  justify-center gap-18">
            {["Features","About", "Pricing", "Blog", "Company"].map(l => <a key={l} href="#" className="nav-link">{l}</a>)}
          </nav>
 
          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <button className="btn-ghost text-lg px-4 py-2 rounded-lg">Sign in</button>
            <button className="btn-primary text-xl px-5 py-2.5 rounded-xl">Get started free</button>
          </div>
 
          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(o => !o)} className="md:hidden text-white/50 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
 
        {/* Mobile menu */}
        <div className="md:hidden overflow-hidden transition-all duration-300" style={{ maxHeight: menuOpen ? 300 : 0 }}>
          <div className="px-6 py-5 flex flex-col gap-4 border-t" style={{ background: "rgba(7,12,20,0.97)", borderColor: "rgba(255,255,255,0.06)" }}>
            {["Features","Pricing","Blog","Company"].map(l => <a key={l} href="#" className="nav-link text-sm">{l}</a>)}
            <button className="btn-primary text-sm px-5 py-2.5 rounded-xl w-fit mt-1">Get started free</button>
          </div>
        </div>
      </header>
 
      {/* ═══════════════════════════════════
          HERO
      ═══════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden" style={{ zIndex: 10 }}>
        {/* Radial spotlight */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(16,185,129,0.07) 0%, transparent 70%)" }} />
 
        {/* Floating stat cards */}
        <div className="absolute left-8 lg:left-20 top-1/3 hidden xl:block float-a">
          <GlassCard hover={false} className="px-4 py-3" accent="#10b981">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(16,185,129,0.12)" }}>💰</div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Saved this month</p>
                <p className="display font-700 text-emerald-400 text-sm">+$420.00</p>
              </div>
            </div>
          </GlassCard>
        </div>
 
        <div className="absolute right-8 lg:right-20 top-[28%] hidden xl:block float-b">
          <GlassCard hover={false} className="px-4 py-3" accent="#fbbf24">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(251,191,36,0.12)" }}>📊</div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Budget used</p>
                <p className="display font-700 text-amber-400 text-sm">72% <span className="text-white/25 text-xs font-normal">of $4k</span></p>
              </div>
            </div>
          </GlassCard>
        </div>
 
        <div className="absolute right-10 lg:right-24 bottom-[28%] hidden xl:block float-c">
          <GlassCard hover={false} className="px-4 py-3" accent="#a78bfa">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(167,139,250,0.12)" }}>🔔</div>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Alert</p>
                <p className="display font-700 text-violet-400 text-xs">Bill due in 2 days</p>
              </div>
            </div>
          </GlassCard>
        </div>
 
        {/* Main headline */}
        <div style={{ animation: "fadeUp .7s ease both", animationDelay: ".05s" }}>
          <Badge color="emerald">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" style={{ boxShadow: "0 0 6px #10b981" }} />
            AI-powered expense intelligence
          </Badge>
        </div>
 
        <h1 className="display font-900 leading-[1.04] mt-5 mb-5" style={{ fontSize: "clamp(2.6rem,5.8vw,5rem)", letterSpacing: "-.025em", animation: "fadeUp .7s ease both", animationDelay: ".15s" }}>
          Know exactly where<br />
          your{" "}
          <span className="shimmer-green">
            <Typewriter words={["money goes.", "budget stands.", "savings grow.", "spending trends."]} />
          </span>
        </h1>
 
        <p className="text-lg max-w-xl mx-auto leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)", animation: "fadeUp .7s ease both", animationDelay: ".25s" }}>
          Spendly connects to your bank, categorizes every transaction with AI, and gives you the clarity to make smarter financial decisions — automatically.
        </p>
 
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10" style={{ animation: "fadeUp .7s ease both", animationDelay: ".35s" }}>
          <button className="btn-primary text-base px-9 py-3.5 rounded-xl">Start for free — no card needed</button>
          <button className="btn-ghost text-base px-7 py-3.5 rounded-xl flex items-center gap-2.5 justify-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-400">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Watch 90-sec demo
          </button>
        </div>
 
        <p className="text-sm mb-12" style={{ color: "rgba(255,255,255,0.25)", animation: "fadeUp .7s ease both", animationDelay: ".4s" }}>
          Trusted by <strong style={{ color: "rgba(255,255,255,0.5)" }}>180,000+</strong> people in 150+ countries
        </p>
 
        {/* Dashboard preview */}
        <div className="w-full max-w-3xl mx-auto" style={{ animation: "fadeUp .85s ease both", animationDelay: ".5s" }}>
          <DashboardMockup />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none" style={{ background: "linear-gradient(transparent, #070c14)", zIndex: 2 }} />
        </div>
      </section>
 
      {/* ═══════════════════════════════════
          TICKER
      ═══════════════════════════════════ */}
      <div className="relative overflow-hidden py-3.5" style={{ zIndex: 10, background: "rgba(16,185,129,0.04)", borderTop: "1px solid rgba(16,185,129,0.1)", borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
        <div className="ticker-inner">
          {[...Array(2)].map((_, r) => (
            <span key={r} className="flex gap-14">
              {["Real-time bank sync","AI categorization","Shared expenses","Bill reminders","Smart budgets","Visual analytics","Multi-currency","SOC 2 certified"].map(item => (
                <span key={item} className="flex items-center gap-2.5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.28)", letterSpacing: ".04em" }}>
                  <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#10b981" }} />
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
 
      {/* ═══════════════════════════════════
          STATS
      ═══════════════════════════════════ */}
      <section className="py-16 px-6 relative" style={{ zIndex: 10 }}>
        <Section>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { to: 2400000, pre: "",  suf: "+",  label: "Active users",    color: "#10b981" },
              { to: 840,     pre: "$", suf: "M+", label: "Tracked monthly", color: "#fbbf24" },
              { to: 99,      pre: "",  suf: ".9%",label: "Uptime SLA",      color: "#a78bfa" },
              { to: 150,     pre: "",  suf: "+",  label: "Countries",       color: "#38bdf8" },
            ].map(s => (
              <div key={s.label}>
                <p className="display font-900 text-3xl md:text-4xl mb-1" style={{ color: s.color }}>
                  <Counter to={s.to} prefix={s.pre} suffix={s.suf} />
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Section>
      </section>
 
      <div className="divider max-w-5xl mx-auto" />
 
      {/* ═══════════════════════════════════
          FEATURES
      ═══════════════════════════════════ */}
      <section className="py-24 px-6 relative dot-grid" style={{ zIndex: 10 }}>
        <div className="max-w-6xl mx-auto">
          <Section>
            <div className="text-center mb-16">
              <Badge color="amber" className="mb-4">Core features</Badge>
              <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4 mb-4" style={{ letterSpacing: "-.02em" }}>
                Everything you need to<br />
                <span style={{ color: "#10b981" }}>spend smarter</span>
              </h2>
              <p className="text-base max-w-md mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                From automatic syncing to AI-powered insights, Spendly handles the complexity so you don't have to.
              </p>
            </div>
          </Section>
 
          <div className="grid md:grid-cols-2 gap-6">
            {/* Feature list */}
            <div className="flex flex-col gap-3">
              {FEATURES.map((f, i) => (
                <Section key={f.title} delay={i * 0.05}>
                  <div
                    onClick={() => setActiveFeature(i)}
                    className={`feature-item p-5 rounded-2xl border ${activeFeature === i ? "is-active" : ""}`}
                    style={{ background: "rgba(13,17,28,0.65)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(10px)" }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${f.accent}14` }}>{f.emoji}</div>
                      <div className="flex-1">
                        <h3 className="display font-700 text-white text-base mb-1">{f.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{f.desc}</p>
                      </div>
                      <div className={`w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0 transition-all duration-300`} style={{ background: activeFeature === i ? f.accent : "rgba(255,255,255,0.1)", boxShadow: activeFeature === i ? `0 0 8px ${f.accent}` : "none" }} />
                    </div>
                  </div>
                </Section>
              ))}
            </div>
 
            {/* Detail panel */}
            <div className="sticky top-24 h-fit">
              <Section>
                <GlassCard accent={FEATURES[activeFeature].accent} glow className="p-8 overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${FEATURES[activeFeature].accent},transparent)`, boxShadow: `0 0 12px ${FEATURES[activeFeature].accent}66` }} />
                  <div className="text-5xl mb-5">{FEATURES[activeFeature].emoji}</div>
                  <Badge color={activeFeature % 2 === 0 ? "emerald" : activeFeature % 3 === 1 ? "amber" : "violet"}>
                    Feature {String(activeFeature + 1).padStart(2,"0")} of {FEATURES.length}
                  </Badge>
                  <h3 className="display font-800 text-2xl text-white mt-4 mb-3">{FEATURES[activeFeature].title}</h3>
                  <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.75 }}>{FEATURES[activeFeature].desc}</p>
                  <div className="space-y-4">
                    {[["Precision", 96], ["Speed", 94], ["Reliability", 99]].map(([lbl, pct]) => (
                      <div key={lbl}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span style={{ color: "rgba(255,255,255,0.38)" }}>{lbl}</span>
                          <span className="font-semibold" style={{ color: FEATURES[activeFeature].accent }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${FEATURES[activeFeature].accent}66, ${FEATURES[activeFeature].accent})`, transition: "width .6s ease", boxShadow: `0 0 6px ${FEATURES[activeFeature].accent}55` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 flex items-center gap-2 text-sm font-semibold" style={{ color: FEATURES[activeFeature].accent }}>
                    Learn more
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </GlassCard>
              </Section>
            </div>
          </div>
        </div>
      </section>
 
      {/* ═══════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════ */}
      <section className="py-24 px-6 relative" style={{ zIndex: 10, background: "rgba(0,0,0,0.2)" }}>
        <div className="max-w-4xl mx-auto">
          <Section>
            <div className="text-center mb-16">
              <Badge color="slate">How it works</Badge>
              <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4" style={{ letterSpacing: "-.02em" }}>
                Up and running in<br /><span style={{ color: "#fbbf24" }}>under 2 minutes</span>
              </h2>
            </div>
          </Section>
 
          <div className="relative">
            {/* Connector line */}
            <div className="absolute left-7 top-10 bottom-10 w-px hidden md:block" style={{ background: "linear-gradient(180deg,rgba(16,185,129,0.35),rgba(251,191,36,0.25),rgba(167,139,250,0.25))" }} />
 
            <div className="space-y-6">
              {[
                { n: "01", title: "Connect your bank",   desc: "Link any bank, card, or account in 30 seconds using encrypted read-only OAuth. We never store credentials.", color: "#10b981" },
                { n: "02", title: "AI does the heavy lifting", desc: "Our model scans your transaction history, auto-categorizes everything, and builds your personal spending profile.", color: "#fbbf24" },
                { n: "03", title: "Gain full financial clarity", desc: "Set budgets, receive smart alerts, and get actionable weekly insights delivered straight to your dashboard.", color: "#a78bfa" },
              ].map((s, i) => (
                <Section key={s.n} delay={i * 0.1}>
                  <div className="flex gap-6 items-start">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center z-10" style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, boxShadow: `0 0 20px ${s.color}18` }}>
                      <span className="display font-900 text-lg" style={{ color: s.color }}>{s.n}</span>
                    </div>
                    <GlassCard hover accent={s.color} className="flex-1 p-6 card-lift">
                      <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl" style={{ background: `linear-gradient(90deg,transparent,${s.color}44,transparent)` }} />
                      <h3 className="display font-700 text-white text-lg mb-2">{s.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.75 }}>{s.desc}</p>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold" style={{ color: s.color }}>
                        Learn more <span>→</span>
                      </div>
                    </GlassCard>
                  </div>
                </Section>
              ))}
            </div>
          </div>
        </div>
      </section>
 
      {/* ═══════════════════════════════════
          PRICING
      ═══════════════════════════════════ */}
      <section className="py-24 px-6 relative dot-grid" style={{ zIndex: 10 }}>
        <div className="max-w-5xl mx-auto">
          <Section>
            <div className="text-center mb-12">
              <Badge color="violet">Pricing</Badge>
              <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4 mb-6" style={{ letterSpacing: "-.02em" }}>
                Simple, honest pricing
              </h2>
 
              {/* Billing toggle */}
              <div className="inline-flex rounded-xl p-1 border" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                {["monthly", "annually"].map(b => (
                  <button key={b} onClick={() => setBilling(b)}
                    className="px-5 py-2 rounded-lg text-sm capitalize transition-all"
                    style={{
                      background: billing === b ? "rgba(16,185,129,0.12)" : "transparent",
                      color: billing === b ? "#6ee7b7" : "rgba(255,255,255,0.38)",
                      fontFamily: "var(--font-display)",
                      fontWeight: billing === b ? 600 : 400,
                    }}>
                    {b === "annually" ? "Annually — save 20%" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>
          </Section>
 
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((p, i) => (
              <Section key={p.name} delay={i * 0.08}>
                <div className={`relative rounded-2xl overflow-hidden card-lift h-full flex flex-col`}
                  style={{ background: "rgba(13,17,28,0.72)", border: `1px solid ${p.hot ? p.accent+"33" : "rgba(255,255,255,0.07)"}`, backdropFilter: "blur(16px)", boxShadow: p.hot ? `0 0 50px ${p.accent}0f, 0 4px 30px rgba(0,0,0,.4)` : "0 4px 24px rgba(0,0,0,0.3)" }}>
 
                  {p.hot && (
                    <div className="flex justify-center">
                      <span className="display text-xs font-700 px-4 py-1 rounded-b-xl" style={{ background: p.accent, color: "#07070f", letterSpacing: ".03em" }}>
                        Most popular
                      </span>
                    </div>
                  )}
 
                  {/* Accent top line */}
                  <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${p.accent}66,transparent)` }} />
 
                  <div className="p-7 flex flex-col flex-1" style={{ paddingTop: p.hot ? "1.25rem" : "1.75rem" }}>
                    <div className="mb-1">
                      <p className="display font-700 text-sm mb-1" style={{ color: p.accent }}>{p.name}</p>
                      <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.32)" }}>{p.desc}</p>
                    </div>
 
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="display font-900 text-4xl text-white">${billing === "annually" ? p.annualPrice : p.price}</span>
                      {(billing === "annually" ? p.annualPrice : p.price) > 0
                        ? <span className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>/month</span>
                        : <span className="text-sm" style={{ color: p.accent }}>free forever</span>
                      }
                    </div>
 
                    <ul className="space-y-3 mb-7 flex-1">
                      {p.features.map(f => (
                        <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.52)" }}>
                          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke={p.accent} strokeWidth="1" strokeOpacity=".35" />
                            <path d="M5.5 8l1.8 1.8L10.5 6" stroke={p.accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
 
                    <button
                      className={`w-full py-3 rounded-xl text-sm transition-all mt-auto ${p.hot ? "plan-cta-primary" : "plan-cta-ghost border"}`}
                      style={p.hot ? {} : { borderColor: `${p.accent}33`, color: p.accent }}
                    >
                      {p.price === 0 ? "Get started free" : p.hot ? "Start 14-day free trial" : "Contact us"}
                    </button>
                  </div>
                </div>
              </Section>
            ))}
          </div>
 
          <Section delay={0.2}>
            <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.25)" }}>
              All plans include a 14-day free trial. No credit card required. Cancel anytime.
            </p>
          </Section>
        </div>
      </section>
 
      {/* ═══════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════ */}
      <section className="py-24 px-6 relative" style={{ zIndex: 10, background: "rgba(0,0,0,0.18)" }}>
        <div className="max-w-5xl mx-auto">
          <Section>
            <div className="text-center mb-16">
              <Badge color="emerald">Customer stories</Badge>
              <h2 className="display font-800 text-4xl md:text-5xl tracking-tight mt-4" style={{ letterSpacing: "-.02em" }}>
                Loved by people who<br />
                <span style={{ color: "#10b981" }}>take their finances seriously</span>
              </h2>
            </div>
          </Section>
 
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <Section key={t.name} delay={i * 0.08}>
                <GlassCard accent={t.tc} hover className="p-6 h-full card-lift">
                  <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl" style={{ background: `linear-gradient(90deg,transparent,${t.tc}44,transparent)` }} />
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_,i) => <span key={i} className="text-sm" style={{ color: "#fbbf24" }}>★</span>)}
                  </div>
                  <p className="text-sm leading-[1.8] mb-6" style={{ color: "rgba(255,255,255,0.52)" }}>"{t.q}"</p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-700 display flex-shrink-0" style={{ background: `${t.tc}14`, color: t.tc, border: `1px solid ${t.tc}25` }}>{t.init}</div>
                    <div>
                      <p className="text-sm font-600 text-white" style={{ fontFamily: "var(--font-display)" }}>{t.name}</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{t.role}</p>
                    </div>
                  </div>
                </GlassCard>
              </Section>
            ))}
          </div>
        </div>
      </section>
 
      {/* ═══════════════════════════════════
          CTA
      ═══════════════════════════════════ */}
      <section className="py-24 px-6 relative" style={{ zIndex: 10 }}>
        <div className="max-w-3xl mx-auto">
          <Section>
            <GlassCard accent="#10b981" hover={false} glow className="p-12 md:p-16 text-center overflow-hidden relative">
              {/* Background glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(16,185,129,0.09) 0%, transparent 70%)" }} />
 
              {/* Animated top beam */}
              <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#10b981 40%,#6ee7b7 60%,transparent)", boxShadow: "0 0 18px #10b98177" }} />
              <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent)" }} />
 
              <div className="relative z-10">
                <Badge color="emerald" className="mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Ready to start?
                </Badge>
 
                <h2 className="display font-900 text-4xl md:text-5xl tracking-tight mb-4 mt-2" style={{ letterSpacing: "-.025em" }}>
                  Take control of your<br />
                  <span style={{ color: "#10b981" }}>financial future</span>
                </h2>
 
                <p className="text-base max-w-md mx-auto leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.42)", lineHeight: 1.75 }}>
                  Connect your bank and Spendly builds a clear, real-time picture of your finances. Free to start, takes 2 minutes, no credit card ever needed.
                </p>
 
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button className="btn-primary text-base px-10 py-3.5 rounded-xl">Create free account</button>
                  <button className="btn-ghost text-base px-8 py-3.5 rounded-xl">Explore all features</button>
                </div>
 
                <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.2)", letterSpacing: ".03em" }}>
                  No credit card · Cancel anytime · SOC 2 Type II · GDPR compliant
                </p>
              </div>
            </GlassCard>
          </Section>
        </div>
      </section>
 
      {/* ═══════════════════════════════════
          FOOTER
      ═══════════════════════════════════ */}
      <footer className="py-14 px-6 relative" style={{ zIndex: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 justify-between mb-10">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                  <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.077 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.077-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="display font-800 text-white text-lg tracking-tight">spendly</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
                Intelligent expense tracking for people who want clarity over complexity.
              </p>
              <div className="flex gap-3 mt-5">
                {["𝕏", "in", "gh"].map(s => (
                  <a key={s} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {s}
                  </a>
                ))}
              </div>
            </div>
 
            {/* Links */}
            <div className="grid grid-cols-3 gap-10">
              {[
                { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
                { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
                { title: "Legal",   links: ["Privacy", "Terms", "Security", "GDPR"] },
              ].map(col => (
                <div key={col.title}>
                  <p className="display font-700 text-xs uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.55)", letterSpacing: ".06em" }}>{col.title}</p>
                  <ul className="space-y-2.5">
                    {col.links.map(l => (
                      <li key={l}>
                        <a href="#" className="text-sm hover:text-white/65 transition-colors" style={{ color: "rgba(255,255,255,0.28)" }}>{l}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
 
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>© 2026 Spendly, Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #10b981" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}