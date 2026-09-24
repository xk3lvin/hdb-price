import { DataGovResponse, HdbRecord } from '../types/hdb';
import { enrichHdbRecord, INITIAL_HDB_RECORDS } from '../data/seedData';
import { rateLimiter } from './rateLimiter';

const RESOURCE_ID = 'd_8b84c4ee58e3cfc0ece0d773c8ca6abc';
const BASE_URL = 'https://data.gov.sg/api/action/datastore_search';

const CACHE_PREFIX = 'kakiflats_api_cache_';
const apiCache = new Map<string, { data: DataGovResponse; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

export interface FetchHdbOptions {
  town?: string;
  flatType?: string;
  limit?: number;
  offset?: number;
  q?: string;
  sort?: string;
}

export async function fetchHdbTransactions(options: FetchHdbOptions = {}): Promise<{
  records: HdbRecord[];
  total: number;
  fromCache: boolean;
  error?: string;
}> {
  const filtersObj: Record<string, string> = {};
  if (options.town && options.town !== 'ALL') {
    filtersObj.town = options.town.toUpperCase();
  }
  if (options.flatType && options.flatType !== 'ALL') {
    filtersObj.flat_type = options.flatType.toUpperCase();
  }

  const limit = options.limit || 100;
  const offset = options.offset || 0;
  const cacheKey = `${CACHE_PREFIX}${JSON.stringify({ filters: filtersObj, limit, offset, q: options.q || '', sort: options.sort || '' })}`;

  // 1. Check in-memory cache
  const memoryHit = apiCache.get(cacheKey);
  if (memoryHit && Date.now() - memoryHit.timestamp < CACHE_TTL_MS) {
    const enriched = memoryHit.data.result.records.map(r => enrichHdbRecord(r));
    return {
      records: enriched,
      total: memoryHit.data.result.total,
      fromCache: true,
    };
  }

  // 2. Check localStorage cache
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        apiCache.set(cacheKey, parsed);
        const enriched = (parsed.data as DataGovResponse).result.records.map(r => enrichHdbRecord(r));
        return {
          records: enriched,
          total: (parsed.data as DataGovResponse).result.total,
          fromCache: true,
        };
      }
    }
  } catch {
    // ignore localStorage error
  }

  // 3. Polite Rate-Limited Network Call
  try {
    const url = new URL(BASE_URL);
    url.searchParams.set('resource_id', RESOURCE_ID);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    if (Object.keys(filtersObj).length > 0) {
      url.searchParams.set('filters', JSON.stringify(filtersObj));
    }
    if (options.q) {
      url.searchParams.set('q', options.q);
    }
    if (options.sort) {
      url.searchParams.set('sort', options.sort);
    }

    const response = await rateLimiter.schedule(async () => {
      const res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (res.status === 429) {
        throw new Error('HTTP 429: Rate limit reached on data.gov.sg. Using cached data.');
      }
      if (!res.ok) {
        throw new Error(`Data.gov.sg responded with status ${res.status}`);
      }

      return (await res.json()) as DataGovResponse;
    });

    if (response && response.success && response.result) {
      // Store in memory & localStorage
      const cacheEntry = { data: response, timestamp: Date.now() };
      apiCache.set(cacheKey, cacheEntry);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch {
        // storage quota exceeded
      }

      const enriched = response.result.records.map(r => enrichHdbRecord(r));
      return {
        records: enriched,
        total: response.result.total,
        fromCache: false,
      };
    }
  } catch (err: any) {
    console.warn('Live HDB API fetch failed, falling back to cached seed data:', err.message);

    // Filter seed records based on options
    let filtered = [...INITIAL_HDB_RECORDS];
    if (options.town && options.town !== 'ALL') {
      filtered = filtered.filter(r => r.town.toUpperCase() === options.town?.toUpperCase());
    }
    if (options.flatType && options.flatType !== 'ALL') {
      filtered = filtered.filter(r => r.flat_type.toUpperCase() === options.flatType?.toUpperCase());
    }
    if (options.q) {
      const qLower = options.q.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.street_name.toLowerCase().includes(qLower) ||
          r.block.toLowerCase().includes(qLower) ||
          r.town.toLowerCase().includes(qLower)
      );
    }

    return {
      records: filtered,
      total: filtered.length,
      fromCache: true,
      error: err.message,
    };
  }

  return {
    records: INITIAL_HDB_RECORDS,
    total: INITIAL_HDB_RECORDS.length,
    fromCache: true,
  };
}
