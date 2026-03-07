import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  let badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
  let Icon = Clock;

  if (status === 'Accepted' || status === 'Approved') { 
    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200'; 
    Icon = CheckCircle; 
  }
  else if (status === 'Rejected') { 
    badgeClass = 'bg-rose-100 text-rose-800 border-rose-200'; 
    Icon = XCircle; 
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[0.7rem] font-bold tracking-wide uppercase flex items-center gap-1.5 border w-fit ${badgeClass}`}>
      <Icon size={12} strokeWidth={2.5} />
      {status}
    </span>
  );
};