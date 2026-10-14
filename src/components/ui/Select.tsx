import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="text-[10px] font-label font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-2 text-xs text-[#111D16] font-body focus:outline-none focus:border-[#152A20] transition ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};
