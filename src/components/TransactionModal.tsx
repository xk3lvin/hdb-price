import React from 'react';
import { HdbRecord } from '../types/hdb';
import { useTheme } from '../context/ThemeContext';
import { 
  X, 
  MapPin, 
  Clock, 
  DollarSign, 
  Navigation
} from 'lucide-react';

interface TransactionModalProps {
  record: HdbRecord | null;
  onClose: () => void;
  onViewOnMap: (record: HdbRecord) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  record,
  onClose,
  onViewOnMap,
}) => {
  const { isDark } = useTheme();
  if (!record) return null;

  const floorAreaSqft = Math.round(record.floor_area_num * 10.7639);
  const leasePercent = Math.min(100, Math.max(0, (record.remaining_lease_years / 99) * 100));

  // Quick mortgage estimations
  const loanAmount80 = record.price_num * 0.8;
  const downpayment20 = record.price_num * 0.2;
  const rHdb = 0.026 / 12;
  const nHdb = 25 * 12;
  const monthlyHdb = Math.round((loanAmount80 * rHdb * Math.pow(1 + rHdb, nHdb)) / (Math.pow(1 + rHdb, nHdb) - 1));

  const loanAmount75 = record.price_num * 0.75;
  const rBank = 0.032 / 12;
  const monthlyBank = Math.round((loanAmount75 * rBank * Math.pow(1 + rBank, nHdb)) / (Math.pow(1 + rBank, nHdb) - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative transition-colors ${
          isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b flex items-start justify-between ${
          isDark 
            ? 'border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900' 
            : 'border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-500 border border-rose-500/30">
                {record.flat_type}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Transacted {record.month}
              </span>
            </div>
            <h2 className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Blk {record.block} {record.street_name}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{record.town}</span>
              <span className="text-slate-400">•</span>
              <span>Floor: {record.storey_range}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Price & Area Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs text-slate-400">Resale Price</div>
              <div className="text-xl sm:text-2xl font-black text-rose-500 mt-0.5">
                ${record.price_num.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Official HDB Registry</div>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs text-slate-400">Floor Area</div>
              <div className={`text-xl sm:text-2xl font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {record.floor_area_num} <span className="text-sm font-normal text-slate-400">sqm</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">~{floorAreaSqft} sq ft</div>
            </div>

            <div className={`p-3.5 rounded-xl border col-span-2 sm:col-span-1 ${
              isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-xs text-slate-400">Unit Price</div>
              <div className="text-lg sm:text-xl font-bold text-amber-500 mt-0.5">
                ${record.psm.toLocaleString()}<span className="text-xs font-normal text-slate-400">/sqm</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">~${record.psf}/sqft (PSF)</div>
            </div>
          </div>

          {/* Lease & Model Details */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Remaining Lease
              </span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{record.remaining_lease}</span>
            </div>

            {/* Visual Lease Bar */}
            <div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden flex ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                <div 
                  className={`h-full transition-all ${
                    record.remaining_lease_years >= 75 ? 'bg-emerald-500' :
                    record.remaining_lease_years >= 55 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${leasePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0 years</span>
                <span className="text-slate-400">Lease Commenced: {record.lease_commence_date}</span>
                <span>99 years</span>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 text-xs pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <span className="text-slate-400">Flat Model:</span>
                <span className={`ml-1 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{record.flat_model}</span>
              </div>
              <div>
                <span className="text-slate-400">Storey Level:</span>
                <span className={`ml-1 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{record.storey_range}</span>
              </div>
            </div>
          </div>

          {/* Mortgage & Financing Estimation */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              Estimated Financing Breakdown (25-Yr Tenure)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-900/80 border-slate-750' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-slate-400 font-medium">HDB Concessionary Loan (2.6%)</div>
                <div className="text-lg font-bold text-emerald-500 mt-0.5">
                  ~${monthlyHdb.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  20% downpayment (${downpayment20.toLocaleString()} via CPF/Cash)
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                isDark ? 'bg-slate-900/80 border-slate-750' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-slate-400 font-medium">Bank Loan (Approx. 3.2%)</div>
                <div className="text-lg font-bold text-blue-500 mt-0.5">
                  ~${monthlyBank.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  25% downpayment (min 5% cash required)
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              * Indicative calculation only based on prevailing HDB &amp; MAS guidelines.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
              isDark 
                ? 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700' 
                : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border-slate-300'
            }`}
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onViewOnMap(record);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 shadow-sm transition cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Find Block on Tab 05 Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
