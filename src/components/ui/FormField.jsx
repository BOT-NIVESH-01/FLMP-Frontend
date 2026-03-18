import React from 'react';

export const FormField = ({
  label,
  error,
  required = false,
  children,
  hint
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="block text-sm font-semibold text-[#0A4D9C]">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs font-medium text-[#CD5C5C]">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-[#666666]">{hint}</p>
      )}
    </div>
  );
};
