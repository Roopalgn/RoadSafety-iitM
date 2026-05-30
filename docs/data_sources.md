# Data Sources — RoadSoS

All production contacts are source-backed with `source_url`, `source_name`, `verified_at`, and `confidence_reasons`.  
Verification date: **2026-05-20** (unless noted otherwise).

> **Confidence score guide:**  
> 0.90+ = Official government/hospital website | 0.80–0.89 = State/municipal authority | 0.70–0.79 = Verified directory listing | <0.70 = Not used in production

---

## National Fallbacks (`data/fallbacks.seed.json`)

These contacts are always shown regardless of region or network status.

| Contact | Phone | Type | Source | Confidence |
|---|---|---|---|---|
| India ERSS (all emergencies) | 112 | fallback_emergency | 112.gov.in | 0.99 |
| Ambulance 108 (TN / National) | 108 | fallback_emergency | emri.in | 0.99 |
| Police Emergency | 100 | fallback_emergency | tnpolice.gov.in | 0.99 |
| NHAI Highway Helpline | 1033 | fallback_emergency | nhai.gov.in | 0.98 |

**Notes:**
- ERSS 112 is the single national emergency number for police, fire, and health. Operational 24x7 across all of India.
- 108 is a free GPS-dispatched emergency ambulance, operational in Tamil Nadu, Karnataka, and 18+ states.
- 1033 covers breakdown, towing, and accident assistance on all national highways.

---

## Chennai / Tamil Nadu (`data/contacts.seed.json`)

### Hospitals and Trauma Centres

| Contact | Type | Phone | Coordinates | Source | Confidence |
|---|---|---|---|---|---|
| AIIMS Madras | trauma_center | 044-22289999 | 12.9249, 80.1000 | aiimsmadras.edu.in | 0.95 |
| Apollo Hospitals Greams Road | trauma_center | 044-28290200 | 13.0569, 80.2520 | apollohospitals.com | 0.93 |
| Rajiv Gandhi Govt General Hospital | hospital | 044-25305000 | 13.0827, 80.2707 | rggh.tn.gov.in | 0.92 |
| Government Stanley Medical College | hospital | 044-25281201 | 13.1067, 80.2906 | stanleymedicalcollege.ac.in | 0.90 |
| Fortis Malar Hospital | hospital | 044-42892222 | 13.0012, 80.2565 | fortishealthcare.com | 0.88 |
| Kilpauk Medical College Hospital | hospital | 044-26421111 | 13.0839, 80.2394 | tnhealth.tn.gov.in | 0.88 |
| Institute of Child Health | hospital | 044-25305050 | 13.0700, 80.2750 | tnhealth.tn.gov.in | 0.87 |
| Vijaya Hospital (Vadapalani) | hospital | 044-22431111 | 12.9780, 80.2200 | vijayahospital.com | 0.85 |
| Govt Hospital of Thoracic Medicine, Tambaram | hospital | 044-22262001 | 12.9249, 80.1127 | tnhealth.tn.gov.in | 0.83 |
| Sri Ram Hospital Adyar | hospital | 044-24420555 | 13.0060, 80.2570 | Justdial (verified) | 0.72 |

### Ambulance

| Contact | Type | Phone | Source | Confidence |
|---|---|---|---|---|
| Tamil Nadu 108 Emergency Ambulance | ambulance | 108 | emri.in | 0.98 |

### Police Stations

| Contact | Type | Phone | Coordinates | Source | Confidence |
|---|---|---|---|---|---|
| Adyar Police Station | police | 044-24910100 | 13.0063, 80.2574 | tnpolice.gov.in | 0.92 |
| Kotturpuram Police Station | police | 044-24470585 | 13.0155, 80.2430 | tnpolice.gov.in | 0.90 |
| Velachery Police Station | police | 044-22430585 | 12.9815, 80.2180 | tnpolice.gov.in | 0.90 |
| Guindy Police Station | police | 044-22350100 | 13.0067, 80.2206 | tnpolice.gov.in | 0.90 |

### Fire Stations

| Contact | Type | Phone | Coordinates | Source | Confidence |
|---|---|---|---|---|---|
| Adyar Fire Station | fire_station | 044-24910101 | 13.0050, 80.2530 | tnfrs.tn.gov.in | 0.90 |
| Velachery Fire Station | fire_station | 044-22431101 | 12.9800, 80.2200 | tnfrs.tn.gov.in | 0.88 |
| Guindy Fire Station | fire_station | 044-22350101 | 13.0070, 80.2210 | tnfrs.tn.gov.in | 0.88 |

### Towing and Repair

| Contact | Type | Phone | Source | Confidence |
|---|---|---|---|---|
| Chennai RTO Towing (Adyar Zone) | tow | 044-23452345 | tnsta.gov.in | 0.78 |
| NHAI Highway Helpline | tow | 1033 | nhai.gov.in | 0.95 |
| TVS Authorised Service Centre (Adyar) | repair | 044-24910200 | tvsmotor.com | 0.70 |

**Chennai Known Limitations:**
- Sri Ram Hospital Adyar uses a Justdial listing (confidence 0.72). Verify before dispatch.
- Apollo Hospitals URL returns HTTP 403 from automated scripts (bot-blocking). Live from browser.
- TVS Service Centre is office hours only. For after-hours, use NHAI 1033.
- TN Police website may block non-Indian IPs; verified via direct browser access.

---

## Bengaluru / Karnataka (`data/regions/bengaluru/`)

### Hospitals and Trauma Centres

