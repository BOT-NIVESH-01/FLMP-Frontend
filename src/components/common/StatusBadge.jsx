import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  let badgeClass = 'bg-[#FDB752]/20 text-[#CC8B1D] border-[#FDB752]/50';
  let Icon = Clock;

  if (status === 'Accepted' || status === 'Approved') {
    badgeClass = 'bg-[#228B22]/20 text-[#228B22] border-[#228B22]/50';
    Icon = CheckCircle;
  }
  else if (status === 'Rejected') {
    badgeClass = 'bg-[#CD5C5C]/20 text-[#A0413F] border-[#CD5C5C]/50';
    Icon = XCircle;
  }

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 border w-fit ${badgeClass} backdrop-blur-sm`}>
      <Icon size={14} strokeWidth={2.5} />
      {status}
    </span>
  );
};