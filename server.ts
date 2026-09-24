import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OneMapTokenCache {
  accessToken: string;
  expiryTimestamp: number;
  email?: string;
}

let oneMapToken: OneMapTokenCache | null = null;

// Initialize from process.env if VITE_ONEMAP_TOKEN, ONEMAP_API_TOKEN, or ONEMAP_TOKEN is supplied
const envToken = (process.env.VITE_ONEMAP_TOKEN || process.env.ONEMAP_API_TOKEN || process.env.ONEMAP_TOKEN)?.trim();
if (envToken) {
  oneMapToken = {
    accessToken: envToken,
    expiryTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000,
    email: 'Environment Variable (Pre-configured)',
  };
}

/**
 * Mint a token from OneMap API
 * Endpoint: POST https://www.onemap.gov.sg/api/auth/post/getToken
 * JSON Body: {"email": "...", "password": "..."}
 * Validity: 3 days (approx 72 hours)
 */
async function mintOneMapToken(email: string, pass: string): Promise<OneMapTokenCache> {
  const res = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });

  const rawText = await res.text();
  let data: any;

  try {
    data = JSON.parse(rawText);
  } catch {
    const preview = rawText.slice(0, 100).replace(/\s+/g, ' ');
    throw new Error(`OneMap authentication returned status ${res.status}: ${preview}`);
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `OneMap authentication returned status ${res.status}`);
  }

  if (!data.access_token) {
    throw new Error('No access_token found in OneMap authentication response');
  }

  let expiryMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
  if (data.expiry_timestamp) {
    const parsed = Number(data.expiry_timestamp);
    if (!isNaN(parsed) && parsed > 0) {
      expiryMs = parsed > 10000000000 ? parsed : parsed * 1000;
    } else {
      const d = new Date(data.expiry_timestamp).getTime();
      if (!isNaN(d)) expiryMs = d;
    }
  }

  oneMapToken = {
    accessToken: data.access_token,
    expiryTimestamp: expiryMs,
    email,
  };

  return oneMapToken;
}

// Auto-mint if env vars present
if (process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD) {
  mintOneMapToken(process.env.ONEMAP_EMAIL, process.env.ONEMAP_PASSWORD)
    .then(token => console.log('OneMap token auto-minted from environment credentials.'))
    .catch(err => console.warn('Failed to auto-mint OneMap token:', err.message));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // --- API Routes ---

  // 1. Check current OneMap token status
  app.get('/api/onemap/status', (_req, res) => {
    const isExpired = oneMapToken ? Date.now() >= oneMapToken.expiryTimestamp : true;
    const now = Date.now();
    const msRemaining = oneMapToken && !isExpired ? Math.max(0, oneMapToken.expiryTimestamp - now) : 0;
    const hoursRemaining = Math.round(msRemaining / (1000 * 60 * 60));

    res.json({
      connected: !!oneMapToken && !isExpired,
      email: oneMapToken?.email || (process.env.ONEMAP_EMAIL ? process.env.ONEMAP_EMAIL : undefined),
      expiresAt: oneMapToken?.expiryTimestamp,
      hoursRemaining,
      hasEnvCredentials: !!(process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD),
    });
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
    const token = oneMapToken?.accessToken;

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
    } catch (err: any) {
      res.status(500).send('Error fetching tile');
    }
  });

  // 4. Get active OneMap token (from environment variable or server cache)
  app.get('/api/onemap/token', (req, res) => {
    const token = oneMapToken?.accessToken || (process.env.VITE_ONEMAP_TOKEN || process.env.ONEMAP_API_TOKEN || process.env.ONEMAP_TOKEN)?.trim() || null;
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
    oneMapToken = {
      accessToken: token.trim(),
      expiryTimestamp: expiryMs,
      email: email?.trim(),
    };

    const hoursRemaining = Math.max(0, Math.round((expiryMs - Date.now()) / (1000 * 60 * 60)));
    res.json({
      success: true,
      message: 'Token configured successfully',
      hoursRemaining,
    });
  });

  // 5. OneMap search proxy
  app.get('/api/onemap/search', async (req, res) => {
    const searchVal = req.query.searchVal as string;
    if (!searchVal) return res.json({ results: [] });

    try {
      const headers: Record<string, string> = {};
      if (oneMapToken?.accessToken) {
        headers['Authorization'] = oneMapToken.accessToken;
      }
      const query = encodeURIComponent(searchVal);
      const omRes = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
        { headers }
      );
      const rawText = await omRes.text();
      try {
        const data = JSON.parse(rawText);
        return res.json(data);
      } catch {
        return res.status(omRes.status).json({ error: 'Invalid response from OneMap search' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Reverse geocode proxy
  app.get('/api/onemap/revgeocode', async (req, res) => {
    const { location, buffer, addressType } = req.query;
    if (!location) return res.status(400).json({ error: 'Location required' });

    try {
      const headers: Record<string, string> = {};
      if (oneMapToken?.accessToken) {
        headers['Authorization'] = oneMapToken.accessToken;
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

  // 7. Route calculation proxy
  app.get('/api/onemap/route', async (req, res) => {
    const { start, end, routeType } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'Start and end required' });

    try {
      const headers: Record<string, string> = {};
      if (oneMapToken?.accessToken) {
        headers['Authorization'] = oneMapToken.accessToken;
      }
      const rType = routeType || 'walk';
      const omRes = await fetch(
        `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${start}&end=${end}&routeType=${rType}`,
        { headers }
      );
      const rawText = await omRes.text();
      try {
        const data = JSON.parse(rawText);
        return res.json(data);
      } catch {
        return res.status(omRes.status).json({ error: 'Invalid response from OneMap route service' });
      }
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
