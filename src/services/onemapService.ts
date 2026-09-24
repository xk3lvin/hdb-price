/**
 * Singapore OneMap SLA API Service
 * Handles:
 * 1. 3-Day Token minting (POST https://www.onemap.gov.sg/api/auth/post/getToken)
 * 2. Manual token entry (pasting existing 3-day token)
 * 3. Geocode / Search with Authorization header (https://www.onemap.gov.sg/api/common/elastic/search)
 * 4. Reverse Geocode (https://www.onemap.gov.sg/api/public/revgeocode)
 * 5. Multi-modal Routing: walk | drive | cycle | pt (https://www.onemap.gov.sg/api/public/routingsvc/route)
 * 6. Resilient error handling that protects against non-JSON (HTML 404 / 502 / WAF "The page cannot be found...") errors.
 */

const STORAGE_KEY_TOKEN = 'kakiflats_onemap_token';
const STORAGE_KEY_EXPIRY = 'kakiflats_onemap_token_expiry';
const STORAGE_KEY_EMAIL = 'kakiflats_onemap_email';

export interface OneMapTokenInfo {
  token: string | null;
  email?: string;
  expiryTimestamp: number | null;
  isValid: boolean;
  hoursRemaining: number;
  isEnvConfigured?: boolean;
}

let cachedServerToken: string | null = null;
let serverTokenPromise: Promise<string | null> | null = null;

/**
 * Helper to resolve token from client-inlined env variables
 */
function resolveClientEnvToken(): string | null {
  try {
    const fromProcess = 
      (typeof process !== 'undefined' && process.env?.ONEMAP_API_TOKEN) ||
      (typeof process !== 'undefined' && process.env?.VITE_ONEMAP_TOKEN) ||
      (typeof process !== 'undefined' && process.env?.ONEMAP_TOKEN);
    if (fromProcess && typeof fromProcess === 'string' && fromProcess.trim()) {
      return fromProcess.trim();
    }
  } catch {}

  try {
    const metaEnv = (import.meta as any).env || {};
    const fromMeta = 
      metaEnv.VITE_ONEMAP_TOKEN || 
      metaEnv.VITE_ONEMAP_API_TOKEN || 
      metaEnv.ONEMAP_API_TOKEN || 
      metaEnv.ONEMAP_TOKEN;
    if (fromMeta && typeof fromMeta === 'string' && fromMeta.trim()) {
      return fromMeta.trim();
    }
  } catch {}

  return null;
}

/**
 * Initialize OneMap token from environment variable or backend proxy
 */
export async function initOneMapToken(): Promise<string | null> {
  // Check client env variable first
  const envToken = resolveClientEnvToken();

  if (envToken) {
    return envToken;
  }

  if (cachedServerToken) return cachedServerToken;
  if (serverTokenPromise) return serverTokenPromise;

  serverTokenPromise = (async () => {
    try {
      const res = await safeFetchJson<{ success?: boolean; token?: string }>('/api/onemap/token', {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok && res.data?.token) {
        cachedServerToken = res.data.token.trim();
        window.dispatchEvent(new Event('onemap_token_updated'));
        return cachedServerToken;
      }
    } catch {
      // ignore
    }
    return null;
  })();

  return serverTokenPromise;
}

// Kick off token initialization immediately in background
if (typeof window !== 'undefined') {
  initOneMapToken().catch(() => {});
}

export interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

export interface OneMapRouteResult {
  status_message?: string;
  route_summary?: {
    total_time: number; // in seconds
    total_distance: number; // in meters
    start_point: string;
    end_point: string;
  };
  route_geometry?: string;
  route_instructions?: Array<[string, string, number, string, number, string, string]>;
  error?: string;
}

/**
 * Robust fetch wrapper that inspects Content-Type and text before parsing JSON.
 * Completely eliminates: SyntaxError: Unexpected token 'T', "The page c"... is not valid JSON
 */
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();
    const trimmed = rawText.trim();

    // Check if the response is an HTML document or an error page
    const isHtml = 
      trimmed.startsWith('<!DOCTYPE') || 
      trimmed.startsWith('<html') || 
      trimmed.startsWith('<HTML') || 
      trimmed.startsWith('<') ||
      trimmed.toLowerCase().startsWith('the page') ||
      (!contentType.includes('application/json') && !contentType.includes('text/json') && trimmed.includes('<body'));

    if (isHtml) {
      // Extract brief page title or preview if available
      const titleMatch = trimmed.match(/<title>([^<]*)<\/title>/i);
      const titleSnippet = titleMatch ? titleMatch[1].trim() : trimmed.slice(0, 80).replace(/\s+/g, ' ');
      const msg = `Endpoint returned HTML page (${res.status} ${res.statusText}): "${titleSnippet}".`;
      return {
        ok: false,
        status: res.status,
        error: msg,
      };
    }

    try {
      const data = JSON.parse(rawText);
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: data.error || data.message || `OneMap API returned HTTP ${res.status}`,
          data,
        };
      }
      return { ok: true, status: res.status, data };
    } catch {
      return {
        ok: false,
        status: res.status,
        error: `Invalid response format received from server (${trimmed.slice(0, 80)})`,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err.message || 'Network request failed. Please check your connection.',
    };
  }
}

