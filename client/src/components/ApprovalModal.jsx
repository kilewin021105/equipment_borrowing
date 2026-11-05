import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Clock, MapPin, User } from 'lucide-react';
import { api } from '../services/api';

export function ApprovalModal({ request, isOpen, onClose, onSuccess }) {
  if (!isOpen || !request) return null;

  const [decision, setDecision] = useState('approve'); // 'approve' | 'reject'
  const [notes, setNotes] = useState(
    `Approved. Please collect at ${request.location || 'Central Lab Counter'}. Bring Student ID.`
  );
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        action: decision,
        ...(decision === 'approve'
          ? { approval_notes: notes.trim() }
          : { rejection_reason: rejectionReason.trim() || 'Request declined by custodian.' })
      };

      const res = await api.updateRequestStatus(request.id, payload);
      if (res.success) {
        if (onSuccess) onSuccess(decision);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to update request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-base">Custodian Review Desk</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Request Quick Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono font-bold text-slate-900">{request.reference_code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Borrower:</span>
              <span className="font-semibold text-slate-800">{request.borrower_name} ({request.student_id || 'ID N/A'})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Equipment:</span>
              <span className="font-semibold text-blue-700">{request.equipment_name} (Qty: {request.quantity})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Duration:</span>
              <span className="font-medium text-slate-800">{request.borrow_date} → {request.return_date}</span>
            </div>
            <div className="pt-1 border-t border-slate-200 text-slate-600">
              <strong>Purpose:</strong> {request.purpose}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Decision Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approve')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                  decision === 'approve'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Approve Request
              </button>

              <button
                type="button"
                onClick={() => setDecision('reject')}
                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition ${
                  decision === 'reject'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                Reject Request
              </button>
            </div>
          </div>

          {/* Conditional notes / rejection field */}
          {decision === 'approve' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pickup Instructions & Custodian Remarks
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Provide counter station, locker code, or inspection instructions..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="State why request cannot be fulfilled (e.g. Reserved for scheduled laboratory class)..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (decision === 'reject' && !rejectionReason.trim())}
              className={`px-5 py-2 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2 ${
                decision === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : decision === 'approve' ? (
                'Confirm Approval'
              ) : (
                'Confirm Rejection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

