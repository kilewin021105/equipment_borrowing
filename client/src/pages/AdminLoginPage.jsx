import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, KeyRound, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminLoginPage({ setActivePage }) {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await adminLogin(email, password);
      setActivePage('admin');
    } catch (err) {
      const msg = err.message || 'Administrator authentication failed.';
      if (msg.includes('404') || msg.includes('not found')) {
        setError('Server is updating routes. Please ensure your server was restarted with npm start.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-6">
      
      {/* Executive Security Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-gradient-to-tr from-purple-800 to-indigo-700 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-900/30">
          <Shield className="w-7 h-7" />
        </div>
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-100 text-purple-800">
          Restricted Portal
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Administrator Sign In
        </h2>
        <p className="text-xs text-slate-500">
          Exclusive management interface for laboratory custodians, master inventory, and system audit logs.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Sign In Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Administrator Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="admin@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-purple-700/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Authenticate Administrator
            </>
          )}
        </button>
      </form>

      {/* Link to Normal Create Account */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1.5">
        <p className="text-xs text-slate-600 font-medium">
          Don't have an administrator account yet?
        </p>
        <button
          onClick={() => setActivePage('register')}
          className="text-xs font-bold text-purple-700 hover:text-purple-900 transition flex items-center justify-center gap-1.5 mx-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Go to Normal Create Account Page →
        </button>
      </div>

      {/* Switch to Regular User Portal */}
      <div className="pt-2 text-center space-y-2">
        <button
          onClick={() => setActivePage('login')}
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition flex items-center justify-center gap-1.5 mx-auto"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          Return to Student & Faculty Sign In
        </button>

        <button
          onClick={() => setActivePage('catalog')}
          className="text-[11px] text-slate-400 hover:text-slate-600 block mx-auto"
        >
          Browse Equipment Catalog as Guest
        </button>
      </div>

    </div>
  );
}
