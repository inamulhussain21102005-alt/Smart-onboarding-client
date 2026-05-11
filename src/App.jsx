import { useState, useEffect, useRef, useCallback } from "react";
import axios from 'axios';

// ─── API ──────────────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });
API.interceptors.request.use(req => {
  const t = localStorage.getItem('token');
  if (t) req.headers.Authorization = `Bearer ${t}`;
  return req;
});
const api = {
  login: d => API.post('/auth/login', d),
  getEmployees: () => API.get('/employees'),
  addEmployee: d => API.post('/employees', d),
  updateEmployee: (id, d) => API.put(`/employees/${id}`, d),
  deleteEmployee: id => API.delete(`/employees/${id}`),
  getTasks: () => API.get('/tasks'),
  addTask: d => API.post('/tasks', d),
  updateTask: (id, d) => API.put(`/tasks/${id}`, d),
  getWorkflows: () => API.get('/workflows'),
  assignWorkflow: (id, empId) => API.post(`/workflows/${id}/assign/${empId}`),
};

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    dashboard:"Dashboard", employees:"Employees", tasks:"Tasks",
    workflows:"Workflows", analytics:"Analytics", leaderboard:"Leaderboard",
    reports:"Reports", settings:"Settings", aiAssistant:"AI Assistant",
    addEmployee:"Add Employee", addTask:"Add Task", logout:"Sign Out",
    search:"Search...", notifications:"Notifications", noData:"No data yet",
    pending:"Pending", inProgress:"In Progress", completed:"Completed",
    overdue:"Overdue", active:"Active", onboarding:"Onboarding",
    progress:"Progress", department:"Department", position:"Position",
    name:"Name", email:"Email", password:"Password", phone:"Phone",
    save:"Save", cancel:"Cancel", delete:"Delete", edit:"Edit",
    assignTo:"Assign To", priority:"Priority", category:"Category",
    dueDate:"Due Date", description:"Description", welcome:"Welcome back",
    goodMorning:"Good morning", goodAfternoon:"Good afternoon", goodEvening:"Good evening",
    totalEmployees:"Total Employees", totalTasks:"Total Tasks",
    completionRate:"Completion Rate", activeAgents:"Active Agents",
    kanban:"Kanban Board", calendar:"Calendar", profile:"Profile",
    badges:"Achievements", generate:"Generate Report", download:"Download",
    theme:"Theme", fontSize:"Font Size", language:"Language",
    sound:"Sound Effects", animations:"Animations", reset:"Reset Settings",
    askAI:"Ask AI anything...", sending:"Sending...", send:"Send",
    high:"High", medium:"Medium", low:"Low",
    documentation:"Documentation", training:"Training", setup:"Setup",
    meeting:"Meeting", other:"Other",
  },
  ta: {
    dashboard:"டாஷ்போர்டு", employees:"ஊழியர்கள்", tasks:"பணிகள்",
    workflows:"பணிப்பாய்வு", analytics:"பகுப்பாய்வு", leaderboard:"தரவரிசை",
    reports:"அறிக்கைகள்", settings:"அமைப்புகள்", aiAssistant:"AI உதவியாளர்",
    addEmployee:"ஊழியர் சேர்", addTask:"பணி சேர்", logout:"வெளியேறு",
    search:"தேடு...", notifications:"அறிவிப்புகள்", noData:"தரவு இல்லை",
    pending:"நிலுவை", inProgress:"செயலில்", completed:"முடிந்தது",
    overdue:"தாமதம்", active:"செயலில்", onboarding:"பயிற்சி",
    progress:"முன்னேற்றம்", department:"துறை", position:"பதவி",
    name:"பெயர்", email:"மின்னஞ்சல்", password:"கடவுச்சொல்", phone:"தொலைபேசி",
    save:"சேமி", cancel:"ரத்து", delete:"நீக்கு", edit:"திருத்து",
    assignTo:"ஒதுக்கு", priority:"முன்னுரிமை", category:"வகை",
    dueDate:"கடைசி தேதி", description:"விளக்கம்", welcome:"மீண்டும் வரவேற்கிறோம்",
    goodMorning:"காலை வணக்கம்", goodAfternoon:"மதிய வணக்கம்", goodEvening:"மாலை வணக்கம்",
    totalEmployees:"மொத்த ஊழியர்கள்", totalTasks:"மொத்த பணிகள்",
    completionRate:"முடிவு விகிதம்", activeAgents:"செயலில் உள்ளோர்",
    kanban:"கான்பன் பலகை", calendar:"நாட்காட்டி", profile:"சுயவிவரம்",
    badges:"சாதனைகள்", generate:"அறிக்கை உருவாக்கு", download:"பதிவிறக்கு",
    theme:"தீம்", fontSize:"எழுத்து அளவு", language:"மொழி",
    sound:"ஒலி விளைவுகள்", animations:"அனிமேஷன்கள்", reset:"அமைப்புகள் மீட்டமை",
    askAI:"AI கேளுங்கள்...", sending:"அனுப்புகிறது...", send:"அனுப்பு",
    high:"உயர்", medium:"நடுத்தர", low:"குறைந்த",
    documentation:"ஆவணங்கள்", training:"பயிற்சி", setup:"அமைவு",
    meeting:"கூட்டம்", other:"மற்றவை",
  }
};

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = {
  dark: { name:"Professional Dark", icon:"🌑", bg:"#080b14", surface:"#0e1420", card:"#111827", border:"#1f2937", primary:"#6366f1", secondary:"#8b5cf6", accent:"#10b981", orange:"#f59e0b", red:"#ef4444", text:"#f1f5f9", muted:"#6b7280", subtle:"#1f2937" },
  light: { name:"Clean Light", icon:"☀️", bg:"#f8fafc", surface:"#ffffff", card:"#ffffff", border:"#e2e8f0", primary:"#6366f1", secondary:"#8b5cf6", accent:"#10b981", orange:"#f59e0b", red:"#ef4444", text:"#0f172a", muted:"#64748b", subtle:"#f1f5f9" },
  cyber: { name:"Cyber Neon", icon:"⚡", bg:"#000000", surface:"#080d14", card:"#0d1117", border:"#1a2332", primary:"#00f5ff", secondary:"#bf00ff", accent:"#00ff88", orange:"#ffaa00", red:"#ff0040", text:"#e0f0ff", muted:"#3a4a5a", subtle:"#0d1117" },
  midnight: { name:"Midnight Blue", icon:"🌊", bg:"#020617", surface:"#0a1628", card:"#0f2040", border:"#1e3a5f", primary:"#3b82f6", secondary:"#60a5fa", accent:"#34d399", orange:"#fb923c", red:"#f87171", text:"#e0f2fe", muted:"#334155", subtle:"#0a1628" },
};

// ─── FONT SIZES ───────────────────────────────────────────────────────────────
const FS = { small:{ base:12, lg:14, xl:20, xxl:26 }, medium:{ base:14, lg:16, xl:24, xxl:30 }, large:{ base:16, lg:18, xl:28, xxl:36 } };

// ─── SOUND ────────────────────────────────────────────────────────────────────
const snd = (type, on=true) => {
  if (!on) return;
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const plays = {
      success: () => [523,659,784].forEach((f,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.value=f; g.gain.setValueAtTime(0.15,ctx.currentTime+i*0.1); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.1+0.3); o.start(ctx.currentTime+i*0.1); o.stop(ctx.currentTime+i*0.1+0.3); }),
      click: () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.value=600; g.gain.setValueAtTime(0.05,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.05); o.start();o.stop(ctx.currentTime+0.05); },
      complete: () => [523,659,784,1047].forEach((f,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.connect(g);g.connect(ctx.destination); o.frequency.value=f; g.gain.setValueAtTime(0.2,ctx.currentTime+i*0.12); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.12+0.3); o.start(ctx.currentTime+i*0.12); o.stop(ctx.currentTime+i*0.12+0.3); }),
      error: () => { const o=ctx.createOscillator(),g=ctx.createGain(); o.type='square';o.connect(g);g.connect(ctx.destination); o.frequency.setValueAtTime(200,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(80,ctx.currentTime+0.3); g.gain.setValueAtTime(0.12,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3); o.start();o.stop(ctx.currentTime+0.3); },
    };
    plays[type]?.();
  } catch(e){}
};

// ─── DEFAULT SETTINGS ─────────────────────────────────────────────────────────
const DEF = { theme:'dark', fontSize:'medium', lang:'en', sound:true, animations:true, compact:false, showGreeting:true, showActivity:true };

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const makeCSS = (G, s) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}
  body{background:${G.bg};color:${G.text};font-family:'DM Sans',sans-serif;font-size:${FS[s.fontSize].base}px;overflow-x:hidden;-webkit-font-smoothing:antialiased;transition:background 0.4s ease,color 0.4s ease;}
  ::-webkit-scrollbar{width:3px;height:3px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:${G.primary}44;border-radius:10px;}
  input,select,textarea{font-family:'DM Sans',sans-serif;} button{cursor:pointer;}

  /* ── KEYFRAMES ── */
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideL{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideR{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes shimmer{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
  @keyframes gradShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  @keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes countUp{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}
  @keyframes progFill{from{width:0}to{width:var(--w)}}
  @keyframes skelShim{0%{background-position:-200px 0}100%{background-position:calc(200px + 100%) 0}}
  @keyframes pop{0%{transform:scale(1)}30%{transform:scale(1.25)}60%{transform:scale(0.97)}100%{transform:scale(1)}}
  @keyframes confetti{0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(var(--tx),var(--ty)) rotate(var(--tr));opacity:0}}
  @keyframes ripple{to{transform:scale(4);opacity:0}}
  @keyframes borderPulse{0%,100%{border-color:${G.primary}33}50%{border-color:${G.primary}88}}
  @keyframes overlayIn{from{opacity:0}to{opacity:1}}
  @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes badge-earn{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.2) rotate(5deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
  @keyframes typing{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes aiMsg{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}

  /* ── CARDS ── */
  .card{background:${G.card};border:1px solid ${G.border};border-radius:${s.compact?'10px':'14px'};transition:all 0.3s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden;}
  .card::before{content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 60%);pointer-events:none;}
  .card:hover{border-color:${G.primary}33;transform:translateY(${s.animations?'-3px':'0'});box-shadow:0 12px 40px rgba(0,0,0,0.3);}
  .card-flat{background:${G.card};border:1px solid ${G.border};border-radius:${s.compact?'10px':'14px'};}

  /* ── BUTTONS ── */
  .btn{position:relative;overflow:hidden;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);font-family:'DM Sans',sans-serif;font-weight:600;cursor:pointer;border:none;display:inline-flex;align-items:center;gap:6px;justify-content:center;}
  .btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.08),transparent);opacity:0;transition:opacity 0.2s;}
  .btn:hover::after{opacity:1;}
  .btn:hover{transform:${s.animations?'translateY(-1px)':'none'};}
  .btn:active{transform:scale(0.97);}
  .ripple-fx{position:absolute;border-radius:50%;background:rgba(255,255,255,0.2);transform:scale(0);animation:ripple 0.5s linear;pointer-events:none;}

  /* ── INPUTS ── */
  .inp{width:100%;background:${G.subtle};border:1px solid ${G.border};border-radius:10px;padding:${s.compact?'8px 12px':'10px 14px'};color:${G.text};font-size:${FS[s.fontSize].base}px;font-family:'DM Sans',sans-serif;outline:none;transition:all 0.3s;box-sizing:border-box;}
  .inp:focus{border-color:${G.primary}66;background:${G.surface};box-shadow:0 0 0 3px ${G.primary}15;}
  .inp::placeholder{color:${G.muted};}
  select.inp{appearance:auto;}

  /* ── NAV ── */
  .nav-btn{display:flex;align-items:center;gap:10px;padding:${s.compact?'8px 10px':'9px 12px'};border-radius:10px;border:none;background:transparent;color:${G.muted};cursor:pointer;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;transition:all 0.2s ease;width:100%;text-align:left;position:relative;overflow:hidden;}
  .nav-btn:hover{color:${G.text};background:${G.primary}0f;}
  .nav-btn.active{color:${G.primary};background:${G.primary}15;font-weight:600;}
  .nav-btn.active::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:3px;background:${G.primary};border-radius:0 3px 3px 0;}

  /* ── SKELETON ── */
  .skel{background:linear-gradient(90deg,${G.subtle} 25%,${G.border} 50%,${G.subtle} 75%);background-size:200px 100%;animation:skelShim 1.5s infinite;border-radius:8px;}

  /* ── BADGE ── */
  .badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:0.3px;white-space:nowrap;font-family:'JetBrains Mono',monospace;}

  /* ── PROGRESS ── */
  .prog-track{height:5px;border-radius:10px;background:${G.border};overflow:hidden;}
  .prog-fill{height:100%;border-radius:10px;animation:progFill 1s cubic-bezier(0.4,0,0.2,1) forwards;}

  /* ── TOGGLE ── */
  .tgl{position:relative;width:42px;height:22px;flex-shrink:0;}
  .tgl input{opacity:0;width:0;height:0;}
  .tgl-sl{position:absolute;cursor:pointer;inset:0;background:${G.border};border-radius:22px;transition:0.3s;}
  .tgl-sl::before{position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background:${G.muted};border-radius:50%;transition:0.3s;}
  .tgl input:checked + .tgl-sl{background:${G.primary};}
  .tgl input:checked + .tgl-sl::before{transform:translateX(20px);background:#fff;}

  /* ── KANBAN ── */
  .kanban-col{background:${G.subtle};border:1px solid ${G.border};border-radius:14px;padding:14px;min-height:300px;flex:1;min-width:220px;}
  .kanban-card{background:${G.card};border:1px solid ${G.border};border-radius:10px;padding:13px;margin-bottom:9px;cursor:grab;transition:all 0.2s;position:relative;}
  .kanban-card:hover{border-color:${G.primary}44;transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,0.3);}
  .kanban-card.dragging{opacity:0.5;transform:scale(0.98);}
  .drop-zone{border:2px dashed ${G.primary}44;border-radius:10px;padding:16px;text-align:center;color:${G.muted};font-size:12px;transition:all 0.2s;}
  .drop-zone.over{border-color:${G.primary};background:${G.primary}08;color:${G.primary};}

  /* ── CALENDAR ── */
  .cal-day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:4px;border-radius:8px;cursor:pointer;transition:all 0.2s;border:1px solid transparent;font-size:12px;}
  .cal-day:hover{background:${G.primary}15;border-color:${G.primary}33;}
  .cal-day.today{background:${G.primary}22;border-color:${G.primary}66;font-weight:700;color:${G.primary};}
  .cal-day.has-tasks{position:relative;}

  /* ── AI CHAT ── */
  .ai-msg-user{align-self:flex-end;background:${G.primary};color:#fff;border-radius:14px 14px 4px 14px;padding:9px 14px;max-width:80%;font-size:13px;animation:aiMsg 0.3s ease;}
  .ai-msg-ai{align-self:flex-start;background:${G.subtle};border:1px solid ${G.border};color:${G.text};border-radius:14px 14px 14px 4px;padding:9px 14px;max-width:80%;font-size:13px;animation:aiMsg 0.3s ease;}
  .ai-typing{display:flex;gap:4px;align-items:center;padding:9px 14px;}
  .ai-dot{width:6px;height:6px;border-radius:50%;background:${G.primary};animation:typing 1.2s ease infinite;}

  /* ── MOBILE ── */
  .mob-header{display:none;position:fixed;top:0;left:0;right:0;z-index:200;background:${G.surface}f5;backdrop-filter:blur(20px);border-bottom:1px solid ${G.border};padding:10px 14px;align-items:center;justify-content:space-between;min-height:56px;}
  .mob-nav{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:${G.surface}f5;backdrop-filter:blur(20px);border-top:1px solid ${G.border};padding:5px 0 max(5px,env(safe-area-inset-bottom));}

  @media(max-width:768px){
    .sidebar{display:none!important;}
    .mob-header{display:flex!important;}
    .mob-nav{display:flex!important;}
    .main{margin-left:0!important;max-width:100vw!important;padding:68px 12px 80px!important;}
    .stat-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important;}
    .two-col{grid-template-columns:1fr!important;}
    .emp-grid{grid-template-columns:1fr!important;}
    .form-grid{grid-template-columns:1fr!important;}
    .hide-mob{display:none!important;}
    .inp{font-size:16px!important;}
    .kanban-wrap{flex-direction:column!important;}
  }
  @media(min-width:769px){
    .mob-header{display:none!important;}
    .mob-nav{display:none!important;}
  }

  /* ── GRADIENT TEXT ── */
  .gtxt{background:linear-gradient(135deg,${G.primary},${G.secondary});background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradShift 4s ease infinite;}

  /* ── STAT CARD ── */
  .stat-card{animation:scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;transition:all 0.3s;}
  .stat-card:hover{transform:translateY(${s.animations?'-4px':'0'}) scale(1.01);}

  .thin-scroll::-webkit-scrollbar{width:2px;} .thin-scroll::-webkit-scrollbar-thumb{background:${G.primary}22;}

  /* ── PROFILE MODAL ── */
  .profile-modal{animation:modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1);}

  /* ── ACHIEVEMENT BADGE ── */
  .ach-badge{transition:all 0.3s;} .ach-badge:hover{transform:scale(1.1);}
  .ach-badge.earned{animation:badge-earn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards;}