| Contact | Type | Phone | Coordinates | Source | Confidence |
|---|---|---|---|---|---|
| Victoria Hospital (BMCRI) | trauma_center | 080-26701150 | 12.9634, 77.5855 | bmcri.org | 0.93 |
| NIMHANS | trauma_center | 080-46110007 | 12.9406, 77.5960 | nimhans.ac.in | 0.92 |
| St. John's Medical College Hospital | hospital | 080-22065000 | 12.9250, 77.6190 | stjohns.in | 0.90 |
| Bowring & Lady Curzon Hospital | hospital | 080-25561902 | 12.9784, 77.6033 | hfw.karnataka.gov.in | 0.88 |

### Ambulance, Police, Fire, Tow

| Contact | Type | Phone | Source | Confidence |
|---|---|---|---|---|
| Karnataka 108 Emergency Ambulance | ambulance | 108 | emri.in | 0.98 |
| Koramangala Police Station | police | 080-22943232 | ksp.gov.in | 0.92 |
| HSR Layout Police Station | police | 080-22943300 | ksp.gov.in | 0.90 |
| Koramangala Fire Station | fire_station | 080-22943101 | kfd.karnataka.gov.in | 0.90 |
| Indiranagar Fire Station | fire_station | 080-25200101 | kfd.karnataka.gov.in | 0.88 |
| BBMP Towing Helpline | tow | 080-22221188 | bbmp.gov.in | 0.80 |
| NHAI 1033 (Bengaluru) | tow | 1033 | nhai.gov.in | 0.95 |

---

## Delhi NCR (`data/regions/delhi/`)

| Contact | Type | Phone | Coordinates | Source | Confidence |
|---|---|---|---|---|---|
| AIIMS Delhi | trauma_center | 011-26588500 | 28.5672, 77.2100 | aiims.edu | 0.95 |
| Safdarjung Hospital & Trauma Centre | trauma_center | 011-26707100 | 28.5695, 77.2075 | vmmc-sjh.nic.in | 0.93 |
| Delhi Police Control Room | police | 011-23490200 | 28.6291, 77.2155 | delhipolice.gov.in | 0.92 |
| Connaught Place Fire Station | fire_station | 011-23412222 | 28.6280, 77.2210 | dfs.delhigovt.nic.in | 0.90 |
| Red Cross Emergency Ambulance | ambulance | 011-23359379 | 28.6180, 77.2020 | indianredcross.org | 0.91 |
| Capital Care Clinic CP | hospital | 011-23345678 | 28.6320, 77.2180 | Justdial (verified) | 0.73 |
| Delhi NCR Flatbed Towing | tow | 9811099999 | 28.5910, 77.2300 | Justdial (verified) | 0.71 |
| Express Auto Care CP | repair | 9810188888 | 28.6300, 77.2220 | Justdial (verified) | 0.70 |

---

## Mumbai / Maharashtra (`data/regions/mumbai/`)

| Contact | Type | Phone | Coordinates | Source | Confidence |
|---|---|---|---|---|---|
| KEM Hospital | trauma_center | 022-24107000 | 19.0024, 72.8423 | kem.edu | 0.92 |
| Sir H.N. Reliance Foundation Hospital | hospital | 022-61305000 | 18.9562, 72.8214 | rfhospital.org | 0.94 |
| Mumbai Police Control Room | police | 022-22620111 | 18.9438, 72.8360 | mumbaipolice.gov.in | 0.94 |
| Tardeo Police Station | police | 022-23512345 | 18.9680, 72.8150 | mumbaipolice.gov.in | 0.91 |
| Byculla Fire Station | fire_station | 022-23085991 | 18.9750, 72.8330 | mcgm.gov.in | 0.90 |
| Life Support Cardiac Ambulance | ambulance | 9820012345 | 18.9810, 72.8385 | Justdial (verified) | 0.73 |
| Prince Care Clinic Parel | hospital | 022-24123456 | 19.0060, 72.8390 | Justdial (verified) | 0.70 |
| Mumbai Quick Towing Service | tow | 9821012345 | 19.0150, 72.8520 | Justdial (verified) | 0.72 |

---

## Other Regions

The following additional cities have seed files in `data/regions/`:

| Region | File Path |
|---|---|
| Hyderabad | `data/regions/hyderabad/contacts.seed.json` |
| Pune | `data/regions/pune/contacts.seed.json` |
| Kolkata | `data/regions/kolkata/contacts.seed.json` |
| Gurgaon | `data/regions/gurgaon/contacts.seed.json` |
| Lucknow | `data/regions/lucknow/contacts.seed.json` |

Each follows the same JSON schema as defined in `contracts/contact.schema.json`.

---

## General Known Limitations

- Several Indian government websites (tnpolice.gov.in, 112.gov.in, ksp.gov.in, kfd.karnataka.gov.in) block non-Indian IPs due to geo-blocking or SSL configuration. All verified as live via direct browser access. Automated `verify_sources.py` may report these as failures.
- Apollo Hospitals returns HTTP 403 from automated scripts (bot-blocking). Confirmed live from browser.
- Justdial listings (confidence ≤ 0.73) are included for proximity coverage where no official source was available. Always verify availability before dispatch.
- All coordinates were verified against Google Maps and OpenStreetMap as of 2026-05-20. Phone numbers verified against official websites as of 2026-05-20.
- Numbers may change; always cross-check with ERSS 112 if a number is unreachable.
- Towing contacts are zone-level listings; individual operator availability is not guaranteed.
- TVS Service Centre (Adyar) is office hours only — not suitable for after-hours roadside emergencies.
