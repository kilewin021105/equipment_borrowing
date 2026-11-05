import React, { useState, useEffect } from 'react';
import { 
  Layers, CheckCircle2, Clock, AlertTriangle, ArrowRight, 
  Search, ShieldCheck, Box, RefreshCw, UserCheck, AlertCircle, Phone, Mail
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge, ConditionBadge } from '../components/Badge';
import { ApprovalModal } from '../components/ApprovalModal';
import { ReturnInspectionModal } from '../components/ReturnInspectionModal';
import { DigitalBorrowSlip } from '../components/DigitalBorrowSlip';

export function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'dispatch' | 'return' | 'overdue'
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedForApproval, setSelectedForApproval] = useState(null);
  const [selectedForReturn, setSelectedForReturn] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchStaffRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBorrowRequests();
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffRequests();
  }, []);

  const handleDispatch = async (req) => {
    if (!confirm(`Confirm handover of ${req.quantity}x ${req.equipment_name} to student ${req.borrower_name}?`)) return;
    setDispatchLoading(req.id);
    try {
      const res = await api.updateRequestStatus(req.id, { action: 'dispatch' });
      if (res.success) {
        setFeedback(`Equipment dispatched to ${req.borrower_name}. Stock decremented.`);
        fetchStaffRequests();
        setTimeout(() => setFeedback(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setDispatchLoading(null);
    }
  };

  // Filter lists
  const pendingQueue = requests.filter(r => r.status === 'pending');
  const dispatchQueue = requests.filter(r => r.status === 'approved');
  const returnQueue = requests.filter(r => r.status === 'dispatched');
  const overdueQueue = requests.filter(r => r.status === 'dispatched' && r.is_overdue);

  // Apply search filter
  const filterList = (list) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(r => 
      r.reference_code.toLowerCase().includes(term) ||
      r.borrower_name.toLowerCase().includes(term) ||
      (r.student_id && r.student_id.toLowerCase().includes(term)) ||
      r.equipment_name.toLowerCase().includes(term) ||
      r.asset_tag.toLowerCase().includes(term)
    );
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600" />
            Lab Custodian Operations Desk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative control: review student borrow requests, process equipment handover, and perform physical return inspections.
          </p>
        </div>

        <button
          onClick={fetchStaffRequests}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Requests
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border text-left transition shadow-xs ${
            activeTab === 'pending' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Needs Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="block text-2xl font-black text-amber-700 mt-2">{pendingQueue.length}</span>
          <span className="text-[11px] text-slate-500">Pending requests</span>
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`p-4 rounded-2xl border text-left transition shadow-xs ${
            activeTab === 'dispatch' ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Ready for Pickup</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <span className="block text-2xl font-black text-indigo-700 mt-2">{dispatchQueue.length}</span>
          <span className="text-[11px] text-slate-500">Approved for release</span>
        </button>

        <button
          onClick={() => setActiveTab('return')}
          className={`p-4 rounded-2xl border text-left transition shadow-xs ${
            activeTab === 'return' ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Currently Out</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <span className="block text-2xl font-black text-blue-700 mt-2">{returnQueue.length}</span>
          <span className="text-[11px] text-slate-500">Active checked out</span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border text-left transition shadow-xs ${
            activeTab === 'overdue' ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400' : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Overdue Holds</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <span className="block text-2xl font-black text-rose-600 mt-2">{overdueQueue.length}</span>
          <span className="text-[11px] text-slate-500">Past return deadline</span>
        </button>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Sub-header with search */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {activeTab === 'pending' && `Pending Queue (${pendingQueue.length})`}
              {activeTab === 'dispatch' && `Pickup / Handover Desk (${dispatchQueue.length})`}
              {activeTab === 'return' && `Check-in & Inspection Desk (${returnQueue.length})`}
              {activeTab === 'overdue' && `Overdue Attention List (${overdueQueue.length})`}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference, student name, asset tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading records...</div>
          ) : activeTab === 'pending' ? (
            /* 1. PENDING APPROVAL QUEUE */
            filterList(pendingQueue).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No pending requests requiring approval. All caught up!
              </div>
            ) : (
              <div className="space-y-3">
                {filterList(pendingQueue).map(req => (
                  <div
                    key={req.id}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-300 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {req.reference_code}
                        </span>
                        <StatusBadge status={req.status} />
                        <span className="text-xs text-slate-400">• Requested on {new Date(req.created_at).toLocaleDateString()}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{req.equipment_name} (x{req.quantity})</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <strong>Borrower:</strong> {req.borrower_name} ({req.student_id || 'ID N/A'})
                          <span className="block text-slate-500">{req.department} • {req.borrower_email}</span>
                        </div>
                        <div>
                          <strong>Schedule:</strong> {req.borrow_date} → {req.return_date}
                          <span className="block text-slate-500">Course: {req.course_code || 'General Academic'}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                        <strong>Purpose:</strong> {req.purpose}
                        {req.faculty_sponsor && <span className="block text-slate-500 mt-0.5">Faculty Sponsor: {req.faculty_sponsor}</span>}
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedForApproval(req)}
                        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Review & Decide
                      </button>
                      <button
                        onClick={() => setSelectedSlip(req)}
                        className="w-full px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                      >
                        View Slip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'dispatch' ? (
            /* 2. HANDOVER / DISPATCH DESK */
            filterList(dispatchQueue).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No items currently awaiting student counter pickup.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filterList(dispatchQueue).map(req => (
                  <div key={req.id} className="p-5 bg-white rounded-2xl border border-indigo-200 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {req.reference_code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-1">{req.equipment_name}</h4>
                        <p className="text-xs text-slate-500">Asset Tag: <span className="font-mono">{req.asset_tag}</span></p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <div className="p-3 bg-indigo-50/50 rounded-xl text-xs space-y-1.5 border border-indigo-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pickup Borrower:</span>
                        <span className="font-bold text-slate-900">{req.borrower_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Student ID:</span>
                        <span className="font-mono font-medium text-slate-800">{req.student_id || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Units:</span>
                        <span className="font-bold text-slate-900">{req.quantity} unit(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pickup Station:</span>
                        <span className="font-medium text-slate-800">{req.location}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedSlip(req)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                      >
                        Print Slip
                      </button>
                      <button
                        onClick={() => handleDispatch(req)}
                        disabled={dispatchLoading === req.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        {dispatchLoading === req.id ? 'Releasing...' : 'Release & Handover'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'return' ? (
            /* 3. RETURN & INSPECTION DESK */
            filterList(returnQueue).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active loans out in the field matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Equipment</th>
                      <th className="p-3">Borrower</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Inspection Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filterList(returnQueue).map(req => (
                      <tr key={req.id} className={`hover:bg-slate-50 transition ${req.is_overdue ? 'bg-rose-50/40' : ''}`}>
                        <td className="p-3 font-mono font-bold text-blue-700">{req.reference_code}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 block">{req.equipment_name}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{req.asset_tag} • Qty: {req.quantity}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-800 block">{req.borrower_name}</span>
                          <span className="text-[11px] text-slate-400">{req.department}</span>
                        </td>
                        <td className="p-3">
                          <span className={`font-semibold ${req.is_overdue ? 'text-rose-600 font-bold underline' : 'text-slate-700'}`}>
                            {req.return_date} {req.is_overdue ? '(OVERDUE)' : ''}
                          </span>
                        </td>
                        <td className="p-3"><StatusBadge status={req.status} isOverdue={req.is_overdue} /></td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedForReturn(req)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs text-xs"
                          >
                            Inspect & Check-in
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* 4. OVERDUE TRACKER */
            filterList(overdueQueue).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Excellent news! There are currently zero overdue equipment loans in the system.
              </div>
            ) : (
              <div className="space-y-3">
                {filterList(overdueQueue).map(req => (
                  <div
                    key={req.id}
                    className="p-5 bg-rose-50/60 rounded-2xl border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                          {req.reference_code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          OVERDUE
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{req.equipment_name} (Qty: {req.quantity})</h4>
                      <p className="text-xs text-slate-600">
                        Borrower: <strong>{req.borrower_name}</strong> ({req.student_id || 'ID N/A'}) • {req.department}
                      </p>
                      <p className="text-xs text-rose-700 font-semibold">
                        Expected Return Date: {req.return_date} • Handed out: {req.borrow_date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.borrower_email && (
                        <a
                          href={`mailto:${req.borrower_email}?subject=OVERDUE EQUIPMENT NOTICE: ${req.equipment_name} (${req.reference_code})`}
                          className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Send Alert
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedForReturn(req)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Process Return
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modals */}
      <ApprovalModal
        request={selectedForApproval}
        isOpen={!!selectedForApproval}
        onClose={() => setSelectedForApproval(null)}
        onSuccess={() => {
          fetchStaffRequests();
          setFeedback('Request decision submitted.');
          setTimeout(() => setFeedback(''), 4000);
        }}
      />

      <ReturnInspectionModal
        request={selectedForReturn}
        isOpen={!!selectedForReturn}
        onClose={() => setSelectedForReturn(null)}
        onSuccess={() => {
          fetchStaffRequests();
          setFeedback('Equipment successfully returned and inventory restored to stock.');
          setTimeout(() => setFeedback(''), 4000);
        }}
      />

      <DigitalBorrowSlip
        request={selectedSlip}
        onClose={() => setSelectedSlip(null)}
      />
    </div>
  );
}

