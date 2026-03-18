import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export const LeaveStatisticsChart = ({ leaves = [], user = {} }) => {
  // Prepare data for leave types
  const leaveTypeData = [
    {
      name: 'Casual',
      used: leaves.filter(l => l.type === 'Casual' && l.status === 'Approved').length,
      remaining: (user.leaveBalance?.casual || 0)
    },
    {
      name: 'Medical',
      used: leaves.filter(l => l.type === 'Medical' && l.status === 'Approved').length,
      remaining: (user.leaveBalance?.sick || 0)
    }
  ];

  // Prepare data for leave status distribution
  const statusData = [
    {
      name: 'Approved',
      value: leaves.filter(l => l.status === 'Approved').length,
      color: '#10b981'
    },
    {
      name: 'Pending',
      value: leaves.filter(l => l.status === 'Pending').length,
      color: '#f59e0b'
    },
    {
      name: 'Rejected',
      value: leaves.filter(l => l.status === 'Rejected').length,
      color: '#ef4444'
    }
  ];

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-[#E0E0E0] rounded-lg p-2 text-sm">
          <p className="text-[#0A4D9C] font-semibold">{payload[0].name}</p>
          <p className="text-[#1E73BE]">
            {payload[0].name === 'Approved' || payload[0].name === 'Casual' || payload[0].name === 'Medical'
              ? payload[0].name
              : payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart - Leave Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card shadow-soft rounded-2xl p-6 border border-[#E0E0E0] bg-gradient-to-br from-[#F4F7FB]/80 to-white/40"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-[#0A4D9C]/40 p-2 rounded-lg">
            <TrendingUp size={20} className="text-[#0A4D9C]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A4D9C]">Leave Balance</h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leaveTypeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="name" stroke="#666666" />
            <YAxis stroke="#666666" />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="remaining" fill="#10b981" name="Remaining" radius={[8, 8, 0, 0]} />
            <Bar dataKey="used" fill="#f59e0b" name="Used" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Pie Chart - Leave Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card shadow-soft rounded-2xl p-6 border border-[#E0E0E0] bg-gradient-to-br from-[#F4F7FB]/80 to-white/40"
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-[#1E73BE]/40 p-2 rounded-lg">
            <TrendingUp size={20} className="text-[#1E73BE]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A4D9C]">Status Distribution</h3>
        </div>

        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-[#666666]">
            <p>No leave data available</p>
          </div>
        )}
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="glass-card shadow-soft rounded-xl p-4 border border-emerald-700/50 bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 text-center">
          <p className="text-sm text-[#666666] mb-2">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{statusData[0]?.value || 0}</p>
        </div>

        <div className="glass-card shadow-soft rounded-xl p-4 border border-amber-700/50 bg-gradient-to-br from-amber-900/20 to-amber-950/20 text-center">
          <p className="text-sm text-[#666666] mb-2">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{statusData[1]?.value || 0}</p>
        </div>

        <div className="glass-card shadow-soft rounded-xl p-4 border border-red-700/50 bg-gradient-to-br from-red-900/20 to-red-950/20 text-center">
          <p className="text-sm text-[#666666] mb-2">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{statusData[2]?.value || 0}</p>
        </div>

        <div className="glass-card shadow-soft rounded-xl p-4 border border-[#1E73BE]/50 bg-gradient-to-br from-[#0A4D9C]/20 to-[#1E73BE]/10 text-center">
          <p className="text-sm text-[#666666] mb-2">Total</p>
          <p className="text-2xl font-bold text-[#0A4D9C]">{leaves.length}</p>
        </div>
      </motion.div>
    </div>
  );
};
