import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ K / Ctrl K', desc: 'Open Command Palette & Global Search' },
    { key: '1', desc: 'Jump to Incidents Dashboard' },
    { key: '2', desc: 'Report New Incident' },
    { key: '3', desc: 'Open Active Incident Investigation' },
    { key: '4', desc: 'Open Fixing Playbooks (Runbooks)' },
    { key: '5', desc: 'Open Agent Memory Bank' },
    { key: '6', desc: 'Open Incident History' },
    { key: '7', desc: 'Open Post-Mortem Reviews' },
    { key: '8', desc: 'Open Workspace Settings' },
    { key: 'M', desc: 'Toggle Alert Sound Chimes' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
    { key: 'Esc', desc: 'Dismiss active dialog or drawer' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-slate-800/40 text-xs"
            >
              <span className="text-slate-300">{s.desc}</span>
              <kbd className="font-mono text-[11px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
