import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  LocateFixed,
  Mic,
  MicOff,
  Moon,
  Navigation,
  Phone,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Sun,
  Timer,
  Users,
  Zap,
} from "lucide-react";
import "./styles.css";

/* ═══════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════ */
const API = import.meta.env.VITE_API_BASE_URL || "";
const CACHE_KEY = "roadsos.cache-package.v2";

const FILTERS = [
  { value: "hospital", label: "Hospital", color: "#22d3ee" },
  { value: "trauma_center", label: "Trauma", color: "#f43f5e" },
  { value: "ambulance", label: "Ambulance", color: "#facc15" },
  { value: "police", label: "Police", color: "#818cf8" },
  { value: "fire_station", label: "Fire", color: "#fb923c" },
  { value: "tow", label: "Tow", color: "#a3e635" },
  { value: "repair", label: "Repair", color: "#94a3b8" },
];
const ALL_TYPES = FILTERS.map((f) => f.value);

const REGIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "chennai", label: "Chennai" },
  { value: "bengaluru", label: "Bengaluru" },
];
const LANGS = [
  { value: "english", label: "EN" },
  { value: "tamil", label: "TA" },
  { value: "hindi", label: "HI" },
];
const QUICK_ASKS = [
  "Nearest hospital",
  "Nearest police station",
  "Fire station nearby",
  "What should I do after an accident?",
];
const INTENTS = [
  { tokens: ["hospital", "trauma", "injur", "wound"], types: ["hospital", "trauma_center"] },
  { tokens: ["ambulance", "108", "paramedic"], types: ["ambulance", "fallback_emergency"] },
  { tokens: ["police", "fir", "100"], types: ["police", "fallback_emergency"] },
  { tokens: ["tow", "breakdown", "puncture", "repair"], types: ["tow", "repair"] },
  { tokens: ["fire", "blaze"], types: ["fire_station", "fallback_emergency"] },
  { tokens: ["what do", "what should", "first aid", "help"], types: ["_template_firstaid"] },
];
const TRANSLATIONS = {
  tamil: [["Road accident","சாலை விபத்து"],["injured","காயமடைந்தவர்"],["Severity","தீவிரம்"],["Vehicle","வாகனம்"],["Hazards","ஆபத்துகள்"],["Callback","திரும்ப அழைக்க"],["Notes","குறிப்புகள்"],["Coordinates","இட நிர்ணயம்"],["Nearest contacts","அருகிலுள்ள தொடர்புகள்"],["Timestamp","நேரம்"],["hospital","மருத்துவமனை"],["ambulance","ஆம்புலன்ஸ்"],["police","காவல்"],["fire","தீயணைப்பு"],["help","உதவி"]],
  hindi: [["Road accident","सड़क दुर्घटना"],["injured","घायल"],["Severity","गंभीरता"],["Vehicle","वाहन"],["Hazards","खतरे"],["Callback","वापस कॉल"],["Notes","नोट्स"],["Coordinates","निर्देशांक"],["Nearest contacts","नजदीकी संपर्क"],["Timestamp","समय"],["hospital","अस्पताल"],["ambulance","एम्बुलेंस"],["police","पुलिस"],["fire","आग"],["help","मदद"]],
};
const DEFAULT_LOC = { lat: "12.9915", lon: "80.2337", landmark: "IIT Madras main gate" };
const ERSS = {
  id: "india-erss-112", name: "ERSS 112 (National Emergency)", type: "fallback_emergency",
  lat: null, lon: null, phone: "112", locality: "National", region: "India", country: "India",
  source_url: "https://112.gov.in/", source_name: "Government of India ERSS",
  verified_at: "2026-05-16", availability: "24x7", confidence_score: 1,
  confidence_reasons: ["Official national ERSS"], notes: "Police, fire, ambulance unified helpline",
};
const GOOD_SAMARITAN =
  "You are legally protected under the Motor Vehicles (Amendment) Act 2019, Section 134A. No police detention for helping. You may be eligible for a cash reward from your state government.";

