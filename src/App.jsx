import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ─── API ──────────────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });
API.interceptors.request.use(r => { const t = localStorage.getItem("token"); if (t) r.headers.Authorization = `Bearer ${t}`; return r; });
const api = {
  login: d => API.post("/auth/login", d),
  getEmployees: () => API.get("/employees"),
  addEmployee: d => API.post("/employees", d),
  updateEmployee: (id, d) => API.put(`/employees/${id}`, d),
  deleteEmployee: id => API.delete(`/employees/${id}`),
  getTasks: () => API.get("/tasks"),
  addTask: d => API.post("/tasks", d),
  updateTask: (id, d) => API.put(`/tasks/${id}`, d),
  getWorkflows: () => API.get("/workflows"),
  assignWorkflow: (id, empId) => API.post(`/workflows/${id}/assign/${empId}`),
};

// ─── THEME ────────────────────────────────────────────────────────────────────
const THEMES = {
  dark: { name: "Dark", bg: "#0f1117", surface: "#1a1d27", card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", primary: "#6366f1", secondary: "#8b5cf6", green: "#10b981", orange: "#f59e0b", red: "#ef4444", text: "#f1f5f9", sub: "#94a3b8", muted: "#475569", sidebar: "#13151f" },
  light: { name: "Light", bg: "#f8fafc", surface: "#ffffff", card: "rgba(0,0,0,0.02)", border: "rgba(0,0,0,0.08)", primary: "#6366f1", secondary: "#8b5cf6", green: "#10b981", orange: "#f59e0b", red: "#ef4444", text: "#0f172a", sub: "#64748b", muted: "#94a3b8", sidebar: "#ffffff" },
  midnight: { name: "Midnight", bg: "#070b14", surface: "#0d1424", card: "rgba(255,255,255,0.03)", border: "rgba(59,130,246,0.12)", primary: "#3b82f6", secondary: "#60a5fa", green: "#34d399", orange: "#fb923c", red: "#f87171", text: "#e2e8f0", sub: "#94a3b8", muted: "#475569", sidebar: "#090f1e" },
  warm: { name: "Warm", bg: "#1c1917", surface: "#292524", card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", primary: "#f97316", secondary: "#fb923c", green: "#84cc16", orange: "#eab308", red: "#ef4444", text: "#fafaf9", sub: "#a8a29e", muted: "#57534e", sidebar: "#1c1917" },
};

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const LANG = {
  en: { dashboard: "Dashboard", employees: "Employees", tasks: "Tasks", workflows: "Workflows", analytics: "Analytics", leaderboard: "Leaderboard", reports: "Reports", settings: "Settings", ai: "AI Assistant", kanban: "Kanban", calendar: "Calendar", signOut: "Sign out", addEmployee: "Add employee", addTask: "Add task", search: "Search...", noData: "Nothing here yet", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", name: "Name", email: "Email", password: "Password", phone: "Phone", dept: "Department", position: "Position", assignTo: "Assign to", priority: "Priority", category: "Category", dueDate: "Due date", desc: "Description", progress: "Progress", status: "Status", pending: "Pending", active: "In Progress", done: "Completed", overdue: "Overdue", high: "High", medium: "Medium", low: "Low", total: "Total", completion: "Completion", generate: "Generate report", download: "Download", theme: "Theme", fontSize: "Font size", language: "Language", sound: "Sounds", animations: "Animations", reset: "Reset", greeting: "Greeting", activityFeed: "Activity feed", welcome: "Welcome back", morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" },
  ta: { dashboard: "டாஷ்போர்டு", employees: "ஊழியர்கள்", tasks: "பணிகள்", workflows: "பணிப்பாய்வு", analytics: "பகுப்பாய்வு", leaderboard: "தரவரிசை", reports: "அறிக்கைகள்", settings: "அமைப்புகள்", ai: "AI உதவி", kanban: "கான்பன்", calendar: "நாட்காட்டி", signOut: "வெளியேறு", addEmployee: "ஊழியர் சேர்", addTask: "பணி சேர்", search: "தேடு...", noData: "தரவு இல்லை", save: "சேமி", cancel: "ரத்து", delete: "நீக்கு", edit: "திருத்து", name: "பெயர்", email: "மின்னஞ்சல்", password: "கடவுச்சொல்", phone: "தொலைபேசி", dept: "துறை", position: "பதவி", assignTo: "ஒதுக்கு", priority: "முன்னுரிமை", category: "வகை", dueDate: "கடைசி தேதி", desc: "விளக்கம்", progress: "முன்னேற்றம்", status: "நிலை", pending: "நிலுவை", active: "செயலில்", done: "முடிந்தது", overdue: "தாமதம்", high: "உயர்", medium: "நடுத்தர", low: "குறைவு", total: "மொத்தம்", completion: "முடிவு", generate: "அறிக்கை உருவாக்கு", download: "பதிவிறக்கு", theme: "தீம்", fontSize: "எழுத்து அளவு", language: "மொழி", sound: "ஒலி", animations: "அனிமேஷன்", reset: "மீட்டமை", greeting: "வாழ்த்து", activityFeed: "செயல்பாடு", welcome: "மீண்டும் வரவேற்கிறோம்", morning: "காலை வணக்கம்", afternoon: "மதிய வணக்கம்", evening: "மாலை வணக்கம்" },
};

// ─── SOUNDS ───────────────────────────────────────────────────────────────────
const play = (type, on = true) => {
  if (!on) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tones = {
      success: () => [523, 659, 784].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = f; g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3); o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + i * 0.1 + 0.3); }),
      click: () => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 440; g.gain.setValueAtTime(0.05, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06); o.start(); o.stop(ctx.currentTime + 0.06); },
      done: () => [523, 659, 784, 1047].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = f; g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.11); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.11 + 0.3); o.start(ctx.currentTime + i * 0.11); o.stop(ctx.currentTime + i * 0.11 + 0.3); }),
      error: () => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "square"; o.connect(g); g.connect(ctx.destination); o.frequency.setValueAtTime(180, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3); g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); o.start(); o.stop(ctx.currentTime + 0.3); },
    };
    tones[type]?.();
  } catch (e) { }
};

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const DEFAULTS = { theme: "dark", lang: "en", fontSize: "md", sound: true, animations: true, compact: false, greeting: true, activity: true };

const catIcon = { documentation: "📄", training: "📚", setup: "⚙️", meeting: "🤝", other: "📌" };
const catIconStr = { documentation: "📄", training: "📚", setup: "⚙️", meeting: "🤝", other: "📌" };
const FS = { sm: { base: 12, md: 14, lg: 18, xl: 22, xxl: 28 }, md: { base: 14, md: 16, lg: 20, xl: 24, xxl: 32 }, lg: { base: 16, md: 18, lg: 24, xl: 28, xxl: 36 } };

