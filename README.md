# 🛡️ Safe Route AI

> **AI-powered night navigation — prioritizes safety over shortest distance**

A hackathon-ready, full-stack web application that analyzes **crime data, street lighting, traffic density, and active POIs** to recommend the safest route — not just the fastest one.

---

## 🚀 Quick Start

### 1. Start Backend

```bash
cd backend
npm install
node server.js
# Runs on http://localhost:3001
```

### 2. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 3. Open in browser

Navigate to **http://localhost:5173**

---

## 🧩 Features

| Feature | Description |
|---------|-------------|
| 🗺️ Interactive Map | Dark CartoDB tile map with Leaflet.js |
| 🤖 AI Safety Scoring | Scores routes 0–100 using crime, lighting, traffic, POI data |
| 🔥 Danger Heatmap | Red/green overlay showing risky zones |
| 📊 Route Comparison | Side-by-side: Safest vs Shortest with stats |
| 🚨 SOS Emergency | One-tap to find police, hospitals, pharmacies |
| 📍 Geolocation | Auto-detect current location |
| 💡 Animated UI | Score counter, route draw, toast notifications |

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Maps | Leaflet.js + react-leaflet |
| Heatmap | leaflet.heat (CDN) |
| Geocoding | OpenStreetMap Nominatim |
| Routing | OSRM Public API (fallback built-in) |
| Emergency Services | Overpass API (fallback built-in) |
| Backend | Node.js + Express |
| AI Scoring | Deterministic mock model (seeded by coordinates) |

---

## 🤖 AI Safety Score Formula

```
safetyScore = (
  traffic_density  × 0.25 +   // Higher traffic = safer at night
  (1 − crime_index) × 0.35 +  // Lower crime = safer
  lighting_level   × 0.25 +   // Better lighting = safer
  poi_density      × 0.15     // More active places = safer
) × 100
```

All factors are **deterministically seeded** by lat/lon coordinates — same location always gets the same score. Time-of-day adjustments apply (night hours penalize scores by 25%).

---

## 📁 Project Structure

```
safe-route-ai/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root component + state
│   │   ├── index.css                  # Full design system
│   │   ├── components/
│   │   │   ├── Map/MapView.jsx        # Leaflet map + heatmap + markers
│   │   │   ├── Search/SearchPanel.jsx # Geocoding search UI
│   │   │   ├── Sidebar/RoutePanel.jsx # Route comparison cards
│   │   │   └── SOS/SOSPanel.jsx       # Emergency services
│   │   ├── hooks/
│   │   │   ├── useGeocoding.js        # Debounced geocoding hook
│   │   │   └── useToast.js            # Toast notifications
│   │   └── services/api.js            # Axios API service layer
│   └── vite.config.js                 # Vite + proxy config
│
└── backend/
    ├── server.js                       # Express entry point
    ├── routes/
    │   ├── routing.js                  # Route scoring endpoint
    │   ├── geocoding.js                # Nominatim proxy
    │   ├── heatmap.js                  # Danger zone points
    │   └── emergency.js               # Police/hospital lookup
    └── services/
        ├── safetyScorer.js             # AI mock scoring engine
        └── osrmClient.js              # OSRM client + fallback
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/routes?fromLat=&fromLon=&toLat=&toLon=` | Get scored routes |
| GET | `/geocode?q=location` | Search for places |
| GET | `/geocode/reverse?lat=&lon=` | Reverse geocode |
| GET | `/heatmap?minLat=&maxLat=&minLon=&maxLon=` | Danger zone points |
| GET | `/emergency?lat=&lon=` | Nearby emergency services |
| GET | `/health` | Health check |

---

## 🎨 Design System

- **Background**: Deep navy `#080c20`
- **Accent**: Electric blue `#4f8ef7`
- **Safe**: Green `#2ed573`
- **Warning**: Yellow `#ffd32a`  
- **Danger**: Red `#ff4757`
- **Font**: Inter + Space Grotesk (Google Fonts)
- **Map tiles**: CartoDB Dark Matter

---

## 📝 Notes

- Real-time crime/lighting APIs require paid subscriptions (replaced with realistic mock data)
- OSRM routing uses the free public API — may be slow during peak hours
- Emergency services use OpenStreetMap Overpass (real data where available, mock fallback)
