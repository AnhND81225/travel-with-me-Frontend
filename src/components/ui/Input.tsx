import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
  icon,
  clearable,
  onClear,
  className = '',
  value,
  ...props
}) => {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <span className="absolute left-3 text-[#5C665F] pointer-events-none">
          {icon}
        </span>
      )}
      <input
        value={value}
        className={`w-full bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs py-2 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] font-body transition ${
          icon ? 'pl-9' : 'pl-3'
        } ${clearable && value ? 'pr-12' : 'pr-3'} ${className}`}
        {...props}
      />
      {clearable && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 text-[10px] text-[#5C665F] hover:text-[#152A20] font-label font-bold cursor-pointer"
        >
          CLEAR
        </button>
      )}
    </div>
  );
};
