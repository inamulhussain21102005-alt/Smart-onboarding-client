import { useState, useEffect, useRef } from "react";
import axios from 'axios';

// ─── API SETUP ────────────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});
const api = {
  login: (d) => API.post('/auth/login', d),
  register: (d) => API.post('/auth/register', d),
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
  bg:"#000000", surface:"#0a0a0f", card:"#0d0d1a", border:"#1a1a2e",
  cyan:"#00f5ff", purple:"#bf00ff", green:"#00ff41", orange:"#ffaa00",
  red:"#ff0040", text:"#e0e0ff", muted:"#444466",
  font:"'Orbitron', monospace", body:"'Rajdhani', sans-serif",
};
const statusColor = { active:"#00ff41", onboarding:"#ffaa00", inactive:"#ff0040" };
const priorityColor = { high:"#ff0040", medium:"#ffaa00", low:"#00ff41" };
const taskStatusColor = { pending:"#666", in_progress:"#00f5ff", completed:"#00ff41", overdue:"#ff0040" };
const categoryIcon = { documentation:"📄", training:"📚", setup:"⚙️", meeting:"🤝", other:"📌" };

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#000;color:#e0e0ff;font-family:'Rajdhani',sans-serif;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:#000;}
  ::-webkit-scrollbar-thumb{background:#00f5ff44;border-radius:2px;}
  @keyframes fadeUp{from{transform:translateY(20px);opacity:0;}to{transform:translateY(0);opacity:1;}}
  @keyframes slideIn{from{transform:translateX(-20px);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes glitch{0%,100%{text-shadow:2px 0 #00f5ff,-2px 0 #bf00ff;}25%{text-shadow:-2px 0 #00f5ff,2px 0 #bf00ff;transform:translateX(2px);}75%{text-shadow:2px 0 #bf00ff,-2px 0 #00f5ff;transform:translateX(-2px);}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
  @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes pulse-border{0%,100%{box-shadow:0 0 5px #00f5ff44;}50%{box-shadow:0 0 20px #00f5ff88;}}
  @keyframes toast-in{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes bar-fill{from{width:0;}to{width:var(--w);}}
  @keyframes count-up{from{opacity:0;transform:scale(0.5);}to{opacity:1;transform:scale(1);}}
  @keyframes neon-pulse{0%,100%{box-shadow:0 0 5px currentColor;}50%{box-shadow:0 0 20px currentColor,0 0 40px currentColor;}}
  .nav-btn:hover{background:#00f5ff11!important;color:#00f5ff!important;border-left-color:#00f5ff!important;}
  .nav-btn.active{background:#00f5ff15!important;color:#00f5ff!important;border-left-color:#00f5ff!important;}
  .game-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px #00f5ff22!important;border-color:#00f5ff44!important;}
  .game-btn:hover{transform:scale(1.05);filter:brightness(1.2);}
  .game-btn:active{transform:scale(0.96);}
  .emp-card:hover{border-color:#00f5ff66!important;box-shadow:0 0 20px #00f5ff22!important;}
  .notif-badge{position:absolute;top:-4px;right:-4px;background:#ff0040;color:#fff;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-weight:900;}
  @media(max-width:768px){
    .sidebar{width:60px!important;}
    .sidebar .nav-label{display:none!important;}
    .sidebar .logo-text{display:none!important;}
    .main-content{margin-left:60px!important;max-width:calc(100vw - 60px)!important;padding:16px!important;}
    .stat-grid{flex-direction:column!important;}
    .emp-grid{grid-template-columns:1fr!important;}
  }
`;

// ─── MINI COMPONENTS ──────────────────────────────────────────────────────────
function ParticleBackground() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[...Array(15)].map((_,i)=>(
        <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,width:Math.random()>0.5?2:1,height:Math.random()>0.5?2:1,background:i%3===0?G.cyan:i%3===1?G.purple:G.green,borderRadius:"50%",animation:`float ${3+Math.random()*4}s ease-in-out infinite`,animationDelay:`${Math.random()*4}s`,opacity:0.3+Math.random()*0.4}}/>
      ))}
    </div>
  );
}

function Toast({toasts}) {
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:G.card,border:`1px solid ${t.type==="success"?G.green:t.type==="error"?G.red:G.cyan}`,borderRadius:8,padding:"12px 18px",color:G.text,fontSize:14,fontFamily:G.body,fontWeight:600,boxShadow:`0 0 20px ${t.type==="success"?G.green:t.type==="error"?G.red:G.cyan}44`,animation:"toast-in 0.3s ease",display:"flex",alignItems:"center",gap:10,minWidth:260,maxWidth:320}}>
          <span style={{fontSize:18}}>{t.type==="success"?"✅":t.type==="error"?"❌":"⚡"}</span>
          <span style={{flex:1,fontSize:13}}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function MissionComplete({show,onClose,empName}) {
  if(!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000000ee",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{textAlign:"center",animation:"fadeUp 0.4s ease"}}>
        <div style={{fontSize:80,animation:"float 2s ease-in-out infinite",marginBottom:16}}>🏆</div>
        <div style={{fontFamily:G.font,fontSize:36,fontWeight:900,color:G.green,animation:"glitch 0.5s ease infinite",letterSpacing:4}}>MISSION COMPLETE!</div>
        {empName&&<div style={{color:G.cyan,fontSize:16,fontFamily:G.body,marginTop:8,letterSpacing:2}}>{empName}</div>}
        <div style={{color:G.orange,fontSize:22,fontFamily:G.font,marginTop:8,letterSpacing:2}}>+ 100 XP EARNED</div>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:20,flexWrap:"wrap"}}>
          {["🎯","⭐","🔥","💥","✨","🎮","🏅","💎"].map((e,i)=>(
            <span key={i} style={{fontSize:24,animation:`float ${1+i*0.2}s ease-in-out infinite`,animationDelay:`${i*0.1}s`}}>{e}</span>
          ))}
        </div>
        <div style={{color:G.muted,fontSize:12,marginTop:20,fontFamily:G.body}}>Click anywhere to continue</div>
      </div>
    </div>
  );
}

function ConfirmPopup({show,message,onConfirm,onCancel}) {
  if(!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:G.card,border:`1px solid ${G.red}`,borderRadius:16,padding:32,textAlign:"center",animation:"fadeUp 0.3s ease",boxShadow:`0 0 40px ${G.red}44`,maxWidth:380,width:"100%"}}>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <div style={{fontFamily:G.font,fontSize:16,color:G.red,fontWeight:700,marginBottom:8,letterSpacing:2}}>WARNING</div>
        <div style={{color:G.text,fontSize:14,fontFamily:G.body,marginBottom:24,lineHeight:1.6}}>{message}</div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button onClick={onConfirm} className="game-btn" style={{background:`linear-gradient(135deg,${G.red},#aa0030)`,color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontFamily:G.font,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>CONFIRM</button>
          <button onClick={onCancel} className="game-btn" style={{background:"transparent",color:G.muted,border:`1px solid ${G.muted}`,borderRadius:8,padding:"10px 24px",fontFamily:G.font,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

function NeonBadge({label,color}) {
  return <span style={{background:color+"15",color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:G.font,boxShadow:`0 0 6px ${color}22`,whiteSpace:"nowrap"}}>{label}</span>;
}

function GlowInput({placeholder,value,onChange,type="text",style={}}) {
  const [f,setF]=useState(false);
  return <input placeholder={placeholder} value={value} onChange={onChange} type={type} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:"100%",background:"#050510",border:`1px solid ${f?G.cyan:G.border}`,borderRadius:8,padding:"10px 14px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,boxSizing:"border-box",transition:"all 0.3s",boxShadow:f?`0 0 15px ${G.cyan}22`:"none",...style}}/>;
}

function GlowBtn({children,onClick,color=G.cyan,style={},size="md",disabled=false}) {
  const pad={sm:"5px 12px",md:"9px 18px",lg:"12px 0"};
  return <button onClick={onClick} disabled={disabled} className="game-btn" style={{background:`linear-gradient(135deg,${color}22,${color}11)`,color:disabled?G.muted:color,border:`1px solid ${disabled?G.muted:color}55`,borderRadius:8,padding:pad[size],fontFamily:G.font,fontSize:size==="sm"?10:11,fontWeight:700,cursor:disabled?"not-allowed":"pointer",letterSpacing:1,transition:"all 0.2s",width:size==="lg"?"100%":"auto",opacity:disabled?0.5:1,...style}}>{children}</button>;
}

function HexAvatar({name,size=40}) {
  const colors=[G.cyan,G.purple,G.green,G.orange,G.red];
  const c=colors[(name||"U").charCodeAt(0)%colors.length];
  return <div style={{width:size,height:size,background:`${c}22`,border:`2px solid ${c}55`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:c,fontWeight:900,fontSize:size*0.38,fontFamily:G.font,flexShrink:0,boxShadow:`0 0 8px ${c}22`}}>{(name||"U")[0]}</div>;
}

function NeonProgress({value,height=6}) {
  const color=value===100?G.green:value>60?G.cyan:value>30?G.orange:G.red;
  return (
    <div style={{height,background:"#111",borderRadius:3,overflow:"hidden"}}>
      <div style={{height:"100%",width:(value||0)+"%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:3,transition:"width 1s ease",boxShadow:`0 0 6px ${color}`}}/>
    </div>
  );
}

function Loader() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}><div style={{width:36,height:36,border:`3px solid ${G.cyan}33`,borderTopColor:G.cyan,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>;
}

function SelectField({value,onChange,children,style={}}) {
  return <select value={value} onChange={onChange} style={{background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 12px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,width:"100%",...style}}>{children}</select>;
}

function SectionHeader({title,color=G.cyan,icon}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <div style={{width:4,height:28,background:color,boxShadow:`0 0 8px ${color}`,borderRadius:2}}/>
      <h1 style={{fontFamily:G.font,color,fontSize:18,fontWeight:900,letterSpacing:3}}>{icon} {title}</h1>
    </div>
  );
}

// ─── ANALYTICS CHARTS ─────────────────────────────────────────────────────────
function AnalyticsPage({employees,tasks}) {
  const completedByEmp = employees.map(emp => ({
    name: emp.name?.split(" ")[0] || "Unknown",
    completed: tasks.filter(t=>t.assignedTo?._id===emp._id&&t.status==="completed").length,
    total: tasks.filter(t=>t.assignedTo?._id===emp._id).length,
    progress: emp.onboardingProgress||0,
  }));

  const tasksByCategory = Object.entries(
    tasks.reduce((acc,t)=>{acc[t.category]=(acc[t.category]||0)+1;return acc;},{})
  );

  const tasksByStatus = [
    {label:"Pending",value:tasks.filter(t=>t.status==="pending").length,color:G.muted},
    {label:"In Progress",value:tasks.filter(t=>t.status==="in_progress").length,color:G.cyan},
    {label:"Completed",value:tasks.filter(t=>t.status==="completed").length,color:G.green},
  ];

  const totalTasks = tasks.length || 1;
  const completionRate = Math.round((tasks.filter(t=>t.status==="completed").length/totalTasks)*100);

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="ANALYTICS" color={G.purple} icon="📊"/>

      {/* Summary Cards */}
      <div className="stat-grid" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
        {[
          {icon:"👥",label:"Total Agents",value:employees.length,color:G.cyan},
          {icon:"📋",label:"Total Tasks",value:tasks.length,color:G.orange},
          {icon:"✅",label:"Completed",value:tasks.filter(t=>t.status==="completed").length,color:G.green},
          {icon:"🎯",label:"Completion Rate",value:completionRate+"%",color:G.purple},
        ].map((s,i)=>(
          <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"16px 20px",flex:1,minWidth:120,transition:"all 0.3s",animation:`fadeUp 0.5s ease ${i*0.1}s both`}}>
            <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
            <div style={{color:G.muted,fontSize:11,marginTop:2,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Employee Progress Chart */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <div style={{width:3,height:16,background:G.cyan}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>AGENT PERFORMANCE</h2>
        </div>
        {completedByEmp.length===0?(
          <div style={{color:G.muted,textAlign:"center",padding:24,fontFamily:G.font,fontSize:12}}>NO DATA AVAILABLE</div>
        ):completedByEmp.map((emp,i)=>(
          <div key={i} style={{marginBottom:16,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{color:G.text,fontSize:13,fontFamily:G.body,fontWeight:600}}>{emp.name}</span>
              <span style={{color:G.cyan,fontSize:12,fontFamily:G.font}}>{emp.completed}/{emp.total} tasks</span>
            </div>
            <div style={{height:20,background:"#111",borderRadius:4,overflow:"hidden",position:"relative"}}>
              <div style={{height:"100%",width:emp.progress+"%",background:`linear-gradient(90deg,${G.cyan}88,${G.purple})`,borderRadius:4,transition:"width 1s ease",display:"flex",alignItems:"center",paddingLeft:8}}>
                {emp.progress>10&&<span style={{color:"#fff",fontSize:10,fontFamily:G.font,fontWeight:700}}>{emp.progress}%</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Status Distribution */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:3,height:16,background:G.orange}}/>
            <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>TASK STATUS</h2>
          </div>
          {tasksByStatus.map((s,i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{color:s.color,fontSize:12,fontFamily:G.body,fontWeight:600}}>{s.label}</span>
                <span style={{color:G.text,fontSize:12,fontFamily:G.font}}>{s.value}</span>
              </div>
              <div style={{height:8,background:"#111",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${(s.value/totalTasks)*100}%`,background:s.color,borderRadius:4,transition:"width 1s ease",boxShadow:`0 0 6px ${s.color}`}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:3,height:16,background:G.green}}/>
            <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>BY CATEGORY</h2>
          </div>
          {tasksByCategory.length===0?(
            <div style={{color:G.muted,textAlign:"center",padding:16,fontFamily:G.font,fontSize:11}}>NO TASKS YET</div>
          ):tasksByCategory.map(([cat,count],i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:16}}>{categoryIcon[cat]||"📌"}</span>
              <div style={{flex:1}}>
                <div style={{height:8,background:"#111",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(count/totalTasks)*100}%`,background:G.purple,borderRadius:4,transition:"width 1s ease"}}/>
                </div>
              </div>
              <span style={{color:G.text,fontSize:11,fontFamily:G.font,minWidth:20}}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Overview */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:3,height:16,background:G.purple}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>SYSTEM OVERVIEW</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
          {[
            {label:"Avg Progress",value:employees.length?Math.round(employees.reduce((a,e)=>a+(e.onboardingProgress||0),0)/employees.length)+"%":"0%",color:G.cyan},
            {label:"Active Agents",value:employees.filter(e=>e.status==="active").length,color:G.green},
            {label:"In Training",value:employees.filter(e=>e.status==="onboarding").length,color:G.orange},
            {label:"Overdue Tasks",value:tasks.filter(t=>t.status==="overdue").length,color:G.red},
          ].map((s,i)=>(
            <div key={i} style={{background:"#050510",border:`1px solid ${s.color}33`,borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
              <div style={{color:G.muted,fontSize:10,marginTop:4,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function LeaderboardPage({employees,tasks}) {
  const ranked = employees.map(emp => {
    const empTasks = tasks.filter(t=>t.assignedTo?._id===emp._id);
    const completed = empTasks.filter(t=>t.status==="completed").length;
    const xp = completed * 100 + (emp.onboardingProgress||0);
    const rank = xp > 800 ? "LEGEND" : xp > 500 ? "ELITE" : xp > 200 ? "VETERAN" : "ROOKIE";
    const rankColor = xp > 800 ? G.orange : xp > 500 ? G.purple : xp > 200 ? G.cyan : G.green;
    return { ...emp, xp, completed, total: empTasks.length, rank, rankColor };
  }).sort((a,b)=>b.xp-a.xp);

  const medals = ["🥇","🥈","🥉"];

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="LEADERBOARD" color={G.orange} icon="🏆"/>

      {/* Top 3 Podium */}
      {ranked.length >= 3 && (
        <div style={{display:"flex",gap:12,marginBottom:24,alignItems:"flex-end",justifyContent:"center",flexWrap:"wrap"}}>
          {[ranked[1],ranked[0],ranked[2]].map((emp,i)=>{
            const heights = [160,200,140];
            const pos = [2,1,3];
            return emp ? (
              <div key={emp._id} style={{flex:1,minWidth:100,maxWidth:160,textAlign:"center",animation:`fadeUp 0.5s ease ${i*0.15}s both`}}>
                <div style={{fontSize:24,marginBottom:8}}>{medals[pos[i]-1]}</div>
                <HexAvatar name={emp.name} size={48} />
                <div style={{color:G.text,fontSize:12,fontWeight:700,fontFamily:G.body,marginTop:8,marginBottom:4}}>{emp.name?.split(" ")[0]}</div>
                <NeonBadge label={emp.rank} color={emp.rankColor}/>
                <div style={{height:heights[i],background:`linear-gradient(180deg,${emp.rankColor}33,${emp.rankColor}11)`,border:`1px solid ${emp.rankColor}44`,borderRadius:"8px 8px 0 0",marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4}}>
                  <div style={{color:emp.rankColor,fontFamily:G.font,fontSize:18,fontWeight:900}}>{emp.xp}</div>
                  <div style={{color:G.muted,fontSize:10,fontFamily:G.font}}>XP</div>
                </div>
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Full Rankings */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:3,height:16,background:G.orange}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>FULL RANKINGS</h2>
        </div>

        {ranked.length===0?(
          <div style={{color:G.muted,textAlign:"center",padding:40,fontFamily:G.font,fontSize:12,letterSpacing:2}}>NO AGENTS REGISTERED YET</div>
        ):ranked.map((emp,i)=>(
          <div key={emp._id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:i===0?"linear-gradient(135deg,#ffaa0010,#ffaa0005)":"#050510",border:`1px solid ${i===0?G.orange+"44":G.border}`,borderRadius:10,marginBottom:8,animation:`fadeUp 0.4s ease ${i*0.08}s both`,transition:"all 0.3s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:i<3?`${[G.orange,G.muted,G.cyan][i]}22`:"#1a1a2e",border:`1px solid ${i<3?[G.orange,G.muted,G.cyan][i]:"#333"}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.font,fontSize:12,fontWeight:900,color:i<3?[G.orange,G.muted,G.cyan][i]:G.muted,flexShrink:0}}>
              {i<3?medals[i]:i+1}
            </div>
            <HexAvatar name={emp.name||"U"} size={38}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                <span style={{color:G.text,fontWeight:700,fontSize:14,fontFamily:G.body}}>{emp.name}</span>
                <NeonBadge label={emp.rank} color={emp.rankColor}/>
              </div>
              <NeonProgress value={emp.onboardingProgress||0} height={4}/>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{color:emp.rankColor,fontWeight:900,fontSize:18,fontFamily:G.font}}>{emp.xp}</div>
              <div style={{color:G.muted,fontSize:10,fontFamily:G.font}}>XP</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{color:G.green,fontWeight:700,fontSize:14,fontFamily:G.font}}>{emp.completed}</div>
              <div style={{color:G.muted,fontSize:10,fontFamily:G.font}}>DONE</div>
            </div>
          </div>
        ))}
      </div>

      {/* XP Guide */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20,marginTop:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <div style={{width:3,height:16,background:G.purple}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>XP RANK SYSTEM</h2>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[
            {rank:"ROOKIE",xp:"0-199",color:G.green},
            {rank:"VETERAN",xp:"200-499",color:G.cyan},
            {rank:"ELITE",xp:"500-799",color:G.purple},
            {rank:"LEGEND",xp:"800+",color:G.orange},
          ].map((r,i)=>(
            <div key={i} style={{background:`${r.color}11`,border:`1px solid ${r.color}44`,borderRadius:8,padding:"8px 14px",flex:1,minWidth:100,textAlign:"center"}}>
              <NeonBadge label={r.rank} color={r.color}/>
              <div style={{color:G.muted,fontSize:11,marginTop:6,fontFamily:G.font}}>{r.xp} XP</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PDF REPORT ───────────────────────────────────────────────────────────────
function ReportsPage({employees,tasks}) {
  const [selected,setSelected]=useState("");
  const [generating,setGenerating]=useState(false);

  const generateReport = () => {
    if(!selected) return;
    setGenerating(true);
    const emp = employees.find(e=>e._id===selected);
    const empTasks = tasks.filter(t=>t.assignedTo?._id===selected);
    const completed = empTasks.filter(t=>t.status==="completed");
    const pending = empTasks.filter(t=>t.status==="pending");
    const inProgress = empTasks.filter(t=>t.status==="in_progress");
    const xp = completed.length * 100 + (emp?.onboardingProgress||0);

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Onboarding Report - ${emp?.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000; color: #e0e0ff; font-family: 'Rajdhani', sans-serif; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #00f5ff11, #bf00ff11); border: 1px solid #00f5ff33; border-radius: 16px; }
    .logo { font-family: 'Orbitron', monospace; font-size: 32px; font-weight: 900; color: #00f5ff; letter-spacing: 4px; text-shadow: 0 0 20px #00f5ff; }
    .subtitle { color: #444466; font-family: 'Orbitron', monospace; font-size: 11px; letter-spacing: 3px; margin-top: 6px; }
    .emp-name { font-family: 'Orbitron', monospace; font-size: 22px; color: #e0e0ff; margin-top: 16px; font-weight: 700; }
    .emp-detail { color: #64748b; font-size: 14px; margin-top: 4px; }
    .section { background: #0d0d1a; border: 1px solid #1a1a2e; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .section-title { font-family: 'Orbitron', monospace; font-size: 12px; color: #00f5ff; font-weight: 700; letter-spacing: 2px; margin-bottom: 16px; padding-left: 12px; border-left: 3px solid #00f5ff; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: #0d0d1a; border-radius: 10px; padding: 16px; text-align: center; }
    .stat-value { font-family: 'Orbitron', monospace; font-size: 28px; font-weight: 900; }
    .stat-label { color: #444466; font-size: 11px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .progress-bar { height: 8px; background: #111; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .task-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #1a1a2e; }
    .task-status { padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; font-family: 'Orbitron', monospace; letter-spacing: 1px; text-transform: uppercase; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: 'Orbitron', monospace; letter-spacing: 1px; }
    .footer { text-align: center; margin-top: 40px; color: #444466; font-size: 11px; font-family: 'Orbitron', monospace; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ONBOARD<span style="color:#bf00ff">IQ</span></div>
    <div class="subtitle">SMART EMPLOYEE ONBOARDING SYSTEM v2.0</div>
    <div class="emp-name">${emp?.name?.toUpperCase()}</div>
    <div class="emp-detail">${emp?.position||"N/A"} · ${emp?.department||"N/A"} · ${emp?.email}</div>
    <div style="margin-top:12px">
      <span class="badge" style="background:#00ff4115;color:#00ff41;border:1px solid #00ff4144">${emp?.status?.toUpperCase()||"ONBOARDING"}</span>
      <span class="badge" style="background:#00f5ff15;color:#00f5ff;border:1px solid #00f5ff44;margin-left:8px">${xp} XP EARNED</span>
    </div>
  </div>

  <div class="stats">
    <div class="stat-card" style="border:1px solid #00f5ff33">
      <div class="stat-value" style="color:#00f5ff">${emp?.onboardingProgress||0}%</div>
      <div class="stat-label">Progress</div>
      <div class="progress-bar"><div class="progress-fill" style="width:${emp?.onboardingProgress||0}%;background:linear-gradient(90deg,#00f5ff88,#00f5ff)"></div></div>
    </div>
    <div class="stat-card" style="border:1px solid #00ff4133">
      <div class="stat-value" style="color:#00ff41">${completed.length}</div>
      <div class="stat-label">Completed</div>
    </div>
    <div class="stat-card" style="border:1px solid #ffaa0033">
      <div class="stat-value" style="color:#ffaa00">${inProgress.length}</div>
      <div class="stat-label">In Progress</div>
    </div>
    <div class="stat-card" style="border:1px solid #66666633">
      <div class="stat-value" style="color:#666">${pending.length}</div>
      <div class="stat-label">Pending</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">COMPLETED MISSIONS (${completed.length})</div>
    ${completed.length===0?'<div style="color:#444466;text-align:center;padding:16px;font-size:12px">NO COMPLETED TASKS YET</div>':
      completed.map(t=>`
        <div class="task-item">
          <span style="font-size:18px">${categoryIcon[t.category]||"📌"}</span>
          <div style="flex:1">
            <div style="color:#e0e0ff;font-weight:600;font-size:14px">${t.title}</div>
            <div style="color:#444466;font-size:12px;margin-top:2px">${t.description||""}</div>
          </div>
          <span class="task-status" style="background:#00ff4115;color:#00ff41">DONE ✓</span>
        </div>
      `).join("")
    }
  </div>

  <div class="section">
    <div class="section-title">PENDING MISSIONS (${pending.length + inProgress.length})</div>
    ${[...inProgress,...pending].length===0?'<div style="color:#444466;text-align:center;padding:16px;font-size:12px">ALL MISSIONS COMPLETE!</div>':
      [...inProgress,...pending].map(t=>`
        <div class="task-item">
          <span style="font-size:18px">${categoryIcon[t.category]||"📌"}</span>
          <div style="flex:1">
            <div style="color:#e0e0ff;font-weight:600;font-size:14px">${t.title}</div>
            <div style="color:#444466;font-size:12px;margin-top:2px">Due: ${t.dueDate?.split("T")[0]||"No deadline"}</div>
          </div>
          <span class="task-status" style="background:${t.status==="in_progress"?"#00f5ff":"#666"}15;color:${t.status==="in_progress"?"#00f5ff":"#666"}">${t.status.replace("_"," ").toUpperCase()}</span>
        </div>
      `).join("")
    }
  </div>

  <div class="footer">
    GENERATED BY ONBOARDIQ SYSTEM · ${new Date().toLocaleDateString()} · CONFIDENTIAL
  </div>
</body>
</html>`;

    setTimeout(() => {
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${emp?.name?.replace(" ","_")}_Report_${new Date().toISOString().split("T")[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="REPORTS" color={G.green} icon="📄"/>

      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <div style={{width:3,height:16,background:G.green}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>GENERATE AGENT REPORT</h2>
        </div>

        <div style={{marginBottom:16}}>
          <label style={{color:G.muted,fontSize:11,display:"block",marginBottom:8,fontFamily:G.font,letterSpacing:2}}>SELECT AGENT</label>
          <SelectField value={selected} onChange={e=>setSelected(e.target.value)}>
            <option value="">-- Select Agent --</option>
            {employees.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
          </SelectField>
        </div>

        {selected && (
          <div style={{background:"#050510",border:`1px solid ${G.border}`,borderRadius:10,padding:16,marginBottom:16,animation:"fadeUp 0.3s ease"}}>
            {(() => {
              const emp = employees.find(e=>e._id===selected);
              const empTasks = tasks.filter(t=>t.assignedTo?._id===selected);
              return (
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <HexAvatar name={emp?.name||"U"} size={48}/>
                  <div style={{flex:1}}>
                    <div style={{color:G.text,fontWeight:700,fontSize:15,fontFamily:G.body}}>{emp?.name}</div>
                    <div style={{color:G.muted,fontSize:12,fontFamily:G.body}}>{emp?.position} · {emp?.department}</div>
                    <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                      <NeonBadge label={`${emp?.onboardingProgress||0}% Progress`} color={G.cyan}/>
                      <NeonBadge label={`${empTasks.filter(t=>t.status==="completed").length} Done`} color={G.green}/>
                      <NeonBadge label={`${empTasks.length} Total`} color={G.orange}/>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <GlowBtn color={G.green} size="lg" onClick={generateReport} disabled={!selected||generating} style={{borderRadius:10}}>
          {generating?"⏳ GENERATING...":"📄 DOWNLOAD REPORT"}
        </GlowBtn>

        <div style={{color:G.muted,fontSize:11,marginTop:12,fontFamily:G.body,textAlign:"center"}}>
          Report downloads as HTML file — open in browser to view/print as PDF
        </div>
      </div>

      {/* All Employees Quick View */}
      <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <div style={{width:3,height:16,background:G.cyan}}/>
          <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>ALL AGENTS SUMMARY</h2>
        </div>
        {employees.length===0?(
          <div style={{color:G.muted,textAlign:"center",padding:24,fontFamily:G.font,fontSize:12}}>NO AGENTS REGISTERED</div>
        ):employees.map((emp,i)=>{
          const empTasks=tasks.filter(t=>t.assignedTo?._id===emp._id);
          const done=empTasks.filter(t=>t.status==="completed").length;
          return (
            <div key={emp._id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#050510",border:`1px solid ${G.border}`,borderRadius:10,marginBottom:8,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
              <HexAvatar name={emp.name||"U"} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:G.text,fontWeight:700,fontSize:13,fontFamily:G.body}}>{emp.name}</div>
                <NeonProgress value={emp.onboardingProgress||0} height={4}/>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <NeonBadge label={`${emp.onboardingProgress||0}%`} color={G.cyan}/>
                <NeonBadge label={`${done}/${empTasks.length}`} color={G.green}/>
              </div>
              <GlowBtn size="sm" color={G.green} onClick={()=>{setSelected(emp._id);generateReport();}}>📄</GlowBtn>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function NotificationsPanel({show,onClose,notifications,clearAll}) {
  if(!show) return null;
  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:320,background:G.surface,border:`1px solid ${G.border}`,borderLeft:`1px solid ${G.cyan}33`,zIndex:200,display:"flex",flexDirection:"column",animation:"slideIn 0.3s ease",boxShadow:`-4px 0 20px ${G.cyan}11`}}>
      <div style={{padding:"20px 16px",borderBottom:`1px solid ${G.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:3,height:20,background:G.cyan}}/>
          <h2 style={{fontFamily:G.font,color:G.cyan,fontSize:13,fontWeight:700,letterSpacing:2}}>NOTIFICATIONS</h2>
        </div>
        <div style={{display:"flex",gap:8}}>
          {notifications.length>0&&<GlowBtn size="sm" color={G.red} onClick={clearAll}>CLEAR</GlowBtn>}
          <button onClick={onClose} className="game-btn" style={{background:`${G.red}15`,color:G.red,border:`1px solid ${G.red}33`,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>×</button>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto",padding:12}}>
        {notifications.length===0?(
          <div style={{textAlign:"center",padding:40,color:G.muted}}>
            <div style={{fontSize:40,marginBottom:12}}>🔔</div>
            <div style={{fontFamily:G.font,fontSize:11,letterSpacing:2}}>NO NOTIFICATIONS</div>
          </div>
        ):notifications.map((n,i)=>(
          <div key={n.id} style={{background:G.card,border:`1px solid ${n.type==="success"?G.green:n.type==="error"?G.red:G.cyan}33`,borderRadius:10,padding:"12px 14px",marginBottom:8,animation:`fadeUp 0.3s ease ${i*0.05}s both`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:16}}>{n.type==="success"?"✅":n.type==="error"?"❌":"⚡"}</span>
              <span style={{color:n.type==="success"?G.green:n.type==="error"?G.red:G.cyan,fontSize:10,fontFamily:G.font,fontWeight:700,letterSpacing:1}}>{n.type.toUpperCase()}</span>
              <span style={{color:G.muted,fontSize:10,fontFamily:G.body,marginLeft:"auto"}}>{n.time}</span>
            </div>
            <div style={{color:G.text,fontSize:13,fontFamily:G.body}}>{n.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({onLogin}) {
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
      onLogin(data);
    } catch(error) {
      setErr(error.response?.data?.message||"ACCESS DENIED");
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.body,position:"relative",overflow:"hidden",padding:20}}>
      <ParticleBackground/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 50%,#00f5ff08 0%,transparent 70%)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:420,animation:"fadeUp 0.6s ease"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:52,animation:"float 3s ease-in-out infinite",display:"block",marginBottom:14}}>⚡</div>
          <h1 style={{fontFamily:G.font,fontSize:28,fontWeight:900,color:G.cyan,letterSpacing:4,animation:"glitch 3s ease infinite",textShadow:`0 0 20px ${G.cyan}`}}>ONBOARD<span style={{color:G.purple}}>IQ</span></h1>
          <p style={{color:G.muted,fontSize:11,marginTop:8,letterSpacing:3,textTransform:"uppercase",fontFamily:G.font}}>Smart Employee System v2.0</p>
        </div>
        <div style={{background:G.card,border:`1px solid ${G.cyan}33`,borderRadius:16,padding:28,animation:"pulse-border 3s ease infinite"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <div style={{width:3,height:20,background:G.cyan}}/>
            <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>SYSTEM ACCESS</h2>
          </div>
          {err&&<div style={{background:`${G.red}15`,border:`1px solid ${G.red}44`,borderRadius:8,padding:"10px 14px",color:G.red,fontSize:12,marginBottom:14,fontFamily:G.font,letterSpacing:1,animation:"fadeUp 0.3s ease"}}>⛔ {err}</div>}
          <form onSubmit={handle}>
            <div style={{marginBottom:12}}>
              <label style={{color:G.muted,fontSize:10,display:"block",marginBottom:6,fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>User ID</label>
              <GlowInput value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Enter email"/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{color:G.muted,fontSize:10,display:"block",marginBottom:6,fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>Access Code</label>
              <GlowInput value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Enter password"/>
            </div>
            <button type="submit" disabled={loading} className="game-btn" style={{width:"100%",background:loading?"#111":`linear-gradient(135deg,${G.cyan}33,${G.purple}22)`,color:loading?G.muted:G.cyan,border:`1px solid ${loading?G.muted:G.cyan}`,borderRadius:8,padding:"12px",fontFamily:G.font,fontSize:12,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:2,transition:"all 0.3s"}}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span style={{display:"inline-block",width:14,height:14,border:`2px solid ${G.cyan}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>INITIALIZING...</span>:"⚡ INITIALIZE ACCESS"}
            </button>
          </form>
          <div style={{marginTop:16,background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,padding:10}}>
            <p style={{color:G.muted,fontSize:9,margin:"0 0 5px",fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>Demo Credentials</p>
            <p style={{color:G.cyan+"99",fontSize:11,margin:"2px 0",fontFamily:G.body}}>👑 admin@company.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({user,employees,tasks}) {
  const isAdmin=user.role==="admin"||user.role==="hr";
  const myTasks=tasks.filter(t=>t.assignedTo?._id===user._id);

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title={isAdmin?"COMMAND CENTER":`WELCOME, ${user.name?.split(" ")[0]?.toUpperCase()}`} color={G.cyan} icon="🏠"/>

      {isAdmin?(
        <>
          <div className="stat-grid" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
            {[
              {icon:"👥",label:"Total Agents",value:employees.length,color:G.cyan},
              {icon:"🔄",label:"Training",value:employees.filter(e=>e.status==="onboarding").length,color:G.orange},
              {icon:"✅",label:"Active",value:employees.filter(e=>e.status==="active").length,color:G.green},
              {icon:"📋",label:"Pending",value:tasks.filter(t=>t.status==="pending").length,color:G.red},
              {icon:"🏆",label:"Completed",value:tasks.filter(t=>t.status==="completed").length,color:G.purple},
            ].map((s,i)=>(
              <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"16px 18px",flex:1,minWidth:110,transition:"all 0.3s",animation:`fadeUp 0.5s ease ${i*0.1}s both`}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                <div style={{fontSize:24,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
                <div style={{color:G.muted,fontSize:10,marginTop:2,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <div style={{width:3,height:16,background:G.purple}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>AGENT PROGRESS</h2>
            </div>
            {employees.length===0?<div style={{color:G.muted,textAlign:"center",padding:20,fontFamily:G.font,fontSize:11,letterSpacing:2}}>NO AGENTS YET</div>:
              employees.map((emp,i)=>(
                <div key={emp._id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#050510",border:`1px solid ${G.border}`,borderRadius:10,marginBottom:8,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
                  <HexAvatar name={emp.name}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{color:G.text,fontWeight:700,fontSize:13,fontFamily:G.body}}>{emp.name}</span>
                      <NeonBadge label={emp.status} color={statusColor[emp.status]||G.cyan}/>
                    </div>
                    <div style={{color:G.muted,fontSize:11,marginBottom:5,fontFamily:G.body}}>{emp.position} · {emp.department}</div>
                    <NeonProgress value={emp.onboardingProgress||0}/>
                  </div>
                  <span style={{color:G.cyan,fontWeight:900,fontSize:14,fontFamily:G.font,flexShrink:0}}>{emp.onboardingProgress||0}%</span>
                </div>
              ))
            }
          </div>

          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:3,height:16,background:G.orange}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>RECENT MISSIONS</h2>
            </div>
            {tasks.slice(0,6).map((t,i)=>(
              <div key={t._id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${G.border}`,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                <span style={{fontSize:16}}>{categoryIcon[t.category]}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:G.text,fontSize:13,fontWeight:600,fontFamily:G.body,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                  <div style={{color:G.muted,fontSize:11,fontFamily:G.body}}>{t.assignedTo?.name||"Unknown"}</div>
                </div>
                <NeonBadge label={t.status.replace("_"," ")} color={taskStatusColor[t.status]}/>
              </div>
            ))}
          </div>
        </>
      ):(
        <>
          <div style={{background:`linear-gradient(135deg,${G.cyan}08,${G.purple}08)`,border:`1px solid ${G.cyan}33`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <HexAvatar name={user.name||"U"} size={56}/>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:G.font,color:G.text,fontSize:16,fontWeight:900,letterSpacing:2}}>{user.name?.toUpperCase()}</h2>
                <div style={{color:G.muted,fontSize:12,marginBottom:10,fontFamily:G.body}}>{user.department} · {user.position}</div>
                <NeonProgress value={user.onboardingProgress||0}/>
                <div style={{color:G.cyan,fontSize:11,marginTop:5,fontFamily:G.font,letterSpacing:1}}>{user.onboardingProgress||0}% MISSION PROGRESS</div>
              </div>
            </div>
          </div>
          <div className="stat-grid" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
            {[
              {icon:"✅",label:"Completed",value:myTasks.filter(t=>t.status==="completed").length,color:G.green},
              {icon:"⚡",label:"Active",value:myTasks.filter(t=>t.status==="in_progress").length,color:G.cyan},
              {icon:"📋",label:"Pending",value:myTasks.filter(t=>t.status==="pending").length,color:G.orange},
            ].map((s,i)=>(
              <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"16px 18px",flex:1,minWidth:100,transition:"all 0.3s"}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                <div style={{fontSize:24,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
                <div style={{color:G.muted,fontSize:10,marginTop:2,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:3,height:16,background:G.cyan}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:2}}>MY MISSIONS</h2>
            </div>
            {myTasks.length===0?<div style={{color:G.muted,textAlign:"center",padding:20,fontFamily:G.font,fontSize:11,letterSpacing:2}}>NO MISSIONS ASSIGNED YET</div>:
              myTasks.map((t,i)=>(
                <div key={t._id} style={{display:"flex",gap:12,padding:12,background:"#050510",border:`1px solid ${G.border}`,borderRadius:10,marginBottom:8,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
                  <span style={{fontSize:20,marginTop:2}}>{categoryIcon[t.category]}</span>
                  <div style={{flex:1}}>
                    <div style={{color:G.text,fontSize:13,fontWeight:700,fontFamily:G.body}}>{t.title}</div>
                    <div style={{color:G.muted,fontSize:12,marginTop:2,fontFamily:G.body}}>{t.description}</div>
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                      <NeonBadge label={t.status.replace("_"," ")} color={taskStatusColor[t.status]}/>
                      <NeonBadge label={t.priority} color={priorityColor[t.priority]}/>
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
function EmployeesPage({addToast,addNotification,employees,setEmployees}) {
  const [showForm,setShowForm]=useState(false);
  const [search,setSearch]=useState("");
  const [confirm,setConfirm]=useState(null);
  const [loading,setLoading]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",department:"",position:"",phone:""});

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
      addNotification(`New agent ${form.name} deployed to system`,"success");
    } catch(err) {
      addToast(err.response?.data?.message||"Failed to add agent","error");
    }
    setLoading(false);
  };

  const remove=async()=>{
    try {
      await api.deleteEmployee(confirm);
      const emp=employees.find(e=>e._id===confirm);
      setEmployees(employees.filter(e=>e._id!==confirm));
      addToast("Agent removed","error");
      addNotification(`Agent ${emp?.name} removed from system`,"error");
    } catch(err) {
      addToast("Failed to remove","error");
    }
    setConfirm(null);
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <ConfirmPopup show={!!confirm} message="Remove this agent permanently? This cannot be undone." onConfirm={remove} onCancel={()=>setConfirm(null)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <SectionHeader title="AGENT ROSTER" color={G.green} icon="👥"/>
        <GlowBtn onClick={()=>setShowForm(!showForm)} color={G.green}>+ DEPLOY AGENT</GlowBtn>
      </div>

      {showForm&&(
        <div style={{background:G.card,border:`1px solid ${G.green}44`,borderRadius:12,padding:20,marginBottom:16,animation:"fadeUp 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:3,height:16,background:G.green}}/>
            <h3 style={{fontFamily:G.font,color:G.green,fontSize:11,letterSpacing:2}}>NEW AGENT REGISTRATION</h3>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <GlowInput placeholder="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <GlowInput placeholder="Email *" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <GlowInput placeholder="Password *" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
            <GlowInput placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/>
            <GlowInput placeholder="Position" value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/>
            <GlowInput placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <GlowBtn color={G.green} onClick={add} disabled={loading}>{loading?"DEPLOYING...":"CONFIRM DEPLOY"}</GlowBtn>
            <GlowBtn color={G.muted} onClick={()=>setShowForm(false)}>ABORT</GlowBtn>
          </div>
        </div>
      )}

      <div style={{marginBottom:14}}>
        <GlowInput placeholder="🔍  SEARCH AGENTS..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div className="emp-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
        {filtered.map((emp,i)=>(
          <div key={emp._id} className="emp-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18,position:"relative",transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
            <button onClick={()=>setConfirm(emp._id)} className="game-btn" style={{position:"absolute",top:10,right:10,background:`${G.red}15`,border:`1px solid ${G.red}33`,color:G.red,borderRadius:6,width:26,height:26,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <HexAvatar name={emp.name||"U"} size={44}/>
              <div>
                <div style={{color:G.text,fontWeight:700,fontSize:14,fontFamily:G.body}}>{emp.name}</div>
                <div style={{color:G.muted,fontSize:11,fontFamily:G.body}}>{emp.position||"N/A"}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              <NeonBadge label={emp.status} color={statusColor[emp.status]||G.cyan}/>
              <NeonBadge label={emp.department||"N/A"} color={G.purple}/>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{color:G.muted,fontSize:10,fontFamily:G.font,letterSpacing:1}}>PROGRESS</span>
                <span style={{color:G.cyan,fontSize:11,fontWeight:900,fontFamily:G.font}}>{emp.onboardingProgress||0}%</span>
              </div>
              <NeonProgress value={emp.onboardingProgress||0}/>
            </div>
            <div style={{color:G.muted,fontSize:11,fontFamily:G.body}}>📱 {emp.phone||"N/A"} · 📅 {emp.joinDate?.split("T")[0]||"N/A"}</div>
          </div>
        ))}
        {filtered.length===0&&<div style={{color:G.muted,textAlign:"center",padding:40,fontFamily:G.font,fontSize:11,letterSpacing:2,gridColumn:"1/-1"}}>NO AGENTS FOUND</div>}
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function TasksPage({user,tasks,setTasks,employees,addToast,addNotification}) {
  const [filter,setFilter]=useState("all");
  const [showForm,setShowForm]=useState(false);
  const [missionComplete,setMissionComplete]=useState(false);
  const [completedEmp,setCompletedEmp]=useState("");
  const [form,setForm]=useState({title:"",description:"",assignedTo:"",priority:"medium",category:"other",dueDate:""});

  const isAdmin=user.role==="admin"||user.role==="hr";
  const visible=isAdmin?tasks:tasks.filter(t=>t.assignedTo?._id===user._id);
  const filtered=filter==="all"?visible:visible.filter(t=>t.status===filter);

  const updateStatus=async(id,status)=>{
    try {
      const {data}=await api.updateTask(id,{status});
      setTasks(tasks.map(t=>t._id===id?data:t));
      if(status==="completed"){
        const task=tasks.find(t=>t._id===id);
        setCompletedEmp(task?.assignedTo?.name||"");
        setMissionComplete(true);
        addToast("MISSION COMPLETE! +100 XP","success");
        addNotification(`Mission "${task?.title}" completed by ${task?.assignedTo?.name}`,"success");
      } else {
        addToast("Mission status updated!","info");
      }
    } catch(err) {
      addToast("Failed to update task","error");
    }
  };

  const addTask=async()=>{
    if(!form.title||!form.assignedTo){addToast("Fill all required fields!","error");return;}
    try {
      const {data}=await api.addTask(form);
      setTasks([...tasks,data]);
      const emp=employees.find(e=>e._id===form.assignedTo);
      setForm({title:"",description:"",assignedTo:"",priority:"medium",category:"other",dueDate:""});
      setShowForm(false);
      addToast("New mission created!","success");
      addNotification(`New mission assigned to ${emp?.name||"agent"}`,"info");
    } catch(err) {
      addToast("Failed to create task","error");
    }
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <MissionComplete show={missionComplete} onClose={()=>setMissionComplete(false)} empName={completedEmp}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <SectionHeader title="MISSION CONTROL" color={G.orange} icon="📋"/>
        {isAdmin&&<GlowBtn onClick={()=>setShowForm(!showForm)} color={G.orange}>+ NEW MISSION</GlowBtn>}
      </div>

      {showForm&&(
        <div style={{background:G.card,border:`1px solid ${G.orange}44`,borderRadius:12,padding:20,marginBottom:16,animation:"fadeUp 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <div style={{width:3,height:16,background:G.orange}}/>
            <h3 style={{fontFamily:G.font,color:G.orange,fontSize:11,letterSpacing:2}}>MISSION BRIEFING</h3>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <GlowInput placeholder="Mission title *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
            <SelectField value={form.assignedTo} onChange={e=>setForm({...form,assignedTo:e.target.value})}>
              <option value="">Select Agent *</option>
              {employees.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
            </SelectField>
            <textarea placeholder="Mission description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
              style={{gridColumn:"1/-1",background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 12px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,resize:"vertical",minHeight:60}}/>
            <SelectField value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
              {["low","medium","high"].map(p=><option key={p} value={p}>{p}</option>)}
            </SelectField>
            <SelectField value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
              {["documentation","training","setup","meeting","other"].map(c=><option key={c} value={c}>{c}</option>)}
            </SelectField>
            <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} style={{background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 12px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,width:"100%"}}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}>
            <GlowBtn color={G.orange} onClick={addTask}>LAUNCH MISSION</GlowBtn>
            <GlowBtn color={G.muted} onClick={()=>setShowForm(false)}>ABORT</GlowBtn>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["all","pending","in_progress","completed"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className="game-btn" style={{background:filter===f?`${G.cyan}22`:"transparent",color:filter===f?G.cyan:G.muted,border:`1px solid ${filter===f?G.cyan+"55":G.border}`,borderRadius:20,padding:"5px 14px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:G.font,letterSpacing:1,transition:"all 0.2s"}}>
            {f.replace("_"," ").toUpperCase()} ({(f==="all"?visible:visible.filter(t=>t.status===f)).length})
          </button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((t,i)=>(
          <div key={t._id} className="game-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:16,display:"flex",gap:12,alignItems:"flex-start",transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.06}s both`}}>
            <span style={{fontSize:20,marginTop:2}}>{categoryIcon[t.category]}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div style={{minWidth:0}}>
                  <div style={{color:G.text,fontWeight:700,fontSize:14,fontFamily:G.body,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                  <div style={{color:G.muted,fontSize:12,marginTop:2,fontFamily:G.body}}>{t.description}</div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",flexShrink:0}}>
                  <NeonBadge label={t.status.replace("_"," ")} color={taskStatusColor[t.status]}/>
                  <NeonBadge label={t.priority} color={priorityColor[t.priority]}/>
                </div>
              </div>
              <div style={{display:"flex",gap:12,marginTop:10,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:G.muted,fontSize:11,fontFamily:G.body}}>👤 {t.assignedTo?.name||"Unknown"}</span>
                {t.dueDate&&<span style={{color:G.muted,fontSize:11,fontFamily:G.body}}>📅 {t.dueDate?.split("T")[0]}</span>}
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  {t.status==="pending"&&<GlowBtn size="sm" color={G.cyan} onClick={()=>updateStatus(t._id,"in_progress")}>▶ START</GlowBtn>}
                  {t.status==="in_progress"&&<GlowBtn size="sm" color={G.green} onClick={()=>updateStatus(t._id,"completed")}>✓ COMPLETE</GlowBtn>}
                  {t.status==="completed"&&<span style={{color:G.green,fontSize:11,fontWeight:700,fontFamily:G.font,letterSpacing:1}}>✓ DONE</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:G.muted,fontFamily:G.font,fontSize:11,letterSpacing:2}}>NO MISSIONS FOUND</div>}
      </div>
    </div>
  );
}

// ─── WORKFLOWS ────────────────────────────────────────────────────────────────
function WorkflowsPage({employees,addToast,addNotification}) {
  const [workflows,setWorkflows]=useState([]);
  const [selected,setSelected]=useState(null);
  const [assignEmp,setAssignEmp]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    api.getWorkflows()
      .then(({data})=>setWorkflows(data))
      .catch(()=>addToast("Failed to load workflows","error"))
      .finally(()=>setLoading(false));
  },[]);

  const assign=async(wf)=>{
    if(!assignEmp){addToast("Select an agent first!","error");return;}
    try {
      await api.assignWorkflow(wf._id,assignEmp);
      const emp=employees.find(e=>e._id===assignEmp);
      addToast(`${wf.name} assigned — ${wf.steps?.length} missions created!`,"success");
      addNotification(`Workflow "${wf.name}" assigned to ${emp?.name}`,"success");
      setSelected(null);setAssignEmp("");
    } catch(err) {
      addToast("Failed to assign workflow","error");
    }
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <SectionHeader title="OPERATION TEMPLATES" color={G.purple} icon="🔄"/>
      {loading?<Loader/>:workflows.length===0?(
        <div style={{textAlign:"center",padding:60,color:G.muted}}>
          <div style={{fontSize:48,marginBottom:16}}>📋</div>
          <div style={{fontFamily:G.font,letterSpacing:2,fontSize:12}}>NO WORKFLOWS FOUND</div>
          <div style={{color:G.muted,fontSize:11,marginTop:8,fontFamily:G.body}}>Add workflows via Thunder Client API</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
          {workflows.map((wf,i)=>(
            <div key={wf._id} className="game-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20,transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <h3 style={{fontFamily:G.font,color:G.text,fontSize:12,fontWeight:700,letterSpacing:1,marginBottom:6}}>{wf.name}</h3>
                  <NeonBadge label={wf.department||"All"} color={G.purple}/>
                </div>
                <div style={{background:`${G.cyan}15`,color:G.cyan,border:`1px solid ${G.cyan}44`,borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:900,fontFamily:G.font}}>{wf.steps?.length||0} OPS</div>
              </div>
              <p style={{color:G.muted,fontSize:12,margin:"0 0 12px",lineHeight:1.5,fontFamily:G.body}}>{wf.description}</p>
              <div style={{marginBottom:14}}>
                {wf.steps?.map((s,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${G.border}`}}>
                    <div style={{width:18,height:18,borderRadius:4,background:`${G.cyan}15`,border:`1px solid ${G.cyan}33`,color:G.cyan,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontFamily:G.font,flexShrink:0}}>{s.order}</div>
                    <span style={{fontSize:13}}>{categoryIcon[s.category]}</span>
                    <span style={{color:G.text,fontSize:12,flex:1,fontFamily:G.body}}>{s.title}</span>
                    <span style={{color:G.muted,fontSize:10,fontFamily:G.font}}>{s.estimatedDays}D</span>
                  </div>
                ))}
              </div>
              <GlowBtn style={{width:"100%",borderRadius:8}} onClick={()=>setSelected(selected===wf._id?null:wf._id)}>⚡ ASSIGN OPERATION</GlowBtn>
              {selected===wf._id&&(
                <div style={{marginTop:10,display:"flex",gap:8,animation:"fadeUp 0.3s ease"}}>
                  <SelectField value={assignEmp} onChange={e=>setAssignEmp(e.target.value)}>
                    <option value="">Select Agent</option>
                    {employees.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
                  </SelectField>
                  <GlowBtn color={G.green} size="sm" onClick={()=>assign(wf)}>GO</GlowBtn>
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
  {key:"dashboard",label:"COMMAND",icon:"🏠"},
  {key:"employees",label:"AGENTS",icon:"👥",admin:true},
  {key:"tasks",label:"MISSIONS",icon:"📋"},
  {key:"workflows",label:"OPS",icon:"🔄",admin:true},
  {key:"analytics",label:"ANALYTICS",icon:"📊",admin:true},
  {key:"leaderboard",label:"RANKS",icon:"🏆"},
  {key:"reports",label:"REPORTS",icon:"📄",admin:true},
];

function Layout({user,onLogout}) {
  const [page,setPage]=useState("dashboard");
  const [tasks,setTasks]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [toasts,setToasts]=useState([]);
  const [notifications,setNotifications]=useState([]);
  const [showNotifs,setShowNotifs]=useState(false);
  const [loading,setLoading]=useState(true);

  const addToast=(message,type="info")=>{
    const id=Date.now();
    setToasts(prev=>[...prev,{id,message,type}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),3500);
  };

  const addNotification=(message,type="info")=>{
    const id=Date.now();
    const time=new Date().toLocaleTimeString();
    setNotifications(prev=>[{id,message,type,time},...prev].slice(0,20));
  };

  useEffect(()=>{
    const isAdmin=user.role==="admin"||user.role==="hr";
    Promise.all([
      api.getTasks(),
      isAdmin?api.getEmployees():Promise.resolve({data:[]}),
    ]).then(([tr,er])=>{
      setTasks(tr.data);
      setEmployees(er.data);
      addNotification("System initialized successfully","success");
    }).catch(()=>addToast("Failed to load data","error"))
      .finally(()=>setLoading(false));
  },[]);

  const navItems=NAV.filter(n=>!n.admin||user.role==="admin"||user.role==="hr");
  const unreadCount=notifications.length;

  return (
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:G.body,display:"flex",position:"relative"}}>
      <ParticleBackground/>
      <Toast toasts={toasts}/>
      <NotificationsPanel show={showNotifs} onClose={()=>setShowNotifs(false)} notifications={notifications} clearAll={()=>setNotifications([])}/>

      {/* Sidebar */}
      <div className="sidebar" style={{width:190,background:G.surface,borderRight:`1px solid ${G.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:100}}>
        <div style={{padding:"18px 14px 14px",borderBottom:`1px solid ${G.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:32,height:32,background:`${G.cyan}15`,border:`1px solid ${G.cyan}44`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>⚡</div>
            <div className="logo-text">
              <div style={{fontFamily:G.font,color:G.cyan,fontWeight:900,fontSize:13,letterSpacing:2}}>ONBOARD</div>
              <div style={{fontFamily:G.font,color:G.purple,fontWeight:900,fontSize:13,letterSpacing:2,marginTop:-3}}>IQ</div>
            </div>
          </div>
          <div style={{color:G.muted,fontSize:8,marginTop:5,fontFamily:G.font,letterSpacing:2}} className="logo-text">SYSTEM v2.0</div>
        </div>

        <nav style={{flex:1,padding:"12px 8px",overflow:"auto"}}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>setPage(item.key)} className={`nav-btn ${page===item.key?"active":""}`}
              style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:8,border:"none",borderLeft:`2px solid ${page===item.key?G.cyan:"transparent"}`,background:"transparent",color:page===item.key?G.cyan:G.muted,cursor:"pointer",fontSize:11,fontWeight:700,marginBottom:2,textAlign:"left",fontFamily:G.font,letterSpacing:1,transition:"all 0.2s"}}>
              <span style={{fontSize:14,flexShrink:0}}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{padding:"12px 8px",borderTop:`1px solid ${G.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,marginBottom:8}}>
            <HexAvatar name={user.name||"U"} size={28}/>
            <div style={{minWidth:0}} className="logo-text">
              <div style={{color:G.text,fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:G.body}}>{user.name}</div>
              <div style={{color:G.muted,fontSize:9,textTransform:"uppercase",fontFamily:G.font,letterSpacing:1}}>{user.role}</div>
            </div>
          </div>

          {/* Notification Bell */}
          <button onClick={()=>setShowNotifs(!showNotifs)} className="game-btn" style={{width:"100%",background:`${G.cyan}10`,color:G.cyan,border:`1px solid ${G.cyan}33`,borderRadius:8,padding:"8px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:G.font,letterSpacing:1,marginBottom:6,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            🔔 <span className="nav-label">ALERTS</span>
            {unreadCount>0&&<span className="notif-badge">{unreadCount>9?"9+":unreadCount}</span>}
          </button>

          <button onClick={onLogout} className="game-btn" style={{width:"100%",background:`${G.red}10`,color:G.red,border:`1px solid ${G.red}33`,borderRadius:8,padding:"8px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:G.font,letterSpacing:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            ⏻ <span className="nav-label">DISCONNECT</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="main-content" style={{marginLeft:190,flex:1,padding:"24px 24px 40px",maxWidth:"calc(100vw - 190px)",position:"relative",zIndex:1}}>
        {loading?<Loader/>:(
          <>
            {page==="dashboard"&&<Dashboard user={user} employees={employees} tasks={tasks}/>}
            {page==="employees"&&<EmployeesPage addToast={addToast} addNotification={addNotification} employees={employees} setEmployees={setEmployees}/>}
            {page==="tasks"&&<TasksPage user={user} tasks={tasks} setTasks={setTasks} employees={employees} addToast={addToast} addNotification={addNotification}/>}
            {page==="workflows"&&<WorkflowsPage employees={employees} addToast={addToast} addNotification={addNotification}/>}
            {page==="analytics"&&<AnalyticsPage employees={employees} tasks={tasks}/>}
            {page==="leaderboard"&&<LeaderboardPage employees={employees} tasks={tasks}/>}
            {page==="reports"&&<ReportsPage employees={employees} tasks={tasks}/>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(()=>{
    try { const s=localStorage.getItem('user'); return s?JSON.parse(s):null; } catch{return null;}
  });
  const logout=()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };
  return (
    <>
      <style>{css}</style>
      {user?<Layout user={user} onLogout={logout}/>:<LoginPage onLogin={setUser}/>}
    </>
  );
}
