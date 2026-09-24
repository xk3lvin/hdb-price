import React, { useState, useMemo } from 'react';
import { HdbRecord } from '../types/hdb';
import { ALL_HDB_TOWNS, ALL_FLAT_TYPES } from '../data/seedData';
import { useTheme } from '../context/ThemeContext';
import { 
  Search, 
  ArrowUpDown, 
  MapPin, 
  Clock, 
  Building, 
  ChevronLeft, 
  ChevronRight,
  Layers
} from 'lucide-react';

interface Tab01ExplorerProps {
  records: HdbRecord[];
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  selectedFlatType: string;
  setSelectedFlatType: (flatType: string) => void;
  onSelectRecord: (record: HdbRecord) => void;
  onViewOnMap: (record: HdbRecord) => void;
}

export const Tab01Explorer: React.FC<Tab01ExplorerProps> = ({
  records,
  selectedTown,
  setSelectedTown,
  selectedFlatType,
  setSelectedFlatType,
  onSelectRecord,
  onViewOnMap,
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(2000000);
  const [sortBy, setSortBy] = useState<'month_desc' | 'price_asc' | 'price_desc' | 'psm_asc' | 'psm_desc' | 'lease_desc' | 'area_desc'>('month_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Filter records
  const filtered = useMemo(() => {
    return records.filter(r => {
      // Town filter
      if (selectedTown !== 'ALL' && r.town.toUpperCase() !== selectedTown.toUpperCase()) {
        return false;
      }
      // Flat type filter
      if (selectedFlatType !== 'ALL' && r.flat_type.toUpperCase() !== selectedFlatType.toUpperCase()) {
        return false;
      }
      // Price range
      if (r.price_num < minPrice || r.price_num > maxPrice) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          r.street_name.toLowerCase().includes(q) ||
          r.block.toLowerCase().includes(q) ||
          r.town.toLowerCase().includes(q) ||
          r.flat_model.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [records, selectedTown, selectedFlatType, minPrice, maxPrice, searchQuery]);

  // Sort records
  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case 'month_desc':
        return list.sort((a, b) => b.month.localeCompare(a.month) || b.price_num - a.price_num);
      case 'price_asc':
        return list.sort((a, b) => a.price_num - b.price_num);
      case 'price_desc':
        return list.sort((a, b) => b.price_num - a.price_num);
      case 'psm_asc':
        return list.sort((a, b) => a.psm - b.psm);
      case 'psm_desc':
        return list.sort((a, b) => b.psm - a.psm);
      case 'lease_desc':
        return list.sort((a, b) => b.remaining_lease_years - a.remaining_lease_years);
      case 'area_desc':
        return list.sort((a, b) => b.floor_area_num - a.floor_area_num);
      default:
        return list;
    }
  }, [filtered, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  // Summary Metrics
  const metrics = useMemo(() => {
    if (filtered.length === 0) {
      return { medianPrice: 0, avgPsm: 0, min: 0, max: 0, avgLease: 0 };
    }
    const prices = filtered.map(r => r.price_num).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const sumPsm = filtered.reduce((acc, r) => acc + r.psm, 0);
    const sumLease = filtered.reduce((acc, r) => acc + r.remaining_lease_years, 0);

    return {
      medianPrice: median,
      avgPsm: Math.round(sumPsm / filtered.length),
      min: prices[0],
      max: prices[prices.length - 1],
      avgLease: Math.round((sumLease / filtered.length) * 10) / 10,
    };
  }, [filtered]);

  const getFlatTypeBadge = (type: string) => {
    if (type.includes('2')) return isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200';
    if (type.includes('3')) return isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (type.includes('4')) return isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';
    if (type.includes('5')) return isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
    return isDark ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="space-y-6">
      {/* Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs font-medium text-slate-400">Total Matching Flats</div>
          <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {filtered.length.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            {selectedTown === 'ALL' ? 'Across all 26 towns' : `In ${selectedTown}`}
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs font-medium text-slate-400">Median Resale Price</div>
          <div className="text-2xl font-black text-rose-500 mt-1">
            ${metrics.medianPrice.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Range: ${metrics.min.toLocaleString()} – ${metrics.max.toLocaleString()}
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs font-medium text-slate-400">Average Unit Price</div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            ${metrics.avgPsm.toLocaleString()}
            <span className="text-xs font-normal text-slate-400">/sqm</span>
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            ~${Math.round(metrics.avgPsm / 10.7639)} / sq ft (PSF)
          </div>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
          isDark ? 'bg-slate-850/80 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-xs font-medium text-slate-400">Avg Remaining Lease</div>
          <div className="text-2xl font-black text-emerald-500 mt-1">
            {metrics.avgLease} <span className="text-xs font-normal text-slate-400">years</span>
          </div>
          <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Out of original 99-year lease
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
        isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Town Selector */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Town / Estate
            </label>
            <select
              value={selectedTown}
              onChange={e => {
                setSelectedTown(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full text-xs sm:text-sm rounded-xl px-3 py-2 border focus:ring-2 focus:ring-rose-500 ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-200' 
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="ALL">All Singapore Towns (26)</option>
              {ALL_HDB_TOWNS.map(town => (
                <option key={town} value={town}>
                  {town}
                </option>
              ))}
            </select>
          </div>

          {/* Flat Type Selector */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Layers className="w-3.5 h-3.5 text-blue-500" /> Flat Type
            </label>
            <select
              value={selectedFlatType}
              onChange={e => {
                setSelectedFlatType(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full text-xs sm:text-sm rounded-xl px-3 py-2 border focus:ring-2 focus:ring-rose-500 ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-200' 
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="ALL">All Flat Types</option>
              {ALL_FLAT_TYPES.map(ft => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query (Street/Block) */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Search className="w-3.5 h-3.5 text-slate-400" /> Street / Block / Model
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Tampines St 42, Blk 458"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full text-xs sm:text-sm rounded-xl pl-8 pr-3 py-2 border focus:ring-2 focus:ring-rose-500 ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort Order
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`w-full text-xs sm:text-sm rounded-xl px-3 py-2 border focus:ring-2 focus:ring-rose-500 ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-200' 
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="month_desc">Transaction Date (Latest first)</option>
              <option value="price_asc">Price (Lowest first)</option>
              <option value="price_desc">Price (Highest first)</option>
              <option value="psm_asc">Price per sqm (Lowest $/sqm)</option>
              <option value="psm_desc">Price per sqm (Highest $/sqm)</option>
              <option value="lease_desc">Remaining Lease (Longest first)</option>
              <option value="area_desc">Floor Area (Largest first)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Town Chips */}
        <div className={`flex items-center gap-1.5 overflow-x-auto pt-2 border-t text-xs no-scrollbar ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <span className={`whitespace-nowrap font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Quick Estates:</span>
          {['TAMPINES', 'ANG MO KIO', 'BISHAN', 'PUNGGOL', 'QUEENSTOWN', 'BEDOK', 'WOODLANDS'].map(town => (
            <button
              key={town}
              onClick={() => {
                setSelectedTown(selectedTown === town ? 'ALL' : town);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap border ${
                selectedTown === town
                  ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
            >
              {town}
            </button>
          ))}
          {selectedTown !== 'ALL' && (
            <button
              onClick={() => {
                setSelectedTown('ALL');
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg text-rose-500 hover:text-rose-600 font-medium underline whitespace-nowrap"
            >
              Reset Town
            </button>
          )}
        </div>
      </div>

      {/* Transactions Grid */}
      {paginated.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-slate-850/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <Building className="w-12 h-12 mx-auto mb-3 text-slate-400" />
          <p className={`font-semibold text-lg ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No HDB resale records matched your filters</p>
          <p className="text-xs mt-1 max-w-sm mx-auto text-slate-400">
            Try adjusting your search keywords, broadening the town selection, or resetting the flat type filter.
          </p>
          <button
            onClick={() => {
              setSelectedTown('ALL');
              setSelectedFlatType('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(record => {
            const floorAreaSqft = Math.round(record.floor_area_num * 10.7639);
            return (
              <div
                key={record._id}
                className={`p-4 rounded-2xl border transition shadow-xs hover:shadow-md flex flex-col justify-between group ${
                  isDark 
                    ? 'bg-slate-850 border-slate-800 hover:border-slate-700' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getFlatTypeBadge(record.flat_type)}`}>
                          {record.flat_type}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {record.month}
                        </span>
                      </div>
                      <h3 className={`font-bold text-base mt-1.5 line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Blk {record.block} {record.street_name}
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{record.town}</span>
                        <span className="text-slate-400">•</span>
                        <span>{record.storey_range} Flr</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onViewOnMap(record)}
                      title="View on Map"
                      className={`p-2 rounded-xl transition ${
                        isDark 
                          ? 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700' 
                          : 'bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Pricing and specs */}
                  <div className={`mt-4 pt-3 border-t flex items-baseline justify-between ${
                    isDark ? 'border-slate-800/80' : 'border-slate-100'
                  }`}>
                    <div>
                      <div className="text-xl font-black text-rose-500">
                        ${record.price_num.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-amber-500 font-mono">
                        ${record.psm.toLocaleString()}/sqm (${record.psf} PSF)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {record.floor_area_num} sqm
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ~{floorAreaSqft} sqft
                      </div>
                    </div>
                  </div>

                  {/* Lease bar */}
                  <div className={`mt-3 text-xs p-2 rounded-lg border ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" /> Remaining
                      </span>
                      <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{record.remaining_lease}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className={`mt-4 pt-3 border-t flex items-center justify-between ${
                  isDark ? 'border-slate-800/70' : 'border-slate-100'
                }`}>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Model: {record.flat_model}
                  </span>
                  <button
                    onClick={() => onSelectRecord(record)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                  >
                    <span>Mortgage &amp; Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between pt-2 border-t ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="text-xs text-slate-400">
            Showing <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.min(currentPage * pageSize, sorted.length)}</span> of{' '}
            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{sorted.length}</span> flats
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border disabled:opacity-40 disabled:cursor-not-allowed transition ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`text-xs font-mono px-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border disabled:opacity-40 disabled:cursor-not-allowed transition ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' 
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
