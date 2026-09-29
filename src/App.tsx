/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopBar } from './components/TopBar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { ReportIncidentView } from './components/ReportIncidentView';
import { InvestigationView } from './components/InvestigationView';
import { RunbooksView } from './components/RunbooksView';
import { AgentMemoryView } from './components/AgentMemoryView';
import { HistoryView } from './components/HistoryView';
import { PostMortemView } from './components/PostMortemView';
import { SettingsView } from './components/SettingsView';
import { HistoricalIncidentModal } from './components/HistoricalIncidentModal';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { toggleSound, playActionBeep } from './utils/audio';

const AppContent: React.FC = () => {
  const { isLoggedIn, activeTab, setActiveTab } = useApp();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Global Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Escape closes dialogs
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutsModalOpen(false);
        return;
      }

      if (isInput) return;

      // Quick numbers navigation
      if (e.key === '1') {
        setActiveTab('dashboard');
        playActionBeep();
      } else if (e.key === '2') {
        setActiveTab('report');
        playActionBeep();
      } else if (e.key === '3') {
        setActiveTab('investigation');
        playActionBeep();
      } else if (e.key === '4') {
        setActiveTab('runbooks');
        playActionBeep();
      } else if (e.key === '5') {
        setActiveTab('memory');
        playActionBeep();
      } else if (e.key === '6') {
        setActiveTab('history');
        playActionBeep();
      } else if (e.key === '7') {
        setActiveTab('post-mortem');
        playActionBeep();
      } else if (e.key === '8') {
        setActiveTab('settings');
        playActionBeep();
      } else if (e.key.toLowerCase() === 'm') {
        toggleSound();
      } else if (e.key === '?') {
        setShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <TopBar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'report' && <ReportIncidentView />}
        {activeTab === 'investigation' && <InvestigationView />}
        {activeTab === 'runbooks' && <RunbooksView />}
        {activeTab === 'memory' && <AgentMemoryView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'post-mortem' && <PostMortemView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Incident IQ · Enterprise Autonomous Incident Intelligence & Guided Recovery</span>
          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600">
            <span>SOC 2 Type II</span>
            <span>·</span>
            <span>All production changes audit-logged</span>
            <span>·</span>
            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Shortcuts (?)
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <HistoricalIncidentModal />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
