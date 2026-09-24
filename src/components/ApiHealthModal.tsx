import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { fetchApiHealth, ApiHealthStatus } from '../services/healthService';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Server, 
  MapPin, 
  Database, 
  Sparkles,
  Cpu
} from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [healthData, setHealthData] = useState<ApiHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchApiHealth();
      setHealthData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to API health check endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatUptime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getStatusBadge = (status?: 'operational' | 'degraded' | 'down') => {
    if (status === 'operational') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Operational
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Degraded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5" />
        Offline
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`max-w-2xl w-full rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  System &amp; API Health Status
                </h3>
                {healthData && getStatusBadge(healthData.status)}
              </div>
              <p className="text-xs text-slate-400">
                Endpoint: <code className="font-mono text-[11px] text-rose-400">/api/health</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadHealth}
              disabled={isLoading}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs'
              }`}
              title="Refresh API Health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-500' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100'
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && !healthData && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
              <span>Pinging live API endpoints...</span>
            </div>
          )}

          {healthData && (
            <>
              {/* Service Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  External Integrated Services
                </h4>

                {/* Data.gov.sg */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Data.gov.sg HDB API</span>
                        {getStatusBadge(healthData.services.datagovsg.status)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {healthData.services.datagovsg.message}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        {healthData.services.datagovsg.endpoint}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {healthData.services.datagovsg.latencyMs} ms
                    </div>
                    <div className="text-[10px] text-slate-400">Round-trip latency</div>
                  </div>
                </div>

                {/* OneMap SLA */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Singapore OneMap SLA Spatial API</span>
                        {getStatusBadge(healthData.services.onemap.status)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {healthData.services.onemap.message}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1">
                        {healthData.services.onemap.endpoint}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      {healthData.services.onemap.latencyMs} ms
                    </div>
                    <div className="text-[10px] text-slate-400">Round-trip latency</div>
                  </div>
                </div>

                {/* Gemini AI */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-800/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Google Gemini AI Engine</span>
                        {getStatusBadge(healthData.services.gemini.status)}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {healthData.services.gemini.message}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      SDK Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Server Runtime Stats */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  Application Server Runtime
                </h4>

                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border ${
                  isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="text-[10px] text-slate-400">Uptime</div>
                    <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
                      {formatUptime(healthData.uptimeSeconds)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Memory (Heap)</div>
                    <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                      {healthData.server.memoryUsageMb.heapUsed} MB
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Node Engine</div>
                    <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">
                      {healthData.server.nodeVersion}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Environment</div>
                    <div className="text-xs font-bold font-mono text-slate-200 mt-0.5 capitalize">
                      {healthData.environment}
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON View Link */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Last updated: {new Date(healthData.timestamp).toLocaleTimeString()}</span>
                <a
                  href="/api/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-400 font-semibold transition"
                >
                  <span>Inspect Raw JSON</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
