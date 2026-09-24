import React, { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Calculator, 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Scale
} from 'lucide-react';

export const Tab04Affordability: React.FC = () => {
  const { isDark } = useTheme();

  // Inputs
  const [flatPrice, setFlatPrice] = useState<number>(650000);
  const [remainingLease, setRemainingLease] = useState<number>(68);
  const [buyerAge, setBuyerAge] = useState<number>(32);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(9000);
  const [cpfOaBalance, setCpfOaBalance] = useState<number>(85000);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(2.6); // 2.6% HDB
  const [loanTenureYears, setLoanTenureYears] = useState<number>(25);

  // CPF Rule Check: Does lease cover youngest buyer to age 95?
  const agePlusLease = buyerAge + remainingLease;
  const coversToAge95 = agePlusLease >= 95;

  // Pro-ration ratio if lease < 95 - buyerAge
  const proRataRatio = useMemo(() => {
    if (remainingLease < 30) return 0; // No CPF allowed
    if (coversToAge95) return 1.0;
    const requiredYears = 95 - buyerAge;
    return Math.min(1.0, Math.max(0, remainingLease / requiredYears));
  }, [remainingLease, buyerAge, coversToAge95]);

  // Max CPF usable
  const maxCpfUsable = Math.round(flatPrice * proRataRatio);

  // Maximum loan calculation
  const maxLtv = remainingLease >= 60 ? 0.8 : Math.min(0.8, proRataRatio * 0.8);
  const maxLoanAmount = Math.round(flatPrice * maxLtv);
  const requiredDownpayment = flatPrice - maxLoanAmount;

  // Monthly mortgage repayment
  const monthlyMortgage = useMemo(() => {
    if (maxLoanAmount <= 0) return 0;
    const r = (loanInterestRate / 100) / 12;
    const n = Math.min(loanTenureYears, remainingLease - 20) * 12;
    if (n <= 0) return 0;
    return Math.round((maxLoanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }, [maxLoanAmount, loanInterestRate, loanTenureYears, remainingLease]);

  // MSR (Mortgage Servicing Ratio: max 30% of gross monthly income)
  const msrPercent = monthlyIncome > 0 ? Number(((monthlyMortgage / monthlyIncome) * 100).toFixed(1)) : 0;
  const passesMsr = msrPercent <= 30;

  // Bala's Table (SLA Leasehold Table)
  const getBalaPct = (years: number) => {
    if (years >= 99) return 96.0;
    if (years >= 90) return 93.0;
    if (years >= 80) return 88.5;
    if (years >= 70) return 82.6;
    if (years >= 60) return 74.3;
    if (years >= 50) return 63.8;
    if (years >= 40) return 51.0;
    if (years >= 30) return 36.0;
    if (years >= 20) return 21.0;
    if (years >= 10) return 9.5;
    return (years / 10) * 9.5;
  };

  const currentBalaPct = getBalaPct(remainingLease);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-slate-850/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Calculator className="w-5 h-5 text-rose-500" />
          HDB Financing, CPF Rules &amp; Bala&rsquo;s Lease Decay Table
        </h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Evaluate CPF Housing rules, pro-rated loan caps, Mortgage Servicing Ratio (MSR 30%), and SLA leasehold depreciation.
        </p>
      </div>

      {/* Main Grid: Calculator & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Interactive Inputs */}
        <div className={`lg:col-span-5 p-5 rounded-2xl border shadow-xs space-y-4 transition-colors ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2 ${
            isDark ? 'text-slate-300 border-slate-800' : 'text-slate-700 border-slate-100'
          }`}>
            <Scale className="w-4 h-4 text-rose-500" />
            Buyer &amp; Flat Financing Parameters
          </h3>

          {/* Flat Price */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Purchase Price</span>
              <span className="font-bold text-rose-500 font-mono">${flatPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="300000"
              max="1500000"
              step="10000"
              value={flatPrice}
              onChange={e => setFlatPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Remaining Lease */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Remaining Lease</span>
              <span className="font-bold text-emerald-500 font-mono">{remainingLease} years</span>
            </div>
            <input
              type="range"
              min="25"
              max="99"
              step="1"
              value={remainingLease}
              onChange={e => setRemainingLease(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Buyer Age */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Youngest Buyer&rsquo;s Age</span>
              <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{buyerAge} years old</span>
            </div>
            <input
              type="range"
              min="21"
              max="65"
              step="1"
              value={buyerAge}
              onChange={e => setBuyerAge(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Gross Household Income */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Gross Monthly Household Income</span>
              <span className="font-bold text-amber-500 font-mono">${monthlyIncome.toLocaleString()}/mo</span>
            </div>
            <input
              type="range"
              min="2500"
              max="25000"
              step="500"
              value={monthlyIncome}
              onChange={e => setMonthlyIncome(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* CPF OA Balance */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Combined CPF Ordinary Account (OA)</span>
              <span className="font-bold text-blue-500 font-mono">${cpfOaBalance.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="300000"
              step="5000"
              value={cpfOaBalance}
              onChange={e => setCpfOaBalance(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Loan Interest & Tenure */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Interest Rate</label>
              <select
                value={loanInterestRate}
                onChange={e => setLoanInterestRate(Number(e.target.value))}
                className={`w-full text-xs rounded-xl p-2 border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value={2.6}>2.60% (HDB Concessionary)</option>
                <option value={3.0}>3.00% (Floating Bank)</option>
                <option value={3.2}>3.20% (Fixed Bank)</option>
                <option value={3.75}>3.75% (Stress Test)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Loan Tenure</label>
              <select
                value={loanTenureYears}
                onChange={e => setLoanTenureYears(Number(e.target.value))}
                className={`w-full text-xs rounded-xl p-2 border ${
                  isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value={25}>25 Years (Max HDB)</option>
                <option value={20}>20 Years</option>
                <option value={15}>15 Years</option>
                <option value={30}>30 Years (Bank Only)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Col: Assessment & Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* CPF Eligibility Card */}
          <div className={`p-5 rounded-2xl border transition-colors ${
            remainingLease < 30
              ? isDark ? 'bg-rose-950/30 border-rose-600/50' : 'bg-rose-50 border-rose-300'
              : coversToAge95
              ? isDark ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-emerald-50 border-emerald-300'
              : isDark ? 'bg-amber-950/20 border-amber-500/40' : 'bg-amber-50 border-amber-300'
          }`}>
            <div className="flex items-start gap-3">
              {remainingLease < 30 ? (
                <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              ) : coversToAge95 ? (
                <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {remainingLease < 30
                    ? 'Lease Under 30 Years: No CPF or HDB Loan Allowed'
                    : coversToAge95
                    ? 'Full CPF & Maximum HDB Loan Eligible'
                    : `Pro-Rated CPF & Loan Restriction (${Math.round(proRataRatio * 100)}% Cap)`}
                </h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Buyer Age ({buyerAge}) + Remaining Lease ({remainingLease}) ={' '}
                  <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{agePlusLease} years</span>.
                  {coversToAge95
                    ? ' Flat covers the buyer until age 95 or beyond. 100% of valuation limit and maximum LTV applies.'
                    : remainingLease < 30
                    ? ' Since lease is under 30 years, 100% cash is required for purchase.'
                    : ` Flat does not cover the buyer to age 95. CPF usage is pro-rated to ${(proRataRatio * 100).toFixed(0)}% of Valuation Limit.`}
                </p>
              </div>
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <div className="text-[11px] text-slate-400">Max Loan (LTV {(maxLtv * 100).toFixed(0)}%)</div>
                <div className={`text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>${maxLoanAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Downpayment Needed</div>
                <div className="text-base font-bold text-rose-500 font-mono">${requiredDownpayment.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Max CPF Usable</div>
                <div className="text-base font-bold text-blue-500 font-mono">${maxCpfUsable.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Monthly Payment & MSR Check */}
          <div className={`p-5 rounded-2xl border shadow-xs space-y-3 transition-colors ${
            isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-400">Estimated Monthly Mortgage</div>
                <div className="text-2xl font-black text-rose-500 mt-0.5">
                  ${monthlyMortgage.toLocaleString()} <span className="text-xs font-normal text-slate-400">/month</span>
                </div>
              </div>

              {/* MSR Status Pill */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                passesMsr 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
              }`}>
                {passesMsr ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                MSR: {msrPercent}% (Max 30%)
              </div>
            </div>

            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className={`h-full transition-all ${passesMsr ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, (msrPercent / 45) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span className="text-emerald-500 font-medium">30% MAS MSR Cap</span>
              <span>45%+</span>
            </div>
          </div>

          {/* Bala's Table Curve */}
          <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${
            isDark ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                SLA Bala&rsquo;s Lease Decay Value
              </h4>
              <span className="text-xs font-mono font-bold text-amber-500">
                {currentBalaPct.toFixed(1)}% of Freehold Equivalent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Singapore Land Authority (SLA) table of leasehold value percentage as years count down. Notice lease decay accelerates sharply under 60 years!
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 text-center text-[10px]">
              {[99, 90, 80, 70, 60, 50, 40, 30].map(yr => {
                const pct = getBalaPct(yr);
                const isSelected = Math.abs(remainingLease - yr) <= 5;
                return (
                  <div
                    key={yr}
                    className={`p-2 rounded-lg border transition ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold shadow-xs'
                        : isDark
                        ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>{yr} yrs</div>
                    <div className={`font-mono mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
