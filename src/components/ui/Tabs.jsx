import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const Tabs = React.memo(({ tabs, activeTab, onTabChange }) => {
  const activeContent = useMemo(() =>
    tabs.find(t => t.id === activeTab)?.content,
    [tabs, activeTab]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-[#E0E0E0]/50 overflow-x-auto">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab.id
                ? 'text-[#0A4D9C]'
                : 'text-[#999999] hover:text-[#666666]'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A4D9C] to-[#1E73BE]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <div className="relative">
        {activeContent}
      </div>
    </div>
  );
});