/**
 * Get active token from environment variable, server cache, or localStorage
 */
export function getStoredOneMapToken(): OneMapTokenInfo {
  // 1. Check client environment variable (VITE_ONEMAP_TOKEN or ONEMAP_API_TOKEN)
  const envToken = resolveClientEnvToken();

  if (envToken) {
    return {
      token: envToken,
      email: 'Environment Variable (Pre-configured)',
      expiryTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000,
      isValid: true,
      hoursRemaining: 8760,
      isEnvConfigured: true,
    };
  }

  // 2. Check cached token from server environment
  if (cachedServerToken) {
    return {
      token: cachedServerToken,
      email: 'Server Environment (Pre-configured)',
      expiryTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000,
      isValid: true,
      hoursRemaining: 8760,
      isEnvConfigured: true,
    };
  }

  // 3. Check localStorage fallback
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiryStr = localStorage.getItem(STORAGE_KEY_EXPIRY);
    const email = localStorage.getItem(STORAGE_KEY_EMAIL) || undefined;

    if (!token) {
      return { token: null, email, expiryTimestamp: null, isValid: false, hoursRemaining: 0, isEnvConfigured: false };
    }

    const expiry = expiryStr ? Number(expiryStr) : 0;
    const now = Date.now();
    const isValid = expiry > now;
    const hoursRemaining = isValid ? Math.max(0, Math.round((expiry - now) / (1000 * 60 * 60))) : 0;

    return {
      token,
      email,
      expiryTimestamp: expiry,
      isValid,
      hoursRemaining,
      isEnvConfigured: false,
    };
  } catch {
    return { token: null, expiryTimestamp: null, isValid: false, hoursRemaining: 0, isEnvConfigured: false };
  }
}

/**
 * Save token to localStorage
 */
export function saveOneMapToken(token: string, expiryTimestamp?: number, email?: string): void {
  try {
    // Default 3 days (72 hours) if not specified
    const expiry = expiryTimestamp || Date.now() + 3 * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
    localStorage.setItem(STORAGE_KEY_EXPIRY, String(expiry));
    if (email) {
      localStorage.setItem(STORAGE_KEY_EMAIL, email.trim());
    }
    // Dispatch custom event so reactive components update immediately
    window.dispatchEvent(new Event('onemap_token_updated'));
  } catch {
    // ignore quota/private window error
  }
}

/**
 * Remove token
 */
export function clearOneMapToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
    window.dispatchEvent(new Event('onemap_token_updated'));
  } catch {
    // ignore
  }
}

