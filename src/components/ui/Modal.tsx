import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  badge,
  children,
  footer,
  maxWidth = '4xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-xs font-label"
      onClick={onClose}
    >
      <div 
        className={`relative w-full ${maxWidthClass} bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#D8D2C5] bg-[#EBE6DC]">
          <div className="flex items-center gap-2">
            {badge && (
              <span className="text-[10px] font-label px-2 py-0.5 rounded-xs bg-[#152A20] text-[#F3EFE6] font-bold uppercase tracking-wider">
                {badge}
              </span>
            )}
            {title && (
              <h3 className="text-xs font-bold text-[#111D16] font-headline uppercase tracking-wide">{title}</h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xs bg-[#F8F6F1] text-[#5C665F] hover:text-[#152A20] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-[#D8D2C5] bg-[#EBE6DC]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
