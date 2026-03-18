import React from 'react';
import { motion } from 'framer-motion';

export const SkeletonCard = ({ className = '' }) => {
  return (
    <motion.div
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`glass-card rounded-2xl border border-[#E0E0E0] ${className}`}
    />
  );
};

export const LoadingDashboard = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gradient-to-br from-white via-[#F8FAFC] to-[#F4F7FB]">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* Title skeleton */}
        <div className="space-y-2">
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-8 bg-[#E0E0E0]/50 rounded-lg w-40"
          />
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            className="h-4 bg-[#E0E0E0]/30 rounded-lg w-60"
          />
        </div>

        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-40" />
          ))}
        </div>

        {/* Substitution section skeleton */}
        <div className="space-y-3">
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-6 bg-[#E0E0E0]/50 rounded-lg w-48"
          />
          <SkeletonCard className="h-32" />
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          <motion.div
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-6 bg-[#E0E0E0]/50 rounded-lg w-40"
          />
          <SkeletonCard className="h-96" />
        </div>
      </div>
    </div>
  );
};