// ─── BADGES ───────────────────────────────────────────────────────────────────
const BADGES = [
  { id: "first", icon: "🎯", name: "First Step", check: (e, t) => t.filter(x => x.assignedTo?._id === e._id && x.status === "completed").length >= 1 },
  { id: "fire", icon: "🔥", name: "On Fire", check: (e, t) => t.filter(x => x.assignedTo?._id === e._id && x.status === "completed").length >= 3 },
  { id: "pro", icon: "⚡", name: "Pro", check: (e, t) => t.filter(x => x.assignedTo?._id === e._id && x.status === "completed").length >= 5 },
  { id: "champ", icon: "🏆", name: "Champion", check: (e) => (e.onboardingProgress || 0) >= 100 },
  { id: "legend", icon: "💎", name: "Legend", check: (e, t) => t.filter(x => x.assignedTo?._id === e._id && x.status === "completed").length >= 10 },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────
const makeCSS = (G, s) => `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
  body { background: ${G.bg}; color: ${G.text}; font-family: 'Bricolage Grotesque', sans-serif; font-size: ${FS[s.fontSize].base}px; overflow-x: hidden; -webkit-font-smoothing: antialiased; transition: background 0.35s ease, color 0.35s ease; }
  *, input, select, textarea, button { font-family: 'Bricolage Grotesque', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 8px; }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideR { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  @keyframes progressIn { from { width: 0; } to { width: var(--w); } }
  @keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastSlide { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes confetti { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--tx), var(--ty)) rotate(var(--tr)); opacity: 0; } }
  @keyframes ripple { to { transform: scale(4); opacity: 0; } }
  @keyframes shimmer { 0% { background-position: -200px 0; } 100% { background-position: calc(200px + 100%) 0; } }
  @keyframes dot-blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }

  .card { background: ${G.card}; border: 1px solid ${G.border}; border-radius: 14px; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
  .card-hover:hover { border-color: ${G.primary}44; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
  .card-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.25); border-color: ${G.primary}33; }

  .btn { position: relative; overflow: hidden; border: none; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4,0,0.2,1); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
  .btn:hover { transform: translateY(-1px); }
  .btn:active { transform: scale(0.97); }
  .btn-primary { background: ${G.primary}; color: #fff; padding: 9px 18px; box-shadow: 0 2px 12px ${G.primary}44; }
  .btn-primary:hover { box-shadow: 0 4px 20px ${G.primary}55; }
  .btn-ghost { background: ${G.card}; color: ${G.sub}; border: 1px solid ${G.border}; padding: 8px 16px; }
  .btn-ghost:hover { color: ${G.text}; border-color: ${G.primary}55; background: ${G.primary}08; }
  .btn-danger { background: ${G.red}15; color: ${G.red}; border: 1px solid ${G.red}33; padding: 8px 16px; }
  .btn-danger:hover { background: ${G.red}25; }
  .btn-success { background: ${G.green}15; color: ${G.green}; border: 1px solid ${G.green}33; padding: 8px 16px; }
  .btn-sm { padding: 5px 12px; font-size: 12px; border-radius: 8px; }
  .btn-icon { padding: 8px; border-radius: 8px; }
  .ripple-el { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.2); transform: scale(0); animation: ripple 0.5s linear; pointer-events: none; }

  .inp { width: 100%; background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 10px; padding: 10px 14px; color: ${G.text}; font-size: 13px; outline: none; transition: all 0.2s; box-sizing: border-box; }
  .inp:focus { border-color: ${G.primary}66; box-shadow: 0 0 0 3px ${G.primary}15; background: ${G.bg}; }
  .inp::placeholder { color: ${G.muted}; }
  select.inp { appearance: auto; }

  .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; color: ${G.sub}; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.18s; border: none; background: transparent; width: 100%; text-align: left; }
  .nav-item:hover { background: ${G.primary}0f; color: ${G.text}; }
  .nav-item.active { background: ${G.primary}18; color: ${G.primary}; font-weight: 600; }
  .nav-item.active .nav-dot { opacity: 1; }
  .nav-dot { width: 4px; height: 4px; border-radius: 50%; background: ${G.primary}; opacity: 0; flex-shrink: 0; transition: opacity 0.2s; }

  .badge-pill { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.2px; white-space: nowrap; }

  .progress-track { height: 5px; border-radius: 10px; background: ${G.border}; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 10px; animation: progressIn 0.8s ease forwards; }

  .skel { background: linear-gradient(90deg, ${G.surface} 25%, ${G.border} 50%, ${G.surface} 75%); background-size: 200px 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }

  .tgl { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
  .tgl input { opacity: 0; width: 0; height: 0; }
  .tgl-track { position: absolute; inset: 0; background: ${G.border}; border-radius: 22px; cursor: pointer; transition: 0.3s; }
  .tgl-track::before { content: ""; position: absolute; width: 16px; height: 16px; left: 3px; bottom: 3px; background: ${G.sub}; border-radius: 50%; transition: 0.3s; }
  .tgl input:checked + .tgl-track { background: ${G.primary}; }
  .tgl input:checked + .tgl-track::before { transform: translateX(18px); background: #fff; }

  .divider { height: 1px; background: ${G.border}; }

  /* Mobile */
  .mob-bar { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; background: ${G.sidebar}f0; backdrop-filter: blur(20px); border-top: 1px solid ${G.border}; padding: 6px 0 max(6px, env(safe-area-inset-bottom)); }
  .mob-header { display: none; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: ${G.sidebar}f0; backdrop-filter: blur(20px); border-bottom: 1px solid ${G.border}; padding: 10px 16px; align-items: center; justify-content: space-between; min-height: 56px; }

  @media (max-width: 768px) {
    .sidebar { display: none !important; }
    .mob-bar { display: flex !important; }
    .mob-header { display: flex !important; }
    .main-area { margin-left: 0 !important; max-width: 100vw !important; padding: 68px 14px 84px !important; }
    .stat-row { grid-template-columns: 1fr 1fr !important; }
    .two-col { grid-template-columns: 1fr !important; }
    .form-grid { grid-template-columns: 1fr !important; }
    .emp-grid { grid-template-columns: 1fr !important; }
    .hide-mob { display: none !important; }
    .inp { font-size: 16px !important; }
    .kanban-wrap { flex-direction: column !important; }
  }
  @media (min-width: 769px) { .mob-bar { display: none !important; } .mob-header { display: none !important; } }
  @media (max-width: 400px) { .stat-row { grid-template-columns: 1fr !important; } }

  .thin-scroll::-webkit-scrollbar { width: 2px; } .thin-scroll::-webkit-scrollbar-thumb { background: ${G.border}; }

  /* Kanban */
  .kan-col { background: ${G.surface}; border: 1px solid ${G.border}; border-radius: 14px; padding: 14px; min-height: 260px; flex: 1; min-width: 200px; transition: all 0.2s; }
  .kan-col.over { border-color: ${G.primary}66; background: ${G.primary}08; }
  .kan-card { background: ${G.card}; border: 1px solid ${G.border}; border-radius: 10px; padding: 12px; margin-bottom: 8px; cursor: grab; transition: all 0.2s; }
  .kan-card:hover { border-color: ${G.primary}44; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
  .kan-card.dragging { opacity: 0.4; transform: scale(0.97); }
  .drop-hint { border: 2px dashed ${G.border}; border-radius: 10px; padding: 14px; text-align: center; color: ${G.muted}; font-size: 12px; }
  .drop-hint.over { border-color: ${G.primary}; color: ${G.primary}; background: ${G.primary}08; }

  /* Calendar */
  .cal-cell { aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 4px; border-radius: 8px; cursor: pointer; transition: all 0.15s; font-size: 12px; font-weight: 500; border: 1px solid transparent; }
  .cal-cell:hover { background: ${G.primary}12; }
  .cal-cell.today { background: ${G.primary}20; border-color: ${G.primary}55; color: ${G.primary}; font-weight: 700; }
  .cal-cell.selected { background: ${G.primary}25; border-color: ${G.primary}; }

  /* AI */
  .ai-bubble-user { background: ${G.primary}; color: #fff; border-radius: 14px 14px 4px 14px; padding: 10px 14px; max-width: 80%; font-size: 13px; align-self: flex-end; animation: fadeUp 0.25s ease; line-height: 1.5; }
  .ai-bubble-bot { background: ${G.surface}; border: 1px solid ${G.border}; color: ${G.text}; border-radius: 14px 14px 14px 4px; padding: 10px 14px; max-width: 80%; font-size: 13px; align-self: flex-start; animation: fadeUp 0.25s ease; line-height: 1.5; }
`;

// ─── RIPPLE ───────────────────────────────────────────────────────────────────
function useRipple() {
  return useCallback(e => {
    const b = e.currentTarget, r = b.getBoundingClientRect();
    const el = document.createElement("span"), sz = Math.max(r.width, r.height);
    el.className = "ripple-el";
    el.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - r.left - sz / 2}px;top:${e.clientY - r.top - sz / 2}px`;
    b.appendChild(el); setTimeout(() => el.remove(), 500);
  }, []);
}

// ─── ANIMATED NUMBER ──────────────────────────────────────────────────────────
function Num({ val, anim = true }) {
  const [d, setD] = useState(0);
  const n = parseInt(val) || 0;
  useEffect(() => {
    if (!anim) { setD(n); return; }
    let s = 0; const step = Math.ceil(n / 20);
    const t = setInterval(() => { s = Math.min(s + step, n); setD(s); if (s >= n) clearInterval(t); }, 35);
    return () => clearInterval(t);
  }, [n]);
  return <span style={{ animation: anim ? "countUp 0.4s ease" : "none" }}>{typeof val === "string" && val.includes("%") ? d + "%" : d}</span>;
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skel({ h = 60, r = 10, style = {} }) { return <div className="skel" style={{ height: h, borderRadius: r, ...style }} />; }

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avt({ name, size = 36, G }) {
  const cols = [G.primary, G.secondary, G.green, G.orange, G.red];
  const c = cols[(name || "?").charCodeAt(0) % cols.length];
  return <div style={{ width: size, height: size, borderRadius: size * 0.3, background: `${c}22`, border: `1.5px solid ${c}44`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontWeight: 700, fontSize: size * 0.38, flexShrink: 0, transition: "all 0.2s" }}>{(name || "?")[0].toUpperCase()}</div>;
}

// ─── BADGE PILL ───────────────────────────────────────────────────────────────
function BP({ label, color, style = {} }) {
  return <span className="badge-pill" style={{ background: `${color}18`, color, border: `1px solid ${color}2e`, ...style }}>{label}</span>;
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function PBar({ val, G, h = 5, color }) {
  const c = color || (val >= 100 ? G.green : val >= 60 ? G.primary : val >= 30 ? G.orange : G.red);
  return <div className="progress-track" style={{ height: h }}><div className="progress-fill" style={{ "--w": `${val || 0}%`, background: `linear-gradient(90deg,${c}88,${c})` }} /></div>;
}

// ─── TOGGLE ───────────────────────────────────────────────────────────────────
function Tgl({ checked, onChange }) {
  return <label className="tgl"><input type="checkbox" checked={checked} onChange={onChange} /><span className="tgl-track" /></label>;
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "ghost", className = "", style = {}, disabled = false, type = "button" }) {
  const rpl = useRipple();
  return <button type={type} disabled={disabled} className={`btn btn-${variant} ${className}`} style={{ opacity: disabled ? 0.5 : 1, ...style }} onClick={e => { rpl(e); if (!disabled) onClick?.(e); }}>{children}</button>;
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toasts({ list, G }) {
  const col = { success: G.green, error: G.red, info: G.primary, warn: G.orange };
  const ic = { success: "✓", error: "✕", info: "i", warn: "!" };
  return (
    <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {list.map(t => {
        const c = col[t.type] || G.primary;
        return <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: G.surface, border: `1px solid ${c}33`, borderRadius: 12, boxShadow: `0 8px 24px rgba(0,0,0,0.3)`, animation: "toastSlide 0.35s cubic-bezier(0.34,1.56,0.64,1)", minWidth: 220, maxWidth: 300 }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${c}20`, display: "flex", alignItems: "center", justifyContent: "center", color: c, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{ic[t.type]}</div>
          <span style={{ color: G.text, fontSize: 13, flex: 1, fontWeight: 500 }}>{t.msg}</span>
        </div>;
      })}
    </div>
  );
}

