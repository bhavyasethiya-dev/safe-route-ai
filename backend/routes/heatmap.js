import express from 'express';
import { generateHeatmapPoints } from '../services/safetyScorer.js';

const router = express.Router();

// GET /heatmap?minLat=&maxLat=&minLon=&maxLon=
router.get('/', (req, res) => {
  const { minLat, maxLat, minLon, maxLon } = req.query;

  // Default to a wide area if no bounds provided
  const bounds = {
    minLat: parseFloat(minLat) || 28.4,
    maxLat: parseFloat(maxLat) || 28.8,
    minLon: parseFloat(minLon) || 76.9,
    maxLon: parseFloat(maxLon) || 77.3,
  };

  const points = generateHeatmapPoints(bounds);

  res.json({ points, count: points.length });
});

export default router;
