import { routeOneMap } from '../../lib/onemap.js';

/**
 * Vercel Serverless Function: GET /api/onemap/route
 * Proxies routing queries (walk, drive, pt, cycle) to OneMap
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { start, end, routeType, mode, date, time } = req.query || {};
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end (lat,lng) query parameters are required' });
  }

  const authorization = req.headers['authorization'];

  try {
    const result = await routeOneMap({
      start: String(start),
      end: String(end),
      routeType: routeType as string,
      mode: mode as string,
      date: date as string,
      time: time as string,
      authorization: authorization as string,
    });

    if (!result.ok) {
      return res.status(result.status || 500).json({ error: result.error || 'OneMap route proxy failed' });
    }

    return res.status(200).json(result.data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OneMap route proxy failed' });
  }
}