// ─── CONFIRM ──────────────────────────────────────────────────────────────────
function Confirm({ show, msg, onYes, onNo, G }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 9997, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "overlayIn 0.2s ease" }}>
      <div className="card" style={{ padding: 24, maxWidth: 320, width: "100%", animation: "modalIn 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Are you sure?</div>
          <div style={{ color: G.sub, fontSize: 13, lineHeight: 1.6 }}>{msg}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={onNo} style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="danger" onClick={onYes} style={{ flex: 1 }}>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── TASK COMPLETE ────────────────────────────────────────────────────────────
function TaskComplete({ show, onClose, name, G }) {
  const conf = [...Array(20)].map((_, i) => ({ id: i, color: [G.primary, G.secondary, G.green, G.orange, "#ec4899"][i % 5], tx: `${(Math.random() - 0.5) * 320}px`, ty: `${Math.random() * -240 - 50}px`, tr: `${(Math.random() - 0.5) * 720}deg`, sz: 4 + Math.random() * 7, dl: Math.random() * 0.4 }));
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", animation: "overlayIn 0.2s ease", padding: 20 }}>
      <div style={{ position: "relative", textAlign: "center", animation: "modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        {conf.map(c => <div key={c.id} style={{ position: "absolute", top: "50%", left: "50%", width: c.sz, height: c.sz, background: c.color, borderRadius: Math.random() > 0.5 ? "50%" : "2px", "--tx": c.tx, "--ty": c.ty, "--tr": c.tr, animation: `confetti 1.4s ease ${c.dl}s forwards` }} />)}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 12, animation: "float 2s ease-in-out infinite" }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: G.green, marginBottom: 6 }}>Task Completed!</div>
          {name && <div style={{ color: G.sub, fontSize: 13, marginBottom: 6 }}>{name}</div>}
          <div style={{ color: G.orange, fontSize: 14, fontFamily: "'DM Mono', monospace", fontWeight: 600, marginBottom: 16 }}>+100 XP earned</div>
          <div style={{ color: G.muted, fontSize: 11 }}>Tap to continue</div>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFS PANEL ─────────────────────────────────────────────────────────────
function Notifs({ show, onClose, list, clear, G }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={onClose}>
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: Math.min(280, window.innerWidth - 16), background: G.sidebar, borderLeft: `1px solid ${G.border}`, display: "flex", flexDirection: "column", animation: "slideR 0.25s ease", boxShadow: "-4px 0 20px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${G.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
          <div style={{ display: "flex", gap: 6 }}>
            {list.length > 0 && <Btn variant="danger" className="btn-sm" onClick={clear}>Clear all</Btn>}
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: G.sub, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 10 }} className="thin-scroll">
          {list.length === 0 ? <div style={{ textAlign: "center", padding: 32, color: G.muted }}><div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div><div style={{ fontSize: 13 }}>All clear</div></div> :
            list.map((n, i) => <div key={n.id} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 6, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 11, color: G.sub, fontFamily: "'DM Mono',monospace" }}>{n.time}</span></div>
              <div style={{ color: G.text, fontSize: 12, lineHeight: 1.5 }}>{n.msg}</div>
            </div>)}
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function Profile({ emp, tasks, G, onClose }) {
  if (!emp) return null;
  const et = tasks.filter(t => t.assignedTo?._id === emp._id);
  const done = et.filter(t => t.status === "completed");
  const xp = done.length * 100 + (emp.onboardingProgress || 0);
  const rank = xp > 800 ? "Legend" : xp > 500 ? "Expert" : xp > 200 ? "Professional" : "Beginner";
  const rc = xp > 800 ? G.orange : xp > 500 ? G.secondary : xp > 200 ? G.primary : G.green;
  const earned = BADGES.filter(b => b.check(emp, tasks));
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.green, overdue: G.red };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 9996, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "overlayIn 0.2s ease" }}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "86vh", overflow: "auto", animation: "modalIn 0.35s ease" }} className="card thin-scroll">
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avt name={emp.name || "?"} size={52} G={G} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>{emp.name}</div>
                <div style={{ color: G.sub, fontSize: 12, marginBottom: 6 }}>{emp.position} · {emp.department}</div>
                <BP label={rank} color={rc} />
              </div>
            </div>
            <button onClick={onClose} style={{ background: G.card, border: `1px solid ${G.border}`, color: G.sub, borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 18 }}>
            {[{ l: "XP", v: xp, c: rc }, { l: "Done", v: done.length, c: G.green }, { l: "Tasks", v: et.length, c: G.primary }, { l: "Progress", v: `${emp.onboardingProgress || 0}%`, c: G.orange }].map((s, i) => (
              <div key={i} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</div>
                <div style={{ color: G.muted, fontSize: 9, marginTop: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: G.sub, fontWeight: 500 }}>Onboarding progress</span>
              <span style={{ fontSize: 12, color: G.primary, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{emp.onboardingProgress || 0}%</span>
            </div>
            <PBar val={emp.onboardingProgress || 0} G={G} h={7} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Achievements</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BADGES.map(b => {
                const e = b.check(emp, tasks);
                return <div key={b.id} style={{ background: e ? `${G.primary}15` : G.surface, border: `1px solid ${e ? G.primary + "33" : G.border}`, borderRadius: 10, padding: "8px 12px", textAlign: "center", opacity: e ? 1 : 0.4, minWidth: 66 }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{b.icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: e ? G.primary : G.muted }}>{b.name}</div>
                </div>;
              })}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Contact</div>
            <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: 12, fontSize: 12, color: G.sub, display: "flex", flexDirection: "column", gap: 5 }}>
              <span>📧 {emp.email}</span>
              {emp.phone && <span>📱 {emp.phone}</span>}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Tasks ({et.length})</div>
            {et.length === 0 ? <div style={{ color: G.muted, fontSize: 12, textAlign: "center", padding: 16 }}>No tasks assigned</div> :
              et.map(tk => <div key={tk._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${G.border}` }}>
                <span style={{ fontSize: 15 }}>{catIcon[tk.category] || "📌"}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{tk.title}</span>
                <BP label={tk.status.replace("_", " ")} color={tC[tk.status] || G.muted} />
              </div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
function PH({ title, sub, action, G, s }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: s?.compact ? 16 : 22, flexWrap: "wrap", gap: 10 }}>
      <div>
        <h1 style={{ fontWeight: 800, fontSize: FS[s?.fontSize || "md"].xl, marginBottom: sub ? 3 : 0, letterSpacing: -0.5 }}>{title}</h1>
        {sub && <p style={{ color: G.sub, fontSize: 13 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function SC({ icon, label, val, color, G, s, delay = 0 }) {
  return (
    <div className="card card-lift" style={{ padding: s?.compact ? "14px 16px" : "18px 20px", animationDelay: `${delay}s`, animation: "scaleIn 0.4s ease both", transition: "all 0.25s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: FS[s?.fontSize || "md"].xxl, fontWeight: 700, color, marginBottom: 4, lineHeight: 1 }}>
        <Num val={val} anim={s?.animations !== false} />
      </div>
      <div style={{ color: G.sub, fontSize: 12, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 16px", animation: "fadeUp 0.4s ease" }}>
      <div style={{ fontSize: 36, marginBottom: 10, animation: "float 3s ease-in-out infinite" }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.5 }}>{sub}</div>}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const G = THEMES.dark;
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const eRef = useRef(null);
  const pRef = useRef(null);

  useEffect(() => { setTimeout(() => { setEmail(""); setPw(""); if (eRef.current) eRef.current.value = ""; if (pRef.current) pRef.current.value = ""; }, 80); }, []);

  const handle = async e => {
    e.preventDefault();
    if (!email || !pw) { setErr("Please fill all fields"); return; }
    setLoading(true); setErr("");
    try {
      const { data } = await api.login({ email, password: pw });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      play("success");
      onLogin(data);
    } catch (error) {
      setErr(error.response?.data?.message || "Invalid credentials");
      play("error");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <style>{makeCSS(G, DEFAULTS)}</style>
      <div style={{ position: "absolute", top: "20%", left: "15%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle,${G.primary}10,transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle,${G.secondary}10,transparent 70%)`, filter: "blur(60px)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${G.primary},${G.secondary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 14px", boxShadow: `0 4px 20px ${G.primary}44` }}>⚡</div>
          <h1 style={{ fontWeight: 800, fontSize: 26, letterSpacing: -0.5, marginBottom: 5 }}>OnboardIQ</h1>
          <p style={{ color: G.sub, fontSize: 13 }}>Smart Employee Onboarding System</p>
        </div>

        <div className="card" style={{ padding: 26 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Sign in</h2>
          {err && <div style={{ background: `${G.red}12`, border: `1px solid ${G.red}2e`, borderRadius: 9, padding: "9px 12px", color: G.red, fontSize: 12, marginBottom: 14, animation: "fadeIn 0.3s ease" }}>{err}</div>}
          <form onSubmit={handle} autoComplete="off">
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: G.sub, fontSize: 12, display: "block", marginBottom: 5, fontWeight: 500 }}>Email address</label>
              <input ref={eRef} className="inp" type="email" name="oiq-email" autoComplete="new-password" autoCorrect="off" autoCapitalize="off" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: G.sub, fontSize: 12, display: "block", marginBottom: 5, fontWeight: 500 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input ref={pRef} className="inp" type={showPw ? "text" : "password"} name="oiq-password" autoComplete="new-password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: G.muted, cursor: "pointer", fontSize: 14 }}>{showPw ? "🙈" : "👁️"}</button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px" }}>
              {loading ? <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Signing in...</span> : "Sign in →"}
            </button>
          </form>
          <div style={{ marginTop: 16, padding: 12, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 9 }}>
            <p style={{ color: G.muted, fontSize: 10, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Demo</p>
            <p style={{ color: G.primary, fontSize: 12, fontFamily: "'DM Mono',monospace" }}>admin@company.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, emps, tasks, acts, G, s, l }) {
  const isAdmin = user.role === "admin" || user.role === "hr";
  const h = new Date().getHours();
  const greet = h < 12 ? l.morning : h < 17 ? l.afternoon : l.evening;
  const myTasks = tasks.filter(t => t.assignedTo?._id === user._id);
  const total = tasks.length || 1;
  const rate = Math.round((tasks.filter(t => t.status === "completed").length / total) * 100);
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.green, overdue: G.red };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <div style={{ marginBottom: s.compact ? 16 : 22 }}>
        {s.greeting && <p style={{ color: G.sub, fontSize: 13, marginBottom: 3 }}>{greet}, {user.name?.split(" ")[0]} {h < 12 ? "☀️" : h < 17 ? "🌤️" : "🌙"}</p>}
        <h1 style={{ fontWeight: 800, fontSize: FS[s.fontSize].xl, letterSpacing: -0.5 }}>{l.dashboard}</h1>
      </div>

      {isAdmin ? (
        <>
          <div className="stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            <SC icon="👥" label="Total employees" val={emps.length} color={G.primary} G={G} s={s} delay={0} />
            <SC icon="✅" label="Active" val={emps.filter(e => e.status === "active").length} color={G.green} G={G} s={s} delay={0.06} />
            <SC icon="📋" label="Total tasks" val={tasks.length} color={G.secondary} G={G} s={s} delay={0.12} />
            <SC icon="🎯" label="Completion rate" val={`${rate}%`} color={G.orange} G={G} s={s} delay={0.18} />
          </div>

          <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* Team progress */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Team progress</span>
                <BP label="Live" color={G.green} />
              </div>
              {emps.length === 0 ? <Empty icon="👥" title="No employees yet" /> :
                emps.slice(0, 6).map((emp, i) => (
                  <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13, animation: `fadeUp 0.35s ease ${i * 0.07}s both` }}>
                    <Avt name={emp.name} size={30} G={G} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</span>
                        <span style={{ fontSize: 11, color: G.primary, fontFamily: "'DM Mono',monospace", fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>{emp.onboardingProgress || 0}%</span>
                      </div>
                      <PBar val={emp.onboardingProgress || 0} G={G} />
                    </div>
                  </div>
                ))}
            </div>

            {/* Task overview */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Task overview</div>
              {[
                { label: l.done, val: tasks.filter(t => t.status === "completed").length, color: G.green },
                { label: l.active, val: tasks.filter(t => t.status === "in_progress").length, color: G.primary },
                { label: l.pending, val: tasks.filter(t => t.status === "pending").length, color: G.orange },
                { label: l.overdue, val: tasks.filter(t => t.status === "overdue").length, color: G.red },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 14, animation: `fadeUp 0.35s ease ${i * 0.07}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: item.color, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{item.val}</span>
                  </div>
                  <PBar val={Math.round((item.val / total) * 100)} G={G} color={item.color} />
                </div>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          {s.activity && (
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>Recent activity</span>
                <BP label="Live" color={G.green} />
              </div>
              <div style={{ maxHeight: 160, overflow: "auto" }} className="thin-scroll">
                {acts.length === 0 ? <Empty icon="📡" title="No activity yet" /> :
                  acts.map((a, i) => (
                    <div key={a.id} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: `1px solid ${G.border}`, animation: `fadeUp 0.3s ease ${i * 0.04}s both` }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon || "⚡"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.msg}</div>
                        <div style={{ color: G.muted, fontSize: 10, marginTop: 1, fontFamily: "'DM Mono',monospace" }}>{a.time}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card" style={{ padding: 20, marginBottom: 14, background: `linear-gradient(135deg,${G.primary}0a,${G.secondary}06)`, border: `1px solid ${G.primary}22` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <Avt name={user.name || "U"} size={50} G={G} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>{user.name}</div>
                <div style={{ color: G.sub, fontSize: 12, marginBottom: 10 }}>{user.department} · {user.position}</div>
                <PBar val={user.onboardingProgress || 0} G={G} h={7} />
                <div style={{ color: G.primary, fontSize: 11, fontFamily: "'DM Mono',monospace", marginTop: 5 }}>{user.onboardingProgress || 0}% complete</div>
              </div>
            </div>
          </div>
          <div className="stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
            <SC icon="✅" label={l.done} val={myTasks.filter(t => t.status === "completed").length} color={G.green} G={G} s={s} delay={0} />
            <SC icon="⚡" label={l.active} val={myTasks.filter(t => t.status === "in_progress").length} color={G.primary} G={G} s={s} delay={0.07} />
            <SC icon="📋" label={l.pending} val={myTasks.filter(t => t.status === "pending").length} color={G.orange} G={G} s={s} delay={0.14} />
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>My tasks</div>
            {myTasks.length === 0 ? <Empty icon="🎯" title="No tasks assigned" sub="Tasks will appear here" /> :
              myTasks.map((tk, i) => (
                <div key={tk._id} style={{ display: "flex", gap: 10, padding: 12, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, marginBottom: 8, animation: `fadeUp 0.35s ease ${i * 0.07}s both` }}>
                  <span style={{ fontSize: 16 }}>{catIcon[tk.category] || "📌"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{tk.title}</div>
                    {tk.description && <div style={{ color: G.sub, fontSize: 11, marginTop: 2 }}>{tk.description}</div>}
                    <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                      <BP label={tk.status.replace("_", " ")} color={tC[tk.status] || G.muted} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
function Employees({ emps, setEmps, tasks, addToast, addAct, G, s, l, soundOn }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [profileEmp, setProfileEmp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", position: "", phone: "" });
  const sC = { active: G.green, onboarding: G.orange, inactive: G.red };

  const filtered = emps.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()) || e.department?.toLowerCase().includes(search.toLowerCase()));

  const add = async () => {
    if (!form.name || !form.email || !form.password) { addToast("Fill required fields", "error"); return; }
    setLoading(true);
    try {
      const { data } = await api.addEmployee(form);
      setEmps([...emps, data]);
      setForm({ name: "", email: "", password: "", department: "", position: "", phone: "" });
      setShowForm(false);
      addToast(`${form.name} added!`, "success");
      addAct(`${form.name} joined the team`, "👤");
      play("success", soundOn);
    } catch (err) { addToast(err.response?.data?.message || "Failed", "error"); }
    setLoading(false);
  };

  const update = async () => {
    try {
      await api.updateEmployee(editEmp._id, editForm);
      setEmps(emps.map(e => e._id === editEmp._id ? { ...e, ...editForm } : e));
      setEditEmp(null);
      addToast("Employee updated!", "success");
      play("success", soundOn);
    } catch { addToast("Update failed", "error"); }
  };

  const remove = async () => {
    try {
      const emp = emps.find(e => e._id === confirm);
      await api.deleteEmployee(confirm);
      setEmps(emps.filter(e => e._id !== confirm));
      addToast("Removed", "info");
      addAct(`${emp?.name} was removed`, "🗑️");
      play("error", soundOn);
    } catch { addToast("Failed", "error"); }
    setConfirm(null);
  };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <Confirm show={!!confirm} msg="Permanently remove this employee?" onYes={remove} onNo={() => setConfirm(null)} G={G} />
      {profileEmp && <Profile emp={profileEmp} tasks={tasks} G={G} onClose={() => setProfileEmp(null)} />}

      {editEmp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 9996, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, animation: "overlayIn 0.2s ease" }}>
          <div className="card" style={{ width: "100%", maxWidth: 420, padding: 24, animation: "modalIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Edit employee</span>
              <button onClick={() => setEditEmp(null)} style={{ background: "transparent", border: "none", color: G.sub, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[{ k: "name", l: l.name }, { k: "department", l: l.dept }, { k: "position", l: l.position }, { k: "phone", l: l.phone }].map(f => (
                <div key={f.k}>
                  <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{f.l}</label>
                  <input className="inp" value={editForm[f.k] || ""} onChange={e => setEditForm({ ...editForm, [f.k]: e.target.value })} placeholder={f.l} />
                </div>
              ))}
              <div>
                <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>Progress %</label>
                <input className="inp" type="number" min="0" max="100" value={editForm.onboardingProgress || 0} onChange={e => setEditForm({ ...editForm, onboardingProgress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} />
              </div>
              <div>
                <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{l.status}</label>
                <select className="inp" value={editForm.status || "onboarding"} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                  {["active", "onboarding", "inactive"].map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn variant="primary" onClick={update} style={{ flex: 1 }}>Save changes</Btn>
              <Btn variant="ghost" onClick={() => setEditEmp(null)} style={{ flex: 1 }}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      <PH title={l.employees} sub={`${emps.length} employees registered`} G={G} s={s}
        action={<Btn variant="primary" onClick={() => setShowForm(!showForm)}>+ {l.addEmployee}</Btn>} />

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 14, animation: "fadeUp 0.3s ease", border: `1px solid ${G.green}22` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: G.green }}>New employee</div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ k: "name", l: `${l.name} *` }, { k: "email", l: `${l.email} *`, t: "email" }, { k: "password", l: `${l.password} *`, t: "password" }, { k: "department", l: l.dept }, { k: "position", l: l.position }, { k: "phone", l: l.phone }].map(f => (
              <div key={f.k}>
                <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{f.l}</label>
                <input className="inp" type={f.t || "text"} placeholder={f.l.replace(" *", "")} value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} autoComplete="off" />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn variant="primary" onClick={add} disabled={loading}>{loading ? "Adding..." : l.save}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>{l.cancel}</Btn>
          </div>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: G.muted, fontSize: 14 }}>🔍</span>
        <input className="inp" placeholder={l.search} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
      </div>

      <div className="emp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 11 }}>
        {filtered.length === 0 ? <div style={{ gridColumn: "1/-1" }}><Empty icon={search ? "🔍" : "👥"} title={search ? `No results for "${search}"` : "No employees yet"} sub={search ? "" : `Click "+ ${l.addEmployee}" to get started`} /></div> :
          filtered.map((emp, i) => (
            <div key={emp._id} className="card card-hover" style={{ padding: 17, animation: `fadeUp 0.35s ease ${i * 0.06}s both`, position: "relative", cursor: "default" }}>
              <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 5 }}>
                <button onClick={() => { setEditEmp(emp); setEditForm({ name: emp.name, department: emp.department, position: emp.position, phone: emp.phone, onboardingProgress: emp.onboardingProgress || 0, status: emp.status || "onboarding" }); }} style={{ background: `${G.primary}15`, border: `1px solid ${G.primary}22`, color: G.primary, borderRadius: 7, width: 26, height: 26, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit">✏️</button>
                <button onClick={() => setConfirm(emp._id)} style={{ background: `${G.red}12`, border: `1px solid ${G.red}22`, color: G.red, borderRadius: 7, width: 26, height: 26, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete">×</button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingRight: 56, cursor: "pointer" }} onClick={() => setProfileEmp(emp)}>
                <Avt name={emp.name || "?"} size={40} G={G} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: G.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</div>
                  <div style={{ color: G.sub, fontSize: 11, marginTop: 1 }}>{emp.position || "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                <BP label={emp.status || "onboarding"} color={sC[emp.status] || G.orange} />
                {emp.department && <BP label={emp.department} color={G.secondary} />}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: G.sub, fontSize: 11 }}>{l.progress}</span>
                  <span style={{ color: G.primary, fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{emp.onboardingProgress || 0}%</span>
                </div>
                <PBar val={emp.onboardingProgress || 0} G={G} />
              </div>
              {emp.phone && <div style={{ color: G.muted, fontSize: 10, marginTop: 8 }}>📱 {emp.phone}</div>}
            </div>
          ))}
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function Tasks({ user, tasks, setTasks, emps, addToast, addAct, G, s, l, soundOn }) {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState(false);
  const [doneName, setDoneName] = useState("");
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", priority: "medium", category: "other", dueDate: "" });
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.green, overdue: G.red };
  const pC = { high: G.red, medium: G.orange, low: G.green };
  const isAdmin = user.role === "admin" || user.role === "hr";
  const visible = isAdmin ? tasks : tasks.filter(t => t.assignedTo?._id === user._id);
  const filtered = filter === "all" ? visible : visible.filter(t => t.status === filter);

  const getDL = dueDate => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Overdue", c: G.red };
    if (diff === 0) return { label: "Due today", c: G.red };
    if (diff <= 2) return { label: `${diff}d left`, c: G.orange };
    return { label: `${diff}d left`, c: G.muted };
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.updateTask(id, { status });
      setTasks(tasks.map(t => t._id === id ? data : t));
      const task = tasks.find(t => t._id === id);
      if (status === "completed") {
        setDoneName(task?.assignedTo?.name || "");
        setDone(true);
        addToast("Task completed! +100 XP 🎉", "success");
        addAct(`${task?.assignedTo?.name} completed "${task?.title}"`, "✅");
        play("done", soundOn);
      } else {
        addToast("Updated!", "info");
        addAct(`"${task?.title}" started`, "▶️");
        play("click", soundOn);
      }
    } catch { addToast("Failed", "error"); }
  };

  const addTask = async () => {
    if (!form.title || !form.assignedTo) { addToast("Fill required fields", "error"); return; }
    try {
      const { data } = await api.addTask(form);
      setTasks([...tasks, data]);
      const emp = emps.find(e => e._id === form.assignedTo);
      setForm({ title: "", description: "", assignedTo: "", priority: "medium", category: "other", dueDate: "" });
      setShowForm(false);
      addToast("Task created!", "success");
      addAct(`New task → ${emp?.name || "someone"}`, "📋");
      play("success", soundOn);
    } catch { addToast("Failed", "error"); }
  };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <TaskComplete show={done} onClose={() => setDone(false)} name={doneName} G={G} />

      <PH title={l.tasks} sub={`${visible.length} tasks total`} G={G} s={s}
        action={isAdmin && <Btn variant="primary" onClick={() => setShowForm(!showForm)}>+ {l.addTask}</Btn>} />

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 14, animation: "fadeUp 0.3s ease", border: `1px solid ${G.orange}22` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: G.orange }}>New task</div>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{l.name} *</label>
              <input className="inp" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{l.assignTo} *</label>
              <select className="inp" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Select employee</option>
                {emps.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{l.desc}</label>
              <textarea className="inp" placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: "vertical", minHeight: 50 }} />
            </div>
            <div>
              <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{l.priority}</label>
              <select className="inp" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {["high", "medium", "low"].map(p => <option key={p} value={p}>{l[p] || p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{l.category}</label>
              <select className="inp" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {["documentation", "training", "setup", "meeting", "other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 500 }}>{l.dueDate}</label>
              <input className="inp" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn variant="primary" onClick={addTask}>{l.save}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>{l.cancel}</Btn>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["all", "pending", "in_progress", "completed"].map(f => (
          <button key={f} onClick={() => { setFilter(f); play("click", soundOn); }}
            style={{ background: filter === f ? G.primary : "transparent", color: filter === f ? "#fff" : G.sub, border: `1px solid ${filter === f ? G.primary : G.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: "pointer", transition: "all 0.18s", minHeight: 32, fontFamily: "inherit" }}>
            {f === "all" ? "All" : l[f === "in_progress" ? "active" : f === "completed" ? "done" : f] || f} {(f === "all" ? visible : visible.filter(t => t.status === f)).length > 0 && `(${(f === "all" ? visible : visible.filter(t => t.status === f)).length})`}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? <Empty icon="📋" title="No tasks here" sub={filter === "all" ? "Create your first task" : `No ${filter.replace("_", " ")} tasks`} /> :
          filtered.map((tk, i) => {
            const dl = getDL(tk.dueDate);
            return (
              <div key={tk._id} className="card card-hover" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start", borderLeft: `3px solid ${tC[tk.status] || G.border}22`, animation: `fadeUp 0.35s ease ${i * 0.05}s both`, transition: "all 0.2s" }}>
                <span style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }}>{catIcon[tk.category] || "📌"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 5 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tk.title}</div>
                      {tk.description && <div style={{ color: G.sub, fontSize: 12, marginTop: 2 }}>{tk.description}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flexShrink: 0 }}>
                      <BP label={tk.status.replace("_", " ")} color={tC[tk.status] || G.muted} />
                      <BP label={l[tk.priority] || tk.priority} color={pC[tk.priority] || G.muted} />
                      {dl && <BP label={dl.label} color={dl.c} />}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: G.sub, fontSize: 12 }}>👤 {tk.assignedTo?.name || "Unassigned"}</span>
                    {tk.dueDate && <span style={{ color: G.sub, fontSize: 12 }}>📅 {tk.dueDate?.split("T")[0]}</span>}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      {tk.status === "pending" && <Btn variant="ghost" className="btn-sm" onClick={() => updateStatus(tk._id, "in_progress")}>▶ Start</Btn>}
                      {tk.status === "in_progress" && <Btn variant="success" className="btn-sm" onClick={() => updateStatus(tk._id, "completed")}>✓ Complete</Btn>}
                      {tk.status === "completed" && <span style={{ color: G.green, fontSize: 12, fontWeight: 600 }}>✓ Done</span>}
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

// ─── KANBAN ───────────────────────────────────────────────────────────────────
function Kanban({ tasks, setTasks, addToast, G, s, l, soundOn }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const cols = ["pending", "in_progress", "completed"];
  const cNames = { pending: l.pending, in_progress: l.active, completed: l.done };
  const cColors = { pending: G.muted, in_progress: G.primary, completed: G.green };
  const pC = { high: G.red, medium: G.orange, low: G.green };

  const drop = async status => {
    if (!dragging || dragging.status === status) { setDragging(null); setOver(null); return; }
    try {
      const { data } = await api.updateTask(dragging._id, { status });
      setTasks(prev => prev.map(t => t._id === dragging._id ? data : t));
      addToast(`Moved to ${cNames[status]}`, "success");
      play("success", soundOn);
    } catch { addToast("Failed", "error"); }
    setDragging(null); setOver(null);
  };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.kanban} sub="Drag & drop tasks" G={G} s={s} />
      <div className="kanban-wrap" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {cols.map(col => {
          const colTasks = tasks.filter(t => t.status === col);
          return (
            <div key={col} className={`kan-col${over === col ? " over" : ""}`}
              onDragOver={e => { e.preventDefault(); setOver(col); }}
              onDrop={() => drop(col)}
              onDragLeave={() => setOver(null)}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 14, background: cColors[col], borderRadius: 2 }} />
                <span style={{ fontWeight: 700, fontSize: 12, color: cColors[col], letterSpacing: 0.3 }}>{cNames[col].toUpperCase()}</span>
                <div style={{ marginLeft: "auto", background: `${cColors[col]}18`, color: cColors[col], border: `1px solid ${cColors[col]}33`, borderRadius: 20, padding: "1px 8px", fontSize: 10, fontFamily: "'DM Mono',monospace" }}>{colTasks.length}</div>
              </div>
              {colTasks.length === 0 ? (
                <div className={`drop-hint${over === col ? " over" : ""}`}>{over === col ? "Drop here" : "Empty"}</div>
              ) : colTasks.map(tk => (
                <div key={tk._id} className={`kan-card${dragging?._id === tk._id ? " dragging" : ""}`}
                  draggable onDragStart={() => setDragging(tk)} onDragEnd={() => { setDragging(null); setOver(null); }}>
                  <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{catIcon[tk.category] || "📌"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{tk.title}</div>
                      {tk.description && <div style={{ color: G.sub, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tk.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                    <BP label={tk.priority} color={pC[tk.priority] || G.muted} />
                    {tk.assignedTo?.name && <span style={{ color: G.muted, fontSize: 9, marginLeft: "auto" }}>👤 {tk.assignedTo.name.split(" ")[0]}</span>}
                  </div>
                  {tk.dueDate && <div style={{ color: G.muted, fontSize: 10, marginTop: 5 }}>📅 {tk.dueDate?.split("T")[0]}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
function Calendar({ tasks, G, s, l }) {
  const [curr, setCurr] = useState(new Date());
  const [sel, setSel] = useState(null);
  const today = new Date();
  const year = curr.getFullYear(), month = curr.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const pC = { high: G.red, medium: G.orange, low: G.green };
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.green, overdue: G.red };

  const dayTasks = day => {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter(t => t.dueDate?.split("T")[0] === d);
  };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.calendar} sub={`${months[month]} ${year}`} G={G} s={s}
        action={
          <div style={{ display: "flex", gap: 6 }}>
            <Btn variant="ghost" className="btn-sm" onClick={() => setCurr(new Date(year, month - 1, 1))}>← Prev</Btn>
            <Btn variant="ghost" className="btn-sm" onClick={() => setCurr(new Date())}>Today</Btn>
            <Btn variant="ghost" className="btn-sm" onClick={() => setCurr(new Date(year, month + 1, 1))}>Next →</Btn>
          </div>
        } />

      <div className="card" style={{ padding: 20, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: G.muted, padding: "4px 0", fontFamily: "'DM Mono',monospace" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {[...Array(first)].map((_, i) => <div key={`e${i}`} />)}
          {[...Array(days)].map((_, i) => {
            const day = i + 1;
            const dt = dayTasks(day);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const isSel = sel === day;
            return (
              <div key={day} className={`cal-cell${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
                onClick={() => setSel(isSel ? null : day)}>
                <span>{day}</span>
                {dt.length > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 2, flexWrap: "wrap", justifyContent: "center" }}>
                    {dt.slice(0, 3).map((t, j) => <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: pC[t.priority] || G.primary }} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {sel && dayTasks(sel).length > 0 && (
        <div className="card" style={{ padding: 18, animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{months[month]} {sel} — {dayTasks(sel).length} task{dayTasks(sel).length > 1 ? "s" : ""}</div>
          {dayTasks(sel).map(tk => (
            <div key={tk._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${G.border}` }}>
              <span style={{ fontSize: 16 }}>{catIcon[tk.category] || "📌"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tk.title}</div>
                <div style={{ color: G.sub, fontSize: 11 }}>{tk.assignedTo?.name || "Unassigned"}</div>
              </div>
              <BP label={tk.status.replace("_", " ")} color={tC[tk.status] || G.muted} />
              <BP label={tk.priority} color={pC[tk.priority] || G.muted} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({ emps, tasks, G, s, l }) {
  const total = tasks.length || 1;
  const rate = Math.round((tasks.filter(t => t.status === "completed").length / total) * 100);
  const tC = { pending: G.muted, in_progress: G.primary, completed: G.green, overdue: G.red };
  const depts = [...new Set(emps.map(e => e.department).filter(Boolean))];

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.analytics} sub="Performance insights" G={G} s={s} />

      <div className="stat-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        <SC icon="👥" label="Employees" val={emps.length} color={G.primary} G={G} s={s} delay={0} />
        <SC icon="📋" label="Total tasks" val={tasks.length} color={G.orange} G={G} s={s} delay={0.06} />
        <SC icon="✅" label="Completed" val={tasks.filter(t => t.status === "completed").length} color={G.green} G={G} s={s} delay={0.12} />
        <SC icon="🎯" label="Rate" val={`${rate}%`} color={G.secondary} G={G} s={s} delay={0.18} />
      </div>

      <div className="two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Donut */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Task status</div>
          <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 16px", borderRadius: "50%", background: `conic-gradient(${G.green} 0% ${rate}%, ${G.primary} ${rate}% ${rate + Math.round((tasks.filter(t => t.status === "in_progress").length / total) * 100)}%, ${G.border} ${rate + Math.round((tasks.filter(t => t.status === "in_progress").length / total) * 100)}% 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: G.card, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 18, fontWeight: 700, color: G.green }}>{rate}%</div>
              <div style={{ color: G.muted, fontSize: 9, fontWeight: 500 }}>done</div>
            </div>
          </div>
          {["completed", "in_progress", "pending", "overdue"].map((st, i) => {
            const c = tasks.filter(t => t.status === st).length;
            return <div key={st} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: tC[st], flexShrink: 0 }} />
              <span style={{ fontSize: 12, flex: 1, fontWeight: 500, textTransform: "capitalize" }}>{st.replace("_", " ")}</span>
              <span style={{ fontSize: 11, color: tC[st], fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{c}</span>
            </div>;
          })}
        </div>

        {/* Employee performance */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 16 }}>Employee performance</div>
          {emps.length === 0 ? <Empty icon="📊" title="No data" sub="Add employees first" /> :
            emps.map((emp, i) => {
              const done = tasks.filter(t => t.assignedTo?._id === emp._id && t.status === "completed").length;
              const tot = tasks.filter(t => t.assignedTo?._id === emp._id).length;
              return <div key={emp._id} style={{ marginBottom: 13, animation: `fadeUp 0.35s ease ${i * 0.07}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Avt name={emp.name} size={22} G={G} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{emp.name?.split(" ")[0]}</span>
                  </div>
                  <span style={{ fontSize: 10, color: G.primary, fontFamily: "'DM Mono',monospace" }}>{done}/{tot} · {emp.onboardingProgress || 0}%</span>
                </div>
                <PBar val={emp.onboardingProgress || 0} G={G} h={6} />
              </div>;
            })}
        </div>
      </div>

      {depts.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Department breakdown</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
            {depts.map((dept, i) => {
              const de = emps.filter(e => e.department === dept);
              const avg = Math.round(de.reduce((a, e) => a + (e.onboardingProgress || 0), 0) / de.length);
              return <div key={i} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: 12, textAlign: "center", animation: `fadeUp 0.35s ease ${i * 0.07}s both` }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 700, color: G.primary, marginBottom: 3 }}>{avg}%</div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{dept}</div>
                <div style={{ color: G.muted, fontSize: 10 }}>{de.length} member{de.length !== 1 ? "s" : ""}</div>
                <div style={{ marginTop: 8 }}><PBar val={avg} G={G} h={4} /></div>
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function Leaderboard({ emps, tasks, G, s, l }) {
  const ranked = emps.map(emp => {
    const et = tasks.filter(t => t.assignedTo?._id === emp._id);
    const done = et.filter(t => t.status === "completed").length;
    const xp = done * 100 + (emp.onboardingProgress || 0);
    const rank = xp > 800 ? "Legend" : xp > 500 ? "Expert" : xp > 200 ? "Professional" : "Beginner";
    const rc = xp > 800 ? G.orange : xp > 500 ? G.secondary : xp > 200 ? G.primary : G.green;
    const badges = BADGES.filter(b => b.check(emp, tasks));
    return { ...emp, xp, done, total: et.length, rank, rc, badges };
  }).sort((a, b) => b.xp - a.xp);

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.leaderboard} sub="Rankings by XP earned" G={G} s={s} />

      {ranked.length === 0 ? <Empty icon="🏆" title="No rankings yet" sub="Complete tasks to earn XP" /> : (
        <>
          {ranked.length >= 3 && (
            <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-end", justifyContent: "center", flexWrap: "wrap" }}>
              {[ranked[1], ranked[0], ranked[2]].map((emp, i) => {
                const hs = [120, 160, 100], meds = ["🥈", "🥇", "🥉"];
                return emp ? <div key={emp._id} style={{ flex: 1, minWidth: 80, maxWidth: 130, textAlign: "center", animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
                  <div style={{ fontSize: 24, marginBottom: 7 }}>{meds[i]}</div>
                  <Avt name={emp.name} size={38} G={G} />
                  <div style={{ fontSize: 12, fontWeight: 700, margin: "7px 0 4px" }}>{emp.name?.split(" ")[0]}</div>
                  <BP label={emp.rank} color={emp.rc} />
                  <div style={{ height: hs[i], background: `linear-gradient(180deg,${emp.rc}18,${emp.rc}06)`, border: `1px solid ${emp.rc}22`, borderRadius: "10px 10px 0 0", marginTop: 7, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, fontWeight: 700, color: emp.rc }}>{emp.xp}</div>
                    <div style={{ color: G.muted, fontSize: 9 }}>XP</div>
                  </div>
                </div> : null;
              })}
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Full rankings</div>
            {ranked.map((emp, i) => (
              <div key={emp._id} className="card-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: i === 0 ? `${G.orange}06` : G.card, border: `1px solid ${i === 0 ? G.orange + "22" : G.border}`, borderRadius: 10, marginBottom: 7, animation: `fadeUp 0.35s ease ${i * 0.05}s both`, transition: "all 0.2s" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: i < 3 ? `${[G.orange, G.muted, G.primary][i]}18` : G.surface, border: `1px solid ${i < 3 ? [G.orange, G.muted, G.primary][i] : G.border}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 700, color: i < 3 ? [G.orange, G.muted, G.primary][i] : G.muted, flexShrink: 0 }}>
                  {["🥇", "🥈", "🥉"][i] || i + 1}
                </div>
                <Avt name={emp.name || "?"} size={32} G={G} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{emp.name}</span>
                    <BP label={emp.rank} color={emp.rc} />
                    {emp.badges.slice(0, 2).map(b => <span key={b.id} style={{ fontSize: 12 }}>{b.icon}</span>)}
                  </div>
                  <PBar val={emp.onboardingProgress || 0} G={G} h={4} />
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color: emp.rc }}>{emp.xp}</div>
                  <div style={{ color: G.muted, fontSize: 9 }}>{emp.done} done</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── WORKFLOWS ────────────────────────────────────────────────────────────────
function Workflows({ emps, addToast, addAct, G, s, l, soundOn }) {
  const [wfs, setWfs] = useState([]);
  const [sel, setSel] = useState(null);
  const [emp, setEmp] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getWorkflows().then(({ data }) => setWfs(data)).catch(() => addToast("Failed", "error")).finally(() => setLoading(false)); }, []);

  const assign = async wf => {
    if (!emp) { addToast("Select employee first", "error"); return; }
    try {
      await api.assignWorkflow(wf._id, emp);
      const e = emps.find(x => x._id === emp);
      addToast(`${wf.name} assigned to ${e?.name}!`, "success");
      addAct(`Workflow "${wf.name}" → ${e?.name}`, "🔄");
      play("success", soundOn);
      setSel(null); setEmp("");
    } catch { addToast("Failed", "error"); }
  };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.workflows} sub="Onboarding templates" G={G} s={s} />
      {loading ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 11 }}>{[1, 2, 3].map(i => <Skel key={i} h={200} />)}</div> :
        wfs.length === 0 ? <Empty icon="🔄" title="No workflows" sub="Add via Thunder Client API" /> :
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 11 }}>
            {wfs.map((wf, i) => (
              <div key={wf._id} className="card card-hover" style={{ padding: 18, animation: `fadeUp 0.35s ease ${i * 0.07}s both` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{wf.name}</div>
                    <BP label={wf.department || "All"} color={G.secondary} />
                  </div>
                  <div style={{ background: `${G.primary}15`, color: G.primary, border: `1px solid ${G.primary}22`, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>{wf.steps?.length || 0} steps</div>
                </div>
                <p style={{ color: G.sub, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>{wf.description}</p>
                {wf.steps?.map((st, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 0", borderBottom: `1px solid ${G.border}` }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: `${G.primary}15`, color: G.primary, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontFamily: "'DM Mono',monospace" }}>{st.order}</div>
                    <span style={{ fontSize: 11 }}>{catIcon[st.category] || "📌"}</span>
                    <span style={{ fontSize: 11, flex: 1 }}>{st.title}</span>
                    <span style={{ color: G.muted, fontSize: 9, fontFamily: "'DM Mono',monospace" }}>{st.estimatedDays}d</span>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <Btn variant="ghost" style={{ width: "100%" }} onClick={() => setSel(sel === wf._id ? null : wf._id)}>Assign workflow</Btn>
                  {sel === wf._id && (
                    <div style={{ marginTop: 8, display: "flex", gap: 7, animation: "fadeUp 0.25s ease" }}>
                      <select className="inp" value={emp} onChange={e => setEmp(e.target.value)} style={{ flex: 1 }}>
                        <option value="">Select employee</option>
                        {emps.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                      </select>
                      <Btn variant="primary" className="btn-sm" onClick={() => assign(wf)}>Go</Btn>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>}
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports({ emps, tasks, G, s, l, addToast, soundOn }) {
  const [sel, setSel] = useState("");
  const [gen, setGen] = useState(false);

  const generate = empId => {
    const id = empId || sel; if (!id) return;
    setGen(true); play("click", soundOn);
    const emp = emps.find(e => e._id === id);
    const et = tasks.filter(t => t.assignedTo?._id === id);
    const done = et.filter(t => t.status === "completed");
    const pend = [...et.filter(t => t.status === "in_progress"), ...et.filter(t => t.status === "pending")];
    const xp = done.length * 100 + (emp?.onboardingProgress || 0);
    const badges = BADGES.filter(b => b.check(emp || {}, tasks));

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OnboardIQ — ${emp?.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=DM+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0;}body{background:#0f1117;color:#f1f5f9;font-family:'Bricolage Grotesque',sans-serif;padding:40px;max-width:760px;margin:0 auto;}
.header{background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:28px;text-align:center;margin-bottom:22px;}
.logo{font-size:22px;font-weight:800;color:#6366f1;letter-spacing:-0.5px;margin-bottom:4px;}
.name{font-size:20px;font-weight:800;margin-top:12px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:20px;}
.stat{background:#1a1d27;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;text-align:center;}
.sv{font-family:'DM Mono',monospace;font-size:22px;font-weight:700;}
.sl{color:#475569;font-size:9px;margin-top:3px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;}
.section{background:#1a1d27;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:18px;margin-bottom:14px;}
.sh{font-size:11px;font-weight:700;color:#6366f1;margin-bottom:11px;padding-left:9px;border-left:3px solid #6366f1;}
.task{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:600;font-family:'DM Mono',monospace;}
.prog{height:5px;background:rgba(255,255,255,0.08);border-radius:5px;overflow:hidden;margin:8px 0;}
.prog-fill{height:100%;border-radius:5px;}
.footer{text-align:center;margin-top:28px;color:#1e293b;font-size:9px;font-family:'DM Mono',monospace;letter-spacing:0.5px;}
</style></head><body>
<div class="header">
<div class="logo">⚡ OnboardIQ</div>
<div style="color:#475569;font-size:10px;letter-spacing:1px;font-family:'DM Mono',monospace">EMPLOYEE ONBOARDING REPORT</div>
<div class="name">${emp?.name}</div>
<div style="color:#64748b;font-size:12px;margin-top:4px">${emp?.position || ""} · ${emp?.department || ""} · ${emp?.email}</div>
<div style="margin-top:10px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
<span class="badge" style="background:${emp?.status === "active" ? "#10b98118" : "#f59e0b18"};color:${emp?.status === "active" ? "#10b981" : "#f59e0b"};border:1px solid ${emp?.status === "active" ? "#10b98133" : "#f59e0b33"}">${emp?.status?.toUpperCase() || "ONBOARDING"}</span>
<span class="badge" style="background:#6366f115;color:#6366f1;border:1px solid #6366f133">${xp} XP</span>
${badges.map(b => `<span class="badge" style="background:#f59e0b15;color:#f59e0b;border:1px solid #f59e0b33">${b.icon} ${b.name}</span>`).join("")}
</div></div>
<div class="stats">
<div class="stat" style="border-color:#6366f133"><div class="sv" style="color:#6366f1">${emp?.onboardingProgress || 0}%</div><div class="sl">Progress</div><div class="prog"><div class="prog-fill" style="width:${emp?.onboardingProgress || 0}%;background:linear-gradient(90deg,#6366f188,#6366f1)"></div></div></div>
<div class="stat" style="border-color:#10b98133"><div class="sv" style="color:#10b981">${done.length}</div><div class="sl">Completed</div></div>
<div class="stat" style="border-color:#f59e0b33"><div class="sv" style="color:#f59e0b">${et.filter(t => t.status === "in_progress").length}</div><div class="sl">In Progress</div></div>
<div class="stat" style="border-color:#47556933"><div class="sv" style="color:#475569">${et.filter(t => t.status === "pending").length}</div><div class="sl">Pending</div></div>
</div>
<div class="section"><div class="sh">COMPLETED TASKS (${done.length})</div>${done.length === 0 ? '<div style="color:#475569;text-align:center;padding:12px;font-size:12px">No completed tasks yet</div>' : done.map(t => `<div class="task"><span style="font-size:14px">${catIconStr[t.category] || "📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:12px">${t.title}</div>${t.description ? `<div style="color:#475569;font-size:10px">${t.description}</div>` : ""}</div><span class="badge" style="background:#10b98115;color:#10b981;border:1px solid #10b98133">Done ✓</span></div>`).join("")}</div>
<div class="section"><div class="sh">PENDING TASKS (${pend.length})</div>${pend.length === 0 ? '<div style="color:#475569;text-align:center;padding:12px;font-size:12px">All done! 🎉</div>' : pend.map(t => `<div class="task"><span style="font-size:14px">${catIconStr[t.category] || "📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:12px">${t.title}</div><div style="color:#475569;font-size:10px">Due: ${t.dueDate?.split("T")[0] || "No deadline"}</div></div><span class="badge" style="background:#6366f115;color:#6366f1;border:1px solid #6366f133">${t.status.replace("_", " ")}</span></div>`).join("")}</div>
<div class="footer">Generated by OnboardIQ · ${new Date().toLocaleDateString()} · Confidential</div>
</body></html>`;

    setTimeout(() => {
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${emp?.name?.replace(" ", "_")}_OnboardIQ_Report.html`; a.click();
      URL.revokeObjectURL(url);
      setGen(false);
      addToast("Report downloaded!", "success");
      play("success", soundOn);
    }, 800);
  };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.reports} sub="Generate employee reports" G={G} s={s} />

      <div className="card" style={{ padding: 22, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Generate report</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: G.sub, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 }}>Select employee</label>
          <select className="inp" value={sel} onChange={e => setSel(e.target.value)}>
            <option value="">Choose employee...</option>
            {emps.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        {sel && (() => {
          const emp = emps.find(e => e._id === sel), et = tasks.filter(t => t.assignedTo?._id === sel);
          return <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: 13, marginBottom: 13, animation: "fadeUp 0.25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avt name={emp?.name || "?"} size={40} G={G} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{emp?.name}</div>
                <div style={{ color: G.sub, fontSize: 11, marginBottom: 7 }}>{emp?.position} · {emp?.department}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <BP label={`${emp?.onboardingProgress || 0}%`} color={G.primary} />
                  <BP label={`${et.filter(t => t.status === "completed").length} done`} color={G.green} />
                  <BP label={`${et.length} total`} color={G.orange} />
                </div>
              </div>
            </div>
          </div>;
        })()}
        <Btn variant="primary" onClick={() => generate()} disabled={!sel || gen}>{gen ? "Generating..." : "📄 " + l.download + " Report"}</Btn>
        <p style={{ color: G.muted, fontSize: 11, marginTop: 8 }}>Opens in browser — print as PDF with Ctrl+P</p>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>All employees</div>
        {emps.length === 0 ? <Empty icon="👥" title="No employees" sub="Add employees first" /> :
          emps.map((emp, i) => {
            const et = tasks.filter(t => t.assignedTo?._id === emp._id);
            return <div key={emp._id} className="card-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, marginBottom: 7, animation: `fadeUp 0.35s ease ${i * 0.05}s both`, transition: "all 0.2s" }}>
              <Avt name={emp.name || "?"} size={30} G={G} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{emp.name}</div>
                <PBar val={emp.onboardingProgress || 0} G={G} h={4} />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <BP label={`${emp.onboardingProgress || 0}%`} color={G.primary} />
                <BP label={`${et.filter(t => t.status === "completed").length}/${et.length}`} color={G.green} />
              </div>
              <Btn variant="ghost" className="btn-sm btn-icon" onClick={() => { setSel(emp._id); generate(emp._id); }}>📄</Btn>
            </div>;
          })}
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AI({ G, s, l, emps, tasks }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: "Hello! I'm your OnboardIQ AI assistant. I can analyze employee data, track onboarding progress, and answer questions about your team. What would you like to know?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput(""); setLoading(true);
    setMsgs(prev => [...prev, { role: "user", text: q }]);

    const rate = Math.round((tasks.filter(t => t.status === "completed").length / (tasks.length || 1)) * 100);
    const ctx = `You are an AI assistant for OnboardIQ, a professional employee onboarding system. Be concise and professional. Answer in 2-3 sentences max.
Data: ${emps.length} employees, ${emps.filter(e => e.status === "active").length} active, ${emps.filter(e => e.status === "onboarding").length} onboarding. 
Tasks: ${tasks.length} total, ${tasks.filter(t => t.status === "completed").length} done, ${tasks.filter(t => t.status === "pending").length} pending, ${tasks.filter(t => t.status === "in_progress").length} active, ${tasks.filter(t => t.status === "overdue").length} overdue.
Completion rate: ${rate}%. Avg progress: ${emps.length ? Math.round(emps.reduce((a, e) => a + (e.onboardingProgress || 0), 0) / emps.length) : 0}%.
Employees: ${emps.map(e => `${e.name}(${e.department},${e.onboardingProgress || 0}%)`).join(", ") || "none"}.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 300, system: ctx, messages: [{ role: "user", content: q }] }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: "ai", text: data.content?.[0]?.text || "I couldn't process that. Please try again." }]);
    } catch {
      setMsgs(prev => [...prev, { role: "ai", text: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const quickQ = ["Who needs attention?", "Team summary", "Any overdue tasks?", "Top performer?"];

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.ai} sub="Powered by Claude AI" G={G} s={s} />
      <div className="card" style={{ height: "calc(100vh - 200px)", minHeight: 400, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 10 }} className="thin-scroll">
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "ai-bubble-user" : "ai-bubble-bot"}>
              {m.role === "ai" && <div style={{ fontSize: 10, color: G.primary, fontWeight: 600, marginBottom: 4, fontFamily: "'DM Mono',monospace" }}>⚡ OnboardIQ AI</div>}
              <div>{m.text}</div>
            </div>
          ))}
          {loading && (
            <div className="ai-bubble-bot">
              <div style={{ fontSize: 10, color: G.primary, fontWeight: 600, marginBottom: 6, fontFamily: "'DM Mono',monospace" }}>⚡ OnboardIQ AI</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: G.primary, animation: `dot-blink 1.2s ease ${d}s infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div style={{ padding: "8px 14px", borderTop: `1px solid ${G.border}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {quickQ.map((q, i) => (
            <button key={i} onClick={() => setInput(q)} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 20, padding: "4px 10px", color: G.sub, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = G.primary; e.currentTarget.style.color = G.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.color = G.sub; }}>
              {q}
            </button>
          ))}
        </div>

        <div style={{ padding: "10px 14px", borderTop: `1px solid ${G.border}`, display: "flex", gap: 8 }}>
          <input className="inp" value={input} onChange={e => setInput(e.target.value)} placeholder={l.ai + "..."} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} style={{ flex: 1 }} />
          <Btn variant="primary" onClick={send} disabled={!input.trim() || loading}>Send</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ settings, setSettings, G, l, user, addToast }) {
  const save = (key, val) => {
    const n = { ...settings, [key]: val };
    setSettings(n);
    localStorage.setItem("appSettings", JSON.stringify(n));
    addToast("Saved!", "success");
  };

  const Row = ({ label, sub, children }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${G.border}` }}>
      <div style={{ flex: 1, paddingRight: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: G.sub, marginTop: 1 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  const Sec = ({ title, children }) => (
    <div className="card" style={{ padding: 20, marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: G.primary }}>{title}</div>
      {children}
    </div>
  );

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <PH title={l.settings} sub="Customize your experience" G={G} s={settings} />

      <Sec title="🎨 Appearance">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: G.sub, marginBottom: 10, fontWeight: 500 }}>Theme</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
            {Object.entries(THEMES).map(([key, th]) => (
              <button key={key} onClick={() => save("theme", key)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: settings.theme === key ? `${G.primary}18` : G.surface, border: `1.5px solid ${settings.theme === key ? G.primary : G.border}`, borderRadius: 10, cursor: "pointer", color: settings.theme === key ? G.primary : G.sub, transition: "all 0.18s", fontFamily: "inherit", fontSize: 12, fontWeight: 500 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: th.primary, flexShrink: 0 }} />
                <span>{th.name}</span>
                {settings.theme === key && <span style={{ marginLeft: "auto", fontSize: 13 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        <Row label="Font size" sub="Adjust text size">
          <div style={{ display: "flex", gap: 5 }}>
            {[["sm", "S"], ["md", "M"], ["lg", "L"]].map(([k, lb]) => (
              <button key={k} onClick={() => save("fontSize", k)}
                style={{ width: 32, height: 32, background: settings.fontSize === k ? G.primary : G.surface, border: `1px solid ${settings.fontSize === k ? G.primary : G.border}`, borderRadius: 8, color: settings.fontSize === k ? "#fff" : G.sub, cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s" }}>
                {lb}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Compact mode" sub="Reduce spacing">
          <Tgl checked={settings.compact} onChange={e => save("compact", e.target.checked)} />
        </Row>
      </Sec>

      <Sec title="🌐 Language">
        <Row label="App language" sub="English or Tamil">
          <div style={{ display: "flex", gap: 5 }}>
            {[["en", "English"], ["ta", "தமிழ்"]].map(([code, label]) => (
              <button key={code} onClick={() => save("lang", code)}
                style={{ padding: "6px 14px", background: settings.lang === code ? G.primary : G.surface, border: `1px solid ${settings.lang === code ? G.primary : G.border}`, borderRadius: 8, color: settings.lang === code ? "#fff" : G.sub, cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        </Row>
      </Sec>

      <Sec title="⚡ Experience">
        <Row label="Animations" sub="Smooth transitions and effects">
          <Tgl checked={settings.animations} onChange={e => save("animations", e.target.checked)} />
        </Row>
        <Row label="Sound effects" sub="Play sounds on actions">
          <Tgl checked={settings.sound} onChange={e => save("sound", e.target.checked)} />
        </Row>
        {settings.sound && (
          <div style={{ padding: "10px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["Click", "click"], ["Success", "success"], ["Complete", "done"], ["Error", "error"]].map(([lb, type]) => (
              <Btn key={type} variant="ghost" className="btn-sm" onClick={() => play(type, true)}>{lb}</Btn>
            ))}
          </div>
        )}
        <Row label="Time greeting" sub="Good morning / afternoon / evening">
          <Tgl checked={settings.greeting} onChange={e => save("greeting", e.target.checked)} />
        </Row>
        <Row label="Activity feed" sub="Show live activity on dashboard">
          <Tgl checked={settings.activity} onChange={e => save("activity", e.target.checked)} />
        </Row>
      </Sec>

      <Sec title="👤 Account">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${G.border}` }}>
          <Avt name={user.name || "U"} size={46} G={G} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
            <div style={{ color: G.sub, fontSize: 12, marginBottom: 5 }}>{user.email}</div>
            <BP label={user.role} color={G.primary} />
          </div>
        </div>
        <div style={{ padding: "12px 0" }}>
          <Btn variant="ghost" onClick={() => addToast("Contact admin to change password", "info")}>Change password</Btn>
        </div>
      </Sec>

      <Sec title="🔄 Reset">
        <Row label="Reset all settings" sub="Restore defaults">
          <Btn variant="danger" className="btn-sm" onClick={() => { setSettings(DEFAULTS); localStorage.setItem("appSettings", JSON.stringify(DEFAULTS)); addToast("Settings reset", "info"); }}>Reset</Btn>
        </Row>
      </Sec>
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: "dashboard", icon: "🏠", group: "main" },
  { key: "employees", icon: "👥", group: "main", admin: true },
  { key: "tasks", icon: "📋", group: "main" },
  { key: "kanban", icon: "🗃️", group: "views" },
  { key: "calendar", icon: "📅", group: "views" },
  { key: "analytics", icon: "📊", group: "insights", admin: true },
  { key: "leaderboard", icon: "🏆", group: "insights" },
  { key: "reports", icon: "📄", group: "insights", admin: true },
  { key: "workflows", icon: "🔄", group: "insights", admin: true },
  { key: "ai", icon: "🤖", group: "tools" },
  { key: "settings", icon: "⚙️", group: "tools" },
];

function Layout({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [emps, setEmps] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [acts, setActs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobMenu, setMobMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(() => {
    try { const s = localStorage.getItem("appSettings"); return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS; } catch { return DEFAULTS; }
  });

  const G = THEMES[settings.theme] || THEMES.dark;
  const l = LANG[settings.lang] || LANG.en;
  const soundOn = settings.sound;

  useEffect(() => { document.body.style.background = G.bg; document.body.style.color = G.text; }, [G.bg, G.text]);

  const addToast = (msg, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    if (type === "success") play("click", soundOn);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  const addNotif = (msg, type = "info") => {
    const id = Date.now(), time = new Date().toLocaleTimeString();
    setNotifs(p => [{ id, msg, type, time }, ...p].slice(0, 20));
  };

  const addAct = (msg, icon = "⚡") => {
    const id = Date.now(), time = new Date().toLocaleTimeString();
    setActs(p => [{ id, msg, icon, time }, ...p].slice(0, 30));
  };

  useEffect(() => {
    const isAdmin = user.role === "admin" || user.role === "hr";
    Promise.all([api.getTasks(), isAdmin ? api.getEmployees() : Promise.resolve({ data: [] })])
      .then(([tr, er]) => { setTasks(tr.data); setEmps(er.data); addAct("System ready", "⚡"); addNotif("Welcome back! System online", "success"); })
      .catch(() => addToast("Failed to load data", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = e => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.ctrlKey && e.key === "k") { e.preventDefault(); setShowSearch(p => !p); }
      if (e.key === "Escape") { setShowSearch(false); setShowNotifs(false); setMobMenu(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const isAdmin = user.role === "admin" || user.role === "hr";
  const navItems = NAV_ITEMS.filter(n => !n.admin || isAdmin);
  const groups = ["main", "views", "insights", "tools"];
  const groupLabels = { main: "Main", views: "Views", insights: "Insights", tools: "Tools" };
  const unread = notifs.length;
  const pp = { user, emps, setEmps, tasks, setTasks, addToast, addAct, G, s: settings, l, soundOn };

  const navTo = key => { setPage(key); play("click", soundOn); };

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", background: G.bg, display: "flex" }}>
      <style>{makeCSS(G, settings)}</style>

      {/* Ambient */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "8%", left: "4%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle,${G.primary}06,transparent 70%)`, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "8%", right: "4%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle,${G.secondary}06,transparent 70%)`, filter: "blur(80px)" }} />
      </div>

      <Toasts list={toasts} G={G} />
      <Notifs show={showNotifs} onClose={() => setShowNotifs(false)} list={notifs} clear={() => setNotifs([])} G={G} />

      {/* Search */}
      {showSearch && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", zIndex: 9995, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "70px 16px", animation: "overlayIn 0.2s ease" }} onClick={() => setShowSearch(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 460, animation: "modalIn 0.3s ease" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "11px 14px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ color: G.muted, fontSize: 15 }}>🔍</span>
              <input autoFocus placeholder={l.search} style={{ flex: 1, background: "transparent", border: "none", color: G.text, fontSize: 14, outline: "none", fontFamily: "inherit" }}
                onChange={e => {
                  const q = e.target.value.toLowerCase();
                  if (q.length < 2) return;
                  if (emps.find(x => x.name?.toLowerCase().includes(q))) { navTo("employees"); setShowSearch(false); }
                  else if (tasks.find(x => x.title?.toLowerCase().includes(q))) { navTo("tasks"); setShowSearch(false); }
                }} />
              <kbd style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 5, padding: "2px 6px", color: G.muted, fontFamily: "'DM Mono',monospace", fontSize: 9 }}>ESC</kbd>
            </div>
            <div style={{ padding: 8 }}>
              {navItems.map((item, i) => (
                <button key={i} onClick={() => { navTo(item.key); setShowSearch(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: G.text, transition: "all 0.15s", textAlign: "left", fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}
                  onMouseEnter={e => e.currentTarget.style.background = `${G.primary}10`}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{l[item.key === "ai" ? "ai" : item.key] || item.key}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="mob-header">
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3 }}>⚡ OnboardIQ</div>
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={() => setShowSearch(true)} style={{ background: G.card, border: `1px solid ${G.border}`, color: G.sub, borderRadius: 9, width: 36, height: 36, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>🔍</button>
          <button onClick={() => setShowNotifs(true)} style={{ background: G.card, border: `1px solid ${G.border}`, color: G.sub, borderRadius: 9, width: 36, height: 36, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            🔔{unread > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: G.red, color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{unread > 9 ? "9+" : unread}</span>}
          </button>
          <button onClick={() => setMobMenu(p => !p)} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 9, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, overflow: "hidden" }}>
            <Avt name={user.name || "U"} size={36} G={G} />
          </button>
          <button onClick={onLogout} style={{ background: `${G.red}12`, border: `1px solid ${G.red}22`, color: G.red, borderRadius: 9, width: 36, height: 36, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>⏻</button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobMenu && (
        <>
          <div style={{ position: "fixed", top: 58, right: 12, zIndex: 300, background: G.surface, border: `1px solid ${G.border}`, borderRadius: 13, padding: 12, minWidth: 190, animation: "fadeUp 0.2s ease", boxShadow: "0 8px 28px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${G.border}` }}>
              <Avt name={user.name || "U"} size={36} G={G} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                <div style={{ color: G.sub, fontSize: 10 }}>{user.email}</div>
              </div>
            </div>
            {[{ icon: "⚙️", label: l.settings, k: "settings" }, { icon: "📊", label: l.analytics, k: "analytics" }, { icon: "🤖", label: l.ai, k: "ai" }, { icon: "📄", label: l.reports, k: "reports" }].map((item, i) => (
              <button key={i} onClick={() => { navTo(item.k); setMobMenu(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 7px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: G.text, fontSize: 13, fontFamily: "inherit", fontWeight: 500, transition: "all 0.15s", textAlign: "left" }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
            <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 7px", background: `${G.red}10`, border: `1px solid ${G.red}18`, borderRadius: 8, cursor: "pointer", color: G.red, fontSize: 13, fontFamily: "inherit", fontWeight: 600, marginTop: 8, transition: "all 0.15s" }}>
              <span style={{ fontSize: 15 }}>⏻</span><span>{l.signOut}</span>
            </button>
          </div>
          <div style={{ position: "fixed", inset: 0, zIndex: 299 }} onClick={() => setMobMenu(false)} />
        </>
      )}

      {/* Desktop Sidebar */}
      <div className="sidebar" style={{ width: settings.compact ? 180 : 200, background: G.sidebar, borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 100, transition: "all 0.3s ease" }}>
        <div style={{ padding: "16px 14px 12px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${G.primary},${G.secondary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, boxShadow: `0 2px 10px ${G.primary}44` }}>⚡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: -0.3 }}>OnboardIQ</div>
              <div style={{ color: G.muted, fontSize: 9, fontFamily: "'DM Mono',monospace" }}>v3.0</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "8px 10px", borderBottom: `1px solid ${G.border}` }}>
          <button onClick={() => setShowSearch(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", background: G.card, border: `1px solid ${G.border}`, borderRadius: 9, color: G.muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit", transition: "all 0.15s" }}>
            <span>🔍</span>
            <span style={{ flex: 1, textAlign: "left" }}>{l.search}</span>
            <kbd style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 4, padding: "1px 5px", color: G.muted, fontFamily: "'DM Mono',monospace", fontSize: 8 }}>⌘K</kbd>
          </button>
        </div>

        <nav style={{ flex: 1, padding: "10px 8px", overflow: "auto" }} className="thin-scroll">
          {groups.map(group => {
            const items = navItems.filter(n => n.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} style={{ marginBottom: 14 }}>
                <div style={{ color: G.muted, fontSize: 9, fontWeight: 600, padding: "4px 10px 6px", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'DM Mono',monospace" }}>{groupLabels[group]}</div>
                {items.map(item => (
                  <button key={item.key} onClick={() => navTo(item.key)} className={`nav-item${page === item.key ? " active" : ""}`}>
                    <div className="nav-dot" />
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.key === "ai" ? l.ai : l[item.key] || item.key}</span>
                    {item.key === "ai" && <span style={{ background: `${G.primary}20`, color: G.primary, fontSize: 8, padding: "1px 5px", borderRadius: 20, fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>AI</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "10px 8px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: G.card, border: `1px solid ${G.border}`, borderRadius: 10, marginBottom: 8 }}>
            <Avt name={user.name || "U"} size={26} G={G} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ color: G.muted, fontSize: 9, fontFamily: "'DM Mono',monospace" }}>{user.role}</div>
            </div>
          </div>
          <button onClick={() => { setShowNotifs(!showNotifs); }} style={{ width: "100%", background: `${G.primary}10`, color: G.primary, border: `1px solid ${G.primary}22`, borderRadius: 9, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 500, fontFamily: "inherit", marginBottom: 5, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            🔔 Notifications{unread > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: G.red, color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{unread > 9 ? "9+" : unread}</span>}
          </button>
          <button onClick={onLogout} style={{ width: "100%", background: `${G.red}10`, color: G.red, border: `1px solid ${G.red}22`, borderRadius: 9, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            ⏻ {l.signOut}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="main-area" style={{ marginLeft: settings.compact ? 180 : 200, flex: 1, padding: settings.compact ? "20px 20px 32px" : "24px 24px 36px", maxWidth: `calc(100vw - ${settings.compact ? 180 : 200}px)`, position: "relative", zIndex: 1 }}>
        {loading ? (
          <div>
            <Skel h={28} r={8} style={{ width: 180, marginBottom: 18 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>{[1, 2, 3, 4].map(i => <Skel key={i} h={88} />)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12 }}><Skel h={260} /><Skel h={260} /></div>
          </div>
        ) : (
          <>
            {page === "dashboard" && <Dashboard {...pp} acts={acts} />}
            {page === "employees" && <Employees {...pp} />}
            {page === "tasks" && <Tasks {...pp} />}
            {page === "kanban" && <Kanban tasks={tasks} setTasks={setTasks} addToast={addToast} G={G} s={settings} l={l} soundOn={soundOn} />}
            {page === "calendar" && <Calendar tasks={tasks} G={G} s={settings} l={l} />}
            {page === "analytics" && <Analytics emps={emps} tasks={tasks} G={G} s={settings} l={l} />}
            {page === "leaderboard" && <Leaderboard emps={emps} tasks={tasks} G={G} s={settings} l={l} />}
            {page === "reports" && <Reports emps={emps} tasks={tasks} G={G} s={settings} l={l} addToast={addToast} soundOn={soundOn} />}
            {page === "workflows" && <Workflows emps={emps} addToast={addToast} addAct={addAct} G={G} s={settings} l={l} soundOn={soundOn} />}
            {page === "ai" && <AI G={G} s={settings} l={l} emps={emps} tasks={tasks} />}
            {page === "settings" && <Settings settings={settings} setSettings={setSettings} G={G} l={l} user={user} addToast={addToast} />}
          </>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="mob-bar" style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {[
          { key: "dashboard", icon: "🏠", label: l.dashboard },
          { key: "employees", icon: "👥", label: l.employees },
          { key: "tasks", icon: "📋", label: l.tasks },
          { key: "leaderboard", icon: "🏆", label: l.leaderboard },
          { key: "settings", icon: "⚙️", label: l.settings },
        ].map(item => (
          <button key={item.key} onClick={() => { navTo(item.key); setMobMenu(false); }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "4px 8px", background: "transparent", border: "none", color: page === item.key ? G.primary : G.muted, transition: "all 0.18s", cursor: "pointer", minWidth: 50, minHeight: 50, justifyContent: "center", position: "relative" }}>
            {page === item.key && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 18, height: 2, borderRadius: 2, background: G.primary }} />}
            <span style={{ fontSize: page === item.key ? 22 : 20, transition: "all 0.18s" }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: page === item.key ? 600 : 400, fontFamily: "inherit" }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); play("error"); setUser(null); };
  return user ? <Layout user={user} onLogout={logout} /> : <Login onLogin={setUser} />;
}
