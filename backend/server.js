import express from 'express';
import cors from 'cors';
import routingRouter from './routes/routing.js';
import geocodingRouter from './routes/geocoding.js';
import heatmapRouter from './routes/heatmap.js';
import emergencyRouter from './routes/emergency.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/routes', routingRouter);
app.use('/geocode', geocodingRouter);
app.use('/heatmap', heatmapRouter);
app.use('/emergency', emergencyRouter);
app.use('/auth', authRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Safe Route AI Backend', version: '1.0.0', timestamp: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🛡️  Safe Route AI Backend running on http://localhost:${PORT}`);
  console.log(`   GET /routes?fromLat=&fromLon=&toLat=&toLon=`);
  console.log(`   GET /geocode?q=location`);
  console.log(`   GET /heatmap?minLat=&maxLat=&minLon=&maxLon=`);
  console.log(`   GET /emergency?lat=&lon=\n`);
});
