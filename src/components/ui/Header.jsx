import React from 'react';
import { motion } from 'framer-motion';
import { Bell, User } from 'lucide-react';

export const Header = ({ title, subtitle, notifications = 0 }) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 right-0 left-72 bg-gradient-to-r from-[#F4F7FB]/90 to-white/90 border-b border-[#E0E0E0]/50 backdrop-blur-md z-30"
    >
      <div className="px-8 py-5 flex items-center justify-between">
        {/* Left side - Title & Subtitle */}
        <div>
          <h2 className="text-2xl font-bold text-[#0A4D9C]">{title}</h2>
          {subtitle && <p className="text-sm text-[#666666] mt-1">{subtitle}</p>}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative rounded-lg p-2.5 text-[#666666] hover:text-[#0A4D9C] hover:bg-[#F4F7FB]/60 transition-colors">
            <Bell size={20} />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-[#CD5C5C]" />
            )}
          </button>

          {/* User Menu */}
          <button className="rounded-lg p-2.5 text-[#666666] hover:text-[#0A4D9C] hover:bg-[#F4F7FB]/60 transition-colors">
            <User size={20} />
          </button>
        </div>
      </div>
    </motion.header>
  );
};
