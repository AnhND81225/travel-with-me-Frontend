import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'inverted' | 'outlined' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  // Rectangular with subtle rounding, hover lift & active click spring
  const baseClasses = 'inline-flex items-center justify-center font-label font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 select-none rounded-xs tracking-wide uppercase hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] shadow-2xs hover:shadow-sm';

  const variantClasses = {
    // Primary forest green: #152A20
    primary: 'bg-[#152A20] hover:bg-[#1E3A2D] text-[#F3EFE6]',
    // Secondary: #EBE6DC with #152A20 text
    secondary: 'bg-[#EBE6DC] hover:bg-[#DDD7CB] text-[#152A20] border border-[#D8D2C5]',
    // Accent orange: #D97845
    accent: 'bg-[#D97845] hover:bg-[#C66735] text-white',
    // Inverted: dark green / near black
    inverted: 'bg-[#111D16] hover:bg-[#152A20] text-white',
    // Outlined
    outlined: 'bg-transparent hover:bg-[#EBE6DC] text-[#152A20] border border-[#152A20]',
    // Danger
    danger: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white',
  }[variant];

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2',
    lg: 'text-xs px-5 py-2.5 gap-2.5 font-bold',
  }[size];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
