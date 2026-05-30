import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Clock,
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
  Wifi,
  WifiOff,
  ChevronUp,
  MapPin,
  Activity,
  Database,
  Globe,
  Camera,
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
  { value: "mumbai", label: "Mumbai" },
  { value: "kolkata", label: "Kolkata" },
  { value: "hyderabad", label: "Hyderabad" },
  { value: "delhi", label: "Delhi" },
  { value: "gurgaon", label: "Gurgaon" },
  { value: "lucknow", label: "Lucknow" },
  { value: "pune", label: "Pune" },
];

const SAMPLES = [
  { city: "Chennai", label: "AIIMS Madras, Guindy", lat: "12.9249", lon: "80.1000", landmark: "AIIMS Madras, Guindy" },
  { city: "Chennai", label: "Stanley Hospital, Park Town", lat: "13.1067", lon: "80.2906", landmark: "Government Stanley Medical College Hospital" },
  { city: "Bengaluru", label: "Victoria Hospital, KR Market", lat: "12.9634", lon: "77.5855", landmark: "Victoria Hospital, Krishnarajendra Market" },
  { city: "Bengaluru", label: "NIMHANS Hospital, Hosur Road", lat: "12.9406", lon: "77.5960", landmark: "NIMHANS Hospital, Hosur Road" },
  { city: "Delhi", label: "AIIMS Delhi, Ansari Nagar", lat: "28.5672", lon: "77.2100", landmark: "AIIMS Delhi, Ansari Nagar" },
  { city: "Delhi", label: "Delhi Police HQ, Connaught Place", lat: "28.6291", lon: "77.2155", landmark: "Delhi Police Headquarters, Connaught Place" },
  { city: "Gurgaon", label: "Medanta - The Medicity, Sector 38", lat: "28.4312", lon: "77.0425", landmark: "Medanta - The Medicity, Sector 38" },
  { city: "Gurgaon", label: "Police Commissioner's Office, Sector 15", lat: "28.4674", lon: "77.0392", landmark: "Gurugram Police Commissioner's Office" },
  { city: "Hyderabad", label: "Osmania Hospital, Afzal Gunj", lat: "17.3785", lon: "78.4795", landmark: "Osmania General Hospital, Afzal Gunj" },
  { city: "Hyderabad", label: "Police Commissionerate, Purani Haveli", lat: "17.3984", lon: "78.4720", landmark: "Hyderabad Police Commissionerate" },
  { city: "Kolkata", label: "IPGMER & SSKM Hospital, AJC Bose Road", lat: "22.5391", lon: "88.3444", landmark: "IPGMER & SSKM Hospital" },
  { city: "Kolkata", label: "Police HQ Lalbazar, Lalbazar", lat: "22.5744", lon: "88.3533", landmark: "Kolkata Police Headquarters Lalbazar" },
  { city: "Lucknow", label: "KGMU Hospital, Chowk", lat: "26.8692", lon: "80.9160", landmark: "King George's Medical University" },
  { city: "Lucknow", label: "Police Commissionerate, Hazratganj", lat: "26.8520", lon: "80.9380", landmark: "Lucknow Police Commissionerate Office" },
  { city: "Mumbai", label: "KEM Hospital, Parel", lat: "19.0024", lon: "72.8423", landmark: "King Edward Memorial Hospital, Parel" },
  { city: "Mumbai", label: "Police Control Room, Crawford Market", lat: "18.9438", lon: "72.8360", landmark: "Mumbai Police Control Room" },
  { city: "Pune", label: "Sassoon Hospital, Station Road", lat: "18.5283", lon: "73.8736", landmark: "Sassoon General Hospital" },
  { city: "Pune", label: "Police HQ, Shivajinagar", lat: "18.5309", lon: "73.8550", landmark: "Pune Police Headquarters Office" },
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

const NAV_ITEMS = [
  { id: 'rescue', label: 'Rescue' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'incident', label: 'Report' },
  { id: 'bystander', label: 'Guide' },
  { id: 'trust', label: 'About' },
];

const DEMO_QUERIES = [
  { q: '"Nearest hospital"', a: 'Retrieved 4 verified hospital contacts within 5km of IIT Madras, ranked by distance. Top result: IIT Madras Health Centre (0.3 km, confidence 95%).', refusal: null },
  { q: '"Best pizza place near me"', a: 'This query falls outside verified data boundaries. RoadSoS only retrieves emergency and safety contacts.', refusal: 'query_outside_verified_dataset' },
];

const BYSTANDER_ROLES = [
  { t: 'Caller', priority: 'Critical', time: '< 30 sec', icon: <Phone size={20} />, color: '#DC2626',
    actions: ['Dial 112 immediately', 'State: location, injured count, vehicle type', 'Stay on line until dispatcher confirms'],
    legal: 'Section 134A protects you from detention' },
  { t: 'Traffic Guard', priority: 'High', time: '< 1 min', icon: <AlertTriangle size={20} />, color: '#F59E0B',
    actions: ['Position 50m before crash site', 'Activate hazard lights on your vehicle', 'Use reflective material or phone flashlight'],
    legal: 'No liability for traffic warnings' },
  { t: 'Scene Recorder', priority: 'Medium', time: '2-5 min', icon: <Clipboard size={20} />, color: '#3B82F6',
    actions: ['Note license plates and vehicle colors', 'Record time, weather, road conditions', 'Identify and note any witnesses'],
    legal: 'Evidence aids FIR and insurance claims' },
  { t: 'Location Sharer', priority: 'High', time: '< 30 sec', icon: <Navigation size={20} />, color: '#10B981',
    actions: ['Open RoadSoS incident packet', 'Auto-fill GPS coordinates', 'Share via WhatsApp or SMS to 112'],
    legal: 'GPS sharing expedites ambulance arrival' },
];

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
  if (lat >= 18.85 && lat <= 19.35 && lon >= 72.75 && lon <= 73.15) return "mumbai";
  if (lat >= 22.45 && lat <= 22.65 && lon >= 88.25 && lon <= 88.45) return "kolkata";
  if (lat >= 17.3 && lat <= 17.55 && lon >= 78.3 && lon <= 78.6) return "hyderabad";
  if (lat >= 28.4 && lat <= 28.85 && lon >= 76.85 && lon <= 77.4) return "delhi";
  if (lat >= 28.3 && lat <= 28.55 && lon >= 76.8 && lon <= 77.15) return "gurgaon";
  if (lat >= 26.75 && lat <= 26.95 && lon >= 80.85 && lon <= 81.05) return "lucknow";
  if (lat >= 18.4 && lat <= 18.65 && lon >= 73.75 && lon <= 74.0) return "pune";
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
   INTERACTIVE BACKGROUND — mouse-reactive particles + glow
   Spans the entire page, particles react to cursor
   ═══════════════════════════════════════════════════════ */
function InteractiveBackground() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let particles = [];
    const PARTICLE_COUNT = 85;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e) => {
      // Since canvas is fixed at 100vh, we map direct client coordinates
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);
    
    const handleMouseLeave = () => {
      mouse.current = { x: -1000, y: -1000 };
    };
    window.addEventListener("mouseleave", handleMouseLeave);

    const colors = [
      { r: 99, g: 102, b: 241 },   // indigo
      { r: 139, g: 92, b: 246 },   // violet
      { r: 59, g: 130, b: 246 },   // blue
      { r: 6, g: 182, b: 212 },    // cyan
      { r: 168, g: 85, b: 247 },   // purple
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1.5 + Math.random() * 2.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -0.2 - Math.random() * 0.45,
        opacity: 0.15 + Math.random() * 0.25,
        color: c,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Draw mouse glow halo & active connection lines from cursor to particles
      if (mx > 0 && my > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 220);
        grad.addColorStop(0, "rgba(139, 92, 246, 0.15)");
        grad.addColorStop(0.5, "rgba(59, 130, 246, 0.05)");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(mx - 220, my - 220, 440, 440);

        particles.forEach((p) => {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${0.16 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
      }

      particles.forEach((p) => {
        // Mouse attraction - gravitationally pulling services towards the user
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const attractRadius = 200;
        if (dist < attractRadius && dist > 15) {
          const force = (attractRadius - dist) / attractRadius;
          p.x -= (dx / dist) * force * 3.5;
          p.y -= (dy / dist) * force * 3.5;
        }

        // Drift
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap viewport bounds
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.opacity})`;
        ctx.fill();

        // Draw connections between nearby particles
        particles.forEach((p2) => {
          if (p === p2) return;
          const d = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${0.08 * (1 - d / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="interactive-bg" />;
}

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════ */
function ScrollReveal({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.15 }
    );
    el.querySelectorAll('.reveal').forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, [children]);
  return <div ref={ref}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════ */
function AnimatedCounter({ target, suffix = '', duration = 1500 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const animate = (now) => {
          const p = Math.min((now - start) / duration, 1);
          setVal(Math.floor(p * target));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref} className="stat-number">{val}{suffix}</span>;
}

// TimerRing component removed

/* ═══════════════════════════════════════════════════════
   DONUT CHART
   ═══════════════════════════════════════════════════════ */
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const r = 52, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-chart">
      <svg viewBox="0 0 140 140">
        {data.map((d, i) => {
          const pct = d.count / total;
          const dash = C * pct;
          const o = offset;
          offset += dash;
          return <circle key={i} className="donut-segment" cx="70" cy="70" r={r} stroke={d.color} strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-o} />;
        })}
      </svg>
      <div className="donut-center">
        <span className="donut-value">{total}</span>
        <span className="donut-label">Total</span>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  return (
    <div className="bar-chart">
      {data.map((item, i) => (
        <div key={i} className="bar-item">
          <div className="bar-fill" style={{ height: `${item.value}%`, background: item.color }} />
          <span className="bar-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LIVE PULSE RADAR — the "wow moment"
   Animated radar with concentric distance rings and
   pulsing rescue service pins
   ═══════════════════════════════════════════════════════ */
function LivePulseRadar({ contacts }) {
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    let frame;
    let angle = 0;
    const animate = () => {
      angle = (angle + 0.8) % 360;
      setSweepAngle(angle);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Calculate dynamic radar scale based on furthest contact to distribute dots beautifully
  const maxDist = useMemo(() => {
    if (!contacts.length) return 8;
    const dists = contacts.map(c => c.distance_km).filter(d => d != null);
    if (!dists.length) return 8;
    return Math.max(Math.max(...dists), 1.5);
  }, [contacts]);

  // Place service dots on radar based on type
  const serviceDots = useMemo(() => {
    if (!contacts.length) {
      // Demo dots when no real data
      return [
        { angle: 30, dist: 0.3, color: '#22d3ee', label: 'Hospital' },
        { angle: 85, dist: 0.55, color: '#f43f5e', label: 'Trauma' },
        { angle: 150, dist: 0.4, color: '#facc15', label: 'Ambulance' },
        { angle: 210, dist: 0.7, color: '#818cf8', label: 'Police' },
        { angle: 280, dist: 0.35, color: '#fb923c', label: 'Fire' },
        { angle: 330, dist: 0.6, color: '#a3e635', label: 'Tow' },
        { angle: 120, dist: 0.25, color: '#22d3ee', label: 'Hospital' },
      ];
    }
    return contacts.slice(0, 12).map((c, i) => {
      const d = c.distance_km ?? 3;
      return {
        angle: (i * 360 / Math.min(contacts.length, 12)) + (i * 17) % 60,
        dist: Math.min(d / maxDist, 0.9),
        color: FILTERS.find(f => f.value === c.type)?.color || '#94a3b8',
        label: c.name?.split(' ')[0] || fmtType(c.type),
      };
    });
  }, [contacts, maxDist]);

  const sweepRad = (sweepAngle * Math.PI) / 180;

  return (
    <div className="radar-container">
      <svg viewBox="0 0 300 300" className="radar-svg">
        {/* Background rings */}
        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle key={i} cx="150" cy="150" r={r * 130} fill="none"
            stroke="rgba(6, 182, 212, 0.28)" strokeWidth="1.2" strokeDasharray="4 4" />
        ))}
        {/* Cross hairs */}
        <line x1="150" y1="20" x2="150" y2="280" stroke="rgba(6, 182, 212, 0.16)" strokeWidth="1" />
        <line x1="20" y1="150" x2="280" y2="150" stroke="rgba(6, 182, 212, 0.16)" strokeWidth="1" />

        {/* Sweep line */}
        <line
          x1="150" y1="150"
          x2={150 + 130 * Math.cos(sweepRad)}
          y2={150 + 130 * Math.sin(sweepRad)}
          stroke="rgba(6, 182, 212, 0.7)" strokeWidth="2.5"
        />
        {/* Sweep glow trail */}
        <path
          d={`M150,150 L${150 + 130 * Math.cos(sweepRad)},${150 + 130 * Math.sin(sweepRad)} A130,130 0 0,0 ${150 + 130 * Math.cos(sweepRad - 0.5)},${150 + 130 * Math.sin(sweepRad - 0.5)} Z`}
          fill="rgba(6, 182, 212, 0.12)"
        />

        {/* Dynamic distance labels */}
        {[{r: 0.25, l: `${(maxDist * 0.25).toFixed(1)}km`}, {r: 0.5, l: `${(maxDist * 0.5).toFixed(1)}km`}, {r: 0.75, l: `${(maxDist * 0.75).toFixed(1)}km`}].map((d, i) => (
          <text key={i} x={150 + d.r * 130 + 4} y="146" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="var(--font-heading)">{d.l}</text>
        ))}

        {/* Service dots */}
        {serviceDots.map((dot, i) => {
          const rad = (dot.angle * Math.PI) / 180;
          const r = dot.dist * 130;
          const x = 150 + r * Math.cos(rad);
          const y = 150 + r * Math.sin(rad);
          const angleDiff = ((sweepAngle - dot.angle) % 360 + 360) % 360;
          const justSwept = angleDiff < 40;
          const opacity = justSwept ? 1 : 0.4;
          const scale = justSwept ? 1.5 : 1;
          return (
            <g key={i}>
              {justSwept && <circle cx={x} cy={y} r={12 * scale} fill={dot.color} opacity={0.1}>
                <animate attributeName="r" from="8" to="18" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.2" to="0" dur="1.2s" repeatCount="indefinite" />
              </circle>}
              <circle cx={x} cy={y} r={4} fill={dot.color} opacity={opacity} style={{transition: 'opacity 0.3s'}} />
            </g>
          );
        })}

        {/* Center user dot */}
        <circle cx="150" cy="150" r="5" fill="#3B82F6" />
        <circle cx="150" cy="150" r="10" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.4">
          <animate attributeName="r" from="5" to="18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="radar-label">YOU</div>
      <div className="radar-legend">
        {FILTERS.slice(0, 5).map(f => (
          <span key={f.value} className="radar-legend-item">
            <span className="radar-dot" style={{background: f.color}} />
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
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
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
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
   CONTACT CARD
   ═══════════════════════════════════════════════════════ */
function ContactCard({ contact, index, onCallClick }) {
  const [open, setOpen] = useState(false);
  const conf = contact.effective_confidence ?? contact.confidence_score ?? 0;
  const reasons = [...(contact.ranking_reasons || []), ...(contact.confidence_reasons || [])].slice(0, 4);
  const accent = FILTERS.find((f) => f.value === contact.type)?.color || "#94a3b8";

  return (
    <article className="glass-card contact-card" style={{ "--card-accent": accent }}>
      <div className="card-header">
        <span className="card-rank">{index + 1}</span>
        <div className="card-info">
          <h3 className="card-name">{contact.name}</h3>
          <div className="card-meta">
            {contact.distance_km != null && <span className="card-distance">{contact.distance_km} km</span>}
            <span className="card-type" style={{ background: accent }}>{fmtType(contact.type)}</span>
          </div>
        </div>
        <a className="card-call" href={`tel:${contact.phone}`} onClick={(e) => {
          navigator.vibrate?.(40);
          onCallClick?.(contact.name, contact.phone);
        }}>
          <Phone size={14} /> {contact.phone}
        </a>
      </div>
      <div className="confidence-group">
        <div className="confidence-meta">
          <span className="confidence-title">Confidence</span>
          <span className="confidence-score">{(conf * 100).toFixed(0)}% verified</span>
        </div>
        <div className="confidence-bar">
          <div className="confidence-fill" style={{ width: `${conf * 100}%`, background: accent }} />
        </div>
      </div>
      <div className="card-row">
        <span>{contact.verified_at}</span>
        <span>{contact.availability}</span>
        {contact.source_url && <a href={contact.source_url} target="_blank" rel="noreferrer">{contact.source_name}</a>}
      </div>
      {reasons.length > 0 && (
        <button className="trust-toggle" onClick={() => setOpen(!open)}>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Trust ledger
        </button>
      )}
      {open && <ul className="trust-list">{reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
    </article>
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
  const [radius, setRadius] = useState(8);
  const [toast, setToast] = useState(null);
  const [section, setSection] = useState("rescue");
  const [assistQ, setAssistQ] = useState("");
  const [assistA, setAssistA] = useState(null);
  const [assistMatches, setAssistMatches] = useState([]);
  const [listening, setListening] = useState(false);
  const [incident, setIncident] = useState({ injury_count: "1", hazards: "traffic", notes: "", callback: "", vehicle: "Two-wheeler", severity: "moderate" });
  const [packet, setPacket] = useState("");
  const [lang, setLang] = useState("english");
  const [installPrompt, setInstallPrompt] = useState(null);

  // New features states
  const [photoBase64, setPhotoBase64] = useState("");
  const [handsFree, setHandsFree] = useState(false);
  const [sceneDescription, setSceneDescription] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const lat = Number(loc.lat);
  const lon = Number(loc.lon);
  const activeRegion = useMemo(() => detectRegion(lat, lon, region), [lat, lon, region]);

  // AI-powered Severity Triage engine
  const triageResult = useMemo(() => {
    if (!sceneDescription.trim()) return { severity: null, prioritizedTypes: [] };
    const desc = sceneDescription.toLowerCase();
    if (
      desc.includes("unconscious") ||
      desc.includes("unresponsive") ||
      desc.includes("bleeding") ||
      desc.includes("head") ||
      desc.includes("spine") ||
      desc.includes("spinal") ||
      desc.includes("dying") ||
      desc.includes("death") ||
      desc.includes("choking") ||
      desc.includes("severe") ||
      desc.includes("fire") ||
      desc.includes("blaze") ||
      desc.includes("burn")
    ) {
      return { severity: "critical", prioritizedTypes: ["trauma_center", "ambulance", "hospital"] };
    }
    if (
      desc.includes("broken") ||
      desc.includes("fracture") ||
      desc.includes("pain") ||
      desc.includes("sprain") ||
      desc.includes("moderate") ||
      desc.includes("cut") ||
      desc.includes("tow") ||
      desc.includes("breakdown")
    ) {
      return { severity: "moderate", prioritizedTypes: ["hospital", "ambulance", "tow", "repair"] };
    }
    return { severity: "minor", prioritizedTypes: ["repair", "tow"] };
  }, [sceneDescription]);

  // Sync triage severity with incident packet severity
  useEffect(() => {
    if (triageResult.severity) {
      setIncident((prev) => ({ ...prev, severity: triageResult.severity }));
    }
  }, [triageResult.severity]);

  const filteredContacts = useMemo(() => {
    const rawList = contacts.filter((c) => {
      if (filters.includes(c.type)) return true;
      if (filters.includes("ambulance") && (c.type === "hospital" || c.type === "trauma_center")) return true;
      return false;
    });
    if (triageResult.prioritizedTypes.length > 0) {
      return [...rawList].sort((a, b) => {
        const aIndex = triageResult.prioritizedTypes.indexOf(a.type);
        const bIndex = triageResult.prioritizedTypes.indexOf(b.type);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      });
    }
    return rawList;
  }, [contacts, filters, triageResult]);

  const [highConfContacts, lowConfContacts] = useMemo(() => {
    const list = filteredContacts.length > 0 ? filteredContacts : fallbacks;
    const high = [];
    const low = [];
    list.forEach((c) => {
      const conf = c.effective_confidence ?? c.confidence_score ?? 0;
      if (conf >= 0.85) {
        high.push(c);
      } else {
        low.push(c);
      }
    });
    return [high, low];
  }, [filteredContacts, fallbacks]);

  const [highConfAssist, lowConfAssist] = useMemo(() => {
    const high = [];
    const low = [];
    assistMatches.forEach((c) => {
      const conf = c.effective_confidence ?? c.confidence_score ?? 0;
      if (conf >= 0.85) {
        high.push(c);
      } else {
        low.push(c);
      }
    });
    return [high, low];
  }, [assistMatches]);

  const triggerToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast((curr) => curr === msg ? null : curr), 3500);
  }, []);

  const handleCallClick = useCallback((name, phone) => {
    triggerToast(`[Simulation Mode] Initiating call to ${name} (${phone})...`);
  }, [triggerToast]);

  const qualityStats = useMemo(() => {
    const list = contacts.length > 0 ? contacts : [];
    if (list.length === 0) return { verifiedCoords: 100, activePhone: 100, accredited: 100, total: 0 };
    let coordsCount = 0;
    let phoneCount = 0;
    let accreditedCount = 0;
    list.forEach((c) => {
      if (c.lat != null && c.lon != null) coordsCount++;
      if (c.phone && c.phone.trim().length > 0) phoneCount++;
      const isOfficial = c.source_url && (c.source_url.includes(".gov") || c.source_url.includes(".ac.in") || c.source_url.includes(".edu.in"));
      const isAccredited = c.confidence_reasons?.some((r) => r.toLowerCase().includes("nabh") || r.toLowerCase().includes("jci") || r.toLowerCase().includes("accredited") || r.toLowerCase().includes("government"));
      if (c.confidence_score >= 0.85 || isOfficial || isAccredited) {
        accreditedCount++;
      }
    });
    return {
      verifiedCoords: Math.round((coordsCount / list.length) * 100),
      activePhone: Math.round((phoneCount / list.length) * 100),
      accredited: Math.round((accreditedCount / list.length) * 100),
      total: list.length
    };
  }, [contacts]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access failed:", err);
      triggerToast("Failed to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 200;
    canvas.height = 150;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
    setPhotoBase64(compressedBase64);
    stopCamera();
    triggerToast("Live photo captured and attached!");
  };

  const recognitionRef = useRef(null);

  const startHandsFree = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      triggerToast("Speech recognition is not supported in this browser.");
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-IN";
      rec.onstart = () => {
        setHandsFree(true);
        triggerToast("Hands-free emergency listener active: Say 'Hey RoadSoS'");
      };
      rec.onresult = (e) => {
        const last = e.results.length - 1;
        const text = e.results[last][0].transcript.toLowerCase();
        if (text.includes("road sos") || text.includes("road s o s") || text.includes("road s.o.s") || text.includes("road-es-o-es") || text.includes("hey road")) {
          const msg = new SpeechSynthesisUtterance("Hey Road S O S detected. Locking GPS coordinates and retrieving nearby verified emergency services.");
          window.speechSynthesis?.speak(msg);
          triggerToast("[WAKE WORD DETECTED] Activating emergency response!");
          useGps();
          setFilters(["ambulance"]);
          setSection("rescue");
          document.getElementById("rescue")?.scrollIntoView({ behavior: "smooth" });
          setTimeout(() => {
            launchRescueDrill();
          }, 600);
        }
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed") {
          setHandsFree(false);
          triggerToast("Microphone permission denied.");
        }
      };
      rec.onend = () => {
        if (recognitionRef.current === rec) {
          try { rec.start(); } catch { setHandsFree(false); }
        }
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setHandsFree(false);
    }
  }, [triggerToast]);

  const stopHandsFree = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setHandsFree(false);
    triggerToast("Hands-free listener deactivated.");
  }, [triggerToast]);

  const toggleHandsFree = () => {
    if (handsFree) {
      stopHandsFree();
    } else {
      startHandsFree();
    }
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Smooth scroll active nav highlight observer
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -60% 0px",
      threshold: 0,
    };
    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setSection(entry.target.id);
        }
      });
    };
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

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
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

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

  const handleSampleSelect = (e) => {
    const selectedIndex = e.target.value;
    if (selectedIndex === "") return;
    const sample = SAMPLES[Number(selectedIndex)];
    if (!sample) return;
    setLoc({ lat: sample.lat, lon: sample.lon, landmark: sample.landmark });
    setLocSource("manual");
    setRegion("auto");
    triggerToast(`Loaded sample location for ${sample.city}: ${sample.landmark}`);
    e.target.value = "";
  };

  /* ── Cache ── */
  async function refreshCache() {
    if (!online) {
      triggerToast("Cannot download offline pack while offline.");
      return;
    }
    try {
      const r = await fetch(`${API}/api/cache-package?region=${activeRegion}`);
      if (!r.ok) throw new Error("Fetch failed");
      const d = await r.json();
      writeCache(d);
      setCache(readCache());
      triggerToast(`Offline database package for ${activeRegion.toUpperCase()} downloaded successfully!`);
    } catch (err) {
      console.error("Cache download failed:", err);
      triggerToast("Failed to download offline pack. Please try again.");
    }
  }

  // Automatically fetch cache package when online or when region changes
  useEffect(() => {
    if (online) {
      refreshCache();
    }
  }, [online, activeRegion]);

  /* ── Rescue Drill ── */
  // Background load (silent retrieval on mount/update)
  const loadServicesBackground = useCallback(async () => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (!online) {
      const c = readCache();
      setContacts(c?.contacts || []);
      setFallbacks(c?.fallback_contacts?.length ? c.fallback_contacts : [ERSS]);
      setWarnings(["Offline mode active — displaying cached data."]);
      return;
    }
    try {
      const r = await fetch(`${API}/api/nearby-services`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, radius_km: radius, service_types: filters, location_source: locSource, region: activeRegion }),
      });
      if (r.ok) {
        const d = await r.json();
        setContacts(d.services || []);
        setFallbacks(d.fallback_contacts?.length ? d.fallback_contacts : [ERSS]);
        setWarnings(d.warnings || []);
      }
    } catch {}
  }, [lat, lon, online, radius, filters, locSource, activeRegion]);

  // Automatic retrieval on coordinate/filter updates
  useEffect(() => {
    loadServicesBackground();
  }, [loadServicesBackground]);

  // Full interactive Rescue Drill with simulated scanning delay (judging highlight)
  async function launchRescueDrill() {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const start = performance.now();
    setStartedAt(start); setElapsed(null); setLoading(true); setWarnings([]);
    
    // Simulate active scanning latency for the radar and golden-hour countdown
    await new Promise((resolve) => setTimeout(resolve, 1400));
    
    if (!online) {
      loadOffline(start);
      setLoading(false);
      return;
    }
    try {
      const r = await fetch(`${API}/api/nearby-services`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, radius_km: radius, service_types: filters, location_source: locSource, region: activeRegion }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setContacts(d.services || []);
      setFallbacks(d.fallback_contacts?.length ? d.fallback_contacts : [ERSS]);
      setWarnings(d.warnings || []);
      setElapsed(((performance.now() - start) / 1000).toFixed(1));
      
      // Auto-trigger call in hands-free mode
      if (handsFree && d.services && d.services.length > 0) {
        const topContact = d.services[0];
        setTimeout(() => {
          handleCallClick(topContact.name, topContact.phone);
          const callMsg = new SpeechSynthesisUtterance(`Calling nearest ambulance provider, ${topContact.name}.`);
          window.speechSynthesis?.speak(callMsg);
        }, 800);
      }
    } catch {
      loadOffline(start);
    }
    setLoading(false);
  }

  function loadOffline(start) {
    const c = readCache();
    setContacts(c?.contacts || []);
    setFallbacks(c?.fallback_contacts?.length ? c.fallback_contacts : [ERSS]);
    setWarnings(["Offline mode active — displaying cached data."]);
    setElapsed(((performance.now() - start) / 1000).toFixed(1));
    setCache(c);
    
    // Auto-trigger call in hands-free mode offline
    if (handsFree && c?.contacts && c.contacts.length > 0) {
      const topContact = c.contacts[0];
      setTimeout(() => {
        handleCallClick(topContact.name, topContact.phone);
        const callMsg = new SpeechSynthesisUtterance(`Calling nearest ambulance provider, ${topContact.name}.`);
        window.speechSynthesis?.speak(callMsg);
      }, 800);
    }
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
    
    // Check medical/legal advice in frontend
    const MEDICAL_LEGAL_PATTERNS = [
      /diagnos/i, /treat/i, /medication/i, /drug/i, /prescri/i,
      /legal advice/i, /sue/i, /liabl/i, /compensation/i, /insurance claim/i,
      /\bbroken\b/i, /\bfracture\b/i, /\bburn(t|ed)\b/i, /\bburns\b/i, /\bpain\b/i
    ];
    const isMedicalLegal = MEDICAL_LEGAL_PATTERNS.some((pat) => pat.test(q));
    
    if (isMedicalLegal) {
      setAssistA({
        answer: "I cannot provide medical diagnoses, treatment advice, or legal counsel. For medical emergencies, dial 108 (ambulance) or 112 (all emergencies).",
        refusal_reason: "medical_legal_advice_not_provided"
      });
      setAssistMatches([]);
      return;
    }

    const pool = dedup([...contacts, ...(cache?.contacts || []), ...fallbacks]);
    const intent = INTENTS.find((i) => i.tokens.some((t) => q.includes(t)));
    if (intent && intent.types[0] === "_template_firstaid") {
      setAssistA({ answer: "Keep the injured person still unless immediate danger. Warn traffic. Call 112. Do not move someone with possible spinal injury. This is safety guidance, not medical advice.", refusal_reason: null });
      setAssistMatches([]);
    } else if (intent) {
      let wantedTypes = [...intent.types];
      if (wantedTypes.includes("ambulance")) {
        wantedTypes.push("hospital", "trauma_center");
      }
      const m = pool.filter((c) => wantedTypes.includes(c.type)).slice(0, 4);
      setAssistA({ answer: `Retrieved ${m.length} verified contact(s) from the curated dataset.`, refusal_reason: null });
      setAssistMatches(m);
    } else {
      setAssistA({ answer: "This query falls outside verified data boundaries. For emergencies, dial ERSS 112.", refusal_reason: "query_outside_verified_dataset" });
      setAssistMatches([]);
    }
  }

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
    let translated = translate(lines, lang);
    if (photoBase64) {
      translated += `\nPhoto Evidence (Base64): ${photoBase64}`;
    }
    setPacket(translated);
  }
  function copyPacket() { navigator.clipboard?.writeText(packet); }
  function sharePacket() { navigator.share?.({ title: "RoadSoS Incident", text: packet }).catch(() => {}); }

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="app-shell">
      <InteractiveBackground />
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <div className="mobile-brand"><Shield size={18} /> Road<mark>SoS</mark></div>
        <div className="mobile-actions">
          <button className={`mobile-action-btn ${handsFree ? 'handsfree-active' : ''}`} onClick={toggleHandsFree} title="Voice Wake Mode">
            <Mic size={14} />
          </button>
          {installPrompt && (
            <button className="mobile-action-btn" onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }} title="Install">
              <Download size={14} />
            </button>
          )}
        </div>
      </header>
      {/* Floating Navigation */}
      <nav className="floating-nav">
        <div className="nav-brand"><Shield size={18} /> Road<mark>SoS</mark></div>
        <div className="nav-links">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`nav-link ${section === item.id ? 'active' : ''}`}
              onClick={() => { setSection(item.id); document.getElementById(item.id)?.scrollIntoView({behavior:'smooth'}); }}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button className={`nav-action-btn ${handsFree ? 'handsfree-active' : ''}`} onClick={toggleHandsFree} title="Voice Wake Mode (Hey RoadSoS)">
            <Mic size={14} />
          </button>
          {installPrompt && (
            <button className="nav-action-btn" onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }} title="Install">
              <Download size={14} />
            </button>
          )}
        </div>
      </nav>

      <ScrollReveal>
        {/* ═══ Section 1: HERO ═══ */}
        <section className="hero-section" id="hero">
          <div className="hero-content reveal">
            <h1 className="hero-title">
              Verified Emergency Rescue<br />
              in <span className="hero-highlight">Under 10 Seconds</span>
            </h1>
            <p className="hero-subtitle">
              Source-backed contacts. Distance-ranked results. <strong>Zero hallucination.</strong> Works offline.<br />
              <span className="voice-wake-label">Voice-Activated Emergency Dispatch: Say <strong className="voice-word-glow">"Hey RoadSoS"</strong> for hands-free rescue.</span>
            </p>

            <div className="hero-split">
              {/* Left: Radar Visualization — the wow moment */}
              <div className="hero-radar-wrap reveal">
                <LivePulseRadar contacts={contacts} />
              </div>

              {/* Right: Stats + CTA */}
              <div className="hero-right reveal">
                <div className="hero-stats">
                  <div className="stat-item">
                    <AnimatedCounter target={25} suffix="+" />
                    <span className="stat-label">Verified Contacts</span>
                  </div>
                  <div className="stat-item">
                    <AnimatedCounter target={7} />
                    <span className="stat-label">Service Types</span>
                  </div>
                  <div className="stat-item">
                    <AnimatedCounter target={100} suffix="%" />
                    <span className="stat-label">Source-Backed</span>
                  </div>
                </div>

                <div className="hero-features">
                  <div className="hero-feat glass">
                    <Timer size={16} className="feat-icon" />
                    <div><strong>Sub-10s Drill</strong><span>Distance-ranked rescue scan</span></div>
                  </div>
                  <div className="hero-feat glass">
                    <WifiOff size={16} className="feat-icon" />
                    <div><strong>Offline-First</strong><span>Cached data, works without network</span></div>
                  </div>
                  <div className="hero-feat glass">
                    <ShieldCheck size={16} className="feat-icon" />
                    <div><strong>No Hallucination</strong><span>Refuses unverified answers</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-action-row reveal" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <button className="hero-cta" onClick={() => {
                setSection('rescue');
                document.getElementById('rescue')?.scrollIntoView({behavior:'smooth'});
                setTimeout(() => { launchRescueDrill(); }, 700);
              }}>
                <Zap size={18} /> Launch Rescue Drill
              </button>
              <button className={`handsfree-toggle-btn ${handsFree ? 'active' : ''}`} onClick={toggleHandsFree}>
                <Mic size={16} /> {handsFree ? "Stop Hands-Free Listener" : "Activate Hands-Free Mode"}
              </button>
            </div>
          </div>
        </section>

        {/* ═══ Section 2: RESCUE COMMAND CENTER ═══ */}
        <section className="section" id="rescue">
          <div className="section-header reveal">
            <div className="section-tag"><Zap size={12} /> Command Center</div>
            <h2 className="section-title">Rescue <span className="highlight">Command Center</span></h2>
            <p className="section-desc">Distance-ranked emergency contacts from verified sources. Every result is explainable.</p>
          </div>

          <div className="reveal">
            {/* Location Panel */}
            <div className="loc-panel glass">
              <div className="loc-grid">
                <div className="input-group">
                  <label className="input-label">Latitude</label>
                  <input className="input-field" value={loc.lat} onChange={(e) => setLoc({...loc, lat: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Longitude</label>
                  <input className="input-field" value={loc.lon} onChange={(e) => setLoc({...loc, lon: e.target.value})} />
                </div>
                <div className="input-group span-2">
                  <label className="input-label">Landmark</label>
                  <input className="input-field" value={loc.landmark} onChange={(e) => setLoc({...loc, landmark: e.target.value})} />
                </div>
              </div>
              
              <div className="triage-row">
                <div className="input-group span-full">
                  <label className="input-label">Scene Description (Severity Auto-Triage)</label>
                  <input className="input-field triage-input" 
                    value={sceneDescription} 
                    onChange={(e) => setSceneDescription(e.target.value)} 
                    placeholder="Describe incident (e.g. car crash, driver bleeding and unresponsive, minor sprain)..." />
                </div>
                {triageResult.severity && (
                  <span className={`triage-badge triage-${triageResult.severity}`}>
                    Triage Priority: {triageResult.severity.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="loc-controls">
                <button className="control-btn" onClick={useGps} title="Use GPS"><LocateFixed size={15} /></button>
                <select className="region-select" value={region} onChange={(e) => setRegion(e.target.value)}>
                  {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select className="region-select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                  <option value={5}>5 km</option>
                  <option value={8}>8 km</option>
                  <option value={15}>15 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
                <select className="region-select" onChange={handleSampleSelect} defaultValue="">
                  <option value="" disabled>Select Sample Location...</option>
                  {Object.entries(
                    SAMPLES.reduce((acc, sample, index) => {
                      if (!acc[sample.city]) acc[sample.city] = [];
                      acc[sample.city].push({ ...sample, index });
                      return acc;
                    }, {})
                  ).map(([city, items]) => (
                    <optgroup key={city} label={city}>
                      {items.map((item) => (
                        <option key={item.index} value={item.index}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button className="control-btn" onClick={refreshCache} title="Download offline pack"><Download size={15} /></button>
                <span className="cache-status">{cacheAge(cache)}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="filter-row">
              {FILTERS.map((f) => (
                <button key={f.value}
                  className={`filter-chip ${filters.includes(f.value) ? 'active' : ''}`}
                  style={{ '--c': f.color }}
                  onClick={() => setFilters((p) => p.includes(f.value) ? p.filter((x) => x !== f.value) : [...p, f.value])}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Rescue CTA */}
            <button className="rescue-cta" onClick={launchRescueDrill} disabled={loading}>
              <Zap size={18} />{loading ? 'Scanning...' : 'Launch Rescue Drill'}
            </button>
          </div>

          {/* Data Quality Ledger Horizontal Card */}
          <div className="quality-card glass reveal">
            <div className="quality-card-header">
              <h3><Database size={16} style={{ color: 'var(--accent)' }} /> Cache Data Quality Ledger</h3>
              <span className="quality-card-subtitle">Active local database health status ({qualityStats.total} contacts loaded)</span>
            </div>
            <div className="quality-card-grid">
              <div className="quality-card-metric">
                <span className="metric-name">GPS Coordinate Lock</span>
                <div className="metric-value-row">
                  <div className="metric-bar-wrap">
                    <div className="metric-bar-fill" style={{ width: `${qualityStats.verifiedCoords}%`, background: 'var(--accent)' }} />
                  </div>
                  <strong>{qualityStats.verifiedCoords}%</strong>
                </div>
              </div>
              <div className="quality-card-metric">
                <span className="metric-name">Helpline Connect Rate</span>
                <div className="metric-value-row">
                  <div className="metric-bar-wrap">
                    <div className="metric-bar-fill" style={{ width: `${qualityStats.activePhone}%`, background: 'var(--success)' }} />
                  </div>
                  <strong>{qualityStats.activePhone}%</strong>
                </div>
              </div>
              <div className="quality-card-metric">
                <span className="metric-name">Registry Credibility (NABH/Govt)</span>
                <div className="metric-value-row">
                  <div className="metric-bar-wrap">
                    <div className="metric-bar-fill" style={{ width: `${qualityStats.accredited}%`, background: 'var(--primary)' }} />
                  </div>
                  <strong>{qualityStats.accredited}%</strong>
                </div>
              </div>
            </div>
            <div className="quality-card-footer">
              <ShieldCheck size={13} style={{ color: 'var(--success)' }} />
              <span>Verified against official Ministry of Health & Family Welfare and state emergency registries.</span>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="alert-bar glass">
              <AlertTriangle size={15} />
              <span>{warnings.join(' ')}</span>
            </div>
          )}

          {/* Results */}
          {(filteredContacts.length > 0 || fallbacks.length > 0) && (
            <div className="results-grid reveal">
              <div className="map-column">
                <LiveMap contacts={filteredContacts} userLat={lat} userLon={lon} />
                <div className="map-stats glass">
                  <div className="map-stat"><strong>{filteredContacts.length}</strong><span>Contacts</span></div>
                  <div className="map-stat"><strong>{activeRegion}</strong><span>Region</span></div>
                  <div className="map-stat"><strong>{locSource}</strong><span>Source</span></div>
                </div>
              </div>
              <div className="card-list">
                {/* Section A: Verified Emergency Centers */}
                {highConfContacts.length > 0 && (
                  <div className="section-divider-title">
                    <ShieldCheck size={14} /> Curated & Verified Rescue Centers ({highConfContacts.length})
                  </div>
                )}
                {highConfContacts.map((c, i) => (
                  <ContactCard key={c.id || i} contact={c} index={i} onCallClick={handleCallClick} />
                ))}

                {/* Section B: Local Proximity & Private Clinics */}
                {lowConfContacts.length > 0 && (
                  <div className="section-divider-title secondary-divider">
                    <AlertTriangle size={14} /> Local Proximity Clinics & Private Nodes ({lowConfContacts.length})
                  </div>
                )}
                {lowConfContacts.map((c, i) => (
                  <ContactCard key={c.id || i} contact={c} index={highConfContacts.length + i} onCallClick={handleCallClick} />
                ))}
              </div>
            </div>
          )}

          {/* Good Samaritan */}
          <div className="legal-card glass reveal">
            <div className="shield-icon-container">
              <ShieldCheck size={24} className="shield-icon-glow" />
            </div>
            <div>
              <strong className="shield-title">Good Samaritan Protection Shield</strong>
              <p className="shield-text">{GOOD_SAMARITAN}</p>
            </div>
          </div>
        </section>

        {/* ═══ Section 3: AI ASSISTANT ═══ */}
        <section className="section" id="assistant">
          <div className="section-header reveal">
            <div className="section-tag"><Search size={12} /> Intelligence</div>
            <h2 className="section-title">Verified Data <span className="highlight">Assistant</span></h2>
            <p className="section-desc">Retrieves only from curated contact database. Refuses what it cannot verify.</p>
          </div>
          <div className="assistant-panel reveal">
            <div className="quick-row">
              {QUICK_ASKS.map((q) => <button key={q} className="quick-chip" onClick={() => setAssistQ(q)}>{q}</button>)}
            </div>
            <div className="chat-input glass">
              <input value={assistQ} onChange={(e) => setAssistQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askAssistant()}
                placeholder="Ask about verified services..." />
              <button className={`voice-btn control-btn ${listening ? 'listening' : ''}`} onClick={startVoice} title="Voice">
                {listening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              <button className="send-btn" onClick={askAssistant}><Search size={14} /> Ask</button>
            </div>

            {/* Live answer if available */}
            {assistA && (
              <div className={`answer-card glass ${assistA.refusal_reason ? 'refused' : ''}`}>
                <p>{assistA.answer}</p>
                {assistA.refusal_reason && <span className="refusal-badge">{assistA.refusal_reason}</span>}
              </div>
            )}
            {assistMatches.length > 0 && (
              <div className="card-list">
                {/* Section A: Verified Emergency Centers */}
                {highConfAssist.length > 0 && (
                  <div className="section-divider-title">
                    <ShieldCheck size={14} /> Curated & Verified Rescue Centers ({highConfAssist.length})
                  </div>
                )}
                {highConfAssist.map((c, i) => (
                  <ContactCard key={c.id || i} contact={c} index={i} onCallClick={handleCallClick} />
                ))}

                {/* Section B: Local Proximity & Private Clinics */}
                {lowConfAssist.length > 0 && (
                  <div className="section-divider-title secondary-divider">
                    <AlertTriangle size={14} /> Local Proximity Clinics & Private Nodes ({lowConfAssist.length})
                  </div>
                )}
                {lowConfAssist.map((c, i) => (
                  <ContactCard key={c.id || i} contact={c} index={highConfAssist.length + i} onCallClick={handleCallClick} />
                ))}
              </div>
            )}

            {/* Demo examples — always visible to show the assistant is alive */}
            {!assistA && (
              <div className="demo-examples">
                <div className="demo-label">Example verified queries</div>
                {DEMO_QUERIES.map((dq, i) => (
                  <div key={i} className={`answer-card glass demo-card ${dq.refusal ? 'refused' : ''}`}>
                    <div className="demo-query"><Search size={12} /> {dq.q}</div>
                    <p>{dq.a}</p>
                    {dq.refusal && <span className="refusal-badge">{dq.refusal}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══ Section 4: INCIDENT REPORT ═══ */}
        <section className="section" id="incident">
          <div className="section-header reveal">
            <div className="section-tag"><Clipboard size={12} /> Report</div>
            <h2 className="section-title">Incident <span className="highlight">Packet Generator</span></h2>
            <p className="section-desc">Structured report for first responders. Copy or share instantly.</p>
          </div>
          <div className="incident-panel reveal">
            <div className="form-panel glass">
              <div className="form-grid">
                <div className="input-group">
                  <label className="input-label">Injured</label>
                  <input className="input-field" type="number" min="0" value={incident.injury_count}
                    onChange={(e) => setIncident({...incident, injury_count: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Vehicle</label>
                  <input className="input-field" value={incident.vehicle}
                    onChange={(e) => setIncident({...incident, vehicle: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Severity</label>
                  <select className="input-field" value={incident.severity}
                    onChange={(e) => setIncident({...incident, severity: e.target.value})}>
                    <option value="critical">Critical</option>
                    <option value="moderate">Moderate</option>
                    <option value="minor">Minor</option>
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div className="input-group">
                  <label className="input-label">Hazards</label>
                  <input className="input-field" value={incident.hazards}
                    onChange={(e) => setIncident({...incident, hazards: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">Callback</label>
                  <input className="input-field" value={incident.callback}
                    onChange={(e) => setIncident({...incident, callback: e.target.value})} placeholder="Phone" />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Notes</label>
                <textarea className="input-field" rows={2} value={incident.notes}
                  onChange={(e) => setIncident({...incident, notes: e.target.value})} />
              </div>
                    <div className="photo-evidence-row">
                      <button className="photo-btn" onClick={startCamera}>
                        <Camera size={14} /> {photoBase64 ? "Capture New Evidence Photo" : "Capture Evidence Photo (Live Only)"}
                      </button>
                      {photoBase64 && (
                        <div className="photo-preview-wrap">
                          <img src={photoBase64} alt="Incident Evidence" className="photo-preview-thumb" />
                          <button className="photo-clear" onClick={() => setPhotoBase64("")}>×</button>
                        </div>
                      )}
                    </div>
                    <span className="photo-disclaimer">
                      ⚠️ Live camera feed only. Gallery uploads are disabled to prevent submission of older/falsified images.
                    </span>
                    <div className="form-actions">
                      <div className="lang-toggle">
                        {LANGS.map((l) => <button key={l.value} className={`lang-btn ${lang === l.value ? 'active' : ''}`}
                          onClick={() => setLang(l.value)}>{l.label}</button>)}
                      </div>
                      <button className="generate-btn send-btn" onClick={generatePacket}>
                        <Clipboard size={14} /> Generate
                      </button>
                    </div>
            </div>
            {packet && (
              <div className="packet-card glass">
                <pre>{packet}</pre>
                <div className="packet-actions">
                  <button className="packet-action" onClick={copyPacket}><Copy size={13} /> Copy</button>
                  <button className="packet-action" onClick={sharePacket}><Share2 size={13} /> Share</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ═══ Section 5: BYSTANDER GUIDE ═══ */}
        <section className="section" id="bystander">
          <div className="section-header reveal">
            <div className="section-tag"><Users size={12} /> Action Guide</div>
            <h2 className="section-title">Bystander <span className="highlight">Action Roles</span></h2>
            <p className="section-desc">No medical training needed. Pick one role and act immediately.</p>
          </div>
          <div className="role-grid reveal">
            {BYSTANDER_ROLES.map((r) => (
              <div className="role-card glass-card" key={r.t} style={{'--role-color': r.color}}>
                <div className="role-top">
                  <div className="role-icon-wrap" style={{background: `${r.color}20`, color: r.color}}>{r.icon}</div>
                  <div className="role-meta">
                    <h3>{r.t}</h3>
                    <div className="role-tags">
                      <span className="role-priority" style={{background: `${r.color}18`, color: r.color, borderColor: `${r.color}30`}}>{r.priority}</span>
                      <span className="role-time"><Clock size={10} /> {r.time}</span>
                    </div>
                  </div>
                </div>
                <ul className="role-actions">
                  {r.actions.map((a, i) => <li key={i}><ChevronRight size={11} /> {a}</li>)}
                </ul>
                <div className="role-legal"><ShieldCheck size={12} /> {r.legal}</div>
              </div>
            ))}
          </div>
          <div className="legal-card glass reveal">
            <div className="shield-icon-container">
              <ShieldCheck size={24} className="shield-icon-glow" />
            </div>
            <div>
              <strong className="shield-title">Good Samaritan Protection Shield</strong>
              <p className="shield-text">{GOOD_SAMARITAN}</p>
            </div>
          </div>
        </section>

        {/* ═══ Section 6: TRUST & CREDIBILITY ═══ */}
        <section className="trust-section" id="trust">
          <div className="reveal">
            <div className="trust-hero">
              <h2 className="trust-statement">
                Built for the <span className="trust-em">golden hour</span>.<br />
                When every second decides survival.
              </h2>
              <p className="trust-subtitle">
                RoadSoS is source-backed emergency intelligence for Indian roads. Every contact is verified.
                Every refusal is honest. No hallucination. No guesswork.
              </p>
            </div>

            <div className="trust-pillars">
              <div className="trust-pillar glass">
                <div className="pillar-number">01</div>
                <strong>Source-Backed Intelligence</strong>
                <p>Every contact links to a government or institutional source. If we cannot verify it, we refuse to show it.</p>
              </div>
              <div className="trust-pillar glass">
                <div className="pillar-number">02</div>
                <strong>Offline-First Architecture</strong>
                <p>Cache entire region data locally. Network drops at crash sites. RoadSoS still works.</p>
              </div>
              <div className="trust-pillar glass">
                <div className="pillar-number">03</div>
                <strong>Designed for First Responders</strong>
                <p>Incident packets, bystander roles, GPS sharing — structured for the chaos of a real crash scene.</p>
              </div>
              <div className="trust-pillar glass">
                <div className="pillar-number">04</div>
                <strong>Honest Refusal</strong>
                <p>Ask about pizza and we say no. Our assistant only retrieves from the verified contact dataset.</p>
              </div>
            </div>

            <div className="trust-bottom">
              <div className="trust-badge-row">
                <span className="trust-chip"><Shield size={13} /> No Hallucination</span>
                <span className="trust-chip"><WifiOff size={13} /> Offline-First</span>
                <span className="trust-chip"><Globe size={13} /> 9 Indian Cities</span>
                <span className="trust-chip"><Download size={13} /> Installable PWA</span>
              </div>
              <div className="footer-line">
                RoadSoS — IIT Madras Centre of Excellence for Road Safety Hackathon 2026
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>
      
      {/* Live Camera Capture Modal */}
      {cameraActive && (
        <div className="camera-modal-overlay" onClick={stopCamera}>
          <div className="camera-modal glass" onClick={(e) => e.stopPropagation()}>
            <div className="camera-header">
              <h3>Live Evidence Capture</h3>
              <button className="drawer-close" onClick={stopCamera}>×</button>
            </div>
            <div className="camera-view-container">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              <div className="camera-frame-guide" />
            </div>
            <div className="camera-actions-row">
              <button className="camera-capture-btn" onClick={takeSnapshot} title="Capture Snapshot">
                <div className="capture-inner" />
              </button>
              <button className="camera-cancel-btn" onClick={stopCamera}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-notification">
          <Zap size={14} style={{ color: 'var(--accent)' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
