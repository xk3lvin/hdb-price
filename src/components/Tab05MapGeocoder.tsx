import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { HdbRecord } from '../types/hdb';
import { useTheme } from '../context/ThemeContext';
import { 
  geocodeHdbBlock, 
  searchSingaporeAddress, 
  SG_TOWN_COORDINATES, 
  GeocodedLocation 
} from '../services/geocoder';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Mail,
  ChevronRight,
  Info
} from 'lucide-react';

interface Tab05MapGeocoderProps {
  records: HdbRecord[];
  selectedTown: string;
  setSelectedTown: (town: string) => void;
  onSelectRecord: (record: HdbRecord) => void;
  targetRecord?: HdbRecord | null;
}

interface PlottedBlock {
  blockKey: string;
  block: string;
  street_name: string;
  town: string;
  lat: number;
  lng: number;
  flats: HdbRecord[];
  minPrice: number;
  maxPrice: number;
  latestMonth: string;
}

type BasemapStyle = 'onemap-night' | 'onemap-default' | 'onemap-grey' | 'onemap-original' | 'carto-dark' | 'carto-light';

export const Tab05MapGeocoder: React.FC<Tab05MapGeocoderProps> = ({
  records,
  selectedTown,
  setSelectedTown,
  onSelectRecord,
  targetRecord,
}) => {
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const searchPinLayerRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [plottedBlocks, setPlottedBlocks] = useState<PlottedBlock[]>([]);
  const [selectedBlockData, setSelectedBlockData] = useState<PlottedBlock | null>(null);

  // Basemap selection
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapStyle>(isDark ? 'onemap-night' : 'onemap-default');
  const [userOverrodeBasemap, setUserOverrodeBasemap] = useState(false);

  // OneMap Token Authentication Modal & Status
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('xk3lvin@gmail.com');
  const [authPassword, setAuthPassword] = useState('');
  const [isMintingToken, setIsMintingToken] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [oneMapStatus, setOneMapStatus] = useState<{
    connected: boolean;
    hoursRemaining?: number;
    email?: string;
  }>({ connected: false });

  // Sync default basemap when theme changes unless user explicitly picked a style
  useEffect(() => {
    if (!userOverrodeBasemap) {
      setSelectedBasemap(isDark ? 'onemap-night' : 'onemap-default');
    }
  }, [isDark, userOverrodeBasemap]);

  // Fetch OneMap API Token status from backend proxy
  const checkOneMapStatus = async () => {
    try {
      const res = await fetch('/api/onemap/status');
      if (res.ok) {
        const data = await res.json();
        setOneMapStatus(data);
      }
    } catch {
      // Backend status unavailable, fallback quietly
    }
  };

  useEffect(() => {
    checkOneMapStatus();
  }, []);

  // Handle Token Minting via POST /api/onemap/mint-token
  const handleMintToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Please provide both email and password.');
      return;
    }

    setIsMintingToken(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const res = await fetch('/api/onemap/mint-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAuthSuccess(`Success! OneMap 3-day token minted. Valid for ~${data.hoursRemaining || 72} hours.`);
        setAuthPassword('');
        checkOneMapStatus();
        // Refresh tiles
        if (tileLayerRef.current) {
          tileLayerRef.current.redraw();
        }
      } else {
        setAuthError(data.error || 'Failed to authenticate with OneMap. Please verify your credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Connection error while contacting server.');
    } finally {
      setIsMintingToken(false);
    }
  };

  // Group records by block & street for clean map clustering
  const blockGroups = useMemo(() => {
    const map = new Map<string, HdbRecord[]>();
    const filtered = records.filter(r => {
      if (selectedTown !== 'ALL' && r.town.toUpperCase() !== selectedTown.toUpperCase()) {
        return false;
      }
      return true;
    });

    filtered.forEach(r => {
      const key = `${r.block}_${r.street_name}_${r.town}`.toUpperCase();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(r);
    });

    return Array.from(map.entries()).map(([key, flats]) => {
      const prices = flats.map(f => f.price_num);
      return {
        blockKey: key,
        block: flats[0].block,
        street_name: flats[0].street_name,
        town: flats[0].town,
        flats,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        latestMonth: flats[0].month,
      };
    });
  }, [records, selectedTown]);

  // Determine tile URL based on chosen style
  const getTileUrl = (style: BasemapStyle) => {
    switch (style) {
      case 'onemap-default':
        return '/api/onemap/tiles/Default/{z}/{x}/{y}.png';
      case 'onemap-night':
        return '/api/onemap/tiles/Night/{z}/{x}/{y}.png';
      case 'onemap-grey':
        return '/api/onemap/tiles/Grey/{z}/{x}/{y}.png';
      case 'onemap-original':
        return '/api/onemap/tiles/Original/{z}/{x}/{y}.png';
      case 'carto-dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'carto-light':
      default:
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      zoomControl: false,
    });

    const tileUrl = getTileUrl(selectedBasemap);
    const tileLayer = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.onemap.gov.sg/" target="_blank">OneMap</a> &copy; Singapore Land Authority, &copy; OpenStreetMap',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c', 'd'],
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const searchGroup = L.layerGroup().addTo(map);

    markersLayerRef.current = markersGroup;
    searchPinLayerRef.current = searchGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer whenever selectedBasemap changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const newUrl = getTileUrl(selectedBasemap);
    tileLayerRef.current.setUrl(newUrl);
  }, [selectedBasemap]);

  // 2. Geocode & Draw Blocks on Map ("The map draws itself")
  useEffect(() => {
    let isCancelled = false;

    async function plotAllBlocks() {
      if (!markersLayerRef.current || !mapInstanceRef.current) return;
      markersLayerRef.current.clearLayers();

      const blocksToPlot = blockGroups.slice(0, 150);
      setGeocodingProgress({ current: 0, total: blocksToPlot.length, isRunning: true });

      const resolved: PlottedBlock[] = [];
      const latLngs: L.LatLng[] = [];

      for (let i = 0; i < blocksToPlot.length; i++) {
        if (isCancelled) break;
        const b = blocksToPlot[i];

        try {
          const loc = await geocodeHdbBlock(b.block, b.street_name, b.town);
          if (loc && !isNaN(loc.lat) && !isNaN(loc.lng)) {
            const plotted: PlottedBlock = {
              ...b,
              lat: loc.lat,
              lng: loc.lng,
            };
            resolved.push(plotted);

            const latlng = L.latLng(loc.lat, loc.lng);
            latLngs.push(latlng);

            // Determine badge appearance
            const isHighVal = b.maxPrice >= 1000000;
            const isMidVal = b.maxPrice >= 650000;
            const pinColor = isHighVal ? '#f43f5e' : isMidVal ? '#3b82f6' : '#10b981';
            const priceLabel = isHighVal 
              ? `$${(b.maxPrice / 1000000).toFixed(2)}M` 
              : `$${Math.round(b.maxPrice / 1000)}k`;

            const iconHtml = `
              <div class="group relative cursor-pointer transform hover:scale-110 transition-transform duration-150">
                <div style="background-color: ${pinColor}; box-shadow: 0 0 10px ${pinColor}88;" 
                     class="px-2 py-0.5 rounded-full text-white font-black text-[10px] whitespace-nowrap border border-white/90 flex items-center gap-1 shadow-md">
                  <span>${priceLabel}</span>
                </div>
                <div class="w-1.5 h-1.5 bg-white mx-auto rounded-full mt-0.5 shadow"></div>
              </div>
            `;

            const customIcon = L.divIcon({
              html: iconHtml,
              className: 'custom-hdb-pin',
              iconSize: [60, 26],
              iconAnchor: [30, 26],
            });

            const marker = L.marker(latlng, { icon: customIcon });
            marker.on('click', () => {
              setSelectedBlockData(plotted);
            });

            markersLayerRef.current.addLayer(marker);
          }
        } catch {
          // ignore
        }

        if (i % 5 === 0 || i === blocksToPlot.length - 1) {
          setGeocodingProgress({ current: i + 1, total: blocksToPlot.length, isRunning: true });
        }
      }

      if (!isCancelled) {
        setPlottedBlocks(resolved);
        setGeocodingProgress(p => ({ ...p, isRunning: false }));

        if (latLngs.length > 0 && mapInstanceRef.current) {
          if (selectedTown !== 'ALL' && SG_TOWN_COORDINATES[selectedTown]) {
            const center = SG_TOWN_COORDINATES[selectedTown];
            mapInstanceRef.current.flyTo([center.lat, center.lng], 14, { duration: 1.2 });
          } else {
            const bounds = L.latLngBounds(latLngs);
            mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          }
        }
      }
    }

    plotAllBlocks();

    return () => {
      isCancelled = true;
    };
  }, [blockGroups, selectedTown]);

  // 3. Focus on targetRecord if selected from another tab
  useEffect(() => {
    if (!targetRecord || !mapInstanceRef.current) return;

    geocodeHdbBlock(targetRecord.block, targetRecord.street_name, targetRecord.town).then(loc => {
      if (loc && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([loc.lat, loc.lng], 16, { duration: 1.5 });

        if (searchPinLayerRef.current) {
          searchPinLayerRef.current.clearLayers();
          const pulseIcon = L.divIcon({
            html: `
              <div class="relative flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-rose-400 opacity-75"></span>
                <div class="relative w-5 h-5 bg-rose-600 rounded-full border-2 border-white shadow-xl"></div>
              </div>
            `,
            className: 'pulse-search-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          const m = L.marker([loc.lat, loc.lng], { icon: pulseIcon }).addTo(searchPinLayerRef.current);
          m.bindPopup(`<b>Blk ${targetRecord.block} ${targetRecord.street_name}</b><br/>${targetRecord.town}<br/>$${targetRecord.price_num.toLocaleString()}`).openPopup();
        }
      }
    });
  }, [targetRecord]);

  // Geocoder Search Submission
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchSingaporeAddress(searchQuery);
      if (results.length > 0 && mapInstanceRef.current && searchPinLayerRef.current) {
        const top = results[0];
        mapInstanceRef.current.flyTo([top.lat, top.lng], 16, { duration: 1.5 });

        searchPinLayerRef.current.clearLayers();
        const pulseIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center">
              <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-amber-400 opacity-75"></span>
              <div class="relative w-6 h-6 bg-amber-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[10px] text-white font-bold">
                📍
              </div>
            </div>
          `,
          className: 'pulse-search-pin',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        const m = L.marker([top.lat, top.lng], { icon: pulseIcon }).addTo(searchPinLayerRef.current);
        m.bindPopup(`<b>${top.address}</b>`).openPopup();
      }
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const jumpToTown = (town: string) => {
    setSelectedTown(town);
    if (SG_TOWN_COORDINATES[town] && mapInstanceRef.current) {
      const c = SG_TOWN_COORDINATES[town];
      mapInstanceRef.current.flyTo([c.lat, c.lng], 14, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Geocoder Search, OneMap API Token Status & Basemap Selector */}
      <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
        isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <MapPin className="w-5 h-5 text-rose-500" />
                Singapore OneMap &amp; Auto-Drawing HDB Map
              </h2>
              {/* OneMap Token Badge */}
              <button
                onClick={() => setShowAuthModal(true)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition ${
                  oneMapStatus.connected
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : isDark
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
                title="Manage Singapore OneMap SLA API Token"
              >
                <Key className="w-3 h-3 text-amber-400" />
                <span>
                  {oneMapStatus.connected 
                    ? `OneMap SLA Token: Active (${oneMapStatus.hoursRemaining ?? 72}h left)` 
                    : 'OneMap API: Connect 3-Day Token'}
                </span>
              </button>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Search any Singapore postal code, block, or street. The map geocodes and renders transacted block pins.
            </p>
          </div>

          {/* Progress Indicator */}
          {geocodingProgress.isRunning && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono ${
              isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-300 text-slate-700'
            }`}>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
              <span>
                Drawing blocks: {geocodingProgress.current}/{geocodingProgress.total}
              </span>
            </div>
          )}
        </div>

        {/* Address Search Form */}
        <form onSubmit={handleAddressSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search Singapore Address / Postal / Block (e.g. 458 Tampines St 42, 520458, Cantonment Rd, Bishan St 24)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full text-xs sm:text-sm rounded-xl pl-9 pr-4 py-2.5 border focus:ring-2 focus:ring-rose-500 focus:outline-none transition ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-rose-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
              }`}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span>Geocode &amp; Fly</span>
          </button>
        </form>

        {/* Basemap Styles & Precinct Jump Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/20 text-xs">
          {/* Quick Town Centroid Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className={`font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Precinct:</span>
            {['TAMPINES', 'ANG MO KIO', 'BISHAN', 'PUNGGOL', 'QUEENSTOWN', 'BEDOK', 'WOODLANDS', 'JURONG WEST', 'TOA PAYOH', 'KALLANG/WHAMPOA'].map(town => (
              <button
                key={town}
                onClick={() => jumpToTown(town)}
                className={`px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap border ${
                  selectedTown === town
                    ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
              >
                {town}
              </button>
            ))}
            {selectedTown !== 'ALL' && (
              <button
                onClick={() => setSelectedTown('ALL')}
                className="px-2 py-1 rounded-lg text-rose-500 hover:text-rose-600 font-medium underline whitespace-nowrap"
              >
                Show All SG
              </button>
            )}
          </div>

          {/* Basemap Layer Selector */}
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Map Style:</span>
            <select
              value={selectedBasemap}
              onChange={e => {
                setSelectedBasemap(e.target.value as BasemapStyle);
                setUserOverrodeBasemap(true);
              }}
              className={`text-xs py-1 px-2 rounded-lg border focus:ring-1 focus:ring-rose-500 font-medium ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-200' 
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="onemap-night">OneMap SLA Night (Dark)</option>
              <option value="onemap-default">OneMap SLA Default (Day)</option>
              <option value="onemap-grey">OneMap SLA Grey (Cadastral)</option>
              <option value="onemap-original">OneMap SLA Original</option>
              <option value="carto-dark">CartoDB Dark Matter</option>
              <option value="carto-light">CartoDB Voyager (Light)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Container & Drawer */}
      <div className={`relative rounded-2xl overflow-hidden border shadow-xl h-[580px] ${
        isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-300 bg-slate-100'
      }`}>
        {/* Leaflet DOM Mount */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Map Legend Overlay */}
        <div className={`absolute top-4 left-4 z-20 p-3 rounded-xl border shadow-lg backdrop-blur-md text-xs space-y-1.5 ${
          isDark 
            ? 'bg-slate-900/90 border-slate-700/80 text-slate-200' 
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-md'
        }`}>
          <div className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Price Brackets
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>&ge; $1,000,000 (Million Dollar)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>$650k – $999k</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>&lt; $650k (Entry / Mid)</span>
          </div>
        </div>

        {/* Selected Block Info Drawer */}
        {selectedBlockData && (
          <div className={`absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-20 p-4 rounded-2xl border shadow-2xl backdrop-blur-md text-xs animate-in slide-in-from-bottom-3 duration-200 ${
            isDark 
              ? 'bg-slate-900/95 border-slate-700 text-slate-100' 
              : 'bg-white/95 border-slate-300 text-slate-800'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-500 uppercase">
                  {selectedBlockData.town}
                </span>
                <h3 className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Blk {selectedBlockData.block} {selectedBlockData.street_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlockData(null)}
                className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-200'}`}
              >
                ✕
              </button>
            </div>

            <div className={`mt-3 pt-2 border-t flex justify-between items-baseline ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <div className="text-[10px] text-slate-400">Price Range (Recent Sales)</div>
                <div className="text-base font-black text-rose-500">
                  ${selectedBlockData.minPrice.toLocaleString()}{' '}
                  {selectedBlockData.minPrice !== selectedBlockData.maxPrice && (
                    <span className="text-xs font-normal opacity-80">
                      – ${selectedBlockData.maxPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Transacted Flats</div>
                <div className={`text-sm font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedBlockData.flats.length} units
                </div>
              </div>
            </div>

            {/* List of transactions in this block */}
            <div className="mt-3 max-h-40 overflow-y-auto space-y-2 pr-1">
              {selectedBlockData.flats.map(flat => (
                <div
                  key={flat._id}
                  onClick={() => onSelectRecord(flat)}
                  className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                    isDark 
                      ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div>
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {flat.flat_type} • {flat.floor_area_num} sqm
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Flr {flat.storey_range} • {flat.remaining_lease}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-500">${flat.price_num.toLocaleString()}</div>
                    <div className="text-[10px] text-amber-500 font-mono">${flat.psm}/sqm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OneMap Token Authentication / Minting Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl space-y-4 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    OneMap API 3-Day Token
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Singapore Land Authority (SLA) Authentication
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100'}`}
              >
                ✕
              </button>
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
              isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold text-rose-500">
                <Info className="w-3.5 h-3.5" />
                <span>Endpoint: /api/auth/post/getToken</span>
              </div>
              <p className="text-[11px]">
                OneMap tokens are minted via <code className="font-mono text-amber-400">POST https://www.onemap.gov.sg/api/auth/post/getToken</code> and remain active for <strong>3 days</strong> (72 hours).
              </p>
            </div>

            {/* Current Status */}
            {oneMapStatus.connected && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div>
                  <span className="font-bold">Active Token: </span>
                  Valid for ~{oneMapStatus.hoursRemaining ?? 72} more hours. Official SLA cadastral tiles and geocoding active.
                </div>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleMintToken} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  OneMap Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="e.g. your_email@domain.com"
                    className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border focus:ring-2 focus:ring-rose-500 ${
                      isDark 
                        ? 'bg-slate-950 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  OneMap Account Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border focus:ring-2 focus:ring-rose-500 ${
                      isDark 
                        ? 'bg-slate-950 border-slate-700 text-white' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Credentials are sent only to the local proxy to exchange with OneMap and are never stored in client state.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isMintingToken}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isMintingToken ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  <span>{isMintingToken ? 'Minting 3-Day Token...' : 'Mint OneMap Token'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
