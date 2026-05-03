import { useState, useEffect, useCallback, useRef } from "react";
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
  cyber: {
    name: "CYBER DARK", icon: "🌑",
    bg: "#000000", surface: "#0a0a0f", card: "#0d0d1a", border: "#1a1a2e",
    primary: "#00f5ff", secondary: "#bf00ff", accent: "#00ff41",
    orange: "#ffaa00", red: "#ff0040", text: "#e0e0ff", muted: "#444466",
    font: "'Orbitron', monospace", body: "'Rajdhani', sans-serif",
  },
  light: {
    name: "CLEAN LIGHT", icon: "☀️",
    bg: "#f0f4f8", surface: "#ffffff", card: "#ffffff", border: "#e2e8f0",
    primary: "#0ea5e9", secondary: "#8b5cf6", accent: "#22c55e",
    orange: "#f59e0b", red: "#ef4444", text: "#1e293b", muted: "#94a3b8",
    font: "'Orbitron', monospace", body: "'Rajdhani', sans-serif",
  },
  hacker: {
    name: "HACKER GREEN", icon: "💚",
    bg: "#000000", surface: "#001400", card: "#001a00", border: "#003300",
    primary: "#00ff41", secondary: "#00cc33", accent: "#00ff41",
    orange: "#88ff00", red: "#ff4400", text: "#00ff41", muted: "#005500",
    font: "'Courier New', monospace", body: "'Courier New', monospace",
  }
};

// ─── SOUND EFFECTS ────────────────────────────────────────────────────────────
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sounds = {
      success: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(523, ctx.currentTime);
        o.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        o.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.3, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        o.start(); o.stop(ctx.currentTime + 0.5);
      },
      deploy: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.start(); o.stop(ctx.currentTime + 0.3);
      },
      delete: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(300, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        o.start(); o.stop(ctx.currentTime + 0.3);
      },
      notification: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(880, ctx.currentTime);
        o.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        o.start(); o.stop(ctx.currentTime + 0.2);
      },
      click: () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(440, ctx.currentTime);
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        o.start(); o.stop(ctx.currentTime + 0.05);
      },
      mission: () => {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
          o.start(ctx.currentTime + i * 0.12);
          o.stop(ctx.currentTime + i * 0.12 + 0.3);
        });
      }
    };
    sounds[type]?.();
  } catch (e) {}
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const statusColor = (G) => ({ active: G.accent, onboarding: G.orange, inactive: G.red });
const priorityColor = (G) => ({ high: G.red, medium: G.orange, low: G.accent });
const taskStatusColor = (G) => ({ pending: G.muted, in_progress: G.primary, completed: G.accent, overdue: G.red });
const categoryIcon = { documentation:"📄", training:"📚", setup:"⚙️", meeting:"🤝", other:"📌" };

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const makeCss = (G) => `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${G.bg};color:${G.text};font-family:${G.body};}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:${G.bg};}
  ::-webkit-scrollbar-thumb{background:${G.primary}44;border-radius:2px;}
  @keyframes fadeUp{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
  @keyframes slideIn{from{transform:translateX(-20px);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes slideRight{from{transform:translateX(20px);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes glitch{0%,100%{text-shadow:2px 0 ${G.primary},-2px 0 ${G.secondary};}25%{text-shadow:-2px 0 ${G.primary},2px 0 ${G.secondary};transform:translateX(2px);}75%{text-shadow:2px 0 ${G.secondary},-2px 0 ${G.primary};transform:translateX(-2px);}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
  @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{box-shadow:0 0 5px ${G.primary}44;}50%{box-shadow:0 0 20px ${G.primary}88;}}
  @keyframes toast-in{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes matrix-rain{0%{transform:translateY(-100%);opacity:1;}100%{transform:translateY(100vh);opacity:0;}}
  @keyframes count{from{opacity:0;transform:scale(0.5);}to{opacity:1;transform:scale(1);}}
  @keyframes activity-in{from{transform:translateX(-10px);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes theme-switch{0%{filter:brightness(0);}100%{filter:brightness(1);}}
  .nav-btn:hover{background:${G.primary}11!important;color:${G.primary}!important;border-left-color:${G.primary}!important;}
  .nav-btn.active{background:${G.primary}15!important;color:${G.primary}!important;border-left-color:${G.primary}!important;}
  .game-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px ${G.primary}22!important;border-color:${G.primary}44!important;}
  .game-btn:hover{transform:scale(1.05);filter:brightness(1.2);}
  .game-btn:active{transform:scale(0.96);}
  .emp-card:hover{border-color:${G.primary}66!important;box-shadow:0 0 20px ${G.primary}22!important;}
  .theme-transition{animation:theme-switch 0.3s ease!important;}
  @media(max-width:768px){
    .sidebar{width:56px!important;}
    .sidebar .nav-label,.sidebar .logo-text,.sidebar .user-name{display:none!important;}
    .main-content{margin-left:56px!important;max-width:calc(100vw - 56px)!important;padding:12px!important;}
    .stat-grid{flex-direction:column!important;}
    .emp-grid{grid-template-columns:1fr!important;}
    .two-col{grid-template-columns:1fr!important;}
  }
`;

// ─── KEYBOARD SHORTCUTS HOOK ──────────────────────────────────────────────────
function useKeyboardShortcuts(setPage, setShowSearch, setShowShortcuts, user) {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const isAdmin = user?.role === 'admin' || user?.role === 'hr';
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setShowSearch(true); playSound('click'); }
      if (e.key === 'Escape') { setShowSearch(false); setShowShortcuts(false); }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) setShowShortcuts(p => !p);
      if (!e.ctrlKey && !e.altKey) {
        if (e.key === 'd') { setPage('dashboard'); playSound('click'); }
        if (e.key === 'a' && isAdmin) { setPage('employees'); playSound('click'); }
        if (e.key === 'm') { setPage('tasks'); playSound('click'); }
        if (e.key === 'l') { setPage('leaderboard'); playSound('click'); }
        if (e.key === 'r' && isAdmin) { setPage('reports'); playSound('click'); }
        if (e.key === 'n' && isAdmin) { setPage('analytics'); playSound('click'); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user]);
}

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────
function ParticleBackground({ G }) {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[...Array(12)].map((_,i)=>(
        <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,width:Math.random()>0.5?2:1,height:Math.random()>0.5?2:1,background:i%3===0?G.primary:i%3===1?G.secondary:G.accent,borderRadius:"50%",animation:`float ${3+Math.random()*4}s ease-in-out infinite`,animationDelay:`${Math.random()*4}s`,opacity:0.3+Math.random()*0.4}}/>
      ))}
    </div>
  );
}

function Toast({ toasts, G }) {
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:G.card,border:`1px solid ${t.type==="success"?G.accent:t.type==="error"?G.red:G.primary}`,borderRadius:8,padding:"10px 16px",color:G.text,fontSize:13,fontFamily:G.body,fontWeight:600,boxShadow:`0 0 20px ${t.type==="success"?G.accent:t.type==="error"?G.red:G.primary}44`,animation:"toast-in 0.3s ease",display:"flex",alignItems:"center",gap:10,minWidth:240,maxWidth:300}}>
          <span>{t.type==="success"?"✅":t.type==="error"?"❌":"⚡"}</span>
          <span style={{flex:1,fontSize:12}}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function MissionComplete({ show, onClose, empName, G }) {
  if (!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{textAlign:"center",animation:"fadeUp 0.4s ease",padding:20}}>
        <div style={{fontSize:72,animation:"float 2s ease-in-out infinite",marginBottom:12}}>🏆</div>
        <div style={{fontFamily:G.font,fontSize:32,fontWeight:900,color:G.accent,animation:"glitch 0.5s ease infinite",letterSpacing:4}}>MISSION COMPLETE!</div>
        {empName&&<div style={{color:G.primary,fontSize:16,fontFamily:G.body,marginTop:6,letterSpacing:2}}>{empName}</div>}
        <div style={{color:G.orange,fontSize:20,fontFamily:G.font,marginTop:6,letterSpacing:2}}>+ 100 XP EARNED</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>
          {["🎯","⭐","🔥","💥","✨","🎮","🏅","💎"].map((e,i)=>(
            <span key={i} style={{fontSize:22,animation:`float ${1+i*0.2}s ease-in-out infinite`,animationDelay:`${i*0.1}s`}}>{e}</span>
          ))}
        </div>
        <div style={{color:G.muted,fontSize:11,marginTop:16,fontFamily:G.body}}>Click anywhere to continue</div>
      </div>
    </div>
  );
}

