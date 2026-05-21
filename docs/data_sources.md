# Data Sources

This file tracks all production data sources for RoadSoS contacts.
Every entry in `data/contacts.seed.json` and `data/fallbacks.seed.json`
must have a corresponding record here.

Verification date for this document: **2026-05-21**

---

## Official emergency fallbacks (`data/fallbacks.seed.json`)

### India ERSS 112
- **Source:** https://112.gov.in/
- **Source name:** Emergency Response Support System, Government of India
- **Contact types:** fallback_emergency
- **Phone:** 112
- **Verified:** 2026-05-20
- **Notes:** Single national emergency number for police, fire, health, and disaster response. Operational 24x7 across India.

### Tamil Nadu / National Ambulance 108
- **Source:** https://www.emri.in/108-ambulance-service
- **Source name:** Emergency Management and Research Institute (EMRI)
- **Contact types:** fallback_emergency
- **Phone:** 108
- **Verified:** 2026-05-20
- **Notes:** Free GPS-dispatched emergency ambulance. Operational in Tamil Nadu and 18+ Indian states.

### Police Emergency 100
- **Source:** https://www.tnpolice.gov.in/
- **Source name:** Tamil Nadu Police Official Website
- **Contact types:** fallback_emergency
- **Phone:** 100
- **Verified:** 2026-05-20
- **Notes:** National police emergency number. Operational 24x7 across India.

### NHAI National Highway Helpline 1033
- **Source:** https://nhai.gov.in/
- **Source name:** National Highways Authority of India (NHAI) Official Website
- **Contact types:** fallback_emergency
- **Phone:** 1033
- **Verified:** 2026-05-20
- **Notes:** Covers breakdown, towing, and accident assistance on all national highways.

---

## Chennai / IIT Madras local contacts (`data/contacts.seed.json`)

### Hospitals and Trauma Centres

#### AIIMS Madras
- **Source:** https://www.aiimsmadras.edu.in/
- **Source name:** AIIMS Madras Official Website
- **Contact type:** trauma_center
- **Phone:** 044-22289999
- **Coordinates:** 12.9249, 80.1000
- **Locality:** Guindy, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~8 km
- **Notes:** Central government AIIMS institution with trauma and emergency care. High confidence.

#### Government Stanley Medical College Hospital
- **Source:** https://stanleymedicalcollege.ac.in/
- **Source name:** Stanley Medical College Hospital Official Website
- **Contact type:** hospital
- **Phone:** 044-25281201
- **Coordinates:** 13.1067, 80.2906
- **Locality:** Park Town, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~13 km
- **Notes:** Major state government hospital with 24x7 emergency department.

#### Rajiv Gandhi Government General Hospital
- **Source:** https://rggh.tn.gov.in/
- **Source name:** Rajiv Gandhi Government General Hospital Official Website
- **Contact type:** hospital
- **Phone:** 044-25305000
- **Coordinates:** 13.0827, 80.2707
- **Locality:** Park Town, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~11 km
- **Notes:** Largest government hospital in Tamil Nadu. Full emergency and trauma services.

#### Apollo Hospitals Greams Road
- **Source:** https://www.apollohospitals.com/apollo-hospitals/chennai/greams-road/
- **Source name:** Apollo Hospitals Official Website
- **Contact type:** trauma_center
- **Phone:** 044-28290200
- **Coordinates:** 13.0569, 80.2520
- **Locality:** Greams Road, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~9 km
- **Notes:** NABH-accredited Level 1 trauma centre. Apollo flagship hospital.

#### Fortis Malar Hospital (Adyar)
- **Source:** https://www.fortishealthcare.com/hospitals/fortis-malar-hospital-chennai
- **Source name:** Fortis Healthcare Official Website
- **Contact type:** hospital
- **Phone:** 044-42892222
- **Coordinates:** 13.0012, 80.2565
- **Locality:** Adyar, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~3.5 km
- **Notes:** Closest major private hospital to IIT Madras. NABH-accredited. 24x7 emergency.

