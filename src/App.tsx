/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HdbRecord } from './types/hdb';
import { fetchHdbTransactions } from './services/apiService';
import { INITIAL_HDB_RECORDS } from './data/seedData';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Header } from './components/Header';
import { Tab01Explorer } from './components/Tab01Explorer';
import { Tab02Trends } from './components/Tab02Trends';
import { Tab03BudgetFinder } from './components/Tab03BudgetFinder';
import { Tab04Affordability } from './components/Tab04Affordability';
import { Tab05MapGeocoder } from './components/Tab05MapGeocoder';
import { TransactionModal } from './components/TransactionModal';
import { ApiHealthModal } from './components/ApiHealthModal';
import { CheckCircle2, Database, Activity } from 'lucide-react';

function AppContent() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('01');
  const [selectedTown, setSelectedTown] = useState<string>('ALL');
  const [selectedFlatType, setSelectedFlatType] = useState<string>('ALL');
  const [records, setRecords] = useState<HdbRecord[]>(INITIAL_HDB_RECORDS);
  const [totalRecords, setTotalRecords] = useState<number>(INITIAL_HDB_RECORDS.length);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedModalRecord, setSelectedModalRecord] = useState<HdbRecord | null>(null);
  const [targetRecordForMap, setTargetRecordForMap] = useState<HdbRecord | null>(null);
  const [showApiHealthModal, setShowApiHealthModal] = useState<boolean>(false);

  // Fetch from data.gov.sg politely
  const loadData = useCallback(async (town?: string, flatType?: string) => {
    setIsFetching(true);
    try {
      const res = await fetchHdbTransactions({
        town: town ?? selectedTown,
        flatType: flatType ?? selectedFlatType,
        limit: 100,
        sort: 'month desc',
      });

      if (res.records && res.records.length > 0) {
        // Merge with initial seed data so trends and wide geographical spread are always rich
        const existingIds = new Set(res.records.map(r => r._id));
        const merged = [...res.records];
        for (const item of INITIAL_HDB_RECORDS) {
          if (!existingIds.has(item._id)) {
            merged.push(item);
          }
        }
        setRecords(merged);
        setTotalRecords(res.total || merged.length);

        if (res.fromCache) {
          setStatusMessage('Loaded cached snapshot from data.gov.sg');
        } else {
          setStatusMessage('Synced fresh live records from data.gov.sg');
        }
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setStatusMessage('Using local indexed data (safe from rate limits)');
    } finally {
      setIsFetching(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  }, [selectedTown, selectedFlatType]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navigate to map and focus on a specific record
  const handleViewOnMap = (record: HdbRecord) => {
    setTargetRecordForMap(record);
    setActiveTab('05');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'
    }`}>
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRecords={totalRecords}
        isFetching={isFetching}
        onRefresh={() => loadData(selectedTown, selectedFlatType)}
      />

      {/* Live Status Toast / Notification */}
      {statusMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 w-full animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs shadow-xs ${
            isDark 
              ? 'bg-slate-800/90 border-slate-700 text-slate-300' 
              : 'bg-white border-slate-300 text-slate-700'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}

      {/* Main Tab Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === '01' && (
          <Tab01Explorer
            records={records}
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
            selectedFlatType={selectedFlatType}
            setSelectedFlatType={setSelectedFlatType}
            onSelectRecord={setSelectedModalRecord}
            onViewOnMap={handleViewOnMap}
          />
        )}

        {activeTab === '02' && (
          <Tab02Trends
            records={records}
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
            selectedFlatType={selectedFlatType}
            setSelectedFlatType={setSelectedFlatType}
          />
        )}

        {activeTab === '03' && (
          <Tab03BudgetFinder
            records={records}
            onSelectRecord={setSelectedModalRecord}
            onViewOnMap={handleViewOnMap}
          />
        )}

        {activeTab === '04' && (
          <Tab04Affordability />
        )}

        {activeTab === '05' && (
          <Tab05MapGeocoder
            records={records}
            selectedTown={selectedTown}
            setSelectedTown={setSelectedTown}
            onSelectRecord={setSelectedModalRecord}
            targetRecord={targetRecordForMap}
          />
        )}
      </main>

      {/* Transaction Details & Mortgage Modal */}
      <TransactionModal
        record={selectedModalRecord}
        onClose={() => setSelectedModalRecord(null)}
        onViewOnMap={handleViewOnMap}
      />

      {/* Footer */}
      <footer className={`border-t py-6 mt-12 text-xs transition-colors ${
        isDark 
          ? 'border-slate-800/80 bg-slate-950/80 text-slate-500' 
          : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-rose-600 flex items-center justify-center text-white font-bold text-[10px]">
              K
            </div>
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>KakiFlats SG</span>
            <span>•</span>
            <span>Housing &amp; Development Board (HDB) Resale Dataset (Jan 2017 – Sep 2026)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setShowApiHealthModal(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-emerald-500/50 hover:text-emerald-700'
              }`}
              title="Inspect Live System & API Health"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Health</span>
            </button>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              datasetId: d_8b84c4ee58e3cfc0ece0d773c8ca6abc
            </span>
            <span>•</span>
            <span>Open Data Licence v1.0</span>
          </div>
        </div>
      </footer>

      {/* Live System & API Health Modal */}
      <ApiHealthModal
        isOpen={showApiHealthModal}
        onClose={() => setShowApiHealthModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
