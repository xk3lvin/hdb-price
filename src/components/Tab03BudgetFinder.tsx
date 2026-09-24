import React, { useState, useMemo } from 'react';
import { HdbRecord } from '../types/hdb';
import { useTheme } from '../context/ThemeContext';
import { 
  Compass, 
  DollarSign, 
  Maximize2, 
  Clock, 
  Sparkles, 
  Info
} from 'lucide-react';

interface Tab03BudgetFinderProps {
  records: HdbRecord[];
  onSelectRecord: (record: HdbRecord) => void;
  onViewOnMap: (record: HdbRecord) => void;
}

export const Tab03BudgetFinder: React.FC<Tab03BudgetFinderProps> = ({
  records,
  onSelectRecord,
  onViewOnMap,
}) => {
  const { isDark } = useTheme();

  // Budget controls
  const [budget, setBudget] = useState<number>(650000);
  const [minRemainingLease, setMinRemainingLease] = useState<number>(55);
  const [minFloorArea, setMinFloorArea] = useState<number>(65);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['3 ROOM', '4 ROOM', '5 ROOM']);
  const [hoveredFlat, setHoveredFlat] = useState<HdbRecord | null>(null);

  // Filter flats matching budget and criteria
  const matchingFlats = useMemo(() => {
    return records.filter(r => {
      if (r.price_num > budget) return false;
      if (r.remaining_lease_years < minRemainingLease) return false;
      if (r.floor_area_num < minFloorArea) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(r.flat_type)) return false;
      return true;
    });
  }, [records, budget, minRemainingLease, minFloorArea, selectedTypes]);

  // Financing estimation for current budget
  const financing = useMemo(() => {
    const loanAmount = budget * 0.8;
    const downpayment = budget * 0.2;
    const r = 0.026 / 12;
    const n = 25 * 12;
    const monthlyMortgage = Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    const minIncome = Math.round(monthlyMortgage / 0.3);

    return { loanAmount, downpayment, monthlyMortgage, minIncome };
  }, [budget]);

  // Scatter plot geometry
  const plotWidth = 720;
  const plotHeight = 360;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const innerWidth = plotWidth - padding.left - padding.right;
  const innerHeight = plotHeight - padding.top - padding.bottom;

  const minLeaseAxis = 40;
  const maxLeaseAxis = 99;
  const minAreaAxis = 40;
  const maxAreaAxis = 160;

  const mappedPoints = useMemo(() => {
    return matchingFlats.map(f => {
      const leaseClamped = Math.min(maxLeaseAxis, Math.max(minLeaseAxis, f.remaining_lease_years));
      const areaClamped = Math.min(maxAreaAxis, Math.max(minAreaAxis, f.floor_area_num));

      const x = padding.left + ((leaseClamped - minLeaseAxis) / (maxLeaseAxis - minLeaseAxis)) * innerWidth;
      const y = padding.top + innerHeight - ((areaClamped - minAreaAxis) / (maxAreaAxis - minAreaAxis)) * innerHeight;

      const rRatio = Math.max(0.3, Math.min(1, f.price_num / budget));
      const radius = 4 + rRatio * 6;

      return {
        record: f,
        x,
        y,
        radius,
      };
    });
  }, [matchingFlats, budget, innerWidth, innerHeight, padding]);

  // Quadrant dividing thresholds
  const midLease = 70;
  const midArea = 90;
  const midX = padding.left + ((midLease - minLeaseAxis) / (maxLeaseAxis - minLeaseAxis)) * innerWidth;
  const midY = padding.top + innerHeight - ((midArea - minAreaAxis) / (maxAreaAxis - minAreaAxis)) * innerHeight;

  // Best Value Picks
  const valuePicks = useMemo(() => {
    if (matchingFlats.length === 0) return { sweetSpot: null, biggestSpace: null, longestLease: null };

    const sortedBySpace = [...matchingFlats].sort((a, b) => b.floor_area_num - a.floor_area_num || a.price_num - b.price_num);
    const sortedByLease = [...matchingFlats].sort((a, b) => b.remaining_lease_years - a.remaining_lease_years || a.price_num - b.price_num);
    
    // Composite score: area * remaining_lease / price
    const sortedByScore = [...matchingFlats].sort((a, b) => {
      const scoreA = (a.floor_area_num * a.remaining_lease_years) / (a.price_num || 1);
      const scoreB = (b.floor_area_num * b.remaining_lease_years) / (b.price_num || 1);
      return scoreB - scoreA;
    });

    return {
      sweetSpot: sortedByScore[0] || null,
      biggestSpace: sortedBySpace[0] || null,
      longestLease: sortedByLease[0] || null,
    };
  }, [matchingFlats]);

  const toggleFlatType = (type: string) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(t => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Introduction */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Compass className="w-5 h-5 text-rose-500" />
            &ldquo;What Does My Budget Buy?&rdquo; Compass
          </h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Joining Floor Area (sqm) and Remaining Lease into a 2D trade-off radar for savvy home-seekers
          </p>
        </div>

        {/* Quick KPI count */}
        <div className={`px-4 py-2 rounded-xl border text-right ${
          isDark ? 'bg-slate-900 border-slate-700/80' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400">Available Within Budget</div>
          <div className="text-xl font-black text-rose-500">
            {matchingFlats.length} <span className={`text-xs font-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>options</span>
          </div>
        </div>
      </div>

      {/* Control Panel: Budget & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget & Financing Box */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <DollarSign className="w-3.5 h-3.5 text-rose-500" /> Maximum Budget
              </label>
              <span className="text-xl font-black text-rose-500 font-mono">
                ${budget.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="300000"
              max="1400000"
              step="25000"
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>$300k</span>
              <span>$650k</span>
              <span>$1.0M</span>
              <span>$1.4M</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[450000, 600000, 750000, 950000, 1150000].map(val => (
              <button
                key={val}
                onClick={() => setBudget(val)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  budget === val
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
              >
                ${val / 1000}k
              </button>
            ))}
          </div>

          {/* Financing metrics */}
          <div className={`pt-3 border-t space-y-2 text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex justify-between">
              <span className="text-slate-400">Est. 20% Downpayment:</span>
              <span className={`font-semibold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>${financing.downpayment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Est. Monthly Mortgage (2.6% HDB):</span>
              <span className="font-bold text-emerald-500 font-mono">~${financing.monthlyMortgage.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Min. Gross Household Income (30% MSR):</span>
              <span className="font-semibold text-amber-500 font-mono">~${financing.minIncome.toLocaleString()}/mo</span>
            </div>
          </div>
        </div>

        {/* Floor Area & Lease Filters */}
        <div className={`p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Min Floor Area */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Maximize2 className="w-3.5 h-3.5 text-blue-500" /> Minimum Floor Area
              </label>
              <span className="text-base font-bold text-blue-500 font-mono">
                {minFloorArea} sqm <span className="text-xs font-normal text-slate-400">({Math.round(minFloorArea * 10.7639)} sqft)</span>
              </span>
            </div>
            <input
              type="range"
              min="40"
              max="130"
              step="5"
              value={minFloorArea}
              onChange={e => setMinFloorArea(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>40 sqm (2-Rm)</span>
              <span>65 sqm (3-Rm)</span>
              <span>90 sqm (4-Rm)</span>
              <span>110+ sqm</span>
            </div>
          </div>

          {/* Min Remaining Lease */}
          <div className={`pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex justify-between items-baseline mb-1">
              <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Clock className="w-3.5 h-3.5 text-emerald-500" /> Min. Remaining Lease
              </label>
              <span className="text-base font-bold text-emerald-500 font-mono">
                {minRemainingLease} years
              </span>
            </div>
            <input
              type="range"
              min="45"
              max="90"
              step="5"
              value={minRemainingLease}
              onChange={e => setMinRemainingLease(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>45 yrs</span>
              <span className="text-amber-500">60 yrs (CPF Full)</span>
              <span>75 yrs</span>
              <span>90+ yrs</span>
            </div>
          </div>
        </div>

        {/* Flat Type Filter & CPF Notice */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-colors ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Included Flat Types
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'].map(type => {
                const active = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFlatType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                      active
                        ? isDark
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                          : 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                        : isDark
                        ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-xl border text-[11px] space-y-1 ${
            isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className={`font-semibold flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <Info className="w-3.5 h-3.5 text-blue-500" /> CPF Lease Safeguard:
            </div>
            <p>
              Flats with &ge; 60 years remaining lease allow full CPF usage and maximum HDB loan eligibility up to age 95.
            </p>
          </div>
        </div>
      </div>

      {/* 2D Quadrant Matrix / Scatter Plot */}
      <div className={`p-5 rounded-2xl border shadow-lg relative transition-colors ${
        isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              Floor Area vs. Remaining Lease Trade-Off Quadrant
            </h3>
            <p className="text-xs text-slate-400">
              Each point represents a flat transacted at or below ${budget.toLocaleString()}. Larger bubbles represent higher price.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>&ge; 70 yrs lease</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>&lt; 70 yrs lease</span>
            </div>
          </div>
        </div>

        {/* SVG Scatter Plot */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[680px]">
            <svg
              viewBox={`0 0 ${plotWidth} ${plotHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Quadrant Background Tints */}
              <rect
                x={midX}
                y={padding.top}
                width={plotWidth - padding.right - midX}
                height={midY - padding.top}
                fill="#10b981"
                opacity={isDark ? 0.05 : 0.08}
                rx="4"
              />
              <text
                x={plotWidth - padding.right - 10}
                y={padding.top + 20}
                fill="#10b981"
                fontSize="11"
                fontWeight="bold"
                textAnchor="end"
              >
                ★ SWEET SPOT: Spacious &amp; Long Lease
              </text>

              <rect
                x={padding.left}
                y={padding.top}
                width={midX - padding.left}
                height={midY - padding.top}
                fill="#3b82f6"
                opacity={isDark ? 0.04 : 0.07}
                rx="4"
              />
              <text
                x={padding.left + 10}
                y={padding.top + 20}
                fill={isDark ? '#60a5fa' : '#2563eb'}
                fontSize="11"
                fontWeight="bold"
              >
                SPACIOUS VINTAGE (Big Area, Mature Lease)
              </text>

              <rect
                x={midX}
                y={midY}
                width={plotWidth - padding.right - midX}
                height={padding.top + innerHeight - midY}
                fill="#8b5cf6"
                opacity={isDark ? 0.04 : 0.07}
                rx="4"
              />
              <text
                x={plotWidth - padding.right - 10}
                y={padding.top + innerHeight - 15}
                fill={isDark ? '#a78bfa' : '#7c3aed'}
                fontSize="11"
                fontWeight="bold"
                textAnchor="end"
              >
                MODERN COMPACT (Newer BTO, Efficient Sqm)
              </text>

              <rect
                x={padding.left}
                y={midY}
                width={midX - padding.left}
                height={padding.top + innerHeight - midY}
                fill="#f59e0b"
                opacity={isDark ? 0.03 : 0.06}
                rx="4"
              />
              <text
                x={padding.left + 10}
                y={padding.top + innerHeight - 15}
                fill={isDark ? '#fbbf24' : '#d97706'}
                fontSize="11"
                fontWeight="bold"
              >
                BUDGET STARTER (Low Cash Outlay)
              </text>

              {/* Dividing crosshair lines */}
              <line
                x1={midX}
                y1={padding.top}
                x2={midX}
                y2={padding.top + innerHeight}
                stroke={isDark ? '#475569' : '#cbd5e1'}
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <line
                x1={padding.left}
                y1={midY}
                x2={plotWidth - padding.right}
                y2={midY}
                stroke={isDark ? '#475569' : '#cbd5e1'}
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />

              {/* Y-Axis Grid & Labels (Floor Area) */}
              {[40, 70, 90, 110, 130, 150].map(area => {
                const y = padding.top + innerHeight - ((area - minAreaAxis) / (maxAreaAxis - minAreaAxis)) * innerHeight;
                return (
                  <g key={area}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={plotWidth - padding.right}
                      y2={y}
                      stroke={isDark ? '#334155' : '#e2e8f0'}
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      fill={isDark ? '#94a3b8' : '#64748b'}
                      fontSize="10"
                      textAnchor="end"
                      className="font-mono"
                    >
                      {area} sqm
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Grid & Labels (Remaining Lease) */}
              {[45, 55, 65, 75, 85, 95].map(lease => {
                const x = padding.left + ((lease - minLeaseAxis) / (maxLeaseAxis - minLeaseAxis)) * innerWidth;
                return (
                  <g key={lease}>
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={padding.top + innerHeight}
                      stroke={isDark ? '#334155' : '#e2e8f0'}
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={plotHeight - 18}
                      fill={isDark ? '#94a3b8' : '#64748b'}
                      fontSize="10"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {lease} yrs
                    </text>
                  </g>
                );
              })}

              {/* Axis Titles */}
              <text
                x={padding.left + innerWidth / 2}
                y={plotHeight - 2}
                fill={isDark ? '#cbd5e1' : '#475569'}
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                Remaining Lease (Years) →
              </text>
              <text
                x={-padding.top - innerHeight / 2}
                y={15}
                fill={isDark ? '#cbd5e1' : '#475569'}
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                transform="rotate(-90)"
              >
                Floor Area (sqm) →
              </text>

              {/* Render Scatter Points */}
              {mappedPoints.map(p => {
                const isHovered = hoveredFlat?._id === p.record._id;
                const isLongLease = p.record.remaining_lease_years >= 70;
                const fillColor = isLongLease ? '#10b981' : '#f59e0b';

                return (
                  <circle
                    key={p.record._id}
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? p.radius + 3 : p.radius}
                    fill={fillColor}
                    stroke={isHovered ? '#ffffff' : isDark ? '#0f172a' : '#ffffff'}
                    strokeWidth={isHovered ? 2.5 : 1}
                    opacity={isHovered ? 1 : 0.85}
                    className="cursor-pointer transition-all duration-100"
                    onMouseEnter={() => setHoveredFlat(p.record)}
                    onMouseLeave={() => setHoveredFlat(null)}
                    onClick={() => onSelectRecord(p.record)}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Hover Flat Preview Float */}
        {hoveredFlat && (
          <div className={`absolute top-5 right-5 z-20 p-3.5 rounded-xl border shadow-2xl text-xs space-y-1.5 backdrop-blur-md max-w-xs animate-in fade-in duration-150 ${
            isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Blk {hoveredFlat.block} {hoveredFlat.street_name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-500 font-bold">
                {hoveredFlat.flat_type}
              </span>
            </div>
            <div className="text-rose-500 font-extrabold text-base">
              ${hoveredFlat.price_num.toLocaleString()}
            </div>
            <div className={`grid grid-cols-2 gap-2 pt-1 border-t ${isDark ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-200'}`}>
              <div>
                <span className="text-slate-400">Area:</span> {hoveredFlat.floor_area_num} sqm
              </div>
              <div>
                <span className="text-slate-400">Lease:</span> {hoveredFlat.remaining_lease_years} yrs
              </div>
            </div>
            <div className="text-amber-500 font-mono text-[11px]">
              ${hoveredFlat.psm.toLocaleString()}/sqm (~${hoveredFlat.psf} PSF)
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 text-right">
              Click to view mortgage details &amp; map pin
            </div>
          </div>
        )}
      </div>

      {/* Top 3 "Bang for Buck" Recommendations */}
      <div>
        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Sparkles className="w-4 h-4 text-amber-500" />
          Optimal Budget Allocations (Under ${budget.toLocaleString()})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. The Sweet Spot */}
          {valuePicks.sweetSpot && (
            <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
              isDark 
                ? 'bg-gradient-to-br from-emerald-950/40 via-slate-850 to-slate-850 border-emerald-500/30' 
                : 'bg-gradient-to-br from-emerald-50 via-white to-white border-emerald-200'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                    ★ Sweet Spot Pick
                  </span>
                  <span className="text-xs text-slate-400">{valuePicks.sweetSpot.town}</span>
                </div>
                <h4 className={`font-bold text-sm mt-2 line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Blk {valuePicks.sweetSpot.block} {valuePicks.sweetSpot.street_name}
                </h4>
                <div className="text-lg font-black text-emerald-500 mt-1">
                  ${valuePicks.sweetSpot.price_num.toLocaleString()}
                </div>
                <div className={`text-xs mt-2 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <div>Floor Area: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{valuePicks.sweetSpot.floor_area_num} sqm</span></div>
                  <div>Remaining Lease: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{valuePicks.sweetSpot.remaining_lease}</span></div>
                  <div className="text-amber-500 font-mono">${valuePicks.sweetSpot.psm.toLocaleString()}/sqm</div>
                </div>
              </div>
              <button
                onClick={() => onSelectRecord(valuePicks.sweetSpot!)}
                className="mt-4 w-full py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition border border-emerald-500/40 cursor-pointer"
              >
                Inspect Flat
              </button>
            </div>
          )}

          {/* 2. Maximum Space */}
          {valuePicks.biggestSpace && (
            <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
              isDark 
                ? 'bg-gradient-to-br from-blue-950/40 via-slate-850 to-slate-850 border-blue-500/30' 
                : 'bg-gradient-to-br from-blue-50 via-white to-white border-blue-200'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 border border-blue-500/30">
                    Max Living Area
                  </span>
                  <span className="text-xs text-slate-400">{valuePicks.biggestSpace.town}</span>
                </div>
                <h4 className={`font-bold text-sm mt-2 line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Blk {valuePicks.biggestSpace.block} {valuePicks.biggestSpace.street_name}
                </h4>
                <div className="text-lg font-black text-blue-500 mt-1">
                  ${valuePicks.biggestSpace.price_num.toLocaleString()}
                </div>
                <div className={`text-xs mt-2 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <div>Floor Area: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{valuePicks.biggestSpace.floor_area_num} sqm</span> (~{Math.round(valuePicks.biggestSpace.floor_area_num * 10.7639)} sqft)</div>
                  <div>Remaining Lease: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{valuePicks.biggestSpace.remaining_lease}</span></div>
                  <div className="text-amber-500 font-mono">${valuePicks.biggestSpace.psm.toLocaleString()}/sqm</div>
                </div>
              </div>
              <button
                onClick={() => onSelectRecord(valuePicks.biggestSpace!)}
                className="mt-4 w-full py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 text-xs font-semibold transition border border-blue-500/40 cursor-pointer"
              >
                Inspect Flat
              </button>
            </div>
          )}

          {/* 3. Longest Lease */}
          {valuePicks.longestLease && (
            <div className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between ${
              isDark 
                ? 'bg-gradient-to-br from-purple-950/40 via-slate-850 to-slate-850 border-purple-500/30' 
                : 'bg-gradient-to-br from-purple-50 via-white to-white border-purple-200'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 border border-purple-500/30">
                    Maximum Lease Longevity
                  </span>
                  <span className="text-xs text-slate-400">{valuePicks.longestLease.town}</span>
                </div>
                <h4 className={`font-bold text-sm mt-2 line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Blk {valuePicks.longestLease.block} {valuePicks.longestLease.street_name}
                </h4>
                <div className="text-lg font-black text-purple-500 mt-1">
                  ${valuePicks.longestLease.price_num.toLocaleString()}
                </div>
                <div className={`text-xs mt-2 space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <div>Remaining Lease: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{valuePicks.longestLease.remaining_lease}</span></div>
                  <div>Floor Area: <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{valuePicks.longestLease.floor_area_num} sqm</span></div>
                  <div className="text-amber-500 font-mono">${valuePicks.longestLease.psm.toLocaleString()}/sqm</div>
                </div>
              </div>
              <button
                onClick={() => onSelectRecord(valuePicks.longestLease!)}
                className="mt-4 w-full py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 text-xs font-semibold transition border border-purple-500/40 cursor-pointer"
              >
                Inspect Flat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