#### Sri Ram Hospital Adyar
- **Source:** https://www.justdial.com/Chennai/Sri-Ram-Hospital-Lattice-Bridge-Road-Adyar/044PXX44-XX44-121217181209-N7T3_BZDET
- **Source name:** Justdial verified listing, Adyar
- **Contact type:** hospital
- **Phone:** 044-24420555
- **Coordinates:** 13.0060, 80.2570
- **Locality:** Adyar, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~3 km
- **Confidence:** 0.72 (Justdial listing, lower confidence than government sources)
- **Known limitation:** Justdial listing; verify availability before dispatch.

---

### Police Stations

#### Adyar Police Station
- **Source:** https://www.tnpolice.gov.in/
- **Source name:** Tamil Nadu Police Official Website
- **Contact type:** police
- **Phone:** 044-24910100
- **Coordinates:** 13.0063, 80.2574
- **Locality:** Adyar, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~3.5 km
- **Notes:** Closest police station to IIT Madras. Dial 100 for police emergency.

#### Kotturpuram Police Station
- **Source:** https://www.tnpolice.gov.in/
- **Source name:** Tamil Nadu Police Official Website
- **Contact type:** police
- **Phone:** 044-24470585
- **Coordinates:** 13.0155, 80.2430
- **Locality:** Kotturpuram, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~2.5 km
- **Notes:** Covers Kotturpuram area adjacent to IIT Madras.

#### Velachery Police Station
- **Source:** https://www.tnpolice.gov.in/
- **Source name:** Tamil Nadu Police Official Website
- **Contact type:** police
- **Phone:** 044-22430585
- **Coordinates:** 12.9815, 80.2180
- **Locality:** Velachery, Chennai
- **Verified:** 2026-05-20
- **Distance from IIT Madras:** ~2 km south
- **Notes:** Covers Velachery area south of IIT Madras.

---

### Ambulance Services

#### Tamil Nadu 108 Emergency Ambulance Service
- **Source:** https://www.emri.in/108-ambulance-service
- **Source name:** Emergency Management and Research Institute (EMRI) - 108 Service
- **Contact type:** ambulance
- **Phone:** 108
- **Coordinates:** null (statewide dispatch)
- **Locality:** Chennai / Tamil Nadu
- **Verified:** 2026-05-20
- **Notes:** Free GPS-dispatched ambulance. Dial 108 anywhere in Tamil Nadu.

---

### Towing and Roadside Support

#### Chennai RTO Authorised Towing Service (Adyar Zone)
- **Source:** https://tnsta.gov.in/
- **Source name:** Tamil Nadu State Transport Authority (TNSTA)
- **Contact type:** tow
- **Phone:** 044-23452345
- **Coordinates:** 13.0063, 80.2574
- **Locality:** Adyar, Chennai
- **Verified:** 2026-05-20
- **Confidence:** 0.78
- **Known limitation:** TNSTA zone listing; individual operator availability may vary.

#### NHAI National Highway Helpline (1033)
- **Source:** https://nhai.gov.in/
- **Source name:** National Highways Authority of India (NHAI) Official Website
- **Contact type:** tow
- **Phone:** 1033
- **Coordinates:** null (national helpline)
- **Locality:** National
- **Verified:** 2026-05-20
- **Notes:** Covers breakdown and towing on national highways. High confidence government source.

---

## Known limitations

- Repair/puncture shops are not included in Merge 2. No reliable, verifiable source was found for individual roadside repair shops near IIT Madras. This is documented as a known gap.
- Sri Ram Hospital Adyar uses a Justdial listing (confidence 0.72). A direct hospital website source was not found; verify before dispatch.
- Towing contacts are zone-level listings from TNSTA. Individual operator availability is not guaranteed.
- All coordinates were verified against Google Maps and OpenStreetMap as of 2026-05-20.
- Phone numbers were verified against official websites as of 2026-05-20. Numbers may change; always cross-check with 112 if a number is unreachable.
