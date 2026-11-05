import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { api } from '../services/api';

export function ReturnInspectionModal({ request, isOpen, onClose, onSuccess }) {
  if (!isOpen || !request) return null;

  const [condition, setCondition] = useState('good');
  const [damageNotes, setDamageNotes] = useState('All accessories returned and verified in working condition.');
  const [fineAmount, setFineAmount] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReturn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.updateRequestStatus(request.id, {
        action: 'return',
        return_condition: condition,
        damage_notes: damageNotes.trim(),
        fine_amount: parseFloat(fineAmount) || 0.0
      });

      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to complete return check-in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base">Check-in & Return Inspection</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReturn} className="p-6 space-y-5">
          {/* Quick Snapshot */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Loan Reference:</span>
              <span className="font-mono font-bold text-slate-900">{request.reference_code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Returning Borrower:</span>
              <span className="font-semibold text-slate-800">{request.borrower_name} ({request.student_id || 'ID N/A'})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Equipment & Qty:</span>
              <span className="font-semibold text-blue-700">{request.equipment_name} (x{request.quantity})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Expected Return:</span>
              <span className={`font-medium ${request.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                {request.return_date} {request.is_overdue ? '(OVERDUE)' : ''}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Condition Radio Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Physical Inspection Assessment *
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { val: 'excellent', label: 'Excellent / Like-New', desc: 'No signs of wear' },
                { val: 'good', label: 'Good Working Condition', desc: 'Normal clean usage' },
                { val: 'fair', label: 'Fair / Minor Wear', desc: 'Cosmetic scratches only' },
                { val: 'damaged', label: 'Damaged / Needs Repair', desc: 'Requires lab maintenance' },
                { val: 'missing_parts', label: 'Missing Accessories', desc: 'Cable/probe missing' }
              ].map(opt => (
                <label
                  key={opt.val}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    condition === opt.val
                      ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{opt.label}</span>
                    <input
                      type="radio"
                      name="condition"
                      value={opt.val}
                      checked={condition === opt.val}
                      onChange={(e) => setCondition(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Inspection Remarks & Verification Notes
            </label>
            <textarea
              rows="3"
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              placeholder="Record any missing accessories, battery state, or wear..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fine amount */}
          {(condition === 'damaged' || condition === 'missing_parts' || request.is_overdue) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                Damage / Late Penalty Assessment ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              disabled={isLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Return...
                </>
              ) : (
                'Verify & Restore Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

