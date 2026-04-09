/**
 * AI Safety Scoring Engine
 * Uses deterministic mock data seeded by lat/lon coordinates
 * for consistent, realistic safety scores per location.
 */

// Pseudo-random seeded by coordinates for consistency
function seededRandom(lat, lon, salt = 0) {
  const x = Math.sin(lat * 127.1 + lon * 311.7 + salt * 74.3) * 43758.5453;
  return x - Math.floor(x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Generate safety factors for a single point
 */
function getSafetyFactors(lat, lon, timeHour = 22) {
  // Time factor: night hours are more dangerous
  const isNight = timeHour >= 20 || timeHour <= 6;
  const nightPenalty = isNight ? 0.75 : 1.0;

  // Crime index (0 = no crime, 1 = high crime) seeded by location
  const crimeBase = seededRandom(lat, lon, 1);
  const crimeIndex = Math.min(1, crimeBase * 1.2);

  // Traffic density (0 = empty, 1 = busy) - busier = safer at night
  const trafficBase = seededRandom(lat, lon, 2);
  const timeTrafficFactor = isNight ? 0.4 : 0.85;
  const trafficDensity = trafficBase * timeTrafficFactor;

  // Lighting level (0 = dark, 1 = well-lit)
  const lightingBase = seededRandom(lat, lon, 3);
  const lightingLevel = lerp(0.2, 0.95, lightingBase) * (isNight ? 0.85 : 1.0);

  // POI density (0 = isolated, 1 = lots of active places)
  const poiBase = seededRandom(lat, lon, 4);
  const poiDensity = poiBase * (isNight ? 0.6 : 1.0);

  // Weighted safety score
  const safetyScore =
    0.25 * trafficDensity +
    0.35 * (1 - crimeIndex) +
    0.25 * lightingLevel +
    0.15 * poiDensity;

  return {
    crimeIndex: +(crimeIndex * 100).toFixed(1),
    trafficDensity: +(trafficDensity * 100).toFixed(1),
    lightingLevel: +(lightingLevel * 100).toFixed(1),
    poiDensity: +(poiDensity * 100).toFixed(1),
    rawScore: safetyScore * nightPenalty,
  };
}

/**
 * Score a full route based on its waypoints
 * @param {Array} coordinates - Array of [lon, lat] pairs
 * @param {number} timeHour - Current hour for time-based factors
 * @returns {Object} - Safety scoring result
 */
export function scoreRoute(coordinates, timeHour = new Date().getHours()) {
  if (!coordinates || coordinates.length === 0) {
    return { score: 50, grade: 'C', factors: {} };
  }

  // Sample waypoints evenly (max 20 points for performance)
  const step = Math.max(1, Math.floor(coordinates.length / 20));
  const samples = [];
  for (let i = 0; i < coordinates.length; i += step) {
    samples.push(coordinates[i]);
  }

  let totalCrime = 0, totalTraffic = 0, totalLight = 0, totalPoi = 0, totalRaw = 0;

  samples.forEach(([lon, lat]) => {
    const f = getSafetyFactors(lat, lon, timeHour);
    totalCrime += f.crimeIndex;
    totalTraffic += f.trafficDensity;
    totalLight += f.lightingLevel;
    totalPoi += f.poiDensity;
    totalRaw += f.rawScore;
  });

  const n = samples.length;
  const avgScore = totalRaw / n;
  const finalScore = Math.round(Math.min(100, Math.max(0, avgScore * 100)));

  let grade, recommendation;
  if (finalScore >= 75) {
    grade = 'A';
    recommendation = 'Safe to travel';
  } else if (finalScore >= 55) {
    grade = 'B';
    recommendation = 'Generally safe, stay alert';
  } else if (finalScore >= 35) {
    grade = 'C';
    recommendation = 'Use caution on this route';
  } else {
    grade = 'D';
    recommendation = 'High risk — avoid if possible';
  }

  return {
    score: finalScore,
    grade,
    recommendation,
    factors: {
      crime: +(totalCrime / n).toFixed(1),
      traffic: +(totalTraffic / n).toFixed(1),
      lighting: +(totalLight / n).toFixed(1),
      poi: +(totalPoi / n).toFixed(1),
    },
  };
}

/**
 * Generate the "safe route" by nudging waypoints toward better-scored areas
 * In a real system this would use graph optimization; here we apply coordinate offsets
 * seeded to prefer lower-crime areas.
 */
export function generateSaferCoordinates(originalCoords) {
  // Add slight jitter to simulate taking alternate streets
  return originalCoords.map(([lon, lat], i) => {
    const jitter = seededRandom(lat, lon, i + 99) * 0.003 - 0.0015;
    const jitter2 = seededRandom(lon, lat, i + 77) * 0.003 - 0.0015;
    return [lon + jitter, lat + jitter2];
  });
}

/**
 * Generate heatmap danger zones around a bounding box
 */
export function generateHeatmapPoints(bounds) {
  const { minLat, maxLat, minLon, maxLon } = bounds;
  const points = [];
  const NUM_POINTS = 120;

  for (let i = 0; i < NUM_POINTS; i++) {
    const lat = minLat + seededRandom(i, 0, 1) * (maxLat - minLat);
    const lon = minLon + seededRandom(0, i, 2) * (maxLon - minLon);
    const factors = getSafetyFactors(lat, lon, 22);
    const danger = 1 - factors.rawScore;
    if (danger > 0.35) {
      points.push({ lat, lon, intensity: +danger.toFixed(3) });
    }
  }

  return points;
}
