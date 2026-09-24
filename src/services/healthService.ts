export interface ServiceHealthItem {
  name: string;
  endpoint: string;
  status: 'operational' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
  details?: Record<string, any>;
}

export interface ApiHealthStatus {
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
    datagovsg: ServiceHealthItem;
    onemap: ServiceHealthItem;
    gemini: ServiceHealthItem;
  };
}

export async function fetchApiHealth(): Promise<ApiHealthStatus> {
  const res = await fetch('/api/health', {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(6000),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`API health check returned HTTP ${res.status}: ${errorText.slice(0, 100)}`);
  }

  return await res.json();
}
