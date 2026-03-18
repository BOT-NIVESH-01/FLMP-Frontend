import React from 'react';
import { motion } from 'framer-motion';

export const SaaSCard = ({ children, className = '', hover = true }) => {
    const hoverEffect = hover ? { y: -4, scale: 1.01 } : undefined;

    return (
        <motion.div
            whileHover={hoverEffect}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className={`glass-card shadow-soft ${className}`}
        >
            {children}
        </motion.div>
    );
};