`;

// ─── RIPPLE ───────────────────────────────────────────────────────────────────
function useRipple() {
  return useCallback(e => {
    const b = e.currentTarget, r = b.getBoundingClientRect();
    const el = document.createElement('span'), sz = Math.max(r.width, r.height);
    el.className = 'ripple-fx';
    el.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX-r.left-sz/2}px;top:${e.clientY-r.top-sz/2}px`;
    b.appendChild(el); setTimeout(() => el.remove(), 500);
  }, []);
}

// ─── ANIMATED NUMBER ──────────────────────────────────────────────────────────
function AnimNum({ val, anim=true }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!anim) { setD(parseInt(val)||0); return; }
    let s = 0; const e = parseInt(val)||0, step = Math.ceil(e/20);
    const t = setInterval(() => { s = Math.min(s+step,e); setD(s); if(s>=e) clearInterval(t); }, 40);
    return () => clearInterval(t);
  }, [val]);
  return <span style={{animation:anim?"countUp 0.5s ease":"none"}}>{d}</span>;
}

// ─── ACHIEVEMENT BADGES SYSTEM ────────────────────────────────────────────────
const BADGES = [
  { id:'first', icon:'🎯', name:'First Step', desc:'Complete first task', check:(emp,tasks) => tasks.filter(t=>t.assignedTo?._id===emp._id&&t.status==='completed').length >= 1 },
  { id:'five', icon:'⚡', name:'Momentum', desc:'Complete 5 tasks', check:(emp,tasks) => tasks.filter(t=>t.assignedTo?._id===emp._id&&t.status==='completed').length >= 5 },
  { id:'champion', icon:'🏆', name:'Champion', desc:'Reach 100% progress', check:(emp) => (emp.onboardingProgress||0) >= 100 },
  { id:'legend', icon:'💎', name:'Legend', desc:'Complete 10 tasks', check:(emp,tasks) => tasks.filter(t=>t.assignedTo?._id===emp._id&&t.status==='completed').length >= 10 },
  { id:'fire', icon:'🔥', name:'On Fire', desc:'Complete 3+ tasks', check:(emp,tasks) => tasks.filter(t=>t.assignedTo?._id===emp._id&&t.status==='completed').length >= 3 },
  { id:'star', icon:'⭐', name:'All Rounder', desc:'Tasks in 3+ categories', check:(emp,tasks) => new Set(tasks.filter(t=>t.assignedTo?._id===emp._id&&t.status==='completed').map(t=>t.category)).size >= 3 },
];

function getEarnedBadges(emp, tasks) {
  return BADGES.filter(b => b.check(emp, tasks));
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Avt({ name, size=40, G }) {
  const cols = [G.primary,G.secondary,G.accent,G.orange,G.red];
  const c = cols[(name||'?').charCodeAt(0)%cols.length];
  return <div style={{width:size,height:size,borderRadius:size*0.28,background:`${c}22`,border:`1.5px solid ${c}55`,display:'flex',alignItems:'center',justifyContent:'center',color:c,fontWeight:700,fontSize:size*0.4,fontFamily:"'Syne',sans-serif",flexShrink:0,transition:'all 0.3s'}}>{(name||'?')[0]}</div>;
}

function Bdg({ label, color }) {
  return <span className="badge" style={{background:`${color}18`,color,border:`1px solid ${color}33`}}>{label}</span>;
}

function PBar({ val, G, h=5, color }) {
  const c = color||(val===100?G.accent:val>60?G.primary:val>30?G.orange:G.red);
  return <div className="prog-track" style={{height:h}}><div className="prog-fill" style={{"--w":`${val||0}%`,background:`linear-gradient(90deg,${c}88,${c})`,boxShadow:`0 0 4px ${c}55`}}/></div>;
}

function Tgl({ checked, onChange, G }) {
  return <label className="tgl"><input type="checkbox" checked={checked} onChange={onChange}/><span className="tgl-sl"/></label>;
}

function Skel({ h=60, r=12 }) {
  return <div className="skel" style={{height:h,borderRadius:r}}/>;
}

function Empty({ icon, title, sub }) {
  return <div style={{textAlign:'center',padding:'36px 16px',animation:'fadeUp 0.5s ease'}}><div style={{fontSize:40,marginBottom:10,animation:'float 3s ease-in-out infinite'}}>{icon}</div><div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{title}</div><div style={{fontSize:12,opacity:0.5}}>{sub}</div></div>;
}

function Btn({ children, onClick, G, variant='primary', size='md', style={}, disabled=false }) {
  const rpl = useRipple();
  const vs = {
    primary: { bg:`${G.primary}20`, color:G.primary, border:`1px solid ${G.primary}44`, shadow:`0 0 16px ${G.primary}22` },
    solid: { bg:`linear-gradient(135deg,${G.primary},${G.secondary})`, color:'#fff', border:'none', shadow:`0 4px 16px ${G.primary}44` },
    danger: { bg:`${G.red}18`, color:G.red, border:`1px solid ${G.red}33`, shadow:'none' },
    ghost: { bg:'transparent', color:G.muted, border:`1px solid ${G.border}`, shadow:'none' },
    success: { bg:`${G.accent}18`, color:G.accent, border:`1px solid ${G.accent}33`, shadow:'none' },
  };
  const pads = { sm:'5px 12px', md:'8px 18px', lg:'11px 0', icon:'8px' };
  const v = vs[variant]||vs.primary;
  return (
    <button className="btn" disabled={disabled} onClick={e=>{rpl(e);if(!disabled){onClick?.(e);snd('click',true);}}}
      style={{background:v.bg,color:disabled?G.muted:v.color,border:disabled?`1px solid ${G.border}`:v.border,borderRadius:10,padding:pads[size],fontSize:size==='sm'?11:13,boxShadow:v.shadow,opacity:disabled?0.5:1,width:size==='lg'?'100%':'auto',fontWeight:600,...style}}>
      {children}
    </button>
  );
}

function PageHdr({ title, sub, G, action, s }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:s?.compact?16:22,flexWrap:'wrap',gap:10}}>
      <div>
        <h1 className="gtxt" style={{fontFamily:"'Syne',sans-serif",fontSize:FS[s?.fontSize||'medium'].xl,fontWeight:800,letterSpacing:-0.5,marginBottom:3}}>{title}</h1>
        {sub && <p style={{color:G.muted,fontSize:12}}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon, label, val, color, G, delay=0, s }) {
  return (
    <div className="card stat-card" style={{padding:s?.compact?'14px 16px':'18px 20px',flex:1,minWidth:100,animationDelay:`${delay}s`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <span style={{fontSize:20}}>{icon}</span>
        <div style={{width:5,height:5,borderRadius:'50%',background:color,boxShadow:`0 0 6px ${color}`}}/>
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:FS[s?.fontSize||'medium'].xxl,fontWeight:700,color,marginBottom:3,lineHeight:1}}>
        <AnimNum val={val} anim={s?.animations!==false}/>
      </div>
      <div style={{color:G.muted,fontSize:11,fontWeight:500}}>{label}</div>
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toasts({ toasts, G }) {
  const cols = { success:G.accent, error:G.red, info:G.primary, warning:G.orange };
  const ics = { success:'✓', error:'✕', info:'i', warning:'!' };
  return (
    <div style={{position:'fixed',bottom:80,right:16,zIndex:9999,display:'flex',flexDirection:'column',gap:8}}>
      {toasts.map(t => {
        const c = cols[t.type]||G.primary;
        return <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:G.surface,border:`1px solid ${c}44`,borderRadius:12,boxShadow:`0 8px 24px rgba(0,0,0,0.4),0 0 12px ${c}18`,animation:'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',minWidth:220,maxWidth:290}}>
          <div style={{width:22,height:22,borderRadius:'50%',background:`${c}22`,display:'flex',alignItems:'center',justifyContent:'center',color:c,fontSize:10,fontWeight:700,flexShrink:0}}>{ics[t.type]}</div>
          <span style={{color:G.text,fontSize:13,flex:1,fontWeight:500}}>{t.message}</span>
        </div>;
      })}
    </div>
  );
}

// ─── TASK COMPLETE POPUP ──────────────────────────────────────────────────────
function TaskDone({ show, onClose, name, G, anim }) {
  const conf = [...Array(24)].map((_,i)=>({ id:i, color:[G.primary,G.secondary,G.accent,G.orange,'#ec4899'][i%5], tx:`${(Math.random()-0.5)*360}px`, ty:`${Math.random()*-260-60}px`, tr:`${(Math.random()-0.5)*720}deg`, sz:3+Math.random()*7, dl:Math.random()*0.4 }));
  if (!show) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(8px)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',animation:'overlayIn 0.3s ease',padding:20}}>
      <div style={{position:'relative',textAlign:'center',animation:anim?'modalIn 0.5s cubic-bezier(0.34,1.56,0.64,1)':'none'}}>
        {anim && conf.map(c=><div key={c.id} style={{position:'absolute',top:'50%',left:'50%',width:c.sz,height:c.sz,background:c.color,borderRadius:Math.random()>0.5?'50%':'2px',"--tx":c.tx,"--ty":c.ty,"--tr":c.tr,animation:`confetti 1.5s ease ${c.dl}s forwards`}}/>)}
        <div style={{position:'relative',zIndex:1}}>
          <div style={{fontSize:64,marginBottom:12,animation:anim?'pop 0.6s ease,float 3s ease-in-out 0.6s infinite':'none'}}>🎉</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:G.accent,marginBottom:6}}>Task Completed!</div>
          {name&&<div style={{color:G.muted,fontSize:13,marginBottom:6}}>{name}</div>}
          <div style={{color:G.orange,fontSize:16,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,marginBottom:16}}>+100 XP</div>
          <div style={{color:G.muted,fontSize:11}}>Tap anywhere to continue</div>
        </div>
      </div>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function Confirm({ show, msg, onYes, onNo, G }) {
  if (!show) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)',zIndex:9997,display:'flex',alignItems:'center',justifyContent:'center',padding:20,animation:'overlayIn 0.3s ease'}}>
      <div className="card" style={{padding:24,maxWidth:320,width:'100%',animation:'modalIn 0.4s ease',border:`1px solid ${G.red}33`}}>
        <div style={{textAlign:'center',marginBottom:18}}>
          <div style={{fontSize:36,marginBottom:8}}>⚠️</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:6}}>Are you sure?</div>
          <div style={{color:G.muted,fontSize:13,lineHeight:1.6}}>{msg}</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <Btn G={G} variant="ghost" onClick={onNo} style={{flex:1}}>Cancel</Btn>
          <Btn G={G} variant="danger" onClick={onYes} style={{flex:1}}>Delete</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
