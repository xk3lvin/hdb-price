import React, { useState, useMemo } from 'react';
import { HdbRecord } from '../types/hdb';
import { ALL_HDB_TOWNS, ALL_FLAT_TYPES } from '../data/seedData';
import { useTheme } from '../context/ThemeContext';
import { 
  TrendingUp, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight
} from 'lucide-react';

interface Tab02TrendsProps {
  records: HdbRecord[];
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  selectedFlatType: string;
  setSelectedFlatType: (flatType: string) => void;
}

export const Tab02Trends: React.FC<Tab02TrendsProps> = ({
  records,
  selectedTown,
  setSelectedTown,
  selectedFlatType,
  setSelectedFlatType,
}) => {
  const { isDark } = useTheme();
  const [metricType, setMetricType] = useState<'price' | 'psm'>('price');
  const [hoveredPoint, setHoveredPoint] = useState<{
    month: string;
    median: number;
    avg: number;
    count: number;
    psm: number;
    x: number;
    y: number;
    min: number;
    max: number;
  } | null>(null);

  // Filter records based on selected town & flat type
  const activeRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedTown !== 'ALL' && r.town.toUpperCase() !== selectedTown.toUpperCase()) {
        return false;
      }
      if (selectedFlatType !== 'ALL' && r.flat_type.toUpperCase() !== selectedFlatType.toUpperCase()) {
        return false;
      }
      return true;
    });
  }, [records, selectedTown, selectedFlatType]);

  // Aggregate by month
  const monthlyData = useMemo(() => {
    const map = new Map<string, HdbRecord[]>();
    activeRecords.forEach(r => {
      if (!map.has(r.month)) {
        map.set(r.month, []);
      }
      map.get(r.month)!.push(r);
    });

    const months = Array.from(map.keys()).sort();
    return months.map(m => {
      const items = map.get(m)!;
      const prices = items.map(i => i.price_num).sort((a, b) => a - b);
      const psms = items.map(i => i.psm).sort((a, b) => a - b);

      const median = prices[Math.floor(prices.length / 2)];
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const avgPsm = Math.round(psms.reduce((a, b) => a + b, 0) / psms.length);

      return {
        month: m,
        count: items.length,
        median,
        avg,
        psm: avgPsm,
        min: prices[0],
        max: prices[prices.length - 1],
      };
    });
  }, [activeRecords]);

  // Overall Statistics & Momentum
  const stats = useMemo(() => {
    if (monthlyData.length < 2) {
      return { changePct: 0, highest: 0, lowest: 0, millionCount: 0 };
    }
    const firstVal = metricType === 'price' ? monthlyData[0].median : monthlyData[0].psm;
    const lastVal = metricType === 'price' ? monthlyData[monthlyData.length - 1].median : monthlyData[monthlyData.length - 1].psm;
    const changePct = Math.round(((lastVal - firstVal) / firstVal) * 1000) / 10;

    const allPrices = activeRecords.map(r => r.price_num);
    const highest = Math.max(...allPrices);
    const lowest = Math.min(...allPrices);
    const millionCount = activeRecords.filter(r => r.price_num >= 1000000).length;

    return { changePct, highest, lowest, millionCount };
  }, [monthlyData, metricType, activeRecords]);

  // SVG Chart Dimensions
  const chartWidth = 720;
  const chartHeight = 280;
  const padding = { top: 25, right: 30, bottom: 45, left: 65 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const { points, maxValue, minValue } = useMemo(() => {
    if (monthlyData.length === 0) {
      return { points: [], maxValue: 1000000, minValue: 0, maxVolume: 10 };
    }

    const values = monthlyData.map(d => (metricType === 'price' ? d.median : d.psm));
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const paddingVal = (rawMax - rawMin) * 0.15 || 50000;
    const minVal = Math.max(0, Math.floor((rawMin - paddingVal) / 10000) * 10000);
    const maxVal = Math.ceil((rawMax + paddingVal) / 10000) * 10000;
    const maxVol = Math.max(...monthlyData.map(d => d.count), 5);

    const pts = monthlyData.map((d, index) => {
      const x = padding.left + (monthlyData.length === 1 ? innerWidth / 2 : (index / (monthlyData.length - 1)) * innerWidth);
      const val = metricType === 'price' ? d.median : d.psm;
      const y = padding.top + innerHeight - ((val - minVal) / (maxVal - minVal || 1)) * innerHeight;
      const volHeight = (d.count / maxVol) * (innerHeight * 0.35);
      const volY = padding.top + innerHeight - volHeight;

      return {
        ...d,
        x,
        y,
        volHeight,
        volY,
      };
    });

    return { points: pts, maxValue: maxVal, minValue: minVal, maxVolume: maxVol };
  }, [monthlyData, metricType, innerWidth, innerHeight, padding]);

  // Generate SVG path for line and gradient area
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = padding.top + innerHeight;
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [points, pathD, padding, innerHeight]);

  return (
    <div className="space-y-6">
      {/* Top Controls & Town filter */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <TrendingUp className="w-5 h-5 text-rose-500" />
            Monthly Price Trend &amp; Transaction Velocity
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Historical transaction patterns registered with HDB from Jan 2017 to Sep 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Town filter */}
          <select
            value={selectedTown}
            onChange={e => setSelectedTown(e.target.value)}
            className={`text-xs rounded-xl px-3 py-2 border ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Singapore Towns</option>
            {ALL_HDB_TOWNS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Flat type filter */}
          <select
            value={selectedFlatType}
            onChange={e => setSelectedFlatType(e.target.value)}
            className={`text-xs rounded-xl px-3 py-2 border ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">All Flat Types</option>
            {ALL_FLAT_TYPES.map(ft => (
              <option key={ft} value={ft}>{ft}</option>
            ))}
          </select>

          {/* Metric Toggle */}
          <div className={`flex p-0.5 rounded-xl border text-xs ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              onClick={() => setMetricType('price')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                metricType === 'price'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Median Price ($)
            </button>
            <button
              onClick={() => setMetricType('psm')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                metricType === 'psm'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unit Price ($/sqm)
            </button>
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-xs text-slate-400">Trajectory Momentum</div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`text-xl sm:text-2xl font-black ${stats.changePct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats.changePct >= 0 ? `+${stats.changePct}%` : `${stats.changePct}%`}
            </div>
            {stats.changePct >= 0 ? (
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Overall period change</div>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-xs text-slate-400">Million-Dollar Transactions</div>
          <div className="text-xl sm:text-2xl font-black text-amber-500 mt-1">
            {stats.millionCount} <span className="text-xs font-normal text-slate-400">flats</span>
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>&ge; $1,000,000 price point</div>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-xs text-slate-400">Estate Peak Transacted</div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 mt-1">
            ${stats.highest.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Highest recorded resale price</div>
        </div>

        <div className={`p-4 rounded-xl border transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="text-xs text-slate-400">Most Accessible Entry</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-500 mt-1">
            ${stats.lowest.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Lowest recorded resale price</div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className={`p-5 rounded-2xl border shadow-md relative transition-colors ${
        isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {metricType === 'price' ? 'Median Resale Price ($)' : 'Average Unit Price ($/sqm)'}
            </span>
            <span className="text-slate-400">|</span>
            <span className={`w-3 h-3 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}></span>
            <span className="text-xs text-slate-400">Monthly Volume (bars)</span>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {monthlyData.length} monthly observations
          </span>
        </div>

        {monthlyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            No transaction trend data available for current selection.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[640px]">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = padding.top + innerHeight * (1 - ratio);
                  const val = Math.round(minValue + (maxValue - minValue) * ratio);
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke={isDark ? '#334155' : '#e2e8f0'}
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontSize="10"
                        textAnchor="end"
                        className="font-mono"
                      >
                        {metricType === 'price' ? `$${(val / 1000).toFixed(0)}k` : `$${val}`}
                      </text>
                    </g>
                  );
                })}

                {/* Volume Bars at Bottom */}
                {points.map((p, i) => (
                  <rect
                    key={`vol-${i}`}
                    x={p.x - 7}
                    y={p.volY}
                    width={14}
                    height={p.volHeight}
                    fill={isDark ? '#334155' : '#cbd5e1'}
                    opacity={isDark ? 0.6 : 0.8}
                    rx="2"
                  />
                ))}

                {/* Area under curve */}
                <path d={areaD} fill="url(#trendGradient)" />

                {/* Main Trend Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {points.map((p, i) => (
                  <g key={i} className="cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#f43f5e"
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth="2"
                      className="hover:r-6 transition-all duration-150"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Month Label below */}
                    {(points.length <= 10 || i % Math.ceil(points.length / 8) === 0 || i === points.length - 1) && (
                      <text
                        x={p.x}
                        y={chartHeight - 12}
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontSize="10"
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {p.month}
                      </text>
                    )}
                  </g>
                ))}

                {/* Active Hover Crosshair */}
                {hoveredPoint && (
                  <g>
                    <line
                      x1={hoveredPoint.x}
                      y1={padding.top}
                      x2={hoveredPoint.x}
                      y2={padding.top + innerHeight}
                      stroke="#f43f5e"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="7"
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div
            className={`absolute z-20 pointer-events-none p-3 rounded-xl border shadow-xl text-xs space-y-1 backdrop-blur-md ${
              isDark 
                ? 'bg-slate-900/95 border-slate-700 text-slate-100' 
                : 'bg-white/95 border-slate-200 text-slate-800'
            }`}
            style={{
              left: `${Math.min(chartWidth - 180, Math.max(20, (hoveredPoint.x / chartWidth) * 100))}%`,
              top: '20px',
            }}
          >
            <div className={`font-bold flex items-center justify-between gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>{hoveredPoint.month}</span>
              <span className="text-slate-400 font-normal">{hoveredPoint.count} transacted</span>
            </div>
            <div className="text-rose-500 font-bold text-sm">
              Median: ${hoveredPoint.median.toLocaleString()}
            </div>
            <div className="text-amber-500 font-medium">
              Avg Unit Price: ${hoveredPoint.psm.toLocaleString()}/sqm
            </div>
            <div className="text-slate-400 text-[11px]">
              Range: ${hoveredPoint.min.toLocaleString()} – ${hoveredPoint.max.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Town-by-Town Price League Table */}
      <div className={`p-5 rounded-2xl border shadow-md transition-colors ${
        isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <BarChart3 className="w-4 h-4 text-rose-500" />
          Town Pricing Comparison (Median Resale &amp; Value Density)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_HDB_TOWNS.slice(0, 9).map(town => {
            const townRecords = records.filter(r => r.town.toUpperCase() === town.toUpperCase());
            if (townRecords.length === 0) return null;
            const prices = townRecords.map(r => r.price_num).sort((a, b) => a - b);
            const median = prices[Math.floor(prices.length / 2)];
            const avgPsm = Math.round(townRecords.reduce((a, b) => a + b.psm, 0) / townRecords.length);

            return (
              <div
                key={town}
                onClick={() => setSelectedTown(town)}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  selectedTown === town
                    ? isDark
                      ? 'bg-rose-500/10 border-rose-500/40 shadow-xs'
                      : 'bg-rose-50 border-rose-300 shadow-xs'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{town}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{townRecords.length} sales</span>
                </div>
                <div className="text-base font-black text-rose-500 mt-1">
                  ${median.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ${avgPsm.toLocaleString()}/sqm (~${Math.round(avgPsm / 10.7639)} PSF)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
