import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  hoverable = false,
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  }[padding];

  const hoverClass = hoverable 
    ? 'hover:border-[#152A20] transition-colors duration-150' 
    : '';

  return (
    <div
      className={`bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs ${paddingClasses} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
