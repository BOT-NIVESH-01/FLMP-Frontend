import React from 'react';
import { motion } from 'framer-motion';

const styles = {
    primary: 'btn-gradient-primary text-white',
    accent: 'btn-gradient-accent text-[#1A1A1A]',
    highlight: 'btn-gradient-highlight text-white',
    ghost: 'bg-[#F4F7FB]/80 text-[#0A4D9C] border border-[#E0E0E0] hover:bg-[#F4F7FB]',
    danger: 'bg-[#F44336]/90 text-white border border-[#F44336] hover:bg-[#F44336]',
};

export const GradientButton = ({
    children,
    className = '',
    variant = 'primary',
    type = 'button',
    disabled = false,
    ...props
}) => {
    return (
        <motion.button
            type={type}
            whileHover={disabled ? undefined : { scale: 1.02 }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    );
};
