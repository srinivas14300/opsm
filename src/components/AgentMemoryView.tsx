import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AgentMemoryEntry } from '../types/incident';
import {
  Brain,
  Search,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Database,
  Filter,
  Check,
} from 'lucide-react';
import { playActionBeep, playSuccessChime } from '../utils/audio';

export const AgentMemoryView: React.FC = () => {
  const { memoryBank, teachAgentMemory, verifyMemory, currentUser, setViewHistoricalModalIncident } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [teachModalOpen, setTeachModalOpen] = useState(false);
  
  // Verification states
  const [verifyingMemoryId, setVerifyingMemoryId] = useState<string | null>(null);
  const [verificationNote, setVerificationNote] = useState('');

  // Teach modal state
  const [newTitle, setNewTitle] = useState('');
  const [newService, setNewService] = useState('Payment Service');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newSuccessfulFix, setNewSuccessfulFix] = useState('');
  const [newRunbookTitle, setNewRunbookTitle] = useState('Payment Service Recovery');
  const [newMinutes, setNewMinutes] = useState(10);
  const [newLessons, setNewLessons] = useState('');

  // Extract unique services
  const services = Array.from(new Set(memoryBank.map((m) => m.service)));

  const filteredMemories = memoryBank.filter((mem) => {
    if (selectedService !== 'all' && mem.service !== selectedService) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      mem.incidentTitle.toLowerCase().includes(q) ||
      mem.service.toLowerCase().includes(q) ||
      mem.rootCause.toLowerCase().includes(q) ||
      mem.successfulFix.toLowerCase().includes(q) ||
      mem.symptoms.some((s) => s.toLowerCase().includes(q))
    );
  });

  const handleTeachSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRootCause.trim() || !newSuccessfulFix.trim()) return;

    teachAgentMemory({
      incidentId: `INC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      incidentTitle: newTitle,
      service: newService,
      symptoms: newSymptoms.split('\n').filter(Boolean),
      rootCause: newRootCause,
      successfulFix: newSuccessfulFix,
      successfulRunbookTitle: newRunbookTitle,
      failedApproaches: [],
      resolutionTimeMinutes: newMinutes,
      date: new Date().toISOString().split('T')[0],
      lessonsLearned: newLessons || 'Documented knowledge entry.',
    });

    setTeachModalOpen(false);
    setNewTitle('');
    setNewRootCause('');
    setNewSuccessfulFix('');
    setNewSymptoms('');
    playSuccessChime();
  };

  const handleVerifyMemorySubmit = async (mem: AgentMemoryEntry) => {
    if (!verificationNote.trim()) return;
    playSuccessChime();
    await verifyMemory(mem.incidentId, currentUser.name, verificationNote.trim());
    setVerifyingMemoryId(null);
    setVerificationNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Incident Intelligence</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-200 font-medium">Knowledge Base & Memory</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Verified Incident Memories</h1>
        </div>

        <button
          onClick={() => {
            setTeachModalOpen(true);
            playActionBeep();
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Teach Incident Memory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              setSelectedService('all');
              playActionBeep();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              selectedService === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Services ({memoryBank.length})
          </button>
          {services.map((svc) => (
            <button
              key={svc}
              onClick={() => {
                setSelectedService(svc);
                playActionBeep();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                selectedService === svc
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {svc}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms, root causes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.length === 0 ? (
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            No knowledge entries found matching current filter or search criteria.
          </div>
        ) : (
          filteredMemories.map((mem) => {
            const isDraft = mem.status === 'DRAFT';
            const isVerifying = verifyingMemoryId === mem.id;

            return (
              <div
                key={mem.id}
                className={`bg-slate-900 border rounded-xl p-5 space-y-3.5 transition-all shadow-xs flex flex-col justify-between ${
                  isDraft ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-indigo-400 font-semibold">{mem.incidentId}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-300 font-medium">{mem.service}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      isDraft 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse' 
                        : 'bg-slate-950 text-slate-400 border-slate-850'
                    }`}>
                      {mem.status || 'VERIFIED'}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    {mem.incidentTitle}
                  </h3>

                  {/* Symptoms list */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Observed Symptoms
                    </span>
                    <div className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 space-y-0.5">
                      {mem.symptoms.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                          <span className="text-indigo-400 shrink-0">•</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Root Cause & Fix */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Root Cause: </span>
                      <span className="text-slate-200">{mem.rootCause}</span>
                    </div>
                    <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2 text-emerald-300 text-[11px]">
                      <span className="font-semibold text-emerald-400">Verified Fix: </span>
                      {mem.successfulFix}
                    </div>
                  </div>
                </div>

                {/* Draft Verification Loop Dialog */}
                {isDraft && !isVerifying && (currentUser.role === 'admin' || currentUser.role === 'support') && (
                  <div className="pt-2 border-t border-amber-500/20 flex justify-end">
                    <button
                      onClick={() => {
                        setVerifyingMemoryId(mem.id);
                        setVerificationNote('');
                        playActionBeep();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Review & Verify Memory</span>
                    </button>
                  </div>
                )}

                {isDraft && isVerifying && (
                  <div className="pt-3 border-t border-amber-500/20 space-y-2.5">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      Approval / Verification Note
                    </label>
                    <textarea
                      rows={2}
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      placeholder="e.g. Approved post-mortem. Connection pool saturation confirmed by telemetry logs."
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-end gap-2 text-[10px]">
                      <button
                        onClick={() => setVerifyingMemoryId(null)}
                        className="px-2 py-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleVerifyMemorySubmit(mem)}
                        disabled={!verificationNote.trim()}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-medium cursor-pointer"
                      >
                        Approve & Promote
                      </button>
                    </div>
                  </div>
                )}

                {/* Verified Metadata */}
                {!isDraft && mem.verifiedBy && (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Verified by {mem.verifiedBy}</span>
                    <span>Note: {mem.verificationNote}</span>
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Recovery time: <strong className="font-mono text-slate-200">{mem.resolutionTimeMinutes}m</strong></span>
                  {mem.successfulRunbookTitle && (
                    <span className="text-indigo-400 font-medium">
                      Playbook: {mem.successfulRunbookTitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Teach Knowledge Modal */}
      {teachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/90 rounded-xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Teach Knowledge Base Entry</h3>
            <form onSubmit={handleTeachSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Incident Title / Scenario</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Postgres Connection Pool Starvation under Batch Queries"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Service</label>
                  <input
                    type="text"
                    required
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Resolution Time (Mins)</label>
                  <input
                    type="number"
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Observed Symptoms (one per line)</label>
                <textarea
                  rows={2}
                  required
                  value={newSymptoms}
                  onChange={(e) => setNewSymptoms(e.target.value)}
                  placeholder="HTTP 500 errors on checkout&#10;Database connection pool 100% full"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Identified Root Cause</label>
                <input
                  type="text"
                  required
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  placeholder="e.g. Unindexed analytics queries exhausted active worker slots"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Verified Resolution Procedure</label>
                <textarea
                  rows={2}
                  required
                  value={newSuccessfulFix}
                  onChange={(e) => setNewSuccessfulFix(e.target.value)}
                  placeholder="e.g. Increased max_connections to 100, killed hanging PID, and cycled payment pods"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTeachModalOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg cursor-pointer shadow-xs"
                >
                  Save to Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