/**
 * Mint 3-Day token from OneMap.
 * Tries direct POST to https://www.onemap.gov.sg/api/auth/post/getToken (which supports CORS *),
 * with fallback to server proxy /api/onemap/mint-token.
 */
export async function mintOneMap3DayToken(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; hoursRemaining?: number; error?: string }> {
  const cleanEmail = email.trim();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: 'Email and password are required to mint a OneMap token.' };
  }

  // Strategy 1: Direct request to OneMap Official Auth Endpoint
  // OneMap explicitly allows CORS from web applications
  const directUrl = 'https://www.onemap.gov.sg/api/auth/post/getToken';
  const directResult = await safeFetchJson<{ access_token?: string; expiry_timestamp?: string | number }>(
    directUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
    }
  );

  if (directResult.ok && directResult.data?.access_token) {
    const token = directResult.data.access_token;
    let expiryMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
    if (directResult.data.expiry_timestamp) {
      const parsed = Number(directResult.data.expiry_timestamp);
      if (!isNaN(parsed) && parsed > 0) {
        expiryMs = parsed > 10000000000 ? parsed : parsed * 1000;
      }
    }
    saveOneMapToken(token, expiryMs, cleanEmail);
    const hours = Math.round((expiryMs - Date.now()) / (1000 * 60 * 60));
    return { success: true, token, hoursRemaining: hours };
  }

  // Strategy 2: If direct failed due to client firewall/adblocker, try local backend proxy if available
  const proxyUrl = '/api/onemap/mint-token';
  const proxyResult = await safeFetchJson<{
    success?: boolean;
    token?: string;
    hoursRemaining?: number;
    expiryTimestamp?: number;
    error?: string;
  }>(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
  });

  if (proxyResult.ok && proxyResult.data?.success && proxyResult.data?.token) {
    const token = proxyResult.data.token;
    const expiryMs = proxyResult.data.expiryTimestamp || Date.now() + 3 * 24 * 60 * 60 * 1000;
    saveOneMapToken(token, expiryMs, cleanEmail);
    return {
      success: true,
      token,
      hoursRemaining: proxyResult.data.hoursRemaining || 72,
    };
  }

  // Gather specific error message
  const errDetail = directResult.error || proxyResult.error || 'Failed to authenticate with OneMap credentials.';
  return {
    success: false,
    error: errDetail,
  };
}

/**
 * Search / Geocode using OneMap Elastic Search API.
 * Officially requires the Authorization header.
 * Endpoint: https://www.onemap.gov.sg/api/common/elastic/search
 */
export async function searchOneMap(
  searchVal: string,
  pageNum: number = 1
): Promise<{ results: OneMapSearchResult[]; error?: string }> {
  if (!searchVal.trim()) return { results: [] };

  const tokenInfo = getStoredOneMapToken();
  const headers: Record<string, string> = {};
  if (tokenInfo.token && tokenInfo.isValid) {
    headers['Authorization'] = tokenInfo.token;
  }

  const query = encodeURIComponent(searchVal.trim());
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=${pageNum}`;

  const res = await safeFetchJson<{ results?: OneMapSearchResult[]; error?: string }>(url, {
    headers,
    signal: AbortSignal.timeout(6000),
  });

  if (res.ok && res.data?.results) {
    return { results: res.data.results };
  }

  // If direct failed and proxy is available, try proxy
  if (headers['Authorization']) {
    const proxyRes = await safeFetchJson<{ results?: OneMapSearchResult[]; error?: string }>(
      `/api/onemap/search?searchVal=${query}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (proxyRes.ok && proxyRes.data?.results) {
      return { results: proxyRes.data.results };
    }
  }

  return {
    results: res.data?.results || [],
    error: res.error || (res.data as any)?.error,
  };
}

/**
 * Reverse Geocode: convert Lat/Lng to Singapore Postal & Address
 * Endpoint: https://www.onemap.gov.sg/api/public/revgeocode?location=lat,lng&buffer=40&addressType=All
 * Uses environment variable / direct token with transparent server proxy fallback.
 */
