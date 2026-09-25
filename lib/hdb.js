/**
 * Shared HDB Resale Data API module
 * Queries live data.gov.sg datastore for Singapore HDB resale flat transactions
 */

const RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const BASE_URL = 'https://data.gov.sg/api/action/datastore_search';

/**
 * Fetch HDB resale transactions from data.gov.sg
 * Strictly returns live data without fallback seed records
 *
 * @param {Object} options
 * @param {string} [options.town] - e.g. 'ANG MO KIO', 'BEDOK', 'TAMPINES'
 * @param {string} [options.flat_type] - e.g. '2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'
 * @param {number} [options.max_price] - Maximum transaction price in SGD
 * @param {number} [options.limit=20] - Number of records to return (up to 100)
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {string} [options.sort='month desc'] - Sort order
 */
export async function fetchHdbResale({
  town,
  flat_type,
  max_price,
  limit = 20,
  offset = 0,
  sort = 'month desc',
} = {}) {
  const filtersObj = {};
  if (town && String(town).trim().toUpperCase() !== 'ALL') {
    filtersObj.town = String(town).trim().toUpperCase();
  }
  if (flat_type && String(flat_type).trim().toUpperCase() !== 'ALL') {
    filtersObj.flat_type = String(flat_type).trim().toUpperCase();
  }

  const requestedLimit = Number(limit) || 20;
  // If max_price is provided, fetch a larger batch because data.gov.sg filters are equality only
  const fetchLimit = max_price != null ? Math.max(requestedLimit * 3, 100) : requestedLimit;
  const fetchOffset = Number(offset) || 0;

  const url = new URL(BASE_URL);
  url.searchParams.set('resource_id', RESOURCE_ID);
  url.searchParams.set('limit', String(fetchLimit));
  url.searchParams.set('offset', String(fetchOffset));
  url.searchParams.set('sort', sort || 'month desc');

  if (Object.keys(filtersObj).length > 0) {
    url.searchParams.set('filters', JSON.stringify(filtersObj));
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  const rawText = await res.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      status: res.status,
      error: `Invalid response from data.gov.sg (status ${res.status})`,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error?.message || json?.message || `data.gov.sg resale API returned status ${res.status}`,
    };
  }

  if (!json?.success || !json?.result) {
    return {
      ok: false,
      status: res.status,
      error: json?.error?.message || 'Invalid result payload from data.gov.sg',
    };
  }

  let records = json.result.records || [];

  // Client-side inequality filter for max_price if supplied
  if (max_price != null && !isNaN(Number(max_price))) {
    const maxVal = Number(max_price);
    records = records.filter(r => Number(r.resale_price) <= maxVal);
  }

  // Cap to requested limit
  records = records.slice(0, requestedLimit);

  return {
    ok: true,
    status: 200,
    total: json.result.total,
    records,
  };
}
