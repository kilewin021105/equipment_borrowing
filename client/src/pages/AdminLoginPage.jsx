import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, User, AlertCircle, ArrowRight, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function AdminLoginPage({ setActivePage }) {
  const { adminLogin, setupInitialAdmin } = useAuth();
  const [tab, setTab] = useState('setup'); // 'login' or 'setup'
  const [hasAdmin, setHasAdmin] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Bachelor Science of information technology(BSIT)');
  const [studentId, setStudentId] = useState('ADM-001');
  const [phone, setPhone] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check whether an administrator already exists
  useEffect(() => {
    let isMounted = true;
    api.getAdminStatus()
      .then(res => {
        if (isMounted) {
          setHasAdmin(res.hasAdmin);
          // If no admin exists, default to setup mode; otherwise login mode
          setTab(res.hasAdmin ? 'login' : 'setup');
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasAdmin(false);
          setTab('setup');
        }
      })
      .finally(() => {
        if (isMounted) setCheckingStatus(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Handle Admin Sign In
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
        setError('Server is updating routes. Please ensure your backend server was restarted with npm start.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle First-Time Admin Setup / Creation
  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await setupInitialAdmin({
        name: name.trim(),
        email: email.trim(),
        password,
        department,
        student_id: studentId.trim() || 'ADM-MASTER',
        phone: phone.trim() || null
      });

      setSuccessMsg('Administrator account initialized successfully!');
      setTimeout(() => {
        setActivePage('admin');
      }, 400);
    } catch (err) {
      setError(err.message || 'Failed to initialize administrator account.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checking Administrator Status...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-10 p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl space-y-6">
      
      {/* Executive Security Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-gradient-to-tr from-purple-800 to-indigo-700 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-purple-900/30">
          <Shield className="w-7 h-7" />
        </div>
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-100 text-purple-800">
          Institutional Security Portal
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Administrator Console
        </h2>
        <p className="text-xs text-slate-500">
          Exclusive management interface for laboratory custodians, master inventory, and audit logs.
        </p>
      </div>

      {/* Tabs: Sign In vs Create Admin */}
      <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
        <button
          type="button"
          onClick={() => { setTab('login'); setError(''); }}
          className={`flex-1 py-2 rounded-xl transition ${
            tab === 'login'
              ? 'bg-white text-purple-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Admin Sign In
        </button>
        <button
          type="button"
          onClick={() => { setTab('setup'); setError(''); }}
          className={`flex-1 py-2 rounded-xl transition ${
            tab === 'setup'
              ? 'bg-white text-purple-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Initialize / Register Admin
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {tab === 'login' ? (
        /* STANDARD ADMIN SIGN IN */
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-start gap-2 text-xs text-purple-900">
            <ShieldAlert className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Restricted to administrators. If you have not created your admin account yet, click the <strong>"Initialize / Register Admin"</strong> tab above.
            </p>
          </div>

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
      ) : (
        /* INITIALIZE / REGISTER ADMIN */
        <form onSubmit={handleSetup} className="space-y-3.5">
          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-start gap-2 text-xs text-purple-900">
            <ShieldAlert className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Create your institutional Administrator account. You will have full privileges to appoint Lab Custodians and control campus inventory.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Administrator Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. John Fred"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Admin Institutional Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="gaperjohnfred83@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password (Min 6 chars) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Tag / ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+63 912 345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Academic Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
            >
              <option value="Bachelor Science of information technology(BSIT)">Bachelor Science of information technology(BSIT)</option>
              <option value="Bachelor Science of hospitality Management(BSHM)">Bachelor Science of hospitality Management(BSHM)</option>
              <option value="Bachelor Science of Criminology(BSCRIM)">Bachelor Science of Criminology(BSCRIM)</option>
              <option value="Bachelor Science of Education">Bachelor Science of Education</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-purple-700/20 flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Initialize Master Administrator
              </>
            )}
          </button>
        </form>
      )}

      {/* Switch to Regular User Portal */}
      <div className="pt-4 border-t border-slate-100 text-center space-y-2">
        <button
          onClick={() => setActivePage('login')}
          className="text-xs font-bold text-slate-600 hover:text-blue-600 transition flex items-center justify-center gap-1.5 mx-auto"
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
