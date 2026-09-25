import React, { useEffect, useState } from 'react';
import { rateLimiter } from '../services/rateLimiter';
import { useTheme } from '../context/ThemeContext';
import { 
  Building2, 
  TrendingUp, 
  Compass, 
  Calculator, 
  MapPin, 
  ShieldCheck, 
  RefreshCw,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  totalRecords: number;
  isFetching: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalRecords,
  isFetching,
  onRefresh,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [limiterState, setLimiterState] = useState({
    activeCount: 0,
    queuedCount: 0,
    nextSlotInMs: 0,
  });

  useEffect(() => {
    return rateLimiter.subscribe(setLimiterState);
  }, []);

  const tabs = [
    { id: '01', label: 'Flat Explorer', icon: Building2, desc: 'Search & filter resale flats' },
    { id: '02', label: 'Price Trends', icon: TrendingUp, desc: 'Monthly charts & momentum' },
    { id: '03', label: 'What Budget Buys', icon: Compass, desc: 'Sqm vs remaining lease radar' },
    { id: '04', label: 'Lease & Mortgage', icon: Calculator, desc: 'Bala curve & CPF limits' },
    { id: '05', label: 'Map & Geocoder', icon: MapPin, desc: 'Interactive SG block map' },
    { id: '06', label: 'Ask Agent', icon: Sparkles, desc: 'Gemini + MCP Tools' },
  ];

  return (
    <header className={`border-b transition-colors duration-150 sticky top-0 z-40 backdrop-blur-md ${
      isDark 
        ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
        : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
    }`}>
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-900/20 text-white font-black text-xl tracking-tight shrink-0">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Kaki<span className="text-rose-500">Flats</span>
              </h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                isDark 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                SG Resale Radar
              </span>
              <span className={`hidden md:inline-flex text-[11px] items-center gap-1 font-mono px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                data.gov.sg live
              </span>
            </div>
            <p className={`text-xs hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Singapore HDB Resale Explorer • Trend Tracker • Floor Area × Lease Budget Compass
            </p>
          </div>
        </div>

        {/* Status Pills, Refresh & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition active:scale-95 shadow-xs ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Rate Limiter Safety Indicator */}
          <div 
            title="Compliant with data.gov.sg keyless policy (strictly <= 3 calls per 10s to prevent HTTP 429)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-mono ${
              isDark 
                ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline text-slate-400">Rate Gate:</span>
            <span className={limiterState.activeCount >= 3 ? 'text-amber-500 font-bold' : isDark ? 'text-emerald-300' : 'text-emerald-700 font-medium'}>
              {limiterState.activeCount}/3 calls
            </span>
            {limiterState.queuedCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 px-1 rounded text-[10px]">
                +{limiterState.queuedCount}
              </span>
            )}
          </div>

          {/* Dataset Count */}
          <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs ${
            isDark 
              ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalRecords.toLocaleString()}</span>
            <span className="text-slate-400">records</span>
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isFetching}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
            }`}
            title="Refresh latest HDB transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-rose-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isFetching ? 'Fetching...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t ${
        isDark ? 'border-slate-800/70' : 'border-slate-200'
      }`}>
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? isDark
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs'
                      : 'bg-rose-50 text-rose-600 border border-rose-200 shadow-xs'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isActive 
                    ? isDark ? 'bg-rose-500/30 text-rose-300' : 'bg-rose-100 text-rose-700' 
                    : isDark ? 'text-slate-500 bg-slate-800' : 'text-slate-400 bg-slate-200/60'
                }`}>
                  {tab.id}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-rose-500' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
