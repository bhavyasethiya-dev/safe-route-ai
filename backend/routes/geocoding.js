import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// GET /geocode?q=searchterm
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SafeRouteAI/1.0 (contact@saferoute.ai)',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error('Nominatim error');

    const data = await response.json();
    const results = data.map((item) => ({
      displayName: item.display_name,
      shortName: item.name || item.display_name.split(',')[0],
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
    }));

    res.json({ results });
  } catch (err) {
    console.error('Geocoding error:', err.message);
    res.status(500).json({ error: 'Geocoding failed', details: err.message });
  }
});

// GET /geocode/reverse?lat=&lon=
router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SafeRouteAI/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    res.json({
      displayName: data.display_name,
      shortName: data.address?.road || data.address?.suburb || data.display_name.split(',')[0],
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    });
  } catch (err) {
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
});

export default router;
