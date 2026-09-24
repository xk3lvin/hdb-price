/**
 * Vercel Serverless Function: GET /api/onemap/token
 * Returns the active OneMap token configured in Vercel Environment Variables
 */
export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = (
    process.env.ONEMAP_API_TOKEN ||
    process.env.VITE_ONEMAP_TOKEN ||
    process.env.VITE_ONEMAP_API_TOKEN ||
    process.env.ONEMAP_TOKEN ||
    ''
  ).trim();

  return res.status(200).json({
    success: Boolean(token),
    hasToken: Boolean(token),
    token: token || null,
    source: token ? 'vercel_env' : 'none',
  });
}
