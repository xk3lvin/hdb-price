/**
 * Vercel Serverless Function: /api/hdb-resale
 * Proxies HDB resale flat transaction queries to data.gov.sg without seed records
 */
import { fetchHdbResale } from '../lib/hdb.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryOrBody = req.method === 'POST' ? { ...req.query, ...req.body } : (req.query || {});
  const town = queryOrBody.town;
  const flat_type = queryOrBody.flat_type || queryOrBody.flatType;
  const max_price = queryOrBody.max_price !== undefined ? queryOrBody.max_price : queryOrBody.maxPrice;
  const limit = queryOrBody.limit ? Number(queryOrBody.limit) : 20;
  const offset = queryOrBody.offset ? Number(queryOrBody.offset) : 0;
  const sort = queryOrBody.sort || 'month desc';

  try {
    const result = await fetchHdbResale({
      town,
      flat_type,
      max_price,
      limit,
      offset,
      sort,
    });

    if (!result.ok) {
      return res.status(result.status || 500).json({
        success: false,
        error: result.error || 'Failed to fetch HDB resale transactions',
      });
    }

    return res.status(200).json({
      success: true,
      total: result.total,
      count: result.records.length,
      records: result.records,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'HDB resale proxy failed',
    });
  }
}
