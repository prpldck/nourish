import { useState, useEffect } from "react";

const DIGESTIVE_SYMPTOMS = [
  { id: "bloating", label: "Bloating", emoji: "🎈" },
  { id: "gas", label: "Gas", emoji: "💨" },
  { id: "cramping", label: "Cramping", emoji: "⚡" },
  { id: "nausea", label: "Nausea", emoji: "🤢" },
  { id: "diarrhea", label: "Diarrhea", emoji: "🚽" },
  { id: "constipation", label: "Constipation", emoji: "🪨" },
  { id: "stomach pain", label: "Stomach Pain", emoji: "😣" },
  { id: "acid reflux", label: "Acid Reflux", emoji: "🔥" },
  { id: "indigestion", label: "Indigestion", emoji: "😖" },
  { id: "vomiting", label: "Vomiting", emoji: "🤮" },
];

const MEAL_TYPES = [
  { id: "Breakfast", emoji: "🌅" },
  { id: "Lunch", emoji: "☀️" },
  { id: "Dinner", emoji: "🌙" },
  { id: "Snack", emoji: "🍎" },
];

const SEVERITY_COLORS = {
  Mild: { bg: "rgba(234,179,8,0.1)", text: "#facc15", border: "rgba(234,179,8,0.3)" },
  Moderate: { bg: "rgba(249,115,22,0.1)", text: "#fb923c", border: "rgba(249,115,22,0.3)" },
  Severe: { bg: "rgba(239,68,68,0.1)", text: "#f87171", border: "rgba(239,68,68,0.3)" },
};

const MEAL_STYLES = {
  Breakfast: { text: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)", emoji: "🌅" },
  Lunch: { text: "#38bdf8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.2)", emoji: "☀️" },
  Dinner: { text: "#818cf8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.2)", emoji: "🌙" },
  Snack: { text: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)", emoji: "🍎" },
};

function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function getMealType(date) {
  const h = new Date(date).getHours();
  if (h >= 5 && h < 11) return "Breakfast";
  if (h >= 11 && h < 15) return "Lunch";
  if (h >= 15 && h < 21) return "Dinner";
  return "Snack";
}

function parseMeal(text) {
  const foods = ["chicken","beef","pork","fish","salmon","tuna","shrimp","eggs","egg","rice","pasta","bread","toast","oats","quinoa","noodles","broccoli","spinach","kale","lettuce","tomato","onion","garlic","pepper","carrot","cucumber","avocado","apple","banana","orange","mango","berries","strawberry","blueberry","milk","cheese","butter","cream","yogurt","whey","lactose","dairy","soy","tofu","almond","cashew","peanut","walnut","gluten","wheat","flour","olive oil","coconut oil","coffee","tea","juice","alcohol","beer","wine","sugar","chocolate","honey","sauce","dressing","mayo","potato","sweet potato","corn","beans","lentils","chickpeas","hummus","sausage","bacon","turkey","lamb","crab","lobster"];
  const lower = text.toLowerCase();
  const found = foods.filter(f => lower.includes(f));
  return { description: text, ingredients: [...new Set(found)] };
}

function parseSymptom(text, tagged) {
  const lower = text.toLowerCase();
  const found = [...tagged];
  DIGESTIVE_SYMPTOMS.forEach(s => { if (lower.includes(s.id)) found.push(s.id); });
  if (lower.includes("bloat")) found.push("bloating");
  if (lower.includes("cramp")) found.push("cramping");
  if (lower.includes("nauseat") || lower.includes("sick to")) found.push("nausea");
  if (lower.includes("loose") || lower.includes("runs")) found.push("diarrhea");
  if (lower.includes("gassy") || lower.includes("fart")) found.push("gas");
  if (lower.includes("heartburn") || lower.includes("reflux") || lower.includes("burning")) found.push("acid reflux");
  if (lower.includes("upset") || lower.includes("stomach hurt") || lower.includes("stomach ache")) found.push("stomach pain");
  let severity = "Mild";
  if (lower.includes("severe") || lower.includes("really bad") || lower.includes("terrible")) severity = "Severe";
  else if (lower.includes("moderate") || lower.includes("pretty bad") || lower.includes("bad")) severity = "Moderate";
  let delay = 1;
  const m = lower.match(/(\d+(?:\.\d+)?)\s*hour/);
  if (m) delay = parseFloat(m[1]);
  else if (lower.includes("right away") || lower.includes("immediately")) delay = 0;
  else if (lower.includes("30 min") || lower.includes("half hour")) delay = 0.5;
  return { symptoms: [...new Set(found)], severity, delay_hours: delay };
}

