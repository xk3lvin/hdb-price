import React, { useState } from 'react';
import { NearbyAmenity } from '../services/amenitiesService';
import { useTheme } from '../context/ThemeContext';
import { 
  GraduationCap, 
  Train, 
  ShoppingBag, 
  UtensilsCrossed, 
  Cross, 
  Trees, 
  Footprints, 
  MapPin, 
  Navigation, 
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
  Search
} from 'lucide-react';

interface NearbyAmenitiesPanelProps {
  amenities: NearbyAmenity[];
  selectedRadius: number; // in meters (e.g. 1000)
  onChangeRadius: (radiusMeters: number) => void;
  onSelectAmenityForRoute: (amenity: NearbyAmenity) => void;
  onFocusAmenityOnMap: (amenity: NearbyAmenity) => void;
  blockLabel?: string;
  isOpen: boolean;
  onToggleOpen: () => void;
}

type AmenityCategoryFilter = 'all' | 'school' | 'mrt' | 'shopping' | 'food' | 'health' | 'park';

export const NearbyAmenitiesPanel: React.FC<NearbyAmenitiesPanelProps> = ({
  amenities,
  selectedRadius,
  onChangeRadius,
  onSelectAmenityForRoute,
  onFocusAmenityOnMap,
  blockLabel,
  isOpen,
  onToggleOpen,
}) => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<AmenityCategoryFilter>('all');
  const [searchFilter, setSearchFilter] = useState('');

  // Primary Schools count for MOE P1 Priority callout
  const primarySchools = amenities.filter(
    a => a.category === 'school' && a.subCategory === 'primary_school' && a.distanceMeters <= 1000
  );

  // Filter items based on category and search query
  const filteredAmenities = amenities.filter(item => {
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q) ?? false;
      const matchTown = item.town?.toLowerCase().includes(q) ?? false;
      return matchName || matchDesc || matchTown;
    }
    return true;
  });

  // Count by category
  const counts = {
    all: amenities.length,
    school: amenities.filter(a => a.category === 'school').length,
    mrt: amenities.filter(a => a.category === 'mrt').length,
    shopping: amenities.filter(a => a.category === 'shopping').length,
    food: amenities.filter(a => a.category === 'food').length,
    health: amenities.filter(a => a.category === 'health').length,
    park: amenities.filter(a => a.category === 'park').length,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'school':
        return <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />;
      case 'mrt':
        return <Train className="w-3.5 h-3.5 text-emerald-400" />;
      case 'shopping':
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />;
      case 'food':
        return <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />;
      case 'health':
        return <Cross className="w-3.5 h-3.5 text-rose-400" />;
      case 'park':
        return <Trees className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'school':
        return isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'mrt':
        return isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'shopping':
        return isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'food':
        return isDark ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' : 'bg-orange-50 text-orange-700 border-orange-200';
      case 'health':
        return isDark ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200';
      case 'park':
        return isDark ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div 
      className={`rounded-2xl border transition-all duration-200 shadow-xl overflow-hidden ${
        isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
      }`}
    >
      {/* Top Accordion Bar */}
      <div 
        onClick={onToggleOpen}
        className={`p-4 flex items-center justify-between cursor-pointer select-none transition border-b ${
          isDark ? 'hover:bg-slate-800/60 border-slate-800' : 'hover:bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                1km Radius Schools &amp; Amenities
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-xs">
                {amenities.length} found
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {blockLabel ? `Around ${blockLabel}` : 'Select any HDB block on map to inspect amenities'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Radius Selector Pills */}
          <div 
            onClick={e => e.stopPropagation()} 
            className={`hidden sm:flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {[
              { label: '500m', value: 500 },
              { label: '1.0 km (P1)', value: 1000 },
              { label: '1.5 km', value: 1500 },
            ].map(r => (
              <button
                key={r.value}
                onClick={() => onChangeRadius(r.value)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                  selectedRadius === r.value
                    ? 'bg-rose-500 text-white shadow-xs font-bold'
                    : isDark 
                    ? 'text-slate-300 hover:text-white' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            className={`p-2 rounded-xl transition ${
              isDark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
          {/* MOE Primary 1 Priority Registration Callout */}
          {primarySchools.length > 0 && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isDark 
                ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200' 
                : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold flex items-center gap-1.5 text-indigo-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>MOE Primary 1 Registration Priority (&le; 1km Zone)</span>
                </div>
                <p className="mt-1 leading-relaxed opacity-90">
                  There {primarySchools.length === 1 ? 'is' : 'are'}{' '}
                  <strong className="underline font-bold text-indigo-300">{primarySchools.length} Primary {primarySchools.length === 1 ? 'School' : 'Schools'}</strong>{' '}
                  within 1km of this block. Children living within 1km receive highest priority balloting in MOE Phase 2B and 2C.
                </p>
              </div>
            </div>
          )}

          {/* Search & Category Filter Header */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search filter input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Filter amenities (e.g. MRT, School name, Sheng Siong, Hawker)..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className={`w-full text-xs rounded-xl pl-8 pr-3 py-2 border focus:ring-1 focus:ring-rose-500 focus:outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Mobile Radius Toggle */}
            <div className="flex sm:hidden items-center justify-between gap-1 text-xs">
              <span className="text-slate-400 text-[11px]">Radius:</span>
              <div className="flex gap-1">
                {[500, 1000, 1500].map(val => (
                  <button
                    key={val}
                    onClick={() => onChangeRadius(val)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                      selectedRadius === val 
                        ? 'bg-rose-500 text-white border-rose-500' 
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {val >= 1000 ? `${val / 1000}km` : `${val}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {[
              { id: 'all', label: 'All', icon: <MapPin className="w-3 h-3" />, count: counts.all },
              { id: 'school', label: 'Schools', icon: <GraduationCap className="w-3 h-3" />, count: counts.school },
              { id: 'mrt', label: 'MRT / LRT', icon: <Train className="w-3 h-3" />, count: counts.mrt },
              { id: 'shopping', label: 'Malls / Groceries', icon: <ShoppingBag className="w-3 h-3" />, count: counts.shopping },
              { id: 'food', label: 'Hawker Food', icon: <UtensilsCrossed className="w-3 h-3" />, count: counts.food },
              { id: 'health', label: 'Healthcare', icon: <Cross className="w-3 h-3" />, count: counts.health },
              { id: 'park', label: 'Parks', icon: <Trees className="w-3 h-3" />, count: counts.park },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as AmenityCategoryFilter)}
                className={`px-2.5 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer text-[11px] ${
                  activeCategory === cat.id
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeCategory === cat.id ? 'bg-white/25 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Amenities List */}
          {filteredAmenities.length === 0 ? (
            <div className={`p-8 rounded-xl border text-center text-xs ${
              isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
              <p className="font-semibold">No amenities found matching this filter within {selectedRadius >= 1000 ? `${selectedRadius/1000}km` : `${selectedRadius}m`}.</p>
              <p className="text-[11px] mt-1">Try expanding the radius to 1.5km or switching categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredAmenities.map(item => {
                const isPrimary = item.category === 'school' && item.subCategory === 'primary_school';

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition flex flex-col justify-between group ${
                      isDark 
                        ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60' 
                        : 'bg-slate-50 hover:bg-white border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${getCategoryBadgeClass(item.category)}`}>
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.name}
                            </h4>
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                              {item.description || item.town}
                            </div>
                          </div>
                        </div>

                        {/* Distance Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-rose-500">
                            {item.distanceMeters < 1000 ? `${item.distanceMeters}m` : `${item.distanceKm}km`}
                          </span>
                          <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                            <Footprints className="w-2.5 h-2.5" />
                            <span>~{item.walkTimeMins}m</span>
                          </div>
                        </div>
                      </div>

                      {/* MOE P1 Special Tag */}
                      {isPrimary && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md w-fit">
                          <Award className="w-3 h-3 shrink-0" />
                          <span>MOE P1 Priority (&le; 1km)</span>
                        </div>
                      )}

                      {/* Transit Line Badges */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1">
                          {item.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions: Route Here & Locate on Map */}
                    <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => onFocusAmenityOnMap(item)}
                        className={`inline-flex items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Locate</span>
                      </button>

                      <button
                        onClick={() => onSelectAmenityForRoute(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white font-bold transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Route Here</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
