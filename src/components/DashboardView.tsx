import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Incident, IncidentSeverity, IncidentStatus } from '../types/incident';
import {
  AlertTriangle,
  Flame,
  Search,
  CheckCircle,
  Plus,
  ArrowRight,
  Clock,
  ExternalLink,
  Brain,
  BookOpen,
  Filter,
  RefreshCw,
  Radio,
  FileCheck,
  TrendingDown,
  ShieldCheck,
  ArrowUpDown,
} from 'lucide-react';
import { playActionBeep } from '../utils/audio';

export const DashboardView: React.FC = () => {
  const {
    incidents,
    setActiveTab,
    setSelectedIncidentId,
    currentUser,
    setViewHistoricalModalIncident,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'active' | 'critical' | 'resolved' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'duration'>('date');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Metrics
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
  const criticalIncidents = activeIncidents.filter((i) => i.severity === 'critical');
  const investigatingIncidents = activeIncidents.filter((i) => i.status === 'investigating');
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved' || i.status === 'closed');

  const handleRefresh = () => {
    setIsRefreshing(true);
    playActionBeep();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Filtered and sorted incidents
  const displayedIncidents = useMemo(() => {
    let result = incidents.filter((inc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          inc.id.toLowerCase().includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          inc.description.toLowerCase().includes(q) ||
          inc.affectedService.toLowerCase().includes(q) ||
          (inc.rootCause && inc.rootCause.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filter === 'active') return inc.status !== 'resolved' && inc.status !== 'closed';
      if (filter === 'critical') return inc.severity === 'critical';
      if (filter === 'resolved') return inc.status === 'resolved' || inc.status === 'closed';
      if (filter === 'mine') return inc.reportedBy.email === currentUser.email || inc.assignedTo?.email === currentUser.email;
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'severity') {
        const weight: Record<IncidentSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        return weight[b.severity] - weight[a.severity];
      }
      if (sortBy === 'duration') {
        return (b.durationMinutes || 0) - (a.durationMinutes || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [incidents, searchQuery, filter, sortBy, currentUser]);

  const getSeverityBadge = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            P1 CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            P2 HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-sky-400 bg-sky-950/40 border border-sky-800/60 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            P3 MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-slate-400 bg-slate-800/40 border border-slate-700/60 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            P4 LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Investigating
          </span>
        );
      case 'fix_applied':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
            Fix Applied
          </span>
        );
      case 'monitoring':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
            Monitoring
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
            Reported
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <span>Production Systems</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-200 font-medium">Incident Command</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">System Health & Incident Operations</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-white transition-all cursor-pointer ${
              isRefreshing ? 'rotate-180 transition-transform duration-500' : ''
            }`}
            title="Refresh incident telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900 border border-slate-800/90 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Active Incidents</span>
            <AlertTriangle className={`w-4 h-4 ${activeIncidents.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
            {activeIncidents.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeIncidents.length > 0 ? 'Active team triage required' : 'All systems operating normally'}
          </p>
        </div>

        <div className={`border p-4 rounded-xl shadow-xs ${
          criticalIncidents.length > 0
            ? 'bg-rose-950/20 border-rose-800/50'
            : 'bg-slate-900 border-slate-800/90'
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">P1 Blockers</span>
            <Flame className={`w-4 h-4 ${criticalIncidents.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold tabular-nums tracking-tight ${criticalIncidents.length > 0 ? 'text-rose-300' : 'text-white'}`}>
            {criticalIncidents.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {criticalIncidents.length > 0 ? 'Customer checkout degradation' : '0 critical availability blockers'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">MTTR (Mean Recovery)</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
            13.4m
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-medium font-mono">↓ 32%</span>
            <span>faster with memory recall</span>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800/90 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Verified Solutions</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
            {resolvedIncidents.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Indexed in Agent Memory Bank
          </p>
        </div>
      </div>

      {/* Prominent Active War Room Banner */}
      {activeIncidents.length > 0 && (
        <div className="bg-slate-900 border-l-4 border-l-amber-500 border-y border-r border-slate-800 p-4.5 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                <span className="font-mono text-amber-400 font-semibold">{activeIncidents[0].id}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-300 font-medium">{activeIncidents[0].affectedService}</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-rose-400 font-medium">P1 SEVERITY</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">Reported {activeIncidents[0].createdAt}</span>
              </div>
              <h2 className="text-sm font-semibold text-white">
                {activeIncidents[0].title}
              </h2>
              <p className="text-xs text-slate-300 mt-1 line-clamp-1 max-w-2xl">
                {activeIncidents[0].description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setSelectedIncidentId(activeIncidents[0].id);
                setActiveTab('investigation');
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
            >
              <span>Join Triage Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Incident Operational Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {/* Table Filter & Search Controls */}
        <div className="p-3.5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented status filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80 overflow-x-auto">
            {[
              { id: 'all', label: 'All Incidents', count: incidents.length },
              { id: 'active', label: 'Active', count: activeIncidents.length },
              { id: 'critical', label: 'Critical', count: criticalIncidents.length },
              { id: 'resolved', label: 'Resolved', count: resolvedIncidents.length },
              { id: 'mine', label: 'My Incidents' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilter(tab.id as any);
                  playActionBeep();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  filter === tab.id
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-1 rounded ${
                    filter === tab.id ? 'bg-slate-700 text-slate-200' : 'text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by ID, service, error..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-400">
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs outline-none cursor-pointer"
              >
                <option value="date" className="bg-slate-900 text-slate-200">Recent First</option>
                <option value="severity" className="bg-slate-900 text-slate-200">Severity</option>
                <option value="duration" className="bg-slate-900 text-slate-200">Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incidents Table / High-Density Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-2.5 px-4 font-normal">Incident</th>
                <th className="py-2.5 px-4 font-normal">Service & Details</th>
                <th className="py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4 font-normal">Responder</th>
                <th className="py-2.5 px-4 font-normal tabular-nums text-right">Duration</th>
                <th className="py-2.5 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No incidents match current filter or search criteria.
                  </td>
                </tr>
              ) : (
                displayedIncidents.map((incident) => {
                  const isResolved = incident.status === 'resolved' || incident.status === 'closed';

                  return (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-850/40 transition-colors group"
                    >
                      {/* ID & Severity */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-mono text-slate-200 font-medium">
                          {incident.id}
                        </div>
                        <div className="mt-1">
                          {getSeverityBadge(incident.severity)}
                        </div>
                      </td>

                      {/* Title & Root Cause */}
                      <td className="py-3 px-4 align-top max-w-md">
                        <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {incident.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {incident.description}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                          <span className="font-medium text-slate-400">{incident.affectedService}</span>
                          {incident.rootCause && (
                            <>
                              <span>·</span>
                              <span className="truncate text-slate-400 italic">Cause: {incident.rootCause}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        {getStatusBadge(incident.status)}
                      </td>

                      {/* Responder */}
                      <td className="py-3 px-4 align-top whitespace-nowrap text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            {incident.reportedBy.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[11px] text-slate-300 truncate max-w-[100px]">
                            {incident.reportedBy.name}
                          </span>
                        </div>
                      </td>

                      {/* Duration / SLA */}
                      <td className="py-3 px-4 align-top whitespace-nowrap text-right font-mono tabular-nums text-slate-400">
                        {incident.durationMinutes ? (
                          <span className="text-emerald-400 font-medium">
                            {incident.durationMinutes}m
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium animate-pulse">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top whitespace-nowrap text-right">
                        {isResolved ? (
                          <button
                            onClick={() => setViewHistoricalModalIncident(incident)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-[11px] font-medium text-slate-200 hover:bg-slate-750 transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                            <span>View Fix</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedIncidentId(incident.id);
                              setActiveTab('investigation');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Radio className="w-3 h-3 text-amber-400" />
                            <span>Triage</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Structured Operational Modules (Playbooks, Memory, Post-Mortems) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('runbooks')}
          className="bg-slate-900 border border-slate-800/90 p-4 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer group shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
            Remediation Playbooks
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Standard recovery runbooks with executable diagnostic commands and rollback steps.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('memory')}
          className="bg-slate-900 border border-slate-800/90 p-4 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer group shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
            <Brain className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
            Agent Memory Bank
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Historical incident index correlating symptoms with verified root causes and proven fixes.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('post-mortem')}
          className="bg-slate-900 border border-slate-800/90 p-4 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer group shadow-xs"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
            <FileCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
            Post-Incident Reviews
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Standardized 5-Whys root cause analysis, preventive action trackers, and formal sign-offs.
          </p>
        </div>
      </div>
    </div>
  );
};
