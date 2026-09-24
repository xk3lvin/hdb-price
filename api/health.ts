import { Request, Response } from 'express';

export interface ServiceHealth {
  name: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
  details?: Record<string, any>;
}

export interface ApiHealthResponse {
  status: 'operational' | 'degraded' | 'down';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  server: {
    nodeVersion: string;
    memoryUsageMb: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
    pid: number;
  };
  services: {
    datagovsg: ServiceHealth;
    onemap: ServiceHealth;
    gemini: ServiceHealth;
  };
}

/**
 * Check Singapore Data.gov.sg HDB Resale Transactions API
 */
async function checkDataGovSgHealth(): Promise<ServiceHealth> {
  const start = Date.now();
  const endpoint = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_8b84c4ee58e3cfc0ece0d773c8ca6abc&limit=1';
  
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      const data = await res.json() as any;
      const recordCount = data?.result?.records?.length ?? 0;
      return {
        name: 'Data.gov.sg HDB Resale API',
        endpoint: 'https://data.gov.sg/api/action/datastore_search',
        status: latencyMs > 2500 ? 'degraded' : 'operational',
        latencyMs,
        message: `Responsive (${recordCount} test record returned)`,
        details: {
          httpStatus: res.status,
          totalReported: data?.result?.total ?? null,
        },
      };
    }

    return {
      name: 'Data.gov.sg HDB Resale API',
      endpoint: 'https://data.gov.sg/api/action/datastore_search',
      status: 'degraded',
      latencyMs,
      message: `Returned HTTP status ${res.status}`,
    };
  } catch (err: any) {
    return {
      name: 'Data.gov.sg HDB Resale API',
      endpoint: 'https://data.gov.sg/api/action/datastore_search',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err.name === 'TimeoutError' ? 'Request timed out (>5000ms)' : err.message,
    };
  }
}

/**
 * Check Singapore Land Authority (SLA) OneMap API
 */
async function checkOneMapHealth(oneMapToken?: string | null): Promise<ServiceHealth> {
  const start = Date.now();
  const endpoint = 'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=ang%20mo%20kio&returnGeom=Y&getAddrDetails=N&pageNum=1';
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  const activeToken = 
    oneMapToken || 
    process.env.VITE_ONEMAP_TOKEN || 
    process.env.ONEMAP_API_TOKEN || 
    process.env.ONEMAP_TOKEN;

  if (activeToken) {
    headers['Authorization'] = activeToken;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;

    if (res.ok) {
      const data = await res.json() as any;
      const resultsCount = data?.results?.length ?? 0;
      return {
        name: 'Singapore OneMap SLA Spatial API',
        endpoint: 'https://www.onemap.gov.sg/api/common/elastic/search',
        status: latencyMs > 2500 ? 'degraded' : 'operational',
        latencyMs,
        message: `Responsive (${resultsCount} geocoding results returned)`,
        details: {
          httpStatus: res.status,
          tokenConfigured: Boolean(activeToken),
          tokenSource: activeToken ? (process.env.VITE_ONEMAP_TOKEN ? 'VITE_ONEMAP_TOKEN' : 'ONEMAP_API_TOKEN') : 'none',
        },
      };
    }

    return {
      name: 'Singapore OneMap SLA Spatial API',
      endpoint: 'https://www.onemap.gov.sg/api/common/elastic/search',
      status: 'degraded',
      latencyMs,
      message: `Returned HTTP status ${res.status}`,
      details: {
        tokenConfigured: Boolean(activeToken),
      },
    };
  } catch (err: any) {
    return {
      name: 'Singapore OneMap SLA Spatial API',
      endpoint: 'https://www.onemap.gov.sg/api/common/elastic/search',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err.name === 'TimeoutError' ? 'Request timed out (>5000ms)' : err.message,
    };
  }
}

/**
 * Check Google Gemini AI Engine Configuration
 */
function checkGeminiHealth(): ServiceHealth {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  return {
    name: 'Google Gemini AI Service',
    endpoint: 'https://generativelanguage.googleapis.com',
    status: hasKey ? 'operational' : 'operational',
    latencyMs: 0,
    message: hasKey ? 'Configured and ready' : 'Ready (Default API proxy)',
    details: {
      isApiKeyConfigured: hasKey,
    },
  };
}

/**
 * Comprehensive health check runner
 */
export async function performHealthCheck(oneMapToken?: string | null): Promise<ApiHealthResponse> {
  const [datagovsg, onemap] = await Promise.all([
    checkDataGovSgHealth(),
    checkOneMapHealth(oneMapToken),
  ]);

  const gemini = checkGeminiHealth();

  // Determine overall system health
  let status: 'operational' | 'degraded' | 'down' = 'operational';
  if (datagovsg.status === 'down' || onemap.status === 'down') {
    status = 'degraded';
  }
  if (datagovsg.status === 'down' && onemap.status === 'down') {
    status = 'down';
  }

  const memory = process.memoryUsage();

  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
    server: {
      nodeVersion: process.version,
      memoryUsageMb: {
        rss: Math.round(memory.rss / (1024 * 1024) * 100) / 100,
        heapTotal: Math.round(memory.heapTotal / (1024 * 1024) * 100) / 100,
        heapUsed: Math.round(memory.heapUsed / (1024 * 1024) * 100) / 100,
      },
      pid: process.pid,
    },
    services: {
      datagovsg,
      onemap,
      gemini,
    },
  };
}

/**
 * Express Handler for GET /api/health
 */
export async function handleHealthCheck(req: Request, res: Response): Promise<void> {
  try {
    const health = await performHealthCheck();
    const httpStatusCode = health.status === 'down' ? 503 : 200;
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(httpStatusCode).json(health);
  } catch (err: any) {
    res.status(500).json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: err.message || 'Internal health check failure',
    });
  }
}

/**
 * Light ping handler for GET /api/health/ping
 */
export function handlePing(_req: Request, res: Response): void {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
}
