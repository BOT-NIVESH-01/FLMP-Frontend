import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Grid,
  FileText,
  Settings,
  LogOut,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { GradientButton } from './GradientButton';

export const Sidebar = ({
  user,
  currentView,
  onViewChange,
  onLogout
}) => {
  const isAdmin = user?.role === 'admin';
  const isHOD = user?.role === 'hod';

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'apply_leave', label: 'Apply Leave', icon: Calendar, visible: true },
    { id: 'timetable', label: 'Timetable', icon: Grid, visible: true },
    { id: 'substitution', label: 'Substitution', icon: Users, visible: true },
    { id: 'approvals', label: 'Approvals', icon: FileText, visible: isHOD || isAdmin },
    { id: 'faculty_overview', label: 'Faculty Status', icon: Users, visible: isHOD || isAdmin },
    { id: 'admin_portal', label: 'Settings', icon: Settings, visible: isAdmin },
  ];

  const filteredItems = navigationItems.filter(item => item.visible);

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-white to-[#F4F7FB] border-r border-[#E0E0E0]/50 flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 border-b border-[#E0E0E0] px-6 py-5"
      >
        <div className="btn-gradient-primary rounded-xl p-2.5">
          <BookOpen size={24} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-base font-bold text-[#0A4D9C]">Faculty Portal</h1>
          <p className="text-xs text-[#666666]">Smart Leave Management</p>
        </div>
      </motion.div>

      {/* User Profile */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mx-4 mt-4 rounded-xl bg-[#F4F7FB]/60 border border-[#E0E0E0] p-3"
        >
          <p className="text-xs text-[#666666] uppercase tracking-wide font-semibold">Current User</p>
          <p className="text-sm font-bold text-[#0A4D9C] mt-1">{user.name}</p>
          <p className="text-xs text-[#666666] capitalize">{user.role} • {user.department}</p>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
        {filteredItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              onClick={() => onViewChange(item.id)}
              className={`relative w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                  ? 'bg-gradient-to-r from-[#0A4D9C]/80 to-[#1E73BE]/40 text-white shadow-lg shadow-[#0A4D9C]/20'
                  : 'text-[#666666] hover:text-[#0A4D9C] hover:bg-[#F4F7FB]/60'
                }`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute right-0 h-full w-1 bg-gradient-to-b from-[#0A4D9C] to-[#1E73BE] rounded-l-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border-t border-[#E0E0E0] px-3 py-4"
      >
        <GradientButton
          variant="danger"
          className="w-full"
          onClick={onLogout}
        >
          <LogOut size={16} />
          Sign Out
        </GradientButton>
      </motion.div>
    </div>
  );
};
