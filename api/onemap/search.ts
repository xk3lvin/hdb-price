import { searchOneMap } from '../../lib/onemap.js';

/**
 * Vercel Serverless Function: GET /api/onemap/search
 * Proxies geocoding searches to OneMap with server token
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const searchVal = req.query?.searchVal as string;
  if (!searchVal) {
    return res.status(200).json({ found: 0, totalNumPages: 0, pageNum: 1, results: [] });
  }

  try {
    const result = await searchOneMap(searchVal);
    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.error || 'OneMap search proxy failed' });
    }
    return res.status(200).json(result.data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OneMap search proxy failed' });
  }
}

