import React, { useState } from 'react';
import { Package, Lock, Mail, User, Phone, AlertCircle, ArrowRight, Shield, Layers, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
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

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Role Selector Cards - Clean: Admin, Lab Custodian, Student/Faculty */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Account Role *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            
            {/* Admin */}
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`py-3 px-4 rounded-2xl border text-center font-bold transition flex items-center justify-center gap-2 ${
                role === 'admin'
                  ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-400 text-purple-950 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Shield className={`w-4 h-4 ${role === 'admin' ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>Admin</span>
            </button>

            {/* Lab Custodian */}
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={`py-3 px-4 rounded-2xl border text-center font-bold transition flex items-center justify-center gap-2 ${
                role === 'staff'
                  ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400 text-indigo-950 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers className={`w-4 h-4 ${role === 'staff' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Lab Custodian</span>
            </button>

            {/* Student/Faculty */}
            <button
              type="button"
              onClick={() => setRole('borrower')}
              className={`py-3 px-4 rounded-2xl border text-center font-bold transition flex items-center justify-center gap-2 ${
                role === 'borrower'
                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400 text-blue-950 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${role === 'borrower' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>Student/Faculty</span>
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
