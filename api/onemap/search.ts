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

  const token = (
    process.env.ONEMAP_API_TOKEN ||
    process.env.VITE_ONEMAP_TOKEN ||
    process.env.VITE_ONEMAP_API_TOKEN ||
    process.env.ONEMAP_TOKEN ||
    ''
  ).trim();

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    const query = encodeURIComponent(searchVal);
    const omRes = await fetch(
      `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
      { headers, signal: AbortSignal.timeout(6000) }
    );

    const text = await omRes.text();
    try {
      const json = JSON.parse(text);
      return res.status(omRes.status).json(json);
    } catch {
      return res.status(omRes.status).send(text);
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'OneMap search proxy failed' });
  }
}
