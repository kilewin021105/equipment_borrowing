import React, { useState, useEffect } from 'react';
import { Package, Lock, Mail, User, Phone, AlertCircle, ArrowRight, ShieldCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function RegisterPage({ setActivePage }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Bachelor Science of information technology(BSIT)');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getAdminStatus()
      .then(res => {
        if (isMounted && res.success && !res.hasAdmin) {
          setIsFirstAdmin(true);
        }
      })
      .catch(() => {
        // Safe fallback
      });
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        student_id: studentId.trim() || null,
        department,
        phone: phone.trim() || null
      });

      // If this account was provisioned as Admin, route straight to Admin Dashboard
      if (res && res.user && res.user.role === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('catalog');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-10 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Institutional Account</h2>
        <p className="text-xs text-slate-500">
          Register your institutional profile to borrow lab equipment or manage campus inventory.
        </p>
      </div>

      {/* First-time system admin notice banner */}
      {isFirstAdmin && (
        <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900">
          <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">System Setup Notice: </span>
            No administrator accounts currently exist. This initial registration will automatically receive <strong>Master System Administrator</strong> privileges!
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Juan Dela Cruz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="you@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Student / Employee ID
            </label>
            <input
              type="text"
              placeholder="e.g. BSIT-2026-0001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="+63 912 345 6789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Academic Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              {isFirstAdmin ? 'Initialize Master Admin & Enter' : 'Create Account & Enter'}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <p className="text-slate-500">
          Already registered?{' '}
          <button
            onClick={() => setActivePage('login')}
            className="text-blue-600 font-bold hover:underline"
          >
            Sign In
          </button>
        </p>

        <button
          onClick={() => setActivePage('admin-login')}
          className="text-slate-500 hover:text-purple-700 font-semibold flex items-center gap-1 transition"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          Admin Portal Sign In →
        </button>
      </div>
    </div>
  );
}
