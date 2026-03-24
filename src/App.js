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

const NAV_ITEMS = [
  { id: "log", label: "Log", emoji: "✏️" },
  { id: "history", label: "History", emoji: "📋" },
  { id: "insights", label: "Insights", emoji: "🔬" },
];

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
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const t = d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true });
  if (d.toDateString() === today.toDateString()) return `Today · ${t}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday · ${t}`;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" }) + " · " + t;
}

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ value, label, color, bg, border }) {
  return (
    <div style={{ borderRadius: 16, background: bg, border: `1px solid ${border}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{label}</div>
    </div>
  );
}

function Badge({ children, bg, color, border }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color, border: `1px solid ${border}` }}>
      {children}
    </span>
  );
}

function TimePicker({ value, onChange }) {
  const logDate = new Date(value);
  const days = Array.from({ length: 5 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d; });
  const selectedDate = logDate.toDateString();
  const selectedHour = logDate.getHours();
  const selectedMin = logDate.getMinutes() < 30 ? 0 : 30;

  function update(dateStr, hour, min) {
    const base = days.find(d => d.toDateString() === dateStr) || new Date(dateStr);
    const result = new Date(base);
    result.setHours(hour, min, 0, 0);
    onChange(result.toISOString());
  }

  return (
    <div style={{ padding: "14px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>Date</div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {days.map((d, i) => {
            const active = d.toDateString() === selectedDate;
            const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
            return (
              <button key={i} onClick={() => update(d.toDateString(), selectedHour, selectedMin)}
                style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 12, border: `1px solid ${active ? "#fff" : "rgba(255,255,255,0.1)"}`, background: active ? "#fff" : "rgba(255,255,255,0.05)", color: active ? "#000" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>Time</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={selectedHour} onChange={e => update(selectedDate, parseInt(e.target.value), selectedMin)}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13, colorScheme: "dark", outline: "none" }}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`}</option>)}
          </select>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>:</span>
          <select value={selectedMin} onChange={e => update(selectedDate, selectedHour, parseInt(e.target.value))}
            style={{ width: 80, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 13, colorScheme: "dark", outline: "none" }}>
            <option value={0}>00</option><option value={30}>30</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Log Panel ────────────────────────────────────────────────────────────────

function LogPanel({ meals, symptoms, onSaved }) {
  const [mode, setMode] = useState("meal");
  const [text, setText] = useState("");
  const [mealType, setMealType] = useState(getMealType(new Date()));
  const [tagged, setTagged] = useState([]);
  const [logTime, setLogTime] = useState(new Date().toISOString());
  const [showTime, setShowTime] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [savedIngredients, setSavedIngredients] = useState([]);

  const canLog = mode === "meal" ? text.trim().length > 0 : (text.trim().length > 0 || tagged.length > 0);

  function toggleTag(id) { setTagged(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]); }

  function handleLog() {
    if (!canLog) return;
    setSaving(true);
    if (mode === "meal") {
      const p = parseMeal(text);
      const rec = { id: uuid(), logged_at: logTime, meal_type: mealType, description: p.description, ingredients: p.ingredients };
      onSaved("meal", rec);
      setSavedIngredients(p.ingredients);
      setLastSaved("meal");
    } else {
      const p = parseSymptom(text, tagged);
      const recent = meals[0];
      const autoLink = recent && (Date.now() - new Date(recent.logged_at)) < 12 * 3600000 ? recent.id : null;
      const rec = { id: uuid(), logged_at: logTime, symptoms: p.symptoms, severity: p.severity, delay_hours: p.delay_hours, notes: text, meal_log_id: autoLink || "" };
      onSaved("symptom", rec);
      setLastSaved("reaction");
    }
    setText(""); setTagged([]); setLogTime(new Date().toISOString()); setMealType(getMealType(new Date())); setShowTime(false);
    setSaving(false);
    setTimeout(() => { setLastSaved(null); setSavedIngredients([]); }, 4000);
  }

  const todayMeals = meals.filter(m => new Date(m.logged_at).toDateString() === new Date().toDateString());
  const todaySymptoms = symptoms.filter(s => new Date(s.logged_at).toDateString() === new Date().toDateString());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StatCard value={todayMeals.length} label="Meals today" color="#34d399" bg="rgba(52,211,153,0.05)" border="rgba(52,211,153,0.15)" />
        <StatCard value={todaySymptoms.length} label="Reactions today" color="#f87171" bg="rgba(248,113,113,0.05)" border="rgba(248,113,113,0.15)" />
        <StatCard value={meals.length} label="Total meals" color="rgba(255,255,255,0.7)" bg="rgba(255,255,255,0.03)" border="rgba(255,255,255,0.08)" />
      </div>

      {/* Log card */}
      <div style={{ borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        {/* Mode tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {[["meal", "🍽️", "Meal", "#34d399"], ["reaction", "⚡", "Reaction", "#f87171"]].map(([id, icon, label, color]) => (
            <button key={id} onClick={() => setMode(id)}
              style={{ flex: 1, padding: "14px 8px", fontSize: 14, fontWeight: 500, background: mode === id ? `${color}12` : "none", border: "none", cursor: "pointer", color: mode === id ? color : "rgba(255,255,255,0.3)", borderBottom: mode === id ? `2px solid ${color}` : "2px solid transparent", marginBottom: -1, transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span>{icon}</span><span>{label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px 0" }}>
          {/* Meal type pills */}
          {mode === "meal" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {MEAL_TYPES.map(({ id, emoji }) => {
                const st = MEAL_STYLES[id];
                const active = mealType === id;
                return (
                  <button key={id} onClick={() => setMealType(id)}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 12, border: `1px solid ${active ? st.border : "rgba(255,255,255,0.08)"}`, background: active ? st.bg : "rgba(255,255,255,0.03)", color: active ? st.text : "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.15s" }}>
                    <span style={{ fontSize: 16 }}>{emoji}</span><span>{id}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Symptom chips */}
          {mode === "reaction" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {DIGESTIVE_SYMPTOMS.map(({ id, label, emoji }) => {
                const active = tagged.includes(id);
                return (
                  <button key={id} onClick={() => toggleTag(id)}
                    style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${active ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.1)"}`, background: active ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.05)", color: active ? "#fca5a5" : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s" }}>
                    <span>{emoji}</span><span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <textarea value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleLog(); }}
            placeholder={mode === "meal" ? "e.g. grilled chicken with broccoli and rice, sparkling water..." : "Optional: describe what happened, e.g. really bad bloating 2 hours after eating..."}
            rows={3}
            style={{ width: "100%", background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, resize: "none", lineHeight: 1.6, fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => setShowTime(v => !v)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
            🕐 <span style={{ textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.15)" }}>{formatTime(logTime)}</span>
            <span style={{ fontSize: 10, opacity: 0.5 }}>{showTime ? "▲" : "▼"}</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>⌘↵</span>
            <button onClick={handleLog} disabled={saving || !canLog}
              style={{ padding: "9px 22px", borderRadius: 12, border: "none", background: !canLog ? "rgba(255,255,255,0.08)" : mode === "meal" ? "#10b981" : "#ef4444", color: !canLog ? "rgba(255,255,255,0.25)" : "#fff", fontSize: 13, fontWeight: 600, cursor: canLog ? "pointer" : "default", transition: "all 0.2s" }}>
              {saving ? "Saving..." : mode === "meal" ? "Log Meal" : "Log Reaction"}
            </button>
          </div>
        </div>

        {showTime && <TimePicker value={logTime} onChange={v => { setLogTime(v); if (mode === "meal") setMealType(getMealType(v)); }} />}
      </div>

      {/* Success toast */}
      {lastSaved && (
        <div style={{ borderRadius: 14, padding: "12px 16px", background: lastSaved === "meal" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${lastSaved === "meal" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, color: lastSaved === "meal" ? "#6ee7b7" : "#fca5a5", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
          <span>✓</span>
          <span>{lastSaved === "meal" ? "Meal saved" : "Reaction saved and linked to your last meal"}</span>
          <button onClick={() => { setLastSaved(null); setSavedIngredients([]); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", opacity: 0.4, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {savedIngredients.length > 0 && lastSaved === "meal" && (
        <div style={{ borderRadius: 14, padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Parsed ingredients</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {savedIngredients.map((ing, i) => <span key={i} style={{ fontSize: 11, background: "rgba(52,211,153,0.1)", color: "#6ee7b7", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(52,211,153,0.2)" }}>{ing}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({ meals, symptoms, onDeleteMeal, onDeleteSymptom }) {
  if (meals.length === 0 && symptoms.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 15 }}>Nothing logged yet</div>
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 13, marginTop: 6 }}>Start by logging your first meal</div>
      </div>
    );
  }

  const grouped = {};
  [...meals, ...symptoms].forEach(e => {
    const dk = new Date(e.logged_at).toDateString();
    if (!grouped[dk]) grouped[dk] = { meals: [], symptoms: [] };
    if (e.description !== undefined) grouped[dk].meals.push(e);
    else grouped[dk].symptoms.push(e);
  });

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, data]) => {
        const label = date === today ? "Today" : date === yesterday ? "Yesterday" : new Date(date).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });
        const allEntries = [
          ...data.meals.map(m => ({ ...m, _type: "meal" })),
          ...data.symptoms.map(s => ({ ...s, _type: "symptom" }))
        ].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));

        return (
          <div key={date}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 600, marginBottom: 12, paddingLeft: 2, letterSpacing: 0.3 }}>{label.toUpperCase()}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allEntries.map(entry => {
                if (entry._type === "meal") {
                  const st = MEAL_STYLES[entry.meal_type] || MEAL_STYLES.Snack;
                  const mealReactions = symptoms.filter(s => s.meal_log_id === entry.id);
                  return (
                    <div key={entry.id} style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                            <Badge bg={st.bg} color={st.text} border={st.border}>{st.emoji} {entry.meal_type}</Badge>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                              {new Date(entry.logged_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true })}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{entry.description}</div>
                          {entry.ingredients?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
                              {entry.ingredients.map((ing, i) => <span key={i} style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.35)", padding: "2px 8px", borderRadius: 10 }}>{ing}</span>)}
                            </div>
                          )}
                          {mealReactions.length > 0 && (
                            <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                              {mealReactions.map(r => (
                                <span key={r.id} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: SEVERITY_COLORS[r.severity]?.bg, color: SEVERITY_COLORS[r.severity]?.text, border: `1px solid ${SEVERITY_COLORS[r.severity]?.border}` }}>⚡ {r.severity} reaction</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => onDeleteMeal(entry.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.1)", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0, borderRadius: 6, transition: "color 0.15s" }}
                          onMouseOver={e => e.target.style.color = "#f87171"} onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.1)"}>✕</button>
                      </div>
                    </div>
                  );
                } else {
                  const sc = SEVERITY_COLORS[entry.severity] || SEVERITY_COLORS.Mild;
                  return (
                    <div key={entry.id} style={{ borderRadius: 16, background: sc.bg, border: `1px solid ${sc.border}`, padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: sc.text }}>⚡ {entry.severity} Reaction</span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{new Date(entry.logged_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                          </div>
                          {entry.symptoms?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                              {entry.symptoms.map((s, i) => {
                                const def = DIGESTIVE_SYMPTOMS.find(d => d.id === s);
                                return <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: sc.text }}>{def?.emoji} {s}</span>;
                              })}
                            </div>
                          )}
                          {entry.notes && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{entry.notes}</div>}
                          {entry.delay_hours > 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 5 }}>~{entry.delay_hours}h after eating</div>}
                        </div>
                        <button onClick={() => onDeleteSymptom(entry.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 14, padding: "2px 4px", flexShrink: 0, borderRadius: 6, transition: "color 0.15s" }}
                          onMouseOver={e => e.target.style.color = "#f87171"} onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.15)"}>✕</button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Insights Panel ───────────────────────────────────────────────────────────

function InsightsPanel({ meals, symptoms }) {
  const ingredientCounts = {};
  meals.forEach(meal => {
    if (!meal.ingredients) return;
    const mealSymptoms = symptoms.filter(s => s.meal_log_id === meal.id);
    if (mealSymptoms.length > 0) meal.ingredients.forEach(ing => { ingredientCounts[ing] = (ingredientCounts[ing] || 0) + 1; });
  });
  const topSuspects = Object.entries(ingredientCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Confirmed allergy */}
      <div style={{ borderRadius: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", padding: "18px 20px" }}>
        <div style={{ fontSize: 11, color: "#f87171", fontWeight: 700, letterSpacing: 0.5, marginBottom: 12 }}>CONFIRMED ALLERGY</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 32 }}>🥛</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Dairy / Lactose</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Severe — avoid all dairy products</div>
          </div>
          <Badge bg="rgba(239,68,68,0.2)" color="#f87171" border="rgba(239,68,68,0.3)">Confirmed</Badge>
        </div>
      </div>

      {/* Suspect ingredients */}
      {topSuspects.length > 0 ? (
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>INGREDIENT SUSPECTS</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginBottom: 18 }}>Present before digestive reactions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {topSuspects.map(([ing, count]) => {
              const total = meals.filter(m => m.ingredients?.includes(ing)).length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const barColor = pct > 66 ? "#ef4444" : pct > 33 ? "#f97316" : "#eab308";
              return (
                <div key={ing}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{ing}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{count}/{total} meals · {pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: barColor, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔬</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Patterns will appear here</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", marginTop: 6 }}>Log meals and reactions to build your sensitivity profile</div>
        </div>
      )}

      {/* Symptom frequency */}
      {symptoms.length > 0 && (
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 16 }}>SYMPTOM FREQUENCY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DIGESTIVE_SYMPTOMS.map(({ id, label, emoji }) => {
              const count = symptoms.filter(s => s.symptoms?.includes(id)).length;
              if (!count) return null;
              const pct = Math.round((count / symptoms.length) * 100);
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 15, width: 22, flexShrink: 0 }}>{emoji}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", width: 96, flexShrink: 0, textTransform: "capitalize" }}>{label}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: "linear-gradient(90deg,#a855f7,#ec4899)" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", width: 20, textAlign: "right", flexShrink: 0 }}>{count}</span>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Severity breakdown */}
      {symptoms.length > 0 && (
        <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 14 }}>SEVERITY BREAKDOWN</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {["Mild", "Moderate", "Severe"].map(sev => {
              const count = symptoms.filter(s => s.severity === sev).length;
              return (
                <div key={sev} style={{ borderRadius: 12, padding: "14px 8px", textAlign: "center", background: SEVERITY_COLORS[sev]?.bg, border: `1px solid ${SEVERITY_COLORS[sev]?.border}` }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: SEVERITY_COLORS[sev]?.text }}>{count}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{sev}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [meals, setMeals] = useLocalStorage("nourish_meals", []);
  const [symptoms, setSymptoms] = useLocalStorage("nourish_symptoms", []);
  const [tab, setTab] = useState("log");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleSaved(type, record) {
    if (type === "meal") setMeals(prev => [record, ...prev]);
    else setSymptoms(prev => [record, ...prev]);
  }

  function deleteMeal(id) { setMeals(prev => prev.filter(m => m.id !== id)); }
  function deleteSymptom(id) { setSymptoms(prev => prev.filter(s => s.id !== id)); }

  const ingredientCounts = {};
  meals.forEach(meal => {
    if (!meal.ingredients) return;
    const mealSymptoms = symptoms.filter(s => s.meal_log_id === meal.id);
    if (mealSymptoms.length > 0) meal.ingredients.forEach(ing => { ingredientCounts[ing] = (ingredientCounts[ing] || 0) + 1; });
  });
  const topSuspects = Object.entries(ingredientCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const panels = { log: <LogPanel meals={meals} symptoms={symptoms} onSaved={handleSaved} />, history: <HistoryPanel meals={meals} symptoms={symptoms} onDeleteMeal={deleteMeal} onDeleteSymptom={deleteSymptom} />, insights: <InsightsPanel meals={meals} symptoms={symptoms} /> };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {isMobile ? (
        /* ── MOBILE LAYOUT ── */
        <>
          <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,15,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ padding: "14px 16px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: "linear-gradient(135deg,#34d399,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>Nourish</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Food sensitivity tracker</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{meals.length}m · {symptoms.length}r</div>
              </div>
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {NAV_ITEMS.map(({ id, label }) => (
                  <button key={id} onClick={() => setTab(id)} style={{ flex: 1, paddingBottom: 12, fontSize: 13, fontWeight: 500, background: "none", border: "none", cursor: "pointer", color: tab === id ? "#34d399" : "rgba(255,255,255,0.3)", borderBottom: tab === id ? "2px solid #34d399" : "2px solid transparent", marginBottom: -1, transition: "all 0.2s" }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: "20px 16px 100px" }}>{panels[tab]}</div>
        </>
      ) : (
        /* ── DESKTOP LAYOUT ── */
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          {/* Sidebar */}
          <div style={{ width: 240, flexShrink: 0, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "28px 0" }}>
            {/* Logo */}
            <div style={{ padding: "0 24px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 14, background: "linear-gradient(135deg,#34d399,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌿</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.4 }}>Nourish</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Sensitivity tracker</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <div style={{ padding: "16px 12px", flex: 1 }}>
              {NAV_ITEMS.map(({ id, label, emoji }) => (
                <button key={id} onClick={() => setTab(id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 4, background: tab === id ? "rgba(52,211,153,0.1)" : "none", color: tab === id ? "#34d399" : "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: tab === id ? 600 : 400, transition: "all 0.15s", textAlign: "left" }}>
                  <span style={{ fontSize: 16 }}>{emoji}</span>
                  <span>{label}</span>
                  {tab === id && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />}
                </button>
              ))}
            </div>

            {/* Footer stats */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginBottom: 10 }}>ALL TIME</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Meals logged</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>{meals.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Reactions logged</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>{symptoms.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Flagged ingredients</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fb923c" }}>{topSuspects.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
            {/* Top bar */}
            <div style={{ padding: "24px 32px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>
                    {NAV_ITEMS.find(n => n.id === tab)?.emoji} {NAV_ITEMS.find(n => n.id === tab)?.label}
                  </h1>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
                    {tab === "log" && "Track what you eat and how you feel"}
                    {tab === "history" && "Your complete food and reaction history"}
                    {tab === "insights" && "Patterns and sensitivities from your data"}
                  </p>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
                  {new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: "28px 32px 40px", maxWidth: tab === "log" ? 760 : "100%", boxSizing: "border-box" }}>
              {panels[tab]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
