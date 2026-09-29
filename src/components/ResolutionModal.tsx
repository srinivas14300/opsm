import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Incident } from '../types/incident';
import { CheckCircle2, BookOpen, Clock, Loader2, X } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface ResolutionModalProps {
  incident: Incident;
  onClose: () => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({ incident, onClose }) => {
  const { resolveIncident, runbooks, setActiveTab, setSelectedIncidentId } = useApp();

  const [rootCause, setRootCause] = useState(
    incident.rootCause || 'Database connection pool was exhausted due to an unindexed query holding connections.'
  );
  const [resolutionNotes, setResolutionNotes] = useState(
    incident.resolutionNotes || 'Checked active connection pool, scaled pool limit to 100, and performed rolling restart of service pods.'
  );
  const [runbookUsedTitle, setRunbookUsedTitle] = useState(
    incident.runbookUsedTitle || (runbooks.length > 0 ? runbooks[0].title : 'Payment Service Recovery')
  );
  const [durationMinutes, setDurationMinutes] = useState(14);
  const [failedApproaches, setFailedApproaches] = useState(
    'Initial attempt to restart downstream webhook listener did not free up database connections.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const failedList = failedApproaches
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await resolveIncident(incident.id, {
      rootCause,
      resolutionNotes,
      runbookUsedTitle,
      durationMinutes,
      failedApproaches: failedList,
    });

    playSuccessChime();
    setIsSubmitting(false);
    onClose();
    setSelectedIncidentId(incident.id);
    setActiveTab('post-mortem');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 text-slate-100 shadow-2xl space-y-4 my-8">
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Formal Incident Resolution</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Resolve {incident.id}: {incident.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Recording verified resolution details updates the system SLA status, publishes findings to the Agent Memory Bank, and initializes the post-mortem.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Identified Root Cause ("Why did this happen?")
            </label>
            <textarea
              rows={2}
              required
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Verified Recovery Procedure ("Steps that fixed it")
            </label>
            <textarea
              rows={2}
              required
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Remediation Playbook Used
              </label>
              <select
                value={runbookUsedTitle}
                onChange={(e) => setRunbookUsedTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
              >
                {runbooks.map((rb) => (
                  <option key={rb.id} value={rb.title}>
                    {rb.title}
                  </option>
                ))}
                <option value="Custom Ad-Hoc Procedure">Custom Ad-Hoc Procedure</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Actual Resolution Duration (Minutes)
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white tabular-nums outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Unsuccessful Hypotheses (What did not work)
            </label>
            <textarea
              rows={2}
              value={failedApproaches}
              onChange={(e) => setFailedApproaches(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Committing Resolution...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Resolution & Open Post-Mortem</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
