import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { IncidentCategory, IncidentSeverity } from '../types/incident';
import {
  FileQuestion,
  Sparkles,
  ArrowRight,
  Globe,
  Smartphone,
  Server,
  Database,
  Cloud,
  HelpCircle,
  Paperclip,
  CheckCircle2,
  Loader2,
  Brain,
  BookOpen,
  AlertTriangle,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { playActionBeep, playAlertChime } from '../utils/audio';

export const ReportIncidentView: React.FC = () => {
  const { reportNewIncident, isAiInvestigating, memoryBank, runbooks } = useApp();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('website');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [serviceName, setServiceName] = useState('Payment Service');
  const [affectedUsers, setAffectedUsers] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);

  // Quick Scenario Presets for immediate demonstration
  const loadPreset = (preset: 'payment' | 'database' | 'api' | 'mobile') => {
    playActionBeep();
    if (preset === 'payment') {
      setDescription('Customers on the checkout page are seeing "500 Internal Error" and cards are failing to charge. The payment webhook queue has over 200 pending transactions.');
      setCategory('payment');
      setSeverity('critical');
      setServiceName('Payment Service');
      setAffectedUsers('All customers trying to complete checkout (~2,400 sessions/hr)');
      setAttachmentName('payment_worker_exception.log');
    } else if (preset === 'database') {
      setDescription('Database CPU spiked to 98% and read queries from all microservices are timing out. Transactions appear to be queued behind exclusive row locks on ledger tables.');
      setCategory('database');
      setSeverity('critical');
      setServiceName('PostgreSQL Main Cluster');
      setAffectedUsers('Platform-wide read and write operations');
      setAttachmentName('pg_blocking_locks_dump.txt');
    } else if (preset === 'api') {
      setDescription('API Gateway is returning 504 Gateway Timeout on /api/v1/search and product listings. Ingress latency is exceeding 3,200ms.');
      setCategory('api');
      setSeverity('high');
      setServiceName('API Gateway & Ingress');
      setAffectedUsers('Approximately 20% of website search visitors');
    } else if (preset === 'mobile') {
      setDescription('The mobile app crashes immediately on launch for iOS users after tapping the cart navigation item.');
      setCategory('mobile_app');
      setSeverity('high');
      setServiceName('iOS Mobile Client');
      setAffectedUsers('iOS users on build v4.2.1');
    }
  };

  // Real-time memory correlation preview
  const matchingMemories = useMemo(() => {
    if (!description.trim()) return [];
    const q = (description + ' ' + serviceName).toLowerCase();
    return memoryBank
      .filter((mem) => {
        return (
          mem.service.toLowerCase().includes(serviceName.toLowerCase()) ||
          mem.symptoms.some((s) => q.includes(s.toLowerCase())) ||
          q.includes(mem.rootCause.toLowerCase().slice(0, 15))
        );
      })
      .slice(0, 2);
  }, [description, serviceName, memoryBank]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isAiInvestigating) return;

    playAlertChime();
    const title = description.length > 60 ? description.slice(0, 57) + '...' : description;

    await reportNewIncident({
      title,
      description,
      category,
      severity,
      affectedService: serviceName.trim() || undefined,
      affectedUsers: affectedUsers.trim() || undefined,
      attachments: attachmentName ? [{ name: attachmentName, size: '240 KB', type: 'text/log' }] : [],
    });
  };

  const severities: { id: IncidentSeverity; label: string; pCode: string; desc: string }[] = [
    { id: 'critical', label: 'Critical Outage', pCode: 'P1', desc: 'Core revenue or customer service completely offline' },
    { id: 'high', label: 'High Degradation', pCode: 'P2', desc: 'Major capability impaired with no current workaround' },
    { id: 'medium', label: 'Medium Issue', pCode: 'P3', desc: 'Partial degradation or isolated service issue' },
    { id: 'low', label: 'Low / Advisory', pCode: 'P4', desc: 'Minor cosmetic flaw or low-impact discrepancy' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
          <span>Incident Operations</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-200 font-medium">New Incident Intake</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Report Production Incident</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Submit symptoms in natural language. Incident IQ correlates past resolutions and initializes triage.
        </p>
      </div>

      {/* Quick Test Presets Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scenario Autofill Presets (Test autonomous memory matching):</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">1-CLICK DEMO</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => loadPreset('payment')}
            className="text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 transition-all cursor-pointer group"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">Payment 500 Spike</div>
            <div className="text-[10px] text-slate-400 mt-0.5">DB pool exhaustion</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('database')}
            className="text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 transition-all cursor-pointer group"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">Database Saturation</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Exclusive lock queue</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('api')}
            className="text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 transition-all cursor-pointer group"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">API Gateway 504</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Upstream latency stall</div>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('mobile')}
            className="text-left p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 transition-all cursor-pointer group"
          >
            <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">Mobile Client Crash</div>
            <div className="text-[10px] text-slate-400 mt-0.5">iOS v4.2.1 build bug</div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 shadow-xs">
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Incident Description & Observed Symptoms <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is failing? Copy customer error text, HTTP status codes, or Grafana alerts..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Affected Service & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Affected Service / Component
                </label>
                <select
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Payment Service">Payment Service</option>
                  <option value="PostgreSQL Main Cluster">PostgreSQL Main Cluster</option>
                  <option value="API Gateway & Ingress">API Gateway & Ingress</option>
                  <option value="Authentication & IAM">Authentication & IAM</option>
                  <option value="Search & Product Catalog">Search & Product Catalog</option>
                  <option value="iOS Mobile Client">iOS Mobile Client</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Incident Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="payment">Payment & Billing</option>
                  <option value="database">Database & Storage</option>
                  <option value="api">API & Microservices</option>
                  <option value="website">Web Frontend</option>
                  <option value="mobile_app">Mobile Application</option>
                  <option value="server">Infrastructure & Compute</option>
                </select>
              </div>
            </div>

            {/* Severity Matrix */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Severity Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {severities.map((s) => {
                  const isSelected = severity === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSeverity(s.id);
                        playActionBeep();
                      }}
                      className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? s.id === 'critical'
                            ? 'bg-rose-950/40 border-rose-500 text-white font-semibold shadow-xs'
                            : 'bg-indigo-600/20 border-indigo-500 text-white font-semibold shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold">{s.pCode}</span>
                        {isSelected && <span className="text-[10px] text-indigo-400">Selected</span>}
                      </div>
                      <div className="text-[11px] font-medium text-slate-200 mt-1">{s.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Blast Radius / Attachment */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                {showOptionalDetails ? '- Hide optional scope details' : '+ Add user blast radius & log attachments'}
              </button>

              {showOptionalDetails && (
                <div className="mt-3 space-y-3 pt-3 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Estimated User Blast Radius
                    </label>
                    <input
                      type="text"
                      value={affectedUsers}
                      onChange={(e) => setAffectedUsers(e.target.value)}
                      placeholder="e.g. Approximately 1,200 active checkout sessions"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Log Attachment or Error Dump File
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={attachmentName}
                        onChange={(e) => setAttachmentName(e.target.value)}
                        placeholder="e.g. kubernetes_pod_stderr.log"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setAttachmentName('production_stack_trace.log')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Sample Log
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="submit"
                disabled={!description.trim() || isAiInvestigating}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
              >
                {isAiInvestigating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching Memory & Initializing Triage Room...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Incident Investigation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Autonomous Memory Correlation Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Brain className="w-4 h-4 text-indigo-400" />
                <span>Memory Correlation Preview</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                LIVE RECALL
              </span>
            </div>

            <p className="text-xs text-slate-400">
              As you type symptoms, Incident IQ scans verified post-mortems and suggests recovery runbooks before you submit.
            </p>

            {matchingMemories.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                Type symptoms or pick a preset to preview correlated past incidents.
              </div>
            ) : (
              <div className="space-y-2.5">
                {matchingMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-indigo-400 text-[11px] font-mono">
                      <span>{mem.service}</span>
                      <span className="text-emerald-400 font-semibold">Verified Fix Available</span>
                    </div>
                    <div className="font-semibold text-slate-200">
                      {mem.incidentTitle}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      <span className="text-slate-500">Root Cause:</span> {mem.rootCause}
                    </div>
                    <div className="text-[11px] text-emerald-300/90 pt-1 border-t border-slate-900">
                      <span className="text-slate-500">Fix:</span> {mem.successfulFix}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
