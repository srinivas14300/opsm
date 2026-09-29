import React from 'react';
import { useApp } from '../context/AppContext';
import { Incident } from '../types/incident';
import {
  X,
  Clock,
  CheckCircle2,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { playActionBeep } from '../utils/audio';

export const HistoricalIncidentModal: React.FC = () => {
  const { viewHistoricalModalIncident, setViewHistoricalModalIncident, setSelectedIncidentId, setActiveTab } = useApp();

  if (!viewHistoricalModalIncident) return null;
  const inc = viewHistoricalModalIncident;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => setViewHistoricalModalIncident(null)}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-mono text-indigo-400 font-semibold">{inc.id}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300">{inc.affectedService}</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400 uppercase font-semibold text-[11px]">{inc.status}</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">{inc.title}</h2>
          </div>

          <button
            onClick={() => setViewHistoricalModalIncident(null)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3.5 text-xs">
          <div>
            <span className="font-semibold text-slate-300">Incident Description:</span>
            <p className="mt-1 text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-850 leading-relaxed">
              {inc.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
            <div>
              <span className="text-slate-500 font-medium">Incident Commander:</span>
              <p className="text-slate-200 mt-0.5">{inc.reportedBy.name} ({inc.reportedBy.role})</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Recovery Duration:</span>
              <p className="text-emerald-400 font-semibold mt-0.5 tabular-nums">
                {inc.durationMinutes ? `${inc.durationMinutes} minutes` : 'Resolved'}
              </p>
            </div>
          </div>

          {inc.rootCause && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-200">Identified Root Cause:</span>
              <p className="text-slate-300 bg-slate-850 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {inc.rootCause}
              </p>
            </div>
          )}

          {inc.resolutionNotes && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-200">Verified Recovery Procedure:</span>
              <p className="text-slate-300 bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-lg leading-relaxed">
                {inc.resolutionNotes}
              </p>
            </div>
          )}

          {inc.runbookUsedTitle && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-850">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <div className="flex-1">
                <span className="text-slate-400 text-[11px]">Remediation Playbook:</span>
                <p className="text-slate-200 font-medium text-xs">{inc.runbookUsedTitle}</p>
              </div>
            </div>
          )}

          {inc.timeline && inc.timeline.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-200">Execution Timeline:</span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {inc.timeline.map((t) => (
                  <div key={t.id} className="p-2 rounded bg-slate-950 border border-slate-850 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-mono text-indigo-400 font-medium">{t.time}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      <span className="text-white font-medium">{t.action}</span>
                    </div>
                    <span className="text-slate-400 truncate max-w-xs">{t.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => setViewHistoricalModalIncident(null)}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>

          {inc.postMortem && (
            <button
              onClick={() => {
                setViewHistoricalModalIncident(null);
                setSelectedIncidentId(inc.id);
                setActiveTab('post-mortem');
                playActionBeep();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Open Post-Mortem Document</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
