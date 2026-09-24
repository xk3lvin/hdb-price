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

  const token = (
    req.headers['authorization'] ||
    process.env.ONEMAP_API_TOKEN ||
    process.env.VITE_ONEMAP_TOKEN ||
    process.env.VITE_ONEMAP_API_TOKEN ||
    process.env.ONEMAP_TOKEN ||
    ''
  ).trim();

  if (!token) {
    return res.status(401).json({ error: 'No OneMap API token configured on server or request.' });
  }

  try {
    const params = new URLSearchParams({
      start: String(start),
      end: String(end),
      routeType: String(routeType || 'walk'),
    });
    if (mode) params.append('mode', String(mode));
    if (date) params.append('date', String(date));
    if (time) params.append('time', String(time));

    const omRes = await fetch(`https://www.onemap.gov.sg/api/public/routingsvc/route?${params.toString()}`, {
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    const text = await omRes.text();
    try {
      const json = JSON.parse(text);
      return res.status(omRes.status).json(json);
    } catch {
      return res.status(omRes.status).send(text);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OneMap route proxy failed' });
  }
}
