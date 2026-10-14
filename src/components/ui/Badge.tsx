import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center gap-1 font-label font-bold uppercase tracking-wider rounded-xs';

  const variantClasses = {
    primary: 'bg-[#152A20] text-[#F3EFE6]',
    secondary: 'bg-[#D97845] text-white',
    neutral: 'bg-[#EBE6DC] text-[#152A20] border border-[#D8D2C5]',
    success: 'bg-[#E0EFE6] text-[#152A20] border border-[#ADCBBB]',
    warning: 'bg-[#FDF2EC] text-[#D97845] border border-[#F1BA9B]',
    danger: 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]',
  }[variant];

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
  }[size];

  return (
    <span className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