export async function reverseGeocodeOneMap(
  lat: number,
  lng: number,
  buffer: number = 40
): Promise<{ address?: string; building?: string; postal?: string; error?: string }> {
  const tokenInfo = getStoredOneMapToken();

  // Try direct OneMap endpoint if token is present
  if (tokenInfo.token && tokenInfo.isValid) {
    const url = `https://www.onemap.gov.sg/api/public/revgeocode?location=${lat},${lng}&buffer=${buffer}&addressType=All`;
    const res = await safeFetchJson<{
      GeocodeInfo?: Array<{
        BUILDINGNAME?: string;
        BLOCK?: string;
        ROAD?: string;
        POSTALCODE?: string;
      }>;
      error?: string;
    }>(url, {
      headers: {
        Authorization: tokenInfo.token,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok && res.data?.GeocodeInfo && res.data.GeocodeInfo.length > 0) {
      const info = res.data.GeocodeInfo[0];
      const road = info.ROAD || '';
      const blk = info.BLOCK ? `Blk ${info.BLOCK} ` : '';
      const postal = info.POSTALCODE || '';
      return {
        address: `${blk}${road}`.trim() || 'Singapore Location',
        building: info.BUILDINGNAME || '',
        postal,
      };
    }
  }

  // Fallback: Use backend server proxy (which uses server environment variable ONEMAP_API_TOKEN / VITE_ONEMAP_TOKEN)
  try {
    const proxyRes = await safeFetchJson<{
      GeocodeInfo?: Array<{
        BUILDINGNAME?: string;
        BLOCK?: string;
        ROAD?: string;
        POSTALCODE?: string;
      }>;
      error?: string;
    }>(`/api/onemap/revgeocode?location=${lat},${lng}&buffer=${buffer}&addressType=All`, {
      signal: AbortSignal.timeout(5000),
    });

    if (proxyRes.ok && proxyRes.data?.GeocodeInfo && proxyRes.data.GeocodeInfo.length > 0) {
      const info = proxyRes.data.GeocodeInfo[0];
      const road = info.ROAD || '';
      const blk = info.BLOCK ? `Blk ${info.BLOCK} ` : '';
      const postal = info.POSTALCODE || '';
      return {
        address: `${blk}${road}`.trim() || 'Singapore Location',
        building: info.BUILDINGNAME || '',
        postal,
      };
    }
  } catch {
    // ignore
  }

  return { error: 'No address found at this coordinate.' };
}

/**
 * Route calculation: walk | drive | cycle | pt
 * Endpoint: https://www.onemap.gov.sg/api/public/routingsvc/route?start=...&end=...&routeType=...
 * Uses environment variable / direct token with transparent server proxy fallback.
 */
export async function getOneMapRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  routeType: 'walk' | 'drive' | 'cycle' | 'pt' = 'walk'
): Promise<OneMapRouteResult> {
  const tokenInfo = getStoredOneMapToken();

  // Try direct OneMap endpoint if token is present
  if (tokenInfo.token && tokenInfo.isValid) {
    const start = `${startLat},${startLng}`;
    const end = `${endLat},${endLng}`;
    const url = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${start}&end=${end}&routeType=${routeType}`;

    const res = await safeFetchJson<OneMapRouteResult>(url, {
      headers: {
        Authorization: tokenInfo.token,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok && res.data && res.data.route_summary) {
      return res.data;
    }
  }

  // Fallback: Use backend server proxy (which uses server environment variable ONEMAP_API_TOKEN / VITE_ONEMAP_TOKEN)
  try {
    const proxyRes = await safeFetchJson<OneMapRouteResult>(
      `/api/onemap/route?start=${startLat},${startLng}&end=${endLat},${endLng}&routeType=${routeType}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (proxyRes.ok && proxyRes.data) {
      return proxyRes.data;
    }
  } catch {
    // ignore
  }

  return { error: 'Unable to compute route.' };
}
