import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, Clock, AlertTriangle, CheckCircle, 
  FileText, XCircle, ArrowRight, ShieldCheck, Printer, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, ConditionBadge } from '../components/Badge';
import { DigitalBorrowSlip } from '../components/DigitalBorrowSlip';

export function BorrowerDashboard({ setActivePage }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending' | 'history'
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState('');

  const fetchMyRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBorrowRequests();
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to load borrow requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleCancel = async (id, ref) => {
    if (!confirm(`Are you sure you want to cancel request ${ref}?`)) return;
    setActionLoading(id);
    try {
      const res = await api.cancelBorrowRequest(id);
      if (res.success) {
        setCancelFeedback(`Request ${ref} cancelled.`);
        fetchMyRequests();
        setTimeout(() => setCancelFeedback(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel request');
    } finally {
      setActionLoading(null);
    }
  };

  const activeLoans = requests.filter(r => r.status === 'dispatched');
  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'approved');
  const historyRequests = requests.filter(r => r.status === 'returned' || r.status === 'rejected' || r.status === 'cancelled');
  const overdueCount = activeLoans.filter(r => r.is_overdue).length;

  return (
    <div className="space-y-6 pb-16">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Borrower Custody & Loans Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active academic equipment in your possession, view custodian approvals, and retrieve official digital slips.
          </p>
        </div>

        <button
          onClick={fetchMyRequests}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {cancelFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Loans</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <span className="block text-2xl font-black text-slate-900 mt-2">{activeLoans.length}</span>
          <span className="text-[11px] text-slate-500">Currently in your care</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="block text-2xl font-black text-amber-700 mt-2">{pendingRequests.length}</span>
          <span className="text-[11px] text-slate-500">Awaiting custodian action</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Alerts</span>
            <span className={`w-2 h-2 rounded-full ${overdueCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
          <span className={`block text-2xl font-black mt-2 ${overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueCount}
          </span>
          <span className="text-[11px] text-slate-500">Past expected return date</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Returned Past</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="block text-2xl font-black text-emerald-700 mt-2">{historyRequests.length}</span>
          <span className="text-[11px] text-slate-500">Completed & checked in</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === 'active'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Active Equipment Loans</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800">
              {activeLoans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Pending & Approved Queue</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
              {pendingRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Loan History & Receipts</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {historyRequests.length}
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading loan records...</div>
          ) : activeTab === 'active' ? (
            /* ACTIVE LOANS */
            activeLoans.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">No Active Loans</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You do not currently have any equipment checked out from university labs.
                </p>
                <button
                  onClick={() => setActivePage('catalog')}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition"
                >
                  Browse Catalog & Borrow
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLoans.map(req => (
                  <div
                    key={req.id}
                    className={`rounded-2xl border p-5 transition space-y-4 ${
                      req.is_overdue
                        ? 'bg-rose-50/50 border-rose-300 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {req.reference_code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5">{req.equipment_name}</h3>
                        <p className="text-xs text-slate-500">Asset Tag: <span className="font-mono">{req.asset_tag}</span></p>
                      </div>
                      <StatusBadge status={req.status} isOverdue={req.is_overdue} />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quantity Checked Out:</span>
                        <span className="font-bold text-slate-800">{req.quantity} unit(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Checked Out On:</span>
                        <span className="font-medium text-slate-800">{req.borrow_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Expected Due Date:</span>
                        <span className={`font-bold ${req.is_overdue ? 'text-rose-600 underline' : 'text-slate-900'}`}>
                          {req.return_date} {req.is_overdue ? '⚠️ OVERDUE' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Return Location:</span>
                        <span className="font-medium text-slate-800">{req.location}</span>
                      </div>
                    </div>

                    {req.is_overdue && (
                      <div className="p-2.5 bg-rose-100/70 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                        <span>Item is overdue! Please return to the lab custodian immediately to avoid late holds.</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">Handed over by: {req.dispatcher_name || 'Staff'}</span>
                      <button
                        onClick={() => setSelectedSlip(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Digital Loan Slip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'pending' ? (
            /* PENDING & APPROVED QUEUE */
            pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No requests currently pending review or waiting for pickup.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div
                    key={req.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {req.reference_code}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{req.equipment_name} (Qty: {req.quantity})</h4>
                      <p className="text-xs text-slate-500">
                        Requested duration: {req.borrow_date} → {req.return_date} • Purpose: {req.purpose}
                      </p>
                      {req.approval_notes && (
                        <p className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg mt-1 inline-block">
                          Custodian Note: {req.approval_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setSelectedSlip(req)}
                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                      >
                        Slip
                      </button>
                      {req.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(req.id, req.reference_code)}
                          disabled={actionLoading === req.id}
                          className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
                        >
                          {actionLoading === req.id ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* HISTORY */
            historyRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No past loan history on record yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Equipment</th>
                      <th className="p-3">Loan Period</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Condition Returned</th>
                      <th className="p-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3 font-mono font-bold text-blue-600">{req.reference_code}</td>
                        <td className="p-3 font-semibold text-slate-800">{req.equipment_name}</td>
                        <td className="p-3 text-slate-500">{req.borrow_date} → {req.return_date}</td>
                        <td className="p-3"><StatusBadge status={req.status} /></td>
                        <td className="p-3">
                          {req.return_condition ? (
                            <ConditionBadge condition={req.return_condition} />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedSlip(req)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="View receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Digital Loan Slip Modal */}
      {selectedSlip && (
        <DigitalBorrowSlip
          request={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}
    </div>
  );
}

