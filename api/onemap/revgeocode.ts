/**
 * Vercel Serverless Function: GET /api/onemap/revgeocode
 * Proxies reverse geocoding to OneMap using server-configured token
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { location, buffer, addressType, otherFeatures } = req.query || {};
  if (!location) {
    return res.status(400).json({ error: 'location query param (lat,lng) is required' });
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
      location: String(location),
      buffer: String(buffer || 40),
      addressType: String(addressType || 'All'),
      otherFeatures: String(otherFeatures || 'N'),
    });

    const omRes = await fetch(`https://www.onemap.gov.sg/api/public/revgeocode?${params.toString()}`, {
      headers: {
        'Authorization': token,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    const text = await omRes.text();
    try {
      const json = JSON.parse(text);
      return res.status(omRes.status).json(json);
    } catch {
      return res.status(omRes.status).send(text);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OneMap reverse geocode proxy failed' });
  }
}