/* ═══════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════ */
function readCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; } }
function writeCache(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...d, cached_at: new Date().toISOString() })); } catch {} }
function fmtType(t) { return (t || "service").replace(/_/g, " "); }
function cacheAge(c) {
  if (!c?.cached_at) return "not cached";
  const m = Math.floor((Date.now() - Date.parse(c.cached_at)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
function detectRegion(lat, lon, sel) {
  if (sel !== "auto") return sel;
  if (lat >= 12.8 && lat <= 13.2 && lon >= 80 && lon <= 80.35) return "chennai";
  if (lat >= 12.85 && lat <= 13.1 && lon >= 77.45 && lon <= 77.75) return "bengaluru";
  return "national";
}
function translate(text, lang) {
  if (lang === "english") return text;
  return (TRANSLATIONS[lang] || []).reduce((t, [en, tr]) => t.replaceAll(en, tr), text);
}
function dedup(arr) {
  const s = new Set();
  return arr.filter((c) => { const k = c.id || `${c.name}-${c.phone}`; if (s.has(k)) return false; s.add(k); return true; });
}

/* ═══════════════════════════════════════════════════════
   LEAFLET MAP
   ═══════════════════════════════════════════════════════ */
function LiveMap({ contacts, userLat, userLon }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false })
      .setView([userLat, userLon], 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const userIcon = L.divIcon({ className: "map-user-pin", html: '<div class="pulse-ring"></div>', iconSize: [22, 22] });
    markersRef.current.push(L.marker([userLat, userLon], { icon: userIcon }).addTo(map));
    contacts.filter((c) => c.lat && c.lon).slice(0, 12).forEach((c, i) => {
      const color = FILTERS.find((f) => f.value === c.type)?.color || "#fff";
      const icon = L.divIcon({ className: "map-pin", html: `<div style="background:${color}">${i + 1}</div>`, iconSize: [26, 26] });
      const m = L.marker([c.lat, c.lon], { icon }).bindPopup(`<b>${c.name}</b><br>${c.phone}<br>${c.distance_km ?? "?"}km`);
      markersRef.current.push(m.addTo(map));
    });
    map.setView([userLat, userLon], 13);
  }, [contacts, userLat, userLon]);

  return <div ref={containerRef} className="live-map" />;
}

/* ═══════════════════════════════════════════════════════
   CONTACT CARD — gauge bar for confidence (skill: Bullet Chart)
   ═══════════════════════════════════════════════════════ */
