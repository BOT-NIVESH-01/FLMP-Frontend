import React from 'react';
import { motion } from 'framer-motion';

const styles = {
  primary: 'btn-gradient-primary text-white',
  secondary: 'bg-[#F4F7FB]/60 text-[#0A4D9C] border border-[#E0E0E0] hover:bg-[#F4F7FB]/80',
  accent: 'btn-gradient-accent text-[#1A1A1A]',
  danger: 'bg-[#CD5C5C] text-white border border-[#CD5C5C]/80 hover:bg-[#B84A4A]',
  ghost: 'text-[#666666] hover:text-[#0A4D9C] hover:bg-[#F4F7FB]/40'
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base'
};

export const GlassButton = React.memo(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});
