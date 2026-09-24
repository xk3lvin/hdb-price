import { handlePing } from './health';

/**
 * Dedicated Vercel Serverless Function for GET /api/ping
 */
export default function handler(req: any, res: any): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return handlePing(req, res);
}