function formatTime(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  const t = d.toLocaleTimeString("en-CA",{hour:"numeric",minute:"2-digit",hour12:true});
  if (d.toDateString()===today.toDateString()) return `Today · ${t}`;
  if (d.toDateString()===yesterday.toDateString()) return `Yesterday · ${t}`;
  return d.toLocaleDateString("en-CA",{month:"short",day:"numeric"})+" · "+t;
}

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

export default function App() {
  const [meals, setMeals] = useLocalStorage("nourish_meals", []);
  const [symptoms, setSymptoms] = useLocalStorage("nourish_symptoms", []);
  const [tab, setTab] = useState("log");
  const [mode, setMode] = useState("meal");
  const [text, setText] = useState("");
  const [mealType, setMealType] = useState(getMealType(new Date()));
  const [tagged, setTagged] = useState([]);
  const [logTime, setLogTime] = useState(new Date().toISOString());
  const [showTime, setShowTime] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedIngredients, setSavedIngredients] = useState([]);

  function handleLog() {
    if (mode === "meal" && !text.trim()) return;
    if (mode === "reaction" && !text.trim() && tagged.length === 0) return;
    if (mode === "meal") {
      const p = parseMeal(text);
      const rec = { id: uuid(), logged_at: logTime, meal_type: mealType, description: p.description, ingredients: p.ingredients };
      setMeals(prev => [rec, ...prev]);
      setSavedIngredients(p.ingredients);
      setLastSaved("meal");
    } else {
      const p = parseSymptom(text, tagged);
      const recent = meals[0];
      const autoLink = recent && (Date.now() - new Date(recent.logged_at)) < 12*3600000 ? recent.id : null;
      const rec = { id: uuid(), logged_at: logTime, symptoms: p.symptoms, severity: p.severity, delay_hours: p.delay_hours, notes: text, meal_log_id: autoLink || "" };
      setSymptoms(prev => [rec, ...prev]);
      setLastSaved("reaction");
    }
    setText(""); setTagged([]); setLogTime(new Date().toISOString()); setMealType(getMealType(new Date())); setShowTime(false);
  }

  function toggleTag(id) { setTagged(prev => prev.includes(id) ? prev.filter(s=>s!==id) : [...prev,id]); }
  function deleteMeal(id) { setMeals(prev => prev.filter(m=>m.id!==id)); }
  function deleteSymptom(id) { setSymptoms(prev => prev.filter(s=>s!==id)); }

  const todayMeals = meals.filter(m => new Date(m.logged_at).toDateString()===new Date().toDateString());
  const todaySymptoms = symptoms.filter(s => new Date(s.logged_at).toDateString()===new Date().toDateString());

  const ingredientCounts = {};
  meals.forEach(meal => {
    if (!meal.ingredients) return;
    const mealSymptoms = symptoms.filter(s => s.meal_log_id === meal.id);
    if (mealSymptoms.length > 0) meal.ingredients.forEach(ing => { ingredientCounts[ing] = (ingredientCounts[ing]||0)+1; });
  });
  const topSuspects = Object.entries(ingredientCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const canLog = mode==="meal" ? text.trim().length>0 : (text.trim().length>0 || tagged.length>0);

  const s = { background:"#0a0a0f", color:"#fff", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", maxWidth:480, margin:"0 auto" };

  return (
    <div style={s}>
      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(10,10,15,0.95)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"16px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(135deg,#34d399,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🌿</div>
            <div>
              <div style={{fontWeight:700,fontSize:14,letterSpacing:-0.3}}>Nourish</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>Food sensitivity tracker</div>
            </div>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{meals.length} meals · {symptoms.length} reactions</div>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          {[["log","Log"],["history","History"],["insights","Insights"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px 0 12px",fontSize:13,fontWeight:500,background:"none",border:"none",cursor:"pointer",color:tab===id?"#34d399":"rgba(255,255,255,0.3)",borderBottom:tab===id?"2px solid #34d399":"2px solid transparent",marginBottom:-1,transition:"all 0.2s"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 16px 96px"}}>
        {/* LOG TAB */}
        {tab==="log" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              {[{v:todayMeals.length,l:"meals today",c:"#34d399",bg:"rgba(52,211,153,0.05)",border:"rgba(52,211,153,0.15)"},{v:todaySymptoms.length,l:"reactions today",c:"#f87171",bg:"rgba(248,113,113,0.05)",border:"rgba(248,113,113,0.15)"},{v:topSuspects.length,l:"flagged foods",c:"#fff",bg:"rgba(255,255,255,0.03)",border:"rgba(255,255,255,0.08)"}].map((item,i)=>(
                <div key={i} style={{borderRadius:16,background:item.bg,border:`1px solid ${item.border}`,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontSize:22,fontWeight:700,color:item.c}}>{item.v}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>{item.l}</div>
                </div>
              ))}
            </div>

            {/* Log card */}
            <div style={{borderRadius:20,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                {[["meal","🍽️ Meal","#34d399"],["reaction","⚡ Reaction","#f87171"]].map(([id,label,color])=>(
                  <button key={id} onClick={()=>setMode(id)} style={{flex:1,padding:"12px 8px",fontSize:13,fontWeight:500,background:mode===id?`${color}10`:"none",border:"none",cursor:"pointer",color:mode===id?color:"rgba(255,255,255,0.3)",borderBottom:mode===id?`2px solid ${color}`:"2px solid transparent",marginBottom:-1}}>{label}</button>
                ))}
              </div>

              <div style={{padding:"16px 16px 0"}}>
                {mode==="meal" && (
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    {MEAL_TYPES.map(({id,emoji})=>{
                      const st = MEAL_STYLES[id];
                      const active = mealType===id;
                      return <button key={id} onClick={()=>setMealType(id)} style={{flex:1,padding:"8px 4px",borderRadius:12,border:`1px solid ${active?st.border:"rgba(255,255,255,0.08)"}`,background:active?st.bg:"rgba(255,255,255,0.03)",color:active?st.text:"rgba(255,255,255,0.3)",fontSize:11,fontWeight:500,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}><span>{emoji}</span><span>{id}</span></button>;
                    })}
                  </div>
                )}

                {mode==="reaction" && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
                    {DIGESTIVE_SYMPTOMS.map(({id,label,emoji})=>{
                      const active = tagged.includes(id);
                      return <button key={id} onClick={()=>toggleTag(id)} style={{padding:"6px 12px",borderRadius:20,border:`1px solid ${active?"rgba(248,113,113,0.4)":"rgba(255,255,255,0.1)"}`,background:active?"rgba(248,113,113,0.15)":"rgba(255,255,255,0.05)",color:active?"#fca5a5":"rgba(255,255,255,0.4)",fontSize:11,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><span>{emoji}</span><span>{label}</span></button>;
                    })}
                  </div>
                )}

                <textarea value={text} onChange={e=>setText(e.target.value)}
                  placeholder={mode==="meal"?"e.g. grilled chicken with broccoli and rice...":"Optional: describe what happened..."}
                  rows={3} style={{width:"100%",background:"none",border:"none",outline:"none",color:"#fff",fontSize:14,resize:"none",lineHeight:1.6,fontFamily:"inherit",placeholder:{color:"rgba(255,255,255,0.2)"}}} />
              </div>

              <div style={{padding:"12px 16px",borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <button onClick={()=>setShowTime(v=>!v)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                  🕐 <span style={{textDecoration:"underline",textDecorationColor:"rgba(255,255,255,0.15)"}}>{formatTime(logTime)}</span> {showTime?"▲":"▼"}
                </button>
                <button onClick={handleLog} disabled={!canLog} style={{padding:"8px 20px",borderRadius:12,border:"none",background:!canLog?"rgba(255,255,255,0.1)":mode==="meal"?"#10b981":"#ef4444",color:!canLog?"rgba(255,255,255,0.3)":"#fff",fontSize:12,fontWeight:600,cursor:canLog?"pointer":"default",transition:"all 0.2s"}}>
                  {mode==="meal"?"Log Meal":"Log Reaction"}
                </button>
              </div>

              {showTime && (
                <div style={{padding:"12px 16px 16px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:8}}>Date</div>
                    <div style={{display:"flex",gap:8,overflowX:"auto"}}>
                      {Array.from({length:5},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return d;}).map((d,i)=>{
                        const active = new Date(logTime).toDateString()===d.toDateString();
                        const label = i===0?"Today":i===1?"Yesterday":d.toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"});
                        return <button key={i} onClick={()=>{const nd=new Date(logTime);nd.setFullYear(d.getFullYear(),d.getMonth(),d.getDate());setLogTime(nd.toISOString());}} style={{flexShrink:0,padding:"6px 12px",borderRadius:12,border:`1px solid ${active?"#fff":"rgba(255,255,255,0.1)"}`,background:active?"#fff":"rgba(255,255,255,0.05)",color:active?"#000":"rgba(255,255,255,0.4)",fontSize:11,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap"}}>{label}</button>;
                      })}
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:8}}>Time</div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <select value={new Date(logTime).getHours()} onChange={e=>{const nd=new Date(logTime);nd.setHours(parseInt(e.target.value));setLogTime(nd.toISOString());}} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"8px 12px",color:"#fff",fontSize:13,colorScheme:"dark",outline:"none"}}>
                        {Array.from({length:24},(_,h)=><option key={h} value={h}>{h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}</option>)}
                      </select>
                      <span style={{color:"rgba(255,255,255,0.3)"}}>:</span>
                      <select value={new Date(logTime).getMinutes()<30?0:30} onChange={e=>{const nd=new Date(logTime);nd.setMinutes(parseInt(e.target.value));setLogTime(nd.toISOString());}} style={{width:72,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"8px 12px",color:"#fff",fontSize:13,colorScheme:"dark",outline:"none"}}>
                        <option value={0}>00</option><option value={30}>30</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {lastSaved && (
              <div style={{borderRadius:12,padding:"12px 16px",background:lastSaved==="meal"?"rgba(52,211,153,0.1)":"rgba(248,113,113,0.1)",border:`1px solid ${lastSaved==="meal"?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,color:lastSaved==="meal"?"#6ee7b7":"#fca5a5",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:8}}>
                <span>✓</span>
                <span>{lastSaved==="meal"?"Meal saved":"Reaction saved and linked to your last meal"}</span>
                <button onClick={()=>{setLastSaved(null);setSavedIngredients([]);}} style={{marginLeft:"auto",background:"none",border:"none",color:"inherit",opacity:0.4,cursor:"pointer",fontSize:16}}>×</button>
              </div>
            )}

            {savedIngredients.length>0 && lastSaved==="meal" && (
              <div style={{borderRadius:12,padding:"12px 16px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:8}}>Parsed ingredients</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {savedIngredients.map((ing,i)=><span key={i} style={{fontSize:11,background:"rgba(52,211,153,0.1)",color:"#6ee7b7",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(52,211,153,0.2)"}}>{ing}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab==="history" && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {meals.length===0 && symptoms.length===0 && (
              <div style={{textAlign:"center",padding:"64px 0"}}>
                <div style={{fontSize:40,marginBottom:12}}>🍽️</div>
                <div style={{color:"rgba(255,255,255,0.3)",fontSize:14}}>Nothing logged yet</div>
              </div>
            )}
            {(() => {
              const grouped = {};
              [...meals,...symptoms].forEach(e => {
                const dk = new Date(e.logged_at||e.created_date).toDateString();
                if (!grouped[dk]) grouped[dk]={meals:[],symptoms:[]};
                if (e.description!==undefined) grouped[dk].meals.push(e);
                else grouped[dk].symptoms.push(e);
              });
              const today=new Date().toDateString(), yesterday=new Date(Date.now()-86400000).toDateString();
              return Object.entries(grouped).sort((a,b)=>new Date(b[0])-new Date(a[0])).map(([date,data])=>{
                const label=date===today?"Today":date===yesterday?"Yesterday":new Date(date).toLocaleDateString("en-CA",{weekday:"long",month:"short",day:"numeric"});
                return (
                  <div key={date}>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontWeight:500,marginBottom:10,paddingLeft:4}}>{label}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {data.meals.sort((a,b)=>new Date(a.logged_at)-new Date(b.logged_at)).map(meal=>{
                        const st=MEAL_STYLES[meal.meal_type]||MEAL_STYLES.Snack;
                        const mealReactions=symptoms.filter(s=>s.meal_log_id===meal.id);
                        return (
                          <div key={meal.id} style={{borderRadius:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",padding:"14px 16px"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                                  <span style={{fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:20,background:st.bg,color:st.text,border:`1px solid ${st.border}`}}>{st.emoji} {meal.meal_type}</span>
                                  <span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>{new Date(meal.logged_at).toLocaleTimeString("en-CA",{hour:"numeric",minute:"2-digit",hour12:true})}</span>
                                </div>
                                <div style={{fontSize:13,color:"rgba(255,255,255,0.8)",lineHeight:1.4}}>{meal.description}</div>
                                {meal.ingredients?.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:8}}>{meal.ingredients.map((ing,i)=><span key={i} style={{fontSize:10,background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.35)",padding:"2px 8px",borderRadius:12}}>{ing}</span>)}</div>}
                                {mealReactions.length>0 && <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>{mealReactions.map(r=><span key={r.id} style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:SEVERITY_COLORS[r.severity]?.bg,color:SEVERITY_COLORS[r.severity]?.text,border:`1px solid ${SEVERITY_COLORS[r.severity]?.border}`}}>⚡ {r.severity}</span>)}</div>}
                              </div>
                              <button onClick={()=>deleteMeal(meal.id)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.1)",cursor:"pointer",fontSize:12,padding:4,marginTop:-2}}>✕</button>
                            </div>
                          </div>
                        );
                      })}
                      {data.symptoms.map(sym=>(
                        <div key={sym.id} style={{borderRadius:16,background:SEVERITY_COLORS[sym.severity]?.bg,border:`1px solid ${SEVERITY_COLORS[sym.severity]?.border}`,padding:"14px 16px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                <span style={{fontSize:11,fontWeight:600,color:SEVERITY_COLORS[sym.severity]?.text}}>⚡ {sym.severity} Reaction</span>
                                <span style={{fontSize:11,color:"rgba(255,255,255,0.2)"}}>{new Date(sym.logged_at).toLocaleTimeString("en-CA",{hour:"numeric",minute:"2-digit",hour12:true})}</span>
                              </div>
                              {sym.symptoms?.length>0 && <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{sym.symptoms.map((s,i)=>{const def=DIGESTIVE_SYMPTOMS.find(d=>d.id===s);return <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:"rgba(255,255,255,0.1)",color:SEVERITY_COLORS[sym.severity]?.text}}>{def?.emoji} {s}</span>;})}</div>}
                              {sym.notes && <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:4,lineHeight:1.4}}>{sym.notes}</div>}
                              {sym.delay_hours>0 && <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:4}}>~{sym.delay_hours}h after eating</div>}
                            </div>
                            <button onClick={()=>deleteSymptom(sym.id)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.1)",cursor:"pointer",fontSize:12,padding:4,marginTop:-2}}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {tab==="insights" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{borderRadius:16,background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.2)",padding:"16px"}}>
              <div style={{fontSize:11,color:"#f87171",fontWeight:600,marginBottom:10}}>CONFIRMED ALLERGY</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:28}}>🥛</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600}}>Dairy / Lactose</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2}}>Severe — avoid all dairy products</div>
                </div>
                <span style={{fontSize:10,background:"rgba(239,68,68,0.2)",color:"#f87171",padding:"3px 8px",borderRadius:20,fontWeight:600}}>Confirmed</span>
              </div>
            </div>

            {topSuspects.length>0 ? (
              <div style={{borderRadius:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",padding:"16px"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:500,marginBottom:4}}>INGREDIENT SUSPECTS</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginBottom:16}}>Present before digestive reactions</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {topSuspects.map(([ing,count])=>{
                    const total=meals.filter(m=>m.ingredients?.includes(ing)).length;
                    const pct=total>0?Math.round((count/total)*100):0;
                    const barColor=pct>66?"#ef4444":pct>33?"#f97316":"#eab308";
                    return (
                      <div key={ing}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:500,textTransform:"capitalize"}}>{ing}</span>
                          <span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{count}/{total} · {pct}%</span>
                        </div>
                        <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:barColor,transition:"width 0.3s"}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{borderRadius:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",padding:"32px 16px",textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:8}}>🔬</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>Patterns will appear here</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:4}}>Log meals and reactions to build your profile</div>
              </div>
            )}

            {symptoms.length>0 && (
              <div style={{borderRadius:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",padding:"16px"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:500,marginBottom:14}}>SYMPTOM FREQUENCY</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {DIGESTIVE_SYMPTOMS.map(({id,label,emoji})=>{
                    const count=symptoms.filter(s=>s.symptoms?.includes(id)).length;
                    if (!count) return null;
                    const pct=Math.round((count/symptoms.length)*100);
                    return (
                      <div key={id} style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:14,width:20,flexShrink:0}}>{emoji}</span>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.4)",width:88,flexShrink:0,textTransform:"capitalize"}}>{label}</span>
                        <div style={{flex:1,height:6,borderRadius:3,background:"rgba(255,255,255,0.05)",overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:"linear-gradient(90deg,#a855f7,#ec4899)"}} />
                        </div>
                        <span style={{fontSize:11,color:"rgba(255,255,255,0.25)",width:16,textAlign:"right",flexShrink:0}}>{count}</span>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
            )}

            {symptoms.length>0 && (
              <div style={{borderRadius:16,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",padding:"16px"}}>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:500,marginBottom:12}}>SEVERITY BREAKDOWN</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {["Mild","Moderate","Severe"].map(sev=>{
                    const count=symptoms.filter(s=>s.severity===sev).length;
                    return (
                      <div key={sev} style={{borderRadius:12,padding:"12px 8px",textAlign:"center",background:SEVERITY_COLORS[sev]?.bg,border:`1px solid ${SEVERITY_COLORS[sev]?.border}`}}>
                        <div style={{fontSize:22,fontWeight:700,color:SEVERITY_COLORS[sev]?.text}}>{count}</div>
                        <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:2}}>{sev}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