function ProfileModal({ emp, tasks, G, onClose, t }) {
  if (!emp) return null;
  const empTasks = tasks.filter(t=>t.assignedTo?._id===emp._id);
  const done = empTasks.filter(t=>t.status==='completed');
  const xp = done.length*100+(emp.onboardingProgress||0);
  const rank = xp>800?'Legend':xp>500?'Expert':xp>200?'Professional':'Beginner';
  const rankColor = xp>800?G.orange:xp>500?G.secondary:xp>200?G.primary:G.accent;
  const badges = getEarnedBadges(emp, tasks);
  const tC = { pending:G.muted, in_progress:G.primary, completed:G.accent, overdue:G.red };

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)',zIndex:9996,display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'overlayIn 0.3s ease'}}>
      <div className="card profile-modal" onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,maxHeight:'88vh',overflow:'auto',padding:24}} className="card thin-scroll">
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <Avt name={emp.name||'?'} size={56} G={G}/>
            <div>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:3}}>{emp.name}</h2>
              <p style={{color:G.muted,fontSize:12,marginBottom:6}}>{emp.position} · {emp.department}</p>
              <Bdg label={rank} color={rankColor}/>
            </div>
          </div>
          <button onClick={onClose} style={{background:`${G.red}15`,border:`1px solid ${G.red}22`,color:G.red,borderRadius:8,width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>

        {/* XP & Progress */}
        <div style={{background:G.subtle,borderRadius:12,padding:14,marginBottom:16,display:'flex',gap:16,flexWrap:'wrap'}}>
          {[{label:'XP',val:xp,color:rankColor},{label:'Tasks Done',val:done.length,color:G.accent},{label:'Total Tasks',val:empTasks.length,color:G.primary},{label:'Progress',val:`${emp.onboardingProgress||0}%`,color:G.orange}].map((s,i)=>(
            <div key={i} style={{flex:1,minWidth:70,textAlign:'center'}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.color}}>{s.val}</div>
              <div style={{color:G.muted,fontSize:10,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div style={{marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
            <span style={{color:G.muted,fontSize:12}}>Onboarding Progress</span>
            <span style={{color:G.primary,fontSize:12,fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{emp.onboardingProgress||0}%</span>
          </div>
          <PBar val={emp.onboardingProgress||0} G={G} h={8}/>
        </div>

        {/* Badges */}
        <div style={{marginBottom:16}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,marginBottom:10}}>🏅 Achievements</h3>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {BADGES.map(b=>{
              const earned = b.check(emp,tasks);
              return (
                <div key={b.id} className="ach-badge" style={{background:earned?`${G.primary}18`:G.subtle,border:`1px solid ${earned?G.primary+'44':G.border}`,borderRadius:10,padding:'8px 12px',textAlign:'center',opacity:earned?1:0.4,minWidth:72}}>
                  <div style={{fontSize:22,marginBottom:3}}>{b.icon}</div>
                  <div style={{fontSize:9,fontWeight:600,color:earned?G.primary:G.muted}}>{b.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact */}
        <div style={{background:G.subtle,borderRadius:10,padding:12,marginBottom:16}}>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,marginBottom:8}}>Contact Info</h3>
          <div style={{fontSize:12,color:G.muted,display:'flex',flexDirection:'column',gap:4}}>
            <span>📧 {emp.email}</span>
            {emp.phone&&<span>📱 {emp.phone}</span>}
            <span>📅 Joined: {emp.joinDate?.split('T')[0]||'N/A'}</span>
          </div>
        </div>

        {/* Tasks */}
        <div>
          <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,marginBottom:10}}>📋 Tasks ({empTasks.length})</h3>
          {empTasks.length===0?<Empty icon="📋" title="No tasks" sub="No tasks assigned yet"/>:
            empTasks.map((tk,i)=>(
              <div key={tk._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${G.border}`}}>
                <span style={{fontSize:15}}>{catIcon[tk.category]||'📌'}</span>
                <span style={{flex:1,fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tk.title}</span>
                <Bdg label={tk.status.replace('_',' ')} color={tC[tk.status]}/>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFS PANEL ─────────────────────────────────────────────────────────────
function NotifsPanel({ show, onClose, notifs, clear, G, t }) {
  if (!show) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:201}} onClick={onClose}>
      <div style={{position:'absolute',top:0,right:0,bottom:0,width:Math.min(290,window.innerWidth-20),background:G.surface,borderLeft:`1px solid ${G.border}`,display:'flex',flexDirection:'column',animation:'slideR 0.3s ease',boxShadow:'-4px 0 20px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${G.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:3,height:16,background:G.primary,borderRadius:2}}/>
            <h2 style={{fontFamily:"'Syne',sans-serif",color:G.primary,fontSize:12,fontWeight:700,letterSpacing:1}}>{t.notifications.toUpperCase()}</h2>
          </div>
          <div style={{display:'flex',gap:6}}>
            {notifs.length>0&&<Btn G={G} size="sm" variant="danger" onClick={clear}>Clear</Btn>}
            <button onClick={onClose} style={{background:`${G.red}15`,border:`1px solid ${G.red}22`,color:G.red,borderRadius:6,width:24,height:24,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          </div>
        </div>
        <div style={{flex:1,overflow:'auto',padding:10}} className="thin-scroll">
          {notifs.length===0?<Empty icon="🔔" title="No alerts" sub="All clear!"/>:
            notifs.map((n,i)=>(
              <div key={n.id} style={{background:G.card,border:`1px solid ${n.type==='success'?G.accent:n.type==='error'?G.red:G.primary}22`,borderRadius:9,padding:'9px 11px',marginBottom:6,animation:`fadeUp 0.3s ease ${i*0.04}s both`}}>
                <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3}}>
                  <span style={{fontSize:12}}>{n.type==='success'?'✅':n.type==='error'?'❌':'⚡'}</span>
                  <span style={{color:G.muted,fontSize:9,fontFamily:"'JetBrains Mono'",marginLeft:'auto'}}>{n.time}</span>
                </div>
                <div style={{color:G.text,fontSize:12}}>{n.message}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── AI ASSISTANT ─────────────────────────────────────────────────────────────
function AIAssistant({ G, t, employees, tasks }) {
  const [msgs, setMsgs] = useState([{ role:'ai', text:`Hello! I'm your OnboardIQ AI Assistant. I can help you analyze employee data, track progress, and answer questions about your onboarding system. What would you like to know?` }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput(''); setLoading(true);
    setMsgs(prev => [...prev, { role:'user', text:q }]);

    // Build context
    const ctx = `You are an AI assistant for OnboardIQ, a smart employee onboarding system.
Current data:
- Total employees: ${employees.length}
- Active: ${employees.filter(e=>e.status==='active').length}
- Onboarding: ${employees.filter(e=>e.status==='onboarding').length}
- Total tasks: ${tasks.length}
- Completed: ${tasks.filter(t=>t.status==='completed').length}
- Pending: ${tasks.filter(t=>t.status==='pending').length}
- In Progress: ${tasks.filter(t=>t.status==='in_progress').length}
- Overdue: ${tasks.filter(t=>t.status==='overdue').length}
- Avg progress: ${employees.length?Math.round(employees.reduce((a,e)=>a+(e.onboardingProgress||0),0)/employees.length):0}%
Employees: ${employees.map(e=>`${e.name} (${e.department}, ${e.onboardingProgress||0}% progress)`).join(', ')||'None'}
Answer the user's question concisely and helpfully in 2-3 sentences max. Be professional and insightful.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:300, system:ctx, messages:[{role:'user',content:q}] })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I couldn't process that. Please try again.";
      setMsgs(prev => [...prev, { role:'ai', text:reply }]);
    } catch {
      setMsgs(prev => [...prev, { role:'ai', text:"I'm having trouble connecting. Please check your connection and try again." }]);
    }
    setLoading(false);
  };

  const quickQ = ["Who has lowest progress?", "How many tasks are overdue?", "Give me a summary report", "Which employee needs attention?"];

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <PageHdr title={t.aiAssistant} sub="Powered by Claude AI" G={G} s={{fontSize:'medium'}}/>
      <div className="card" style={{height:'calc(100vh - 220px)',minHeight:400,display:'flex',flexDirection:'column'}}>
        {/* Messages */}
        <div style={{flex:1,overflow:'auto',padding:16,display:'flex',flexDirection:'column',gap:10}} className="thin-scroll">
          {msgs.map((m,i)=>(
            <div key={i} className={m.role==='user'?'ai-msg-user':'ai-msg-ai'} style={{maxWidth:'82%',alignSelf:m.role==='user'?'flex-end':'flex-start'}}>
              {m.role==='ai'&&<div style={{fontSize:11,color:G.primary,fontWeight:700,marginBottom:4,fontFamily:"'JetBrains Mono'"}}>⚡ OnboardIQ AI</div>}
              <div style={{lineHeight:1.6}}>{m.text}</div>
            </div>
          ))}
          {loading&&(
            <div className="ai-msg-ai" style={{alignSelf:'flex-start'}}>
              <div className="ai-typing">
                {[0,0.2,0.4].map((d,i)=><div key={i} className="ai-dot" style={{animationDelay:`${d}s`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Quick Questions */}
        <div style={{padding:'8px 12px',borderTop:`1px solid ${G.border}`,display:'flex',gap:6,flexWrap:'wrap'}}>
          {quickQ.map((q,i)=>(
            <button key={i} onClick={()=>{setInput(q);}} style={{background:G.subtle,border:`1px solid ${G.border}`,borderRadius:20,padding:'4px 10px',color:G.muted,fontSize:10,cursor:'pointer',fontFamily:"'DM Sans'",transition:'all 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=G.primary}
              onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{padding:'10px 12px',borderTop:`1px solid ${G.border}`,display:'flex',gap:8}}>
          <input className="inp" value={input} onChange={e=>setInput(e.target.value)} placeholder={t.askAI} onKeyDown={e=>e.key==='Enter'&&send()} style={{flex:1}}/>
          <Btn G={G} variant="solid" onClick={send} disabled={!input.trim()||loading}>{loading?t.sending:t.send}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── KANBAN BOARD ─────────────────────────────────────────────────────────────
const catIcon = { documentation:'📄', training:'📚', setup:'⚙️', meeting:'🤝', other:'📌' };

function KanbanBoard({ tasks, setTasks, addToast, G, t, s, soundOn }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const cols = ['pending','in_progress','completed'];
  const colNames = { pending:t.pending, in_progress:t.inProgress, completed:t.completed };
  const colColors = { pending:G.muted, in_progress:G.primary, completed:G.accent };
  const tC = { pending:G.muted, in_progress:G.primary, completed:G.accent, overdue:G.red };
  const pC = { high:G.red, medium:G.orange, low:G.accent };

  const onDrop = async (status) => {
    if (!dragging || dragging.status===status) return;
    try {
      const { data } = await api.updateTask(dragging._id, { status });
      setTasks(prev => prev.map(t => t._id===dragging._id ? data : t));
      addToast(`Task moved to ${colNames[status]}!`, 'success');
      snd('success', soundOn);
    } catch { addToast('Failed to update', 'error'); }
    setDragging(null); setOver(null);
  };

  return (
    <div>
      <PageHdr title={t.kanban} sub="Drag & drop tasks between columns" G={G} s={s}/>
      <div className="kanban-wrap" style={{display:'flex',gap:14,alignItems:'flex-start'}}>
        {cols.map(col=>{
          const colTasks = tasks.filter(tk=>tk.status===col);
          return (
            <div key={col} className="kanban-col" onDragOver={e=>{e.preventDefault();setOver(col);}} onDrop={()=>onDrop(col)} onDragLeave={()=>setOver(null)}
              style={{borderColor:over===col?`${colColors[col]}66`:undefined,background:over===col?`${colColors[col]}08`:undefined}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:3,height:16,background:colColors[col],borderRadius:2}}/>
                <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:colColors[col],letterSpacing:0.5}}>{colNames[col].toUpperCase()}</h3>
                <div style={{marginLeft:'auto',background:`${colColors[col]}18`,color:colColors[col],border:`1px solid ${colColors[col]}33`,borderRadius:20,padding:'1px 8px',fontSize:10,fontFamily:"'JetBrains Mono'"}}>{colTasks.length}</div>
              </div>
              {colTasks.length===0?(
                <div className={`drop-zone${over===col?' over':''}`}>
                  {over===col?'Drop here!':'No tasks'}
                </div>
              ):colTasks.map(tk=>(
                <div key={tk._id} className={`kanban-card${dragging?._id===tk._id?' dragging':''}`}
                  draggable onDragStart={()=>setDragging(tk)} onDragEnd={()=>{setDragging(null);setOver(null);}}>
                  <div style={{display:'flex',gap:6,marginBottom:7,alignItems:'flex-start'}}>
                    <span style={{fontSize:15,flexShrink:0}}>{catIcon[tk.category]||'📌'}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:3}}>{tk.title}</div>
                      {tk.description&&<div style={{color:G.muted,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tk.description}</div>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap',alignItems:'center'}}>
                    <Bdg label={tk.priority} color={pC[tk.priority]||G.muted}/>
                    {tk.assignedTo?.name&&<span style={{color:G.muted,fontSize:10,marginLeft:'auto'}}>👤 {tk.assignedTo.name.split(' ')[0]}</span>}
                  </div>
                  {tk.dueDate&&<div style={{color:G.muted,fontSize:10,marginTop:5}}>📅 {tk.dueDate?.split('T')[0]}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ tasks, G, t, s }) {
  const [curr, setCurr] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const today = new Date();
  const year = curr.getFullYear(), month = curr.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const pC = { high:G.red, medium:G.orange, low:G.accent };
  const tC = { pending:G.muted, in_progress:G.primary, completed:G.accent, overdue:G.red };

  const getTasksForDay = (day) => {
    const date = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return tasks.filter(tk => tk.dueDate?.split('T')[0] === date);
  };

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <PageHdr title={t.calendar} sub={`${months[month]} ${year}`} G={G} s={s}
        action={
          <div style={{display:'flex',gap:8}}>
            <Btn G={G} size="sm" onClick={()=>setCurr(new Date(year,month-1,1))}>← Prev</Btn>
            <Btn G={G} size="sm" onClick={()=>setCurr(new Date())}>Today</Btn>
            <Btn G={G} size="sm" onClick={()=>setCurr(new Date(year,month+1,1))}>Next →</Btn>
          </div>
        }/>

      <div className="card" style={{padding:20,marginBottom:14}}>
        {/* Day headers */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8}}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
            <div key={d} style={{textAlign:'center',fontSize:10,fontWeight:600,color:G.muted,padding:'4px 0',fontFamily:"'JetBrains Mono'"}}>{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
          {[...Array(firstDay)].map((_,i)=><div key={`e${i}`}/>)}
          {[...Array(daysInMonth)].map((_,i)=>{
            const day = i+1;
            const dayTasks = getTasksForDay(day);
            const isToday = today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
            return (
              <div key={day} className={`cal-day${isToday?' today':''}${dayTasks.length>0?' has-tasks':''}`}
                onClick={()=>setSelected(selected===day?null:day)}
                style={{background:selected===day?`${G.primary}22`:undefined,borderColor:selected===day?G.primary:undefined}}>
                <span style={{fontSize:11,fontWeight:isToday?700:400}}>{day}</span>
                {dayTasks.length>0&&(
                  <div style={{display:'flex',gap:1,flexWrap:'wrap',justifyContent:'center',marginTop:2}}>
                    {dayTasks.slice(0,3).map((tk,i)=>(
                      <div key={i} style={{width:4,height:4,borderRadius:'50%',background:pC[tk.priority]||G.primary}}/>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day tasks */}
      {selected&&(()=>{
        const dayTasks = getTasksForDay(selected);
        return dayTasks.length>0?(
          <div className="card" style={{padding:18,animation:'fadeUp 0.3s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <div style={{width:3,height:14,background:G.primary,borderRadius:2}}/>
              <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700}}>{months[month]} {selected} — {dayTasks.length} task{dayTasks.length>1?'s':''}</h3>
            </div>
            {dayTasks.map(tk=>(
              <div key={tk._id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${G.border}`}}>
                <span style={{fontSize:16}}>{catIcon[tk.category]||'📌'}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{tk.title}</div>
                  <div style={{color:G.muted,fontSize:11}}>{tk.assignedTo?.name||'Unassigned'}</div>
                </div>
                <Bdg label={tk.status.replace('_',' ')} color={tC[tk.status]}/>
                <Bdg label={tk.priority} color={pC[tk.priority]||G.muted}/>
              </div>
            ))}
          </div>
        ):null;
      })()}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const G = THEMES.dark;
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const emailRef = useRef(null);
  const pwRef = useRef(null);

  useEffect(() => {
    setTimeout(() => { setEmail(''); setPw(''); if(emailRef.current) emailRef.current.value=''; if(pwRef.current) pwRef.current.value=''; }, 100);
  }, []);

  const handle = async e => {
    e.preventDefault();
    if (!email||!pw) { setErr('Please fill all fields'); return; }
    setLoading(true); setErr('');
    try {
      const { data } = await api.login({ email, password:pw });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      snd('success');
      onLogin(data);
    } catch(error) {
      setErr(error.response?.data?.message||'Invalid credentials');
      snd('error');
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',minHeight:'100dvh',background:G.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:20,position:'relative',overflow:'hidden'}}>
      <style>{makeCSS(G, DEF)}</style>
      {/* Ambient */}
      <div style={{position:'absolute',top:'15%',left:'10%',width:400,height:400,borderRadius:'50%',background:`radial-gradient(circle,${G.primary}08,transparent 70%)`,filter:'blur(60px)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'15%',right:'10%',width:320,height:320,borderRadius:'50%',background:`radial-gradient(circle,${G.secondary}08,transparent 70%)`,filter:'blur(60px)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:400,position:'relative',animation:'fadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1)'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${G.primary}22,${G.secondary}22)`,border:`1px solid ${G.primary}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 14px',animation:'float 3s ease-in-out infinite'}}>⚡</div>
          <h1 className="gtxt" style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,letterSpacing:-0.5,marginBottom:5}}>OnboardIQ</h1>
          <p style={{color:G.muted,fontSize:12}}>Smart Employee Onboarding System</p>
        </div>

        <div className="card" style={{padding:26,animation:'borderPulse 3s ease infinite'}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:20}}>Sign In</h2>
          {err&&<div style={{background:`${G.red}12`,border:`1px solid ${G.red}33`,borderRadius:8,padding:'9px 12px',color:G.red,fontSize:12,marginBottom:12,animation:'fadeIn 0.3s ease'}}>{err}</div>}
          <form onSubmit={handle} autoComplete="off">
            <div style={{marginBottom:12}}>
              <label style={{color:G.muted,fontSize:11,display:'block',marginBottom:5,fontWeight:500}}>Email Address</label>
              <input ref={emailRef} className="inp" type="email" name="login-email-x" autoComplete="new-password" autoCorrect="off" autoCapitalize="off" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)}/>
            </div>
            <div style={{marginBottom:22}}>
              <label style={{color:G.muted,fontSize:11,display:'block',marginBottom:5,fontWeight:500}}>Password</label>
              <div style={{position:'relative'}}>
                <input ref={pwRef} className="inp" type={showPw?'text':'password'} name="login-pw-x" autoComplete="new-password" placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} style={{paddingRight:40}}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:G.muted,cursor:'pointer',fontSize:14,padding:4}}>
                  {showPw?'🙈':'👁️'}
                </button>
              </div>
            </div>
            <Btn variant="solid" G={G} size="lg" disabled={loading} style={{borderRadius:10}}>
              {loading?<span style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>Signing in...</span>:'Sign In →'}
            </Btn>
          </form>
          <div style={{marginTop:14,padding:11,background:G.subtle,border:`1px solid ${G.border}`,borderRadius:9}}>
            <p style={{color:G.muted,fontSize:10,marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Demo Account</p>
            <p style={{color:G.primary,fontSize:12,fontFamily:"'JetBrains Mono'"}}>admin@company.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, emps, tasks, activities, G, t, s }) {
  const isAdmin = user.role==='admin'||user.role==='hr';
  const myTasks = tasks.filter(tk=>tk.assignedTo?._id===user._id);
  const hour = new Date().getHours();
  const greeting = hour<12?t.goodMorning:hour<17?t.goodAfternoon:t.goodEvening;
  const tC = { pending:G.muted, in_progress:G.primary, completed:G.accent, overdue:G.red };
  const total = tasks.length||1;
  const rate = Math.round((tasks.filter(tk=>tk.status==='completed').length/total)*100);

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <div style={{marginBottom:s.compact?16:22}}>
        {s.showGreeting&&<p style={{color:G.muted,fontSize:12,marginBottom:2}}>{greeting}, {user.name?.split(' ')[0]} {hour<12?'☀️':hour<17?'🌤️':'🌙'}</p>}
        <h1 className="gtxt" style={{fontFamily:"'Syne',sans-serif",fontSize:FS[s.fontSize].xl,fontWeight:800,letterSpacing:-0.5}}>{t.dashboard}</h1>
      </div>

      {isAdmin?(
        <>
          <div className="stat-grid" style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
            <StatCard icon="👥" label={t.totalEmployees} val={emps.length} color={G.primary} G={G} s={s} delay={0}/>
            <StatCard icon="✅" label={t.activeAgents} val={emps.filter(e=>e.status==='active').length} color={G.accent} G={G} s={s} delay={0.1}/>
            <StatCard icon="📋" label={t.totalTasks} val={tasks.length} color={G.secondary} G={G} s={s} delay={0.2}/>
            <StatCard icon="🎯" label={t.completionRate} val={`${rate}%`} color={G.orange} G={G} s={s} delay={0.3}/>
          </div>

          {/* Charts Row */}
          <div className="two-col" style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:12,marginBottom:12}}>
            {/* Task Status Chart */}
            <div className="card" style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div style={{width:3,height:14,background:G.primary,borderRadius:2}}/>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:0.5}}>TASK OVERVIEW</h2>
              </div>
              {[
                { label:t.completed, val:tasks.filter(tk=>tk.status==='completed').length, color:G.accent },
                { label:t.inProgress, val:tasks.filter(tk=>tk.status==='in_progress').length, color:G.primary },
                { label:t.pending, val:tasks.filter(tk=>tk.status==='pending').length, color:G.orange },
                { label:t.overdue, val:tasks.filter(tk=>tk.status==='overdue').length, color:G.red },
              ].map((item,i)=>(
                <div key={i} style={{marginBottom:12,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:500}}>{item.label}</span>
                    <span style={{color:item.color,fontSize:11,fontFamily:"'JetBrains Mono'",fontWeight:600}}>{item.val}</span>
                  </div>
                  <PBar val={Math.round((item.val/total)*100)} G={G} color={item.color} h={6}/>
                </div>
              ))}
            </div>

            {/* Employee Progress */}
            <div className="card" style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                <div style={{width:3,height:14,background:G.secondary,borderRadius:2}}/>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,letterSpacing:0.5}}>TEAM PROGRESS</h2>
              </div>
              {emps.length===0?<Empty icon="👥" title="No employees" sub="Add your first employee"/>:
                emps.slice(0,5).map((emp,i)=>(
                  <div key={emp._id} style={{display:'flex',alignItems:'center',gap:9,marginBottom:11,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                    <Avt name={emp.name} size={30} G={G}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.name}</span>
                        <span style={{color:G.primary,fontSize:10,fontFamily:"'JetBrains Mono'",flexShrink:0,marginLeft:4}}>{emp.onboardingProgress||0}%</span>
                      </div>
                      <PBar val={emp.onboardingProgress||0} G={G}/>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Activity Feed */}
          {s.showActivity&&(
            <div className="card" style={{padding:18}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                <div style={{width:3,height:13,background:G.orange,borderRadius:2}}/>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5}}>RECENT ACTIVITY</h2>
                <div style={{marginLeft:'auto',background:`${G.accent}15`,color:G.accent,border:`1px solid ${G.accent}33`,borderRadius:8,padding:'1px 6px',fontSize:8,fontFamily:"'JetBrains Mono'",fontWeight:700}}>LIVE</div>
              </div>
              <div style={{maxHeight:180,overflow:'auto'}} className="thin-scroll">
                {activities.length===0?<Empty icon="📡" title="No activity" sub="Activity will appear here"/>:
                  activities.map((a,i)=>(
                    <div key={a.id} style={{display:'flex',gap:9,padding:'7px 0',borderBottom:`1px solid ${G.border}`,animation:`fadeUp 0.3s ease ${i*0.04}s both`}}>
                      <div style={{width:22,height:22,borderRadius:'50%',background:`${G.primary}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0}}>{a.icon||'⚡'}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.message}</div>
                        <div style={{color:G.muted,fontSize:9,marginTop:1}}>{a.time}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </>
      ):(
        <>
          <div className="card" style={{padding:20,marginBottom:14,background:`linear-gradient(135deg,${G.primary}08,${G.secondary}06)`,border:`1px solid ${G.primary}22`}}>
            <div style={{display:'flex',alignItems:'center',gap:13,flexWrap:'wrap'}}>
              <Avt name={user.name||'U'} size={50} G={G}/>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,marginBottom:2}}>{user.name}</h2>
                <p style={{color:G.muted,fontSize:11,marginBottom:9}}>{user.department} · {user.position}</p>
                <PBar val={user.onboardingProgress||0} G={G} h={7}/>
                <p style={{color:G.primary,fontSize:10,fontFamily:"'JetBrains Mono'",marginTop:4}}>{user.onboardingProgress||0}% complete</p>
              </div>
            </div>
          </div>
          <div className="stat-grid" style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}>
            <StatCard icon="✅" label={t.completed} val={myTasks.filter(tk=>tk.status==='completed').length} color={G.accent} G={G} s={s} delay={0}/>
            <StatCard icon="⚡" label={t.inProgress} val={myTasks.filter(tk=>tk.status==='in_progress').length} color={G.primary} G={G} s={s} delay={0.1}/>
            <StatCard icon="📋" label={t.pending} val={myTasks.filter(tk=>tk.status==='pending').length} color={G.orange} G={G} s={s} delay={0.2}/>
          </div>
          <div className="card" style={{padding:18}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <div style={{width:3,height:13,background:G.primary,borderRadius:2}}/>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5}}>MY TASKS</h2>
            </div>
            {myTasks.length===0?<Empty icon="🎯" title="No tasks" sub="Your tasks appear here"/>:
              myTasks.map((tk,i)=>(
                <div key={tk._id} style={{display:'flex',gap:10,padding:11,background:G.subtle,border:`1px solid ${G.border}`,borderRadius:10,marginBottom:8,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                  <span style={{fontSize:16}}>{catIcon[tk.category]}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600}}>{tk.title}</div>
                    {tk.description&&<div style={{color:G.muted,fontSize:11,marginTop:2}}>{tk.description}</div>}
                    <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap'}}>
                      <Bdg label={tk.status.replace('_',' ')} color={tC[tk.status]}/>
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
function Employees({ emps, setEmps, addToast, addActivity, G, t, s, soundOn }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [editEmp, setEditEmp] = useState(null);
  const [profileEmp, setProfileEmp] = useState(null);
  const [tasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', department:'', position:'', phone:'' });
  const [editForm, setEditForm] = useState({});
  const sC = { active:G.accent, onboarding:G.orange, inactive:G.red };

  const filtered = emps.filter(e => e.name?.toLowerCase().includes(search.toLowerCase())||e.department?.toLowerCase().includes(search.toLowerCase()));

  const add = async () => {
    if (!form.name||!form.email||!form.password) { addToast('Fill required fields','error'); return; }
    setLoading(true);
    try {
      const { data } = await api.addEmployee(form);
      setEmps([...emps, data]);
      setForm({ name:'',email:'',password:'',department:'',position:'',phone:'' });
      setShowForm(false);
      addToast(`${form.name} added!`,'success');
      addActivity(`${form.name} joined the team`,'👤');
      snd('success', soundOn);
    } catch(err) { addToast(err.response?.data?.message||'Failed','error'); }
    setLoading(false);
  };

  const update = async () => {
    try {
      const { data } = await api.updateEmployee(editEmp._id, editForm);
      setEmps(emps.map(e => e._id===editEmp._id ? {...e,...editForm} : e));
      setEditEmp(null);
      addToast('Employee updated!','success');
      snd('success', soundOn);
    } catch { addToast('Failed to update','error'); }
  };

  const remove = async () => {
    try {
      await api.deleteEmployee(confirm);
      const emp = emps.find(e=>e._id===confirm);
      setEmps(emps.filter(e=>e._id!==confirm));
      addToast('Employee removed','info');
      addActivity(`${emp?.name} was removed`,'🗑️');
      snd('error', soundOn);
    } catch { addToast('Failed','error'); }
    setConfirm(null);
  };

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <Confirm show={!!confirm} msg="Permanently remove this employee?" onYes={remove} onNo={()=>setConfirm(null)} G={G}/>
      {profileEmp&&<ProfileModal emp={profileEmp} tasks={tasks} G={G} onClose={()=>setProfileEmp(null)} t={t}/>}

      <PageHdr title={t.employees} sub={`${emps.length} employees`} G={G} s={s}
        action={<Btn variant="solid" G={G} onClick={()=>setShowForm(!showForm)}>+ {t.addEmployee}</Btn>}/>

      {showForm&&(
        <div className="card" style={{padding:20,marginBottom:14,border:`1px solid ${G.accent}22`,animation:'fadeUp 0.3s ease'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <div style={{width:3,height:13,background:G.accent,borderRadius:2}}/>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:G.accent}}>NEW EMPLOYEE</h3>
          </div>
          <div className="form-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[{k:'name',l:`${t.name} *`},{k:'email',l:`${t.email} *`,tp:'email'},{k:'password',l:`${t.password} *`,tp:'password'},{k:'department',l:t.department},{k:'position',l:t.position},{k:'phone',l:t.phone}].map(f=>(
              <div key={f.k}>
                <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{f.l}</label>
                <input className="inp" type={f.tp||'text'} placeholder={f.l.replace(' *','')} value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} autoComplete="off"/>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            <Btn variant="success" G={G} onClick={add} disabled={loading}>{loading?'Adding...':t.save}</Btn>
            <Btn variant="ghost" G={G} onClick={()=>setShowForm(false)}>{t.cancel}</Btn>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editEmp&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',zIndex:9996,display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'overlayIn 0.3s ease'}}>
          <div className="card" style={{width:'100%',maxWidth:440,padding:24,animation:'modalIn 0.4s ease'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700}}>Edit Employee</h3>
              <button onClick={()=>setEditEmp(null)} style={{background:`${G.red}15`,border:`1px solid ${G.red}22`,color:G.red,borderRadius:7,width:26,height:26,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[{k:'name',l:t.name},{k:'department',l:t.department},{k:'position',l:t.position},{k:'phone',l:t.phone}].map(f=>(
                <div key={f.k}>
                  <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{f.l}</label>
                  <input className="inp" value={editForm[f.k]||''} onChange={e=>setEditForm({...editForm,[f.k]:e.target.value})} placeholder={f.l}/>
                </div>
              ))}
              <div>
                <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>Progress %</label>
                <input className="inp" type="number" min="0" max="100" value={editForm.onboardingProgress||0} onChange={e=>setEditForm({...editForm,onboardingProgress:parseInt(e.target.value)})}/>
              </div>
              <div>
                <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>Status</label>
                <select className="inp" value={editForm.status||'onboarding'} onChange={e=>setEditForm({...editForm,status:e.target.value})}>
                  {['active','onboarding','inactive'].map(st=><option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:14}}>
              <Btn variant="solid" G={G} onClick={update}>{t.save} Changes</Btn>
              <Btn variant="ghost" G={G} onClick={()=>setEditEmp(null)}>{t.cancel}</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{position:'relative',marginBottom:14}}>
        <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:G.muted,fontSize:14}}>🔍</span>
        <input className="inp" placeholder={t.search} value={search} onChange={e=>setSearch(e.target.value)} style={{paddingLeft:38}}/>
      </div>

      <div className="emp-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:11}}>
        {filtered.length===0?<div style={{gridColumn:'1/-1'}}><Empty icon={search?'🔍':'👥'} title={search?'No results':'No employees yet'} sub={search?`No match for "${search}"`:'Click "Add Employee" to start'}/></div>:
          filtered.map((emp,i)=>(
            <div key={emp._id} className="card" style={{padding:17,animation:`fadeUp 0.4s ease ${i*0.06}s both`,position:'relative'}}>
              <div style={{position:'absolute',top:10,right:10,display:'flex',gap:5}}>
                <button onClick={()=>{setEditEmp(emp);setEditForm({name:emp.name,department:emp.department,position:emp.position,phone:emp.phone,onboardingProgress:emp.onboardingProgress||0,status:emp.status||'onboarding'});}} style={{background:`${G.primary}15`,border:`1px solid ${G.primary}22`,color:G.primary,borderRadius:6,width:24,height:24,cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center'}}>✏️</button>
                <button onClick={()=>setConfirm(emp._id)} style={{background:`${G.red}15`,border:`1px solid ${G.red}22`,color:G.red,borderRadius:6,width:24,height:24,cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:11}} onClick={()=>setProfileEmp(emp)}>
                <Avt name={emp.name||'?'} size={40} G={G}/>
                <div style={{flex:1,minWidth:0,paddingRight:56}}>
                  <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer',color:G.primary}}>{emp.name}</div>
                  <div style={{color:G.muted,fontSize:11,marginTop:1}}>{emp.position||'No position'}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:9}}>
                <Bdg label={emp.status||'onboarding'} color={sC[emp.status]||G.orange}/>
                {emp.department&&<Bdg label={emp.department} color={G.secondary}/>}
              </div>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{color:G.muted,fontSize:10}}>{t.progress}</span>
                  <span style={{color:G.primary,fontSize:10,fontFamily:"'JetBrains Mono'",fontWeight:600}}>{emp.onboardingProgress||0}%</span>
                </div>
                <PBar val={emp.onboardingProgress||0} G={G}/>
              </div>
              {emp.phone&&<div style={{color:G.muted,fontSize:10,marginTop:8}}>📱 {emp.phone}</div>}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function Tasks({ user, tasks, setTasks, emps, addToast, addActivity, G, t, s, soundOn }) {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [done, setDone] = useState(false);
  const [doneName, setDoneName] = useState('');
  const [form, setForm] = useState({ title:'',description:'',assignedTo:'',priority:'medium',category:'other',dueDate:'' });
  const tC = { pending:G.muted, in_progress:G.primary, completed:G.accent, overdue:G.red };
  const pC = { high:G.red, medium:G.orange, low:G.accent };
  const isAdmin = user.role==='admin'||user.role==='hr';
  const visible = isAdmin?tasks:tasks.filter(tk=>tk.assignedTo?._id===user._id);
  const filtered = filter==='all'?visible:visible.filter(tk=>tk.status===filter);

  const getDL = dueDate => {
    if (!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate)-new Date())/(1000*60*60*24));
    if (diff<0) return { label:t.overdue, color:G.red };
    if (diff===0) return { label:'Due today!', color:G.red };
    if (diff<=2) return { label:`${diff}d left`, color:G.orange };
    return { label:`${diff}d left`, color:G.muted };
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.updateTask(id, { status });
      setTasks(tasks.map(tk=>tk._id===id?data:tk));
      const task = tasks.find(tk=>tk._id===id);
      if (status==='completed') {
        setDoneName(task?.assignedTo?.name||'');
        setDone(true);
        addToast('Task completed! +100 XP 🎉','success');
        addActivity(`${task?.assignedTo?.name} completed "${task?.title}"`,'✅');
        snd('complete', soundOn);
      } else {
        addToast('Status updated!','info');
        addActivity(`"${task?.title}" started`,'▶️');
        snd('click', soundOn);
      }
    } catch { addToast('Failed','error'); }
  };

  const addTask = async () => {
    if (!form.title||!form.assignedTo) { addToast('Fill required fields','error'); return; }
    try {
      const { data } = await api.addTask(form);
      setTasks([...tasks, data]);
      const emp = emps.find(e=>e._id===form.assignedTo);
      setForm({ title:'',description:'',assignedTo:'',priority:'medium',category:'other',dueDate:'' });
      setShowForm(false);
      addToast('Task created!','success');
      addActivity(`New task assigned to ${emp?.name||'someone'}`,'📋');
      snd('success', soundOn);
    } catch { addToast('Failed','error'); }
  };

  if (view==='kanban') return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <Btn variant="solid" G={G} size="sm" onClick={()=>setView('list')}>← List View</Btn>
      </div>
      <KanbanBoard tasks={tasks} setTasks={setTasks} addToast={addToast} G={G} t={t} s={s} soundOn={soundOn}/>
    </div>
  );

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <TaskDone show={done} onClose={()=>setDone(false)} name={doneName} G={G} anim={s.animations}/>
      <PageHdr title={t.tasks} sub={`${visible.length} tasks`} G={G} s={s}
        action={
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <Btn variant="ghost" G={G} size="sm" onClick={()=>setView('kanban')}>🗃️ Kanban</Btn>
            {isAdmin&&<Btn variant="solid" G={G} size="sm" onClick={()=>setShowForm(!showForm)}>+ {t.addTask}</Btn>}
          </div>
        }/>

      {showForm&&(
        <div className="card" style={{padding:20,marginBottom:14,border:`1px solid ${G.orange}22`,animation:'fadeUp 0.3s ease'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <div style={{width:3,height:13,background:G.orange,borderRadius:2}}/>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:G.orange}}>NEW TASK</h3>
          </div>
          <div className="form-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div>
              <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{t.name} *</label>
              <input className="inp" placeholder="Task title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
            </div>
            <div>
              <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{t.assignTo} *</label>
              <select className="inp" value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}>
                <option value="">Select employee</option>
                {emps.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{t.description}</label>
              <textarea className="inp" placeholder="Description..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'vertical',minHeight:55}}/>
            </div>
            <div>
              <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{t.priority}</label>
              <select className="inp" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                {['low','medium','high'].map(p=><option key={p} value={p}>{t[p]||p}</option>)}
              </select>
            </div>
            <div>
              <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{t.category}</label>
              <select className="inp" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                {['documentation','training','setup','meeting','other'].map(c=><option key={c} value={c}>{t[c]||c}</option>)}
              </select>
            </div>
            <div>
              <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:4,fontWeight:500}}>{t.dueDate}</label>
              <input className="inp" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            <Btn variant="success" G={G} onClick={addTask}>{t.save}</Btn>
            <Btn variant="ghost" G={G} onClick={()=>setShowForm(false)}>{t.cancel}</Btn>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {['all','pending','in_progress','completed'].map(f=>(
          <button key={f} onClick={()=>{setFilter(f);snd('click',soundOn);}}
            style={{background:filter===f?`${G.primary}20`:'transparent',color:filter===f?G.primary:G.muted,border:`1px solid ${filter===f?G.primary+'55':G.border}`,borderRadius:20,padding:'5px 13px',fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans'",transition:'all 0.2s',minHeight:32}}>
            {f==='all'?'All':t[f==='in_progress'?'inProgress':f]||f} ({(f==='all'?visible:visible.filter(tk=>tk.status===f)).length})
          </button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.length===0?<Empty icon="📋" title="No tasks" sub={filter==='all'?'Create your first task':`No ${filter.replace('_',' ')} tasks`}/>:
          filtered.map((tk,i)=>{
            const dl = getDL(tk.dueDate);
            return (
              <div key={tk._id} className="card" style={{padding:15,display:'flex',gap:11,alignItems:'flex-start',borderLeft:`3px solid ${tC[tk.status]||G.border}22`,animation:`fadeUp 0.4s ease ${i*0.05}s both`,transition:'all 0.3s'}}>
                <span style={{fontSize:17,marginTop:1,flexShrink:0}}>{catIcon[tk.category]||'📌'}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,marginBottom:5}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tk.title}</div>
                      {tk.description&&<div style={{color:G.muted,fontSize:11,marginTop:1}}>{tk.description}</div>}
                    </div>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap',flexShrink:0}}>
                      <Bdg label={tk.status.replace('_',' ')} color={tC[tk.status]}/>
                      <Bdg label={t[tk.priority]||tk.priority} color={pC[tk.priority]||G.muted}/>
                      {dl&&<Bdg label={dl.label} color={dl.color}/>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                    <span style={{color:G.muted,fontSize:11}}>👤 {tk.assignedTo?.name||'Unassigned'}</span>
                    {tk.dueDate&&<span style={{color:G.muted,fontSize:11}}>📅 {tk.dueDate?.split('T')[0]}</span>}
                    <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                      {tk.status==='pending'&&<Btn size="sm" G={G} variant="primary" onClick={()=>updateStatus(tk._id,'in_progress')}>▶ Start</Btn>}
                      {tk.status==='in_progress'&&<Btn size="sm" G={G} variant="success" onClick={()=>updateStatus(tk._id,'completed')}>✓ Complete</Btn>}
                      {tk.status==='completed'&&<span style={{color:G.accent,fontSize:11,fontWeight:600}}>✓ Done</span>}
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

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function Analytics({ emps, tasks, G, t, s }) {
  const total = tasks.length||1;
  const rate = Math.round((tasks.filter(tk=>tk.status==='completed').length/total)*100);
  const tC = { pending:G.muted, in_progress:G.primary, completed:G.accent, overdue:G.red };
  const depts = [...new Set(emps.map(e=>e.department).filter(Boolean))];

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <PageHdr title={t.analytics} sub="Performance insights" G={G} s={s}/>
      <div className="stat-grid" style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
        <StatCard icon="👥" label={t.totalEmployees} val={emps.length} color={G.primary} G={G} s={s} delay={0}/>
        <StatCard icon="📋" label={t.totalTasks} val={tasks.length} color={G.orange} G={G} s={s} delay={0.1}/>
        <StatCard icon="✅" label={t.completed} val={tasks.filter(tk=>tk.status==='completed').length} color={G.accent} G={G} s={s} delay={0.2}/>
        <StatCard icon="🎯" label={t.completionRate} val={`${rate}%`} color={G.secondary} G={G} s={s} delay={0.3}/>
      </div>

      <div className="two-col" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        {/* Task Status */}
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <div style={{width:3,height:13,background:G.primary,borderRadius:2}}/>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5}}>TASK DISTRIBUTION</h2>
          </div>
          {/* Donut chart simulation */}
          <div style={{position:'relative',width:100,height:100,margin:'0 auto 16px',borderRadius:'50%',background:`conic-gradient(${G.accent} 0% ${rate}%, ${G.primary} ${rate}% ${rate+Math.round((tasks.filter(tk=>tk.status==='in_progress').length/total)*100)}%, ${G.muted} ${rate+Math.round((tasks.filter(tk=>tk.status==='in_progress').length/total)*100)}% 100%)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:64,height:64,borderRadius:'50%',background:G.card,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
              <div style={{fontFamily:"'JetBrains Mono'",fontSize:16,fontWeight:700,color:G.accent,lineHeight:1}}>{rate}%</div>
              <div style={{color:G.muted,fontSize:8}}>done</div>
            </div>
          </div>
          {['completed','in_progress','pending','overdue'].map((s,i)=>{
            const count = tasks.filter(tk=>tk.status===s).length;
            return <div key={s} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:tC[s],flexShrink:0}}/>
              <span style={{fontSize:11,flex:1,textTransform:'capitalize'}}>{s.replace('_',' ')}</span>
              <span style={{color:tC[s],fontSize:11,fontFamily:"'JetBrains Mono'",fontWeight:600}}>{count}</span>
            </div>;
          })}
        </div>

        {/* Agent Performance */}
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <div style={{width:3,height:13,background:G.secondary,borderRadius:2}}/>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5}}>AGENT PERFORMANCE</h2>
          </div>
          {emps.length===0?<Empty icon="📊" title="No data" sub="Add employees first"/>:
            emps.map((emp,i)=>{
              const done = tasks.filter(tk=>tk.assignedTo?._id===emp._id&&tk.status==='completed').length;
              const tot = tasks.filter(tk=>tk.assignedTo?._id===emp._id).length;
              return <div key={emp._id} style={{marginBottom:13,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <Avt name={emp.name} size={22} G={G}/>
                    <span style={{fontSize:11,fontWeight:500}}>{emp.name?.split(' ')[0]}</span>
                  </div>
                  <span style={{color:G.primary,fontSize:9,fontFamily:"'JetBrains Mono'"}}>{done}/{tot} · {emp.onboardingProgress||0}%</span>
                </div>
                <PBar val={emp.onboardingProgress||0} G={G} h={6}/>
              </div>;
            })
          }
        </div>
      </div>

      {/* Department Breakdown */}
      {depts.length>0&&(
        <div className="card" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <div style={{width:3,height:13,background:G.orange,borderRadius:2}}/>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5}}>DEPARTMENT BREAKDOWN</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
            {depts.map((dept,i)=>{
              const deptEmps = emps.filter(e=>e.department===dept);
              const avgProgress = Math.round(deptEmps.reduce((a,e)=>a+(e.onboardingProgress||0),0)/deptEmps.length);
              return <div key={i} style={{background:G.subtle,border:`1px solid ${G.border}`,borderRadius:10,padding:12,textAlign:'center',animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                <div style={{fontFamily:"'JetBrains Mono'",fontSize:20,fontWeight:700,color:G.primary,marginBottom:3}}>{avgProgress}%</div>
                <div style={{fontSize:11,fontWeight:600,marginBottom:2}}>{dept}</div>
                <div style={{color:G.muted,fontSize:10}}>{deptEmps.length} member{deptEmps.length!==1?'s':''}</div>
                <div style={{marginTop:8}}><PBar val={avgProgress} G={G} h={4}/></div>
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function Leaderboard({ emps, tasks, G, t, s }) {
  const ranked = emps.map(emp=>{
    const et = tasks.filter(tk=>tk.assignedTo?._id===emp._id);
    const done = et.filter(tk=>tk.status==='completed').length;
    const xp = done*100+(emp.onboardingProgress||0);
    const rank = xp>800?'Legend':xp>500?'Expert':xp>200?'Professional':'Beginner';
    const rc = xp>800?G.orange:xp>500?G.secondary:xp>200?G.primary:G.accent;
    const badges = getEarnedBadges(emp, tasks);
    return { ...emp, xp, done, total:et.length, rank, rc, badges };
  }).sort((a,b)=>b.xp-a.xp);

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <PageHdr title={t.leaderboard} sub="Employee rankings by XP" G={G} s={s}/>
      {ranked.length===0?<Empty icon="🏆" title="No rankings yet" sub="Complete tasks to earn XP"/>:(
        <>
          {ranked.length>=3&&(
            <div style={{display:'flex',gap:10,marginBottom:20,alignItems:'flex-end',justifyContent:'center',flexWrap:'wrap'}}>
              {[ranked[1],ranked[0],ranked[2]].map((emp,i)=>{
                const hs=[130,170,110], meds=['🥈','🥇','🥉'];
                return emp?<div key={emp._id} style={{flex:1,minWidth:80,maxWidth:130,textAlign:'center',animation:`fadeUp 0.5s ease ${i*0.15}s both`}}>
                  <div style={{fontSize:24,marginBottom:6}}>{meds[i]}</div>
                  <Avt name={emp.name} size={38} G={G}/>
                  <div style={{fontSize:11,fontWeight:600,margin:'6px 0 3px',fontFamily:"'Syne',sans-serif"}}>{emp.name?.split(' ')[0]}</div>
                  <Bdg label={emp.rank} color={emp.rc}/>
                  <div style={{height:hs[i],background:`linear-gradient(180deg,${emp.rc}20,${emp.rc}08)`,border:`1px solid ${emp.rc}33`,borderRadius:'9px 9px 0 0',marginTop:6,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
                    <div style={{color:emp.rc,fontFamily:"'JetBrains Mono'",fontSize:15,fontWeight:700}}>{emp.xp}</div>
                    <div style={{color:G.muted,fontSize:9}}>XP</div>
                  </div>
                </div>:null;
              })}
            </div>
          )}
          <div className="card" style={{padding:18}}>
            {ranked.map((emp,i)=>(
              <div key={emp._id} style={{display:'flex',alignItems:'center',gap:9,padding:'10px 12px',background:i===0?`${G.orange}06`:`${G.primary}03`,border:`1px solid ${i===0?G.orange+'22':G.border}`,borderRadius:10,marginBottom:6,animation:`fadeUp 0.4s ease ${i*0.06}s both`,transition:'all 0.3s'}}>
                <div style={{width:22,height:22,borderRadius:'50%',background:i<3?`${[G.orange,G.muted,G.primary][i]}22`:G.surface,border:`1px solid ${i<3?[G.orange,G.muted,G.primary][i]:G.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,fontFamily:"'JetBrains Mono'",color:i<3?[G.orange,G.muted,G.primary][i]:G.muted,flexShrink:0}}>
                  {['🥇','🥈','🥉'][i]||i+1}
                </div>
                <Avt name={emp.name||'?'} size={32} G={G}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                    <span style={{fontWeight:600,fontSize:12,fontFamily:"'Syne',sans-serif"}}>{emp.name}</span>
                    <Bdg label={emp.rank} color={emp.rc}/>
                    {emp.badges.slice(0,2).map(b=><span key={b.id} style={{fontSize:12}}>{b.icon}</span>)}
                  </div>
                  <PBar val={emp.onboardingProgress||0} G={G} h={4}/>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <div style={{color:emp.rc,fontWeight:700,fontSize:14,fontFamily:"'JetBrains Mono'"}}>{emp.xp}</div>
                  <div style={{color:G.muted,fontSize:9}}>XP · {emp.done} done</div>
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
function Reports({ emps, tasks, G, t, s, addToast, soundOn }) {
  const [sel, setSel] = useState('');
  const [generating, setGenerating] = useState(false);

  const generate = (empId) => {
    const id = empId||sel; if (!id) return;
    setGenerating(true); snd('click', soundOn);
    const emp = emps.find(e=>e._id===id);
    const et = tasks.filter(tk=>tk.assignedTo?._id===id);
    const done = et.filter(tk=>tk.status==='completed');
    const pending = [...et.filter(tk=>tk.status==='in_progress'), ...et.filter(tk=>tk.status==='pending')];
    const xp = done.length*100+(emp?.onboardingProgress||0);
    const badges = getEarnedBadges(emp||{}, tasks);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OnboardIQ Report — ${emp?.name}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{background:#080b14;color:#f1f5f9;font-family:'DM Sans',sans-serif;padding:40px;max-width:780px;margin:0 auto;}
.header{background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:18px;padding:28px;text-align:center;margin-bottom:24px;}
.logo{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.name{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#f1f5f9;margin-top:12px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:20px;}
.stat{background:#111827;border:1px solid #1f2937;border-radius:11px;padding:14px;text-align:center;}
.sv{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;}
.sl{color:#6b7280;font-size:9px;margin-top:3px;letter-spacing:0.5px;text-transform:uppercase;}
.section{background:#111827;border:1px solid #1f2937;border-radius:11px;padding:18px;margin-bottom:14px;}
.sh{font-family:'Syne',sans-serif;font-size:11px;color:#6366f1;font-weight:700;margin-bottom:11px;padding-left:9px;border-left:3px solid #6366f1;}
.task{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #1f2937;}
.badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:600;font-family:'JetBrains Mono',monospace;}
.prog-track{height:5px;background:#1f2937;border-radius:5px;overflow:hidden;margin:8px 0;}
.prog-fill{height:100%;border-radius:5px;}
.footer{text-align:center;margin-top:26px;color:#1f2937;font-size:9px;font-family:'JetBrains Mono',monospace;letter-spacing:1px;}
</style></head><body>
<div class="header">
<div class="logo">OnboardIQ</div>
<div style="color:#6b7280;font-size:10px;letter-spacing:1px;margin-top:4px;font-family:'JetBrains Mono'">EMPLOYEE ONBOARDING REPORT</div>
<div class="name">${emp?.name}</div>
<div style="color:#6b7280;font-size:12px;margin-top:4px">${emp?.position||''} · ${emp?.department||''} · ${emp?.email}</div>
<div style="margin-top:10px;display:flex;gap:7px;justify-content:center;flex-wrap:wrap">
<span class="badge" style="background:${(emp?.status==='active'?'#10b981':'#f59e0b')}18;color:${(emp?.status==='active'?'#10b981':'#f59e0b')};border:1px solid ${(emp?.status==='active'?'#10b981':'#f59e0b')}33">${emp?.status?.toUpperCase()||'ONBOARDING'}</span>
<span class="badge" style="background:#6366f115;color:#6366f1;border:1px solid #6366f133">${xp} XP</span>
${badges.map(b=>`<span class="badge" style="background:#f59e0b15;color:#f59e0b;border:1px solid #f59e0b33">${b.icon} ${b.name}</span>`).join('')}
</div></div>
<div class="stats">
<div class="stat" style="border-color:#6366f133"><div class="sv" style="color:#6366f1">${emp?.onboardingProgress||0}%</div><div class="sl">Progress</div>
<div class="prog-track"><div class="prog-fill" style="width:${emp?.onboardingProgress||0}%;background:linear-gradient(90deg,#6366f188,#6366f1)"></div></div></div>
<div class="stat" style="border-color:#10b98133"><div class="sv" style="color:#10b981">${done.length}</div><div class="sl">Completed</div></div>
<div class="stat" style="border-color:#f59e0b33"><div class="sv" style="color:#f59e0b">${et.filter(tk=>tk.status==='in_progress').length}</div><div class="sl">In Progress</div></div>
<div class="stat" style="border-color:#6b728033"><div class="sv" style="color:#6b7280">${et.filter(tk=>tk.status==='pending').length}</div><div class="sl">Pending</div></div>
</div>
<div class="section"><div class="sh">COMPLETED TASKS (${done.length})</div>
${done.length===0?'<div style="color:#6b7280;text-align:center;padding:12px;font-size:12px">No completed tasks yet</div>':done.map(tk=>`<div class="task"><span style="font-size:14px">${catIcon[tk.category]||'📌'}</span><div style="flex:1"><div style="font-weight:600;font-size:12px">${tk.title}</div>${tk.description?`<div style="color:#6b7280;font-size:10px">${tk.description}</div>`:''}</div><span class="badge" style="background:#10b98115;color:#10b981;border:1px solid #10b98133">Done ✓</span></div>`).join('')}
</div>
<div class="section"><div class="sh">PENDING TASKS (${pending.length})</div>
${pending.length===0?'<div style="color:#6b7280;text-align:center;padding:12px;font-size:12px">All tasks completed! 🎉</div>':pending.map(tk=>`<div class="task"><span style="font-size:14px">${catIcon[tk.category]||'📌'}</span><div style="flex:1"><div style="font-weight:600;font-size:12px">${tk.title}</div><div style="color:#6b7280;font-size:10px">Due: ${tk.dueDate?.split('T')[0]||'No deadline'}</div></div><span class="badge" style="background:#6366f115;color:#6366f1;border:1px solid #6366f133">${tk.status.replace('_',' ')}</span></div>`).join('')}
</div>
<div class="footer">GENERATED BY ONBOARDIQ · ${new Date().toLocaleDateString()} · CONFIDENTIAL</div>
</body></html>`;
    setTimeout(()=>{
      const blob = new Blob([html],{type:'text/html'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=`${emp?.name?.replace(' ','_')}_OnboardIQ_Report.html`; a.click();
      URL.revokeObjectURL(url);
      setGenerating(false); snd('success', soundOn);
      addToast('Report downloaded!','success');
    }, 900);
  };

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <PageHdr title={t.reports} sub="Generate employee reports" G={G} s={s}/>
      <div className="card" style={{padding:22,marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
          <div style={{width:3,height:13,background:G.accent,borderRadius:2}}/>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5}}>{t.generate.toUpperCase()}</h2>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{color:G.muted,fontSize:10,display:'block',marginBottom:5,fontWeight:500}}>Select Employee</label>
          <select className="inp" value={sel} onChange={e=>setSel(e.target.value)}>
            <option value="">Choose employee...</option>
            {emps.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        {sel&&(()=>{
          const emp=emps.find(e=>e._id===sel), et=tasks.filter(tk=>tk.assignedTo?._id===sel);
          return <div style={{background:G.subtle,border:`1px solid ${G.border}`,borderRadius:10,padding:13,marginBottom:12,animation:'fadeUp 0.3s ease'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Avt name={emp?.name||'?'} size={40} G={G}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,fontFamily:"'Syne',sans-serif"}}>{emp?.name}</div>
                <div style={{color:G.muted,fontSize:11,marginBottom:7}}>{emp?.position} · {emp?.department}</div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  <Bdg label={`${emp?.onboardingProgress||0}%`} color={G.primary}/>
                  <Bdg label={`${et.filter(tk=>tk.status==='completed').length} done`} color={G.accent}/>
                  <Bdg label={`${et.length} total`} color={G.orange}/>
                </div>
              </div>
            </div>
          </div>;
        })()}
        <Btn variant="solid" G={G} onClick={()=>generate()} disabled={!sel||generating} style={{borderRadius:10,padding:'10px 24px'}}>
          {generating?'Generating...':'📄 '+t.download+' Report'}
        </Btn>
        <p style={{color:G.muted,fontSize:10,marginTop:8}}>Opens in browser — print as PDF with Ctrl+P</p>
      </div>
      <div className="card" style={{padding:18}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <div style={{width:3,height:13,background:G.primary,borderRadius:2}}/>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,letterSpacing:0.5}}>ALL EMPLOYEES</h2>
        </div>
        {emps.length===0?<Empty icon="👥" title="No employees" sub="Add employees first"/>:
          emps.map((emp,i)=>{
            const et=tasks.filter(tk=>tk.assignedTo?._id===emp._id);
            return <div key={emp._id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 11px',background:`${G.primary}04`,border:`1px solid ${G.border}`,borderRadius:10,marginBottom:6,animation:`fadeUp 0.4s ease ${i*0.06}s both`}}>
              <Avt name={emp.name||'?'} size={30} G={G}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:12,marginBottom:3,fontFamily:"'Syne',sans-serif"}}>{emp.name}</div>
                <PBar val={emp.onboardingProgress||0} G={G} h={4}/>
              </div>
              <div style={{display:'flex',gap:4}}>
                <Bdg label={`${emp.onboardingProgress||0}%`} color={G.primary}/>
                <Bdg label={`${et.filter(tk=>tk.status==='completed').length}/${et.length}`} color={G.accent}/>
              </div>
              <Btn size="sm" G={G} variant="ghost" onClick={()=>{setSel(emp._id);generate(emp._id);}}>📄</Btn>
            </div>;
          })
        }
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ settings, setSettings, G, t, user, addToast }) {
  const save = (key, val) => {
    const n = {...settings,[key]:val};
    setSettings(n); localStorage.setItem('appSettings',JSON.stringify(n));
    addToast('Settings saved!','success');
  };

  const Sec = ({title,children}) => (
    <div className="card" style={{padding:20,marginBottom:12,animation:'slideL 0.4s ease'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16,paddingBottom:11,borderBottom:`1px solid ${G.border}`}}>
        <div style={{width:3,height:15,background:G.primary,borderRadius:2}}/>
        <h2 style={{fontFamily:"'Syne',sans-serif",color:G.primary,fontSize:11,fontWeight:700,letterSpacing:1}}>{title}</h2>
      </div>
      {children}
    </div>
  );

  const Row = ({label,sub,children}) => (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${G.border}`}}>
      <div style={{flex:1,paddingRight:14}}>
        <div style={{fontSize:13,fontWeight:500,marginBottom:1}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:G.muted}}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{animation:'slideL 0.4s ease'}}>
      <PageHdr title={t.settings} sub="Customize your experience" G={G} s={settings}/>

      <Sec title={`🎨 ${t.theme.toUpperCase()}`}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:8,marginBottom:14}}>
          {Object.entries(THEMES).map(([key,theme])=>(
            <button key={key} onClick={()=>save('theme',key)}
              style={{display:'flex',alignItems:'center',gap:8,padding:'9px 11px',background:settings.theme===key?`${G.primary}22`:G.subtle,border:`2px solid ${settings.theme===key?G.primary:G.border}`,borderRadius:9,cursor:'pointer',color:settings.theme===key?G.primary:G.muted,transition:'all 0.2s',fontFamily:"'DM Sans'",fontSize:11,fontWeight:500}}>
              <span style={{fontSize:17}}>{theme.icon}</span>
              <span>{theme.name}</span>
              {settings.theme===key&&<span style={{marginLeft:'auto',color:G.accent,fontSize:13}}>✓</span>}
            </button>
          ))}
        </div>
        <Row label={`${t.fontSize}`} sub="Adjust text size for readability">
          <div style={{display:'flex',gap:5}}>
            {['small','medium','large'].map(f=>(
              <button key={f} onClick={()=>save('fontSize',f)}
                style={{padding:'5px 12px',background:settings.fontSize===f?`${G.primary}22`:G.subtle,border:`1px solid ${settings.fontSize===f?G.primary:G.border}`,borderRadius:7,color:settings.fontSize===f?G.primary:G.muted,cursor:'pointer',fontSize:11,fontFamily:"'DM Sans'",fontWeight:500,transition:'all 0.2s',textTransform:'capitalize'}}>
                {f==='small'?'S':f==='medium'?'M':'L'}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Compact Mode" sub="Reduce spacing for more content">
          <Tgl checked={settings.compact} onChange={e=>save('compact',e.target.checked)} G={G}/>
        </Row>
      </Sec>

      <Sec title={`🌐 ${t.language.toUpperCase()}`}>
        <Row label="App Language" sub="Switch between English and Tamil">
          <div style={{display:'flex',gap:5}}>
            {[['en','English'],['ta','தமிழ்']].map(([code,label])=>(
              <button key={code} onClick={()=>save('lang',code)}
                style={{padding:'5px 14px',background:settings.lang===code?`${G.primary}22`:G.subtle,border:`1px solid ${settings.lang===code?G.primary:G.border}`,borderRadius:7,color:settings.lang===code?G.primary:G.muted,cursor:'pointer',fontSize:11,fontFamily:"'DM Sans'",fontWeight:500,transition:'all 0.2s'}}>
                {label}
              </button>
            ))}
          </div>
        </Row>
      </Sec>

      <Sec title={`⚡ ${t.animations.toUpperCase()} & ${t.sound.toUpperCase()}`}>
        <Row label={t.animations} sub="Enable smooth transitions">
          <Tgl checked={settings.animations} onChange={e=>save('animations',e.target.checked)} G={G}/>
        </Row>
        <Row label={t.sound} sub="Play sounds on actions">
          <Tgl checked={settings.sound} onChange={e=>save('sound',e.target.checked)} G={G}/>
        </Row>
        {settings.sound&&(
          <div style={{padding:'10px 0'}}>
            <div style={{fontSize:11,color:G.muted,marginBottom:8}}>Test sounds:</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[['Success','success'],['Click','click'],['Complete','complete'],['Error','error']].map(([l,type])=>(
                <Btn key={type} size="sm" G={G} variant="ghost" onClick={()=>snd(type,true)}>{l}</Btn>
              ))}
            </div>
          </div>
        )}
        <Row label="Time Greeting" sub="Show morning/afternoon/evening greeting">
          <Tgl checked={settings.showGreeting} onChange={e=>save('showGreeting',e.target.checked)} G={G}/>
        </Row>
        <Row label="Activity Feed" sub="Show live activity on dashboard">
          <Tgl checked={settings.showActivity} onChange={e=>save('showActivity',e.target.checked)} G={G}/>
        </Row>
      </Sec>

      <Sec title="👤 ACCOUNT">
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${G.border}`}}>
          <Avt name={user.name||'U'} size={46} G={G}/>
          <div>
            <div style={{fontSize:15,fontWeight:700,fontFamily:"'Syne',sans-serif"}}>{user.name}</div>
            <div style={{color:G.muted,fontSize:12,marginBottom:4}}>{user.email}</div>
            <Bdg label={user.role} color={G.primary}/>
          </div>
        </div>
        <div style={{padding:'12px 0'}}>
          <Btn G={G} variant="ghost" onClick={()=>addToast('Contact admin to change password','info')}>Change Password</Btn>
        </div>
      </Sec>

      <Sec title="🔄 RESET">
        <Row label={t.reset} sub="Restore all settings to default">
          <Btn G={G} variant="danger" size="sm" onClick={()=>{setSettings(DEF);localStorage.setItem('appSettings',JSON.stringify(DEF));addToast('Settings reset!','info');}}>Reset</Btn>
        </Row>
      </Sec>
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const NAV = [
  { key:'dashboard', icon:'🏠' },
  { key:'employees', icon:'👥', admin:true },
  { key:'tasks', icon:'📋' },
  { key:'kanban', icon:'🗃️', admin:true },
  { key:'analytics', icon:'📊', admin:true },
  { key:'calendar', icon:'📅' },
  { key:'leaderboard', icon:'🏆' },
  { key:'reports', icon:'📄', admin:true },
  { key:'ai', icon:'🤖' },
  { key:'settings', icon:'⚙️' },
];

function Layout({ user, onLogout }) {
  const [page, setPage] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [emps, setEmps] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(()=>{
    try { const s=localStorage.getItem('appSettings'); return s?{...DEF,...JSON.parse(s)}:DEF; } catch { return DEF; }
  });

  const G = THEMES[settings.theme]||THEMES.dark;
  const t = T[settings.lang]||T.en;
  const soundOn = settings.sound;

  useEffect(() => { document.body.style.background=G.bg; document.body.style.color=G.text; }, [G.bg,G.text]);

  const addToast = (msg, type='info') => {
    const id = Date.now();
    setToasts(prev=>[...prev,{id,msg,message:msg,type}]);
    setTimeout(()=>setToasts(prev=>prev.filter(tk=>tk.id!==id)),3500);
  };

  const addNotif = (msg, type='info') => {
    const id=Date.now(), time=new Date().toLocaleTimeString();
    setNotifs(prev=>[{id,message:msg,type,time},...prev].slice(0,20));
  };

  const addActivity = (msg, icon='⚡') => {
    const id=Date.now(), time=new Date().toLocaleTimeString();
    setActivities(prev=>[{id,message:msg,icon,time},...prev].slice(0,30));
  };

  useEffect(()=>{
    const isAdmin=user.role==='admin'||user.role==='hr';
    Promise.all([api.getTasks(),isAdmin?api.getEmployees():Promise.resolve({data:[]})])
      .then(([tr,er])=>{ setTasks(tr.data); setEmps(er.data); addActivity('System online','⚡'); addNotif('Welcome back! System ready','success'); })
      .catch(()=>addToast('Failed to load data','error'))
      .finally(()=>setLoading(false));
  },[]);

  // Keyboard shortcuts
  useEffect(()=>{
    const h=e=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
      if(e.ctrlKey&&e.key==='k'){e.preventDefault();setShowSearch(p=>!p);}
      if(e.key==='Escape'){setShowSearch(false);setShowNotifs(false);setMobileMenu(false);}
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[]);

  const navItems = NAV.filter(n=>!n.admin||user.role==='admin'||user.role==='hr');
  const unread = notifs.length;
  const pageProps = { user, emps, setEmps, tasks, setTasks, addToast, addActivity, G, t, s:settings, soundOn };

  return (
    <div style={{minHeight:'100vh',minHeight:'100dvh',background:G.bg,display:'flex',transition:'background 0.4s ease'}}>
      <style>{makeCSS(G, settings)}</style>

      {/* Ambient */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'8%',left:'4%',width:500,height:500,borderRadius:'50%',background:`radial-gradient(circle,${G.primary}05,transparent 70%)`,filter:'blur(70px)'}}/>
        <div style={{position:'absolute',bottom:'8%',right:'4%',width:400,height:400,borderRadius:'50%',background:`radial-gradient(circle,${G.secondary}05,transparent 70%)`,filter:'blur(70px)'}}/>
      </div>

      <Toasts toasts={toasts} G={G}/>
      <NotifsPanel show={showNotifs} onClose={()=>setShowNotifs(false)} notifs={notifs} clear={()=>setNotifs([])} G={G} t={t}/>

      {/* Global Search */}
      {showSearch&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)',zIndex:9995,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'70px 16px',animation:'overlayIn 0.2s ease'}} onClick={()=>setShowSearch(false)}>
          <div className="card" style={{width:'100%',maxWidth:480,animation:'modalIn 0.3s ease'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'11px 14px',borderBottom:`1px solid ${G.border}`,display:'flex',alignItems:'center',gap:9}}>
              <span style={{color:G.primary,fontSize:14}}>🔍</span>
              <input autoFocus placeholder={t.search} style={{flex:1,background:'transparent',border:'none',color:G.text,fontSize:14,outline:'none',fontFamily:"'DM Sans'"}}
                onChange={e=>{
                  const q=e.target.value.toLowerCase();
                  if(q.length<2) return;
                  const em=emps.find(ep=>ep.name?.toLowerCase().includes(q));
                  const tk=tasks.find(tk=>tk.title?.toLowerCase().includes(q));
                  if(em){setPage('employees');setShowSearch(false);}
                  else if(tk){setPage('tasks');setShowSearch(false);}
                }}/>
              <kbd style={{background:G.subtle,border:`1px solid ${G.border}`,borderRadius:4,padding:'1px 5px',color:G.muted,fontFamily:"'JetBrains Mono'",fontSize:8}}>ESC</kbd>
            </div>
            <div style={{padding:8}}>
              {[{icon:'🏠',label:t.dashboard,k:'dashboard'},{icon:'👥',label:t.employees,k:'employees'},{icon:'📋',label:t.tasks,k:'tasks'},{icon:'🗃️',label:t.kanban,k:'kanban'},{icon:'📅',label:t.calendar,k:'calendar'},{icon:'🤖',label:t.aiAssistant,k:'ai'},{icon:'⚙️',label:t.settings,k:'settings'}].map((item,i)=>(
                <button key={i} onClick={()=>{setPage(item.k);setShowSearch(false);snd('click',soundOn);}}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 11px',background:'transparent',border:'none',borderRadius:8,cursor:'pointer',color:G.text,transition:'all 0.2s',textAlign:'left',fontFamily:"'DM Sans'"}}
                  onMouseEnter={e=>e.currentTarget.style.background=`${G.primary}11`}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{fontSize:16}}>{item.icon}</span>
                  <span style={{fontSize:13,flex:1,fontWeight:500}}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE HEADER ── */}
      <div className="mob-header">
        <div className="gtxt" style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800}}>⚡ OnboardIQ</div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <button onClick={()=>setShowSearch(true)} style={{background:`${G.primary}15`,border:`1px solid ${G.primary}33`,color:G.primary,borderRadius:9,width:36,height:36,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center'}}>🔍</button>
          <button onClick={()=>setShowNotifs(true)} style={{background:`${G.primary}15`,border:`1px solid ${G.primary}33`,color:G.primary,borderRadius:9,width:36,height:36,cursor:'pointer',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
            🔔{unread>0&&<span style={{position:'absolute',top:-4,right:-4,background:G.red,color:'#fff',borderRadius:'50%',width:15,height:15,fontSize:8,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'JetBrains Mono'",fontWeight:700,border:`2px solid ${G.surface}`}}>{unread>9?'9+':unread}</span>}
          </button>
          <button onClick={()=>setMobileMenu(p=>!p)} style={{background:`${G.primary}15`,border:`1px solid ${G.primary}33`,borderRadius:9,width:36,height:36,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0,overflow:'hidden'}}>
            <Avt name={user.name||'U'} size={36} G={G}/>
          </button>
          <button onClick={onLogout} style={{background:`${G.red}15`,border:`1px solid ${G.red}33`,color:G.red,borderRadius:9,width:36,height:36,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>⏻</button>
        </div>
      </div>

      {/* Mobile Profile Dropdown */}
      {mobileMenu&&(
        <>
          <div style={{position:'fixed',top:60,right:12,zIndex:300,background:G.surface,border:`1px solid ${G.border}`,borderRadius:13,padding:14,minWidth:200,animation:'fadeUp 0.25s ease',boxShadow:`0 8px 32px rgba(0,0,0,0.5)`}}>
            <div style={{display:'flex',alignItems:'center',gap:10,paddingBottom:11,marginBottom:10,borderBottom:`1px solid ${G.border}`}}>
              <Avt name={user.name||'U'} size={38} G={G}/>
              <div>
                <div style={{fontWeight:700,fontSize:13,fontFamily:"'Syne',sans-serif"}}>{user.name}</div>
                <div style={{color:G.muted,fontSize:10,marginTop:1}}>{user.email}</div>
                <div style={{marginTop:3}}><Bdg label={user.role} color={G.primary}/></div>
              </div>
            </div>
            {[{icon:'⚙️',label:t.settings,k:'settings'},{icon:'📊',label:t.analytics,k:'analytics'},{icon:'📄',label:t.reports,k:'reports'},{icon:'🤖',label:t.aiAssistant,k:'ai'}].map((item,i)=>(
              <button key={i} onClick={()=>{setPage(item.k);setMobileMenu(false);snd('click',soundOn);}} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 7px',background:'transparent',border:'none',borderRadius:8,cursor:'pointer',color:G.text,fontSize:13,fontFamily:"'DM Sans'",fontWeight:500,transition:'all 0.2s',textAlign:'left'}}>
                <span style={{fontSize:16}}>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}
            <button onClick={onLogout} style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'9px 7px',background:`${G.red}11`,border:`1px solid ${G.red}22`,borderRadius:8,cursor:'pointer',color:G.red,fontSize:13,fontFamily:"'DM Sans'",fontWeight:600,marginTop:8,transition:'all 0.2s'}}>
              <span style={{fontSize:16}}>⏻</span><span>{t.logout}</span>
            </button>
          </div>
          <div style={{position:'fixed',inset:0,zIndex:299}} onClick={()=>setMobileMenu(false)}/>
        </>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="sidebar" style={{width:settings.compact?180:200,background:G.surface,borderRight:`1px solid ${G.border}`,display:'flex',flexDirection:'column',position:'fixed',top:0,bottom:0,left:0,zIndex:100,transition:'all 0.4s ease'}}>
        <div style={{padding:'16px 13px 13px',borderBottom:`1px solid ${G.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${G.primary}22,${G.secondary}22)`,border:`1px solid ${G.primary}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>⚡</div>
            <div>
              <div className="gtxt" style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,letterSpacing:-0.3}}>OnboardIQ</div>
              <div style={{color:G.muted,fontSize:9,fontFamily:"'JetBrains Mono'"}}>v3.0 pro</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{padding:'7px 9px',borderBottom:`1px solid ${G.border}`}}>
          <button onClick={()=>setShowSearch(true)} style={{width:'100%',display:'flex',alignItems:'center',gap:7,padding:'7px 10px',background:`${G.primary}08`,border:`1px solid ${G.border}`,borderRadius:8,color:G.muted,cursor:'pointer',fontSize:11,fontFamily:"'DM Sans'",transition:'all 0.2s'}}>
            <span>🔍</span><span style={{flex:1,textAlign:'left'}}>{t.search}</span>
            <kbd style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:3,padding:'1px 4px',color:G.primary,fontFamily:"'JetBrains Mono'",fontSize:7}}>⌘K</kbd>
          </button>
        </div>

        <nav style={{flex:1,padding:'9px 7px',overflow:'auto'}} className="thin-scroll">
          {/* Main */}
          <div style={{color:G.muted,fontSize:8,fontWeight:600,letterSpacing:1,padding:'8px 10px 4px',textTransform:'uppercase',fontFamily:"'JetBrains Mono'"}}>MAIN</div>
          {navItems.filter(n=>['dashboard','employees','tasks'].includes(n.key)).map(item=>(
            <button key={item.key} onClick={()=>{setPage(item.key);snd('click',soundOn);}} className={`nav-btn${page===item.key?' active':''}`}>
              <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{t[item.key]||item.key}</span>
            </button>
          ))}
          {/* Views */}
          <div style={{color:G.muted,fontSize:8,fontWeight:600,letterSpacing:1,padding:'12px 10px 4px',textTransform:'uppercase',fontFamily:"'JetBrains Mono'"}}>VIEWS</div>
          {navItems.filter(n=>['kanban','calendar'].includes(n.key)).map(item=>(
            <button key={item.key} onClick={()=>{setPage(item.key);snd('click',soundOn);}} className={`nav-btn${page===item.key?' active':''}`}>
              <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{t[item.key]||item.key}</span>
            </button>
          ))}
          {/* Insights */}
          <div style={{color:G.muted,fontSize:8,fontWeight:600,letterSpacing:1,padding:'12px 10px 4px',textTransform:'uppercase',fontFamily:"'JetBrains Mono'"}}>INSIGHTS</div>
          {navItems.filter(n=>['analytics','leaderboard','reports'].includes(n.key)).map(item=>(
            <button key={item.key} onClick={()=>{setPage(item.key);snd('click',soundOn);}} className={`nav-btn${page===item.key?' active':''}`}>
              <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{t[item.key]||item.key}</span>
            </button>
          ))}
          {/* Tools */}
          <div style={{color:G.muted,fontSize:8,fontWeight:600,letterSpacing:1,padding:'12px 10px 4px',textTransform:'uppercase',fontFamily:"'JetBrains Mono'"}}>TOOLS</div>
          {navItems.filter(n=>['ai','settings'].includes(n.key)).map(item=>(
            <button key={item.key} onClick={()=>{setPage(item.key);snd('click',soundOn);}} className={`nav-btn${page===item.key?' active':''}`}>
              <span style={{fontSize:15,flexShrink:0}}>{item.icon}</span>
              <span style={{flex:1}}>{t[item.key==='ai'?'aiAssistant':item.key]||item.key}</span>
              {item.key==='ai'&&<span style={{background:`${G.primary}22`,color:G.primary,fontSize:8,padding:'1px 5px',borderRadius:20,fontFamily:"'JetBrains Mono'",fontWeight:600}}>AI</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:'9px 7px',borderTop:`1px solid ${G.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:`${G.primary}06`,border:`1px solid ${G.border}`,borderRadius:10,marginBottom:6}}>
            <Avt name={user.name||'U'} size={26} G={G}/>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:"'Syne',sans-serif"}}>{user.name}</div>
              <div style={{color:G.muted,fontSize:9,textTransform:'capitalize',fontFamily:"'JetBrains Mono'"}}>{user.role}</div>
            </div>
          </div>
          <button onClick={()=>{setShowNotifs(!showNotifs);snd('click',soundOn);}} style={{width:'100%',background:`${G.primary}12`,color:G.primary,border:`1px solid ${G.primary}33`,borderRadius:9,padding:'7px',fontSize:10,cursor:'pointer',fontWeight:600,fontFamily:"'DM Sans'",marginBottom:5,position:'relative',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            🔔 {t.notifications}
            {unread>0&&<span style={{position:'absolute',top:-3,right:-3,background:G.red,color:'#fff',borderRadius:'50%',width:14,height:14,fontSize:8,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'JetBrains Mono'",fontWeight:700}}>{unread>9?'9+':unread}</span>}
          </button>
          <button onClick={onLogout} style={{width:'100%',background:`${G.red}12`,color:G.red,border:`1px solid ${G.red}33`,borderRadius:9,padding:'7px',fontSize:10,cursor:'pointer',fontWeight:600,fontFamily:"'DM Sans'",display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            ⏻ {t.logout}
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="main" style={{marginLeft:settings.compact?180:200,flex:1,padding:settings.compact?'20px 20px 36px':'24px 24px 40px',maxWidth:`calc(100vw - ${settings.compact?180:200}px)`,position:'relative',zIndex:1}}>
        {loading?(
          <div>
            <Skel h={28} r={8}/><div style={{height:14}}/>
            <div style={{display:'flex',gap:10,marginBottom:16}}>{[1,2,3,4].map(i=><Skel key={i} h={85} r={12}/>)}</div>
            <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:12}}><Skel h={260} r={14}/><Skel h={260} r={14}/></div>
          </div>
        ):(
          <>
            {page==='dashboard'&&<Dashboard {...pageProps} activities={activities}/>}
            {page==='employees'&&<Employees {...pageProps}/>}
            {page==='tasks'&&<Tasks {...pageProps}/>}
            {page==='kanban'&&<KanbanBoard tasks={tasks} setTasks={setTasks} addToast={addToast} G={G} t={t} s={settings} soundOn={soundOn}/>}
            {page==='analytics'&&<Analytics {...pageProps}/>}
            {page==='calendar'&&<CalendarView tasks={tasks} G={G} t={t} s={settings}/>}
            {page==='leaderboard'&&<Leaderboard emps={emps} tasks={tasks} G={G} t={t} s={settings}/>}
            {page==='reports'&&<Reports emps={emps} tasks={tasks} G={G} t={t} s={settings} addToast={addToast} soundOn={soundOn}/>}
            {page==='ai'&&<AIAssistant G={G} t={t} employees={emps} tasks={tasks}/>}
            {page==='settings'&&<Settings settings={settings} setSettings={setSettings} G={G} t={t} user={user} addToast={addToast}/>}
          </>
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mob-nav" style={{justifyContent:'space-around',alignItems:'center'}}>
        {[
          {key:'dashboard',icon:'🏠',label:t.dashboard},
          {key:'employees',icon:'👥',label:t.employees},
          {key:'tasks',icon:'📋',label:t.tasks},
          {key:'leaderboard',icon:'🏆',label:t.leaderboard},
          {key:'settings',icon:'⚙️',label:t.settings},
        ].map(item=>(
          <button key={item.key} onClick={()=>{setPage(item.key);snd('click',soundOn);setMobileMenu(false);}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'4px 8px',background:'transparent',border:'none',color:page===item.key?G.primary:G.muted,transition:'all 0.2s',cursor:'pointer',minWidth:50,minHeight:50,justifyContent:'center',position:'relative'}}>
            {page===item.key&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:20,height:2,borderRadius:2,background:G.primary,boxShadow:`0 0 6px ${G.primary}`}}/>}
            <span style={{fontSize:page===item.key?22:20,transition:'all 0.2s',transform:page===item.key?'scale(1.12)':'scale(1)'}}>{item.icon}</span>
            <span style={{fontSize:8,fontFamily:"'DM Sans'",fontWeight:page===item.key?600:400}}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(()=>{
    try { const s=localStorage.getItem('user'); return s?JSON.parse(s):null; } catch { return null; }
  });
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); snd('error'); setUser(null); };
  return user?<Layout user={user} onLogout={logout}/>:<Login onLogin={setUser}/>;
}
