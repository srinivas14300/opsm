import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Runbook, RunbookStep } from '../types/incident';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Search,
  Plus,
  Play,
  Clock,
  Terminal,
  FileCode,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { playActionBeep, playSuccessChime } from '../utils/audio';

export const RunbooksView: React.FC = () => {
  const { runbooks, toggleRunbookStep, saveNewRunbook, currentUser } = useApp();

  const [selectedRunbookId, setSelectedRunbookId] = useState<string>(runbooks[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [simulatedStepId, setSimulatedStepId] = useState<string | null>(null);

  // New runbook modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newService, setNewService] = useState('Payment Service');
  const [newDescription, setNewDescription] = useState('');
  const [newMinutes, setNewMinutes] = useState(15);
  const [newStep1, setNewStep1] = useState('Verify network and pod health');
  const [newStep2, setNewStep2] = useState('Inspect active error logs');
  const [newStep3, setNewStep3] = useState('Perform rolling restart if required');

  const filteredRunbooks = runbooks.filter((rb) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rb.title.toLowerCase().includes(q) ||
      rb.service.toLowerCase().includes(q) ||
      rb.description.toLowerCase().includes(q) ||
      rb.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const activeRunbook = runbooks.find((r) => r.id === selectedRunbookId) || runbooks[0];

  const completedCount = activeRunbook
    ? activeRunbook.steps.filter((s) => s.completed).length
    : 0;
  const totalCount = activeRunbook ? activeRunbook.steps.length : 0;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    playActionBeep();
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleSimulateStep = (step: RunbookStep) => {
    setSimulatedStepId(step.id);
    playActionBeep();
    setTimeout(() => {
      setSimulatedStepId(null);
      if (activeRunbook) {
        if (!step.completed) {
          toggleRunbookStep(activeRunbook.id, step.id);
          playSuccessChime();
        }
      }
    }, 700);
  };

  const handleCreateRunbook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    saveNewRunbook({
      title: newTitle,
      service: newService,
      description: newDescription || `Step-by-step resolution procedure for ${newService}.`,
      estimatedMinutes: newMinutes,
      tags: [newService.toLowerCase().replace(/[^a-z0-9]/g, '-'), 'triage', 'prod-ops'],
      steps: [
        {
          id: `step-${Date.now()}-1`,
          stepNumber: 1,
          title: newStep1,
          instruction: 'Execute diagnostic command and verify baseline response.',
          completed: false,
        },
        {
          id: `step-${Date.now()}-2`,
          stepNumber: 2,
          title: newStep2,
          instruction: 'Check recent application stderr logs for exception traces.',
          completed: false,
        },
        {
          id: `step-${Date.now()}-3`,
          stepNumber: 3,
          title: newStep3,
          instruction: 'Cycle service process and verify telemetry recovery.',
          completed: false,
        },
      ],
    });

    setNewModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    playSuccessChime();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Operations Knowledge</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-200 font-medium">Remediation Playbooks</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Standard Operating Procedures</h1>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Playbook</span>
        </button>
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Directory */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playbooks by service, tag..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* List */}
          <div className="space-y-2">
            {filteredRunbooks.map((rb) => {
              const isSelected = activeRunbook?.id === rb.id;
              const completedInRb = rb.steps.filter((s) => s.completed).length;

              return (
                <div
                  key={rb.id}
                  onClick={() => {
                    setSelectedRunbookId(rb.id);
                    playActionBeep();
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/60 shadow-xs'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white">{rb.title}</span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      ~{rb.estimatedMinutes}m
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {rb.service}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>{rb.steps.length} diagnostic steps</span>
                    {completedInRb > 0 && (
                      <span className="text-emerald-400 font-medium">
                        {completedInRb}/{rb.steps.length} executed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Active Playbook Execution View */}
        <div className="lg:col-span-8">
          {activeRunbook ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-xs">
              {/* Playbook Header */}
              <div className="pb-4 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-indigo-400 font-semibold">{activeRunbook.id}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 font-medium">{activeRunbook.service}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 tabular-nums font-mono">SLA: {activeRunbook.estimatedMinutes} min</span>
                  </div>

                  <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {percentComplete}% Complete
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white">{activeRunbook.title}</h2>
                <p className="text-xs text-slate-300 mt-1">{activeRunbook.description}</p>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${percentComplete}%` }}
                  ></div>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Execution Checklist
                </h3>

                <div className="space-y-3">
                  {activeRunbook.steps.map((step) => {
                    const isCopied = copiedSnippetId === step.id;
                    const isSimulating = simulatedStepId === step.id;

                    return (
                      <div
                        key={step.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          step.completed
                            ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => {
                                toggleRunbookStep(activeRunbook.id, step.id);
                                playActionBeep();
                              }}
                              className="mt-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              {step.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500" />
                              )}
                            </button>

                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-white">
                                Step {step.stepNumber}: {step.title}
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {step.instruction}
                              </p>

                              {step.commandOrSnippet && (
                                <div className="mt-2 relative group bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-indigo-300 overflow-x-auto">
                                  <code>{step.commandOrSnippet}</code>
                                  <div className="absolute right-2 top-2 flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleCopy(step.id, step.commandOrSnippet!)}
                                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                                      title="Copy command"
                                    >
                                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleSimulateStep(step)}
                            disabled={isSimulating}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer border border-slate-700/80"
                          >
                            <Play className="w-3 h-3 fill-current text-indigo-400" />
                            <span>{isSimulating ? 'Running...' : 'Execute'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
              Select a playbook from the list to view recovery instructions.
            </div>
          )}
        </div>
      </div>

      {/* New Playbook Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/90 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Create Remediation Playbook</h3>
            <form onSubmit={handleCreateRunbook} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Playbook Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Redis Cache Invalidation Procedure"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Target Service</label>
                  <input
                    type="text"
                    required
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Estimated Recovery (Mins)</label>
                  <input
                    type="number"
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="When to apply this playbook and precautions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg cursor-pointer shadow-xs"
                >
                  Save Playbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
