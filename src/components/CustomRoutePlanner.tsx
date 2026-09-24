import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { POPULAR_DESTINATIONS, DestinationPreset } from '../services/amenitiesService';
import { 
  Navigation, 
  Search, 
  Car, 
  Footprints, 
  Train, 
  X, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Milestone,
  ArrowRight
} from 'lucide-react';

export type RouteTransitMode = 'walk' | 'drive' | 'pt';

export interface CalculatedRouteState {
  distanceKm: number;
  durationMins: number;
  routeType: RouteTransitMode;
  destinationName: string;
  destinationCoords: { lat: number; lng: number };
  startName: string;
  startCoords: { lat: number; lng: number };
  isLoading: boolean;
  error?: string;
}

interface CustomRoutePlannerProps {
  originName: string;
  originCoords: { lat: number; lng: number } | null;
  destinationInput: string;
  setDestinationInput: (val: string) => void;
  transitMode: RouteTransitMode;
  setTransitMode: (mode: RouteTransitMode) => void;
  onCalculateRoute: (destinationQuery: string, mode: RouteTransitMode, presetCoords?: { lat: number; lng: number }) => Promise<void>;
  calculatedRoute: CalculatedRouteState | null;
  onClearRoute: () => void;
  isCalculating: boolean;
}

export const CustomRoutePlanner: React.FC<CustomRoutePlannerProps> = ({
  originName,
  originCoords,
  destinationInput,
  setDestinationInput,
  transitMode,
  setTransitMode,
  onCalculateRoute,
  calculatedRoute,
  onClearRoute,
  isCalculating,
}) => {
  const { isDark } = useTheme();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInput.trim()) return;
    onCalculateRoute(destinationInput.trim(), transitMode);
  };

  const handleSelectPreset = (preset: DestinationPreset) => {
    setDestinationInput(preset.name);
    onCalculateRoute(preset.name, transitMode, { lat: preset.lat, lng: preset.lng });
  };

  return (
    <div className={`p-4 rounded-2xl border shadow-lg transition ${
      isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-800'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Custom Destination Route Planner
            </h4>
            <p className="text-[11px] text-slate-400">
              Calculate travel time and directions from {originName || 'selected block'}
            </p>
          </div>
        </div>

        {/* Transit Mode Selector */}
        <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              setTransitMode('walk');
              if (destinationInput.trim()) onCalculateRoute(destinationInput.trim(), 'walk');
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition text-xs cursor-pointer ${
              transitMode === 'walk'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Walking Route"
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTransitMode('drive');
              if (destinationInput.trim()) onCalculateRoute(destinationInput.trim(), 'drive');
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition text-xs cursor-pointer ${
              transitMode === 'drive'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Driving Route"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTransitMode('pt');
              if (destinationInput.trim()) onCalculateRoute(destinationInput.trim(), 'pt');
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition text-xs cursor-pointer ${
              transitMode === 'pt'
                ? 'bg-purple-600 text-white shadow-xs font-bold'
                : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Public Transit Route"
          >
            <Train className="w-3.5 h-3.5" />
            <span>Transit</span>
          </button>
        </div>
      </div>

      {/* Destination Form */}
      <form onSubmit={handleFormSubmit} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Where do you want to go? (e.g. Orchard MRT, Changi Airport, NUS, Workplace, Postal Code)..."
            value={destinationInput}
            onChange={e => setDestinationInput(e.target.value)}
            className={`w-full text-xs sm:text-sm rounded-xl pl-9 pr-8 py-2.5 border focus:ring-2 focus:ring-rose-500 focus:outline-none transition ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' 
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-3" />
          {destinationInput && (
            <button
              type="button"
              onClick={() => {
                setDestinationInput('');
                onClearRoute();
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isCalculating || !destinationInput.trim() || !originCoords}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition shadow-sm shrink-0 cursor-pointer"
        >
          {isCalculating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          <span>Get Route</span>
        </button>
      </form>

      {/* Popular Singapore Destinations Pills */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap mr-0.5">
          Popular:
        </span>
        {POPULAR_DESTINATIONS.map(p => (
          <button
            key={p.name}
            type="button"
            onClick={() => handleSelectPreset(p)}
            className={`px-2 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
              destinationInput === p.name
                ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Route Calculation Result Card */}
      {calculatedRoute && (
        <div className={`mt-3 p-3.5 rounded-xl border animate-in fade-in duration-200 ${
          calculatedRoute.error
            ? isDark ? 'bg-rose-950/30 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
            : isDark ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          {calculatedRoute.isLoading ? (
            <div className="flex items-center gap-2 text-xs py-1 text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Calculating route to {calculatedRoute.destinationName}...</span>
            </div>
          ) : calculatedRoute.error ? (
            <div className="flex items-start justify-between">
              <div className="text-xs">
                <div className="font-bold">Routing Notice</div>
                <div className="text-[11px] mt-0.5 opacity-90">{calculatedRoute.error}</div>
              </div>
              <button onClick={onClearRoute} className="p-1 text-slate-400 hover:text-white">✕</button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    Route Directions
                  </div>
                  <div className={`text-xs font-bold mt-0.5 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>{calculatedRoute.startName}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{calculatedRoute.destinationName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClearRoute}
                  className={`text-xs px-2 py-0.5 rounded-md border font-semibold transition ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  Clear
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 font-bold text-emerald-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>~{calculatedRoute.durationMins} mins</span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-xs opacity-85">
                    <Milestone className="w-3.5 h-3.5" />
                    <span>{calculatedRoute.distanceKm} km</span>
                  </div>
                </div>

                <div className="capitalize text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {calculatedRoute.routeType === 'walk' ? 'Walking Route' : calculatedRoute.routeType === 'drive' ? 'Driving Route' : 'Public Transit'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
