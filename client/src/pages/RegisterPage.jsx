import React, { useState, useEffect } from 'react';
import { Package, Lock, Mail, User, Phone, AlertCircle, ArrowRight, Shield, Layers, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function RegisterPage({ setActivePage }) {
  const { register } = useAuth();
  const [role, setRole] = useState('admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('Bachelor Science of information technology(BSIT)');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleLimits, setRoleLimits] = useState({
    admin: { current: 0, max: 5, available: 5, isFull: false },
    staff: { current: 0, max: 7, available: 7, isFull: false },
    borrower: { current: 0, max: null, available: null, isFull: false }
  });

  // Fetch real-time role limits and current registrations
  useEffect(() => {
    let isMounted = true;
    api.getRoleLimits()
      .then(res => {
        if (isMounted && res.data) {
          setRoleLimits(res.data);
          // If default selected role is full, auto-fallback to available role
          if (res.data.admin && res.data.admin.isFull) {
            if (res.data.staff && !res.data.staff.isFull) {
              setRole('staff');
            } else {
              setRole('borrower');
            }
          }
        }
      })
      .catch(err => {
        console.warn('Could not fetch role limits:', err);
      });

    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Pre-validation for role limitations
    if (role === 'admin' && roleLimits.admin && roleLimits.admin.isFull) {
      setError('Administrator role quota full (maximum 5 accounts allowed). Please select another role.');
      return;
    }

    if (role === 'staff' && roleLimits.staff && roleLimits.staff.isFull) {
      setError('Lab Custodian role quota full (maximum 7 accounts allowed). Please select another role.');
      return;
    }

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
        phone: phone.trim() || null,
        role
      });

      // Auto-navigate to appropriate portal based on chosen role
      if (role === 'admin') {
        setActivePage('admin');
      } else if (role === 'staff') {
        setActivePage('staff');
      } else {
        setActivePage('catalog');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const adminLimit = roleLimits.admin || { current: 0, max: 5, available: 5, isFull: false };
  const staffLimit = roleLimits.staff || { current: 0, max: 7, available: 7, isFull: false };

  return (
    <div className="max-w-xl mx-auto my-10 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
          <Package className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create Your Campus Account</h2>
        <p className="text-xs text-slate-500">
          Set up your institutional profile to borrow lab assets, approve equipment requests, or manage inventory.
        </p>
      </div>

      {/* Role Quota Policy Pill */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
        <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <span className="font-bold text-slate-800">Role Quotas Enforced: </span>
          <span>
            System <strong>Administrators (1–5 users max)</strong> and <strong>Lab Custodians (1–7 users max)</strong> have strict institutional caps. Student/Faculty borrower accounts are unlimited.
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Role Selector Cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Account Role *
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Click a role to choose</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            
            {/* Administrator Button */}
            <button
              type="button"
              disabled={adminLimit.isFull}
              onClick={() => setRole('admin')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                adminLimit.isFull
                  ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed text-slate-400'
                  : role === 'admin'
                    ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-400 text-purple-950 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Shield className={`w-4 h-4 ${role === 'admin' && !adminLimit.isFull ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span className={`w-2 h-2 rounded-full ${adminLimit.isFull ? 'bg-rose-400' : role === 'admin' ? 'bg-purple-600' : 'bg-slate-200'}`} />
                </div>
                <span className="font-bold text-xs block text-slate-900">Administrator</span>
                <span className="text-[10px] text-slate-500 mt-0.5 leading-tight block">Master inventory CRUD & analytics</span>
              </div>

              {/* Quota Indicator */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  adminLimit.isFull 
                    ? 'bg-rose-100 text-rose-700 font-extrabold' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {adminLimit.isFull ? 'FULL (5/5)' : `${adminLimit.current}/5 filled`}
                </span>
                {!adminLimit.isFull && (
                  <span className="text-[9px] text-slate-400">
                    {adminLimit.available} left
                  </span>
                )}
              </div>
            </button>

            {/* Lab Custodian Button */}
            <button
              type="button"
              disabled={staffLimit.isFull}
              onClick={() => setRole('staff')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                staffLimit.isFull
                  ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed text-slate-400'
                  : role === 'staff'
                    ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-400 text-indigo-950 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Layers className={`w-4 h-4 ${role === 'staff' && !staffLimit.isFull ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className={`w-2 h-2 rounded-full ${staffLimit.isFull ? 'bg-rose-400' : role === 'staff' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                </div>
                <span className="font-bold text-xs block text-slate-900">Lab Custodian</span>
                <span className="text-[10px] text-slate-500 mt-0.5 leading-tight block">Approvals & return check-in</span>
              </div>

              {/* Quota Indicator */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  staffLimit.isFull 
                    ? 'bg-rose-100 text-rose-700 font-extrabold' 
                    : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {staffLimit.isFull ? 'FULL (7/7)' : `${staffLimit.current}/7 filled`}
                </span>
                {!staffLimit.isFull && (
                  <span className="text-[9px] text-slate-400">
                    {staffLimit.available} left
                  </span>
                )}
              </div>
            </button>

            {/* Borrower Button */}
            <button
              type="button"
              onClick={() => setRole('borrower')}
              className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                role === 'borrower'
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400 text-blue-950 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <UserCheck className={`w-4 h-4 ${role === 'borrower' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className={`w-2 h-2 rounded-full ${role === 'borrower' ? 'bg-blue-600' : 'bg-slate-200'}`} />
                </div>
                <span className="font-bold text-xs block text-slate-900">Student / Faculty</span>
                <span className="text-[10px] text-slate-500 mt-0.5 leading-tight block">Borrow assets & printable slips</span>
              </div>

              {/* Quota Indicator */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  Unlimited
                </span>
                <span className="text-[9px] text-slate-400">Open Access</span>
              </div>
            </button>

          </div>
        </div>

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
              Create Account & Enter Portal
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <button
            onClick={() => setActivePage('login')}
            className="text-blue-600 font-bold hover:underline"
          >
            Sign in to your account
          </button>
        </p>
      </div>
    </div>
  );
}
