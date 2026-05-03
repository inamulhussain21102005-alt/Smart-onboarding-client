import { useState, useEffect, useRef, useCallback } from "react";
import axios from 'axios';

// ─── API ──────────────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});
const api = {
  login: (d) => API.post('/auth/login', d),
  getEmployees: () => API.get('/employees'),
  addEmployee: (d) => API.post('/employees', d),
  deleteEmployee: (id) => API.delete(`/employees/${id}`),
  getTasks: () => API.get('/tasks'),
  addTask: (d) => API.post('/tasks', d),
  updateTask: (id, d) => API.put(`/tasks/${id}`, d),
  getWorkflows: () => API.get('/workflows'),
  assignWorkflow: (id, empId) => API.post(`/workflows/${id}/assign/${empId}`),
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const G = {
  bg: "#020409",
  surface: "#080d14",
  card: "rgba(10,18,30,0.8)",
  glass: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.06)",
  borderGlow: "rgba(0,245,255,0.3)",
  cyan: "#00f5ff",
  purple: "#7c3aed",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  pink: "#ec4899",
  text: "#f1f5f9",
  muted: "#475569",
  subtle: "#1e293b",
  font: "'Syne', 'Orbitron', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
  body: "'DM Sans', 'Inter', sans-serif",
};

const statusColor = { active: G.green, onboarding: G.orange, inactive: G.red };
const priorityColor = { high: G.red, medium: G.orange, low: G.green };
const taskColor = { pending: G.muted, in_progress: G.cyan, completed: G.green, overdue: G.red };
const catIcon = { documentation:"📄", training:"📚", setup:"⚙️", meeting:"🤝", other:"📌" };

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: ${G.bg};
    color: ${G.text};
    font-family: ${G.body};
    cursor: none !important;
    overflow-x: hidden;
  }

  * { cursor: none !important; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.cyan}33; border-radius: 10px; }

  /* ── CURSOR ── */
  #cursor {
    width: 12px; height: 12px;
    background: ${G.cyan};
    border-radius: 50%;
    position: fixed; top: 0; left: 0;
    pointer-events: none; z-index: 99999;
    transform: translate(-50%,-50%);
    transition: transform 0.1s ease, width 0.2s ease, height 0.2s ease, background 0.2s ease;
    mix-blend-mode: screen;
    box-shadow: 0 0 20px ${G.cyan}, 0 0 40px ${G.cyan}44;
  }
  #cursor-trail {
    width: 36px; height: 36px;
    border: 1px solid ${G.cyan}44;
    border-radius: 50%;
    position: fixed; top: 0; left: 0;
    pointer-events: none; z-index: 99998;
    transform: translate(-50%,-50%);
    transition: transform 0.15s ease, width 0.3s ease, height 0.3s ease;
  }
  body:has(button:hover) #cursor,
  body:has(a:hover) #cursor { width: 20px; height: 20px; background: ${G.purple}; }
  body:has(button:hover) #cursor-trail,
  body:has(a:hover) #cursor-trail { width: 52px; height: 52px; border-color: ${G.purple}44; }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes slideLeft { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
  @keyframes slideRight { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes gradientShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
  @keyframes borderGlow { 0%,100% { border-color:${G.cyan}33; box-shadow:0 0 10px ${G.cyan}11; } 50% { border-color:${G.cyan}66; box-shadow:0 0 20px ${G.cyan}33; } }
  @keyframes ripple { to { transform:scale(4); opacity:0; } }
  @keyframes toastIn { from { transform:translateX(120%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes countUp { from { opacity:0; transform:scale(0.6) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes progressFill { from { width:0; } to { width:var(--w); } }
  @keyframes skeletonShimmer { 0% { background-position:-200px 0; } 100% { background-position:calc(200px + 100%) 0; } }
  @keyframes missionDone { 0% { transform:scale(1); } 30% { transform:scale(1.3); } 60% { transform:scale(0.95); } 100% { transform:scale(1); } }
  @keyframes glowPulse { 0%,100% { box-shadow:0 0 5px ${G.cyan}44; } 50% { box-shadow:0 0 25px ${G.cyan}88, 0 0 50px ${G.cyan}33; } }
  @keyframes navSlide { from { transform:translateX(-100%); } to { transform:translateX(0); } }
  @keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
  @keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(20px); } to { opacity:1; transform:scale(1) translateY(0); } }
  @keyframes confetti { 0% { transform:translate(0,0) rotate(0deg); opacity:1; } 100% { transform:translate(var(--tx),var(--ty)) rotate(var(--tr)); opacity:0; } }
  @keyframes orbit { from { transform:rotate(0deg) translateX(60px) rotate(0deg); } to { transform:rotate(360deg) translateX(60px) rotate(-360deg); } }

  /* ── GLASS CARDS ── */
  .glass-card {
    background: ${G.card};
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid ${G.border};
    border-radius: 20px;
    transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
    position: relative;
    overflow: hidden;
  }
  .glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%);
    pointer-events: none;
  }
  .glass-card:hover {
    border-color: ${G.cyan}33;
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${G.cyan}11;
  }

  /* ── PREMIUM BUTTON ── */
  .btn-premium {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    border: none;
    font-family: ${G.body};
    font-weight: 600;
    letter-spacing: 0.5px;
    cursor: none !important;
  }
  .btn-premium::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .btn-premium:hover::after { opacity: 1; }
  .btn-premium:hover { transform: translateY(-2px); }
  .btn-premium:active { transform: scale(0.97); }

  /* ── RIPPLE ── */
  .ripple-effect {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }

  /* ── SKELETON ── */
  .skeleton {
    background: linear-gradient(90deg, ${G.subtle} 25%, ${G.surface} 50%, ${G.subtle} 75%);
    background-size: 200px 100%;
    animation: skeletonShimmer 1.5s infinite;
    border-radius: 8px;
  }

  /* ── NAV ITEMS ── */
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 12px;
    border: none; background: transparent;
    color: ${G.muted}; cursor: none !important;
    font-family: ${G.body}; font-size: 13px; font-weight: 500;
    transition: all 0.25s ease; width: 100%; text-align: left;
    position: relative; overflow: hidden;
  }
  .nav-item::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 0; background: linear-gradient(90deg, ${G.cyan}22, transparent);
    transition: width 0.3s ease; border-radius: inherit;
  }
  .nav-item:hover { color: ${G.text}; background: ${G.glass}; }
  .nav-item:hover::before { width: 100%; }
  .nav-item.active {
    color: ${G.cyan}; background: ${G.cyan}11;
    box-shadow: inset 0 0 20px ${G.cyan}08;
  }
  .nav-item.active::before { width: 3px; background: ${G.cyan}; }

  /* ── INPUT ── */
  .premium-input {
    width: 100%; background: rgba(255,255,255,0.03);
    border: 1px solid ${G.border}; border-radius: 12px;
    padding: 11px 14px; color: ${G.text}; font-size: 14px;
    font-family: ${G.body}; outline: none; transition: all 0.3s ease;
    box-sizing: border-box;
  }
  .premium-input:focus {
    border-color: ${G.cyan}55;
    background: rgba(0,245,255,0.03);
    box-shadow: 0 0 0 3px ${G.cyan}11;
  }
  .premium-input::placeholder { color: ${G.muted}; }

  /* ── MOBILE BOTTOM NAV ── */
  .mobile-nav {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
    background: rgba(8,13,20,0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid ${G.border};
    padding: 8px 0 max(8px, env(safe-area-inset-bottom));
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 768px) {
    .sidebar { display: none !important; }
    .mobile-nav { display: flex !important; }
    .main-wrap { margin-left: 0 !important; max-width: 100vw !important; padding: 16px 16px 80px !important; }
    .stat-row { flex-direction: column !important; }
    .two-col { grid-template-columns: 1fr !important; }
    .emp-grid { grid-template-columns: 1fr !important; }
    .form-grid { grid-template-columns: 1fr !important; }
    .page-title { font-size: 20px !important; }
    .hide-mobile { display: none !important; }
  }
  @media (min-width: 769px) {
    .mobile-nav { display: none !important; }
  }

  /* ── PROGRESS BAR ── */
  .progress-track {
    height: 6px; border-radius: 10px;
    background: rgba(255,255,255,0.06);
    overflow: hidden; position: relative;
  }
  .progress-fill {
    height: 100%; border-radius: 10px;
    animation: progressFill 1s cubic-bezier(0.4,0,0.2,1) forwards;
    position: relative;
  }
  .progress-fill::after {
    content: '';
    position: absolute; right: 0; top: 50%;
    transform: translateY(-50%);
    width: 8px; height: 8px; border-radius: 50%;
    background: inherit; box-shadow: 0 0 8px currentColor;
  }

  /* ── BADGE ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; white-space: nowrap;
    font-family: ${G.mono};
    transition: all 0.2s ease;
  }
  .badge:hover { transform: scale(1.05); }

  /* ── GRADIENT TEXT ── */
  .gradient-text {
    background: linear-gradient(135deg, ${G.cyan}, ${G.purple}, ${G.pink});
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 4s ease infinite;
  }

  /* ── GLOW BORDER ── */
  .glow-border { animation: glowPulse 3s ease infinite; }

  /* ── TASK CARD ── */
  .task-card {
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    animation: fadeUp 0.4s ease both;
  }
  .task-card:hover {
    transform: translateX(6px);
    border-left-width: 3px !important;
  }

  /* ── STAT CARD ── */
  .stat-card {
    animation: scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    transition: all 0.3s ease;
  }
  .stat-card:hover { transform: translateY(-6px) scale(1.02); }

  /* ── SCROLLBAR THIN ── */
  .thin-scroll::-webkit-scrollbar { width: 3px; }
  .thin-scroll::-webkit-scrollbar-thumb { background: ${G.cyan}22; border-radius: 10px; }
`;

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
function CustomCursor() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const trailPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    const animate = () => {
      trailPos.current.x += (pos.current.x - trailPos.current.x) * 0.15;
      trailPos.current.y += (pos.current.y - trailPos.current.y) * 0.15;
      if (trailRef.current) {
        trailRef.current.style.left = trailPos.current.x + 'px';
        trailRef.current.style.top = trailPos.current.y + 'px';
      }
      requestAnimationFrame(animate);
    };
    window.addEventListener('mousemove', move);
    animate();
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <>
      <div id="cursor" ref={cursorRef}/>
      <div id="cursor-trail" ref={trailRef}/>
    </>
  );
}

// ─── RIPPLE HOOK ──────────────────────────────────────────────────────────────
function useRipple() {
  const createRipple = useCallback((e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);
  return createRipple;
}

// ─── COUNTER ANIMATION ────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) return;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span style={{ animation: "countUp 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>{display}</span>;
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }}/>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }}/>
          <div className="skeleton" style={{ height: 11, width: "45%" }}/>
        </div>
      </div>
      <div className="skeleton" style={{ height: 6, width: "100%", marginBottom: 8 }}/>
      <div style={{ display: "flex", gap: 6 }}>
        <div className="skeleton" style={{ height: 20, width: 60, borderRadius: 20 }}/>
        <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 20 }}/>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", alignItems: "center" }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}/>
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 6 }}/>
        <div className="skeleton" style={{ height: 10, width: "35%" }}/>
      </div>
      <div className="skeleton" style={{ height: 22, width: 70, borderRadius: 20 }}/>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => {
        const colors = { success: G.green, error: G.red, info: G.cyan, warning: G.orange };
        const icons = { success: "✓", error: "✕", info: "⚡", warning: "⚠" };
        const c = colors[t.type] || G.cyan;
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(8,13,20,0.95)", backdropFilter: "blur(20px)", border: `1px solid ${c}33`, borderRadius: 14, boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${c}22`, animation: "toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", minWidth: 260, maxWidth: 320 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${c}22`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontSize: 12, fontWeight: 700, flexShrink: 0, border: `1px solid ${c}44` }}>{icons[t.type]}</div>
            <span style={{ color: G.text, fontSize: 13, fontFamily: G.body, fontWeight: 500, flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MISSION COMPLETE POPUP ───────────────────────────────────────────────────
function MissionComplete({ show, onClose, name }) {
  const confetti = [...Array(30)].map((_, i) => ({
    id: i,
    color: [G.cyan, G.purple, G.green, G.orange, G.pink][i % 5],
    tx: `${(Math.random() - 0.5) * 400}px`,
    ty: `${Math.random() * -300 - 100}px`,
    tr: `${(Math.random() - 0.5) * 720}deg`,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.5,
  }));

  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", animation: "overlayIn 0.3s ease" }}>
      <div style={{ position: "relative", textAlign: "center", animation: "modalIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
        {confetti.map(c => (
          <div key={c.id} style={{ position: "absolute", top: "50%", left: "50%", width: c.size, height: c.size, background: c.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px", "--tx": c.tx, "--ty": c.ty, "--tr": c.tr, animation: `confetti 1.5s ease ${c.delay}s forwards`, zIndex: 0 }}/>
        ))}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 72, marginBottom: 16, animation: "missionDone 0.6s ease, float 3s ease-in-out 0.6s infinite" }}>🏆</div>
          <div style={{ fontFamily: G.font, fontSize: 32, fontWeight: 800, marginBottom: 8 }} className="gradient-text">MISSION COMPLETE</div>
          {name && <div style={{ color: G.muted, fontSize: 15, fontFamily: G.body, marginBottom: 8 }}>{name}</div>}
          <div style={{ color: G.orange, fontSize: 20, fontFamily: G.mono, fontWeight: 700, marginBottom: 20 }}>+100 XP</div>
          <div style={{ color: G.muted, fontSize: 12, fontFamily: G.body }}>Click anywhere to continue</div>
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ show, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 9997, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "overlayIn 0.3s ease" }}>
      <div className="glass-card" style={{ padding: 32, maxWidth: 380, width: "100%", animation: "modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", border: `1px solid ${G.red}33`, boxShadow: `0 0 60px ${G.red}11` }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontFamily: G.font, fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 8 }}>Are you sure?</div>
          <div style={{ color: G.muted, fontSize: 14, fontFamily: G.body, lineHeight: 1.6 }}>{message}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <PremiumBtn onClick={onCancel} variant="ghost" style={{ flex: 1 }}>Cancel</PremiumBtn>
          <PremiumBtn onClick={onConfirm} variant="danger" style={{ flex: 1 }}>Delete</PremiumBtn>
        </div>
      </div>
    </div>
  );
}

// ─── PREMIUM BUTTON ───────────────────────────────────────────────────────────
function PremiumBtn({ children, onClick, variant = "primary", size = "md", style = {}, disabled = false }) {
  const ripple = useRipple();
  const variants = {
    primary: { bg: `linear-gradient(135deg, ${G.cyan}33, ${G.purple}22)`, color: G.cyan, border: `1px solid ${G.cyan}44`, shadow: `0 0 20px ${G.cyan}22` },
    success: { bg: `linear-gradient(135deg, ${G.green}33, ${G.cyan}11)`, color: G.green, border: `1px solid ${G.green}44`, shadow: `0 0 20px ${G.green}22` },
    danger: { bg: `linear-gradient(135deg, ${G.red}33, ${G.orange}11)`, color: G.red, border: `1px solid ${G.red}44`, shadow: `0 0 20px ${G.red}22` },
    ghost: { bg: "transparent", color: G.muted, border: `1px solid ${G.border}`, shadow: "none" },
    solid: { bg: `linear-gradient(135deg, ${G.cyan}, ${G.purple})`, color: "#fff", border: "none", shadow: `0 8px 24px ${G.cyan}44` },
  };
  const v = variants[variant] || variants.primary;
  const sizes = { sm: "6px 14px", md: "10px 20px", lg: "13px 28px" };
  return (
    <button className="btn-premium" disabled={disabled} onClick={(e) => { ripple(e); if (!disabled) onClick?.(e); }}
      style={{ background: v.bg, color: disabled ? G.muted : v.color, border: disabled ? `1px solid ${G.border}` : v.border, borderRadius: 12, padding: sizes[size], fontSize: size === "sm" ? 12 : 13, fontWeight: 600, boxShadow: disabled ? "none" : v.shadow, opacity: disabled ? 0.5 : 1, ...style }}>
      {children}
    </button>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }) {
  const colors = [G.cyan, G.purple, G.green, G.orange, G.pink];
  const c = colors[(name || "?").charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(135deg, ${c}33, ${c}11)`, border: `1.5px solid ${c}55`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontWeight: 700, fontSize: size * 0.38, fontFamily: G.font, flexShrink: 0, boxShadow: `0 0 12px ${c}22`, transition: "all 0.3s ease" }}>
      {(name || "?")[0]}
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color, height = 6 }) {
  const c = color || (value === 100 ? G.green : value > 60 ? G.cyan : value > 30 ? G.orange : G.red);
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ "--w": `${value || 0}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, boxShadow: `0 0 8px ${c}66`, color: c }}/>
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, color = G.cyan, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 className="page-title gradient-text" style={{ fontFamily: G.font, fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>{title}</h1>
        {subtitle && <p style={{ color: G.muted, fontSize: 13, fontFamily: G.body }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delay = 0 }) {
  return (
    <div className="glass-card stat-card" style={{ padding: "20px 22px", flex: 1, minWidth: 120, animationDelay: `${delay}s` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }}/>
      </div>
      <div style={{ fontFamily: G.font, fontSize: 28, fontWeight: 800, color, marginBottom: 4, lineHeight: 1 }}>
        <AnimatedNumber value={value}/>
      </div>
      <div style={{ color: G.muted, fontSize: 12, fontFamily: G.body, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "52px 20px", animation: "fadeUp 0.5s ease" }}>
      <div style={{ fontSize: 48, marginBottom: 14, animation: "float 3s ease-in-out infinite" }}>{icon}</div>
      <div style={{ fontFamily: G.font, fontSize: 16, fontWeight: 700, color: G.text, marginBottom: 8 }}>{title}</div>
      <div style={{ color: G.muted, fontSize: 13, fontFamily: G.body }}>{subtitle}</div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@company.com");
  const [pw, setPw] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !pw) { setErr("Please fill all fields"); return; }
    setLoading(true); setErr("");
    try {
      const { data } = await api.login({ email, password: pw });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      onLogin(data);
    } catch (error) {
      setErr(error.response?.data?.message || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Ambient Background */}
      <div style={{ position: "absolute", top: "20%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${G.cyan}08, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }}/>
      <div style={{ position: "absolute", bottom: "20%", right: "20%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${G.purple}08, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }}/>

      {/* Floating Orbs */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%", background: i % 2 === 0 ? G.cyan : G.purple, opacity: 0.4, left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, animation: `float ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}/>
      ))}

      <div style={{ width: "100%", maxWidth: 400, position: "relative", animation: "fadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg, ${G.cyan}22, ${G.purple}22)`, border: `1px solid ${G.cyan}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px", animation: "float 3s ease-in-out infinite", boxShadow: `0 0 30px ${G.cyan}22` }}>⚡</div>
          <h1 style={{ fontFamily: G.font, fontSize: 30, fontWeight: 800, marginBottom: 6 }} className="gradient-text">OnboardIQ</h1>
          <p style={{ color: G.muted, fontSize: 13, fontFamily: G.body }}>Smart Employee Onboarding System</p>
        </div>

        <div className="glass-card glow-border" style={{ padding: 32 }}>
          <h2 style={{ fontFamily: G.font, fontSize: 16, fontWeight: 700, marginBottom: 24, color: G.text }}>Welcome back</h2>

          {err && (
            <div style={{ background: `${G.red}11`, border: `1px solid ${G.red}33`, borderRadius: 10, padding: "10px 14px", color: G.red, fontSize: 13, marginBottom: 16, fontFamily: G.body, animation: "fadeIn 0.3s ease" }}>
              {err}
            </div>
          )}

          <form onSubmit={handle}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: G.muted, fontSize: 12, display: "block", marginBottom: 6, fontFamily: G.body, fontWeight: 500 }}>Email address</label>
              <input className="premium-input" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com"/>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: G.muted, fontSize: 12, display: "block", marginBottom: 6, fontFamily: G.body, fontWeight: 500 }}>Password</label>
              <input className="premium-input" value={pw} onChange={e => setPw(e.target.value)} type="password" placeholder="••••••••"/>
            </div>
            <PremiumBtn variant="solid" style={{ width: "100%", borderRadius: 12, padding: "13px", fontSize: 14 }} disabled={loading}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }}/>
                  Signing in...
                </span>
              ) : "Sign In →"}
            </PremiumBtn>
          </form>

          <div style={{ marginTop: 20, padding: 14, background: G.glass, border: `1px solid ${G.border}`, borderRadius: 12 }}>
            <p style={{ color: G.muted, fontSize: 11, marginBottom: 6, fontFamily: G.body, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Demo accounts</p>
            <p style={{ color: G.text, fontSize: 12, fontFamily: G.mono }}>admin@company.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, employees, tasks }) {
  const isAdmin = user.role === "admin" || user.role === "hr";
  const myTasks = tasks.filter(t => t.assignedTo?._id === user._id);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetEmoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : "🌙";

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: G.muted, fontSize: 13, fontFamily: G.body, marginBottom: 4 }}>{greeting}, {user.name?.split(" ")[0]} {greetEmoji}</p>
        <h1 className="page-title gradient-text" style={{ fontFamily: G.font, fontSize: 26, fontWeight: 800 }}>
          {isAdmin ? "Command Center" : "My Dashboard"}
        </h1>
      </div>

      {isAdmin ? (
        <>
          <div className="stat-row" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
            <StatCard icon="👥" label="Total Agents" value={employees.length} color={G.cyan} delay={0}/>
            <StatCard icon="🔄" label="Onboarding" value={employees.filter(e => e.status === "onboarding").length} color={G.orange} delay={0.1}/>
            <StatCard icon="✅" label="Active" value={employees.filter(e => e.status === "active").length} color={G.green} delay={0.2}/>
            <StatCard icon="📋" label="Pending" value={tasks.filter(t => t.status === "pending").length} color={G.red} delay={0.3}/>
            <StatCard icon="🏆" label="Completed" value={tasks.filter(t => t.status === "completed").length} color={G.purple} delay={0.4}/>
          </div>

          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Agent Progress */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 18, color: G.text }}>Agent Progress</h2>
              {employees.length === 0 ? <EmptyState icon="👥" title="No agents yet" subtitle="Add your first agent to get started"/> :
                employees.map((emp, i) => (
                  <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                    <Avatar name={emp.name} size={36}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: G.text, fontSize: 13, fontWeight: 600, fontFamily: G.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</span>
                        <span style={{ color: G.cyan, fontSize: 12, fontFamily: G.mono, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>{emp.onboardingProgress || 0}%</span>
                      </div>
                      <ProgressBar value={emp.onboardingProgress || 0}/>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Recent Tasks */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 16, color: G.text }}>Recent Tasks</h2>
              {tasks.length === 0 ? <EmptyState icon="📋" title="No tasks yet" subtitle="Create your first task"/> :
                tasks.slice(0, 6).map((t, i) => (
                  <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${G.border}`, animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{catIcon[t.category]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: G.text, fontSize: 12, fontWeight: 600, fontFamily: G.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                      <div style={{ color: G.muted, fontSize: 11 }}>{t.assignedTo?.name}</div>
                    </div>
                    <Badge label={t.status.replace("_", " ")} color={taskColor[t.status]}/>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Employee Profile Banner */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 20, background: `linear-gradient(135deg, ${G.cyan}08, ${G.purple}06)`, border: `1px solid ${G.cyan}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <Avatar name={user.name || "U"} size={56}/>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: G.font, fontSize: 18, fontWeight: 800, marginBottom: 2, color: G.text }}>{user.name}</h2>
                <p style={{ color: G.muted, fontSize: 13, fontFamily: G.body, marginBottom: 12 }}>{user.department} · {user.position}</p>
                <ProgressBar value={user.onboardingProgress || 0}/>
                <p style={{ color: G.cyan, fontSize: 11, fontFamily: G.mono, marginTop: 6 }}>{user.onboardingProgress || 0}% onboarding complete</p>
              </div>
            </div>
          </div>

          <div className="stat-row" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard icon="✅" label="Completed" value={myTasks.filter(t => t.status === "completed").length} color={G.green} delay={0}/>
            <StatCard icon="⚡" label="In Progress" value={myTasks.filter(t => t.status === "in_progress").length} color={G.cyan} delay={0.1}/>
            <StatCard icon="📋" label="Pending" value={myTasks.filter(t => t.status === "pending").length} color={G.orange} delay={0.2}/>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>My Tasks</h2>
            {myTasks.length === 0 ? <EmptyState icon="🎯" title="No tasks assigned" subtitle="Your tasks will appear here"/> :
              myTasks.map((t, i) => (
                <div key={t._id} style={{ display: "flex", gap: 12, padding: "12px", background: G.glass, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 8, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                  <span style={{ fontSize: 20, marginTop: 1 }}>{catIcon[t.category]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: G.text, fontSize: 13, fontWeight: 600, fontFamily: G.body }}>{t.title}</div>
                    <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>{t.description}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <Badge label={t.status.replace("_", " ")} color={taskColor[t.status]}/>
                      <Badge label={t.priority} color={priorityColor[t.priority]}/>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
}

// ─── EMPLOYEES PAGE ───────────────────────────────────────────────────────────
function EmployeesPage({ addToast, employees, setEmployees }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", position: "", phone: "" });

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const add = async () => {
    if (!form.name || !form.email || !form.password) { addToast("Please fill required fields", "error"); return; }
    setLoading(true);
    try {
      const { data } = await api.addEmployee(form);
      setEmployees([...employees, data]);
      setForm({ name: "", email: "", password: "", department: "", position: "", phone: "" });
      setShowForm(false);
      addToast(`${form.name} added successfully!`, "success");
    } catch (err) { addToast(err.response?.data?.message || "Failed to add", "error"); }
    setLoading(false);
  };

  const remove = async () => {
    try {
      await api.deleteEmployee(confirm);
      setEmployees(employees.filter(e => e._id !== confirm));
      addToast("Employee removed", "info");
    } catch { addToast("Failed to remove", "error"); }
    setConfirm(null);
  };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <ConfirmModal show={!!confirm} message="This will permanently remove the employee from the system." onConfirm={remove} onCancel={() => setConfirm(null)}/>

      <PageHeader title="Employees" subtitle={`${employees.length} agents in system`}
        action={<PremiumBtn variant="solid" onClick={() => setShowForm(!showForm)}>+ Add Employee</PremiumBtn>}/>

      {showForm && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 20, border: `1px solid ${G.cyan}22`, animation: "fadeUp 0.3s ease" }}>
          <h3 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 18, color: G.cyan }}>New Employee</h3>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "name", label: "Full Name *", type: "text" },
              { key: "email", label: "Email *", type: "email" },
              { key: "password", label: "Password *", type: "password" },
              { key: "department", label: "Department", type: "text" },
              { key: "position", label: "Position", type: "text" },
              { key: "phone", label: "Phone", type: "text" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color: G.muted, fontSize: 11, display: "block", marginBottom: 5, fontFamily: G.body, fontWeight: 500 }}>{f.label}</label>
                <input className="premium-input" type={f.type} placeholder={f.label.replace(" *", "")} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}/>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <PremiumBtn variant="success" onClick={add} disabled={loading}>{loading ? "Adding..." : "Add Employee"}</PremiumBtn>
            <PremiumBtn variant="ghost" onClick={() => setShowForm(false)}>Cancel</PremiumBtn>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: G.muted, fontSize: 16 }}>🔍</span>
        <input className="premium-input" placeholder="Search by name or department..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 42 }}/>
      </div>

      <div className="emp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {filtered.length === 0 && search === "" && employees.length === 0 ? (
          <div style={{ gridColumn: "1/-1" }}>
            <EmptyState icon="👥" title="No employees yet" subtitle='Click "Add Employee" to get started'/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1" }}>
            <EmptyState icon="🔍" title="No results found" subtitle={`No employees matching "${search}"`}/>
          </div>
        ) : filtered.map((emp, i) => (
          <div key={emp._id} className="glass-card" style={{ padding: 20, animation: `fadeUp 0.4s ease ${i * 0.06}s both`, position: "relative" }}>
            <button onClick={() => setConfirm(emp._id)} style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: 8, background: `${G.red}15`, border: `1px solid ${G.red}22`, color: G.red, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
              onMouseEnter={e => { e.currentTarget.style.background = `${G.red}33`; }} onMouseLeave={e => { e.currentTarget.style.background = `${G.red}15`; }}>×</button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar name={emp.name || "?"} size={44}/>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                <div style={{ color: G.text, fontWeight: 600, fontSize: 14, fontFamily: G.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
                <div style={{ color: G.muted, fontSize: 12, marginTop: 1 }}>{emp.position || "No position"}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              <Badge label={emp.status || "onboarding"} color={statusColor[emp.status] || G.orange}/>
              {emp.department && <Badge label={emp.department} color={G.purple}/>}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: G.muted, fontSize: 11, fontFamily: G.body }}>Onboarding progress</span>
                <span style={{ color: G.cyan, fontSize: 11, fontFamily: G.mono, fontWeight: 600 }}>{emp.onboardingProgress || 0}%</span>
              </div>
              <ProgressBar value={emp.onboardingProgress || 0}/>
            </div>

            {emp.phone && <div style={{ color: G.muted, fontSize: 11, fontFamily: G.body }}>📱 {emp.phone}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TASKS PAGE ───────────────────────────────────────────────────────────────
function TasksPage({ user, tasks, setTasks, employees, addToast }) {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [missionDone, setMissionDone] = useState(false);
  const [doneName, setDoneName] = useState("");
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", priority: "medium", category: "other", dueDate: "" });

  const isAdmin = user.role === "admin" || user.role === "hr";
  const visible = isAdmin ? tasks : tasks.filter(t => t.assignedTo?._id === user._id);
  const filtered = filter === "all" ? visible : visible.filter(t => t.status === filter);

  const getDaysLeft = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Overdue", color: G.red };
    if (diff === 0) return { label: "Due today", color: G.red };
    if (diff <= 2) return { label: `${diff}d left`, color: G.orange };
    return { label: `${diff}d left`, color: G.muted };
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.updateTask(id, { status });
      setTasks(tasks.map(t => t._id === id ? data : t));
      if (status === "completed") {
        const task = tasks.find(t => t._id === id);
        setDoneName(task?.assignedTo?.name || "");
        setMissionDone(true);
        addToast("Mission complete! +100 XP 🏆", "success");
      } else {
        addToast("Task updated", "info");
      }
    } catch { addToast("Failed to update", "error"); }
  };

  const addTask = async () => {
    if (!form.title || !form.assignedTo) { addToast("Fill required fields", "error"); return; }
    try {
      const { data } = await api.addTask(form);
      setTasks([...tasks, data]);
      setForm({ title: "", description: "", assignedTo: "", priority: "medium", category: "other", dueDate: "" });
      setShowForm(false);
      addToast("Task created!", "success");
    } catch { addToast("Failed to create", "error"); }
  };

  const filterBtns = ["all", "pending", "in_progress", "completed"];
  const selStyle = { background: `${G.cyan}22`, color: G.cyan, border: `1px solid ${G.cyan}44` };
  const unselStyle = { background: "transparent", color: G.muted, border: `1px solid ${G.border}` };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <MissionComplete show={missionDone} onClose={() => setMissionDone(false)} name={doneName}/>

      <PageHeader title="Tasks" subtitle={`${visible.length} tasks total`}
        action={isAdmin && <PremiumBtn variant="solid" onClick={() => setShowForm(!showForm)}>+ New Task</PremiumBtn>}/>

      {showForm && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 20, border: `1px solid ${G.orange}22`, animation: "fadeUp 0.3s ease" }}>
          <h3 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 18, color: G.orange }}>Create Task</h3>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: G.muted, fontSize: 11, display: "block", marginBottom: 5, fontFamily: G.body }}>Task Title *</label>
              <input className="premium-input" placeholder="Enter task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/>
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 11, display: "block", marginBottom: 5, fontFamily: G.body }}>Assign To *</label>
              <select className="premium-input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Select employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 11, display: "block", marginBottom: 5, fontFamily: G.body }}>Priority</label>
              <select className="premium-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {["low", "medium", "high"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 11, display: "block", marginBottom: 5, fontFamily: G.body }}>Category</label>
              <select className="premium-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["documentation", "training", "setup", "meeting", "other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 11, display: "block", marginBottom: 5, fontFamily: G.body }}>Due Date</label>
              <input className="premium-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: G.muted, fontSize: 11, display: "block", marginBottom: 5, fontFamily: G.body }}>Description</label>
              <textarea className="premium-input" placeholder="Task description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical", minHeight: 70 }}/>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <PremiumBtn variant="success" onClick={addTask}>Create Task</PremiumBtn>
            <PremiumBtn variant="ghost" onClick={() => setShowForm(false)}>Cancel</PremiumBtn>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {filterBtns.map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn-premium"
            style={{ ...(filter === f ? selStyle : unselStyle), borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 600, fontFamily: G.body }}>
            {f.replace("_", " ")} <span style={{ opacity: 0.6 }}>({(f === "all" ? visible : visible.filter(t => t.status === f)).length})</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="No tasks found" subtitle={filter === "all" ? "Create your first task" : `No ${filter.replace("_", " ")} tasks`}/>
        ) : filtered.map((t, i) => {
          const dl = getDaysLeft(t.dueDate);
          return (
            <div key={t._id} className="task-card glass-card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start", borderLeft: `3px solid ${taskColor[t.status]}22`, animationDelay: `${i * 0.05}s` }}>
              <span style={{ fontSize: 20, marginTop: 1, flexShrink: 0 }}>{catIcon[t.category]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: G.text, fontWeight: 600, fontSize: 14, fontFamily: G.body }}>{t.title}</div>
                    {t.description && <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>{t.description}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
                    <Badge label={t.status.replace("_", " ")} color={taskColor[t.status]}/>
                    <Badge label={t.priority} color={priorityColor[t.priority]}/>
                    {dl && <Badge label={dl.label} color={dl.color}/>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: G.muted, fontSize: 12 }}>👤 {t.assignedTo?.name || "Unassigned"}</span>
                  {t.dueDate && <span style={{ color: G.muted, fontSize: 12 }}>📅 {t.dueDate?.split("T")[0]}</span>}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    {t.status === "pending" && <PremiumBtn size="sm" variant="primary" onClick={() => updateStatus(t._id, "in_progress")}>Start</PremiumBtn>}
                    {t.status === "in_progress" && <PremiumBtn size="sm" variant="success" onClick={() => updateStatus(t._id, "completed")}>Complete ✓</PremiumBtn>}
                    {t.status === "completed" && <span style={{ color: G.green, fontSize: 12, fontWeight: 600 }}>✓ Done</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WORKFLOWS PAGE ───────────────────────────────────────────────────────────
function WorkflowsPage({ employees, addToast }) {
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assignEmp, setAssignEmp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkflows().then(({ data }) => setWorkflows(data)).catch(() => addToast("Failed to load workflows", "error")).finally(() => setLoading(false));
  }, []);

  const assign = async (wf) => {
    if (!assignEmp) { addToast("Please select an employee", "error"); return; }
    try {
      await api.assignWorkflow(wf._id, assignEmp);
      const emp = employees.find(e => e._id === assignEmp);
      addToast(`${wf.name} assigned to ${emp?.name}!`, "success");
      setSelected(null); setAssignEmp("");
    } catch { addToast("Failed to assign", "error"); }
  };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHeader title="Workflows" subtitle="Onboarding templates"/>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i}/>)}
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState icon="🔄" title="No workflows yet" subtitle="Add workflows via the API"/>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {workflows.map((wf, i) => (
            <div key={wf._id} className="glass-card" style={{ padding: 22, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, color: G.text, marginBottom: 6 }}>{wf.name}</h3>
                  <Badge label={wf.department || "All"} color={G.purple}/>
                </div>
                <div style={{ background: `${G.cyan}15`, color: G.cyan, border: `1px solid ${G.cyan}33`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontFamily: G.mono, fontWeight: 600 }}>{wf.steps?.length || 0} steps</div>
              </div>
              <p style={{ color: G.muted, fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>{wf.description}</p>
              <div style={{ marginBottom: 14 }}>
                {wf.steps?.map((s, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${G.border}` }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: `${G.cyan}15`, color: G.cyan, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontFamily: G.mono, flexShrink: 0 }}>{s.order}</div>
                    <span style={{ fontSize: 13 }}>{catIcon[s.category]}</span>
                    <span style={{ color: G.text, fontSize: 12, flex: 1 }}>{s.title}</span>
                    <span style={{ color: G.muted, fontSize: 10, fontFamily: G.mono }}>{s.estimatedDays}d</span>
                  </div>
                ))}
              </div>
              <PremiumBtn variant="primary" style={{ width: "100%", borderRadius: 10 }} onClick={() => setSelected(selected === wf._id ? null : wf._id)}>
                Assign Workflow
              </PremiumBtn>
              {selected === wf._id && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, animation: "fadeUp 0.3s ease" }}>
                  <select className="premium-input" value={assignEmp} onChange={e => setAssignEmp(e.target.value)} style={{ flex: 1 }}>
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                  <PremiumBtn variant="success" size="sm" onClick={() => assign(wf)}>Go</PremiumBtn>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
function AnalyticsPage({ employees, tasks }) {
  const total = tasks.length || 1;
  const rate = Math.round((tasks.filter(t => t.status === "completed").length / total) * 100);

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHeader title="Analytics" subtitle="Performance overview"/>

      <div className="stat-row" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard icon="👥" label="Total Agents" value={employees.length} color={G.cyan} delay={0}/>
        <StatCard icon="📋" label="Total Tasks" value={tasks.length} color={G.orange} delay={0.1}/>
        <StatCard icon="✅" label="Completed" value={tasks.filter(t => t.status === "completed").length} color={G.green} delay={0.2}/>
        <StatCard icon="🎯" label="Success Rate %" value={rate} color={G.purple} delay={0.3}/>
      </div>

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Agent Performance */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Agent Performance</h2>
          {employees.length === 0 ? <EmptyState icon="📊" title="No data yet" subtitle="Add employees to see analytics"/> :
            employees.map((emp, i) => {
              const done = tasks.filter(t => t.assignedTo?._id === emp._id && t.status === "completed").length;
              const total = tasks.filter(t => t.assignedTo?._id === emp._id).length;
              return (
                <div key={emp._id} style={{ marginBottom: 16, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={emp.name} size={28}/>
                      <span style={{ color: G.text, fontSize: 13, fontFamily: G.body, fontWeight: 500 }}>{emp.name?.split(" ")[0]}</span>
                    </div>
                    <span style={{ color: G.cyan, fontSize: 11, fontFamily: G.mono }}>{done}/{total} · {emp.onboardingProgress || 0}%</span>
                  </div>
                  <ProgressBar value={emp.onboardingProgress || 0}/>
                </div>
              );
            })
          }
        </div>

        {/* Task Breakdown */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Task Status</h2>
          {["pending", "in_progress", "completed", "overdue"].map((s, i) => {
            const count = tasks.filter(t => t.status === s).length;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={s} style={{ marginBottom: 14, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: G.text, fontSize: 13, fontFamily: G.body, textTransform: "capitalize" }}>{s.replace("_", " ")}</span>
                  <span style={{ color: taskColor[s], fontSize: 12, fontFamily: G.mono }}>{count} ({pct}%)</span>
                </div>
                <ProgressBar value={pct} color={taskColor[s]}/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardPage({ employees, tasks }) {
  const ranked = employees.map(emp => {
    const et = tasks.filter(t => t.assignedTo?._id === emp._id);
    const done = et.filter(t => t.status === "completed").length;
    const xp = done * 100 + (emp.onboardingProgress || 0);
    const rank = xp > 800 ? "Legend" : xp > 500 ? "Elite" : xp > 200 ? "Veteran" : "Rookie";
    const rc = xp > 800 ? G.orange : xp > 500 ? G.purple : xp > 200 ? G.cyan : G.green;
    return { ...emp, xp, done, total: et.length, rank, rc };
  }).sort((a, b) => b.xp - a.xp);

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHeader title="Leaderboard" subtitle="Employee rankings by XP"/>

      {ranked.length === 0 ? (
        <EmptyState icon="🏆" title="No rankings yet" subtitle="Complete tasks to earn XP"/>
      ) : (
        <>
          {/* Podium */}
          {ranked.length >= 3 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
              {[ranked[1], ranked[0], ranked[2]].map((emp, i) => {
                const heights = [140, 180, 120];
                const medals = ["🥈", "🥇", "🥉"];
                const pos = [2, 1, 3];
                return emp ? (
                  <div key={emp._id} style={{ flex: 1, minWidth: 90, maxWidth: 150, textAlign: "center", animation: `fadeUp 0.5s ease ${i * 0.15}s both` }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{medals[i]}</div>
                    <Avatar name={emp.name} size={44}/>
                    <div style={{ color: G.text, fontSize: 12, fontWeight: 600, fontFamily: G.body, margin: "8px 0 4px" }}>{emp.name?.split(" ")[0]}</div>
                    <Badge label={emp.rank} color={emp.rc}/>
                    <div style={{ height: heights[i], background: `linear-gradient(180deg, ${emp.rc}22, ${emp.rc}08)`, border: `1px solid ${emp.rc}33`, borderRadius: "10px 10px 0 0", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <div style={{ color: emp.rc, fontFamily: G.font, fontSize: 18, fontWeight: 800 }}>{emp.xp}</div>
                      <div style={{ color: G.muted, fontSize: 10, fontFamily: G.mono }}>XP</div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Full Rankings */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Full Rankings</h2>
            {ranked.map((emp, i) => (
              <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: i === 0 ? `${G.orange}06` : G.glass, border: `1px solid ${i === 0 ? G.orange + "22" : G.border}`, borderRadius: 12, marginBottom: 8, animation: `fadeUp 0.4s ease ${i * 0.06}s both`, transition: "all 0.3s ease" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: i < 3 ? `${[G.orange, G.muted, G.cyan][i]}22` : G.glass, border: `1px solid ${i < 3 ? [G.orange, G.muted, G.cyan][i] : G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.mono, fontSize: 11, fontWeight: 700, color: i < 3 ? [G.orange, G.muted, G.cyan][i] : G.muted, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <Avatar name={emp.name || "?"} size={36}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ color: G.text, fontWeight: 600, fontSize: 13, fontFamily: G.body }}>{emp.name}</span>
                    <Badge label={emp.rank} color={emp.rc}/>
                  </div>
                  <ProgressBar value={emp.onboardingProgress || 0} height={4}/>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: emp.rc, fontWeight: 800, fontSize: 16, fontFamily: G.font }}>{emp.xp}</div>
                  <div style={{ color: G.muted, fontSize: 10, fontFamily: G.mono }}>XP</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
function ReportsPage({ employees, tasks }) {
  const [selected, setSelected] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!selected) return;
    setGenerating(true);
    const emp = employees.find(e => e._id === selected);
    const et = tasks.filter(t => t.assignedTo?._id === selected);
    const done = et.filter(t => t.status === "completed");
    const pending = [...et.filter(t => t.status === "in_progress"), ...et.filter(t => t.status === "pending")];
    const xp = done.length * 100 + (emp?.onboardingProgress || 0);

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report - ${emp?.name}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{background:#020409;color:#f1f5f9;font-family:'DM Sans',sans-serif;padding:40px;max-width:800px;margin:0 auto;}
.header{background:linear-gradient(135deg,rgba(0,245,255,0.08),rgba(124,58,237,0.06));border:1px solid rgba(0,245,255,0.15);border-radius:20px;padding:32px;text-align:center;margin-bottom:28px;}
.logo{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;background:linear-gradient(135deg,#00f5ff,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px;}
.name{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#f1f5f9;margin-top:14px;}
.sub{color:#475569;font-size:14px;margin-top:4px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
.stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px;text-align:center;}
.sv{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;}
.sl{color:#475569;font-size:11px;margin-top:4px;font-weight:500;}
.section{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:22px;margin-bottom:18px;}
.sh{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#00f5ff;margin-bottom:14px;padding-left:10px;border-left:3px solid #00f5ff;}
.task{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.badge{display:inline-block;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:0.5px;}
.progress{height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin:10px 0;}
.progress-fill{height:100%;border-radius:3px;}
.footer{text-align:center;margin-top:32px;color:#1e293b;font-size:11px;font-family:'DM Sans',sans-serif;}
</style></head><body>
<div class="header">
<div class="logo">OnboardIQ</div>
<div style="color:#475569;font-size:11px;letter-spacing:2px;margin-top:5px;text-transform:uppercase">Smart Employee Onboarding System</div>
<div class="name">${emp?.name}</div>
<div class="sub">${emp?.position || ""} · ${emp?.department || ""} · ${emp?.email}</div>
<div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
<span class="badge" style="background:#10b98118;color:#10b981;border:1px solid #10b98133">${emp?.status?.toUpperCase() || "ONBOARDING"}</span>
<span class="badge" style="background:#00f5ff15;color:#00f5ff;border:1px solid #00f5ff33">${xp} XP</span>
</div></div>
<div class="stats">
<div class="stat" style="border-color:#00f5ff22"><div class="sv" style="color:#00f5ff">${emp?.onboardingProgress || 0}%</div><div class="sl">Progress</div>
<div class="progress"><div class="progress-fill" style="width:${emp?.onboardingProgress || 0}%;background:linear-gradient(90deg,#00f5ff88,#00f5ff)"></div></div></div>
<div class="stat" style="border-color:#10b98122"><div class="sv" style="color:#10b981">${done.length}</div><div class="sl">Completed</div></div>
<div class="stat" style="border-color:#f59e0b22"><div class="sv" style="color:#f59e0b">${et.filter(t => t.status === "in_progress").length}</div><div class="sl">In Progress</div></div>
<div class="stat" style="border-color:#47556922"><div class="sv" style="color:#475569">${et.filter(t => t.status === "pending").length}</div><div class="sl">Pending</div></div>
</div>
<div class="section"><div class="sh">COMPLETED TASKS (${done.length})</div>
${done.length === 0 ? '<div style="color:#475569;text-align:center;padding:16px;font-size:13px">No completed tasks yet</div>' :
done.map(t => `<div class="task"><span style="font-size:16px">${catIcon[t.category] || "📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:13px">${t.title}</div><div style="color:#475569;font-size:12px;margin-top:2px">${t.description || ""}</div></div><span class="badge" style="background:#10b98115;color:#10b981;border:1px solid #10b98133">Done ✓</span></div>`).join("")}
</div>
<div class="section"><div class="sh">PENDING TASKS (${pending.length})</div>
${pending.length === 0 ? '<div style="color:#475569;text-align:center;padding:16px;font-size:13px">All tasks completed! 🎉</div>' :
pending.map(t => `<div class="task"><span style="font-size:16px">${catIcon[t.category] || "📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:13px">${t.title}</div><div style="color:#475569;font-size:12px;margin-top:2px">Due: ${t.dueDate?.split("T")[0] || "No deadline"}</div></div><span class="badge" style="background:${t.status === "in_progress" ? "#00f5ff" : "#475569"}15;color:${t.status === "in_progress" ? "#00f5ff" : "#475569"};border:1px solid ${t.status === "in_progress" ? "#00f5ff" : "#475569"}33">${t.status.replace("_", " ")}</span></div>`).join("")}
</div>
<div class="footer">Generated by OnboardIQ · ${new Date().toLocaleDateString()} · Confidential</div>
</body></html>`;

    setTimeout(() => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${emp?.name?.replace(" ", "_")}_Report.html`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
    }, 1000);
  };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHeader title="Reports" subtitle="Generate employee reports"/>

      <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Generate Report</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: G.muted, fontSize: 12, display: "block", marginBottom: 6, fontFamily: G.body }}>Select Employee</label>
          <select className="premium-input" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Choose an employee...</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        {selected && (() => {
          const emp = employees.find(e => e._id === selected);
          const et = tasks.filter(t => t.assignedTo?._id === selected);
          return (
            <div style={{ background: G.glass, border: `1px solid ${G.border}`, borderRadius: 12, padding: 14, marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={emp?.name || "?"} size={44}/>
                <div style={{ flex: 1 }}>
                  <div style={{ color: G.text, fontWeight: 600, fontSize: 14 }}>{emp?.name}</div>
                  <div style={{ color: G.muted, fontSize: 12, marginBottom: 8 }}>{emp?.position} · {emp?.department}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge label={`${emp?.onboardingProgress || 0}%`} color={G.cyan}/>
                    <Badge label={`${et.filter(t => t.status === "completed").length} completed`} color={G.green}/>
                    <Badge label={`${et.length} total`} color={G.orange}/>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <PremiumBtn variant="solid" style={{ borderRadius: 12, padding: "12px 28px" }} onClick={generate} disabled={!selected || generating}>
          {generating ? "Generating..." : "📄 Download Report"}
        </PremiumBtn>
        <p style={{ color: G.muted, fontSize: 11, marginTop: 10, fontFamily: G.body }}>Opens in browser — print as PDF using Ctrl+P</p>
      </div>

      {/* All Employees */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontFamily: G.font, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>All Employees</h2>
        {employees.length === 0 ? <EmptyState icon="👥" title="No employees" subtitle="Add employees first"/> :
          employees.map((emp, i) => {
            const et = tasks.filter(t => t.assignedTo?._id === emp._id);
            return (
              <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: G.glass, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 8, animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
                <Avatar name={emp.name || "?"} size={34}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: G.text, fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
                  <ProgressBar value={emp.onboardingProgress || 0} height={4}/>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge label={`${emp.onboardingProgress || 0}%`} color={G.cyan}/>
                  <Badge label={`${et.filter(t => t.status === "completed").length}/${et.length}`} color={G.green}/>
                </div>
                <PremiumBtn size="sm" variant="ghost" onClick={() => { setSelected(emp._id); generate(); }}>📄</PremiumBtn>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "🏠" },
  { key: "employees", label: "Employees", icon: "👥", admin: true },
  { key: "tasks", label: "Tasks", icon: "📋" },
  { key: "workflows", label: "Workflows", icon: "🔄", admin: true },
  { key: "analytics", label: "Analytics", icon: "📊", admin: true },
  { key: "leaderboard", label: "Leaderboard", icon: "🏆" },
  { key: "reports", label: "Reports", icon: "📄", admin: true },
];

function Layout({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  useEffect(() => {
    const isAdmin = user.role === "admin" || user.role === "hr";
    Promise.all([
      api.getTasks(),
      isAdmin ? api.getEmployees() : Promise.resolve({ data: [] }),
    ]).then(([tr, er]) => {
      setTasks(tr.data);
      setEmployees(er.data);
    }).catch(() => addToast("Failed to load data", "error"))
      .finally(() => setLoading(false));
  }, []);

  const navItems = NAV.filter(n => !n.admin || user.role === "admin" || user.role === "hr");

  const pageProps = { user, employees, setEmployees, tasks, setTasks, addToast };

  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex" }}>
      <CustomCursor/>

      {/* Ambient Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${G.cyan}05, transparent 70%)`, filter: "blur(60px)" }}/>
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${G.purple}05, transparent 70%)`, filter: "blur(60px)" }}/>
      </div>

      {/* Desktop Sidebar */}
      <div className="sidebar" style={{ width: 220, background: "rgba(8,13,20,0.95)", backdropFilter: "blur(20px)", borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 100 }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${G.cyan}22, ${G.purple}22)`, border: `1px solid ${G.cyan}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontFamily: G.font, fontSize: 16, fontWeight: 800 }} className="gradient-text">OnboardIQ</div>
              <div style={{ color: G.muted, fontSize: 10, fontFamily: G.mono }}>v2.0 premium</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 12px", overflow: "auto" }} className="thin-scroll">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setPage(item.key)} className={`nav-item ${page === item.key ? "active" : ""}`}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: "14px 12px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: G.glass, border: `1px solid ${G.border}`, borderRadius: 12, marginBottom: 10 }}>
            <Avatar name={user.name || "U"} size={32}/>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: G.text, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: G.body }}>{user.name}</div>
              <div style={{ color: G.muted, fontSize: 10, textTransform: "capitalize", fontFamily: G.mono }}>{user.role}</div>
            </div>
          </div>
          <PremiumBtn variant="danger" style={{ width: "100%", borderRadius: 10, padding: "9px" }} onClick={onLogout}>
            Sign Out
          </PremiumBtn>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-wrap" style={{ marginLeft: 220, flex: 1, padding: "28px 28px 40px", maxWidth: "calc(100vw - 220px)", position: "relative", zIndex: 1 }}>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 24 }}/>
            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100, flex: 1, borderRadius: 16 }}/>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
              {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 20 }}/>)}
            </div>
          </div>
        ) : (
          <>
            {page === "dashboard" && <Dashboard {...pageProps}/>}
            {page === "employees" && <EmployeesPage {...pageProps}/>}
            {page === "tasks" && <TasksPage {...pageProps}/>}
            {page === "workflows" && <WorkflowsPage {...pageProps}/>}
            {page === "analytics" && <AnalyticsPage {...pageProps}/>}
            {page === "leaderboard" && <LeaderboardPage {...pageProps}/>}
            {page === "reports" && <ReportsPage {...pageProps}/>}
          </>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav" style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {navItems.slice(0, 5).map(item => (
          <button key={item.key} onClick={() => setPage(item.key)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 12px", background: "transparent", border: "none", color: page === item.key ? G.cyan : G.muted, transition: "all 0.2s ease" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontFamily: G.body, fontWeight: page === item.key ? 600 : 400 }}>{item.label}</span>
            {page === item.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: G.cyan, boxShadow: `0 0 6px ${G.cyan}` }}/>}
          </button>
        ))}
      </div>

      <ToastContainer toasts={toasts}/>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };

  return (
    <>
      <style>{CSS}</style>
      {user ? <Layout user={user} onLogout={logout}/> : <LoginPage onLogin={setUser}/>}
    </>
  );
}
