/**
 * Shared OneMap API utility module
 * Provides token management, address search, and route calculation
 */

let cachedToken = null;

// Initialize token from environment variables if available
const envToken = (
  process.env.ONEMAP_API_TOKEN ||
  process.env.VITE_ONEMAP_TOKEN ||
  process.env.VITE_ONEMAP_API_TOKEN ||
  process.env.ONEMAP_TOKEN ||
  ''
).trim();

if (envToken) {
  cachedToken = {
    accessToken: envToken,
    expiryTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000,
    email: 'Environment Variable (Pre-configured)',
  };
}

/**
 * Mint a token from OneMap API
 * Endpoint: POST https://www.onemap.gov.sg/api/auth/post/getToken
 */
export async function mintOneMapToken(email, password) {
  const res = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const rawText = await res.text();
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    const preview = rawText.slice(0, 100).replace(/\s+/g, ' ');
    throw new Error(`OneMap authentication returned status ${res.status}: ${preview}`);
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `OneMap authentication returned status ${res.status}`);
  }

  if (!data.access_token) {
    throw new Error('No access_token found in OneMap authentication response');
  }

  let expiryMs = Date.now() + 3 * 24 * 60 * 60 * 1000;
  if (data.expiry_timestamp) {
    const parsed = Number(data.expiry_timestamp);
    if (!isNaN(parsed) && parsed > 0) {
      expiryMs = parsed > 10000000000 ? parsed : parsed * 1000;
    } else {
      const d = new Date(data.expiry_timestamp).getTime();
      if (!isNaN(d)) expiryMs = d;
    }
  }

  cachedToken = {
    accessToken: data.access_token,
    expiryTimestamp: expiryMs,
    email,
  };

  return cachedToken;
}

/**
 * Set OneMap token cache manually
 */
export function setOneMapToken(token, expiryTimestamp, email) {
  const expiryMs = Number(expiryTimestamp) || Date.now() + 3 * 24 * 60 * 60 * 1000;
  cachedToken = {
    accessToken: String(token).trim(),
    expiryTimestamp: expiryMs,
    email: email ? String(email).trim() : undefined,
  };
  return cachedToken;
}

/**
 * Retrieve active OneMap token
 */
export async function getOneMapToken() {
  if (cachedToken && Date.now() < cachedToken.expiryTimestamp) {
    return cachedToken.accessToken;
  }

  const tokenFromEnv = (
    process.env.ONEMAP_API_TOKEN ||
    process.env.VITE_ONEMAP_TOKEN ||
    process.env.VITE_ONEMAP_API_TOKEN ||
    process.env.ONEMAP_TOKEN ||
    ''
  ).trim();

  if (tokenFromEnv) {
    cachedToken = {
      accessToken: tokenFromEnv,
      expiryTimestamp: Date.now() + 365 * 24 * 60 * 60 * 1000,
      email: 'Environment Variable',
    };
    return tokenFromEnv;
  }

  if (process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD) {
    try {
      const minted = await mintOneMapToken(process.env.ONEMAP_EMAIL, process.env.ONEMAP_PASSWORD);
      return minted.accessToken;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Check token status
 */
export function getOneMapTokenStatus() {
  const isExpired = cachedToken ? Date.now() >= cachedToken.expiryTimestamp : true;
  const now = Date.now();
  const msRemaining = cachedToken && !isExpired ? Math.max(0, cachedToken.expiryTimestamp - now) : 0;
  const hoursRemaining = Math.round(msRemaining / (1000 * 60 * 60));

  return {
    connected: Boolean(cachedToken && !isExpired),
    email: cachedToken?.email || (process.env.ONEMAP_EMAIL ? process.env.ONEMAP_EMAIL : undefined),
    expiresAt: cachedToken?.expiryTimestamp,
    hoursRemaining,
    hasEnvCredentials: Boolean(process.env.ONEMAP_EMAIL && process.env.ONEMAP_PASSWORD),
  };
}

/**
 * Search Singapore addresses and places via OneMap Elastic Search
 * Upstream: https://www.onemap.gov.sg/api/common/elastic/search
 */
export async function searchOneMap(searchVal) {
  if (!searchVal || !String(searchVal).trim()) {
    return {
      ok: true,
      status: 200,
      data: { found: 0, totalNumPages: 0, pageNum: 1, results: [] },
    };
  }

  const token = await getOneMapToken();
  const headers = { Accept: 'application/json' };
  if (token) {
    headers['Authorization'] = token;
  }

  const query = encodeURIComponent(String(searchVal).trim());
  const res = await fetch(
    `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${query}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
    {
      headers,
      signal: AbortSignal.timeout(8000),
    }
  );

  const rawText = await res.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      status: res.status,
      error: `Invalid response from OneMap search (status ${res.status})`,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error || json?.message || `OneMap search failed with status ${res.status}`,
    };
  }

  return {
    ok: true,
    status: 200,
    data: json,
  };
}

/**
 * Calculate route between two coordinates via OneMap Routing Service
 * Upstream: https://www.onemap.gov.sg/api/public/routingsvc/route
 */
export async function routeOneMap({ start, end, mode, routeType, date, time, authorization } = {}) {
  if (!start || !end) {
    return {
      ok: false,
      status: 400,
      error: 'start and end (lat,lng) query parameters are required',
    };
  }

  const token = (authorization || (await getOneMapToken()) || '').trim();
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'No OneMap API token configured on server or request',
    };
  }

  const selectedRouteType = mode || routeType || 'walk';
  const params = new URLSearchParams({
    start: String(start),
    end: String(end),
    routeType: String(selectedRouteType),
  });

  if (mode) params.append('mode', String(mode));
  if (date) params.append('date', String(date));
  if (time) params.append('time', String(time));

  const res = await fetch(
    `https://www.onemap.gov.sg/api/public/routingsvc/route?${params.toString()}`,
    {
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  const rawText = await res.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      status: res.status,
      error: `Invalid response from OneMap route service (status ${res.status})`,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: json?.error || json?.message || `OneMap route service failed with status ${res.status}`,
    };
  }

  return {
    ok: true,
    status: 200,
    data: json,
  };
}
