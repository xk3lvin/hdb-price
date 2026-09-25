import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './api/index';
import mcpHandler from './api/mcp.js';
import hdbResaleHandler from './api/hdb-resale.js';
import {
  searchOneMap,
  routeOneMap,
  mintOneMapToken,
  setOneMapToken,
  getOneMapToken,
  getOneMapTokenStatus,
} from './lib/onemap.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Auto-mint if env vars present
if (process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD) {
  mintOneMapToken(process.env.ONEMAP_EMAIL, process.env.ONEMAP_PASSWORD)
    .then(() => console.log('OneMap token auto-minted from environment credentials.'))
    .catch((err: any) => console.warn('Failed to auto-mint OneMap token:', err.message));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // MCP Server Endpoints
  app.post('/api/mcp', mcpHandler);
  app.get('/api/mcp', mcpHandler);

  // HDB Resale Endpoint
  app.get('/api/hdb-resale', hdbResaleHandler);
  app.post('/api/hdb-resale', hdbResaleHandler);

  // Mount API health & status router (/api/health, /api/health/ping, /health)
  app.use('/api', apiRouter);
  app.use('/health', apiRouter);

  // --- API Routes ---

  // 1. Check current OneMap token status
  app.get('/api/onemap/status', (_req, res) => {
    res.json(getOneMapTokenStatus());
  });

  // 2. Mint OneMap token endpoint
  // Takes { email, password } in body or uses environment variables
  app.post('/api/onemap/mint-token', async (req, res) => {
    const { email, password } = req.body || {};
    const useEmail = email || process.env.ONEMAP_EMAIL;
    const usePassword = password || process.env.ONEMAP_PASSWORD;

    if (!useEmail || !usePassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required to mint a OneMap token.',
      });
    }

    try {
      const result = await mintOneMapToken(useEmail, usePassword);
      const hoursRemaining = Math.round((result.expiryTimestamp - Date.now()) / (1000 * 60 * 60));

      res.json({
        success: true,
        message: 'Successfully minted OneMap token (valid for 3 days).',
        expiryTimestamp: result.expiryTimestamp,
        hoursRemaining,
        email: useEmail,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: err.message || 'OneMap token minting failed',
      });
    }
  });

  // 3. Tile Proxy: /api/onemap/tiles/:style/:z/:x/:y.png
  // Styles: Default, Night, Grey, Original
  app.get('/api/onemap/tiles/:style/:z/:x/:y.png', async (req, res) => {
    const { style, z, x, y } = req.params;
    const token = await getOneMapToken();

    const oneMapUrl = `https://www.onemap.gov.sg/maps/tiles/${style}/${z}/${x}/${y}.png`;

    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const tileRes = await fetch(oneMapUrl, { headers });
      if (tileRes.ok) {
        const contentType = tileRes.headers.get('content-type') || 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buffer = await tileRes.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }

      // Fallback tiles if OneMap returns 401 or unavailable
      const isNight = style.toLowerCase().includes('night') || style.toLowerCase().includes('dark');
      const fallbackUrl = isNight
        ? `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`
        : `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;

      const fbRes = await fetch(fallbackUrl);
      if (fbRes.ok) {
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const buffer = await fbRes.arrayBuffer();
        return res.send(Buffer.from(buffer));
      }

      res.status(tileRes.status).send('Tile not available');
    } catch {
      res.status(500).send('Error fetching tile');
    }
  });

  // 4. Get active OneMap token (from environment variable or server cache)
  app.get('/api/onemap/token', async (_req, res) => {
    const token = await getOneMapToken();
    res.json({
      success: Boolean(token),
      token: token || null,
      hasToken: Boolean(token),
    });
  });

  // 5. Set OneMap token directly (paste token)
  app.post('/api/onemap/set-token', (req, res) => {
    const { token, expiryTimestamp, email } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const expiryMs = Number(expiryTimestamp) || Date.now() + 3 * 24 * 60 * 60 * 1000;
    setOneMapToken(token, expiryMs, email);

    const hoursRemaining = Math.max(0, Math.round((expiryMs - Date.now()) / (1000 * 60 * 60)));
    res.json({
      success: true,
      message: 'Token configured successfully',
      hoursRemaining,
    });
  });

  // 6. OneMap search proxy
  app.get('/api/onemap/search', async (req, res) => {
    const searchVal = req.query.searchVal as string;
    if (!searchVal) return res.json({ results: [] });

    try {
      const result = await searchOneMap(searchVal);
      if (!result.ok) {
        return res.status(result.status || 500).json({ error: result.error || 'OneMap search failed' });
      }
      return res.json(result.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Reverse geocode proxy
  app.get('/api/onemap/revgeocode', async (req, res) => {
    const { location, buffer, addressType } = req.query;
    if (!location) return res.status(400).json({ error: 'Location required' });

    try {
      const token = await getOneMapToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = token;
      }
      const buff = buffer || 40;
      const addrType = addressType || 'All';
      const omRes = await fetch(
        `https://www.onemap.gov.sg/api/public/revgeocode?location=${location}&buffer=${buff}&addressType=${addrType}`,
        { headers }
      );
      const rawText = await omRes.text();
      try {
        const data = JSON.parse(rawText);
        return res.json(data);
      } catch {
        return res.status(omRes.status).json({ error: 'Invalid response from OneMap revgeocode' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Route calculation proxy
  app.get('/api/onemap/route', async (req, res) => {
    const { start, end, routeType, mode, date, time } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Start and end required' });

    try {
      const result = await routeOneMap({
        start: String(start),
        end: String(end),
        routeType: routeType as string,
        mode: mode as string,
        date: date as string,
        time: time as string,
      });

      if (!result.ok) {
        return res.status(result.status || 500).json({ error: result.error || 'OneMap route proxy failed' });
      }
      return res.json(result.data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite development middleware or static production serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KakiFlats server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
