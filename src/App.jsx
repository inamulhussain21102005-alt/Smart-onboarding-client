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

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  cyber: { name:"Cyber Dark", icon:"🌑", bg:"#000000", surface:"#0a0a0f", card:"#0d0d1a", border:"#1a1a2e", primary:"#00f5ff", secondary:"#bf00ff", accent:"#00ff41", orange:"#ffaa00", red:"#ff0040", text:"#e0e0ff", muted:"#444466", font:"'Orbitron',monospace", body:"'Rajdhani',sans-serif" },
  light: { name:"Clean Light", icon:"☀️", bg:"#f8fafc", surface:"#ffffff", card:"#ffffff", border:"#e2e8f0", primary:"#0ea5e9", secondary:"#8b5cf6", accent:"#22c55e", orange:"#f59e0b", red:"#ef4444", text:"#0f172a", muted:"#94a3b8", font:"'Orbitron',monospace", body:"'Rajdhani',sans-serif" },
  hacker: { name:"Hacker", icon:"💚", bg:"#000000", surface:"#001400", card:"#001a00", border:"#003300", primary:"#00ff41", secondary:"#00cc33", accent:"#00ff41", orange:"#88ff00", red:"#ff4400", text:"#00ff41", muted:"#005500", font:"'Courier New',monospace", body:"'Courier New',monospace" },
  purple: { name:"Purple Night", icon:"💜", bg:"#0a0010", surface:"#100020", card:"#150028", border:"#2d1050", primary:"#a855f7", secondary:"#ec4899", accent:"#06b6d4", orange:"#f59e0b", red:"#ef4444", text:"#f3e8ff", muted:"#6b21a8", font:"'Orbitron',monospace", body:"'Rajdhani',sans-serif" },
  ocean: { name:"Deep Ocean", icon:"🌊", bg:"#020c18", surface:"#041830", card:"#051e38", border:"#0a3060", primary:"#38bdf8", secondary:"#818cf8", accent:"#34d399", orange:"#fb923c", red:"#f87171", text:"#e0f2fe", muted:"#1e4060", font:"'Orbitron',monospace", body:"'Rajdhani',sans-serif" },
  sunset: { name:"Sunset", icon:"🌅", bg:"#1a0a00", surface:"#2a1200", card:"#341800", border:"#4a2200", primary:"#fb923c", secondary:"#f43f5e", accent:"#facc15", orange:"#fb923c", red:"#f43f5e", text:"#fef3e2", muted:"#7c3a00", font:"'Orbitron',monospace", body:"'Rajdhani',sans-serif" },
};

// ─── FONT SIZES ───────────────────────────────────────────────────────────────
const FONT_SIZES = { small: { base: 12, title: 18, stat: 22 }, medium: { base: 14, title: 22, stat: 26 }, large: { base: 16, title: 26, stat: 30 } };

// ─── SOUND ────────────────────────────────────────────────────────────────────
const playSound = (type, enabled = true) => {
  if (!enabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {
      success: () => { [523,659,784].forEach((f,i) => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.value=f; g.gain.setValueAtTime(0.2,ctx.currentTime+i*0.1); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.1+0.3); o.start(ctx.currentTime+i*0.1); o.stop(ctx.currentTime+i*0.1+0.3); }); },
      error: () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.type='square';o.connect(g);g.connect(ctx.destination); o.frequency.setValueAtTime(300,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(100,ctx.currentTime+0.3); g.gain.setValueAtTime(0.15,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); o.start();o.stop(ctx.currentTime+0.3); },
      click: () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.value=800; g.gain.setValueAtTime(0.06,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.05); o.start();o.stop(ctx.currentTime+0.05); },
      mission: () => { [523,659,784,1047].forEach((f,i) => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.value=f; g.gain.setValueAtTime(0.25,ctx.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.12+0.3); o.start(ctx.currentTime+i*0.12); o.stop(ctx.currentTime+i*0.12+0.3); }); },
      deploy: () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.type='sawtooth';o.connect(g);g.connect(ctx.destination); o.frequency.setValueAtTime(200,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(600,ctx.currentTime+0.2); g.gain.setValueAtTime(0.15,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); o.start();o.stop(ctx.currentTime+0.3); },
      notify: () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.setValueAtTime(880,ctx.currentTime); o.frequency.setValueAtTime(1100,ctx.currentTime+0.1); g.gain.setValueAtTime(0.1,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2); o.start();o.stop(ctx.currentTime+0.2); },
    };
    sounds[type]?.();
  } catch(e) {}
};

// ─── DEFAULT SETTINGS ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  theme: 'cyber',
  fontSize: 'medium',
  soundEnabled: true,
  animationsEnabled: true,
  compactMode: false,
  language: 'english',
  showGreeting: true,
  notificationsEnabled: true,
  autoRefresh: false,
  showActivityFeed: true,
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const catIcon = { documentation:"📄", training:"📚", setup:"⚙️", meeting:"🤝", other:"📌" };

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const makeCSS = (G, settings) => `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
  body { background:${G.bg}; color:${G.text}; font-family:${G.body}; font-size:${FONT_SIZES[settings.fontSize].base}px; overflow-x:hidden; transition:background 0.4s ease,color 0.4s ease; -webkit-font-smoothing:antialiased; }
  ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:${G.primary}44;border-radius:10px;}
  input,select,textarea,button{font-family:${G.body};font-size:inherit;}
  button{cursor:pointer;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(${settings.animationsEnabled?'18px':'0'})}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideLeft{from{opacity:0;transform:translateX(${settings.animationsEnabled?'-18px':'0'})}to{opacity:1;transform:translateX(0)}}
  @keyframes slideRight{from{opacity:0;transform:translateX(${settings.animationsEnabled?'18px':'0'})}to{opacity:1;transform:translateX(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(${settings.animationsEnabled?'0.92':'1'})}to{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(${settings.animationsEnabled?'-7px':'0'})}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
  @keyframes glitch{0%,100%{text-shadow:2px 0 ${G.primary},-2px 0 ${G.secondary}}25%{text-shadow:-2px 0 ${G.primary},2px 0 ${G.secondary};transform:translateX(2px)}75%{text-shadow:2px 0 ${G.secondary},-2px 0 ${G.primary};transform:translateX(-2px)}}
  @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
  @keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  @keyframes toast-in{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes countUp{from{opacity:0;transform:scale(0.7) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes progFill{from{width:0}to{width:var(--w)}}
  @keyframes skelShimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
  @keyframes missionPop{0%{transform:scale(1)}30%{transform:scale(1.3)}60%{transform:scale(0.95)}100%{transform:scale(1)}}
  @keyframes confetti{0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--tr));opacity:0}}
  @keyframes ripple{to{transform:scale(4);opacity:0}}
  @keyframes borderGlow{0%,100%{box-shadow:0 0 5px ${G.primary}22}50%{box-shadow:0 0 20px ${G.primary}55}}
  @keyframes overlayIn{from{opacity:0}to{opacity:1}}
  @keyframes modalIn{from{opacity:0;transform:scale(0.92) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes activityIn{from{transform:translateX(-8px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes settingSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}

  .glass-card{background:${G.card};backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid ${G.border};border-radius:${settings.compactMode?'12px':'16px'};transition:all 0.3s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden;}
  .glass-card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 50%);pointer-events:none;}
  .glass-card:hover{border-color:${G.primary}33;transform:translateY(${settings.animationsEnabled?'-4px':'0'});box-shadow:0 16px 50px rgba(0,0,0,0.4),0 0 20px ${G.primary}11;}

  .btn-p{position:relative;overflow:hidden;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);font-weight:700;letter-spacing:0.5px;cursor:pointer;border:none;}
  .btn-p::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.1),transparent);opacity:0;transition:opacity 0.25s ease;}
  .btn-p:hover::after{opacity:1;}
  .btn-p:hover{transform:${settings.animationsEnabled?'translateY(-2px)':'none'};}
  .btn-p:active{transform:scale(0.97);}

  .ripple-fx{position:absolute;border-radius:50%;background:rgba(255,255,255,0.25);transform:scale(0);animation:ripple 0.6s linear;pointer-events:none;}

  .skeleton{background:linear-gradient(90deg,${G.surface} 25%,${G.border} 50%,${G.surface} 75%);background-size:200px 100%;animation:skelShimmer 1.5s infinite;border-radius:8px;}

  .nav-item{display:flex;align-items:center;gap:10px;padding:${settings.compactMode?'8px 10px':'10px 12px'};border-radius:10px;border:none;background:transparent;color:${G.muted};cursor:pointer;font-family:${G.font};font-size:${settings.compactMode?'10px':'11px'};font-weight:700;letter-spacing:1px;transition:all 0.25s ease;width:100%;text-align:left;position:relative;overflow:hidden;}
  .nav-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,${G.primary}22,transparent);transition:width 0.3s ease;border-radius:inherit;}
  .nav-item:hover{color:${G.text};background:${G.primary}08;}
  .nav-item:hover::before{width:100%;}
  .nav-item.active{color:${G.primary};background:${G.primary}11;border-left:3px solid ${G.primary};}

  .p-input{width:100%;background:${G.surface};border:1px solid ${G.border};border-radius:10px;padding:${settings.compactMode?'9px 12px':'11px 14px'};color:${G.text};font-size:${FONT_SIZES[settings.fontSize].base}px;font-family:${G.body};outline:none;transition:all 0.3s ease;box-sizing:border-box;}
  .p-input:focus{border-color:${G.primary}55;background:${G.bg};box-shadow:0 0 0 3px ${G.primary}11;}
  .p-input::placeholder{color:${G.muted};}

  .prog-track{height:6px;border-radius:10px;background:rgba(255,255,255,0.06);overflow:hidden;position:relative;}
  .prog-fill{height:100%;border-radius:10px;animation:progFill 1s cubic-bezier(0.4,0,0.2,1) forwards;position:relative;}
  .prog-fill::after{content:'';position:absolute;right:0;top:50%;transform:translateY(-50%);width:8px;height:8px;border-radius:50%;background:inherit;box-shadow:0 0 6px currentColor;}

  .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;white-space:nowrap;font-family:${G.font};transition:all 0.2s ease;}

  .g-text{background:linear-gradient(135deg,${G.primary},${G.secondary},${G.primary});background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradShift 4s ease infinite;}

  .stat-card{animation:scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;transition:all 0.3s ease;}
  .stat-card:hover{transform:${settings.animationsEnabled?'translateY(-5px) scale(1.02)':'none'};}

  .task-card{transition:all 0.3s cubic-bezier(0.4,0,0.2,1);animation:fadeUp 0.4s ease both;}
  .task-card:hover{transform:${settings.animationsEnabled?'translateX(5px)':'none'};}

  .thin-scroll::-webkit-scrollbar{width:3px;}
  .thin-scroll::-webkit-scrollbar-thumb{background:${G.primary}22;border-radius:10px;}

  /* ── TOGGLE SWITCH ── */
  .toggle{position:relative;width:44px;height:24px;flex-shrink:0;}
  .toggle input{opacity:0;width:0;height:0;}
  .toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${G.border};border-radius:24px;transition:0.3s;}
  .toggle-slider::before{position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background:${G.muted};border-radius:50%;transition:0.3s;}
  .toggle input:checked + .toggle-slider{background:${G.primary};}
  .toggle input:checked + .toggle-slider::before{transform:translateX(20px);background:#fff;}

  /* ── MOBILE ── */
  .mobile-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:100;background:${G.surface}f0;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid ${G.border};padding:6px 0 max(6px,env(safe-area-inset-bottom));}
  .mobile-header{display:none;position:fixed;top:0;left:0;right:0;z-index:100;background:${G.surface}f0;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid ${G.border};padding:10px 16px;align-items:center;justify-content:space-between;}

  @media(max-width:768px){
    .desktop-sidebar{display:none!important;}
    .mobile-bottom-nav{display:flex!important;}
    .mobile-header{display:flex!important;}
    .main-wrap{margin-left:0!important;max-width:100vw!important;padding:70px 14px 90px!important;}
    .stat-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;}
    .two-col{grid-template-columns:1fr!important;}
    .emp-grid{grid-template-columns:1fr!important;}
    .form-grid{grid-template-columns:1fr!important;}
    .page-title{font-size:18px!important;}
    .hide-mobile{display:none!important;}
    .show-mobile{display:flex!important;}
    .mobile-full{width:100%!important;}
    .glass-card{border-radius:12px!important;}
    .p-input{font-size:16px!important;padding:12px 14px!important;}
    button{min-height:40px;}
    .task-actions{flex-direction:column!important;align-items:flex-start!important;}
  }
  @media(min-width:769px){
    .mobile-bottom-nav{display:none!important;}
    .mobile-header{display:none!important;}
  }
  @media(max-width:400px){
    .stat-row{grid-template-columns:1fr!important;}
    .badge{font-size:8px!important;}
  }
`;

