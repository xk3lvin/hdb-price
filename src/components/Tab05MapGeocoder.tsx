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
  getStoredOneMapToken,
  initOneMapToken,
  reverseGeocodeOneMap,
  getOneMapRoute,
  OneMapTokenInfo,
  OneMapRouteResult
} from '../services/onemapService';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Layers, 
  RefreshCw, 
  Route,
  Footprints,
  Car,
  Compass
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

/**
 * Standard Polyline decoder for routing coordinates
 */
function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0, lat = 0, lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let byte = null, shift = 0, result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const latitude_change = (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const longitude_change = (result & 1) ? ~(result >> 1) : (result >> 1);

    lat += latitude_change;
    lng += longitude_change;
    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
}

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
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0, isRunning: false });
  const [plottedBlocks, setPlottedBlocks] = useState<PlottedBlock[]>([]);
  const [selectedBlockData, setSelectedBlockData] = useState<PlottedBlock | null>(null);

  // Basemap selection
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapStyle>(isDark ? 'onemap-night' : 'onemap-default');
  const [userOverrodeBasemap, setUserOverrodeBasemap] = useState(false);

  // OneMap Token Status (powered automatically by environment variable VITE_ONEMAP_TOKEN / ONEMAP_API_TOKEN)
  const [tokenInfo, setTokenInfo] = useState<OneMapTokenInfo>(getStoredOneMapToken());

  // Click-to-reverse-geocode state
  const [clickedLocation, setClickedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
    building?: string;
    postal?: string;
    isLoading: boolean;
  } | null>(null);

  // Routing State
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMins: number;
    routeType: 'walk' | 'drive' | 'pt';
    destinationName: string;
    isLoading: boolean;
    error?: string;
  } | null>(null);

  // Auto-initialize token from environment or server backend
  useEffect(() => {
    initOneMapToken().then(() => {
      setTokenInfo(getStoredOneMapToken());
    });

    const handleUpdate = () => {
      setTokenInfo(getStoredOneMapToken());
    };
    window.addEventListener('onemap_token_updated', handleUpdate);
    return () => window.removeEventListener('onemap_token_updated', handleUpdate);
  }, []);

  // Sync default basemap when theme changes unless user explicitly picked a style
  useEffect(() => {
    if (!userOverrodeBasemap) {
      setSelectedBasemap(isDark ? 'onemap-night' : 'onemap-default');
    }
  }, [isDark, userOverrodeBasemap]);

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
        return 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png';
      case 'onemap-night':
        return 'https://www.onemap.gov.sg/maps/tiles/Night/{z}/{x}/{y}.png';
      case 'onemap-grey':
        return 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png';
      case 'onemap-original':
        return 'https://www.onemap.gov.sg/maps/tiles/Original/{z}/{x}/{y}.png';
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
      attribution: '&copy; <a href="https://www.onemap.gov.sg/" target="_blank">OneMap</a> &copy; Singapore Land Authority',
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

    // Click handler on map: Trigger Reverse Geocoding
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setClickedLocation({ lat, lng, isLoading: true });

      // Drop temporary click pin
      searchGroup.clearLayers();
      const clickIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-lg animate-ping absolute"></div>
            <div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white shadow-lg relative"></div>
          </div>
        `,
        className: 'custom-click-pin',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([lat, lng], { icon: clickIcon }).addTo(searchGroup);

      // Perform Reverse Geocoding via OneMap SLA
      const rev = await reverseGeocodeOneMap(lat, lng);
      setClickedLocation({
        lat,
        lng,
        address: rev.address,
        building: rev.building,
        postal: rev.postal,
        isLoading: false,
      });
    });

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

  // 2. Geocode & Draw Blocks on Map
  useEffect(() => {
    let isCancelled = false;

    async function plotAllBlocks() {
      if (!markersLayerRef.current || !mapInstanceRef.current) return;
      markersLayerRef.current.clearLayers();

      const blocksToPlot = blockGroups.slice(0, 160);
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
              setClickedLocation(null);
            });

            markersLayerRef.current.addLayer(marker);
          }
        } catch {
          // ignore
        }

        if (i % 6 === 0 || i === blocksToPlot.length - 1) {
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
                <div class="w-8 h-8 bg-rose-500 rounded-full opacity-60 animate-ping absolute"></div>
                <div class="w-6 h-6 bg-rose-600 rounded-full border-2 border-white flex items-center justify-center shadow-lg relative">
                  <span class="text-white text-[9px] font-black">★</span>
                </div>
              </div>
            `,
            className: 'custom-pulse-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          L.marker([loc.lat, loc.lng], { icon: pulseIcon }).addTo(searchPinLayerRef.current);
        }

        const match = plottedBlocks.find(b => b.block === targetRecord.block && b.street_name === targetRecord.street_name);
        if (match) {
          setSelectedBlockData(match);
        }
      }
    });
  }, [targetRecord, plottedBlocks]);

  // Address search form submission
  const handleAddressSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchSingaporeAddress(searchQuery.trim());
      if (results.length > 0 && mapInstanceRef.current) {
        const top = results[0];
        mapInstanceRef.current.flyTo([top.lat, top.lng], 16, { duration: 1.5 });

        if (searchPinLayerRef.current) {
          searchPinLayerRef.current.clearLayers();
          const searchIcon = L.divIcon({
            html: `
              <div class="relative flex flex-col items-center">
                <div class="bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xl border border-white whitespace-nowrap">
                  ${top.building || top.address}
                </div>
                <div class="w-3 h-3 bg-rose-600 transform rotate-45 -mt-1.5 shadow"></div>
              </div>
            `,
            className: 'custom-search-pin',
            iconSize: [120, 40],
            iconAnchor: [60, 40],
          });

          L.marker([top.lat, top.lng], { icon: searchIcon }).addTo(searchPinLayerRef.current);
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Jump directly to Town Center
  const jumpToTown = (townName: string) => {
    setSelectedTown(townName);
    const coords = SG_TOWN_COORDINATES[townName.toUpperCase()];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], 14, { duration: 1.2 });
    }
  };

  // Calculate OneMap SLA Route (e.g. from current block to Raffles Place / CBD)
  const handleCalculateRoute = async (startLat: number, startLng: number, routeType: 'walk' | 'drive' | 'pt') => {
    // Raffles Place (CBD / financial center coordinates)
    const endLat = 1.284349;
    const endLng = 103.851072;
    const destName = 'Raffles Place / CBD';

    setRouteInfo({
      distanceKm: 0,
      durationMins: 0,
      routeType,
      destinationName: destName,
      isLoading: true,
    });

    try {
      const routeRes: OneMapRouteResult = await getOneMapRoute(startLat, startLng, endLat, endLng, routeType);

      if (routeRes.route_summary && mapInstanceRef.current) {
        const distKm = Number((routeRes.route_summary.total_distance / 1000).toFixed(2));
        const durMins = Math.round(routeRes.route_summary.total_time / 60);

        setRouteInfo({
          distanceKm: distKm,
          durationMins: durMins,
          routeType,
          destinationName: destName,
          isLoading: false,
        });

        // Draw Route Geometry if available
        if (routeRes.route_geometry) {
          if (routeLayerRef.current) {
            routeLayerRef.current.remove();
          }
          const coords = decodePolyline(routeRes.route_geometry);
          if (coords.length > 0) {
            const poly = L.polyline(coords, {
              color: routeType === 'walk' ? '#10b981' : '#3b82f6',
              weight: 5,
              opacity: 0.85,
              dashArray: routeType === 'walk' ? '4, 8' : undefined,
            }).addTo(mapInstanceRef.current);
            routeLayerRef.current = poly;
            mapInstanceRef.current.fitBounds(poly.getBounds(), { padding: [60, 60] });
          }
        }
      } else {
        setRouteInfo(prev => prev ? {
          ...prev,
          isLoading: false,
          error: routeRes.error || 'Route not found or token expired. Please verify OneMap token.',
        } : null);
      }
    } catch (err: any) {
      setRouteInfo(prev => prev ? {
        ...prev,
        isLoading: false,
        error: err.message || 'Route service request failed.',
      } : null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Compass className="w-5 h-5 text-rose-500" />
                Singapore OneMap &amp; SLA Spatial Geocoder
              </h2>

              {/* OneMap SLA Status Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                  tokenInfo.isValid
                    ? isDark
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={tokenInfo.isValid ? 'Singapore SLA OneMap Spatial Engine Active' : 'SLA Basemap Active'}
              >
                <span className={`w-2 h-2 rounded-full ${tokenInfo.isValid ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>OneMap SLA</span>
              </div>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Search any Singapore postal code, block, or street. Click anywhere on the map to reverse-geocode SLA addresses.
            </p>
          </div>

          {/* Progress Indicator */}
          {geocodingProgress.isRunning && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono shrink-0 ${
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
              placeholder="Search Singapore Address / Postal / Block (e.g. 458 Tampines St 42, 520458, Cantonment Rd, Raffles Place)..."
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
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-800/20 text-xs">
          {/* Quick Town Centroid Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className={`font-medium whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Precinct:</span>
            {['TAMPINES', 'ANG MO KIO', 'BISHAN', 'PUNGGOL', 'QUEENSTOWN', 'BEDOK', 'WOODLANDS', 'JURONG WEST', 'TOA PAYOH', 'KALLANG/WHAMPOA'].map(town => (
              <button
                key={town}
                onClick={() => jumpToTown(town)}
                className={`px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap border cursor-pointer ${
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
                className="px-2 py-1 rounded-lg text-rose-500 hover:text-rose-600 font-medium underline whitespace-nowrap cursor-pointer"
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

      {/* Map Container & Overlays */}
      <div className={`relative rounded-2xl overflow-hidden border shadow-xl h-[600px] ${
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
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/40">
            Tip: Click anywhere to reverse-geocode!
          </div>
        </div>

        {/* Reverse Geocode Click Popup Card */}
        {clickedLocation && (
          <div className={`absolute top-4 right-4 z-20 p-4 rounded-2xl border shadow-2xl backdrop-blur-md text-xs max-w-xs animate-in fade-in duration-150 ${
            isDark 
              ? 'bg-slate-900/95 border-slate-700 text-slate-100' 
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <MapPin className="w-4 h-4" />
                <span>OneMap Reverse Geocode</span>
              </div>
              <button
                onClick={() => setClickedLocation(null)}
                className={`p-1 rounded-lg ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                ✕
              </button>
            </div>

            {clickedLocation.isLoading ? (
              <div className="flex items-center gap-2 py-3 text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>Querying OneMap SLA address...</span>
              </div>
            ) : (
              <div className="mt-2 space-y-1.5">
                <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {clickedLocation.building || clickedLocation.address || 'Singapore Coordinate'}
                </div>
                {clickedLocation.postal && (
                  <div className="text-xs text-rose-500 font-mono font-semibold">
                    Postal Code: S({clickedLocation.postal})
                  </div>
                )}
                <div className="text-[10px] text-slate-400 font-mono">
                  {clickedLocation.lat.toFixed(6)}, {clickedLocation.lng.toFixed(6)}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleCalculateRoute(clickedLocation.lat, clickedLocation.lng, 'walk')}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Footprints className="w-3 h-3" />
                    <span>Route to CBD</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Route Calculation Result Overlay */}
        {routeInfo && (
          <div className={`absolute top-20 right-4 z-20 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs max-w-xs animate-in fade-in duration-200 ${
            isDark 
              ? 'bg-slate-900/95 border-emerald-500/40 text-slate-100' 
              : 'bg-white/95 border-emerald-300 text-slate-800'
          }`}>
            <div className="flex items-center justify-between font-bold text-emerald-500 pb-1 border-b border-slate-800/40">
              <span className="flex items-center gap-1.5">
                <Route className="w-4 h-4" />
                OneMap SLA Routing
              </span>
              <button
                onClick={() => setRouteInfo(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {routeInfo.isLoading ? (
              <div className="flex items-center gap-2 py-2 text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Computing SLA route...</span>
              </div>
            ) : routeInfo.error ? (
              <div className="text-rose-400 py-1.5 text-[11px]">
                {routeInfo.error}
              </div>
            ) : (
              <div className="space-y-1 pt-1.5">
                <div className="text-[11px] text-slate-400">Destination: {routeInfo.destinationName}</div>
                <div className="flex items-baseline justify-between">
                  <div className="text-base font-black text-emerald-500 font-mono">
                    ~{routeInfo.durationMins} mins
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {routeInfo.distanceKm} km ({routeInfo.routeType})
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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

            {/* SLA Routing Action */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/40 flex gap-2">
              <button
                onClick={() => handleCalculateRoute(selectedBlockData.lat, selectedBlockData.lng, 'walk')}
                className="flex-1 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Footprints className="w-3 h-3" />
                <span>Walk to CBD</span>
              </button>
              <button
                onClick={() => handleCalculateRoute(selectedBlockData.lat, selectedBlockData.lng, 'drive')}
                className="flex-1 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-semibold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Car className="w-3 h-3" />
                <span>Drive to CBD</span>
              </button>
            </div>

            {/* List of transactions in this block */}
            <div className="mt-3 max-h-36 overflow-y-auto space-y-2 pr-1">
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
    </div>
  );
};
