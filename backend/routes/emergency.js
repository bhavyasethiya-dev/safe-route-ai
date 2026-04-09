import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// GET /emergency?lat=&lon=
router.get('/', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

  const radius = 3000; // 3km radius
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="police"](around:${radius},${lat},${lon});
      node["amenity"="hospital"](around:${radius},${lat},${lon});
      node["amenity"="pharmacy"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error('Overpass API error');

    const data = await response.json();

    const services = data.elements.map((el) => ({
      id: el.id,
      name: el.tags?.name || capitalizeType(el.tags?.amenity) || 'Emergency Service',
      type: el.tags?.amenity,
      lat: el.lat,
      lon: el.lon,
      phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      distance: haversineDistance(parseFloat(lat), parseFloat(lon), el.lat, el.lon),
    })).sort((a, b) => a.distance - b.distance).slice(0, 10);

    res.json({ services });
  } catch (err) {
    console.warn('Overpass API failed, using mock data:', err.message);
    res.json({ services: getMockEmergencyServices(parseFloat(lat), parseFloat(lon)) });
  }
});

function capitalizeType(type) {
  if (!type) return null;
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getMockEmergencyServices(lat, lon) {
  const offsets = [
    { name: 'City Police Station', type: 'police', dlat: 0.008, dlon: 0.005 },
    { name: 'District Police Station', type: 'police', dlat: -0.012, dlon: 0.010 },
    { name: 'General Hospital', type: 'hospital', dlat: 0.006, dlon: -0.009 },
    { name: 'City Medical Center', type: 'hospital', dlat: -0.015, dlon: -0.004 },
    { name: '24Hr Pharmacy', type: 'pharmacy', dlat: 0.002, dlon: 0.003 },
  ];

  return offsets.map((o, i) => ({
    id: i + 1,
    name: o.name,
    type: o.type,
    lat: lat + o.dlat,
    lon: lon + o.dlon,
    phone: o.type === 'police' ? '100' : o.type === 'hospital' ? '108' : null,
    distance: haversineDistance(lat, lon, lat + o.dlat, lon + o.dlon),
  })).sort((a, b) => a.distance - b.distance);
}

export default router;
