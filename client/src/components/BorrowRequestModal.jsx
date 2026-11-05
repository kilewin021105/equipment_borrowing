import React, { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle, Package, MapPin, Clock, Info } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export function BorrowRequestModal({ equipment, isOpen, onClose, onSuccess }) {
  if (!isOpen || !equipment) return null;

  const today = new Date().toISOString().split('T')[0];
  const defaultReturn = new Date();
  defaultReturn.setDate(new Date().getDate() + Math.min(3, equipment.max_borrow_days || 7));
  const defaultReturnStr = defaultReturn.toISOString().split('T')[0];

  const [quantity, setQuantity] = useState(1);
  const [borrowDate, setBorrowDate] = useState(today);
  const [returnDate, setReturnDate] = useState(defaultReturnStr);
  const [purpose, setPurpose] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [facultySponsor, setFacultySponsor] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Calculate duration
  const bDate = new Date(borrowDate);
  const rDate = new Date(returnDate);
  const diffDays = Math.max(0, Math.ceil((rDate - bDate) / (1000 * 60 * 60 * 24)));
  const isExceeded = diffDays > (equipment.max_borrow_days || 7);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!purpose.trim()) {
      setError('Please provide the academic purpose for borrowing this equipment.');
      return;
    }

    if (quantity > equipment.available_quantity) {
      setError(`Cannot request ${quantity} units. Only ${equipment.available_quantity} available.`);
      return;
    }

    if (isExceeded) {
      setError(`Selected loan duration (${diffDays} days) exceeds maximum allowed (${equipment.max_borrow_days} days).`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.createBorrowRequest({
        equipment_id: equipment.id,
        quantity: parseInt(quantity, 10),
        borrow_date: borrowDate,
        return_date: returnDate,
        purpose: purpose.trim(),
        course_code: courseCode.trim() || null,
        faculty_sponsor: facultySponsor.trim() || null,
        notes: notes.trim() || null
      });

      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
        setSuccessData(res.data);
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit borrow request.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-base">Equipment Borrow Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successData ? (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Request Submitted Successfully!</h3>
              <p className="text-sm text-slate-600 mt-1">
                Your loan request for <strong className="text-slate-800">{equipment.name}</strong> has been logged.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Tracking Reference:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {successData.reference_code}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Units Requested:</span>
                <span className="font-semibold text-slate-800">{quantity} unit(s)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Pickup Lab:</span>
                <span className="font-medium text-slate-800">{equipment.location}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Pending Custodian Approval
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              You will receive an in-app notification as soon as the lab custodian reviews your request.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              Done & Return to Catalog
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Equipment Snapshot Card */}
            <div className="flex items-center gap-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
              <div className="w-14 h-14 rounded-lg bg-white border border-blue-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {equipment.image_url ? (
                  <img src={equipment.image_url} alt={equipment.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-7 h-7 text-blue-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm truncate">{equipment.name}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                    {equipment.asset_tag}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {equipment.location}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="font-medium text-emerald-700">
                    Available: <strong>{equipment.available_quantity}</strong> of {equipment.total_quantity}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-blue-700 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Max {equipment.max_borrow_days} days
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity Required
                </label>
                <input
                  type="number"
                  min="1"
                  max={equipment.available_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course Code / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. ECE-401 or CS-300"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Borrow Date
                </label>
                <input
                  type="date"
                  min={today}
                  value={borrowDate}
                  onChange={(e) => setBorrowDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Return Date</span>
                  <span className={isExceeded ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                    ({diffDays} days)
                  </span>
                </label>
                <input
                  type="date"
                  min={borrowDate}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 ${
                    isExceeded ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'
                  }`}
                  required
                />
              </div>
            </div>

            {isExceeded && (
              <p className="text-xs text-rose-600 font-medium">
                ⚠️ Loan duration exceeds the laboratory policy limit of {equipment.max_borrow_days} days.
              </p>
            )}

            {/* Academic Purpose */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Academic Purpose & Objectives *
              </label>
              <textarea
                rows="2"
                placeholder="Describe your lab experiment, design project, or coursework requirement..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Faculty Sponsor / Instructor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Marcus Reyes"
                  value={facultySponsor}
                  onChange={(e) => setFacultySponsor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Additional Notes
                </label>
                <input
                  type="text"
                  placeholder="Special accessories or cable requests"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Buttons */}
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
                disabled={isLoading || isExceeded || equipment.available_quantity < 1}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Borrow Request'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

