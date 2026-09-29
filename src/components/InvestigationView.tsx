import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Incident, IncidentStatus, RecommendedAction } from '../types/incident';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  ExternalLink,
  Send,
  Loader2,
  FileCheck,
  ChevronRight,
  Activity,
  Bot,
  User,
  BookOpen,
  Terminal,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Radio,
  Check,
  Zap,
  Brain,
} from 'lucide-react';
import { ResolutionModal } from './ResolutionModal';
import { playActionBeep, playAlertChime, playSuccessChime } from '../utils/audio';

export const InvestigationView: React.FC = () => {
  const {
    incidents,
    selectedIncidentId,
    setActiveTab,
    runAction,
    isSimulatingAction,
    updateIncidentStatus,
    chatMessages,
    sendIncidentChatMessage,
    currentUser,
    setViewHistoricalModalIncident,
    setSelectedIncidentId,
  } = useApp();

  const [dangerousModalAction, setDangerousModalAction] = useState<RecommendedAction | null>(null);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'actions' | 'logs' | 'playbook'>('actions');

  const incident = incidents.find((i) => i.id === selectedIncidentId) || incidents[0];

  if (!incident) {
    return (
      <div className="p-12 text-center text-slate-400">
        <p>No active incident selected.</p>
        <button
          onClick={() => setActiveTab('dashboard')}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Find similar incident from memory
  const similarIncident = incidents.find(
    (i) => incident.similarIncidentIds && incident.similarIncidentIds.includes(i.id)
  );

  const pipelineSteps: { key: IncidentStatus; label: string }[] = [
    { key: 'reported', label: '1. Reported' },
    { key: 'investigating', label: '2. Triage & Diagnosis' },
    { key: 'fix_applied', label: '3. Remediation' },
    { key: 'monitoring', label: '4. Monitoring' },
    { key: 'resolved', label: '5. Resolved' },
  ];

  const currentStepIdx = pipelineSteps.findIndex(
    (s) => s.key === (incident.status === 'closed' ? 'resolved' : incident.status)
  );

  const handleActionClick = (action: RecommendedAction) => {
    if (action.status === 'completed') return;

    if (action.isDangerous) {
      setDangerousModalAction(action);
      playAlertChime();
    } else {
      playActionBeep();
      runAction(incident.id, action.id);
    }
  };

  const handleConfirmDangerousAction = async () => {
    if (!dangerousModalAction) return;
    const actionToRun = dangerousModalAction;
    setDangerousModalAction(null);
    playActionBeep();
    await runAction(incident.id, actionToRun.id);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const text = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);
    playActionBeep();
    await sendIncidentChatMessage(incident.id, text);
    setIsSendingChat(false);
  };

  const currentMessages = chatMessages[incident.id] || [];

  return (
    <div className="space-y-5">
      {/* Incident Header & Live War Room HUD */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono text-indigo-400 font-semibold">{incident.id}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-200 font-medium">{incident.affectedService}</span>
              <span className="text-slate-500">·</span>
              <span className="font-mono text-rose-400 font-semibold uppercase">{incident.severity} SEVERITY</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Commander: {incident.reportedBy.name}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">{incident.title}</h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">{incident.description}</p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {incident.status !== 'resolved' && incident.status !== 'closed' ? (
              <button
                onClick={() => {
                  setResolutionModalOpen(true);
                  playActionBeep();
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve Incident</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedIncidentId(incident.id);
                  setActiveTab('post-mortem');
                }}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-indigo-500/40 font-medium px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileCheck className="w-4 h-4" />
                <span>View Post-Mortem</span>
              </button>
            )}
          </div>
        </div>

        {/* Operational Lifecycle Pipeline */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {pipelineSteps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div
                  key={step.key}
                  onClick={() => {
                    if (currentUser.role === 'admin' || currentUser.role === 'support') {
                      updateIncidentStatus(incident.id, step.key);
                      playActionBeep();
                    }
                  }}
                  className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-indigo-500/60 bg-indigo-500/10 text-white font-semibold shadow-xs'
                      : isPast
                      ? 'border-slate-800 bg-slate-950/60 text-emerald-400'
                      : 'border-slate-800/40 bg-slate-950/20 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] truncate">{step.label}</span>
                    {isPast && <Check className="w-3 h-3 text-emerald-400" />}
                    {isCurrent && <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Investigation Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Remediation Console & Execution Terminal */}
        <div className="lg:col-span-7 space-y-4">
          {/* Subtabs: Action Steps / Terminal Output / Runbook */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveConsoleTab('actions')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeConsoleTab === 'actions'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Remediation Actions
                </button>
                <button
                  onClick={() => setActiveConsoleTab('logs')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeConsoleTab === 'logs'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3 h-3 text-slate-400" />
                  <span>Execution Logs</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                {incident.recommendedActions.filter((a) => a.status === 'completed').length}/
                {incident.recommendedActions.length} completed
              </span>
            </div>

            {/* Content: Remediation Actions Checklist */}
            {activeConsoleTab === 'actions' && (
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-400 mb-2">
                  Sequential actions synthesized from historical runbooks. Production-altering commands require confirmation.
                </p>

                <div className="space-y-2.5">
                  {incident.recommendedActions.map((action, idx) => {
                    const isCompleted = action.status === 'completed';
                    const isRunning = action.status === 'running' || isSimulatingAction;

                    return (
                      <div
                        key={action.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCompleted
                            ? 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5 ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-white">
                                  {action.title}
                                </span>
                                {action.isDangerous ? (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/50 text-rose-400 border border-rose-800/50">
                                    DANGEROUS CMD
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                    SAFE DIAGNOSTIC
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {action.description}
                              </p>

                              {action.instructions && (
                                <div className="mt-2 bg-slate-900 border border-slate-800 rounded p-2 text-[11px] font-mono text-indigo-300 overflow-x-auto">
                                  <code>{action.instructions}</code>
                                </div>
                              )}

                              {action.executionResult && (
                                <div className="mt-2 bg-slate-900 border-l-2 border-l-emerald-500 border-y border-r border-slate-800/80 p-2 text-[11px] font-mono text-emerald-300">
                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Execution Log:</div>
                                  <pre className="whitespace-pre-wrap">{action.executionResult}</pre>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleActionClick(action)}
                                disabled={isRunning}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                  action.isDangerous
                                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                                }`}
                              >
                                {isRunning ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Executing...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    <span>Execute</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Content: Execution Logs Terminal */}
            {activeConsoleTab === 'logs' && (
              <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 space-y-2 max-h-[420px] overflow-y-auto">
                <div className="text-slate-500 text-[11px] border-b border-slate-850 pb-2">
                  Live Diagnostics Console · Session ID: {incident.id}-STREAM
                </div>
                <div className="text-emerald-400 text-[11px]">
                  [00:00:01] Initializing connection to cluster agent (prod-us-east-1)...
                </div>
                <div className="text-slate-400 text-[11px]">
                  [00:00:03] Health check query: SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
                </div>
                <div className="text-amber-400 text-[11px]">
                  [00:00:04] WARNING: Active connection count 98/100 threshold reached on payment_prod database.
                </div>
                {incident.recommendedActions
                  .filter((a) => a.executionResult)
                  .map((a) => (
                    <div key={a.id} className="pt-2 text-indigo-300 border-t border-slate-900">
                      <div className="text-slate-500 text-[10px]">$ {a.title}</div>
                      <div className="text-emerald-300">{a.executionResult}</div>
                    </div>
                  ))}
                <div className="text-slate-500 pt-2 animate-pulse">
                  &gt; Diagnostics listener awaiting user input...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): AI Copilot & Memory Precedent */}
        <div className="lg:col-span-5 space-y-4">
          {/* Historical Precedent / Memory Card */}
          {similarIncident && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span>Historical Precedent Matched</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  98% Match
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="font-mono text-slate-300 font-semibold">{similarIncident.id}</span>
                  <span>Resolved in {similarIncident.durationMinutes || 12}m</span>
                </div>
                <div className="font-semibold text-slate-200">
                  {similarIncident.title}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {similarIncident.rootCause || 'Database connection pool was saturated under unindexed query spike.'}
                </p>

                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setViewHistoricalModalIncident(similarIncident)}
                    className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    <span>View Proven Solution</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Incident Copilot Channel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col h-[420px]">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white">Incident Copilot</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                ACTIVE
              </span>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-900/60">
              {currentMessages.map((msg) => {
                const isAi = msg.sender === 'ai';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        isAi
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-lg p-2.5 text-xs leading-relaxed ${
                        isAi
                          ? 'bg-slate-950 border border-slate-800 text-slate-200'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div
                        className={`text-[9px] mt-1 ${
                          isAi ? 'text-slate-500' : 'text-indigo-200'
                        } text-right`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isSendingChat && (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Agent analyzing hypothesis...</span>
                </div>
              )}
            </div>

            {/* Chat prompt input */}
            <form onSubmit={handleSendChat} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask hypothesis, check query, or request action..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingChat}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Dangerous Action Safeguard Modal */}
      {dangerousModalAction && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-600/40 rounded-xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Authorized Confirmation Required</h3>
            </div>

            <p className="text-xs text-slate-300">
              You are about to execute a production-altering operation:
            </p>

            <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg text-xs font-mono text-slate-200">
              <div className="font-semibold text-rose-300">{dangerousModalAction.title}</div>
              <div className="text-[11px] text-slate-400 mt-1">{dangerousModalAction.description}</div>
              {dangerousModalAction.instructions && (
                <div className="mt-2 text-indigo-300 overflow-x-auto">$ {dangerousModalAction.instructions}</div>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Executing this will cycle connections and restart container pods on production cluster. This operation is recorded in the permanent audit trail.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDangerousModalAction(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDangerousAction}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-md cursor-pointer transition-colors shadow-sm"
              >
                Confirm & Execute Operation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {resolutionModalOpen && (
        <ResolutionModal
          incident={incident}
          onClose={() => setResolutionModalOpen(false)}
        />
      )}
    </div>
  );
};