// ─── RIPPLE ───────────────────────────────────────────────────────────────────
function useRipple() {
  return useCallback((e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple-fx';
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);
}

// ─── ANIMATED NUMBER ──────────────────────────────────────────────────────────
function AnimNum({ value, enabled }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!enabled) { setD(parseInt(value) || 0); return; }
    let s = 0; const e = parseInt(value) || 0;
    const step = Math.ceil(e / 20);
    const t = setInterval(() => { s = Math.min(s + step, e); setD(s); if (s >= e) clearInterval(t); }, 40);
    return () => clearInterval(t);
  }, [value]);
  return <span style={{ animation: enabled ? "countUp 0.5s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}>{d}</span>;
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function SkCard() {
  return (
    <div className="glass-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}><div className="skeleton" style={{ height: 13, width: "70%", marginBottom: 7 }} /><div className="skeleton" style={{ height: 10, width: "45%" }} /></div>
      </div>
      <div className="skeleton" style={{ height: 5, marginBottom: 9 }} />
      <div style={{ display: "flex", gap: 5 }}><div className="skeleton" style={{ height: 18, width: 55, borderRadius: 20 }} /><div className="skeleton" style={{ height: 18, width: 70, borderRadius: 20 }} /></div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function ToastBox({ toasts, G }) {
  const colors = { success: G.accent, error: G.red, info: G.primary, warning: G.orange };
  const icons = { success: "✓", error: "✕", info: "⚡", warning: "⚠" };
  return (
    <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => {
        const c = colors[t.type] || G.primary;
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: G.surface, border: `1px solid ${c}44`, borderRadius: 12, boxShadow: `0 8px 28px rgba(0,0,0,0.5),0 0 16px ${c}22`, animation: "toast-in 0.4s cubic-bezier(0.34,1.56,0.64,1)", minWidth: 220, maxWidth: 300 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${c}22`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontSize: 10, fontWeight: 700, flexShrink: 0, border: `1px solid ${c}44` }}>{icons[t.type]}</div>
            <span style={{ color: G.text, fontSize: 13, fontFamily: G.body, flex: 1 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MISSION COMPLETE ─────────────────────────────────────────────────────────
function MissionComplete({ show, onClose, name, G, animated }) {
  const confetti = [...Array(28)].map((_, i) => ({ id: i, color: [G.primary, G.secondary, G.accent, G.orange, "#ec4899"][i % 5], tx: `${(Math.random() - 0.5) * 380}px`, ty: `${Math.random() * -280 - 80}px`, tr: `${(Math.random() - 0.5) * 720}deg`, size: 4 + Math.random() * 7, delay: Math.random() * 0.4 }));
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", animation: "overlayIn 0.3s ease", padding: 20 }}>
      <div style={{ position: "relative", textAlign: "center", animation: animated ? "modalIn 0.5s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}>
        {animated && confetti.map(c => <div key={c.id} style={{ position: "absolute", top: "50%", left: "50%", width: c.size, height: c.size, background: c.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px", "--tx": c.tx, "--ty": c.ty, "--tr": c.tr, animation: `confetti 1.5s ease ${c.delay}s forwards` }} />)}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 68, marginBottom: 12, animation: animated ? "missionPop 0.6s ease, float 3s ease-in-out 0.6s infinite" : "none" }}>🏆</div>
          <div style={{ fontFamily: G.font, fontSize: 26, fontWeight: 900, color: G.accent, animation: animated ? "glitch 0.5s ease infinite" : "none", letterSpacing: 3, marginBottom: 7 }}>MISSION COMPLETE!</div>
          {name && <div style={{ color: G.muted, fontSize: 13, marginBottom: 7 }}>{name}</div>}
          <div style={{ color: G.orange, fontSize: 16, fontFamily: G.font, fontWeight: 700, marginBottom: 18 }}>+100 XP EARNED</div>
          <div style={{ color: G.muted, fontSize: 11 }}>Tap anywhere to continue</div>
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ show, message, onConfirm, onCancel, G }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 9997, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "overlayIn 0.3s ease" }}>
      <div className="glass-card" style={{ padding: 26, maxWidth: 340, width: "100%", animation: "modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)", border: `1px solid ${G.red}33` }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontFamily: G.font, fontSize: 13, fontWeight: 700, marginBottom: 7 }}>Are you sure?</div>
          <div style={{ color: G.muted, fontSize: 13, lineHeight: 1.6 }}>{message}</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <GBtn onClick={onCancel} G={G} color={G.muted} style={{ flex: 1 }}>Cancel</GBtn>
          <GBtn onClick={onConfirm} G={G} color={G.red} style={{ flex: 1 }}>Delete</GBtn>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
function NotifsPanel({ show, onClose, notifications, clearAll, G }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={onClose}>
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: Math.min(300, window.innerWidth - 20), background: G.surface, border: `1px solid ${G.border}`, borderLeft: `1px solid ${G.primary}33`, display: "flex", flexDirection: "column", animation: "slideRight 0.3s ease", boxShadow: `-4px 0 20px rgba(0,0,0,0.3)` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "16px 14px", borderBottom: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 16, background: G.primary, borderRadius: 2 }} />
            <h2 style={{ fontFamily: G.font, color: G.primary, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>ALERTS</h2>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {notifications.length > 0 && <GBtn size="sm" G={G} color={G.red} onClick={clearAll}>Clear</GBtn>}
            <button onClick={onClose} style={{ background: `${G.red}15`, border: `1px solid ${G.red}33`, color: G.red, borderRadius: 6, width: 26, height: 26, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 10 }} className="thin-scroll">
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: G.muted }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
              <div style={{ fontFamily: G.font, fontSize: 10, letterSpacing: 2 }}>NO ALERTS</div>
            </div>
          ) : notifications.map((n, i) => (
            <div key={n.id} style={{ background: G.card, border: `1px solid ${n.type === "success" ? G.accent : n.type === "error" ? G.red : G.primary}22`, borderRadius: 9, padding: "9px 11px", marginBottom: 6, animation: `activityIn 0.3s ease ${i * 0.04}s both` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 12 }}>{n.type === "success" ? "✅" : n.type === "error" ? "❌" : "⚡"}</span>
                <span style={{ color: G.muted, fontSize: 9, fontFamily: G.font, marginLeft: "auto" }}>{n.time}</span>
              </div>
              <div style={{ color: G.text, fontSize: 12 }}>{n.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
function ActivityFeed({ activities, G }) {
  const typeIcon = { task_complete: "✅", task_start: "▶️", task_create: "📋", employee_add: "👤", employee_remove: "🗑️", workflow_assign: "🔄", system: "⚡" };
  return (
    <div className="glass-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 13, background: G.orange, borderRadius: 2 }} />
        <h2 style={{ fontFamily: G.font, color: G.text, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>ACTIVITY</h2>
        <div style={{ marginLeft: "auto", background: `${G.accent}15`, color: G.accent, border: `1px solid ${G.accent}33`, borderRadius: 8, padding: "1px 6px", fontSize: 7, fontFamily: G.font, fontWeight: 700 }}>LIVE</div>
      </div>
      <div style={{ maxHeight: 200, overflow: "auto" }} className="thin-scroll">
        {activities.length === 0 ? <div style={{ color: G.muted, textAlign: "center", padding: 16, fontFamily: G.font, fontSize: 10, letterSpacing: 2 }}>NO ACTIVITY YET</div> :
          activities.map((a, i) => (
            <div key={a.id} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: `1px solid ${G.border}`, animation: `activityIn 0.3s ease ${i * 0.04}s both` }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${G.primary}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>{typeIcon[a.type] || "⚡"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.message}</div>
                <div style={{ color: G.muted, fontSize: 9, marginTop: 1 }}>{a.time}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function GBtn({ children, onClick, G, color, size = "md", style = {}, disabled = false }) {
  const ripple = useRipple();
  const c = color || G.primary;
  const pad = { sm: "5px 11px", md: "8px 16px", lg: "11px 0" };
  return (
    <button className="btn-p" disabled={disabled} onClick={(e) => { ripple(e); if (!disabled) onClick?.(e); }}
      style={{ background: `${c}18`, color: disabled ? G.muted : c, border: `1px solid ${disabled ? G.border : c + "44"}`, borderRadius: 9, padding: pad[size], fontSize: size === "sm" ? 10 : 11, opacity: disabled ? 0.5 : 1, width: size === "lg" ? "100%" : "auto", fontFamily: G.font, fontWeight: 700, letterSpacing: 0.5, ...style }}>
      {children}
    </button>
  );
}

function SBtn({ children, onClick, G, size = "md", style = {}, disabled = false }) {
  const ripple = useRipple();
  const pad = { sm: "6px 14px", md: "10px 20px", lg: "11px 0" };
  return (
    <button className="btn-p" disabled={disabled} onClick={(e) => { ripple(e); if (!disabled) onClick?.(e); }}
      style={{ background: `linear-gradient(135deg,${G.primary},${G.secondary})`, color: "#fff", border: "none", borderRadius: 9, padding: pad[size], fontSize: size === "sm" ? 11 : 12, fontWeight: 700, boxShadow: `0 4px 18px ${G.primary}44`, opacity: disabled ? 0.5 : 1, width: size === "lg" ? "100%" : "auto", fontFamily: G.font, letterSpacing: 0.5, ...style }}>
      {children}
    </button>
  );
}

function Avt({ name, size = 40, G }) {
  const colors = [G.primary, G.secondary, G.accent, G.orange, G.red];
  const c = colors[(name || "?").charCodeAt(0) % colors.length];
  return <div style={{ width: size, height: size, borderRadius: size * 0.26, background: `${c}22`, border: `1.5px solid ${c}55`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontWeight: 900, fontSize: size * 0.38, fontFamily: G.font, flexShrink: 0, boxShadow: `0 0 8px ${c}22`, transition: "all 0.3s ease" }}>{(name || "?")[0]}</div>;
}

function Bdg({ label, color }) {
  return <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}>{label}</span>;
}

function PBar({ value, G, height = 6, color }) {
  const c = color || (value === 100 ? G.accent : value > 60 ? G.primary : value > 30 ? G.orange : G.red);
  return <div className="prog-track" style={{ height }}><div className="prog-fill" style={{ "--w": `${value || 0}%`, background: `linear-gradient(90deg,${c}88,${c})`, boxShadow: `0 0 5px ${c}66`, color: c }} /></div>;
}

function EmptyState({ icon, title, subtitle, G }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 16px", animation: "fadeUp 0.5s ease" }}>
      <div style={{ fontSize: 40, marginBottom: 11, animation: "float 3s ease-in-out infinite" }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: G?.text }}>{title}</div>
      <div style={{ fontSize: 12, color: G?.muted }}>{subtitle}</div>
    </div>
  );
}

function PageHdr({ title, subtitle, G, action, fs }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <div>
        <h1 className="page-title g-text" style={{ fontFamily: G.font, fontSize: fs || 22, fontWeight: 900, letterSpacing: 2, marginBottom: 2 }}>{title}</h1>
        {subtitle && <p style={{ color: G.muted, fontSize: 12 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCrd({ icon, label, value, color, G, delay = 0, settings }) {
  return (
    <div className="glass-card stat-card" style={{ padding: settings?.compactMode ? "14px 16px" : "18px 20px", flex: 1, minWidth: 100, animationDelay: `${delay}s` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 20 }}>{icon}</div>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div style={{ fontFamily: G.font, fontSize: FONT_SIZES[settings?.fontSize || 'medium'].stat, fontWeight: 900, color, marginBottom: 3, lineHeight: 1 }}>
        <AnimNum value={value} enabled={settings?.animationsEnabled !== false} />
      </div>
      <div style={{ color: G.muted, fontSize: 11, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── TOGGLE COMPONENT ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange, G }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ settings, setSettings, G, user, addToast }) {
  const save = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    addToast("Settings saved!", "success");
  };

  const Section = ({ title, children }) => (
    <div className="glass-card" style={{ padding: 22, marginBottom: 14, animation: "settingSlide 0.4s ease" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, paddingBottom: 12, borderBottom: `1px solid ${G.border}` }}>
        <div style={{ width: 3, height: 16, background: G.primary, borderRadius: 2 }} />
        <h2 style={{ fontFamily: G.font, color: G.primary, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>{title}</h2>
      </div>
      {children}
    </div>
  );

  const SettingRow = ({ label, subtitle, children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${G.border}` }}>
      <div style={{ flex: 1, paddingRight: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</div>
        {subtitle && <div style={{ fontSize: 11, color: G.muted }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHdr title="Settings" subtitle="Customize your experience" G={G} />

      {/* 🎨 Theme */}
      <Section title="🎨 APPEARANCE">
        <SettingRow label="Theme" subtitle="Choose your preferred color scheme">
          <div />
        </SettingRow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8, marginTop: 12 }}>
          {Object.entries(THEMES).map(([key, theme]) => (
            <button key={key} onClick={() => save('theme', key)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: settings.theme === key ? `${G.primary}22` : G.surface, border: `2px solid ${settings.theme === key ? G.primary : G.border}`, borderRadius: 10, cursor: "pointer", color: settings.theme === key ? G.primary : G.muted, transition: "all 0.2s", fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
              <span style={{ fontSize: 18 }}>{theme.icon}</span>
              <span>{theme.name}</span>
              {settings.theme === key && <span style={{ marginLeft: "auto", color: G.accent }}>✓</span>}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <SettingRow label="Font Size" subtitle="Adjust text size for comfort">
            <div style={{ display: "flex", gap: 6 }}>
              {["small", "medium", "large"].map(s => (
                <button key={s} onClick={() => save('fontSize', s)}
                  style={{ padding: "5px 12px", background: settings.fontSize === s ? `${G.primary}22` : G.surface, border: `1px solid ${settings.fontSize === s ? G.primary : G.border}`, borderRadius: 7, color: settings.fontSize === s ? G.primary : G.muted, cursor: "pointer", fontSize: 10, fontFamily: G.font, fontWeight: 700, textTransform: "capitalize", transition: "all 0.2s" }}>
                  {s === "small" ? "S" : s === "medium" ? "M" : "L"}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        <SettingRow label="Compact Mode" subtitle="Reduce spacing for more content">
          <Toggle checked={settings.compactMode} onChange={e => save('compactMode', e.target.checked)} G={G} />
        </SettingRow>
      </Section>

      {/* ⚡ Animations & Sound */}
      <Section title="⚡ ANIMATIONS & SOUND">
        <SettingRow label="Animations" subtitle="Enable smooth transitions and effects">
          <Toggle checked={settings.animationsEnabled} onChange={e => save('animationsEnabled', e.target.checked)} G={G} />
        </SettingRow>
        <SettingRow label="Sound Effects" subtitle="Play sounds on actions">
          <Toggle checked={settings.soundEnabled} onChange={e => save('soundEnabled', e.target.checked)} G={G} />
        </SettingRow>
        {settings.soundEnabled && (
          <div style={{ padding: "10px 0" }}>
            <div style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>Test sounds:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[["Success", "success"], ["Click", "click"], ["Mission", "mission"], ["Deploy", "deploy"]].map(([label, type]) => (
                <GBtn key={type} size="sm" G={G} color={G.primary} onClick={() => playSound(type, true)}>{label}</GBtn>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* 🔔 Notifications */}
      <Section title="🔔 NOTIFICATIONS">
        <SettingRow label="Notifications" subtitle="Show in-app notifications">
          <Toggle checked={settings.notificationsEnabled} onChange={e => save('notificationsEnabled', e.target.checked)} G={G} />
        </SettingRow>
        <SettingRow label="Activity Feed" subtitle="Show live activity on dashboard">
          <Toggle checked={settings.showActivityFeed} onChange={e => save('showActivityFeed', e.target.checked)} G={G} />
        </SettingRow>
        <SettingRow label="Time Greeting" subtitle={`Show "Good morning/evening" greeting`}>
          <Toggle checked={settings.showGreeting} onChange={e => save('showGreeting', e.target.checked)} G={G} />
        </SettingRow>
      </Section>

      {/* 👤 Account */}
      <Section title="👤 ACCOUNT">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${G.border}` }}>
          <Avt name={user.name || "U"} size={48} G={G} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{user.name}</div>
            <div style={{ color: G.muted, fontSize: 12 }}>{user.email}</div>
            <Bdg label={user.role} color={G.primary} />
          </div>
        </div>
        <div style={{ padding: "12px 0" }}>
          <div style={{ fontSize: 11, color: G.muted, marginBottom: 10 }}>Your account details are managed by your administrator.</div>
          <GBtn G={G} color={G.orange} onClick={() => addToast("Contact your admin to change password", "info")}>Change Password</GBtn>
        </div>
      </Section>

      {/* 🔄 Reset */}
      <Section title="🔄 RESET">
        <SettingRow label="Reset All Settings" subtitle="Restore default settings">
          <GBtn G={G} color={G.red} onClick={() => {
            setSettings(DEFAULT_SETTINGS);
            localStorage.setItem('appSettings', JSON.stringify(DEFAULT_SETTINGS));
            addToast("Settings reset to default!", "info");
          }}>Reset</GBtn>
        </SettingRow>
      </Section>

      <div style={{ padding: "16px 0", textAlign: "center", color: G.muted, fontSize: 11, fontFamily: G.font, letterSpacing: 1 }}>
        ONBOARDIQ v2.0 PREMIUM · SETTINGS ARE SAVED AUTOMATICALLY
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const G = THEMES.cyber;
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const pwRef = useRef(null);

  // Prevent autofill
  useEffect(() => {
    if (emailRef.current) emailRef.current.value = "";
    if (pwRef.current) pwRef.current.value = "";
    setTimeout(() => { setEmail(""); setPw(""); }, 100);
  }, []);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !pw) { setErr("Please fill all fields"); return; }
    setLoading(true); setErr("");
    try {
      const { data } = await api.login({ email, password: pw });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      playSound('success');
      onLogin(data);
    } catch (error) {
      setErr(error.response?.data?.message || "Invalid credentials");
      playSound('error');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <style>{makeCSS(G, DEFAULT_SETTINGS)}</style>
      <div style={{ position: "absolute", top: "15%", left: "15%", width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle,${G.primary}06,transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "15%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle,${G.secondary}06,transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />
      {[...Array(6)].map((_, i) => <div key={i} style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: i % 2 === 0 ? G.primary : G.secondary, opacity: 0.4, left: `${10 + i * 14}%`, top: `${20 + (i % 3) * 25}%`, animation: `float ${3 + i}s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }} />)}

      <div style={{ width: "100%", maxWidth: 400, position: "relative", animation: "fadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 54, height: 54, borderRadius: 15, background: `linear-gradient(135deg,${G.primary}22,${G.secondary}22)`, border: `1px solid ${G.primary}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 13px", animation: "float 3s ease-in-out infinite", boxShadow: `0 0 28px ${G.primary}22` }}>⚡</div>
          <h1 className="g-text" style={{ fontFamily: G.font, fontSize: 26, fontWeight: 900, letterSpacing: 3, marginBottom: 5 }}>OnboardIQ</h1>
          <p style={{ color: G.muted, fontSize: 10, letterSpacing: 3, fontFamily: G.font }}>SMART EMPLOYEE SYSTEM v2.0</p>
        </div>

        <div className="glass-card" style={{ padding: 26, border: `1px solid ${G.primary}22`, animation: "borderGlow 3s ease infinite" }}>
          <h2 style={{ fontFamily: G.font, fontSize: 12, fontWeight: 700, marginBottom: 18, letterSpacing: 2 }}>SYSTEM ACCESS</h2>
          {err && <div style={{ background: `${G.red}11`, border: `1px solid ${G.red}33`, borderRadius: 8, padding: "9px 12px", color: G.red, fontSize: 12, marginBottom: 12, animation: "fadeIn 0.3s ease" }}>{err}</div>}

          <form onSubmit={handle} autoComplete="off">
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 5, fontFamily: G.font, letterSpacing: 2, textTransform: "uppercase" }}>Email Address</label>
              <input
                ref={emailRef}
                className="p-input"
                type="email"
                name="login-email"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 5, fontFamily: G.font, letterSpacing: 2, textTransform: "uppercase" }}>Password</label>
              <input
                ref={pwRef}
                className="p-input"
                type="password"
                name="login-password"
                autoComplete="new-password"
                placeholder="Enter your password"
                value={pw}
                onChange={e => setPw(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-p"
              style={{ width: "100%", background: `linear-gradient(135deg,${G.primary},${G.secondary})`, color: "#fff", border: "none", borderRadius: 9, padding: "12px", fontFamily: G.font, fontSize: 11, fontWeight: 700, letterSpacing: 2, boxShadow: `0 8px 22px ${G.primary}44`, opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />INITIALIZING...</span>
                : "⚡ SIGN IN"
              }
            </button>
          </form>

          <div style={{ marginTop: 14, padding: 11, background: "rgba(255,255,255,0.02)", border: `1px solid ${G.border}`, borderRadius: 9 }}>
            <p style={{ color: G.muted, fontSize: 9, marginBottom: 4, fontFamily: G.font, letterSpacing: 2, textTransform: "uppercase" }}>Demo Account</p>
            <p style={{ color: G.primary + "99", fontSize: 12 }}>👑 admin@company.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, employees, tasks, activities, G, settings }) {
  const isAdmin = user.role === "admin" || user.role === "hr";
  const myTasks = tasks.filter(t => t.assignedTo?._id === user._id);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greetEmoji = hour < 12 ? "☀️" : hour < 17 ? "🌤️" : "🌙";
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.accent, overdue: G.red };
  const pC = { high: G.red, medium: G.orange, low: G.accent };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <div style={{ marginBottom: 20 }}>
        {settings.showGreeting && <p style={{ color: G.muted, fontSize: 12, marginBottom: 2 }}>{greeting}, {user.name?.split(" ")[0]} {greetEmoji}</p>}
        <h1 className="page-title g-text" style={{ fontFamily: G.font, fontSize: FONT_SIZES[settings.fontSize].title, fontWeight: 900, letterSpacing: 2 }}>
          {isAdmin ? "Command Center" : "My Dashboard"}
        </h1>
      </div>

      {isAdmin ? (
        <>
          <div className="stat-row" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            {[
              { icon: "👥", label: "Total Agents", value: employees.length, color: G.primary, delay: 0 },
              { icon: "🔄", label: "Onboarding", value: employees.filter(e => e.status === "onboarding").length, color: G.orange, delay: 0.1 },
              { icon: "✅", label: "Active", value: employees.filter(e => e.status === "active").length, color: G.accent, delay: 0.2 },
              { icon: "📋", label: "Pending", value: tasks.filter(t => t.status === "pending").length, color: G.red, delay: 0.3 },
              { icon: "🏆", label: "Done", value: tasks.filter(t => t.status === "completed").length, color: G.secondary, delay: 0.4 },
            ].map((s, i) => <StatCrd key={i} {...s} G={G} settings={settings} />)}
          </div>
          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12, marginBottom: 12 }}>
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                <div style={{ width: 3, height: 13, background: G.secondary, borderRadius: 2 }} />
                <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>AGENT PROGRESS</h2>
              </div>
              {employees.length === 0 ? <EmptyState icon="👥" title="No agents yet" subtitle="Add your first agent" G={G} /> :
                employees.map((emp, i) => (
                  <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                    <Avt name={emp.name} size={32} G={G} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</span>
                        <span style={{ color: G.primary, fontSize: 10, fontFamily: G.font, fontWeight: 700, flexShrink: 0, marginLeft: 5 }}>{emp.onboardingProgress || 0}%</span>
                      </div>
                      <PBar value={emp.onboardingProgress || 0} G={G} />
                    </div>
                  </div>
                ))
              }
            </div>
            {settings.showActivityFeed
              ? <ActivityFeed activities={activities} G={G} />
              : (
                <div className="glass-card" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 13, background: G.orange, borderRadius: 2 }} />
                    <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>RECENT MISSIONS</h2>
                  </div>
                  {tasks.slice(0, 5).map((t, i) => (
                    <div key={t._id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${G.border}` }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{catIcon[t.category]}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                      </div>
                      <Bdg label={t.status.replace("_", " ")} color={tC[t.status]} />
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </>
      ) : (
        <>
          <div className="glass-card" style={{ padding: 20, marginBottom: 14, background: `linear-gradient(135deg,${G.primary}08,${G.secondary}06)`, border: `1px solid ${G.primary}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
              <Avt name={user.name || "U"} size={50} G={G} />
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: G.font, fontSize: 15, fontWeight: 900, marginBottom: 2 }}>{user.name}</h2>
                <p style={{ color: G.muted, fontSize: 11, marginBottom: 9 }}>{user.department} · {user.position}</p>
                <PBar value={user.onboardingProgress || 0} G={G} />
                <p style={{ color: G.primary, fontSize: 10, fontFamily: G.font, marginTop: 4 }}>{user.onboardingProgress || 0}% MISSION PROGRESS</p>
              </div>
            </div>
          </div>
          <div className="stat-row" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <StatCrd icon="✅" label="Completed" value={myTasks.filter(t => t.status === "completed").length} color={G.accent} G={G} settings={settings} delay={0} />
            <StatCrd icon="⚡" label="In Progress" value={myTasks.filter(t => t.status === "in_progress").length} color={G.primary} G={G} settings={settings} delay={0.1} />
            <StatCrd icon="📋" label="Pending" value={myTasks.filter(t => t.status === "pending").length} color={G.orange} G={G} settings={settings} delay={0.2} />
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <div style={{ width: 3, height: 13, background: G.primary, borderRadius: 2 }} />
              <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>MY MISSIONS</h2>
            </div>
            {myTasks.length === 0 ? <EmptyState icon="🎯" title="No missions" subtitle="Your tasks will appear here" G={G} /> :
              myTasks.map((t, i) => (
                <div key={t._id} style={{ display: "flex", gap: 10, padding: 11, background: `${G.primary}05`, border: `1px solid ${G.border}`, borderRadius: 10, marginBottom: 8, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                  <span style={{ fontSize: 17, marginTop: 1 }}>{catIcon[t.category]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{t.title}</div>
                    <div style={{ color: G.muted, fontSize: 11, marginTop: 2 }}>{t.description}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                      <Bdg label={t.status.replace("_", " ")} color={tC[t.status]} />
                      <Bdg label={t.priority} color={pC[t.priority]} />
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

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
function EmployeesPage({ addToast, addActivity, employees, setEmployees, G, settings, sound }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", position: "", phone: "" });
  const sC = { active: G.accent, onboarding: G.orange, inactive: G.red };

  const filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const add = async () => {
    if (!form.name || !form.email || !form.password) { addToast("Fill required fields", "error"); return; }
    setLoading(true);
    try {
      const { data } = await api.addEmployee(form);
      setEmployees([...employees, data]);
      setForm({ name: "", email: "", password: "", department: "", position: "", phone: "" });
      setShowForm(false);
      addToast(`${form.name} deployed!`, "success");
      addActivity(`Agent ${form.name} deployed`, "employee_add");
      playSound('deploy', sound);
    } catch (err) { addToast(err.response?.data?.message || "Failed", "error"); }
    setLoading(false);
  };

  const remove = async () => {
    try {
      const emp = employees.find(e => e._id === confirm);
      await api.deleteEmployee(confirm);
      setEmployees(employees.filter(e => e._id !== confirm));
      addToast("Agent removed", "info");
      addActivity(`Agent ${emp?.name} removed`, "employee_remove");
      playSound('error', sound);
    } catch { addToast("Failed", "error"); }
    setConfirm(null);
  };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <ConfirmModal show={!!confirm} message="Permanently remove this agent from the system?" onConfirm={remove} onCancel={() => setConfirm(null)} G={G} />
      <PageHdr title="Agents" subtitle={`${employees.length} agents registered`} G={G}
        action={<SBtn G={G} onClick={() => setShowForm(!showForm)}>+ Deploy Agent</SBtn>} />

      {showForm && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 16, border: `1px solid ${G.accent}22`, animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <div style={{ width: 3, height: 13, background: G.accent, borderRadius: 2 }} />
            <h3 style={{ fontFamily: G.font, color: G.accent, fontSize: 10, letterSpacing: 2 }}>NEW AGENT</h3>
          </div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ k: "name", l: "Full Name *" }, { k: "email", l: "Email *", t: "email" }, { k: "password", l: "Password *", t: "password" }, { k: "department", l: "Department" }, { k: "position", l: "Position" }, { k: "phone", l: "Phone" }].map(f => (
              <div key={f.k}>
                <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 4, fontFamily: G.font, letterSpacing: 1 }}>{f.l}</label>
                <input className="p-input" type={f.t || "text"} placeholder={f.l.replace(" *", "")} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} autoComplete="off" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <GBtn G={G} color={G.accent} onClick={add} disabled={loading}>{loading ? "Deploying..." : "Confirm"}</GBtn>
            <GBtn G={G} color={G.muted} onClick={() => setShowForm(false)}>Cancel</GBtn>
          </div>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.muted, fontSize: 14 }}>🔍</span>
        <input className="p-input" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="emp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 11 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1" }}>
            <EmptyState icon={search ? "🔍" : "👥"} title={search ? "No results" : "No agents yet"} subtitle={search ? `No match for "${search}"` : 'Click "Deploy Agent" to start'} G={G} />
          </div>
        ) : filtered.map((emp, i) => (
          <div key={emp._id} className="glass-card" style={{ padding: 17, animation: `fadeUp 0.4s ease ${i * 0.06}s both`, position: "relative" }}>
            <button onClick={() => setConfirm(emp._id)}
              style={{ position: "absolute", top: 10, right: 10, width: 25, height: 25, borderRadius: 6, background: `${G.red}15`, border: `1px solid ${G.red}22`, color: G.red, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>×</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
              <Avt name={emp.name || "?"} size={40} G={G} />
              <div style={{ flex: 1, minWidth: 0, paddingRight: 18 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
                <div style={{ color: G.muted, fontSize: 11, marginTop: 1 }}>{emp.position || "No position"}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
              <Bdg label={emp.status || "onboarding"} color={sC[emp.status] || G.orange} />
              {emp.department && <Bdg label={emp.department} color={G.secondary} />}
            </div>
            <div style={{ marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: G.muted, fontSize: 10 }}>Progress</span>
                <span style={{ color: G.primary, fontSize: 10, fontFamily: G.font, fontWeight: 700 }}>{emp.onboardingProgress || 0}%</span>
              </div>
              <PBar value={emp.onboardingProgress || 0} G={G} />
            </div>
            {emp.phone && <div style={{ color: G.muted, fontSize: 10 }}>📱 {emp.phone}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function TasksPage({ user, tasks, setTasks, employees, addToast, addActivity, G, settings, sound }) {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [missionDone, setMissionDone] = useState(false);
  const [doneName, setDoneName] = useState("");
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", priority: "medium", category: "other", dueDate: "" });
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.accent, overdue: G.red };
  const pC = { high: G.red, medium: G.orange, low: G.accent };
  const isAdmin = user.role === "admin" || user.role === "hr";
  const visible = isAdmin ? tasks : tasks.filter(t => t.assignedTo?._id === user._id);
  const filtered = filter === "all" ? visible : visible.filter(t => t.status === filter);

  const getDL = (dueDate) => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Overdue", color: G.red };
    if (diff === 0) return { label: "Due today!", color: G.red };
    if (diff <= 2) return { label: `${diff}d left`, color: G.orange };
    return { label: `${diff}d left`, color: G.muted };
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.updateTask(id, { status });
      setTasks(tasks.map(t => t._id === id ? data : t));
      const task = tasks.find(t => t._id === id);
      if (status === "completed") {
        setDoneName(task?.assignedTo?.name || "");
        setMissionDone(true);
        addToast("Mission complete! +100 XP 🏆", "success");
        addActivity(`${task?.assignedTo?.name} completed "${task?.title}"`, "task_complete");
        playSound('mission', sound);
      } else {
        addToast("Status updated!", "info");
        addActivity(`Mission "${task?.title}" started`, "task_start");
        playSound('click', sound);
      }
    } catch { addToast("Failed", "error"); }
  };

  const addTask = async () => {
    if (!form.title || !form.assignedTo) { addToast("Fill required fields", "error"); return; }
    try {
      const { data } = await api.addTask(form);
      setTasks([...tasks, data]);
      const emp = employees.find(e => e._id === form.assignedTo);
      setForm({ title: "", description: "", assignedTo: "", priority: "medium", category: "other", dueDate: "" });
      setShowForm(false);
      addToast("Mission created!", "success");
      addActivity(`New mission → ${emp?.name || "agent"}`, "task_create");
      playSound('deploy', sound);
    } catch { addToast("Failed", "error"); }
  };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <MissionComplete show={missionDone} onClose={() => setMissionDone(false)} name={doneName} G={G} animated={settings.animationsEnabled} />
      <PageHdr title="Missions" subtitle={`${visible.length} tasks`} G={G}
        action={isAdmin && <SBtn G={G} onClick={() => setShowForm(!showForm)}>+ New Mission</SBtn>} />

      {showForm && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 16, border: `1px solid ${G.orange}22`, animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <div style={{ width: 3, height: 13, background: G.orange, borderRadius: 2 }} />
            <h3 style={{ fontFamily: G.font, color: G.orange, fontSize: 10, letterSpacing: 2 }}>NEW MISSION</h3>
          </div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 4, fontFamily: G.font }}>Title *</label>
              <input className="p-input" placeholder="Mission title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 4, fontFamily: G.font }}>Assign To *</label>
              <select className="p-input" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Select agent</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 4, fontFamily: G.font }}>Description</label>
              <textarea className="p-input" placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical", minHeight: 55 }} />
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 4, fontFamily: G.font }}>Priority</label>
              <select className="p-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {["low", "medium", "high"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 4, fontFamily: G.font }}>Category</label>
              <select className="p-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["documentation", "training", "setup", "meeting", "other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 4, fontFamily: G.font }}>Due Date</label>
              <input className="p-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <GBtn G={G} color={G.orange} onClick={addTask}>Create</GBtn>
            <GBtn G={G} color={G.muted} onClick={() => setShowForm(false)}>Cancel</GBtn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", "pending", "in_progress", "completed"].map(f => (
          <button key={f} onClick={() => { setFilter(f); playSound('click', sound); }}
            style={{ background: filter === f ? `${G.primary}22` : "transparent", color: filter === f ? G.primary : G.muted, border: `1px solid ${filter === f ? G.primary + "55" : G.border}`, borderRadius: 20, padding: "5px 13px", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: G.font, letterSpacing: 1, transition: "all 0.2s", minHeight: 32 }}>
            {f.replace("_", " ").toUpperCase()} ({(f === "all" ? visible : visible.filter(t => t.status === f)).length})
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? <EmptyState icon="📋" title="No missions found" subtitle={filter === "all" ? "Create your first mission" : `No ${filter.replace("_", " ")} missions`} G={G} /> :
          filtered.map((t, i) => {
            const dl = getDL(t.dueDate);
            return (
              <div key={t._id} className="task-card glass-card" style={{ padding: 15, display: "flex", gap: 11, alignItems: "flex-start", borderLeft: `3px solid ${tC[t.status]}22`, animationDelay: `${i * 0.05}s` }}>
                <span style={{ fontSize: 17, marginTop: 1, flexShrink: 0 }}>{catIcon[t.category]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 5 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                      {t.description && <div style={{ color: G.muted, fontSize: 11, marginTop: 1 }}>{t.description}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flexShrink: 0 }}>
                      <Bdg label={t.status.replace("_", " ")} color={tC[t.status]} />
                      <Bdg label={t.priority} color={pC[t.priority]} />
                      {dl && <Bdg label={dl.label} color={dl.color} />}
                    </div>
                  </div>
                  <div className="task-actions" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: G.muted, fontSize: 11 }}>👤 {t.assignedTo?.name || "Unassigned"}</span>
                    {t.dueDate && <span style={{ color: G.muted, fontSize: 11 }}>📅 {t.dueDate?.split("T")[0]}</span>}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      {t.status === "pending" && <GBtn size="sm" G={G} color={G.primary} onClick={() => updateStatus(t._id, "in_progress")}>▶ Start</GBtn>}
                      {t.status === "in_progress" && <GBtn size="sm" G={G} color={G.accent} onClick={() => updateStatus(t._id, "completed")}>✓ Complete</GBtn>}
                      {t.status === "completed" && <span style={{ color: G.accent, fontSize: 11, fontWeight: 700, fontFamily: G.font }}>✓ Done</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── WORKFLOWS ────────────────────────────────────────────────────────────────
function WorkflowsPage({ employees, addToast, addActivity, G, sound }) {
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assignEmp, setAssignEmp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getWorkflows().then(({ data }) => setWorkflows(data)).catch(() => addToast("Failed", "error")).finally(() => setLoading(false)); }, []);

  const assign = async (wf) => {
    if (!assignEmp) { addToast("Select an agent!", "error"); return; }
    try {
      await api.assignWorkflow(wf._id, assignEmp);
      const emp = employees.find(e => e._id === assignEmp);
      addToast(`${wf.name} assigned to ${emp?.name}!`, "success");
      addActivity(`Workflow "${wf.name}" → ${emp?.name}`, "workflow_assign");
      playSound('deploy', sound);
      setSelected(null); setAssignEmp("");
    } catch { addToast("Failed", "error"); }
  };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHdr title="Workflows" subtitle="Operation templates" G={G} />
      {loading ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 11 }}>{[1, 2, 3].map(i => <SkCard key={i} />)}</div> :
        workflows.length === 0 ? <EmptyState icon="🔄" title="No workflows" subtitle="Add via Thunder Client API" G={G} /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 11 }}>
            {workflows.map((wf, i) => (
              <div key={wf._id} className="glass-card" style={{ padding: 18, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontFamily: G.font, fontSize: 11, fontWeight: 700, marginBottom: 5 }}>{wf.name}</h3>
                    <Bdg label={wf.department || "All"} color={G.secondary} />
                  </div>
                  <div style={{ background: `${G.primary}15`, color: G.primary, border: `1px solid ${G.primary}33`, borderRadius: 6, padding: "3px 7px", fontSize: 9, fontFamily: G.font, fontWeight: 700 }}>{wf.steps?.length || 0} OPS</div>
                </div>
                <p style={{ color: G.muted, fontSize: 11, marginBottom: 11, lineHeight: 1.5 }}>{wf.description}</p>
                <div style={{ marginBottom: 12 }}>
                  {wf.steps?.map((s, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 0", borderBottom: `1px solid ${G.border}` }}>
                      <div style={{ width: 15, height: 15, borderRadius: 3, background: `${G.primary}15`, color: G.primary, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{s.order}</div>
                      <span style={{ fontSize: 11 }}>{catIcon[s.category]}</span>
                      <span style={{ fontSize: 11, flex: 1 }}>{s.title}</span>
                      <span style={{ color: G.muted, fontSize: 9 }}>{s.estimatedDays}d</span>
                    </div>
                  ))}
                </div>
                <GBtn G={G} style={{ width: "100%", borderRadius: 8 }} onClick={() => setSelected(selected === wf._id ? null : wf._id)}>⚡ Assign</GBtn>
                {selected === wf._id && (
                  <div style={{ marginTop: 8, display: "flex", gap: 7, animation: "fadeUp 0.3s ease" }}>
                    <select className="p-input" value={assignEmp} onChange={e => setAssignEmp(e.target.value)} style={{ flex: 1 }}>
                      <option value="">Select agent</option>
                      {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                    <GBtn size="sm" G={G} color={G.accent} onClick={() => assign(wf)}>Go</GBtn>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsPage({ employees, tasks, G, settings }) {
  const total = tasks.length || 1;
  const rate = Math.round((tasks.filter(t => t.status === "completed").length / total) * 100);
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.accent, overdue: G.red };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHdr title="Analytics" subtitle="Performance overview" G={G} />
      <div className="stat-row" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCrd icon="👥" label="Agents" value={employees.length} color={G.primary} G={G} settings={settings} delay={0} />
        <StatCrd icon="📋" label="Tasks" value={tasks.length} color={G.orange} G={G} settings={settings} delay={0.1} />
        <StatCrd icon="✅" label="Done" value={tasks.filter(t => t.status === "completed").length} color={G.accent} G={G} settings={settings} delay={0.2} />
        <StatCrd icon="🎯" label="Rate %" value={rate} color={G.secondary} G={G} settings={settings} delay={0.3} />
      </div>
      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <div style={{ width: 3, height: 13, background: G.primary, borderRadius: 2 }} />
            <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>AGENT PERFORMANCE</h2>
          </div>
          {employees.length === 0 ? <EmptyState icon="📊" title="No data" subtitle="Add employees first" G={G} /> :
            employees.map((emp, i) => {
              const done = tasks.filter(t => t.assignedTo?._id === emp._id && t.status === "completed").length;
              const tot = tasks.filter(t => t.assignedTo?._id === emp._id).length;
              return (
                <div key={emp._id} style={{ marginBottom: 13, animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Avt name={emp.name} size={24} G={G} />
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{emp.name?.split(" ")[0]}</span>
                    </div>
                    <span style={{ color: G.primary, fontSize: 9, fontFamily: G.font }}>{done}/{tot} · {emp.onboardingProgress || 0}%</span>
                  </div>
                  <PBar value={emp.onboardingProgress || 0} G={G} />
                </div>
              );
            })
          }
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <div style={{ width: 3, height: 13, background: G.orange, borderRadius: 2 }} />
            <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>TASK STATUS</h2>
          </div>
          {["pending", "in_progress", "completed", "overdue"].map((s, i) => {
            const count = tasks.filter(t => t.status === s).length;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={s} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, textTransform: "capitalize" }}>{s.replace("_", " ")}</span>
                  <span style={{ color: tC[s], fontSize: 10, fontFamily: G.font }}>{count} ({pct}%)</span>
                </div>
                <PBar value={pct} color={tC[s]} G={G} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardPage({ employees, tasks, G }) {
  const ranked = employees.map(emp => {
    const et = tasks.filter(t => t.assignedTo?._id === emp._id);
    const done = et.filter(t => t.status === "completed").length;
    const xp = done * 100 + (emp.onboardingProgress || 0);
    const rank = xp > 800 ? "Legend" : xp > 500 ? "Elite" : xp > 200 ? "Veteran" : "Rookie";
    const rc = xp > 800 ? G.orange : xp > 500 ? G.secondary : xp > 200 ? G.primary : G.accent;
    return { ...emp, xp, done, total: et.length, rank, rc };
  }).sort((a, b) => b.xp - a.xp);

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHdr title="Leaderboard" subtitle="Rankings by XP" G={G} />
      {ranked.length === 0 ? <EmptyState icon="🏆" title="No rankings yet" subtitle="Complete tasks to earn XP" G={G} /> : (
        <>
          {ranked.length >= 3 && (
            <div style={{ display: "flex", gap: 9, marginBottom: 20, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
              {[ranked[1], ranked[0], ranked[2]].map((emp, i) => {
                const heights = [120, 160, 100];
                const medals = ["🥈", "🥇", "🥉"];
                return emp ? (
                  <div key={emp._id} style={{ flex: 1, minWidth: 75, maxWidth: 130, textAlign: "center", animation: `fadeUp 0.5s ease ${i * 0.15}s both` }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{medals[i]}</div>
                    <Avt name={emp.name} size={38} G={G} />
                    <div style={{ fontSize: 11, fontWeight: 600, margin: "6px 0 3px" }}>{emp.name?.split(" ")[0]}</div>
                    <Bdg label={emp.rank} color={emp.rc} />
                    <div style={{ height: heights[i], background: `linear-gradient(180deg,${emp.rc}22,${emp.rc}08)`, border: `1px solid ${emp.rc}33`, borderRadius: "9px 9px 0 0", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <div style={{ color: emp.rc, fontFamily: G.font, fontSize: 15, fontWeight: 900 }}>{emp.xp}</div>
                      <div style={{ color: G.muted, fontSize: 9, fontFamily: G.font }}>XP</div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <div style={{ width: 3, height: 13, background: G.orange, borderRadius: 2 }} />
              <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>FULL RANKINGS</h2>
            </div>
            {ranked.map((emp, i) => (
              <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", background: i === 0 ? `${G.orange}06` : `${G.primary}03`, border: `1px solid ${i === 0 ? G.orange + "22" : G.border}`, borderRadius: 10, marginBottom: 6, animation: `fadeUp 0.4s ease ${i * 0.06}s both`, transition: "all 0.3s" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: i < 3 ? `${[G.orange, G.muted, G.primary][i]}22` : G.surface, border: `1px solid ${i < 3 ? [G.orange, G.muted, G.primary][i] : G.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.font, fontSize: 9, fontWeight: 700, color: i < 3 ? [G.orange, G.muted, G.primary][i] : G.muted, flexShrink: 0 }}>
                  {["🥇", "🥈", "🥉"][i] || i + 1}
                </div>
                <Avt name={emp.name || "?"} size={32} G={G} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{emp.name}</span>
                    <Bdg label={emp.rank} color={emp.rc} />
                  </div>
                  <PBar value={emp.onboardingProgress || 0} G={G} height={4} />
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: emp.rc, fontWeight: 900, fontSize: 14, fontFamily: G.font }}>{emp.xp}</div>
                  <div style={{ color: G.muted, fontSize: 9, fontFamily: G.font }}>XP</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsPage({ employees, tasks, G, addToast, sound }) {
  const [selected, setSelected] = useState("");
  const [generating, setGenerating] = useState(false);

  const generate = (empId) => {
    const id = empId || selected;
    if (!id) return;
    setGenerating(true);
    playSound('deploy', sound);
    const emp = employees.find(e => e._id === id);
    const et = tasks.filter(t => t.assignedTo?._id === id);
    const done = et.filter(t => t.status === "completed");
    const pending = [...et.filter(t => t.status === "in_progress"), ...et.filter(t => t.status === "pending")];
    const xp = done.length * 100 + (emp?.onboardingProgress || 0);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report - ${emp?.name}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{background:#000;color:#e0e0ff;font-family:'Rajdhani',sans-serif;padding:40px;max-width:800px;margin:0 auto;}
.header{background:linear-gradient(135deg,#00f5ff08,#bf00ff06);border:1px solid #00f5ff22;border-radius:18px;padding:28px;text-align:center;margin-bottom:24px;}
.logo{font-family:'Orbitron',monospace;font-size:24px;font-weight:900;background:linear-gradient(135deg,#00f5ff,#bf00ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.name{font-family:'Orbitron',monospace;font-size:18px;font-weight:900;color:#e0e0ff;margin-top:11px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:20px;}
.stat{background:#0d0d1a;border:1px solid #1a1a2e;border-radius:11px;padding:13px;text-align:center;}
.sv{font-family:'Orbitron',monospace;font-size:22px;font-weight:900;}
.sl{color:#444466;font-size:9px;margin-top:3px;letter-spacing:1px;text-transform:uppercase;}
.section{background:#0d0d1a;border:1px solid #1a1a2e;border-radius:11px;padding:18px;margin-bottom:14px;}
.sh{font-family:'Orbitron',monospace;font-size:10px;color:#00f5ff;font-weight:700;margin-bottom:11px;padding-left:9px;border-left:3px solid #00f5ff;}
.task{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #1a1a2e;}
.badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:8px;font-weight:700;font-family:'Orbitron',monospace;}
.footer{text-align:center;margin-top:26px;color:#1e293b;font-size:9px;font-family:'Orbitron',monospace;}
</style></head><body>
<div class="header">
<div class="logo">OnboardIQ</div>
<div style="color:#444466;font-size:9px;letter-spacing:2px;margin-top:4px;font-family:'Orbitron',monospace">SMART EMPLOYEE ONBOARDING SYSTEM</div>
<div class="name">${emp?.name}</div>
<div style="color:#64748b;font-size:12px;margin-top:3px">${emp?.position || ""} · ${emp?.department || ""}</div>
<div style="margin-top:9px">
<span class="badge" style="background:#00ff4115;color:#00ff41;border:1px solid #00ff4133">${emp?.status?.toUpperCase() || "ONBOARDING"}</span>
<span class="badge" style="background:#00f5ff15;color:#00f5ff;border:1px solid #00f5ff33;margin-left:5px">${xp} XP</span>
</div></div>
<div class="stats">
<div class="stat" style="border-color:#00f5ff22"><div class="sv" style="color:#00f5ff">${emp?.onboardingProgress || 0}%</div><div class="sl">Progress</div></div>
<div class="stat" style="border-color:#00ff4122"><div class="sv" style="color:#00ff41">${done.length}</div><div class="sl">Completed</div></div>
<div class="stat" style="border-color:#ffaa0022"><div class="sv" style="color:#ffaa00">${et.filter(t => t.status === "in_progress").length}</div><div class="sl">Active</div></div>
<div class="stat" style="border-color:#44446622"><div class="sv" style="color:#444466">${et.filter(t => t.status === "pending").length}</div><div class="sl">Pending</div></div>
</div>
<div class="section"><div class="sh">COMPLETED TASKS (${done.length})</div>
${done.length === 0 ? '<div style="color:#444466;text-align:center;padding:12px;font-size:11px">No completed tasks yet</div>' :
      done.map(t => `<div class="task"><span style="font-size:14px">${catIcon[t.category] || "📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:12px">${t.title}</div></div><span class="badge" style="background:#00ff4115;color:#00ff41;border:1px solid #00ff4133">Done ✓</span></div>`).join("")}
</div>
<div class="section"><div class="sh">PENDING TASKS (${pending.length})</div>
${pending.length === 0 ? '<div style="color:#444466;text-align:center;padding:12px;font-size:11px">All tasks completed! 🎉</div>' :
      pending.map(t => `<div class="task"><span style="font-size:14px">${catIcon[t.category] || "📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:12px">${t.title}</div><div style="color:#444466;font-size:10px">Due: ${t.dueDate?.split("T")[0] || "No deadline"}</div></div><span class="badge" style="background:#00f5ff15;color:#00f5ff;border:1px solid #00f5ff33">${t.status.replace("_", " ")}</span></div>`).join("")}
</div>
<div class="footer">Generated by OnboardIQ · ${new Date().toLocaleDateString()} · Confidential</div>
</body></html>`;
    setTimeout(() => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${emp?.name?.replace(" ", "_")}_Report.html`; a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
      playSound('success', sound);
    }, 900);
  };

  return (
    <div style={{ animation: "slideLeft 0.4s ease" }}>
      <PageHdr title="Reports" subtitle="Generate employee reports" G={G} />
      <div className="glass-card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
          <div style={{ width: 3, height: 13, background: G.accent, borderRadius: 2 }} />
          <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>GENERATE REPORT</h2>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: G.muted, fontSize: 9, display: "block", marginBottom: 5, fontFamily: G.font }}>Select Employee</label>
          <select className="p-input" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Choose employee...</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        {selected && (() => {
          const emp = employees.find(e => e._id === selected);
          const et = tasks.filter(t => t.assignedTo?._id === selected);
          return (
            <div style={{ background: `${G.primary}05`, border: `1px solid ${G.border}`, borderRadius: 10, padding: 13, marginBottom: 12, animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avt name={emp?.name || "?"} size={40} G={G} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{emp?.name}</div>
                  <div style={{ color: G.muted, fontSize: 11, marginBottom: 7 }}>{emp?.position} · {emp?.department}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <Bdg label={`${emp?.onboardingProgress || 0}%`} color={G.primary} />
                    <Bdg label={`${et.filter(t => t.status === "completed").length} done`} color={G.accent} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <SBtn G={G} onClick={() => generate()} disabled={!selected || generating} style={{ borderRadius: 9, padding: "10px 24px" }}>
          {generating ? "Generating..." : "📄 Download Report"}
        </SBtn>
        <p style={{ color: G.muted, fontSize: 10, marginTop: 8 }}>Opens in browser — print as PDF with Ctrl+P</p>
      </div>
      <div className="glass-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
          <div style={{ width: 3, height: 13, background: G.primary, borderRadius: 2 }} />
          <h2 style={{ fontFamily: G.font, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>ALL AGENTS</h2>
        </div>
        {employees.length === 0 ? <EmptyState icon="👥" title="No employees" subtitle="Add employees first" G={G} /> :
          employees.map((emp, i) => {
            const et = tasks.filter(t => t.assignedTo?._id === emp._id);
            return (
              <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", background: `${G.primary}04`, border: `1px solid ${G.border}`, borderRadius: 10, marginBottom: 6, animation: `fadeUp 0.4s ease ${i * 0.06}s both` }}>
                <Avt name={emp.name || "?"} size={30} G={G} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{emp.name}</div>
                  <PBar value={emp.onboardingProgress || 0} G={G} height={4} />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Bdg label={`${emp.onboardingProgress || 0}%`} color={G.primary} />
                  <Bdg label={`${et.filter(t => t.status === "completed").length}/${et.length}`} color={G.accent} />
                </div>
                <GBtn size="sm" G={G} color={G.accent} onClick={() => { setSelected(emp._id); generate(emp._id); }}>📄</GBtn>
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
  { key: "dashboard", label: "COMMAND", icon: "🏠", shortcut: "D" },
  { key: "employees", label: "AGENTS", icon: "👥", admin: true, shortcut: "A" },
  { key: "tasks", label: "MISSIONS", icon: "📋", shortcut: "M" },
  { key: "workflows", label: "OPS", icon: "🔄", admin: true },
  { key: "analytics", label: "ANALYTICS", icon: "📊", admin: true, shortcut: "N" },
  { key: "leaderboard", label: "RANKS", icon: "🏆", shortcut: "L" },
  { key: "reports", label: "REPORTS", icon: "📄", admin: true, shortcut: "R" },
  { key: "settings", label: "SETTINGS", icon: "⚙️", shortcut: "S" },
];

function Layout({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [settings, setSettings] = useState(() => {
    try { const s = localStorage.getItem('appSettings'); return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; }
  });

  const G = THEMES[settings.theme] || THEMES.cyber;
  const sound = settings.soundEnabled;

  useEffect(() => {
    document.body.style.background = G.bg;
    document.body.style.color = G.text;
  }, [G.bg, G.text]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    if (type === "success" && settings.notificationsEnabled) playSound('notify', sound);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const addNotification = (message, type = "info") => {
    if (!settings.notificationsEnabled) return;
    const id = Date.now();
    const time = new Date().toLocaleTimeString();
    setNotifications(prev => [{ id, message, type, time }, ...prev].slice(0, 20));
  };

  const addActivity = (message, type = "system") => {
    const id = Date.now();
    const time = new Date().toLocaleTimeString();
    setActivities(prev => [{ id, message, type, time }, ...prev].slice(0, 30));
  };

  useEffect(() => {
    const isAdmin = user.role === "admin" || user.role === "hr";
    Promise.all([api.getTasks(), isAdmin ? api.getEmployees() : Promise.resolve({ data: [] })])
      .then(([tr, er]) => {
        setTasks(tr.data); setEmployees(er.data);
        addActivity("System initialized", "system");
        addNotification("Welcome back! System online", "success");
      }).catch(() => addToast("Failed to load data", "error"))
      .finally(() => setLoading(false));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      const isAdmin = user?.role === 'admin' || user?.role === 'hr';
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setShowSearch(p => !p); playSound('click', sound); }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotifs(false); setMobileMenuOpen(false); }
      if (!e.ctrlKey && !e.altKey) {
        const map = { d: 'dashboard', a: isAdmin ? 'employees' : null, m: 'tasks', l: 'leaderboard', n: isAdmin ? 'analytics' : null, r: isAdmin ? 'reports' : null, s: 'settings' };
        if (map[e.key]) { setPage(map[e.key]); playSound('click', sound); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user, sound]);

  const navItems = NAV.filter(n => !n.admin || user.role === "admin" || user.role === "hr");
  const unread = notifications.length;
  const pageProps = { user, employees, setEmployees, tasks, setTasks, addToast, addActivity, G, settings, sound };

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", background: G.bg, display: "flex", transition: "background 0.4s ease" }}>
      <style>{makeCSS(G, settings)}</style>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,${G.primary}04,transparent 70%)`, filter: "blur(70px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${G.secondary}04,transparent 70%)`, filter: "blur(70px)" }} />
      </div>

      <ToastBox toasts={toasts} G={G} />
      <NotifsPanel show={showNotifs} onClose={() => setShowNotifs(false)} notifications={notifications} clearAll={() => setNotifications([])} G={G} />

      {/* Global Search */}
      {showSearch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 9995, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "70px 16px", animation: "overlayIn 0.2s ease" }} onClick={() => setShowSearch(false)}>
          <div style={{ background: G.surface, border: `1px solid ${G.primary}44`, borderRadius: 14, width: "100%", maxWidth: 480, animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)", boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "11px 14px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ color: G.primary, fontSize: 15 }}>🔍</span>
              <input autoFocus placeholder="Search agents, tasks..." style={{ flex: 1, background: "transparent", border: "none", color: G.text, fontSize: 14, outline: "none", fontFamily: G.body }}
                onChange={e => {
                  const q = e.target.value.toLowerCase();
                  if (!q) return;
                  const empMatch = employees.find(emp => emp.name?.toLowerCase().includes(q));
                  const taskMatch = tasks.find(t => t.title?.toLowerCase().includes(q));
                  if (empMatch) { setPage('employees'); setShowSearch(false); }
                  else if (taskMatch) { setPage('tasks'); setShowSearch(false); }
                }} />
              <kbd style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 4, padding: "1px 5px", color: G.muted, fontFamily: G.font, fontSize: 8 }}>ESC</kbd>
            </div>
            <div style={{ padding: 8 }}>
              {[{ icon: "🏠", label: "Dashboard", key: "D", action: "dashboard" }, { icon: "👥", label: "Agents", key: "A", action: "employees" }, { icon: "📋", label: "Missions", key: "M", action: "tasks" }, { icon: "🏆", label: "Leaderboard", key: "L", action: "leaderboard" }, { icon: "⚙️", label: "Settings", key: "S", action: "settings" }].map((item, i) => (
                <button key={i} onClick={() => { setPage(item.action); setShowSearch(false); playSound('click', sound); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: G.text, transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${G.primary}11`}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, flex: 1, textAlign: "left", fontWeight: 500 }}>{item.label}</span>
                  <kbd style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 4, padding: "1px 5px", color: G.primary, fontFamily: G.font, fontSize: 8 }}>{item.key}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE HEADER ── */}
      <div className="mobile-header">
        <div className="g-text" style={{ fontFamily: G.font, fontSize: 16, fontWeight: 900 }}>OnboardIQ</div>
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={() => setShowSearch(true)} style={{ background: `${G.primary}15`, border: `1px solid ${G.primary}33`, color: G.primary, borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>🔍</button>
          <button onClick={() => setShowNotifs(true)} style={{ background: `${G.primary}15`, border: `1px solid ${G.primary}33`, color: G.primary, borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            🔔
            {unread > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: G.red, color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.font, fontWeight: 900 }}>{unread > 9 ? "9+" : unread}</span>}
          </button>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="desktop-sidebar" style={{ width: settings.compactMode ? 180 : 200, background: G.surface, borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 100, transition: "all 0.4s ease" }}>
        <div style={{ padding: "16px 13px 13px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${G.primary}22,${G.secondary}22)`, border: `1px solid ${G.primary}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
            <div>
              <div className="g-text" style={{ fontFamily: G.font, fontWeight: 900, fontSize: 12, letterSpacing: 2 }}>OnboardIQ</div>
              <div style={{ color: G.muted, fontSize: 8, letterSpacing: 1 }}>v2.0 premium</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "7px 9px", borderBottom: `1px solid ${G.border}` }}>
          <button onClick={() => setShowSearch(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: `${G.primary}06`, border: `1px solid ${G.border}`, borderRadius: 8, color: G.muted, cursor: "pointer", fontSize: 10, fontFamily: G.body, transition: "all 0.2s" }}>
            <span>🔍</span>
            <span style={{ flex: 1, textAlign: "left" }}>Search...</span>
            <kbd style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 3, padding: "1px 4px", color: G.primary, fontFamily: G.font, fontSize: 7 }}>⌘K</kbd>
          </button>
        </div>

        <nav style={{ flex: 1, padding: "9px 7px", overflow: "auto" }} className="thin-scroll">
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setPage(item.key); playSound('click', sound); }} className={`nav-item ${page === item.key ? "active" : ""}`}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.shortcut && <kbd style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 3, padding: "1px 4px", color: G.muted, fontFamily: G.font, fontSize: 7 }}>{item.shortcut}</kbd>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "9px 7px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: `${G.primary}06`, border: `1px solid ${G.border}`, borderRadius: 10, marginBottom: 6 }}>
            <Avt name={user.name || "U"} size={26} G={G} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ color: G.muted, fontSize: 8, textTransform: "capitalize", fontFamily: G.font }}>{user.role}</div>
            </div>
          </div>

          <button onClick={() => { setShowNotifs(!showNotifs); playSound('click', sound); }}
            style={{ width: "100%", background: `${G.primary}10`, color: G.primary, border: `1px solid ${G.primary}33`, borderRadius: 9, padding: "7px", fontSize: 10, cursor: "pointer", fontWeight: 700, fontFamily: G.font, letterSpacing: 1, marginBottom: 5, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            🔔 ALERTS
            {unread > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: G.red, color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: G.font, fontWeight: 900 }}>{unread > 9 ? "9+" : unread}</span>}
          </button>

          <button onClick={onLogout}
            style={{ width: "100%", background: `${G.red}10`, color: G.red, border: `1px solid ${G.red}33`, borderRadius: 9, padding: "7px", fontSize: 9, cursor: "pointer", fontWeight: 700, fontFamily: G.font, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            ⏻ DISCONNECT
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="main-wrap" style={{ marginLeft: settings.compactMode ? 180 : 200, flex: 1, padding: settings.compactMode ? "20px 20px 36px" : "24px 24px 40px", maxWidth: `calc(100vw - ${settings.compactMode ? 180 : 200}px)`, position: "relative", zIndex: 1 }}>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: 26, width: 180, marginBottom: 20 }} />
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 85, flex: 1, borderRadius: 14 }} />)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12 }}>{[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 14 }} />)}</div>
          </div>
        ) : (
          <>
            {page === "dashboard" && <Dashboard {...pageProps} activities={activities} />}
            {page === "employees" && <EmployeesPage {...pageProps} />}
            {page === "tasks" && <TasksPage {...pageProps} />}
            {page === "workflows" && <WorkflowsPage {...pageProps} />}
            {page === "analytics" && <AnalyticsPage {...pageProps} />}
            {page === "leaderboard" && <LeaderboardPage {...pageProps} />}
            {page === "reports" && <ReportsPage {...pageProps} addToast={addToast} />}
            {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} G={G} user={user} addToast={addToast} />}
          </>
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav" style={{ justifyContent: "space-around", alignItems: "center" }}>
        {[...navItems.slice(0, 4), { key: "settings", label: "MORE", icon: "⚙️" }].map(item => (
          <button key={item.key} onClick={() => { setPage(item.key); playSound('click', sound); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "5px 8px", background: "transparent", border: "none", color: page === item.key ? G.primary : G.muted, transition: "all 0.2s", cursor: "pointer", minWidth: 48, minHeight: 48, justifyContent: "center" }}>
            <span style={{ fontSize: 21 }}>{item.icon}</span>
            <span style={{ fontSize: 8, fontFamily: G.font, fontWeight: page === item.key ? 700 : 400, letterSpacing: 0.5 }}>{item.label}</span>
            {page === item.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: G.primary, boxShadow: `0 0 5px ${G.primary}` }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem('user'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    playSound('error');
    setUser(null);
  };
  return user ? <Layout user={user} onLogout={logout} /> : <LoginPage onLogin={setUser} />;
}
