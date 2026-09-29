import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types/incident';
import { ShieldAlert, Lock, Mail, ArrowRight, UserCheck, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SEED_USERS } from '../data/seedData';
import { playActionBeep, playSuccessChime } from '../utils/audio';

export const LoginScreen: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('marcus.vance@acmefinance.io');
  const [password, setPassword] = useState('••••••••••••');
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('support');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    playSuccessChime();
    login(email, selectedRole);
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = SEED_USERS.find((u) => u.role === role);
    if (user) {
      playSuccessChime();
      login(user.email, user.role);
    }
  };

  const handleGoogleLogin = () => {
    playSuccessChime();
    login('engineer.google@acmefinance.io', 'support');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 items-center justify-center text-indigo-400 mb-3 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Incident IQ</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Autonomous memory & guided resolution for production systems
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {isCreateAccount ? 'Create Responder Account' : 'Workspace Authentication'}
            </h2>
            <button
              onClick={() => {
                setIsCreateAccount(!isCreateAccount);
                playActionBeep();
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
            >
              {isCreateAccount ? 'Sign in instead' : 'New Account'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-medium text-slate-300">
                  Password
                </label>
                {!isCreateAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setForgotModalOpen(true);
                      playActionBeep();
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {isCreateAccount && (
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Initial Role Assignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['employee', 'support', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium capitalize transition-colors cursor-pointer ${
                        selectedRole === r
                          ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
            >
              <span>{isCreateAccount ? 'Create Account & Enter' : 'Enter Workspace'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Social login */}
          <div className="mt-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z" />
              </svg>
              <span>Single Sign-On with Google Workspace</span>
            </button>
          </div>

          {/* Quick Persona Switcher for Immediate Evaluation */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Instant Test Personas:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('employee')}
                className="text-left p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-medium text-slate-200">Sarah Chen</div>
                <div className="text-[10px] text-slate-500">Employee</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('support')}
                className="text-left p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/40 hover:border-indigo-500/60 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-medium text-indigo-300">Marcus Vance</div>
                <div className="text-[10px] text-indigo-400">Support / IT</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="text-left p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="text-[11px] font-medium text-slate-200">Elena Rostova</div>
                <div className="text-[10px] text-slate-500">Admin</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>SOC 2 Type II Certified</span>
          </span>
          <span>·</span>
          <span>Role Isolation Enforced</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-6 text-slate-100 shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2">Reset Password</h3>
            {resetSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs text-slate-200 font-medium">Reset instructions dispatched!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  A magic password reset link was sent to {resetEmail}.
                </p>
                <button
                  onClick={() => {
                    setForgotModalOpen(false);
                    setResetSent(false);
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-md cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-4">
                  Enter your corporate email address to receive password reset instructions.
                </p>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white mb-4 outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetSent(true)}
                    className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-md cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
