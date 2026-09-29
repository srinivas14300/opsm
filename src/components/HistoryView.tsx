import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Incident, IncidentSeverity, IncidentStatus } from '../types/incident';
import {
  History,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Download,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { playActionBeep } from '../utils/audio';

export const HistoryView: React.FC = () => {
  const { incidents, setViewHistoricalModalIncident } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const services = Array.from(new Set(incidents.map((i) => i.affectedService)));

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (selectedService !== 'all' && inc.affectedService !== selectedService) return false;
      if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'all' && inc.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          inc.id.toLowerCase().includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          inc.affectedService.toLowerCase().includes(q) ||
          inc.description.toLowerCase().includes(q) ||
          (inc.rootCause && inc.rootCause.toLowerCase().includes(q)) ||
          (inc.resolutionNotes && inc.resolutionNotes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [incidents, selectedService, selectedSeverity, selectedStatus, searchQuery]);

  const handleExportCSV = () => {
    playActionBeep();
    const headers = ['IncidentID', 'Title', 'Service', 'Severity', 'Status', 'DurationMins', 'CreatedAt', 'RootCause'];
    const rows = filteredIncidents.map((i) => [
      `"${i.id}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.affectedService}"`,
      `"${i.severity}"`,
      `"${i.status}"`,
      i.durationMinutes || 0,
      `"${i.createdAt}"`,
      `"${(i.rootCause || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `incident_iq_archive_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Incident Records</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-200 font-medium">Historical Archive</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Incident History & Audit Log</h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Service</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Services</option>
              {services.map((svc) => (
                <option key={svc} value={svc}>{svc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical (P1)</option>
              <option value="high">High (P2)</option>
              <option value="medium">Medium (P3)</option>
              <option value="low">Low (P4)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="resolved">Resolved / Closed</option>
              <option value="investigating">Investigating</option>
              <option value="fix_applied">Fix Applied</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Search Query</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, keywords, root cause..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Archive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th className="py-2.5 px-4 font-normal">Incident</th>
                <th className="py-2.5 px-4 font-normal">Service & Root Cause</th>
                <th className="py-2.5 px-4 font-normal">Date</th>
                <th className="py-2.5 px-4 font-normal">Status</th>
                <th className="py-2.5 px-4 font-normal tabular-nums text-right">MTTR</th>
                <th className="py-2.5 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                    No historical records match filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <div className="font-mono text-slate-200 font-semibold">{inc.id}</div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded mt-1 inline-block ${
                        inc.severity === 'critical' ? 'bg-rose-950/50 text-rose-400 border border-rose-800/40' :
                        inc.severity === 'high' ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {inc.severity.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top max-w-md">
                      <div className="font-semibold text-slate-100">{inc.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {inc.description}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        <span className="text-slate-500 font-medium">{inc.affectedService}</span>
                        {inc.rootCause && (
                          <span className="italic text-slate-400"> · Cause: {inc.rootCause}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 align-top whitespace-nowrap text-slate-400 tabular-nums">
                      {inc.createdAt}
                    </td>

                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Resolved
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top whitespace-nowrap text-right font-mono tabular-nums text-slate-300">
                      {inc.durationMinutes ? `${inc.durationMinutes}m` : '-'}
                    </td>

                    <td className="py-3 px-4 align-top whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setViewHistoricalModalIncident(inc);
                          playActionBeep();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-700 bg-slate-800 text-[11px] font-medium text-slate-200 hover:bg-slate-750 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
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
