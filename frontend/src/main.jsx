import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Clock3,
  Database,
  Download,
  Filter,
  Gauge,
  Layers,
  LifeBuoy,
  LocateFixed,
  Languages,
  MapPinned,
  MapPin,
  MessageCircle,
  Moon,
  Navigation,
  Phone,
  Radio,
  Share2,
  ShieldCheck,
  Siren,
  Wifi,
  WifiOff,
} from "lucide-react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const CACHE_KEY = "roadsos.cache-package.v1";
const SERVICE_FILTERS = [
  { value: "hospital", label: "Hospital" },
  { value: "trauma_center", label: "Trauma" },
  { value: "ambulance", label: "Ambulance" },
  { value: "police", label: "Police" },
  { value: "tow", label: "Tow" },
  { value: "repair", label: "Repair" },
];
const DEFAULT_SERVICE_TYPES = SERVICE_FILTERS.map((item) => item.value);
const INCIDENT_PRESETS = [
  {
    id: "medical",
    label: "Medical emergency",
    description: "Prioritise ambulance, trauma, and hospitals.",
    serviceTypes: ["ambulance", "trauma_center", "hospital"],
    severity: "critical",
  },
  {
    id: "police",
    label: "Police support",
    description: "Prioritise nearby police and official fallbacks.",
    serviceTypes: ["police"],
    severity: "moderate",
  },
  {
    id: "recovery",
    label: "Vehicle recovery",
    description: "Prioritise tow and repair support.",
    serviceTypes: ["tow", "repair"],
    severity: "minor",
  },
  {
    id: "all",
    label: "Full rescue sweep",
    description: "Show every verified local service type.",
    serviceTypes: DEFAULT_SERVICE_TYPES,
    severity: "unknown",
  },
];
const REGION_OPTIONS = [
  { value: "auto", label: "Auto detect", note: "Use coordinates" },
  { value: "chennai", label: "Chennai", note: "IIT Madras demo" },
  { value: "bengaluru", label: "Bengaluru", note: "Portability proof" },
];
const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "tamil", label: "Tamil" },
  { value: "hindi", label: "Hindi" },
];
const QUICK_ASKS = [
  "Nearest hospital",
  "Nearest police",
  "What do I do?",
  "Fire station",
];
const ASSISTANT_INTENTS = [
  { tokens: ["hospital", "trauma"], types: ["hospital", "trauma_center"] },
  { tokens: ["ambulance", "108"], types: ["ambulance", "fallback_emergency"] },
  { tokens: ["police", "fir", "100"], types: ["police", "fallback_emergency"] },
  { tokens: ["tow", "breakdown", "puncture", "repair"], types: ["tow", "repair"] },
  { tokens: ["fire"], types: ["fire_station", "fallback_emergency"] },
];
const TEMPLATE_RESPONSES = {
  offline:
    "Offline guidance: use cached verified contacts if present, otherwise call ERSS 112. Keep the location, landmark, hazards, and callback number ready.",
  first_aid:
    "Safety template: keep the injured person still unless there is immediate danger, warn traffic from a safe place, and call official emergency help. This is not medical advice.",
};
const TRANSLATION_TERMS = {
  tamil: [
    ["Road accident", "சாலை விபத்து"],
    ["accident", "விபத்து"],
    ["injured person(s)", "காயமடைந்தவர்(கள்)"],
    ["injured person", "காயமடைந்தவர்"],
    ["Severity", "தீவிரம்"],
    ["Vehicle", "வாகனம்"],
    ["Road side", "சாலை பக்கம்"],
    ["Hazards", "ஆபத்துகள்"],
    ["Callback", "திரும்ப அழைக்க"],
    ["Notes", "குறிப்புகள்"],
    ["Coordinates", "இட நிர்ணயம்"],
    ["Nearest contacts", "அருகிலுள்ள தொடர்புகள்"],
    ["Timestamp", "நேரம்"],
    ["hospital", "மருத்துவமனை"],
    ["ambulance", "ஆம்புலன்ஸ்"],
    ["police", "காவல்"],
    ["fire", "தீயணைப்பு"],
    ["help", "உதவி"],
  ],
  hindi: [
    ["Road accident", "सड़क दुर्घटना"],
    ["accident", "दुर्घटना"],
    ["injured person(s)", "घायल व्यक्ति"],
    ["injured person", "घायल व्यक्ति"],
    ["Severity", "गंभीरता"],
    ["Vehicle", "वाहन"],
    ["Road side", "सड़क की ओर"],
    ["Hazards", "खतरे"],
    ["Callback", "वापस कॉल"],
    ["Notes", "नोट्स"],
    ["Coordinates", "स्थान निर्देशांक"],
    ["Nearest contacts", "नजदीकी संपर्क"],
    ["Timestamp", "समय"],
    ["hospital", "अस्पताल"],
    ["ambulance", "एम्बुलेंस"],
    ["police", "पुलिस"],
    ["fire", "आग"],
    ["help", "मदद"],
  ],
};
const DEFAULT_LOCATION = {
  lat: "12.9915",
  lon: "80.2337",
  landmark: "IIT Madras main gate",
};
const FALLBACK_CONTACT = {
  id: "india-erss-112",
  name: "Emergency Response Support System",
  type: "fallback_emergency",
  lat: null,
  lon: null,
  phone: "112",
  address: null,
  locality: "National",
  region: "India",
  country: "India",
  source_url: "https://112.gov.in/",
  source_name: "Emergency Response Support System, Government of India",
  verified_at: "2026-05-16",
  availability: "24x7",
  confidence_score: 1,
  confidence_reasons: [
    "Official national emergency response system",
    "Government of India ERSS source",
  ],
  notes: "Use for emergency assistance from police, fire, health, and other services.",
};