function ConfirmPopup({ show, message, onConfirm, onCancel, G }) {
  if (!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:G.card,border:`1px solid ${G.red}`,borderRadius:16,padding:28,textAlign:"center",animation:"fadeUp 0.3s ease",boxShadow:`0 0 40px ${G.red}44`,maxWidth:360,width:"100%"}}>
        <div style={{fontSize:44,marginBottom:14}}>⚠️</div>
        <div style={{fontFamily:G.font,fontSize:15,color:G.red,fontWeight:700,marginBottom:8,letterSpacing:2}}>WARNING</div>
        <div style={{color:G.text,fontSize:13,fontFamily:G.body,marginBottom:20,lineHeight:1.6}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onConfirm} className="game-btn" style={{background:`linear-gradient(135deg,${G.red},#aa0030)`,color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontFamily:G.font,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>CONFIRM</button>
          <button onClick={onCancel} className="game-btn" style={{background:"transparent",color:G.muted,border:`1px solid ${G.muted}`,borderRadius:8,padding:"9px 22px",fontFamily:G.font,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

function NeonBadge({ label, color, G }) {
  return <span style={{background:color+"15",color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 7px",fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:G.font,whiteSpace:"nowrap"}}>{label}</span>;
}

function GlowInput({ placeholder, value, onChange, type="text", G }) {
  const [f,setF]=useState(false);
  return <input placeholder={placeholder} value={value} onChange={onChange} type={type} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:"100%",background:G.bg,border:`1px solid ${f?G.primary:G.border}`,borderRadius:8,padding:"10px 13px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,boxSizing:"border-box",transition:"all 0.3s",boxShadow:f?`0 0 12px ${G.primary}22`:"none"}}/>;
}

function GlowBtn({ children, onClick, color, G, style={}, size="md", disabled=false }) {
  const c = color || G.primary;
  const pad={sm:"5px 11px",md:"8px 16px",lg:"11px 0"};
  return <button onClick={()=>{if(!disabled){onClick?.();playSound('click');} }} disabled={disabled} className="game-btn" style={{background:`linear-gradient(135deg,${c}22,${c}11)`,color:disabled?G.muted:c,border:`1px solid ${disabled?G.muted:c}55`,borderRadius:8,padding:pad[size],fontFamily:G.font,fontSize:size==="sm"?9:10,fontWeight:700,cursor:disabled?"not-allowed":"pointer",letterSpacing:1,transition:"all 0.2s",width:size==="lg"?"100%":"auto",opacity:disabled?0.5:1,...style}}>{children}</button>;
}

function HexAvatar({ name, size=40, G }) {
  const colors=[G.primary,G.secondary,G.accent,G.orange,G.red];
  const c=colors[(name||"U").charCodeAt(0)%colors.length];
  return <div style={{width:size,height:size,background:`${c}22`,border:`2px solid ${c}55`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:c,fontWeight:900,fontSize:size*0.38,fontFamily:G.font,flexShrink:0,boxShadow:`0 0 8px ${c}22`}}>{(name||"U")[0]}</div>;
}

function NeonProgress({ value, G, height=6 }) {
  const color=value===100?G.accent:value>60?G.primary:value>30?G.orange:G.red;
  return <div style={{height,background:G.bg,borderRadius:3,overflow:"hidden",border:`1px solid ${G.border}`}}><div style={{height:"100%",width:(value||0)+"%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:3,transition:"width 1s ease",boxShadow:`0 0 5px ${color}`}}/></div>;
}

function Loader({ G }) {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}><div style={{width:32,height:32,border:`3px solid ${G.primary}33`,borderTopColor:G.primary,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>;
}

function SelectField({ value, onChange, children, G }) {
  return <select value={value} onChange={onChange} style={{background:G.bg,border:`1px solid ${G.border}`,borderRadius:8,padding:"9px 11px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,width:"100%"}}>{children}</select>;
}

function SectionHeader({ title, color, icon, G }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
      <div style={{width:4,height:26,background:color,boxShadow:`0 0 8px ${color}`,borderRadius:2}}/>
      <h1 style={{fontFamily:G.font,color,fontSize:17,fontWeight:900,letterSpacing:3}}>{icon} {title}</h1>
    </div>
  );
}

// ─── THEME SWITCHER ───────────────────────────────────────────────────────────
function ThemeSwitcher({ currentTheme, setCurrentTheme, G }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} className="game-btn" style={{background:`${G.primary}15`,color:G.primary,border:`1px solid ${G.primary}33`,borderRadius:8,padding:"7px 10px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:G.font,letterSpacing:1,display:"flex",alignItems:"center",gap:6,width:"100%",justifyContent:"center",marginBottom:6}}>
        {THEMES[currentTheme].icon} <span className="nav-label">{THEMES[currentTheme].name.split(" ")[0]}</span>
      </button>
      {open && (
        <div style={{position:"absolute",bottom:"100%",left:0,right:0,background:G.surface,border:`1px solid ${G.border}`,borderRadius:8,overflow:"hidden",marginBottom:4,zIndex:200}}>
          {Object.entries(THEMES).map(([key,theme])=>(
            <button key={key} onClick={()=>{setCurrentTheme(key);setOpen(false);playSound('click');}}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:currentTheme===key?`${G.primary}15`:"transparent",color:currentTheme===key?G.primary:G.muted,border:"none",cursor:"pointer",fontSize:10,fontFamily:G.font,fontWeight:700,letterSpacing:1,transition:"all 0.2s"}}>
              <span>{theme.icon}</span>
              <span className="nav-label">{theme.name}</span>
              {currentTheme===key&&<span style={{marginLeft:"auto",color:G.accent}}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KEYBOARD SHORTCUTS PANEL ─────────────────────────────────────────────────
function ShortcutsPanel({ show, onClose, G }) {
  if (!show) return null;
  const shortcuts = [
    { key:"D", desc:"Dashboard" },
    { key:"A", desc:"Agents (Admin)" },
    { key:"M", desc:"Missions" },
    { key:"L", desc:"Leaderboard" },
    { key:"N", desc:"Analytics (Admin)" },
    { key:"R", desc:"Reports (Admin)" },
    { key:"Ctrl+K", desc:"Global Search" },
    { key:"?", desc:"Show Shortcuts" },
    { key:"ESC", desc:"Close panels" },
  ];
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:9996,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:G.card,border:`1px solid ${G.primary}44`,borderRadius:16,padding:28,maxWidth:380,width:"100%",animation:"fadeUp 0.3s ease",boxShadow:`0 0 40px ${G.primary}22`}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:G.font,color:G.primary,fontSize:14,fontWeight:700,letterSpacing:2}}>⌨️ KEYBOARD SHORTCUTS</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:G.muted,cursor:"pointer",fontSize:18,fontFamily:"inherit"}}>×</button>
        </div>
        {shortcuts.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${G.border}`}}>
            <span style={{color:G.text,fontSize:13,fontFamily:G.body}}>{s.desc}</span>
            <kbd style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:6,padding:"3px 8px",color:G.primary,fontFamily:G.font,fontSize:10,fontWeight:700,letterSpacing:1}}>{s.key}</kbd>
          </div>
        ))}
        <div style={{marginTop:16,color:G.muted,fontSize:11,textAlign:"center",fontFamily:G.body}}>Press ESC or click outside to close</div>
      </div>
    </div>
  );
}

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────
function GlobalSearch({ show, onClose, employees, tasks, setPage, G }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) { setTimeout(()=>inputRef.current?.focus(), 100); setQuery(""); }
  }, [show]);

  if (!show) return null;

  const results = query.length > 1 ? [
    ...employees.filter(e=>e.name?.toLowerCase().includes(query.toLowerCase())||e.department?.toLowerCase().includes(query.toLowerCase())).map(e=>({type:"agent",label:e.name,sub:e.department,icon:"👤",action:"employees"})),
    ...tasks.filter(t=>t.title?.toLowerCase().includes(query.toLowerCase())||t.status?.includes(query.toLowerCase())).map(t=>({type:"mission",label:t.title,sub:t.status.replace("_"," "),icon:categoryIcon[t.category],action:"tasks"})),
  ].slice(0,8) : [];

  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:9995,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"80px 20px"}} onClick={onClose}>
      <div style={{background:G.card,border:`1px solid ${G.primary}55`,borderRadius:16,width:"100%",maxWidth:520,animation:"fadeUp 0.2s ease",boxShadow:`0 0 40px ${G.primary}22`}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${G.border}`,display:"flex",alignItems:"center",gap:10}}>
          <span style={{color:G.primary,fontSize:18}}>🔍</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search agents, missions, departments..." style={{flex:1,background:"transparent",border:"none",color:G.text,fontSize:15,outline:"none",fontFamily:G.body}}/>
          <kbd style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"2px 6px",color:G.muted,fontFamily:G.font,fontSize:9}}>ESC</kbd>
        </div>
        {results.length>0?(
          <div style={{padding:8}}>
            {results.map((r,i)=>(
              <button key={i} onClick={()=>{setPage(r.action);onClose();playSound('click');}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"transparent",border:"none",borderRadius:8,cursor:"pointer",textAlign:"left",transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.background=`${G.primary}11`}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{fontSize:18}}>{r.icon}</span>
                <div style={{flex:1}}>
                  <div style={{color:G.text,fontSize:13,fontWeight:600,fontFamily:G.body}}>{r.label}</div>
                  <div style={{color:G.muted,fontSize:11,fontFamily:G.body}}>{r.sub}</div>
                </div>
                <NeonBadge label={r.type} color={r.type==="agent"?G.primary:G.orange} G={G}/>
              </button>
            ))}
          </div>
        ):query.length>1?(
          <div style={{padding:32,textAlign:"center",color:G.muted,fontFamily:G.font,fontSize:11,letterSpacing:2}}>NO RESULTS FOUND</div>
        ):(
          <div style={{padding:20}}>
            <div style={{color:G.muted,fontSize:11,fontFamily:G.font,letterSpacing:2,marginBottom:10}}>QUICK NAVIGATE</div>
            {[
              {icon:"🏠",label:"Dashboard",key:"D",action:"dashboard"},
              {icon:"👥",label:"Agents",key:"A",action:"employees"},
              {icon:"📋",label:"Missions",key:"M",action:"tasks"},
              {icon:"🏆",label:"Leaderboard",key:"L",action:"leaderboard"},
            ].map((item,i)=>(
              <button key={i} onClick={()=>{setPage(item.action);onClose();playSound('click');}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"transparent",border:"none",borderRadius:8,cursor:"pointer",marginBottom:2,textAlign:"left"}}
                onMouseEnter={e=>e.currentTarget.style.background=`${G.primary}11`}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{fontSize:16}}>{item.icon}</span>
                <span style={{color:G.text,fontSize:13,fontFamily:G.body,flex:1,fontWeight:600}}>{item.label}</span>
                <kbd style={{background:G.surface,border:`1px solid ${G.border}`,borderRadius:5,padding:"2px 6px",color:G.primary,fontFamily:G.font,fontSize:9}}>{item.key}</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
function ActivityFeed({ activities, G }) {
  const activityIcon = { task_complete:"✅", task_start:"▶️", task_create:"📋", employee_add:"👤", employee_remove:"🗑️", workflow_assign:"🔄", login:"🔐", system:"⚡" };
  const activityColor = { task_complete: G.accent, task_start: G.primary, task_create: G.orange, employee_add: G.accent, employee_remove: G.red, workflow_assign: G.secondary, login: G.primary, system: G.muted };

  return (
    <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <div style={{width:3,height:16,background:G.orange}}/>
        <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>ACTIVITY FEED</h2>
        <div style={{marginLeft:"auto",background:`${G.accent}15`,color:G.accent,border:`1px solid ${G.accent}33`,borderRadius:10,padding:"2px 8px",fontSize:9,fontFamily:G.font,fontWeight:700}}>LIVE</div>
      </div>
      <div style={{maxHeight:300,overflow:"auto"}}>
        {activities.length===0?(
          <div style={{color:G.muted,textAlign:"center",padding:24,fontFamily:G.font,fontSize:11,letterSpacing:2}}>NO ACTIVITY YET</div>
        ):activities.map((a,i)=>(
          <div key={a.id} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:`1px solid ${G.border}`,animation:`activity-in 0.3s ease ${i*0.05}s both`}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`${activityColor[a.type]||G.primary}15`,border:`1px solid ${activityColor[a.type]||G.primary}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{activityIcon[a.type]||"⚡"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:G.text,fontSize:12,fontFamily:G.body,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.message}</div>
              <div style={{color:G.muted,fontSize:10,fontFamily:G.body,marginTop:2}}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS PANEL ──────────────────────────────────────────────────────
function NotificationsPanel({ show, onClose, notifications, clearAll, G }) {
  if (!show) return null;
  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:300,background:G.surface,border:`1px solid ${G.border}`,borderLeft:`1px solid ${G.primary}33`,zIndex:200,display:"flex",flexDirection:"column",animation:"slideRight 0.3s ease",boxShadow:`-4px 0 20px ${G.primary}11`}}>
      <div style={{padding:"18px 14px",borderBottom:`1px solid ${G.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:3,height:18,background:G.primary}}/>
          <h2 style={{fontFamily:G.font,color:G.primary,fontSize:12,fontWeight:700,letterSpacing:2}}>NOTIFICATIONS</h2>
        </div>
        <div style={{display:"flex",gap:6}}>
          {notifications.length>0&&<GlowBtn size="sm" color={G.red} G={G} onClick={clearAll}>CLEAR</GlowBtn>}
          <button onClick={onClose} style={{background:`${G.red}15`,border:`1px solid ${G.red}33`,color:G.red,borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:10}}>
        {notifications.length===0?(
          <div style={{textAlign:"center",padding:36,color:G.muted}}>
            <div style={{fontSize:36,marginBottom:10}}>🔔</div>
            <div style={{fontFamily:G.font,fontSize:10,letterSpacing:2}}>NO NOTIFICATIONS</div>
          </div>
        ):notifications.map((n,i)=>(
          <div key={n.id} style={{background:G.card,border:`1px solid ${n.type==="success"?G.accent:n.type==="error"?G.red:G.primary}22`,borderRadius:8,padding:"10px 12px",marginBottom:6,animation:`activity-in 0.3s ease ${i*0.05}s both`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{fontSize:14}}>{n.type==="success"?"✅":n.type==="error"?"❌":"⚡"}</span>
              <span style={{color:n.type==="success"?G.accent:n.type==="error"?G.red:G.primary,fontSize:9,fontFamily:G.font,fontWeight:700,letterSpacing:1}}>{n.type.toUpperCase()}</span>
              <span style={{color:G.muted,fontSize:9,fontFamily:G.body,marginLeft:"auto"}}>{n.time}</span>
            </div>
            <div style={{color:G.text,fontSize:12,fontFamily:G.body}}>{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────
function AnalyticsPage({ employees, tasks, G }) {
  const sC=statusColor(G), tC=taskStatusColor(G);
  const completedByEmp = employees.map(emp => ({
    name: emp.name?.split(" ")[0]||"?",
    progress: emp.onboardingProgress||0,
    completed: tasks.filter(t=>t.assignedTo?._id===emp._id&&t.status==="completed").length,
    total: tasks.filter(t=>t.assignedTo?._id===emp._id).length,
  }));
  const total = tasks.length||1;
  const rate = Math.round((tasks.filter(t=>t.status==="completed").length/total)*100);

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="ANALYTICS" color={G.secondary} icon="📊" G={G}/>
      <div className="stat-grid" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
        {[
          {icon:"👥",label:"Total Agents",value:employees.length,color:G.primary},
          {icon:"📋",label:"Total Tasks",value:tasks.length,color:G.orange},
          {icon:"✅",label:"Completed",value:tasks.filter(t=>t.status==="completed").length,color:G.accent},
          {icon:"🎯",label:"Success Rate",value:rate+"%",color:G.secondary},
        ].map((s,i)=>(
          <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"14px 18px",flex:1,minWidth:110,transition:"all 0.3s",animation:`fadeUp 0.5s ease ${i*0.1}s both`}}>
            <div style={{fontSize:22,marginBottom:5}}>{s.icon}</div>
            <div style={{fontSize:24,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
            <div style={{color:G.muted,fontSize:10,marginTop:2,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:3,height:16,background:G.primary}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>AGENT PERFORMANCE</h2>
        </div>
        {completedByEmp.length===0?<div style={{color:G.muted,textAlign:"center",padding:20,fontFamily:G.font,fontSize:11}}>NO DATA</div>:
          completedByEmp.map((emp,i)=>(
            <div key={i} style={{marginBottom:14,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:G.text,fontSize:13,fontFamily:G.body,fontWeight:600}}>{emp.name}</span>
                <span style={{color:G.primary,fontSize:11,fontFamily:G.font}}>{emp.completed}/{emp.total} · {emp.progress}%</span>
              </div>
              <div style={{height:18,background:G.bg,borderRadius:4,overflow:"hidden",border:`1px solid ${G.border}`,position:"relative"}}>
                <div style={{height:"100%",width:emp.progress+"%",background:`linear-gradient(90deg,${G.primary}88,${G.secondary})`,borderRadius:4,transition:"width 1s ease",display:"flex",alignItems:"center",paddingLeft:8}}>
                  {emp.progress>15&&<span style={{color:"#fff",fontSize:9,fontFamily:G.font,fontWeight:700}}>{emp.progress}%</span>}
                </div>
              </div>
            </div>
          ))
        }
      </div>
      <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:3,height:14,background:G.orange}}/>
            <h2 style={{fontFamily:G.font,color:G.text,fontSize:11,fontWeight:700,letterSpacing:2}}>TASK STATUS</h2>
          </div>
          {["pending","in_progress","completed"].map((s,i)=>{
            const count=tasks.filter(t=>t.status===s).length;
            return (
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{color:tC[s],fontSize:11,fontFamily:G.body,fontWeight:600}}>{s.replace("_"," ")}</span>
                  <span style={{color:G.text,fontSize:11,fontFamily:G.font}}>{count}</span>
                </div>
                <div style={{height:6,background:G.bg,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(count/total)*100}%`,background:tC[s],borderRadius:3,transition:"width 1s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:3,height:14,background:G.accent}}/>
            <h2 style={{fontFamily:G.font,color:G.text,fontSize:11,fontWeight:700,letterSpacing:2}}>BY CATEGORY</h2>
          </div>
          {Object.entries(tasks.reduce((a,t)=>{a[t.category]=(a[t.category]||0)+1;return a;},{})).map(([cat,count],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:14}}>{categoryIcon[cat]||"📌"}</span>
              <div style={{flex:1}}>
                <div style={{height:6,background:G.bg,borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(count/total)*100}%`,background:G.secondary,borderRadius:3}}/>
                </div>
              </div>
              <span style={{color:G.text,fontSize:10,fontFamily:G.font,minWidth:16}}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardPage({ employees, tasks, G }) {
  const ranked = employees.map(emp => {
    const et = tasks.filter(t=>t.assignedTo?._id===emp._id);
    const done = et.filter(t=>t.status==="completed").length;
    const xp = done*100+(emp.onboardingProgress||0);
    const rank = xp>800?"LEGEND":xp>500?"ELITE":xp>200?"VETERAN":"ROOKIE";
    const rc = xp>800?G.orange:xp>500?G.secondary:xp>200?G.primary:G.accent;
    return {...emp,xp,done,total:et.length,rank,rc};
  }).sort((a,b)=>b.xp-a.xp);
  const medals=["🥇","🥈","🥉"];

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="LEADERBOARD" color={G.orange} icon="🏆" G={G}/>
      {ranked.length>=3&&(
        <div style={{display:"flex",gap:10,marginBottom:20,alignItems:"flex-end",justifyContent:"center",flexWrap:"wrap"}}>
          {[ranked[1],ranked[0],ranked[2]].map((emp,i)=>{
            const heights=[140,180,120];
            const pos=[2,1,3];
            return emp?(
              <div key={emp._id} style={{flex:1,minWidth:90,maxWidth:140,textAlign:"center",animation:`fadeUp 0.5s ease ${i*0.15}s both`}}>
                <div style={{fontSize:22,marginBottom:6}}>{medals[pos[i]-1]}</div>
                <HexAvatar name={emp.name} size={40} G={G}/>
                <div style={{color:G.text,fontSize:11,fontWeight:700,fontFamily:G.body,marginTop:6,marginBottom:4}}>{emp.name?.split(" ")[0]}</div>
                <NeonBadge label={emp.rank} color={emp.rc} G={G}/>
                <div style={{height:heights[i],background:`linear-gradient(180deg,${emp.rc}33,${emp.rc}11)`,border:`1px solid ${emp.rc}44`,borderRadius:"8px 8px 0 0",marginTop:6,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                  <div style={{color:emp.rc,fontFamily:G.font,fontSize:16,fontWeight:900}}>{emp.xp}</div>
                  <div style={{color:G.muted,fontSize:9,fontFamily:G.font}}>XP</div>
                </div>
              </div>
            ):null;
          })}
        </div>
      )}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{width:3,height:14,background:G.orange}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>FULL RANKINGS</h2>
        </div>
        {ranked.length===0?<div style={{color:G.muted,textAlign:"center",padding:32,fontFamily:G.font,fontSize:11,letterSpacing:2}}>NO AGENTS YET</div>:
          ranked.map((emp,i)=>(
            <div key={emp._id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:i===0?`${G.orange}08`:`${G.bg}`,border:`1px solid ${i===0?G.orange+"33":G.border}`,borderRadius:10,marginBottom:6,animation:`fadeUp 0.4s ease ${i*0.08}s both`,transition:"all 0.3s"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:`${i<3?[G.orange,G.muted,G.primary][i]:G.border}22`,border:`1px solid ${i<3?[G.orange,G.muted,G.primary][i]:G.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.font,fontSize:10,fontWeight:900,color:i<3?[G.orange,G.muted,G.primary][i]:G.muted,flexShrink:0}}>
                {i<3?medals[i]:i+1}
              </div>
              <HexAvatar name={emp.name||"U"} size={34} G={G}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{color:G.text,fontWeight:700,fontSize:13,fontFamily:G.body}}>{emp.name}</span>
                  <NeonBadge label={emp.rank} color={emp.rc} G={G}/>
                </div>
                <NeonProgress value={emp.onboardingProgress||0} G={G} height={4}/>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{color:emp.rc,fontWeight:900,fontSize:16,fontFamily:G.font}}>{emp.xp}</div>
                <div style={{color:G.muted,fontSize:9,fontFamily:G.font}}>XP</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function ReportsPage({ employees, tasks, G }) {
  const [selected,setSelected]=useState("");
  const [generating,setGenerating]=useState(false);

  const generate = () => {
    if(!selected) return;
    setGenerating(true);
    playSound('deploy');
    const emp=employees.find(e=>e._id===selected);
    const et=tasks.filter(t=>t.assignedTo?._id===selected);
    const done=et.filter(t=>t.status==="completed");
    const pending=et.filter(t=>t.status==="pending");
    const ip=et.filter(t=>t.status==="in_progress");
    const xp=done.length*100+(emp?.onboardingProgress||0);
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Report - ${emp?.name}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{background:#000;color:#e0e0ff;font-family:'Rajdhani',sans-serif;padding:40px;}
.header{text-align:center;padding:30px;background:linear-gradient(135deg,#00f5ff11,#bf00ff11);border:1px solid #00f5ff33;border-radius:16px;margin-bottom:30px;}
.logo{font-family:'Orbitron',monospace;font-size:28px;font-weight:900;color:#00f5ff;letter-spacing:4px;}
.name{font-family:'Orbitron',monospace;font-size:20px;color:#e0e0ff;margin-top:14px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
.stat{background:#0d0d1a;border-radius:10px;padding:16px;text-align:center;}
.sv{font-family:'Orbitron',monospace;font-size:26px;font-weight:900;}
.sl{color:#444466;font-size:11px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;}
.section{background:#0d0d1a;border:1px solid #1a1a2e;border-radius:12px;padding:20px;margin-bottom:18px;}
.st{font-family:'Orbitron',monospace;font-size:11px;color:#00f5ff;font-weight:700;letter-spacing:2px;margin-bottom:14px;padding-left:10px;border-left:3px solid #00f5ff;}
.task{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #1a1a2e;}
.badge{display:inline-block;padding:3px 8px;border-radius:4px;font-size:9px;font-weight:700;font-family:'Orbitron',monospace;letter-spacing:1px;}
.footer{text-align:center;margin-top:32px;color:#444466;font-size:10px;font-family:'Orbitron',monospace;letter-spacing:2px;}
</style></head><body>
<div class="header">
<div class="logo">ONBOARD<span style="color:#bf00ff">IQ</span></div>
<div style="color:#444466;font-family:'Orbitron',monospace;font-size:10px;letter-spacing:3px;margin-top:5px">SMART EMPLOYEE ONBOARDING SYSTEM</div>
<div class="name">${emp?.name?.toUpperCase()}</div>
<div style="color:#64748b;font-size:14px;margin-top:5px">${emp?.position||""} · ${emp?.department||""}</div>
<div style="margin-top:10px">
<span class="badge" style="background:#00ff4115;color:#00ff41;border:1px solid #00ff4133">${emp?.status?.toUpperCase()||"ONBOARDING"}</span>
<span class="badge" style="background:#00f5ff15;color:#00f5ff;border:1px solid #00f5ff33;margin-left:8px">${xp} XP</span>
</div></div>
<div class="stats">
<div class="stat" style="border:1px solid #00f5ff33"><div class="sv" style="color:#00f5ff">${emp?.onboardingProgress||0}%</div><div class="sl">Progress</div></div>
<div class="stat" style="border:1px solid #00ff4133"><div class="sv" style="color:#00ff41">${done.length}</div><div class="sl">Completed</div></div>
<div class="stat" style="border:1px solid #ffaa0033"><div class="sv" style="color:#ffaa00">${ip.length}</div><div class="sl">Active</div></div>
<div class="stat" style="border:1px solid #66666633"><div class="sv" style="color:#666">${pending.length}</div><div class="sl">Pending</div></div>
</div>
<div class="section"><div class="st">COMPLETED MISSIONS (${done.length})</div>
${done.length===0?'<div style="color:#444466;text-align:center;padding:14px;font-size:12px">NONE YET</div>':
done.map(t=>`<div class="task"><span style="font-size:16px">${categoryIcon[t.category]||"📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:13px">${t.title}</div><div style="color:#444466;font-size:11px">${t.description||""}</div></div><span class="badge" style="background:#00ff4115;color:#00ff41">DONE ✓</span></div>`).join("")}
</div>
<div class="section"><div class="st">PENDING MISSIONS (${pending.length+ip.length})</div>
${[...ip,...pending].length===0?'<div style="color:#444466;text-align:center;padding:14px;font-size:12px">ALL DONE!</div>':
[...ip,...pending].map(t=>`<div class="task"><span style="font-size:16px">${categoryIcon[t.category]||"📌"}</span><div style="flex:1"><div style="font-weight:600;font-size:13px">${t.title}</div><div style="color:#444466;font-size:11px">Due: ${t.dueDate?.split("T")[0]||"No deadline"}</div></div><span class="badge" style="background:${t.status==="in_progress"?"#00f5ff":"#666"}15;color:${t.status==="in_progress"?"#00f5ff":"#666"}">${t.status.replace("_"," ").toUpperCase()}</span></div>`).join("")}
</div>
<div class="footer">GENERATED BY ONBOARDIQ · ${new Date().toLocaleDateString()} · CONFIDENTIAL</div>
</body></html>`;
    setTimeout(()=>{
      const blob=new Blob([html],{type:'text/html'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download=`${emp?.name?.replace(" ","_")}_Report.html`; a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
      playSound('success');
    },1200);
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="REPORTS" color={G.accent} icon="📄" G={G}/>
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:3,height:14,background:G.accent}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>GENERATE AGENT REPORT</h2>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{color:G.muted,fontSize:10,display:"block",marginBottom:6,fontFamily:G.font,letterSpacing:2}}>SELECT AGENT</label>
          <SelectField value={selected} onChange={e=>setSelected(e.target.value)} G={G}>
            <option value="">-- Select Agent --</option>
            {employees.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
          </SelectField>
        </div>
        {selected&&(()=>{
          const emp=employees.find(e=>e._id===selected);
          const et=tasks.filter(t=>t.assignedTo?._id===selected);
          return (
            <div style={{background:G.bg,border:`1px solid ${G.border}`,borderRadius:10,padding:14,marginBottom:14,animation:"fadeUp 0.3s ease"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <HexAvatar name={emp?.name||"U"} size={44} G={G}/>
                <div style={{flex:1}}>
                  <div style={{color:G.text,fontWeight:700,fontSize:14,fontFamily:G.body}}>{emp?.name}</div>
                  <div style={{color:G.muted,fontSize:11,fontFamily:G.body,marginBottom:8}}>{emp?.position} · {emp?.department}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <NeonBadge label={`${emp?.onboardingProgress||0}%`} color={G.primary} G={G}/>
                    <NeonBadge label={`${et.filter(t=>t.status==="completed").length} done`} color={G.accent} G={G}/>
                    <NeonBadge label={`${et.length} total`} color={G.orange} G={G}/>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        <GlowBtn color={G.accent} size="lg" G={G} onClick={generate} disabled={!selected||generating} style={{borderRadius:10}}>
          {generating?"⏳ GENERATING REPORT...":"📄 DOWNLOAD REPORT"}
        </GlowBtn>
        <div style={{color:G.muted,fontSize:10,marginTop:10,fontFamily:G.body,textAlign:"center"}}>Downloads as HTML — open in browser to print as PDF</div>
      </div>
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{width:3,height:14,background:G.primary}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>ALL AGENTS</h2>
        </div>
        {employees.length===0?<div style={{color:G.muted,textAlign:"center",padding:20,fontFamily:G.font,fontSize:11}}>NO AGENTS</div>:
          employees.map((emp,i)=>{
            const et=tasks.filter(t=>t.assignedTo?._id===emp._id);
            return (
              <div key={emp._id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:G.bg,border:`1px solid ${G.border}`,borderRadius:10,marginBottom:6,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                <HexAvatar name={emp.name||"U"} size={32} G={G}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:G.text,fontWeight:700,fontSize:12,fontFamily:G.body}}>{emp.name}</div>
                  <NeonProgress value={emp.onboardingProgress||0} G={G} height={4}/>
                </div>
                <div style={{display:"flex",gap:5}}>
                  <NeonBadge label={`${emp.onboardingProgress||0}%`} color={G.primary} G={G}/>
                  <NeonBadge label={`${et.filter(t=>t.status==="completed").length}/${et.length}`} color={G.accent} G={G}/>
                </div>
                <GlowBtn size="sm" color={G.accent} G={G} onClick={()=>{setSelected(emp._id);}}>📄</GlowBtn>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ user, employees, tasks, activities, G }) {
  const isAdmin=user.role==="admin"||user.role==="hr";
  const myTasks=tasks.filter(t=>t.assignedTo?._id===user._id);
  const tC=taskStatusColor(G), pC=priorityColor(G), sC=statusColor(G);

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title={isAdmin?"COMMAND CENTER":`WELCOME, ${user.name?.split(" ")[0]?.toUpperCase()}`} color={G.primary} icon="🏠" G={G}/>
      {isAdmin?(
        <>
          <div className="stat-grid" style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}}>
            {[
              {icon:"👥",label:"Total Agents",value:employees.length,color:G.primary},
              {icon:"🔄",label:"Training",value:employees.filter(e=>e.status==="onboarding").length,color:G.orange},
              {icon:"✅",label:"Active",value:employees.filter(e=>e.status==="active").length,color:G.accent},
              {icon:"📋",label:"Pending",value:tasks.filter(t=>t.status==="pending").length,color:G.red},
              {icon:"🏆",label:"Done",value:tasks.filter(t=>t.status==="completed").length,color:G.secondary},
            ].map((s,i)=>(
              <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"14px 16px",flex:1,minWidth:100,transition:"all 0.3s",animation:`fadeUp 0.5s ease ${i*0.1}s both`}}>
                <div style={{fontSize:20,marginBottom:5}}>{s.icon}</div>
                <div style={{fontSize:22,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
                <div style={{color:G.muted,fontSize:9,marginTop:2,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:3,height:14,background:G.secondary}}/>
                <h2 style={{fontFamily:G.font,color:G.text,fontSize:11,fontWeight:700,letterSpacing:2}}>AGENT PROGRESS</h2>
              </div>
              {employees.length===0?<div style={{color:G.muted,textAlign:"center",padding:16,fontFamily:G.font,fontSize:10}}>NO AGENTS</div>:
                employees.slice(0,4).map((emp,i)=>(
                  <div key={emp._id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
                    <HexAvatar name={emp.name} size={32} G={G}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:G.text,fontSize:12,fontWeight:700,fontFamily:G.body,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.name}</div>
                      <NeonProgress value={emp.onboardingProgress||0} G={G} height={4}/>
                    </div>
                    <span style={{color:G.primary,fontSize:11,fontFamily:G.font,fontWeight:900,flexShrink:0}}>{emp.onboardingProgress||0}%</span>
                  </div>
                ))
              }
            </div>
            <ActivityFeed activities={activities} G={G}/>
          </div>
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{width:3,height:14,background:G.orange}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:11,fontWeight:700,letterSpacing:2}}>RECENT MISSIONS</h2>
            </div>
            {tasks.slice(0,5).map((t,i)=>(
              <div key={t._id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${G.border}`}}>
                <span style={{fontSize:16}}>{categoryIcon[t.category]}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:G.text,fontSize:12,fontWeight:600,fontFamily:G.body,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                  <div style={{color:G.muted,fontSize:10,fontFamily:G.body}}>{t.assignedTo?.name||"Unknown"}</div>
                </div>
                <NeonBadge label={t.status.replace("_"," ")} color={tC[t.status]} G={G}/>
              </div>
            ))}
          </div>
        </>
      ):(
        <>
          <div style={{background:`linear-gradient(135deg,${G.primary}08,${G.secondary}08)`,border:`1px solid ${G.primary}33`,borderRadius:12,padding:18,marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <HexAvatar name={user.name||"U"} size={52} G={G}/>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:G.font,color:G.text,fontSize:15,fontWeight:900,letterSpacing:2}}>{user.name?.toUpperCase()}</h2>
                <div style={{color:G.muted,fontSize:12,marginBottom:10,fontFamily:G.body}}>{user.department} · {user.position}</div>
                <NeonProgress value={user.onboardingProgress||0} G={G}/>
                <div style={{color:G.primary,fontSize:10,marginTop:4,fontFamily:G.font,letterSpacing:1}}>{user.onboardingProgress||0}% MISSION PROGRESS</div>
              </div>
            </div>
          </div>
          <div className="stat-grid" style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
            {[
              {icon:"✅",label:"Completed",value:myTasks.filter(t=>t.status==="completed").length,color:G.accent},
              {icon:"⚡",label:"Active",value:myTasks.filter(t=>t.status==="in_progress").length,color:G.primary},
              {icon:"📋",label:"Pending",value:myTasks.filter(t=>t.status==="pending").length,color:G.orange},
            ].map((s,i)=>(
              <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"14px 16px",flex:1,minWidth:90,transition:"all 0.3s"}}>
                <div style={{fontSize:20,marginBottom:5}}>{s.icon}</div>
                <div style={{fontSize:22,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
                <div style={{color:G.muted,fontSize:9,marginTop:2,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{width:3,height:14,background:G.primary}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:11,fontWeight:700,letterSpacing:2}}>MY MISSIONS</h2>
            </div>
            {myTasks.length===0?<div style={{color:G.muted,textAlign:"center",padding:20,fontFamily:G.font,fontSize:10,letterSpacing:2}}>NO MISSIONS YET</div>:
              myTasks.map((t,i)=>(
                <div key={t._id} style={{display:"flex",gap:10,padding:11,background:G.bg,border:`1px solid ${G.border}`,borderRadius:10,marginBottom:7,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
                  <span style={{fontSize:18,marginTop:2}}>{categoryIcon[t.category]}</span>
                  <div style={{flex:1}}>
                    <div style={{color:G.text,fontSize:13,fontWeight:700,fontFamily:G.body}}>{t.title}</div>
                    <div style={{color:G.muted,fontSize:11,marginTop:2,fontFamily:G.body}}>{t.description}</div>
                    <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
                      <NeonBadge label={t.status.replace("_"," ")} color={tC[t.status]} G={G}/>
                      <NeonBadge label={t.priority} color={pC[t.priority]} G={G}/>
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
function EmployeesPage({ addToast, addActivity, employees, setEmployees, G }) {
  const [showForm,setShowForm]=useState(false);
  const [search,setSearch]=useState("");
  const [confirm,setConfirm]=useState(null);
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",department:"",position:"",phone:""});
  const sC=statusColor(G);

  const filtered=employees.filter(e=>
    e.name?.toLowerCase().includes(search.toLowerCase())||
    e.department?.toLowerCase().includes(search.toLowerCase())
  );

  const add=async()=>{
    if(!form.name||!form.email||!form.password){addToast("Fill all required fields!","error");return;}
    setLoading(true);
    try {
      const {data}=await api.addEmployee(form);
      setEmployees([...employees,data]);
      setForm({name:"",email:"",password:"",department:"",position:"",phone:""});
      setShowForm(false);
      addToast(`${form.name} deployed!`,"success");
      addActivity(`Agent ${form.name} deployed to system`,"employee_add");
      playSound('deploy');
    } catch(err) { addToast(err.response?.data?.message||"Failed","error"); }
    setLoading(false);
  };

  const remove=async()=>{
    try {
      const emp=employees.find(e=>e._id===confirm);
      await api.deleteEmployee(confirm);
      setEmployees(employees.filter(e=>e._id!==confirm));
      addToast("Agent removed","error");
      addActivity(`Agent ${emp?.name} removed from system`,"employee_remove");
      playSound('delete');
    } catch(err) { addToast("Failed","error"); }
    setConfirm(null);
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <ConfirmPopup show={!!confirm} message="Remove this agent permanently?" onConfirm={remove} onCancel={()=>setConfirm(null)} G={G}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <SectionHeader title="AGENT ROSTER" color={G.accent} icon="👥" G={G}/>
        <GlowBtn onClick={()=>setShowForm(!showForm)} color={G.accent} G={G}>+ DEPLOY AGENT</GlowBtn>
      </div>
      {showForm&&(
        <div style={{background:G.card,border:`1px solid ${G.accent}44`,borderRadius:12,padding:18,marginBottom:14,animation:"fadeUp 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:3,height:14,background:G.accent}}/>
            <h3 style={{fontFamily:G.font,color:G.accent,fontSize:10,letterSpacing:2}}>NEW AGENT REGISTRATION</h3>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <GlowInput placeholder="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} G={G}/>
            <GlowInput placeholder="Email *" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} G={G}/>
            <GlowInput placeholder="Password *" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} G={G}/>
            <GlowInput placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} G={G}/>
            <GlowInput placeholder="Position" value={form.position} onChange={e=>setForm({...form,position:e.target.value})} G={G}/>
            <GlowInput placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} G={G}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <GlowBtn color={G.accent} G={G} onClick={add} disabled={loading}>{loading?"DEPLOYING...":"CONFIRM DEPLOY"}</GlowBtn>
            <GlowBtn color={G.muted} G={G} onClick={()=>setShowForm(false)}>ABORT</GlowBtn>
          </div>
        </div>
      )}
      <div style={{marginBottom:12}}><GlowInput placeholder="🔍  SEARCH AGENTS..." value={search} onChange={e=>setSearch(e.target.value)} G={G}/></div>
      <div className="emp-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}}>
        {filtered.map((emp,i)=>(
          <div key={emp._id} className="emp-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:16,position:"relative",transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
            <button onClick={()=>setConfirm(emp._id)} style={{position:"absolute",top:10,right:10,background:`${G.red}15`,border:`1px solid ${G.red}33`,color:G.red,borderRadius:6,width:24,height:24,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <HexAvatar name={emp.name||"U"} size={40} G={G}/>
              <div>
                <div style={{color:G.text,fontWeight:700,fontSize:13,fontFamily:G.body}}>{emp.name}</div>
                <div style={{color:G.muted,fontSize:11,fontFamily:G.body}}>{emp.position||"N/A"}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>
              <NeonBadge label={emp.status} color={sC[emp.status]||G.primary} G={G}/>
              <NeonBadge label={emp.department||"N/A"} color={G.secondary} G={G}/>
            </div>
            <div style={{marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{color:G.muted,fontSize:9,fontFamily:G.font,letterSpacing:1}}>PROGRESS</span>
                <span style={{color:G.primary,fontSize:10,fontWeight:900,fontFamily:G.font}}>{emp.onboardingProgress||0}%</span>
              </div>
              <NeonProgress value={emp.onboardingProgress||0} G={G}/>
            </div>
            <div style={{color:G.muted,fontSize:10,fontFamily:G.body}}>📱 {emp.phone||"N/A"}</div>
          </div>
        ))}
        {filtered.length===0&&<div style={{color:G.muted,textAlign:"center",padding:36,fontFamily:G.font,fontSize:10,letterSpacing:2,gridColumn:"1/-1"}}>NO AGENTS FOUND</div>}
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function TasksPage({ user, tasks, setTasks, employees, addToast, addActivity, G }) {
  const [filter,setFilter]=useState("all");
  const [showForm,setShowForm]=useState(false);
  const [missionComplete,setMissionComplete]=useState(false);
  const [completedEmp,setCompletedEmp]=useState("");
  const [form,setForm]=useState({title:"",description:"",assignedTo:"",priority:"medium",category:"other",dueDate:""});
  const tC=taskStatusColor(G), pC=priorityColor(G);
  const isAdmin=user.role==="admin"||user.role==="hr";
  const visible=isAdmin?tasks:tasks.filter(t=>t.assignedTo?._id===user._id);
  const filtered=filter==="all"?visible:visible.filter(t=>t.status===filter);

  const getDaysLeft = (dueDate) => {
    if(!dueDate) return null;
    const diff = Math.ceil((new Date(dueDate)-new Date())/(1000*60*60*24));
    if(diff<0) return {label:"OVERDUE",color:G.red};
    if(diff===0) return {label:"TODAY!",color:G.red};
    if(diff<=2) return {label:`${diff}d left`,color:G.orange};
    return {label:`${diff}d left`,color:G.muted};
  };

  const updateStatus=async(id,status)=>{
    try {
      const {data}=await api.updateTask(id,{status});
      setTasks(tasks.map(t=>t._id===id?data:t));
      const task=tasks.find(t=>t._id===id);
      if(status==="completed"){
        setCompletedEmp(task?.assignedTo?.name||"");
        setMissionComplete(true);
        addToast("MISSION COMPLETE! +100 XP","success");
        addActivity(`${task?.assignedTo?.name} completed "${task?.title}"`,"task_complete");
        playSound('mission');
      } else {
        addToast("Status updated!","info");
        addActivity(`Mission "${task?.title}" started`,"task_start");
        playSound('click');
      }
    } catch(err) { addToast("Failed","error"); }
  };

  const addTask=async()=>{
    if(!form.title||!form.assignedTo){addToast("Fill required fields!","error");return;}
    try {
      const {data}=await api.addTask(form);
      setTasks([...tasks,data]);
      const emp=employees.find(e=>e._id===form.assignedTo);
      setForm({title:"",description:"",assignedTo:"",priority:"medium",category:"other",dueDate:""});
      setShowForm(false);
      addToast("Mission created!","success");
      addActivity(`New mission assigned to ${emp?.name||"agent"}`,"task_create");
      playSound('deploy');
    } catch(err) { addToast("Failed","error"); }
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <MissionComplete show={missionComplete} onClose={()=>setMissionComplete(false)} empName={completedEmp} G={G}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <SectionHeader title="MISSION CONTROL" color={G.orange} icon="📋" G={G}/>
        {isAdmin&&<GlowBtn onClick={()=>setShowForm(!showForm)} color={G.orange} G={G}>+ NEW MISSION</GlowBtn>}
      </div>
      {showForm&&(
        <div style={{background:G.card,border:`1px solid ${G.orange}44`,borderRadius:12,padding:18,marginBottom:14,animation:"fadeUp 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{width:3,height:14,background:G.orange}}/>
            <h3 style={{fontFamily:G.font,color:G.orange,fontSize:10,letterSpacing:2}}>MISSION BRIEFING</h3>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <GlowInput placeholder="Mission title *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} G={G}/>
            <SelectField value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})} G={G}>
              <option value="">Select Agent *</option>
              {employees.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
            </SelectField>
            <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{gridColumn:"1/-1",background:G.bg,border:`1px solid ${G.border}`,borderRadius:8,padding:"9px 11px",color:G.text,fontSize:12,outline:"none",fontFamily:G.body,resize:"vertical",minHeight:55}}/>
            <SelectField value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})} G={G}>{["low","medium","high"].map(p=><option key={p} value={p}>{p}</option>)}</SelectField>
            <SelectField value={form.category} onChange={e=>setForm({...form,category:e.target.value})} G={G}>{["documentation","training","setup","meeting","other"].map(c=><option key={c} value={c}>{c}</option>)}</SelectField>
            <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} style={{background:G.bg,border:`1px solid ${G.border}`,borderRadius:8,padding:"9px 11px",color:G.text,fontSize:12,outline:"none",fontFamily:G.body,width:"100%"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <GlowBtn color={G.orange} G={G} onClick={addTask}>LAUNCH MISSION</GlowBtn>
            <GlowBtn color={G.muted} G={G} onClick={()=>setShowForm(false)}>ABORT</GlowBtn>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
        {["all","pending","in_progress","completed"].map(f=>(
          <button key={f} onClick={()=>{setFilter(f);playSound('click');}} className="game-btn" style={{background:filter===f?`${G.primary}22`:"transparent",color:filter===f?G.primary:G.muted,border:`1px solid ${filter===f?G.primary+"55":G.border}`,borderRadius:20,padding:"5px 13px",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:G.font,letterSpacing:1,transition:"all 0.2s"}}>
            {f.replace("_"," ").toUpperCase()} ({(f==="all"?visible:visible.filter(t=>t.status===f)).length})
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {filtered.map((t,i)=>{
          const dl=getDaysLeft(t.dueDate);
          return (
            <div key={t._id} className="game-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:14,display:"flex",gap:11,alignItems:"flex-start",transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.06}s both`}}>
              <span style={{fontSize:18,marginTop:2}}>{categoryIcon[t.category]}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:7}}>
                  <div style={{minWidth:0}}>
                    <div style={{color:G.text,fontWeight:700,fontSize:13,fontFamily:G.body,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                    <div style={{color:G.muted,fontSize:11,marginTop:2,fontFamily:G.body}}>{t.description}</div>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",flexShrink:0}}>
                    <NeonBadge label={t.status.replace("_"," ")} color={tC[t.status]} G={G}/>
                    <NeonBadge label={t.priority} color={pC[t.priority]} G={G}/>
                    {dl&&<NeonBadge label={dl.label} color={dl.color} G={G}/>}
                  </div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:9,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:G.muted,fontSize:10,fontFamily:G.body}}>👤 {t.assignedTo?.name||"Unknown"}</span>
                  {t.dueDate&&<span style={{color:G.muted,fontSize:10,fontFamily:G.body}}>📅 {t.dueDate?.split("T")[0]}</span>}
                  <div style={{marginLeft:"auto",display:"flex",gap:7}}>
                    {t.status==="pending"&&<GlowBtn size="sm" color={G.primary} G={G} onClick={()=>updateStatus(t._id,"in_progress")}>▶ START</GlowBtn>}
                    {t.status==="in_progress"&&<GlowBtn size="sm" color={G.accent} G={G} onClick={()=>updateStatus(t._id,"completed")}>✓ COMPLETE</GlowBtn>}
                    {t.status==="completed"&&<span style={{color:G.accent,fontSize:10,fontWeight:700,fontFamily:G.font,letterSpacing:1}}>✓ DONE</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:G.muted,fontFamily:G.font,fontSize:10,letterSpacing:2}}>NO MISSIONS FOUND</div>}
      </div>
    </div>
  );
}

// ─── WORKFLOWS ────────────────────────────────────────────────────────────────
function WorkflowsPage({ employees, addToast, addActivity, G }) {
  const [workflows,setWorkflows]=useState([]);
  const [selected,setSelected]=useState(null);
  const [assignEmp,setAssignEmp]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    api.getWorkflows().then(({data})=>setWorkflows(data)).catch(()=>addToast("Failed","error")).finally(()=>setLoading(false));
  },[]);

  const assign=async(wf)=>{
    if(!assignEmp){addToast("Select agent!","error");return;}
    try {
      await api.assignWorkflow(wf._id,assignEmp);
      const emp=employees.find(e=>e._id===assignEmp);
      addToast(`${wf.name} assigned!`,"success");
      addActivity(`Workflow "${wf.name}" assigned to ${emp?.name}`,"workflow_assign");
      playSound('deploy');
      setSelected(null);setAssignEmp("");
    } catch(err) { addToast("Failed","error"); }
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="OPERATION TEMPLATES" color={G.secondary} icon="🔄" G={G}/>
      {loading?<Loader G={G}/>:workflows.length===0?(
        <div style={{textAlign:"center",padding:52,color:G.muted}}>
          <div style={{fontSize:44,marginBottom:12}}>📋</div>
          <div style={{fontFamily:G.font,letterSpacing:2,fontSize:11}}>NO WORKFLOWS</div>
          <div style={{color:G.muted,fontSize:11,marginTop:7,fontFamily:G.body}}>Add via Thunder Client API</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:13}}>
          {workflows.map((wf,i)=>(
            <div key={wf._id} className="game-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18,transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                <div>
                  <h3 style={{fontFamily:G.font,color:G.text,fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:5}}>{wf.name}</h3>
                  <NeonBadge label={wf.department||"All"} color={G.secondary} G={G}/>
                </div>
                <div style={{background:`${G.primary}15`,color:G.primary,border:`1px solid ${G.primary}33`,borderRadius:6,padding:"3px 7px",fontSize:9,fontWeight:900,fontFamily:G.font}}>{wf.steps?.length||0} OPS</div>
              </div>
              <p style={{color:G.muted,fontSize:12,margin:"0 0 10px",lineHeight:1.5,fontFamily:G.body}}>{wf.description}</p>
              <div style={{marginBottom:12}}>
                {wf.steps?.map((s,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",borderBottom:`1px solid ${G.border}`}}>
                    <div style={{width:16,height:16,borderRadius:3,background:`${G.primary}15`,border:`1px solid ${G.primary}33`,color:G.primary,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontFamily:G.font,flexShrink:0}}>{s.order}</div>
                    <span style={{fontSize:12}}>{categoryIcon[s.category]}</span>
                    <span style={{color:G.text,fontSize:11,flex:1,fontFamily:G.body}}>{s.title}</span>
                    <span style={{color:G.muted,fontSize:9,fontFamily:G.font}}>{s.estimatedDays}D</span>
                  </div>
                ))}
              </div>
              <GlowBtn style={{width:"100%",borderRadius:8}} G={G} onClick={()=>setSelected(selected===wf._id?null:wf._id)}>⚡ ASSIGN OPERATION</GlowBtn>
              {selected===wf._id&&(
                <div style={{marginTop:9,display:"flex",gap:7,animation:"fadeUp 0.3s ease"}}>
                  <SelectField value={assignEmp} onChange={e=>setAssignEmp(e.target.value)} G={G}>
                    <option value="">Select Agent</option>
                    {employees.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
                  </SelectField>
                  <GlowBtn color={G.accent} size="sm" G={G} onClick={()=>assign(wf)}>GO</GlowBtn>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const NAV=[
  {key:"dashboard",label:"COMMAND",icon:"🏠",shortcut:"D"},
  {key:"employees",label:"AGENTS",icon:"👥",admin:true,shortcut:"A"},
  {key:"tasks",label:"MISSIONS",icon:"📋",shortcut:"M"},
  {key:"workflows",label:"OPS",icon:"🔄",admin:true},
  {key:"analytics",label:"ANALYTICS",icon:"📊",admin:true,shortcut:"N"},
  {key:"leaderboard",label:"RANKS",icon:"🏆",shortcut:"L"},
  {key:"reports",label:"REPORTS",icon:"📄",admin:true,shortcut:"R"},
];

function Layout({ user, onLogout }) {
  const [page,setPage]=useState("dashboard");
  const [tasks,setTasks]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [toasts,setToasts]=useState([]);
  const [notifications,setNotifications]=useState([]);
  const [activities,setActivities]=useState([]);
  const [showNotifs,setShowNotifs]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [showShortcuts,setShowShortcuts]=useState(false);
  const [loading,setLoading]=useState(true);
  const [currentTheme,setCurrentTheme]=useState(()=>localStorage.getItem('theme')||'cyber');

  const G = THEMES[currentTheme] || THEMES.cyber;

  useEffect(()=>{
    localStorage.setItem('theme',currentTheme);
    document.body.style.background=G.bg;
    document.body.style.color=G.text;
  },[currentTheme]);

  const addToast=(message,type="info")=>{
    const id=Date.now();
    setToasts(prev=>[...prev,{id,message,type}]);
    if(type==="success") playSound('notification');
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),3500);
  };

  const addNotification=(message,type="info")=>{
    const id=Date.now();
    const time=new Date().toLocaleTimeString();
    setNotifications(prev=>[{id,message,type,time},...prev].slice(0,20));
  };

  const addActivity=(message,type="system")=>{
    const id=Date.now();
    const time=new Date().toLocaleTimeString();
    setActivities(prev=>[{id,message,type,time},...prev].slice(0,30));
  };

  useEffect(()=>{
    const isAdmin=user.role==="admin"||user.role==="hr";
    Promise.all([
      api.getTasks(),
      isAdmin?api.getEmployees():Promise.resolve({data:[]}),
    ]).then(([tr,er])=>{
      setTasks(tr.data);
      setEmployees(er.data);
      addActivity("System initialized successfully","system");
      addNotification("Welcome back! System online","success");
    }).catch(()=>addToast("Failed to load data","error"))
      .finally(()=>setLoading(false));
  },[]);

  useKeyboardShortcuts(setPage, setShowSearch, setShowShortcuts, user);

  const navItems=NAV.filter(n=>!n.admin||user.role==="admin"||user.role==="hr");
  const unread=notifications.length;

  return (
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:G.body,display:"flex",position:"relative",transition:"background 0.3s ease"}}>
      <style>{makeCss(G)}</style>
      <ParticleBackground G={G}/>
      <Toast toasts={toasts} G={G}/>
      <NotificationsPanel show={showNotifs} onClose={()=>setShowNotifs(false)} notifications={notifications} clearAll={()=>setNotifications([])} G={G}/>
      <GlobalSearch show={showSearch} onClose={()=>setShowSearch(false)} employees={employees} tasks={tasks} setPage={setPage} G={G}/>
      <ShortcutsPanel show={showShortcuts} onClose={()=>setShowShortcuts(false)} G={G}/>

      {/* Sidebar */}
      <div className="sidebar" style={{width:190,background:G.surface,borderRight:`1px solid ${G.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:100,transition:"all 0.3s"}}>
        <div style={{padding:"16px 12px 12px",borderBottom:`1px solid ${G.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,background:`${G.primary}15`,border:`1px solid ${G.primary}44`,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>⚡</div>
            <div className="logo-text">
              <div style={{fontFamily:G.font,color:G.primary,fontWeight:900,fontSize:12,letterSpacing:2}}>ONBOARD</div>
              <div style={{fontFamily:G.font,color:G.secondary,fontWeight:900,fontSize:12,letterSpacing:2,marginTop:-3}}>IQ</div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div style={{padding:"8px 10px",borderBottom:`1px solid ${G.border}`}}>
          <button onClick={()=>setShowSearch(true)} className="game-btn" style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:`${G.primary}08`,border:`1px solid ${G.border}`,borderRadius:8,color:G.muted,cursor:"pointer",fontSize:11,fontFamily:G.body,transition:"all 0.2s"}}>
            <span>🔍</span>
            <span className="nav-label" style={{flex:1,textAlign:"left"}}>Search...</span>
            <kbd style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:4,padding:"1px 5px",color:G.primary,fontFamily:G.font,fontSize:8}} className="nav-label">⌘K</kbd>
          </button>
        </div>

        <nav style={{flex:1,padding:"10px 8px",overflow:"auto"}}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>{setPage(item.key);playSound('click');}} className={`nav-btn ${page===item.key?"active":""}`}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,border:"none",borderLeft:`2px solid ${page===item.key?G.primary:"transparent"}`,background:"transparent",color:page===item.key?G.primary:G.muted,cursor:"pointer",fontSize:10,fontWeight:700,marginBottom:2,textAlign:"left",fontFamily:G.font,letterSpacing:1,transition:"all 0.2s",position:"relative"}}>
              <span style={{fontSize:14,flexShrink:0}}>{item.icon}</span>
              <span className="nav-label" style={{flex:1}}>{item.label}</span>
              {item.shortcut&&<kbd style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:3,padding:"1px 4px",color:G.muted,fontFamily:G.font,fontSize:7}} className="nav-label">{item.shortcut}</kbd>}
            </button>
          ))}
        </nav>

        <div style={{padding:"10px 8px",borderTop:`1px solid ${G.border}`}}>
          {/* Theme Switcher */}
          <ThemeSwitcher currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} G={G}/>

          {/* User Info */}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:G.card,border:`1px solid ${G.border}`,borderRadius:8,marginBottom:6}}>
            <HexAvatar name={user.name||"U"} size={26} G={G}/>
            <div style={{minWidth:0}} className="logo-text">
              <div className="user-name" style={{color:G.text,fontSize:10,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:G.body}}>{user.name}</div>
              <div style={{color:G.muted,fontSize:8,textTransform:"uppercase",fontFamily:G.font,letterSpacing:1}}>{user.role}</div>
            </div>
          </div>

          {/* Notification Bell */}
          <button onClick={()=>{setShowNotifs(!showNotifs);playSound('click');}} className="game-btn" style={{width:"100%",background:`${G.primary}10`,color:G.primary,border:`1px solid ${G.primary}33`,borderRadius:7,padding:"7px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:G.font,letterSpacing:1,marginBottom:5,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            🔔 <span className="nav-label">ALERTS</span>
            {unread>0&&<span style={{position:"absolute",top:-3,right:-3,background:G.red,color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.font,fontWeight:900}}>{unread>9?"9+":unread}</span>}
          </button>

          {/* Shortcuts */}
          <button onClick={()=>{setShowShortcuts(true);playSound('click');}} className="game-btn" style={{width:"100%",background:`${G.secondary}10`,color:G.secondary,border:`1px solid ${G.secondary}33`,borderRadius:7,padding:"7px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:G.font,letterSpacing:1,marginBottom:5,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            ⌨️ <span className="nav-label">SHORTCUTS</span>
          </button>

          <button onClick={onLogout} className="game-btn" style={{width:"100%",background:`${G.red}10`,color:G.red,border:`1px solid ${G.red}33`,borderRadius:7,padding:"7px",fontSize:9,cursor:"pointer",fontWeight:700,fontFamily:G.font,letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            ⏻ <span className="nav-label">DISCONNECT</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{marginLeft:190,flex:1,padding:"22px 22px 40px",maxWidth:"calc(100vw - 190px)",position:"relative",zIndex:1}}>
        {loading?<Loader G={G}/>:(
          <>
            {page==="dashboard"&&<Dashboard user={user} employees={employees} tasks={tasks} activities={activities} G={G}/>}
            {page==="employees"&&<EmployeesPage addToast={addToast} addActivity={addActivity} employees={employees} setEmployees={setEmployees} G={G}/>}
            {page==="tasks"&&<TasksPage user={user} tasks={tasks} setTasks={setTasks} employees={employees} addToast={addToast} addActivity={addActivity} G={G}/>}
            {page==="workflows"&&<WorkflowsPage employees={employees} addToast={addToast} addActivity={addActivity} G={G}/>}
            {page==="analytics"&&<AnalyticsPage employees={employees} tasks={tasks} G={G}/>}
            {page==="leaderboard"&&<LeaderboardPage employees={employees} tasks={tasks} G={G}/>}
            {page==="reports"&&<ReportsPage employees={employees} tasks={tasks} G={G}/>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const G = THEMES.cyber;
  const [email,setEmail]=useState("admin@company.com");
  const [pw,setPw]=useState("admin123");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const handle=async(e)=>{
    e.preventDefault();
    setLoading(true);setErr("");
    try {
      const {data}=await api.login({email,password:pw});
      localStorage.setItem('token',data.token);
      localStorage.setItem('user',JSON.stringify(data));
      playSound('success');
      onLogin(data);
    } catch(error) {
      setErr(error.response?.data?.message||"ACCESS DENIED");
      playSound('delete');
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.body,position:"relative",overflow:"hidden",padding:20}}>
      <style>{makeCss(G)}</style>
      <ParticleBackground G={G}/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 50%,#00f5ff08 0%,transparent 70%)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:400,animation:"fadeUp 0.6s ease"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,animation:"float 3s ease-in-out infinite",display:"block",marginBottom:12}}>⚡</div>
          <h1 style={{fontFamily:G.font,fontSize:26,fontWeight:900,color:G.primary,letterSpacing:4,animation:"glitch 3s ease infinite",textShadow:`0 0 20px ${G.primary}`}}>ONBOARD<span style={{color:G.secondary}}>IQ</span></h1>
          <p style={{color:G.muted,fontSize:10,marginTop:7,letterSpacing:3,textTransform:"uppercase",fontFamily:G.font}}>Smart Employee System v2.0</p>
        </div>
        <div style={{background:G.card,border:`1px solid ${G.primary}33`,borderRadius:16,padding:26,animation:"pulse 3s ease infinite"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
            <div style={{width:3,height:18,background:G.primary}}/>
            <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>SYSTEM ACCESS</h2>
          </div>
          {err&&<div style={{background:`${G.red}15`,border:`1px solid ${G.red}44`,borderRadius:8,padding:"9px 13px",color:G.red,fontSize:11,marginBottom:13,fontFamily:G.font,letterSpacing:1,animation:"fadeUp 0.3s ease"}}>⛔ {err}</div>}
          <form onSubmit={handle}>
            <div style={{marginBottom:11}}>
              <label style={{color:G.muted,fontSize:9,display:"block",marginBottom:5,fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>User ID</label>
              <GlowInput value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Enter email" G={G}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{color:G.muted,fontSize:9,display:"block",marginBottom:5,fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>Access Code</label>
              <GlowInput value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Enter password" G={G}/>
            </div>
            <button type="submit" disabled={loading} className="game-btn" style={{width:"100%",background:loading?"#111":`linear-gradient(135deg,${G.primary}33,${G.secondary}22)`,color:loading?G.muted:G.primary,border:`1px solid ${loading?G.muted:G.primary}`,borderRadius:8,padding:"11px",fontFamily:G.font,fontSize:11,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:2,transition:"all 0.3s"}}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9}}><span style={{display:"inline-block",width:12,height:12,border:`2px solid ${G.primary}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>INITIALIZING...</span>:"⚡ INITIALIZE ACCESS"}
            </button>
          </form>
          <div style={{marginTop:14,background:G.bg,border:`1px solid ${G.border}`,borderRadius:8,padding:10}}>
            <p style={{color:G.muted,fontSize:8,margin:"0 0 5px",fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>Demo Credentials</p>
            <p style={{color:G.primary+"99",fontSize:11,margin:"2px 0",fontFamily:G.body}}>👑 admin@company.com / admin123</p>
          </div>
          <div style={{marginTop:10,display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {Object.entries(THEMES).map(([key,theme])=>(
              <span key={key} style={{color:G.muted,fontSize:10,fontFamily:G.body}}>{theme.icon} {theme.name.split(" ")[0]}</span>
            ))}
          </div>
          <div style={{color:G.muted,fontSize:9,textAlign:"center",marginTop:6,fontFamily:G.font,letterSpacing:1}}>Press ? for keyboard shortcuts after login</div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(()=>{
    try{const s=localStorage.getItem('user');return s?JSON.parse(s):null;}catch{return null;}
  });
  const logout=()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    playSound('delete');
    setUser(null);
  };
  return user?<Layout user={user} onLogout={logout}/>:<LoginPage onLogin={setUser}/>;
}
