import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types/incident';
import {
  Settings,
  Shield,
  Building2,
  Users,
  Lock,
  CheckCircle2,
  AlertTriangle,
  History,
  Terminal,
} from 'lucide-react';
import { SEED_USERS } from '../data/seedData';
import { playActionBeep, playSuccessChime } from '../utils/audio';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    switchRole,
    organizationName,
    setOrganizationName,
    incidents,
  } = useApp();

  const [requireConfirmation, setRequireConfirmation] = useState(true);
  const [allowAiSuggestions, setAllowAiSuggestions] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const handleSave = () => {
    setSavedSettingsNotice(true);
    playSuccessChime();
    setTimeout(() => setSavedSettingsNotice(false), 2500);
  };

  // Compile executed dangerous actions as audit trail
  const auditActions = incidents
    .flatMap((inc) =>
      inc.timeline
        .filter((t) => t.type === 'action_run')
        .map((t) => ({ ...t, incidentId: inc.id, service: inc.affectedService }))
    )
    .slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Enterprise Administration</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-200 font-medium">Access Controls & Safety Guardrails</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">System Security & Workspace Settings</h1>
      </div>

      {savedSettingsNotice && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Security policies and organization tenant settings successfully saved.</span>
        </div>
      )}

      {/* Role-Based Access Control Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xs text-xs">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Users className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Role-Based Access Control (RBAC)</h2>
        </div>

        <p className="text-slate-400 text-xs">
          Select an active test persona to test permission boundaries across Employee, Support/IT, and Admin roles:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SEED_USERS.map((usr) => {
            const isCurrent = currentUser.role === usr.role;

            return (
              <div
                key={usr.id}
                onClick={() => {
                  switchRole(usr.role);
                  playActionBeep();
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-600/10 shadow-xs'
                    : 'border-slate-800 bg-slate-950 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white capitalize">{usr.role}</span>
                  {isCurrent && (
                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                      Active
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  <p className="text-slate-200 font-medium">{usr.name}</p>
                  <p className="truncate">{usr.email}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  {usr.role === 'employee' && 'Report issues & view published incident status.'}
                  {usr.role === 'support' && 'Full investigation triage & execution privileges.'}
                  {usr.role === 'admin' && 'Organization admin & formal post-mortem sign-off.'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Guardrails */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xs text-xs">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Production Safety & Guardrails</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <div className="font-semibold text-white">Require Authorized Confirmation for Destructive Actions</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Forces explicit modal confirmation before executing rolling restarts, pool flushes, or cache clearing.
              </div>
            </div>
            <input
              type="checkbox"
              checked={requireConfirmation}
              onChange={(e) => setRequireConfirmation(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <div className="font-semibold text-white">Enable Real-Time Memory Correlation</div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Automatically search past incident solutions when new triage sessions begin.
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowAiSuggestions}
              onChange={(e) => setAllowAiSuggestions(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
          >
            Save Security Guardrails
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xs text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">Production Command Audit Trail</h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">APPEND-ONLY LOG</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2 font-normal">Timestamp</th>
                <th className="py-2 font-normal">Incident</th>
                <th className="py-2 font-normal">Operation</th>
                <th className="py-2 font-normal">Actor</th>
                <th className="py-2 font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditActions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No production actions recorded in this session yet.
                  </td>
                </tr>
              ) : (
                auditActions.map((act, i) => (
                  <tr key={i} className="hover:bg-slate-850/50">
                    <td className="py-2 text-slate-400">{act.time}</td>
                    <td className="py-2 text-indigo-400">{act.incidentId}</td>
                    <td className="py-2 text-slate-200">{act.action}</td>
                    <td className="py-2 text-slate-400">{act.user}</td>
                    <td className="py-2 text-right text-emerald-400 font-medium">{act.result || 'Executed'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