function readCachedPackage() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeCachedPackage(payload) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...payload, cached_at: new Date().toISOString() })
    );
  } catch {
    // Storage can be blocked in private contexts; the UI still has ERSS fallback.
  }
}

function formatType(type) {
  return String(type || "service").replaceAll("_", " ");
}

function confidenceLabel(contact) {
  const raw = contact.effective_confidence ?? contact.confidence_score;
  return typeof raw === "number" ? raw.toFixed(2) : "n/a";
}

function cacheAgeLabel(cacheInfo) {
  if (!cacheInfo?.cached_at) return "not cached yet";
  const ageMs = Date.now() - Date.parse(cacheInfo.cached_at);
  if (!Number.isFinite(ageMs) || ageMs < 0) return "cached previously";
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "cached just now";
  if (minutes < 60) return `cached ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `cached ${hours} hr ago`;
}

function detectRegion(lat, lon, selectedRegion = "auto") {
  if (selectedRegion !== "auto") {
    return REGION_OPTIONS.find((region) => region.value === selectedRegion);
  }
  if (lat >= 12.8 && lat <= 13.2 && lon >= 80 && lon <= 80.35) {
    return REGION_OPTIONS.find((region) => region.value === "chennai");
  }
  if (lat >= 12.85 && lat <= 13.1 && lon >= 77.45 && lon <= 77.75) {
    return REGION_OPTIONS.find((region) => region.value === "bengaluru");
  }
  return { value: "national", label: "National fallback", note: "Outside demo regions" };
}

function translatePacket(packet, language) {
  if (language === "english") return packet;
  const translated = (TRANSLATION_TERMS[language] || []).reduce(
    (text, [english, replacement]) => text.replaceAll(english, replacement),
    packet
  );
  return `${translated} Translation note: template-based emergency keyword translation, not full NLP.`;
}

function uniqueContacts(contacts) {
  const seen = new Set();
  return contacts.filter((contact) => {
    const key = contact.id || `${contact.name}-${contact.phone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasAssistantToken(text, token) {
  if (/^\d+$/.test(token)) return text.includes(token);
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`);
  return pattern.test(text);
}

function resolveAssistantMatches(question, contacts, fallbacks, cacheInfo) {
  const normalized = question.toLowerCase();
  const cacheContacts = cacheInfo?.contacts || [];
  const pool = uniqueContacts([...contacts, ...cacheContacts, ...fallbacks]);
  const intent = ASSISTANT_INTENTS.find((item) =>
    item.tokens.some((token) => hasAssistantToken(normalized, token))
  );
  if (!intent) return { matches: [], intent: null };
  return {
    intent,
    matches: pool
      .filter((contact) => intent.types.includes(contact.type))
      .slice(0, 4),
  };
}

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-label="Loading contact">
      <span />
      <strong />
      <span />
    </div>
  );
}

function ContactCard({ contact, fallback = false, compact = false }) {
  const reasons = [
    ...(contact.ranking_reasons || []),
    ...(contact.confidence_eval_reasons || []),
    ...(contact.confidence_reasons || []),
  ].slice(0, 4);

  return (
    <article
      className={`contact-card ${fallback ? "fallback-card" : ""} ${
        compact ? "compact-card" : ""
      }`}
    >
      <div className="contact-topline">
        <span className="contact-type">{formatType(contact.type)}</span>
        <span className="confidence-chip">
          confidence {confidenceLabel(contact)}
        </span>
      </div>
      <div className="contact-main">
        <div>
          <h2>{contact.name}</h2>
          <p className="contact-meta">
            {contact.distance_km != null
              ? `${contact.distance_km} km away`
              : contact.locality || "Fallback"}{" "}
            | verified {contact.verified_at} | {contact.availability}
          </p>
          <p className="source-line">
            Source:{" "}
            <a href={contact.source_url} target="_blank" rel="noreferrer">
              {contact.source_name}
            </a>
          </p>
        </div>
        <a
          className="call-button"
          href={`tel:${contact.phone}`}
          onClick={() => navigator.vibrate?.(35)}
        >
          <Phone size={18} aria-hidden="true" />
          Call {contact.phone}
        </a>
      </div>
      {reasons.length > 0 && (
        <details className="trust-ledger">
          <summary>Trust ledger and ranking reasons</summary>
          <ul>
            {reasons.map((reason, index) => (
              <li key={`${contact.id}-reason-${index}`}>{reason}</li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function DemoStep({ done, label }) {
  return (
    <span className={done ? "demo-step done" : "demo-step"}>
      <CheckCircle2 size={15} aria-hidden="true" />
      {label}
    </span>
  );
}

function MiniMap({ contacts }) {
  const topContacts = contacts.slice(0, 4);
  return (
    <div className="mini-map" aria-label="Approximate nearest contact radar">
      <div className="map-ring ring-one" />
      <div className="map-ring ring-two" />
      <div className="map-origin">You</div>
      {topContacts.map((contact, index) => (
        <span
          className={`map-pin pin-${index}`}
          key={contact.id}
          title={contact.name}
        >
          {index + 1}
        </span>
      ))}
    </div>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [locationSource, setLocationSource] = useState("manual");
  const [contacts, setContacts] = useState([]);
  const [fallbacks, setFallbacks] = useState([FALLBACK_CONTACT]);
  const [selectedServiceTypes, setSelectedServiceTypes] =
    useState(DEFAULT_SERVICE_TYPES);
  const [warnings, setWarnings] = useState([]);
  const [status, setStatus] = useState("Ready for the 10-second rescue drill.");
  const [cacheInfo, setCacheInfo] = useState(readCachedPackage());
  const [loading, setLoading] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [incident, setIncident] = useState({
    injury_count: "1",
    hazards: "traffic, fuel smell",
    notes: "Two-wheeler collision. Rider conscious.",
    callback: "",
    vehicle_type: "Two-wheeler",
    road_side: "Near main gate / left shoulder",
    severity: "moderate",
  });
  const [packet, setPacket] = useState("");
  const [assistantQuestion, setAssistantQuestion] = useState(
    "Can an ambulance come now?"
  );
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [assistantTrace, setAssistantTrace] = useState({
    used_sources: [],
    refusal_reason: null,
  });
  const [assistantMatches, setAssistantMatches] = useState([]);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState(
    "service worker checking"
  );
  const [chaosMode, setChaosMode] = useState({
    backendDown: false,
    noLocalResults: false,
    gpsDenied: false,
  });
  const [selectedPreset, setSelectedPreset] = useState("all");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("auto");
  const [incidentLanguage, setIncidentLanguage] = useState("english");
  const [nightMode, setNightMode] = useState(false);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setServiceWorkerStatus("service worker unavailable");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => setServiceWorkerStatus("offline shell ready"))
      .catch(() => setServiceWorkerStatus("offline shell blocked"));
  }, []);

  const parsedLocation = useMemo(
    () => ({
      lat: Number(location.lat),
      lon: Number(location.lon),
    }),
    [location.lat, location.lon]
  );

  const locationConfidence = useMemo(() => {
    if (locationSource === "gps") return "GPS high confidence";
    if (locationSource === "cached") return "Cached location";
    return "Manual location";
  }, [locationSource]);
  const activeRegion = useMemo(
    () => detectRegion(parsedLocation.lat, parsedLocation.lon, selectedRegion),
    [parsedLocation.lat, parsedLocation.lon, selectedRegion]
  );

  function toggleServiceType(type) {
    setSelectedServiceTypes((current) => {
      if (current.includes(type)) {
        const next = current.filter((item) => item !== type);
        return next.length ? next : current;
      }
      return [...current, type];
    });
  }

  function applyPreset(preset) {
    navigator.vibrate?.(20);
    setSelectedPreset(preset.id);
    setSelectedServiceTypes(preset.serviceTypes);
    setIncident((current) => ({ ...current, severity: preset.severity }));
    setStatus(`${preset.label} preset loaded.`);
  }

  async function installApp() {
    if (!installPrompt) {
      setStatus("Install prompt is not available yet. Use browser install menu if shown.");
      return;
    }
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function refreshCachePackage() {
    if (!isOnline) {
      setStatus("Offline: using stored rescue pack or ERSS fallback.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/cache-package?region=${encodeURIComponent(activeRegion.value)}`
      );
      if (!response.ok) {
        throw new Error(`cache package failed: ${response.status}`);
      }
      const payload = await response.json();
      storeCachedPackage({ ...payload, selected_region: activeRegion.value });
      setCacheInfo(readCachedPackage());
      setStatus(`Offline rescue pack refreshed: ${payload.version} (${activeRegion.label}).`);
    } catch (error) {
      setStatus(`Cache refresh unavailable: ${error.message}`);
    }
  }

  function useGpsLocation() {
    if (chaosMode.gpsDenied) {
      setLocationSource("manual");
      setStatus("Chaos mode simulated GPS denial. Manual location remains active.");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("GPS is unavailable. Manual location stays active.");
      setLocationSource("manual");
      return;
    }

    setStatus("Requesting GPS location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude.toFixed(6),
          lon: position.coords.longitude.toFixed(6),
          landmark: location.landmark || "GPS location",
        });
        setLocationSource("gps");
        setStatus("GPS location captured. Start the rescue drill when ready.");
      },
      () => {
        setLocationSource("manual");
        setStatus("GPS denied or unavailable. Manual IIT Madras location is ready.");
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }

  function loadOfflineResults(reason, startedAtMs = performance.now()) {
    const cached = readCachedPackage();
    const cachedContacts = cached?.contacts || [];
    const cachedFallbacks = cached?.fallback_contacts || [FALLBACK_CONTACT];
    setContacts(cachedContacts);
    setFallbacks(cachedFallbacks.length ? cachedFallbacks : [FALLBACK_CONTACT]);
    setWarnings([
      reason,
      cached
        ? `Using cached rescue pack from ${cached.cached_at || "previous session"}.`
        : "No cached local contacts yet. Showing official ERSS fallback only.",
    ]);
    setCacheInfo(cached);
    setElapsed(((performance.now() - startedAtMs) / 1000).toFixed(1));
  }

  async function findNearbyServices() {
    if (!Number.isFinite(parsedLocation.lat) || !Number.isFinite(parsedLocation.lon)) {
      setStatus("Enter valid latitude and longitude before starting.");
      return;
    }

    const start = performance.now();
    setStartedAt(start);
    setElapsed(null);
    setLoading(true);
    setStatus("Finding ranked emergency help...");

    if (!navigator.onLine) {
      loadOfflineResults("Browser is offline.", start);
      setLoading(false);
      setStatus("Offline rescue pack loaded.");
      return;
    }

    try {
      if (chaosMode.backendDown) {
        throw new Error("chaos mode simulated backend outage");
      }
      const response = await fetch(`${API_BASE}/api/nearby-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: parsedLocation.lat,
          lon: parsedLocation.lon,
          radius_km: 8,
          service_types: selectedServiceTypes,
          location_source: locationSource,
          region: activeRegion.value,
        }),
      });
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      const payload = await response.json();
      const nextServices = chaosMode.noLocalResults ? [] : payload.services || [];
      setContacts(nextServices);
      setFallbacks(payload.fallback_contacts?.length ? payload.fallback_contacts : [FALLBACK_CONTACT]);
      setWarnings([
        ...(payload.warnings || []),
        ...(activeRegion.value !== "chennai"
          ? [
              `${activeRegion.label} selected. Region-specific contacts require the backend region data PR; national fallbacks stay visible if no local contacts match.`,
            ]
          : []),
        ...(chaosMode.noLocalResults
          ? ["Chaos mode: local ranked contacts hidden to rehearse no-result fallback."]
          : []),
      ]);
      setElapsed(((performance.now() - start) / 1000).toFixed(1));
      setStatus(
        nextServices.length
          ? "Ranked help loaded. Show the trust ledger before calling."
          : "No local contacts found. Use official fallback guidance."
      );
    } catch (error) {
      loadOfflineResults(`Backend unavailable: ${error.message}`, start);
      setStatus("Backend unavailable, so RoadSoS fell back safely.");
    } finally {
      setLoading(false);
    }
  }

  async function generateIncidentPacket() {
    const hazards = incident.hazards
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const localPacketEnglish = [
      `Road accident near ${location.landmark || "reported location"}.`,
      `${incident.injury_count || "Unknown"} injured person(s).`,
      `Severity: ${incident.severity || "unknown"}.`,
      `Vehicle: ${incident.vehicle_type || "not specified"}.`,
      `Road side: ${incident.road_side || "not specified"}.`,
      `Hazards: ${hazards.length ? hazards.join(", ") : "not specified"}.`,
      `Callback: ${incident.callback || "not provided"}.`,
      `Notes: ${incident.notes || "none"}.`,
      `Coordinates: ${parsedLocation.lat}, ${parsedLocation.lon}.`,
      `Nearest contacts: ${
        contacts.length
          ? contacts
              .slice(0, 3)
              .map((contact) => `${contact.name} (${contact.phone})`)
              .join("; ")
          : "official fallbacks listed in app"
      }.`,
      `Timestamp: ${new Date().toLocaleString()}.`,
      "Disclaimer: not medical advice or dispatch confirmation.",
    ].join(" ");
    const localPacket = translatePacket(localPacketEnglish, incidentLanguage);

    if (!navigator.onLine) {
      setPacket(localPacket);
      setStatus("Incident packet generated offline.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/incident-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: parsedLocation.lat,
          lon: parsedLocation.lon,
          nearest_landmark: location.landmark,
          injury_count: Number(incident.injury_count) || null,
          hazards,
          notes: incident.notes,
        }),
      });
      if (!response.ok) {
        throw new Error(`summary API returned ${response.status}`);
      }
      const payload = await response.json();
      const backendPacketEnglish = [
        payload.summary,
        `Severity: ${incident.severity || "unknown"}.`,
        `Vehicle: ${incident.vehicle_type || "not specified"}.`,
        `Road side: ${incident.road_side || "not specified"}.`,
        `Callback: ${incident.callback || "not provided"}.`,
        `Nearest contacts: ${
          contacts.length
            ? contacts
                .slice(0, 3)
                .map((contact) => `${contact.name} (${contact.phone})`)
                .join("; ")
            : "official fallbacks listed in app"
        }.`,
        payload.medical_disclaimer,
      ].join(" ");
      setPacket(translatePacket(backendPacketEnglish, incidentLanguage));
      setStatus("Incident packet generated from backend fields.");
    } catch {
      setPacket(localPacket);
      setStatus("Incident packet generated locally after backend fallback.");
    }
  }

  async function copyPacket() {
    if (!packet) return;
    await navigator.clipboard?.writeText(packet);
    setStatus("Incident packet copied.");
  }

  async function sharePacket() {
    if (!packet) return;
    if (navigator.share) {
      await navigator.share({
        title: "RoadSoS incident packet",
        text: packet,
      });
      setStatus("Incident packet shared.");
      return;
    }
    await copyPacket();
    setStatus("Share is unavailable, so the packet was copied instead.");
  }

  function applyLocalAssistantFallback(question) {
    const normalized = question.toLowerCase();
    if (normalized.includes("offline") || normalized.includes("network")) {
      setAssistantMatches([]);
      setAssistantTrace({
        used_sources: ["approved_safety_templates", "frontend_verified_cache"],
        refusal_reason: null,
      });
      setAssistantAnswer(TEMPLATE_RESPONSES.offline);
      return true;
    }
    if (normalized.includes("first aid") || normalized.includes("what do i do")) {
      setAssistantMatches([]);
      setAssistantTrace({
        used_sources: ["approved_safety_templates"],
        refusal_reason: null,
      });
      setAssistantAnswer(TEMPLATE_RESPONSES.first_aid);
      return true;
    }
    const { matches, intent } = resolveAssistantMatches(
      question,
      contacts,
      fallbacks,
      cacheInfo
    );
    if (!intent || !matches.length) return false;
    setAssistantMatches(matches);
    setAssistantTrace({
      used_sources: ["verified_contacts_db", "frontend_visible_or_cached_contacts"],
      refusal_reason: null,
    });
    setAssistantAnswer(
      `Verified retrieval preview: showing ${matches.length} contact(s) from currently loaded or cached RoadSoS data. Live availability is not confirmed.`
    );
    return true;
  }

  async function askAssistant(questionOverride = assistantQuestion) {
    const question =
      typeof questionOverride === "string"
        ? questionOverride.trim()
        : assistantQuestion.trim();
    setAssistantQuestion(question);
    setAssistantMatches([]);
    if (!navigator.onLine) {
      if (!applyLocalAssistantFallback(question)) {
        setAssistantTrace({
          used_sources: ["offline_guardrail_template", "fallback_contacts"],
          refusal_reason: "offline_live_availability_unverifiable",
        });
        setAssistantAnswer(
          "Offline guardrail: I cannot verify live availability or invent contacts. Use listed cached contacts or official ERSS 112."
        );
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          lat: parsedLocation.lat,
          lon: parsedLocation.lon,
        }),
      });
      const payload = await response.json();
      const backendMatches = payload.matched_contacts || [];
      if (
        !backendMatches.length &&
        payload.refusal_reason === "assistant_layer_not_implemented" &&
        applyLocalAssistantFallback(question)
      ) {
        return;
      }
      setAssistantMatches(backendMatches);
      setAssistantTrace({
        used_sources: payload.used_sources || [],
        refusal_reason: payload.refusal_reason || null,
      });
      setAssistantAnswer(
        `${payload.answer} ${
          payload.refusal_reason ? `Refusal reason: ${payload.refusal_reason}.` : ""
        }`
      );
    } catch {
      setAssistantTrace({
        used_sources: ["frontend_guardrail_fallback"],
        refusal_reason: "assistant_unavailable",
      });
      setAssistantAnswer(
        "Assistant unavailable. RoadSoS will not guess emergency contacts; use verified cards or ERSS 112."
      );
    }
  }

  const rescuePackLabel = cacheInfo
    ? `cache ${cacheInfo.version || "stored"}`
    : "ERSS fallback only";
  const readiness = {
    location: Number.isFinite(parsedLocation.lat) && Number.isFinite(parsedLocation.lon),
    cache: Boolean(cacheInfo),
    services: contacts.length > 0,
    packet: Boolean(packet),
    assistant: Boolean(assistantAnswer),
    offlineShell: serviceWorkerStatus === "offline shell ready",
    night: nightMode,
  };
  const coverageSummary = {
    local: contacts.length,
    fallback: fallbacks.length,
    cached: cacheInfo?.contacts?.length || 0,
  };

  return (
    <main className={nightMode ? "app-shell night-mode" : "app-shell"}>
      <div className="atmosphere atmosphere-one" aria-hidden="true" />
      <div className="atmosphere atmosphere-two" aria-hidden="true" />
      <section className="emergency-panel" aria-labelledby="app-title">
        <div className="status-row">
          <span className="status-pill urgent">
            <ShieldCheck size={16} aria-hidden="true" />
            No hallucinated contacts
          </span>
          <span className="status-pill">
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isOnline ? "Online API mode" : "Offline rescue mode"}
          </span>
          <span className="status-pill">
            <Database size={16} aria-hidden="true" />
            {rescuePackLabel}
          </span>
          <span className="status-pill">
            <WifiOff size={16} aria-hidden="true" />
            {serviceWorkerStatus}
          </span>
          <span className="status-pill">
            <MapPinned size={16} aria-hidden="true" />
            {activeRegion.label}
          </span>
          <button
            className="status-button"
            type="button"
            onClick={() => setNightMode((current) => !current)}
            aria-pressed={nightMode}
          >
            <Moon size={16} aria-hidden="true" />
            Night demo
          </button>
          <button className="status-button" type="button" onClick={installApp}>
            <Download size={16} aria-hidden="true" />
            Install PWA
          </button>
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">RoadSoS rescue drill</p>
            <h1 id="app-title">Trusted help in the golden hour.</h1>
            <p>
              Enter location, load ranked emergency contacts, prove source trust,
              and generate an ambulance-ready incident packet.
            </p>
            <div className="location-ribbon" aria-label="Location confidence">
              <Navigation size={16} aria-hidden="true" />
              <span>{locationConfidence}</span>
              <strong>
                {parsedLocation.lat || "?"}, {parsedLocation.lon || "?"}
              </strong>
            </div>
          </div>
          <div className="timer-card" aria-live="polite">
            <Clock3 size={24} aria-hidden="true" />
            <strong>{elapsed ? `${elapsed}s` : "10s"}</strong>
            <span>{elapsed ? "drill result" : "target drill"}</span>
          </div>
        </div>

        <section className="mission-grid" aria-label="RoadSoS mission controls">
          <div className="mission-card preset-card">
            <div className="section-heading">
              <Siren size={18} aria-hidden="true" />
              <h2>Emergency presets</h2>
            </div>
            <div className="preset-grid">
              {INCIDENT_PRESETS.map((preset) => (
                <button
                  className={
                    selectedPreset === preset.id
                      ? "preset-button active"
                      : "preset-button"
                  }
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mission-card">
            <div className="section-heading">
              <Gauge size={18} aria-hidden="true" />
              <h2>Demo readiness</h2>
            </div>
            <div className="demo-steps">
              <DemoStep done={readiness.location} label="Location ready" />
              <DemoStep done={readiness.offlineShell} label="Offline shell" />
              <DemoStep done={readiness.cache} label="Cache refreshed" />
              <DemoStep done={readiness.services} label="Ranked contacts" />
              <DemoStep done={readiness.packet} label="Packet generated" />
              <DemoStep done={readiness.assistant} label="Assistant refusal" />
              <DemoStep done={readiness.night} label="Night mode" />
            </div>
          </div>
          <div className="mission-card">
            <div className="section-heading">
              <Layers size={18} aria-hidden="true" />
              <h2>Coverage snapshot</h2>
            </div>
            <div className="metric-grid">
              <span><strong>{coverageSummary.local}</strong> ranked</span>
              <span><strong>{coverageSummary.fallback}</strong> fallbacks</span>
              <span><strong>{coverageSummary.cached}</strong> cached</span>
            </div>
          </div>
        </section>

        <section className="control-deck" aria-label="Emergency actions">
          <div className="location-card">
            <div className="section-heading">
              <MapPin size={18} aria-hidden="true" />
              <h2>Location confidence</h2>
            </div>
            <div className="location-grid">
              <label>
                Latitude
                <input
                  value={location.lat}
                  onChange={(event) =>
                    setLocation({ ...location, lat: event.target.value })
                  }
                />
              </label>
              <label>
                Longitude
                <input
                  value={location.lon}
                  onChange={(event) =>
                    setLocation({ ...location, lon: event.target.value })
                  }
                />
              </label>
              <label className="wide-input">
                Landmark
                <input
                  value={location.landmark}
                  onChange={(event) =>
                    setLocation({ ...location, landmark: event.target.value })
                  }
                />
              </label>
              <label className="wide-input">
                Region mode
                <select
                  value={selectedRegion}
                  onChange={(event) => setSelectedRegion(event.target.value)}
                >
                  {REGION_OPTIONS.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label} - {region.note}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filter-panel" aria-label="Service filters">
              <div className="filter-heading">
                <Filter size={16} aria-hidden="true" />
                Service filters
              </div>
              <div className="filter-grid">
                {SERVICE_FILTERS.map((filter) => (
                  <button
                    className={
                      selectedServiceTypes.includes(filter.value)
                        ? "filter-chip active"
                        : "filter-chip"
                    }
                    key={filter.value}
                    type="button"
                    onClick={() => toggleServiceType(filter.value)}
                    aria-pressed={selectedServiceTypes.includes(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="action-grid">
              <button className="secondary-action" type="button" onClick={useGpsLocation}>
                <LocateFixed size={20} aria-hidden="true" />
                Use GPS
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={refreshCachePackage}
              >
                <Radio size={20} aria-hidden="true" />
                Refresh cache
              </button>
              <button
                className="primary-action"
                type="button"
                disabled={loading}
                onClick={findNearbyServices}
              >
                <Activity size={20} aria-hidden="true" />
                {loading ? "Searching..." : "Start rescue drill"}
              </button>
            </div>
            <p className="status-text">{status}</p>
            <p className="cache-text">
              Offline rescue pack: {cacheInfo?.version || "ERSS fallback only"} |{" "}
              {cacheAgeLabel(cacheInfo)}
            </p>
          </div>

          <div className="bystander-card">
            <div className="section-heading">
              <LifeBuoy size={18} aria-hidden="true" />
              <h2>Bystander mode</h2>
            </div>
            <div className="role-grid">
              <span>Caller: contact 112 or nearest listed service.</span>
              <span>Traffic spotter: warn approaching vehicles safely.</span>
              <span>Note taker: keep injury, hazard, and landmark details.</span>
              <span>Location sharer: send incident packet to responders.</span>
            </div>
            <MiniMap contacts={contacts} />
          </div>
        </section>

        <section className="chaos-card" aria-label="Demo rehearsal controls">
          <div className="section-heading">
            <AlertTriangle size={18} aria-hidden="true" />
            <h2>Chaos rehearsal controls</h2>
          </div>
          <p>
            Use these before judging to prove RoadSoS fails safely without
            changing backend data.
          </p>
          <div className="filter-grid">
            <button
              className={chaosMode.backendDown ? "filter-chip active" : "filter-chip"}
              type="button"
              onClick={() =>
                setChaosMode((current) => ({
                  ...current,
                  backendDown: !current.backendDown,
                }))
              }
              aria-pressed={chaosMode.backendDown}
            >
              Simulate backend down
            </button>
            <button
              className={chaosMode.noLocalResults ? "filter-chip active" : "filter-chip"}
              type="button"
              onClick={() =>
                setChaosMode((current) => ({
                  ...current,
                  noLocalResults: !current.noLocalResults,
                }))
              }
              aria-pressed={chaosMode.noLocalResults}
            >
              Simulate no local results
            </button>
            <button
              className={chaosMode.gpsDenied ? "filter-chip active" : "filter-chip"}
              type="button"
              onClick={() =>
                setChaosMode((current) => ({
                  ...current,
                  gpsDenied: !current.gpsDenied,
                }))
              }
              aria-pressed={chaosMode.gpsDenied}
            >
              Simulate GPS denied
            </button>
          </div>
        </section>

        {warnings.length > 0 && (
          <section className="warning-box" aria-label="Warnings">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </section>
        )}

        <section className="results-grid">
          <div>
            <div className="section-heading">
              <ShieldCheck size={18} aria-hidden="true" />
              <h2>Ranked emergency contacts</h2>
            </div>
            <div className="contact-list" aria-label="Ranked emergency contacts">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : contacts.length ? (
                contacts.map((contact) => (
                  <ContactCard contact={contact} key={contact.id} />
                ))
              ) : (
                <div className="empty-state">
                  No local verified contacts loaded yet. This is safe: RoadSoS
                  refuses to invent emergency numbers.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="section-heading">
              <Phone size={18} aria-hidden="true" />
              <h2>Official fallbacks</h2>
            </div>
            <div className="contact-list">
              {fallbacks.map((contact) => (
                <ContactCard contact={contact} fallback key={contact.id} />
              ))}
            </div>
          </div>
        </section>

        <section className="tool-grid">
          <div className="incident-card">
            <div className="section-heading">
              <Clipboard size={18} aria-hidden="true" />
              <h2>Incident packet</h2>
            </div>
            <label>
              Packet language
              <select
                value={incidentLanguage}
                onChange={(event) => setIncidentLanguage(event.target.value)}
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="language-note">
              <Languages size={15} aria-hidden="true" />
              Tamil/Hindi use template-based emergency keyword translation.
            </p>
            <label>
              Injured people
              <input
                value={incident.injury_count}
                onChange={(event) =>
                  setIncident({ ...incident, injury_count: event.target.value })
                }
              />
            </label>
            <label>
              Severity
              <select
                value={incident.severity}
                onChange={(event) =>
                  setIncident({ ...incident, severity: event.target.value })
                }
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="critical">Critical</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label>
              Callback number
              <input
                value={incident.callback}
                onChange={(event) =>
                  setIncident({ ...incident, callback: event.target.value })
                }
                placeholder="Responder callback number"
              />
            </label>
            <label>
              Vehicle type
              <input
                value={incident.vehicle_type}
                onChange={(event) =>
                  setIncident({ ...incident, vehicle_type: event.target.value })
                }
              />
            </label>
            <label>
              Road side / lane
              <input
                value={incident.road_side}
                onChange={(event) =>
                  setIncident({ ...incident, road_side: event.target.value })
                }
              />
            </label>
            <label>
              Hazards
              <input
                value={incident.hazards}
                onChange={(event) =>
                  setIncident({ ...incident, hazards: event.target.value })
                }
              />
            </label>
            <label>
              Notes
              <textarea
                value={incident.notes}
                onChange={(event) =>
                  setIncident({ ...incident, notes: event.target.value })
                }
              />
            </label>
            <div className="action-grid">
              <button className="primary-action" type="button" onClick={generateIncidentPacket}>
                Generate packet
              </button>
              <button className="secondary-action" type="button" onClick={copyPacket}>
                Copy packet
              </button>
              <button className="secondary-action" type="button" onClick={sharePacket}>
                <Share2 size={18} aria-hidden="true" />
                Share packet
              </button>
            </div>
            {packet && <p className="packet-preview">{packet}</p>}
          </div>

          <div className="assistant-card">
            <div className="section-heading">
              <ShieldCheck size={18} aria-hidden="true" />
              <h2>No-hallucination assistant check</h2>
            </div>
            <div className="quick-ask-grid" aria-label="Assistant quick asks">
              {QUICK_ASKS.map((question) => (
                <button
                  className="quick-ask"
                  key={question}
                  type="button"
                  onClick={() => askAssistant(question)}
                >
                  <MessageCircle size={15} aria-hidden="true" />
                  {question}
                </button>
              ))}
            </div>
            <label>
              Ask an unsafe/live-availability question
              <input
                value={assistantQuestion}
                onChange={(event) => setAssistantQuestion(event.target.value)}
              />
            </label>
            <button className="secondary-action" type="button" onClick={() => askAssistant()}>
              Ask guarded assistant
            </button>
            <p className="assistant-answer">
              {assistantAnswer ||
                "The assistant must cite verified data/templates or refuse. It never creates contacts."}
            </p>
            {assistantMatches.length > 0 && (
              <div className="assistant-match-list" aria-label="Assistant retrieved contacts">
                {assistantMatches.map((contact) => (
                  <ContactCard contact={contact} compact key={`assistant-${contact.id}`} />
                ))}
              </div>
            )}
            <div className="flight-recorder" aria-label="Assistant flight recorder">
              <strong>Flight recorder</strong>
              <span>
                Sources:{" "}
                {assistantTrace.used_sources.length
                  ? assistantTrace.used_sources.join(", ")
                  : "not asked yet"}
              </span>
              <span>
                Refusal: {assistantTrace.refusal_reason || "none"}
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
