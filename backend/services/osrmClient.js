import fetch from 'node-fetch';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch routes from OSRM public API
 * @param {number} fromLat
 * @param {number} fromLon
 * @param {number} toLat
 * @param {number} toLon
 * @returns {Array} Array of route objects with geometry
 */
export async function fetchRoutes(fromLat, fromLon, toLat, toLon) {
  const coords = `${fromLon},${fromLat};${toLon},${toLat}`;
  const url = `${OSRM_BASE}/${coords}?alternatives=true&geometries=geojson&overview=full&steps=false`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SafeRouteAI/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`OSRM responded ${response.status}`);

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    let routes = data.routes;

    // If OSRM didn't return an alternative automatically, force one by adding an offset midpoint
    if (routes.length === 1) {
      const midLat = (fromLat + toLat) / 2;
      const midLon = (fromLon + toLon) / 2;
      
      // Calculate a perpendicular offset to force a different path
      const dLat = toLat - fromLat;
      const dLon = toLon - fromLon;
      const offsetLat = midLat - (dLon * 0.2); // ~20% lateral offset
      const offsetLon = midLon + (dLat * 0.2);

      const detourCoords = `${fromLon},${fromLat};${offsetLon},${offsetLat};${toLon},${toLat}`;
      const detourUrl = `${OSRM_BASE}/${detourCoords}?geometries=geojson&overview=full&steps=false`;

      try {
        const detourRes = await fetch(detourUrl, {
          headers: { 'User-Agent': 'SafeRouteAI/1.0' },
          signal: AbortSignal.timeout(5000),
        });
        if (detourRes.ok) {
          const detourData = await detourRes.json();
          if (detourData.routes && detourData.routes.length > 0) {
            routes.push(detourData.routes[0]);
          }
        }
      } catch (detourErr) {
        console.warn('Detour fetch failed:', detourErr.message);
      }
    }

    return routes.map((route, idx) => ({
      index: idx,
      distance: route.distance,        // meters
      duration: route.duration,        // seconds
      coordinates: route.geometry.coordinates,  // [lon, lat] pairs
    }));
  } catch (err) {
    console.warn('OSRM fetch failed, using fallback:', err.message);
    return generateFallbackRoutes(fromLat, fromLon, toLat, toLon);
  }
}

/**
 * Fallback: generate straight-line + offset route if OSRM is unavailable
 */
function generateFallbackRoutes(fromLat, fromLon, toLat, toLon) {
  const steps = 20;
  const direct = [];
  const alternate = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = fromLat + (toLat - fromLat) * t;
    const lon = fromLon + (toLon - fromLon) * t;

    direct.push([lon, lat]);

    // Slight offset for the alternate route
    const offset = Math.sin(t * Math.PI) * 0.005;
    alternate.push([lon + offset, lat + offset * 0.5]);
  }

  // Estimate distance using Haversine
  const R = 6371000;
  const dLat = (toLat - fromLat) * Math.PI / 180;
  const dLon = (toLon - fromLon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const duration = distance / 10; // ~36 km/h average

  return [
    { index: 0, distance, duration, coordinates: direct },
    { index: 1, distance: distance * 1.15, duration: duration * 1.2, coordinates: alternate },
  ];
}
