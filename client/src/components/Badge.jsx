import React from 'react';

export function StatusBadge({ status, isOverdue }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
        OVERDUE
      </span>
    );
  }

  const configs = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Pending Approval', dot: 'bg-amber-500' },
    approved: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Ready for Pickup', dot: 'bg-emerald-500' },
    dispatched: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Active Loan', dot: 'bg-blue-600' },
    returned: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', label: 'Returned', dot: 'bg-slate-500' },
    rejected: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', label: 'Rejected', dot: 'bg-rose-500' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', label: 'Cancelled', dot: 'bg-gray-400' },
    available: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', label: 'Available', dot: 'bg-emerald-500' },
    maintenance: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', label: 'Under Maintenance', dot: 'bg-amber-500' },
    retired: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'Retired', dot: 'bg-gray-400' }
  };

  const config = configs[status] || { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', label: status, dot: 'bg-slate-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}

export function ConditionBadge({ condition }) {
  const configs = {
    excellent: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Excellent Condition' },
    good: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Good Working Condition' },
    fair: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Fair Condition (Signs of Wear)' },
    damaged: { bg: 'bg-rose-50', text: 'text-rose-700', label: 'Damaged / Needs Repair' },
    maintenance: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Lab Servicing' }
  };

  const conf = configs[condition] || { bg: 'bg-gray-50', text: 'text-gray-600', label: condition };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${conf.bg} ${conf.text}`}>
      {conf.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const configs = {
    admin: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', label: 'Administrator' },
    staff: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', label: 'Lab Custodian' },
    borrower: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', label: 'Student / Faculty' }
  };

  const conf = configs[role] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: role };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${conf.bg} ${conf.text} border ${conf.border}`}>
      {conf.label}
    </span>
  );
}