function ContactCard({ contact, index }) {
  const [open, setOpen] = useState(false);
  const conf = contact.effective_confidence ?? contact.confidence_score ?? 0;
  const reasons = [...(contact.ranking_reasons || []), ...(contact.confidence_reasons || [])].slice(0, 4);
  const accent = FILTERS.find((f) => f.value === contact.type)?.color || "#94a3b8";

  return (
    <article className="glass-card contact-card" style={{ "--card-accent": accent }}>
      <div className="cc-header">
        <span className="cc-rank">{index + 1}</span>
        <div className="cc-info">
          <h3>{contact.name}</h3>
          <div className="cc-meta">
            {contact.distance_km != null && <span className="cc-dist">{contact.distance_km} km</span>}
            <span className="cc-type" style={{ background: accent }}>{fmtType(contact.type)}</span>
          </div>
        </div>
        <a className="cc-call" href={`tel:${contact.phone}`} onClick={() => navigator.vibrate?.(40)}>
          <Phone size={14} /> {contact.phone}
        </a>
      </div>
      {/* Confidence gauge */}
      <div className="gauge-wrap">
        <div className="gauge-fill" style={{ width: `${conf * 100}%`, background: accent }} />
        <span className="gauge-label">{(conf * 100).toFixed(0)}% verified</span>
      </div>
      <div className="cc-row">
        <span>{contact.verified_at}</span>
        <span>{contact.availability}</span>
        {contact.source_url && <a href={contact.source_url} target="_blank" rel="noreferrer">{contact.source_name}</a>}
      </div>
      {reasons.length > 0 && (
        <button className="trust-btn" onClick={() => setOpen(!open)}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Trust ledger
        </button>
      )}
      {open && <ul className="trust-list">{reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
    </article>
  );
}

/* ═══════════════════════════════════════════════════════
   TIMER — visual KPI indicator (skill: Gauge Chart)
   ═══════════════════════════════════════════════════════ */
function TimerCard({ startedAt, elapsed }) {
  const [live, setLive] = useState(0);
  useEffect(() => {
    if (!startedAt || elapsed) return;
    const id = setInterval(() => setLive(((performance.now() - startedAt) / 1000).toFixed(1)), 80);
    return () => clearInterval(id);
  }, [startedAt, elapsed]);
  const val = elapsed || live || "0.0";
  const fast = parseFloat(val) < 10;
  return (
    <div className={`timer-pill glass-card ${fast ? "timer-fast" : "timer-slow"}`}>
      <Timer size={18} />
      <span className="timer-val">{val}s</span>
      <span className="timer-note">{elapsed ? (fast ? "Target met" : "Complete") : "Elapsed"}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════ */
function App() {
  const [online, setOnline] = useState(navigator.onLine);
  const [loc, setLoc] = useState(DEFAULT_LOC);
  const [locSource, setLocSource] = useState("manual");
  const [contacts, setContacts] = useState([]);
  const [fallbacks, setFallbacks] = useState([ERSS]);
  const [filters, setFilters] = useState(ALL_TYPES);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [cache, setCache] = useState(readCache());
  const [region, setRegion] = useState("auto");
  const [nightMode, setNightMode] = useState(true);
  const [section, setSection] = useState("rescue");
  const [assistQ, setAssistQ] = useState("");
  const [assistA, setAssistA] = useState(null);
  const [assistMatches, setAssistMatches] = useState([]);
  const [listening, setListening] = useState(false);
  const [incident, setIncident] = useState({ injury_count: "1", hazards: "traffic", notes: "", callback: "", vehicle: "Two-wheeler", severity: "moderate" });
  const [packet, setPacket] = useState("");
  const [lang, setLang] = useState("english");
  const [installPrompt, setInstallPrompt] = useState(null);

  const lat = Number(loc.lat);
  const lon = Number(loc.lon);
  const activeRegion = useMemo(() => detectRegion(lat, lon, region), [lat, lon, region]);
  const filteredContacts = useMemo(() => contacts.filter((c) => filters.includes(c.type)), [contacts, filters]);

  /* ── Lifecycle ── */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", nightMode ? "dark" : "light");
  }, [nightMode]);

  /* ── Voice (Web Speech API) ── */
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onresult = (e) => { setAssistQ(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }, []);

  /* ── GPS ── */
  function useGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude.toFixed(6), lon: p.coords.longitude.toFixed(6), landmark: "GPS location" }); setLocSource("gps"); },
      () => setLocSource("manual"),
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }

  /* ── Cache ── */
  async function refreshCache() {
    if (!online) return;
    try {
      const r = await fetch(`${API}/api/cache-package?region=${activeRegion}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      writeCache(d);
      setCache(readCache());
    } catch {}
  }

  /* ── Rescue Drill ── */
  async function findServices() {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const start = performance.now();
    setStartedAt(start); setElapsed(null); setLoading(true); setWarnings([]);
    if (!online) { loadOffline(start); setLoading(false); return; }
    try {
      const r = await fetch(`${API}/api/nearby-services`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, radius_km: 8, service_types: filters, location_source: locSource, region: activeRegion }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setContacts(d.services || []);
      setFallbacks(d.fallback_contacts?.length ? d.fallback_contacts : [ERSS]);
      setWarnings(d.warnings || []);
      setElapsed(((performance.now() - start) / 1000).toFixed(1));
    } catch { loadOffline(start); }
    setLoading(false);
  }

  function loadOffline(start) {
    const c = readCache();
    setContacts(c?.contacts || []);
    setFallbacks(c?.fallback_contacts?.length ? c.fallback_contacts : [ERSS]);
    setWarnings(["Offline mode active — displaying cached data."]);
    setElapsed(((performance.now() - start) / 1000).toFixed(1));
    setCache(c);
  }

  /* ── Assistant ── */
  async function askAssistant() {
    if (!assistQ.trim()) return;
    try {
      const r = await fetch(`${API}/api/assistant`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: assistQ, lat, lon, region: activeRegion }),
      });
      if (r.ok) { const d = await r.json(); setAssistA(d); setAssistMatches(d.matched_contacts || []); return; }
    } catch {}
    // Local fallback (retrieval-based)
    const q = assistQ.toLowerCase();
    const pool = dedup([...contacts, ...(cache?.contacts || []), ...fallbacks]);
    const intent = INTENTS.find((i) => i.tokens.some((t) => q.includes(t)));
    if (intent && intent.types[0] === "_template_firstaid") {
      setAssistA({ answer: "Keep the injured person still unless immediate danger. Warn traffic. Call 112. Do not move someone with possible spinal injury. This is safety guidance, not medical advice.", refusal_reason: null });
      setAssistMatches([]);
    } else if (intent) {
      const m = pool.filter((c) => intent.types.includes(c.type)).slice(0, 4);
      setAssistA({ answer: `Retrieved ${m.length} verified contact(s) from the curated dataset.`, refusal_reason: null });
      setAssistMatches(m);
    } else {
      setAssistA({ answer: "This query falls outside verified data boundaries. For emergencies, dial ERSS 112.", refusal_reason: "query_outside_verified_dataset" });
      setAssistMatches([]);
    }
  }

  /* ── Incident Packet ── */
  function generatePacket() {
    const lines = [
      "ROAD ACCIDENT REPORT",
      `Coordinates: ${loc.lat}, ${loc.lon}`,
      `Landmark: ${loc.landmark}`,
      `Injured: ${incident.injury_count}`,
      `Severity: ${incident.severity}`,
      `Vehicle: ${incident.vehicle}`,
      `Hazards: ${incident.hazards}`,
      `Callback: ${incident.callback || "not provided"}`,
      `Notes: ${incident.notes || "none"}`,
      `Timestamp: ${new Date().toISOString()}`,
      `Nearest contacts: ${contacts.slice(0, 3).map((c) => `${c.name} (${c.phone})`).join("; ") || "see app"}`,
    ].join("\n");
    setPacket(translate(lines, lang));
  }
  function copyPacket() { navigator.clipboard?.writeText(packet); }
  function sharePacket() { navigator.share?.({ title: "RoadSoS Incident", text: packet }).catch(() => {}); }

  /* ═══════════════════════════════
     RENDER
     ═══════════════════════════════ */
  return (
    <div className="shell">
      {/* ─── Sidebar Nav ─── */}
      <nav className="sidebar">
        <div className="brand">
          <Shield size={20} />
          <span>Road<mark>SoS</mark></span>
        </div>
        <div className="nav-links">
          <button className={section === "rescue" ? "active" : ""} onClick={() => setSection("rescue")}>
            <Zap size={17} /><span>Rescue</span>
          </button>
          <button className={section === "assistant" ? "active" : ""} onClick={() => setSection("assistant")}>
            <Search size={17} /><span>Assistant</span>
          </button>
          <button className={section === "incident" ? "active" : ""} onClick={() => setSection("incident")}>
            <Clipboard size={17} /><span>Report</span>
          </button>
          <button className={section === "bystander" ? "active" : ""} onClick={() => setSection("bystander")}>
            <Users size={17} /><span>Bystander</span>
          </button>
        </div>
        <div className="nav-bottom">
          <button onClick={() => setNightMode(!nightMode)} title="Toggle theme">
            {nightMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          {installPrompt && (
            <button onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }} title="Install PWA">
              <Download size={15} />
            </button>
          )}
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="main-content">

        {/* ════════ RESCUE ════════ */}
        {section === "rescue" && (
          <>
            <header className="hero">
              <div className="hero-copy">
                <h1>Verified Rescue Contacts<br /><mark>Under 10 Seconds</mark></h1>
                <p>Source-backed. Distance-ranked. <strong>Zero hallucination.</strong> Works offline.</p>
              </div>
              <TimerCard startedAt={startedAt} elapsed={elapsed} />
            </header>

            {/* Location */}
            <section className="loc-bar glass">
              <div className="loc-fields">
                <div className="field"><label>Lat</label><input value={loc.lat} onChange={(e) => setLoc({ ...loc, lat: e.target.value })} /></div>
                <div className="field"><label>Lon</label><input value={loc.lon} onChange={(e) => setLoc({ ...loc, lon: e.target.value })} /></div>
                <div className="field wide"><label>Landmark</label><input value={loc.landmark} onChange={(e) => setLoc({ ...loc, landmark: e.target.value })} /></div>
              </div>
              <div className="loc-actions">
                <button className="icon-btn" onClick={useGps} title="Use GPS"><LocateFixed size={15} /></button>
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                  {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button className="icon-btn" onClick={refreshCache} title="Download offline pack"><Download size={15} /></button>
                <span className="muted">{cacheAge(cache)}</span>
              </div>
            </section>

            {/* Filters */}
            <div className="chip-row">
              {FILTERS.map((f) => (
                <button key={f.value} className={`chip ${filters.includes(f.value) ? "on" : ""}`} style={{ "--c": f.color }}
                  onClick={() => setFilters((p) => p.includes(f.value) ? p.filter((x) => x !== f.value) : [...p, f.value])}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* CTA */}
            <button className="cta" onClick={findServices} disabled={loading}>
              <Zap size={18} />{loading ? "Scanning..." : "Launch Rescue Drill"}
            </button>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="alert glass">
                <AlertTriangle size={15} />
                {warnings.map((w, i) => <span key={i}>{w}</span>)}
              </div>
            )}

            {/* Results: Map + Cards */}
            {(filteredContacts.length > 0 || fallbacks.length > 0) && (
              <div className="results">
                <div className="map-wrap">
                  <LiveMap contacts={filteredContacts} userLat={lat} userLon={lon} />
                  <div className="stats glass">
                    <div><strong>{filteredContacts.length}</strong><span>Contacts</span></div>
                    <div><strong>{activeRegion}</strong><span>Region</span></div>
                    <div><strong>{locSource}</strong><span>Source</span></div>
                  </div>
                </div>
                <div className="card-list">
                  {filteredContacts.map((c, i) => <ContactCard key={c.id || i} contact={c} index={i} />)}
                  {filteredContacts.length === 0 && fallbacks.map((c, i) => <ContactCard key={c.id || i} contact={c} index={i} />)}
                </div>
              </div>
            )}

            {/* Good Samaritan */}
            <div className="legal glass">
              <ShieldCheck size={16} />
              <div><strong>Good Samaritan Protection</strong><p>{GOOD_SAMARITAN}</p></div>
            </div>
          </>
        )}

        {/* ════════ ASSISTANT ════════ */}
        {section === "assistant" && (
          <section className="panel-section">
            <h2>Verified Data Assistant</h2>
            <p className="desc">Retrieves only from curated contact database. Refuses what it cannot verify.</p>
            <div className="quick-row">
              {QUICK_ASKS.map((q) => <button key={q} className="chip on" onClick={() => setAssistQ(q)}>{q}</button>)}
            </div>
            <div className="input-row glass">
              <input value={assistQ} onChange={(e) => setAssistQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askAssistant()} placeholder="Ask about verified services..." />
              <button className="icon-btn" onClick={startVoice} title="Voice input">{listening ? <MicOff size={15} /> : <Mic size={15} />}</button>
              <button className="sm-btn" onClick={askAssistant}><Search size={14} /> Ask</button>
            </div>
            {assistA && (
              <div className={`answer-box glass ${assistA.refusal_reason ? "refused" : ""}`}>
                <p>{assistA.answer}</p>
                {assistA.refusal_reason && <span className="badge-refuse">{assistA.refusal_reason}</span>}
              </div>
            )}
            {assistMatches.length > 0 && (
              <div className="card-list">
                {assistMatches.map((c, i) => <ContactCard key={c.id || i} contact={c} index={i} />)}
              </div>
            )}
          </section>
        )}

        {/* ════════ INCIDENT ════════ */}
        {section === "incident" && (
          <section className="panel-section">
            <h2>Incident Packet Generator</h2>
            <p className="desc">Structured report for first responders. Copy or share instantly.</p>
            <div className="form glass">
              <div className="form-row">
                <div className="field"><label>Injured</label><input type="number" min="0" value={incident.injury_count} onChange={(e) => setIncident({ ...incident, injury_count: e.target.value })} /></div>
                <div className="field"><label>Vehicle</label><input value={incident.vehicle} onChange={(e) => setIncident({ ...incident, vehicle: e.target.value })} /></div>
                <div className="field"><label>Severity</label>
                  <select value={incident.severity} onChange={(e) => setIncident({ ...incident, severity: e.target.value })}>
                    <option value="critical">Critical</option><option value="moderate">Moderate</option><option value="minor">Minor</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field wide"><label>Hazards</label><input value={incident.hazards} onChange={(e) => setIncident({ ...incident, hazards: e.target.value })} /></div>
                <div className="field"><label>Callback</label><input value={incident.callback} onChange={(e) => setIncident({ ...incident, callback: e.target.value })} placeholder="Phone" /></div>
              </div>
              <div className="field"><label>Notes</label><textarea rows={2} value={incident.notes} onChange={(e) => setIncident({ ...incident, notes: e.target.value })} /></div>
              <div className="form-actions">
                <div className="lang-btns">{LANGS.map((l) => <button key={l.value} className={lang === l.value ? "active" : ""} onClick={() => setLang(l.value)}>{l.label}</button>)}</div>
                <button className="sm-btn" onClick={generatePacket}><Clipboard size={14} /> Generate</button>
              </div>
            </div>
            {packet && (
              <div className="packet glass">
                <pre>{packet}</pre>
                <div className="pkt-actions">
                  <button onClick={copyPacket}><Copy size={13} /> Copy</button>
                  <button onClick={sharePacket}><Share2 size={13} /> Share</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ════════ BYSTANDER ════════ */}
        {section === "bystander" && (
          <section className="panel-section">
            <h2>Bystander Action Guide</h2>
            <p className="desc">No medical training needed. Pick one role and act immediately.</p>
            <div className="role-grid">
              {[
                { t: "Caller", d: "Dial 112. State: location, injured count, hazards. Stay on line.", icon: <Phone size={18} /> },
                { t: "Traffic Guard", d: "Warn vehicles 50m ahead. Activate hazard lights.", icon: <AlertTriangle size={18} /> },
                { t: "Scene Recorder", d: "Note plates, time, witnesses. Do NOT move the injured.", icon: <Clipboard size={18} /> },
                { t: "Location Sharer", d: "Share GPS coordinates via incident packet.", icon: <Navigation size={18} /> },
              ].map((r) => (
                <div className="role-card glass-card" key={r.t}>
                  <div className="role-icon">{r.icon}</div>
                  <h3>{r.t}</h3>
                  <p>{r.d}</p>
                </div>
              ))}
            </div>
            <div className="legal glass">
              <ShieldCheck size={16} />
              <div><strong>Legally Protected</strong><p>{GOOD_SAMARITAN}</p></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
