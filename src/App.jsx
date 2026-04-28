import { useState, useEffect } from "react";
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
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  getEmployees: () => API.get('/employees'),
  addEmployee: (data) => API.post('/employees', data),
  deleteEmployee: (id) => API.delete(`/employees/${id}`),
  getTasks: () => API.get('/tasks'),
  addTask: (data) => API.post('/tasks', data),
  updateTask: (id, data) => API.put(`/tasks/${id}`, data),
  getWorkflows: () => API.get('/workflows'),
  assignWorkflow: (id, empId) => API.post(`/workflows/${id}/assign/${empId}`),
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const statusColor = { active:"#00ff41", onboarding:"#ffaa00", inactive:"#ff0040" };
const priorityColor = { high:"#ff0040", medium:"#ffaa00", low:"#00ff41" };
const taskStatusColor = { pending:"#666", in_progress:"#00f5ff", completed:"#00ff41", overdue:"#ff0040" };
const categoryIcon = { documentation:"📄", training:"📚", setup:"⚙️", meeting:"🤝", other:"📌" };

const G = {
  bg:"#000000", surface:"#0a0a0f", card:"#0d0d1a", border:"#1a1a2e",
  cyan:"#00f5ff", purple:"#bf00ff", green:"#00ff41", orange:"#ffaa00",
  red:"#ff0040", text:"#e0e0ff", muted:"#444466",
  font:"'Orbitron', monospace", body:"'Rajdhani', sans-serif",
};

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
  @keyframes float{0%,100%{transform:translateY(0px);}50%{transform:translateY(-6px);}}
  @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes neonPulse{0%,100%{filter:drop-shadow(0 0 4px #00f5ff);}50%{filter:drop-shadow(0 0 12px #00f5ff);}}
  @keyframes toast-in{from{transform:translateX(100%);opacity:0;}to{transform:translateX(0);opacity:1;}}
  @keyframes pulse-border{0%,100%{box-shadow:0 0 5px #00f5ff44;}50%{box-shadow:0 0 20px #00f5ff88;}}
  .nav-btn:hover{background:#00f5ff11!important;color:#00f5ff!important;border-left-color:#00f5ff!important;}
  .nav-btn.active{background:#00f5ff15!important;color:#00f5ff!important;border-left-color:#00f5ff!important;}
  .game-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px #00f5ff22!important;border-color:#00f5ff44!important;}
  .game-btn:hover{transform:scale(1.05);filter:brightness(1.2);}
  .game-btn:active{transform:scale(0.96);}
  .emp-card:hover{border-color:#00f5ff66!important;box-shadow:0 0 20px #00f5ff22!important;}
`;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function ParticleBackground() {
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {[...Array(20)].map((_,i)=>(
        <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,width:Math.random()>0.5?2:1,height:Math.random()>0.5?2:1,background:i%3===0?G.cyan:i%3===1?G.purple:G.green,borderRadius:"50%",animation:`float ${3+Math.random()*4}s ease-in-out infinite`,animationDelay:`${Math.random()*4}s`,opacity:0.3+Math.random()*0.4}}/>
      ))}
    </div>
  );
}

function Toast({toasts}) {
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:10}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:G.card,border:`1px solid ${t.type==="success"?G.green:t.type==="error"?G.red:G.cyan}`,borderRadius:8,padding:"12px 18px",color:G.text,fontSize:14,fontFamily:G.body,fontWeight:600,boxShadow:`0 0 20px ${t.type==="success"?G.green:t.type==="error"?G.red:G.cyan}44`,animation:"toast-in 0.3s ease",display:"flex",alignItems:"center",gap:10,minWidth:280}}>
          <span>{t.type==="success"?"✅":t.type==="error"?"❌":"⚡"}</span>{t.message}
        </div>
      ))}
    </div>
  );
}

function MissionComplete({show,onClose}) {
  if(!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{textAlign:"center",animation:"fadeUp 0.4s ease"}}>
        <div style={{fontSize:80,animation:"float 2s ease-in-out infinite"}}>🏆</div>
        <div style={{fontFamily:G.font,fontSize:42,fontWeight:900,color:G.green,animation:"glitch 0.5s ease infinite",letterSpacing:4,marginTop:16}}>MISSION COMPLETE</div>
        <div style={{color:G.cyan,fontSize:18,fontFamily:G.body,marginTop:8,letterSpacing:2}}>+ 100 XP EARNED</div>
        <div style={{color:G.muted,fontSize:13,marginTop:20,fontFamily:G.body}}>Click anywhere to continue</div>
      </div>
    </div>
  );
}

function ConfirmPopup({show,message,onConfirm,onCancel}) {
  if(!show) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"#000000dd",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:G.card,border:`1px solid ${G.red}`,borderRadius:16,padding:32,textAlign:"center",animation:"fadeUp 0.3s ease",boxShadow:`0 0 40px ${G.red}44`,maxWidth:380}}>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <div style={{fontFamily:G.font,fontSize:18,color:G.red,fontWeight:700,marginBottom:8,letterSpacing:2}}>WARNING</div>
        <div style={{color:G.text,fontSize:14,fontFamily:G.body,marginBottom:24,lineHeight:1.6}}>{message}</div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button onClick={onConfirm} className="game-btn" style={{background:`linear-gradient(135deg,${G.red},#aa0030)`,color:"#fff",border:"none",borderRadius:8,padding:"10px 24px",fontFamily:G.font,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>CONFIRM</button>
          <button onClick={onCancel} className="game-btn" style={{background:"transparent",color:G.muted,border:`1px solid ${G.muted}`,borderRadius:8,padding:"10px 24px",fontFamily:G.font,fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

function NeonBadge({label,color}) {
  return <span style={{background:color+"15",color,border:`1px solid ${color}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:G.font,boxShadow:`0 0 6px ${color}33`}}>{label}</span>;
}

function GlowInput({placeholder,value,onChange,type="text"}) {
  const [focused,setFocused]=useState(false);
  return <input placeholder={placeholder} value={value} onChange={onChange} type={type} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{width:"100%",background:"#050510",border:`1px solid ${focused?G.cyan:G.border}`,borderRadius:8,padding:"11px 14px",color:G.text,fontSize:14,outline:"none",fontFamily:G.body,boxSizing:"border-box",transition:"all 0.3s",boxShadow:focused?`0 0 15px ${G.cyan}33`:"none"}}/>;
}

function GlowBtn({children,onClick,color=G.cyan,style={},size="md",disabled=false}) {
  return <button onClick={onClick} disabled={disabled} className="game-btn" style={{background:`linear-gradient(135deg,${color}22,${color}11)`,color:disabled?G.muted:color,border:`1px solid ${disabled?G.muted:color}66`,borderRadius:8,padding:size==="sm"?"6px 14px":size==="lg"?"13px 0":"10px 20px",fontFamily:G.font,fontSize:size==="sm"?11:12,fontWeight:700,cursor:disabled?"not-allowed":"pointer",letterSpacing:1,transition:"all 0.2s",boxShadow:`0 0 10px ${color}22`,width:size==="lg"?"100%":"auto",opacity:disabled?0.5:1,...style}}>{children}</button>;
}

function HexAvatar({name,size=40}) {
  const colors=[G.cyan,G.purple,G.green,G.orange,G.red];
  const c=colors[(name||"U").charCodeAt(0)%colors.length];
  return <div style={{width:size,height:size,background:`${c}22`,border:`2px solid ${c}66`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:c,fontWeight:900,fontSize:size*0.38,fontFamily:G.font,flexShrink:0,boxShadow:`0 0 10px ${c}33`}}>{(name||"U")[0]}</div>;
}

function NeonProgress({value}) {
  const color=value===100?G.green:value>60?G.cyan:value>30?G.orange:G.red;
  return <div style={{height:6,background:"#111",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:(value||0)+"%",background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:3,transition:"width 0.8s ease",boxShadow:`0 0 8px ${color}`}}/></div>;
}

function Loader() {
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60}}><div style={{width:40,height:40,border:`3px solid ${G.cyan}33`,borderTopColor:G.cyan,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/></div>;
}

function SelectField({value,onChange,children}) {
  return <select value={value} onChange={onChange} style={{background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 12px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,width:"100%"}}>{children}</select>;
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
      setErr(error.response?.data?.message||"ACCESS DENIED — Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:G.body,position:"relative",overflow:"hidden"}}>
      <ParticleBackground/>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 50%,#00f5ff08 0%,transparent 70%)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth:420,padding:"0 20px",animation:"fadeUp 0.6s ease"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:56,animation:"float 3s ease-in-out infinite",display:"block",marginBottom:16}}>⚡</div>
          <h1 style={{fontFamily:G.font,fontSize:32,fontWeight:900,color:G.cyan,letterSpacing:4,animation:"glitch 3s ease infinite",textShadow:`0 0 20px ${G.cyan}`}}>ONBOARD<span style={{color:G.purple}}>IQ</span></h1>
          <p style={{color:G.muted,fontSize:12,marginTop:8,letterSpacing:3,textTransform:"uppercase",fontFamily:G.font}}>Smart Employee System v2.0</p>
        </div>
        <div style={{background:G.card,border:`1px solid ${G.cyan}33`,borderRadius:16,padding:32,animation:"pulse-border 3s ease infinite"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
            <div style={{width:3,height:20,background:G.cyan}}/>
            <h2 style={{fontFamily:G.font,color:G.text,fontSize:14,fontWeight:700,letterSpacing:2}}>SYSTEM ACCESS</h2>
          </div>
          {err&&<div style={{background:`${G.red}15`,border:`1px solid ${G.red}44`,borderRadius:8,padding:"10px 14px",color:G.red,fontSize:12,marginBottom:16,fontFamily:G.font,letterSpacing:1,animation:"fadeUp 0.3s ease"}}>⛔ {err}</div>}
          <form onSubmit={handle}>
            <div style={{marginBottom:14}}>
              <label style={{color:G.muted,fontSize:11,display:"block",marginBottom:6,fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>User ID</label>
              <GlowInput value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Enter email"/>
            </div>
            <div style={{marginBottom:24}}>
              <label style={{color:G.muted,fontSize:11,display:"block",marginBottom:6,fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>Access Code</label>
              <GlowInput value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="Enter password"/>
            </div>
            <button type="submit" disabled={loading} className="game-btn" style={{width:"100%",background:loading?"#111":`linear-gradient(135deg,${G.cyan}33,${G.purple}22)`,color:loading?G.muted:G.cyan,border:`1px solid ${loading?G.muted:G.cyan}`,borderRadius:8,padding:"13px",fontFamily:G.font,fontSize:13,fontWeight:700,cursor:loading?"not-allowed":"pointer",letterSpacing:2,transition:"all 0.3s"}}>
              {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><span style={{display:"inline-block",width:14,height:14,border:`2px solid ${G.cyan}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>INITIALIZING...</span>:"⚡ INITIALIZE ACCESS"}
            </button>
          </form>
          <div style={{marginTop:20,background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,padding:12}}>
            <p style={{color:G.muted,fontSize:10,margin:"0 0 6px",fontFamily:G.font,letterSpacing:2,textTransform:"uppercase"}}>Demo Credentials</p>
            <p style={{color:G.cyan+"99",fontSize:12,margin:"3px 0",fontFamily:G.body}}>👑 admin@company.com / admin123</p>
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
      <div style={{marginBottom:28,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:4,height:32,background:G.cyan,boxShadow:`0 0 10px ${G.cyan}`}}/>
        <div>
          <h1 style={{fontFamily:G.font,color:G.cyan,fontSize:22,fontWeight:900,letterSpacing:3}}>{isAdmin?"COMMAND CENTER":`WELCOME, ${user.name?.split(" ")[0]?.toUpperCase()}`}</h1>
          <p style={{color:G.muted,fontSize:12,marginTop:2,letterSpacing:2,textTransform:"uppercase"}}>{isAdmin?"System Overview":"Agent Dashboard"}</p>
        </div>
      </div>

      {isAdmin?(
        <>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:24}}>
            {[
              {icon:"👥",label:"Total Agents",value:employees.length,color:G.cyan},
              {icon:"🔄",label:"Training",value:employees.filter(e=>e.status==="onboarding").length,color:G.orange},
              {icon:"✅",label:"Active",value:employees.filter(e=>e.status==="active").length,color:G.green},
              {icon:"📋",label:"Pending",value:tasks.filter(t=>t.status==="pending").length,color:G.red},
              {icon:"🏆",label:"Completed",value:tasks.filter(t=>t.status==="completed").length,color:G.purple},
            ].map((s,i)=>(
              <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"18px 20px",flex:1,minWidth:120,transition:"all 0.3s",animation:`fadeUp 0.5s ease ${i*0.1}s both`}}>
                <div style={{fontSize:26,marginBottom:8}}>{s.icon}</div>
                <div style={{fontSize:28,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
                <div style={{color:G.muted,fontSize:11,marginTop:4,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
              <div style={{width:3,height:16,background:G.purple}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>AGENT PROGRESS MONITOR</h2>
            </div>
            {employees.length===0?<div style={{color:G.muted,textAlign:"center",padding:24,fontFamily:G.font,letterSpacing:2}}>NO AGENTS REGISTERED YET</div>:
              employees.map((emp,i)=>(
                <div key={emp._id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",background:"#050510",border:`1px solid ${G.border}`,borderRadius:10,marginBottom:8,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
                  <HexAvatar name={emp.name}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{color:G.text,fontWeight:700,fontSize:14,fontFamily:G.body}}>{emp.name}</span>
                      <NeonBadge label={emp.status} color={statusColor[emp.status]||G.cyan}/>
                    </div>
                    <div style={{color:G.muted,fontSize:12,marginBottom:6,fontFamily:G.body}}>{emp.position} · {emp.department}</div>
                    <NeonProgress value={emp.onboardingProgress||0}/>
                  </div>
                  <span style={{color:G.cyan,fontWeight:900,fontSize:16,fontFamily:G.font,flexShrink:0}}>{emp.onboardingProgress||0}%</span>
                </div>
              ))
            }
          </div>
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <div style={{width:3,height:16,background:G.orange}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>RECENT MISSIONS</h2>
            </div>
            {tasks.slice(0,6).map((t,i)=>(
              <div key={t._id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${G.border}`,animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
                <span style={{fontSize:18}}>{categoryIcon[t.category]}</span>
                <div style={{flex:1}}>
                  <div style={{color:G.text,fontSize:13,fontWeight:600,fontFamily:G.body}}>{t.title}</div>
                  <div style={{color:G.muted,fontSize:11,fontFamily:G.body}}>{t.assignedTo?.name||"Unknown"}</div>
                </div>
                <NeonBadge label={t.status.replace("_"," ")} color={taskStatusColor[t.status]}/>
              </div>
            ))}
          </div>
        </>
      ):(
        <>
          <div style={{background:`linear-gradient(135deg,${G.cyan}08,${G.purple}08)`,border:`1px solid ${G.cyan}33`,borderRadius:12,padding:24,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <HexAvatar name={user.name||"U"} size={64}/>
              <div style={{flex:1}}>
                <h2 style={{fontFamily:G.font,color:G.text,fontSize:18,fontWeight:900,letterSpacing:2}}>{user.name?.toUpperCase()}</h2>
                <div style={{color:G.muted,fontSize:13,marginBottom:12,fontFamily:G.body}}>{user.department} · {user.position}</div>
                <NeonProgress value={user.onboardingProgress||0}/>
                <div style={{color:G.cyan,fontSize:12,marginTop:6,fontFamily:G.font,letterSpacing:1}}>{user.onboardingProgress||0}% MISSION PROGRESS</div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
            {[
              {icon:"✅",label:"Completed",value:myTasks.filter(t=>t.status==="completed").length,color:G.green},
              {icon:"⚡",label:"Active",value:myTasks.filter(t=>t.status==="in_progress").length,color:G.cyan},
              {icon:"📋",label:"Pending",value:myTasks.filter(t=>t.status==="pending").length,color:G.orange},
            ].map((s,i)=>(
              <div key={i} className="game-card" style={{background:G.card,border:`1px solid ${s.color}33`,borderRadius:12,padding:"18px 20px",flex:1,minWidth:120,transition:"all 0.3s"}}>
                <div style={{fontSize:26,marginBottom:8}}>{s.icon}</div>
                <div style={{fontSize:28,fontWeight:900,color:s.color,fontFamily:G.font}}>{s.value}</div>
                <div style={{color:G.muted,fontSize:11,marginTop:4,fontFamily:G.body,letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:24}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <div style={{width:3,height:16,background:G.cyan}}/>
              <h2 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:2}}>MY MISSIONS</h2>
            </div>
            {myTasks.length===0?<div style={{color:G.muted,textAlign:"center",padding:24,fontFamily:G.font,letterSpacing:2}}>NO MISSIONS ASSIGNED YET</div>:
              myTasks.map((t,i)=>(
                <div key={t._id} style={{display:"flex",gap:14,padding:14,background:"#050510",border:`1px solid ${G.border}`,borderRadius:10,marginBottom:8,animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
                  <span style={{fontSize:22,marginTop:2}}>{categoryIcon[t.category]}</span>
                  <div style={{flex:1}}>
                    <div style={{color:G.text,fontSize:14,fontWeight:700,fontFamily:G.body}}>{t.title}</div>
                    <div style={{color:G.muted,fontSize:12,marginTop:2,fontFamily:G.body}}>{t.description}</div>
                    <div style={{display:"flex",gap:8,marginTop:8}}>
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
function EmployeesPage({addToast,employees,setEmployees}) {
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
      addToast("Agent deployed successfully!","success");
    } catch(err) {
      addToast(err.response?.data?.message||"Failed to add agent","error");
    }
    setLoading(false);
  };

  const remove=async()=>{
    try {
      await api.deleteEmployee(confirm);
      setEmployees(employees.filter(e=>e._id!==confirm));
      addToast("Agent removed from system","error");
    } catch(err) {
      addToast("Failed to remove agent","error");
    }
    setConfirm(null);
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <ConfirmPopup show={!!confirm} message="Remove this agent permanently? This cannot be undone." onConfirm={remove} onCancel={()=>setConfirm(null)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:4,height:32,background:G.green,boxShadow:`0 0 10px ${G.green}`}}/>
          <h1 style={{fontFamily:G.font,color:G.green,fontSize:22,fontWeight:900,letterSpacing:3}}>AGENT ROSTER</h1>
        </div>
        <GlowBtn onClick={()=>setShowForm(!showForm)} color={G.green}>+ DEPLOY AGENT</GlowBtn>
      </div>

      {showForm&&(
        <div style={{background:G.card,border:`1px solid ${G.green}44`,borderRadius:12,padding:24,marginBottom:20,animation:"fadeUp 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:3,height:16,background:G.green}}/>
            <h3 style={{fontFamily:G.font,color:G.green,fontSize:12,letterSpacing:2}}>NEW AGENT REGISTRATION</h3>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <GlowInput placeholder="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <GlowInput placeholder="Email *" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
            <GlowInput placeholder="Password *" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
            <GlowInput placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/>
            <GlowInput placeholder="Position" value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/>
            <GlowInput placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <GlowBtn color={G.green} onClick={add} disabled={loading}>{loading?"DEPLOYING...":"CONFIRM DEPLOY"}</GlowBtn>
            <GlowBtn color={G.muted} onClick={()=>setShowForm(false)}>ABORT</GlowBtn>
          </div>
        </div>
      )}

      <div style={{marginBottom:18}}>
        <GlowInput placeholder="🔍  SEARCH AGENTS..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
        {filtered.map((emp,i)=>(
          <div key={emp._id} className="emp-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:20,position:"relative",transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.08}s both`}}>
            <button onClick={()=>setConfirm(emp._id)} className="game-btn" style={{position:"absolute",top:12,right:12,background:`${G.red}15`,border:`1px solid ${G.red}44`,color:G.red,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <HexAvatar name={emp.name||"U"} size={48}/>
              <div>
                <div style={{color:G.text,fontWeight:700,fontSize:15,fontFamily:G.body}}>{emp.name}</div>
                <div style={{color:G.muted,fontSize:12,fontFamily:G.body}}>{emp.position||"N/A"}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              <NeonBadge label={emp.status} color={statusColor[emp.status]||G.cyan}/>
              <NeonBadge label={emp.department||"N/A"} color={G.purple}/>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:G.muted,fontSize:11,fontFamily:G.font,letterSpacing:1}}>PROGRESS</span>
                <span style={{color:G.cyan,fontSize:12,fontWeight:900,fontFamily:G.font}}>{emp.onboardingProgress||0}%</span>
              </div>
              <NeonProgress value={emp.onboardingProgress||0}/>
            </div>
            <div style={{color:G.muted,fontSize:11,fontFamily:G.body}}>📱 {emp.phone||"N/A"} · 📅 {emp.joinDate?.split("T")[0]||"N/A"}</div>
          </div>
        ))}
        {filtered.length===0&&<div style={{color:G.muted,textAlign:"center",padding:40,fontFamily:G.font,letterSpacing:2,gridColumn:"1/-1"}}>NO AGENTS FOUND</div>}
      </div>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────
function TasksPage({user,tasks,setTasks,employees,addToast}) {
  const [filter,setFilter]=useState("all");
  const [showForm,setShowForm]=useState(false);
  const [missionComplete,setMissionComplete]=useState(false);
  const [form,setForm]=useState({title:"",description:"",assignedTo:"",priority:"medium",category:"other",dueDate:""});

  const isAdmin=user.role==="admin"||user.role==="hr";
  const visible=isAdmin?tasks:tasks.filter(t=>t.assignedTo?._id===user._id);
  const filtered=filter==="all"?visible:visible.filter(t=>t.status===filter);

  const updateStatus=async(id,status)=>{
    try {
      const {data}=await api.updateTask(id,{status});
      setTasks(tasks.map(t=>t._id===id?data:t));
      if(status==="completed"){setMissionComplete(true);addToast("MISSION COMPLETE! +100 XP","success");}
      else addToast("Mission status updated!","info");
    } catch(err) {
      addToast("Failed to update task","error");
    }
  };

  const addTask=async()=>{
    if(!form.title||!form.assignedTo){addToast("Fill all required fields!","error");return;}
    try {
      const {data}=await api.addTask(form);
      setTasks([...tasks,data]);
      setForm({title:"",description:"",assignedTo:"",priority:"medium",category:"other",dueDate:""});
      setShowForm(false);
      addToast("New mission created!","success");
    } catch(err) {
      addToast("Failed to create task","error");
    }
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <MissionComplete show={missionComplete} onClose={()=>setMissionComplete(false)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:4,height:32,background:G.orange,boxShadow:`0 0 10px ${G.orange}`}}/>
          <h1 style={{fontFamily:G.font,color:G.orange,fontSize:22,fontWeight:900,letterSpacing:3}}>MISSION CONTROL</h1>
        </div>
        {isAdmin&&<GlowBtn onClick={()=>setShowForm(!showForm)} color={G.orange}>+ NEW MISSION</GlowBtn>}
      </div>

      {showForm&&(
        <div style={{background:G.card,border:`1px solid ${G.orange}44`,borderRadius:12,padding:24,marginBottom:20,animation:"fadeUp 0.3s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <div style={{width:3,height:16,background:G.orange}}/>
            <h3 style={{fontFamily:G.font,color:G.orange,fontSize:12,letterSpacing:2}}>MISSION BRIEFING</h3>
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
            <input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}
              style={{background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,padding:"10px 12px",color:G.text,fontSize:13,outline:"none",fontFamily:G.body,width:"100%"}}/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <GlowBtn color={G.orange} onClick={addTask}>LAUNCH MISSION</GlowBtn>
            <GlowBtn color={G.muted} onClick={()=>setShowForm(false)}>ABORT</GlowBtn>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["all","pending","in_progress","completed"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className="game-btn" style={{background:filter===f?`${G.cyan}22`:"transparent",color:filter===f?G.cyan:G.muted,border:`1px solid ${filter===f?G.cyan+"66":G.border}`,borderRadius:20,padding:"6px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:G.font,letterSpacing:1,transition:"all 0.2s"}}>
            {f.replace("_"," ").toUpperCase()} ({(f==="all"?visible:visible.filter(t=>t.status===f)).length})
          </button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((t,i)=>(
          <div key={t._id} className="game-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:18,display:"flex",gap:14,alignItems:"flex-start",transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.06}s both`}}>
            <span style={{fontSize:22,marginTop:2}}>{categoryIcon[t.category]}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{color:G.text,fontWeight:700,fontSize:15,fontFamily:G.body}}>{t.title}</div>
                  <div style={{color:G.muted,fontSize:13,marginTop:2,fontFamily:G.body}}>{t.description}</div>
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <NeonBadge label={t.status.replace("_"," ")} color={taskStatusColor[t.status]}/>
                  <NeonBadge label={t.priority} color={priorityColor[t.priority]}/>
                </div>
              </div>
              <div style={{display:"flex",gap:14,marginTop:10,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{color:G.muted,fontSize:12,fontFamily:G.body}}>👤 {t.assignedTo?.name||"Unknown"}</span>
                {t.dueDate&&<span style={{color:G.muted,fontSize:12,fontFamily:G.body}}>📅 {t.dueDate?.split("T")[0]}</span>}
                <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                  {t.status==="pending"&&<GlowBtn size="sm" color={G.cyan} onClick={()=>updateStatus(t._id,"in_progress")}>▶ START</GlowBtn>}
                  {t.status==="in_progress"&&<GlowBtn size="sm" color={G.green} onClick={()=>updateStatus(t._id,"completed")}>✓ COMPLETE</GlowBtn>}
                  {t.status==="completed"&&<span style={{color:G.green,fontSize:12,fontWeight:700,fontFamily:G.font,letterSpacing:1}}>✓ DONE</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{textAlign:"center",padding:48,color:G.muted,fontFamily:G.font,letterSpacing:2}}>NO MISSIONS FOUND</div>}
      </div>
    </div>
  );
}

// ─── WORKFLOWS ────────────────────────────────────────────────────────────────
function WorkflowsPage({employees,addToast}) {
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
      addToast(`${wf.name} assigned — ${wf.steps?.length} missions created!`,"success");
      setSelected(null);setAssignEmp("");
    } catch(err) {
      addToast("Failed to assign workflow","error");
    }
  };

  return (
    <div style={{animation:"slideIn 0.4s ease"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <div style={{width:4,height:32,background:G.purple,boxShadow:`0 0 10px ${G.purple}`}}/>
        <h1 style={{fontFamily:G.font,color:G.purple,fontSize:22,fontWeight:900,letterSpacing:3}}>OPERATION TEMPLATES</h1>
      </div>

      {loading?<Loader/>:workflows.length===0?(
        <div style={{textAlign:"center",padding:60,color:G.muted}}>
          <div style={{fontSize:48,marginBottom:16}}>📋</div>
          <div style={{fontFamily:G.font,letterSpacing:2}}>NO WORKFLOWS FOUND</div>
          <div style={{color:G.muted,fontSize:12,marginTop:8,fontFamily:G.body}}>Add workflows via API or Thunder Client</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {workflows.map((wf,i)=>(
            <div key={wf._id} className="game-card" style={{background:G.card,border:`1px solid ${G.border}`,borderRadius:12,padding:22,transition:"all 0.3s",animation:`fadeUp 0.4s ease ${i*0.1}s both`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <h3 style={{fontFamily:G.font,color:G.text,fontSize:13,fontWeight:700,letterSpacing:1,marginBottom:6}}>{wf.name}</h3>
                  <NeonBadge label={wf.department||"All"} color={G.purple}/>
                </div>
                <div style={{background:`${G.cyan}15`,color:G.cyan,border:`1px solid ${G.cyan}44`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:900,fontFamily:G.font}}>{wf.steps?.length||0} OPS</div>
              </div>
              <p style={{color:G.muted,fontSize:13,margin:"0 0 14px",lineHeight:1.5}}>{wf.description}</p>
              <div style={{marginBottom:16}}>
                {wf.steps?.map((s,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${G.border}`}}>
                    <div style={{width:20,height:20,borderRadius:4,background:`${G.cyan}15`,border:`1px solid ${G.cyan}33`,color:G.cyan,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontFamily:G.font,flexShrink:0}}>{s.order}</div>
                    <span style={{fontSize:14}}>{categoryIcon[s.category]}</span>
                    <span style={{color:G.text,fontSize:13,flex:1,fontFamily:G.body}}>{s.title}</span>
                    <span style={{color:G.muted,fontSize:11,fontFamily:G.font}}>{s.estimatedDays}D</span>
                  </div>
                ))}
              </div>
              <GlowBtn style={{width:"100%",borderRadius:8}} onClick={()=>setSelected(selected===wf._id?null:wf._id)}>⚡ ASSIGN OPERATION</GlowBtn>
              {selected===wf._id&&(
                <div style={{marginTop:12,display:"flex",gap:8,animation:"fadeUp 0.3s ease"}}>
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
];

function Layout({user,onLogout}) {
  const [page,setPage]=useState("dashboard");
  const [tasks,setTasks]=useState([]);
  const [employees,setEmployees]=useState([]);
  const [toasts,setToasts]=useState([]);
  const [loading,setLoading]=useState(true);

  const addToast=(message,type="info")=>{
    const id=Date.now();
    setToasts(prev=>[...prev,{id,message,type}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),3000);
  };

  useEffect(()=>{
    const isAdmin=user.role==="admin"||user.role==="hr";
    Promise.all([
      api.getTasks(),
      isAdmin?api.getEmployees():Promise.resolve({data:[]}),
    ]).then(([tasksRes,empsRes])=>{
      setTasks(tasksRes.data);
      setEmployees(empsRes.data);
    }).catch(()=>addToast("Failed to load data","error"))
      .finally(()=>setLoading(false));
  },[]);

  const navItems=NAV.filter(n=>!n.admin||user.role==="admin"||user.role==="hr");

  return (
    <div style={{minHeight:"100vh",background:G.bg,fontFamily:G.body,display:"flex",position:"relative"}}>
      <ParticleBackground/>
      <Toast toasts={toasts}/>
      <div style={{width:200,background:G.surface,borderRight:`1px solid ${G.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,bottom:0,left:0,zIndex:100}}>
        <div style={{padding:"20px 16px 16px",borderBottom:`1px solid ${G.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:`${G.cyan}15`,border:`1px solid ${G.cyan}44`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>⚡</div>
            <div>
              <div style={{fontFamily:G.font,color:G.cyan,fontWeight:900,fontSize:14,letterSpacing:2}}>ONBOARD</div>
              <div style={{fontFamily:G.font,color:G.purple,fontWeight:900,fontSize:14,letterSpacing:2,marginTop:-4}}>IQ</div>
            </div>
          </div>
          <div style={{color:G.muted,fontSize:9,marginTop:6,fontFamily:G.font,letterSpacing:2}}>SYSTEM v2.0</div>
        </div>
        <nav style={{flex:1,padding:"14px 10px"}}>
          {navItems.map(item=>(
            <button key={item.key} onClick={()=>setPage(item.key)} className={`nav-btn ${page===item.key?"active":""}`}
              style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",borderLeft:`2px solid ${page===item.key?G.cyan:"transparent"}`,background:"transparent",color:page===item.key?G.cyan:G.muted,cursor:"pointer",fontSize:12,fontWeight:700,marginBottom:4,textAlign:"left",fontFamily:G.font,letterSpacing:1,transition:"all 0.2s"}}>
              <span style={{fontSize:16}}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{padding:"14px 10px",borderTop:`1px solid ${G.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#050510",border:`1px solid ${G.border}`,borderRadius:8,marginBottom:10}}>
            <HexAvatar name={user.name||"U"} size={32}/>
            <div style={{minWidth:0}}>
              <div style={{color:G.text,fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:G.body}}>{user.name}</div>
              <div style={{color:G.muted,fontSize:10,textTransform:"uppercase",fontFamily:G.font,letterSpacing:1}}>{user.role}</div>
            </div>
          </div>
          <button onClick={onLogout} className="game-btn" style={{width:"100%",background:`${G.red}10`,color:G.red,border:`1px solid ${G.red}33`,borderRadius:8,padding:"9px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:G.font,letterSpacing:1}}>
            ⏻ DISCONNECT
          </button>
        </div>
      </div>
      <div style={{marginLeft:200,flex:1,padding:"28px 28px 40px",maxWidth:"calc(100vw - 200px)",position:"relative",zIndex:1}}>
        {loading?<Loader/>:(
          <>
            {page==="dashboard"&&<Dashboard user={user} employees={employees} tasks={tasks}/>}
            {page==="employees"&&<EmployeesPage addToast={addToast} employees={employees} setEmployees={setEmployees}/>}
            {page==="tasks"&&<TasksPage user={user} tasks={tasks} setTasks={setTasks} employees={employees} addToast={addToast}/>}
            {page==="workflows"&&<WorkflowsPage employees={employees} addToast={addToast}/>}
          </>
        )}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]=useState(()=>{
    const saved=localStorage.getItem('user');
    return saved?JSON.parse(saved):null;
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
