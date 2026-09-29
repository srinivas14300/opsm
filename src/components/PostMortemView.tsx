import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PostMortem } from '../types/incident';
import {
  FileCheck,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  AlertTriangle,
  Plus,
  Trash2,
  Download,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { playActionBeep, playSuccessChime } from '../utils/audio';

export const PostMortemView: React.FC = () => {
  const {
    incidents,
    selectedIncidentId,
    setActiveTab,
    savePostMortem,
    approvePostMortem,
    generateAiPostMortem,
    currentUser,
  } = useApp();

  const incident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  const defaultPostMortem: PostMortem = incident?.postMortem || {
    id: `pm-${Date.now()}`,
    incidentId: incident?.id || 'INC-2026-088',
    summary: `${incident?.title || 'Incident'} caused customer service degradation before recovery steps were executed.`,
    impact: incident?.affectedUsers || 'Customers experienced timeouts during checkout (~2,400 sessions impacted).',
    rootCause: incident?.rootCause || 'Database connection pool was exhausted due to concurrent unindexed queries.',
    resolution: incident?.resolutionNotes || 'Increased connection pool to 100 and cycled service pods via rolling restart.',
    whatWentWell: [
      'Incident IQ correlated symptoms to March historical precedent in under 90 seconds',
      'Remediation playbook steps were executed in sequence without cluster downtime',
      'Triage team communicated customer status updates within 5 minutes of detection',
    ],
    whatDidNotWork: [
      'Early connection pool utilization alert fired at 95% instead of 80% threshold',
      'Batch analytical queries had direct unthrottled access to primary transaction database',
    ],
    preventiveActions: [
      'Add strict 5-second statement_timeout on all payment microservice connection pools',
      'Route analytical bulk reads to dedicated read replica cluster',
      'Increase base connection pool reserve buffer from 40 to 80',
    ],
    lessonsLearned: [
      'Payment service must maintain an isolated database pool separate from general app queries.',
    ],
    approved: false,
    updatedAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<PostMortem>(defaultPostMortem);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!incident) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>No incident selected for post-mortem.</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleRegenerateAi = async () => {
    setIsGenerating(true);
    playActionBeep();
    const generated = await generateAiPostMortem(incident.id);
    if (generated) {
      setFormData(generated);
      playSuccessChime();
    }
    setIsGenerating(false);
  };

  const handleSave = () => {
    savePostMortem(incident.id, formData);
    setSavedSuccess(true);
    playSuccessChime();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleApprove = () => {
    approvePostMortem(incident.id);
    setFormData((prev) => ({
      ...prev,
      approved: true,
      approvedBy: `${currentUser.name} (${currentUser.role})`,
    }));
    playSuccessChime();
  };

  const handleCopyMarkdown = () => {
    playActionBeep();
    const md = `# Post-Incident Review: ${incident.title} (${incident.id})
**Date**: ${incident.createdAt} | **Duration**: ${incident.durationMinutes || 14} minutes
**Incident Commander**: ${incident.reportedBy.name}
**Approval Status**: ${formData.approved ? `Approved by ${formData.approvedBy}` : 'Draft Review'}

## Executive Summary
${formData.summary}

## Impact Assessment
${formData.impact}

## Root Cause Analysis
${formData.rootCause}

## Remediation & Recovery
${formData.resolution}

## What Went Well
${formData.whatWentWell.map((w) => `- ${w}`).join('\n')}

## What Needs Improvement
${formData.whatDidNotWork.map((w) => `- ${w}`).join('\n')}

## Preventative Action Items
${formData.preventiveActions.map((a) => `- [ ] ${a}`).join('\n')}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Reliability Engineering</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-200 font-medium">Post-Incident Review</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Post-Mortem: {incident.id}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-750 transition-colors cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Markdown' : 'Export Markdown'}</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-1.5 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
          >
            <span>Save Review</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Post-incident review documentation saved successfully.</span>
        </div>
      )}

      {/* Document Canvas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm text-xs text-slate-200">
        {/* Document Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-[11px] font-mono text-indigo-400 font-semibold">{incident.id}</div>
            <h2 className="text-lg font-bold text-white mt-0.5">{incident.title}</h2>
            <div className="text-[11px] text-slate-400 mt-1">
              Service: <strong className="text-slate-200">{incident.affectedService}</strong> · MTTR: <strong className="font-mono text-emerald-400">{incident.durationMinutes || 14} min</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formData.approved ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Approved: {formData.approvedBy}</span>
              </div>
            ) : (
              <button
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lead SRE Formal Sign-Off</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Executive Summary
          </label>
          <textarea
            rows={3}
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white leading-relaxed outline-none focus:border-indigo-500"
          />
        </div>

        {/* Impact & Blast Radius */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Customer & Business Impact
          </label>
          <textarea
            rows={2}
            value={formData.impact}
            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white leading-relaxed outline-none focus:border-indigo-500"
          />
        </div>

        {/* Root Cause & 5-Whys */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Technical Root Cause Analysis
          </label>
          <textarea
            rows={3}
            value={formData.rootCause}
            onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white leading-relaxed outline-none focus:border-indigo-500"
          />
        </div>

        {/* Remediation */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recovery & Verification Procedure
          </label>
          <textarea
            rows={2}
            value={formData.resolution}
            onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white leading-relaxed outline-none focus:border-indigo-500"
          />
        </div>

        {/* Two-Column Reflection: What went well / What needs improvement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              What Went Well
            </label>
            <div className="space-y-1.5">
              {formData.whatWentWell.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px]">
                  <span className="text-emerald-400 font-bold">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const next = [...formData.whatWentWell];
                      next[idx] = e.target.value;
                      setFormData({ ...formData, whatWentWell: next });
                    }}
                    className="flex-1 bg-transparent text-slate-200 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-rose-400 uppercase tracking-wider">
              What Needs Improvement
            </label>
            <div className="space-y-1.5">
              {formData.whatDidNotWork.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px]">
                  <span className="text-rose-400 font-bold">•</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const next = [...formData.whatDidNotWork];
                      next[idx] = e.target.value;
                      setFormData({ ...formData, whatDidNotWork: next });
                    }}
                    className="flex-1 bg-transparent text-slate-200 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preventative Action Items
          </label>
          <div className="space-y-1.5">
            {formData.preventiveActions.map((action, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px]">
                <span className="text-indigo-400 font-mono">#{idx + 1}</span>
                <input
                  type="text"
                  value={action}
                  onChange={(e) => {
                    const next = [...formData.preventiveActions];
                    next[idx] = e.target.value;
                    setFormData({ ...formData, preventiveActions: next });
                  }}
                  className="flex-1 bg-transparent text-slate-200 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
