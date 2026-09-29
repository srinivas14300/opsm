import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  AlertTriangle,
  BookOpen,
  Brain,
  Plus,
  UserCheck,
  Settings,
  FileCheck,
  Volume2,
  VolumeX,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { isSoundEnabled, toggleSound, playActionBeep } from '../utils/audio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const {
    incidents,
    runbooks,
    memoryBank,
    setActiveTab,
    setSelectedIncidentId,
    setViewHistoricalModalIncident,
    switchRole,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct searchable items
  type ItemType = {
    id: string;
    category: 'incidents' | 'runbooks' | 'memory' | 'actions';
    title: string;
    subtitle: string;
    badge?: string;
    icon: any;
    action: () => void;
  };

  const allItems: ItemType[] = [
    // Quick Actions
    {
      id: 'act-report',
      category: 'actions',
      title: 'Report New Incident',
      subtitle: 'Submit an incident and start autonomous memory search',
      badge: 'Action',
      icon: Plus,
      action: () => {
        setActiveTab('report');
        onClose();
      },
    },
    {
      id: 'act-toggle-sound',
      category: 'actions',
      title: soundOn ? 'Mute Alert Audio Chimes' : 'Enable Alert Audio Chimes',
      subtitle: 'Synthetic audio cues for alerts and completed actions',
      badge: 'Setting',
      icon: soundOn ? VolumeX : Volume2,
      action: () => {
        const next = toggleSound();
        setSoundOn(next);
        onClose();
      },
    },
    {
      id: 'act-role-support',
      category: 'actions',
      title: 'Switch Role to Marcus Vance (Support / IT)',
      subtitle: 'Full incident triage and execution permissions',
      badge: 'Persona',
      icon: UserCheck,
      action: () => {
        switchRole('support');
        onClose();
      },
    },
    {
      id: 'act-role-admin',
      category: 'actions',
      title: 'Switch Role to Elena Rostova (Admin)',
      subtitle: 'Security policies and post-mortem approval authority',
      badge: 'Persona',
      icon: UserCheck,
      action: () => {
        switchRole('admin');
        onClose();
      },
    },
    {
      id: 'act-role-employee',
      category: 'actions',
      title: 'Switch Role to Sarah Chen (Employee)',
      subtitle: 'Reporter view with simplified incident submission',
      badge: 'Persona',
      icon: UserCheck,
      action: () => {
        switchRole('employee');
        onClose();
      },
    },

    // Incidents
    ...incidents.map((inc) => ({
      id: `inc-${inc.id}`,
      category: 'incidents' as const,
      title: `${inc.id}: ${inc.title}`,
      subtitle: `${inc.affectedService} · ${inc.severity.toUpperCase()} · Status: ${inc.status}`,
      badge: inc.status === 'resolved' || inc.status === 'closed' ? 'Resolved' : 'Active',
      icon: AlertTriangle,
      action: () => {
        if (inc.status === 'resolved' || inc.status === 'closed') {
          setViewHistoricalModalIncident(inc);
        } else {
          setSelectedIncidentId(inc.id);
          setActiveTab('investigation');
        }
        onClose();
      },
    })),

    // Runbooks
    ...runbooks.map((rb) => ({
      id: `rb-${rb.id}`,
      category: 'runbooks' as const,
      title: rb.title,
      subtitle: `${rb.service} · ${rb.estimatedMinutes} min estimated recovery`,
      badge: 'Playbook',
      icon: BookOpen,
      action: () => {
        setActiveTab('runbooks');
        onClose();
      },
    })),

    // Memory
    ...memoryBank.map((mem) => ({
      id: `mem-${mem.id}`,
      category: 'memory' as const,
      title: mem.incidentTitle,
      subtitle: `Cause: ${mem.rootCause}`,
      badge: `${mem.timesReferenced}x Used`,
      icon: Brain,
      action: () => {
        setActiveTab('memory');
        onClose();
      },
    })),
  ];

  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }).slice(0, 12);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        playActionBeep();
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-900">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search incidents, playbooks, memory..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto divide-y divide-slate-800/40 p-2">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching incidents, playbooks, or commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    playActionBeep();
                    item.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-100 truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer with key hints */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">↵</kbd> Select
            </span>
            <span>
              <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Esc</kbd> Close
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Incident IQ Command Engine</span>
        </div>
      </div>
    </div>
  );
};
