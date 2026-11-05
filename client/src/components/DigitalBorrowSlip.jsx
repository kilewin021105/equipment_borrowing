import React from 'react';
import { Printer, X, CheckCircle, Clock, ShieldCheck, Building, Tag, User, Calendar, FileText } from 'lucide-react';
import { StatusBadge } from './Badge';

export function DigitalBorrowSlip({ request, onClose }) {
  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
        
        {/* Actions bar (hidden in print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-sm tracking-wide">Official Academic Equipment Loan Slip</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable slip area */}
        <div id="printable-slip" className="p-8 space-y-6 text-slate-800 bg-white">
          
          {/* Institutional Header */}
          <div className="border-b border-slate-200 pb-5 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
                CE
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">CAMPUS CENTRAL LABORATORY</h1>
                <p className="text-xs text-slate-500 font-medium">College Equipment Loan & Custody Verification Record</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Reference No.</span>
              <span className="font-mono font-bold text-base text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                {request.reference_code}
              </span>
            </div>
          </div>

          {/* Status & Barcode simulation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-medium block">Record Status</span>
              <StatusBadge status={request.status} isOverdue={request.is_overdue} />
            </div>

            {/* Barcode visual */}
            <div className="text-center sm:text-right">
              <div className="inline-block p-1 bg-white rounded border border-slate-200">
                <div className="flex items-center gap-[2px] h-9 px-2">
                  {[4,2,6,1,5,3,2,6,4,1,3,5,2,4,6,1,2,5,3,4,2,6,1,3].map((w, i) => (
                    <div
                      key={i}
                      className="bg-slate-900 h-full"
                      style={{ width: `${w}px` }}
                    />
                  ))}
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 tracking-widest">{request.reference_code}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            {/* Borrower Details */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Borrower Information
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-semibold text-slate-900">{request.borrower_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID / Tag:</span>
                  <span className="font-mono font-medium text-slate-800">{request.student_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-medium text-slate-800">{request.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-800">{request.borrower_email}</span>
                </div>
                {request.borrower_phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact:</span>
                    <span className="font-medium text-slate-800">{request.borrower_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Details */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                Allocated Asset
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipment:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[160px]">{request.equipment_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Asset Tag:</span>
                  <span className="font-mono font-semibold text-blue-600">{request.asset_tag}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-bold text-slate-900">{request.quantity} unit(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Custody Lab:</span>
                  <span className="font-medium text-slate-800">{request.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Purpose & Schedule */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Purpose:
              </span>
              <span className="font-semibold text-slate-800">{request.purpose}</span>
            </div>
            {request.course_code && (
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Course / Endorsement:</span>
                <span className="font-medium text-slate-800">{request.course_code} {request.faculty_sponsor ? `(${request.faculty_sponsor})` : ''}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-500 block">Borrow Date:</span>
                <span className="font-semibold text-slate-900">{request.borrow_date}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Expected Due Date:</span>
                <span className="font-bold text-rose-600">{request.return_date}</span>
              </div>
            </div>
          </div>

          {/* Audit / Counter Signatures */}
          <div className="border-t border-slate-200 pt-6 mt-6 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-10 border-b border-slate-300 mb-2 flex items-end justify-center font-cursive text-slate-700 italic">
                {request.borrower_name}
              </div>
              <p className="text-slate-500 font-medium">Borrower Signature</p>
              <p className="text-[10px] text-slate-400">Agrees to Campus Equipment Policy</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-300 mb-2 flex items-end justify-center font-medium text-slate-700">
                {request.approver_name || 'Prof. Eleanor Hawthorne'}
              </div>
              <p className="text-slate-500 font-medium">Custodian / Verifying Staff</p>
              <p className="text-[10px] text-slate-400">Central Laboratory Authority</p>
            </div>
          </div>

          {/* Policy footer */}
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Borrower is solely responsible for university equipment until checked in and condition-verified by an authorized laboratory custodian. Late returns are subject to academic equipment loan holds.
          </p>
        </div>
      </div>
    </div>
  );
}

