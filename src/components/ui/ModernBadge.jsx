import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const ModernBadge = ({ status }) => {
  const badgeConfig = {
    'Approved': {
      bg: 'bg-[#F0FDF4]',
      text: 'text-[#228B22]',
      border: 'border-[#D5F4CF]',
      Icon: CheckCircle
    },
    'Pending': {
      bg: 'bg-[#FFF1E6]',
      text: 'text-[#CC4A21]',
      border: 'border-[#F7E4D1]',
      Icon: Clock
    },
    'Rejected': {
      bg: 'bg-[#FFF4F0]',
      text: 'text-[#CD5C5C]',
      border: 'border-[#FDD7C8]',
      Icon: XCircle
    }
  };

  // Treat 'Accepted' as an alias for 'Approved'
  const normalizedStatus = status === 'Accepted' ? 'Approved' : status;
  const config = badgeConfig[normalizedStatus] || badgeConfig['Pending'];
  const { bg, text, border, Icon } = config;

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-1.5 border w-fit ${bg} ${text} ${border} backdrop-blur-sm`}>
      <Icon size={14} strokeWidth={2.5} />
      {status}
    </span>
  );
};
