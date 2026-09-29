import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types/incident';
import {
  ShieldAlert,
  Plus,
  LayoutDashboard,
  Activity,
  BookOpen,
  Brain,
  History,
  FileCheck,
  Settings,
  ChevronDown,
  LogOut,
  Building2,
  Search,
  Volume2,
  VolumeX,
  Keyboard,
  Check,
  Radio,
} from 'lucide-react';
import { isSoundEnabled, toggleSound, playActionBeep } from '../utils/audio';

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onOpenShortcuts: () => void;
}

interface NavItem {
  key: 'dashboard' | 'report' | 'investigation' | 'history' | 'runbooks' | 'memory' | 'post-mortem' | 'settings';
  label: string;
  icon: any;
  count?: number;
  pulse?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCommandPalette,
  onOpenShortcuts,
}) => {
  const {
    currentUser,
    switchRole,
    logout,
    activeTab,
    setActiveTab,
    organizationName,
    setOrganizationName,
    incidents,
  } = useApp();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const activeIncidents = incidents.filter(
    (i) => i.status !== 'resolved' && i.status !== 'closed'
  );
  const criticalCount = activeIncidents.filter((i) => i.severity === 'critical').length;

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Overview', icon: LayoutDashboard, count: incidents.length },
    {
      key: 'investigation',
      label: 'Triage Room',
      icon: Activity,
      count: activeIncidents.length > 0 ? activeIncidents.length : undefined,
      pulse: activeIncidents.length > 0,
    },
    { key: 'runbooks', label: 'Playbooks', icon: BookOpen },
    { key: 'memory', label: 'Knowledge Base', icon: Brain },
    { key: 'history', label: 'Archive', icon: History },
    { key: 'post-mortem', label: 'Post-Mortems', icon: FileCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 text-slate-100">
      {/* Primary Command Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left Zone: Brand + Org Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="text-sm font-semibold tracking-tight text-white">Incident IQ</span>
              <span className="text-[10px] text-slate-400 font-normal">Command Center</span>
            </div>
          </button>

          {/* Org Selector Dropdown */}
          <div className="relative hidden md:block pl-3 border-l border-slate-800">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center gap-2 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-md px-2.5 py-1.5 transition-colors cursor-pointer"
              title="Workspace Scope"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[130px] font-medium">{organizationName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {orgDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-lg shadow-xl py-1.5 z-50 text-slate-200"
                onMouseLeave={() => setOrgDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Organization Tenant
                </div>
                {[
                  'Acme Payments & Cloud Platform',
                  'Acme Health Systems (HIPAA)',
                  'Acme Staging & Sandbox',
                ].map((org) => (
                  <button
                    key={org}
                    onClick={() => {
                      setOrganizationName(org);
                      setOrgDropdownOpen(false);
                      playActionBeep();
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                      organizationName === org
                        ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{org}</span>
                    {organizationName === org && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Zone: Global Command Search Trigger */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              <span>Search incidents, playbooks, memory...</span>
            </div>
            <kbd className="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/80">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Zone: Actions & Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* System Health Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800/80 text-xs">
            <span className="relative flex h-2 w-2">
              {criticalCount > 0 ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              )}
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {criticalCount > 0 ? `${criticalCount} Critical` : '99.98% SLA Nominal'}
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-md border text-slate-400 hover:text-white transition-colors cursor-pointer ${
              soundOn
                ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                : 'bg-transparent border-transparent hover:bg-slate-800'
            }`}
            title={soundOn ? 'Sound alerts active (M to mute)' : 'Sound alerts muted (M to unmute)'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Keyboard Shortcuts Helper */}
          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex p-1.5 rounded-md border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-md text-xs transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Incident</span>
            <span className="sm:hidden">Report</span>
          </button>

          {/* Role & Persona Menu */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-md px-2 py-1.5 text-xs text-slate-300 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-md bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold text-indigo-300">
                {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="font-medium text-slate-200 truncate max-w-[95px]">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 capitalize">{currentUser.role}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-lg shadow-xl py-2 z-50 text-slate-200"
                onMouseLeave={() => setRoleDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-100">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    <span className="uppercase font-semibold tracking-wider">Role: {currentUser.role}</span>
                  </div>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Persona (Demo Sandbox):
                </div>

                {(['employee', 'support', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setRoleDropdownOpen(false);
                      playActionBeep();
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                      currentUser.role === r ? 'text-indigo-400 font-semibold bg-indigo-500/10' : 'text-slate-300'
                    }`}
                  >
                    <span className="capitalize">
                      {r === 'employee' ? 'Sarah Chen (Employee)' : r === 'support' ? 'Marcus Vance (Support/IT)' : 'Elena Rostova (Admin)'}
                    </span>
                    {currentUser.role === r && <span className="text-[10px] text-indigo-400">Active</span>}
                  </button>
                ))}

                <div className="border-t border-slate-800 mt-2 pt-1">
                  <button
                    onClick={() => {
                      setRoleDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Horizontal Navigation Bar */}
      <div className="border-t border-slate-800/80 bg-slate-900/60 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  playActionBeep();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-mono tabular-nums ${
                      item.pulse
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
