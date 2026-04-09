import { useEffect, useRef } from 'react';

// Use Leaflet from CDN global (loaded in index.html before this module runs).
// This avoids dual-instance conflicts with npm leaflet bundled by Vite.

function createColoredMarker(L, color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      font-size:15px;box-shadow:0 4px 14px rgba(0,0,0,0.5);
      transform:rotate(-45deg);
    "><span style="transform:rotate(45deg)">${emoji}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}

function createServiceMarker(L, type) {
  const configs = {
    police:   { color: '#4f8ef7', emoji: '👮' },
    hospital: { color: '#ff4757', emoji: '🏥' },
    pharmacy: { color: '#2ed573', emoji: '💊' },
  };
  const cfg = configs[type] || { color: '#8b5cf6', emoji: '⚠️' };
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:${cfg.color};border:2px solid white;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;box-shadow:0 3px 10px rgba(0,0,0,0.5);
    ">${cfg.emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function getScoreColor(score) {
  if (score == null) return '#8892b0';
  if (score >= 70) return '#2ed573';
  if (score >= 45) return '#ffd32a';
  return '#ff4757';
}

const ROUTE_STYLES = {
  safest:   { color: '#2ed573', weight: 6, opacity: 0.9,  dashArray: null },
  shortest: { color: '#4f8ef7', weight: 5, opacity: 0.75, dashArray: '8,6' },
};

export default function MapView({
  center, zoom, routes, activeRouteId, heatmapPoints,
  origin, destination, emergencyServices, showHeatmap,
  onMapClick, onMapReady,
}) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layersRef    = useRef({ routes: {}, markers: [], heat: null, services: [] });

  /* ─── Initialize Map ─────────────────────────────── */
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const L = window.L;
    if (!L) { console.error('Leaflet not loaded from CDN'); return; }

    const map = L.map(containerRef.current, {
      center: center || [28.6139, 77.2090],
      zoom:   zoom   || 12,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    map.on('click', (e) => { if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng); });

    mapRef.current = map;
    if (onMapReady) onMapReady(map);

    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Routes ─────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    const L   = window.L;
    if (!map || !L) return;

    Object.values(layersRef.current.routes).forEach((l) => map.removeLayer(l));
    layersRef.current.routes = {};
    if (!routes || routes.length === 0) return;

    routes.forEach((route) => {
      const isActive = route.id === activeRouteId;
      const style    = ROUTE_STYLES[route.type] || ROUTE_STYLES.shortest;
      const latLngs  = route.coordinates.map(([lon, lat]) => [lat, lon]);

      if (isActive) {
        const shadow = L.polyline(latLngs, {
          color: style.color, weight: style.weight + 6, opacity: 0.15,
        }).addTo(map);
        layersRef.current.routes[`${route.id}-shadow`] = shadow;
      }

      const line = L.polyline(latLngs, {
        ...style,
        opacity: isActive ? style.opacity : style.opacity * 0.5,
        weight:  isActive ? style.weight  : style.weight - 1,
      }).addTo(map);

      line.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:160px">
          <div style="font-weight:700;margin-bottom:4px;font-size:13px">${route.label}</div>
          <div style="color:#8892b0;font-size:11px">Safety Score</div>
          <div style="font-size:22px;font-weight:800;color:${getScoreColor(route.safety?.score)}">${route.safety?.score ?? '—'}/100</div>
          <div style="color:#8892b0;font-size:11px;margin-top:2px">${route.safety?.recommendation || ''}</div>
        </div>
      `);

      layersRef.current.routes[route.id] = line;
    });

    const allCoords = routes.flatMap((r) => r.coordinates.map(([lon, lat]) => [lat, lon]));
    if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60] });
    }
  }, [routes, activeRouteId]);

  /* ─── Origin & Destination Markers ───────────────── */
  useEffect(() => {
    const map = mapRef.current;
    const L   = window.L;
    if (!map || !L) return;

    layersRef.current.markers.forEach((m) => map.removeLayer(m));
    layersRef.current.markers = [];

    if (origin) {
      const m = L.marker([origin.lat, origin.lon], {
        icon: createColoredMarker(L, '#2ed573', '🟢'),
      }).addTo(map).bindPopup(`<b>Start</b><br>${origin.shortName || origin.displayName || ''}`);
      layersRef.current.markers.push(m);
    }

    if (destination) {
      const m = L.marker([destination.lat, destination.lon], {
        icon: createColoredMarker(L, '#ff4757', '📍'),
      }).addTo(map).bindPopup(`<b>Destination</b><br>${destination.shortName || destination.displayName || ''}`);
      layersRef.current.markers.push(m);
    }
  }, [origin, destination]);

  /* ─── Heatmap ─────────────────────────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (layersRef.current.heat) {
      map.removeLayer(layersRef.current.heat);
      layersRef.current.heat = null;
    }

    if (!showHeatmap || !heatmapPoints || heatmapPoints.length === 0) return;

    const L = window.L;
    if (L && L.heatLayer) {
      const heatData = heatmapPoints.map((p) => [p.lat, p.lon, p.intensity]);
      const heat = L.heatLayer(heatData, {
        radius: 35, blur: 25, maxZoom: 17,
        gradient: { 0.0: '#2ed573', 0.4: '#ffd32a', 0.7: '#ff6b35', 1.0: '#ff4757' },
      }).addTo(map);
      layersRef.current.heat = heat;
    }
  }, [showHeatmap, heatmapPoints]);

  /* ─── Emergency Service Markers ──────────────────── */
  useEffect(() => {
    const map = mapRef.current;
    const L   = window.L;
    if (!map || !L) return;

    layersRef.current.services.forEach((m) => map.removeLayer(m));
    layersRef.current.services = [];
    if (!emergencyServices) return;

    emergencyServices.forEach((svc) => {
      const m = L.marker([svc.lat, svc.lon], {
        icon: createServiceMarker(L, svc.type),
      }).addTo(map).bindPopup(`
        <div style="font-family:Inter,sans-serif">
          <div style="font-weight:700;font-size:13px">${svc.name}</div>
          <div style="color:#8892b0;font-size:11px;margin-top:2px;text-transform:capitalize">${svc.type}</div>
          ${svc.phone ? `<div style="color:#4f8ef7;font-size:12px;margin-top:4px">📞 ${svc.phone}</div>` : ''}
          <div style="color:#8892b0;font-size:11px;margin-top:2px">${(svc.distance / 1000).toFixed(1)} km away</div>
        </div>
      `);
      layersRef.current.services.push(m);
    });
  }, [emergencyServices]);

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" id="main-map" />
    </div>
  );
}
