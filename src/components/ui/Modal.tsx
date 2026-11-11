import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
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
  className = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusable = () => [...(panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
    ) ?? [])].filter(element => element.getClientRects().length > 0);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const elements = focusable(), first = elements[0], last = elements[elements.length - 1];
      if (!first) { e.preventDefault(); panelRef.current?.focus(); return; }
      if (e.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    (focusable()[0] ?? panelRef.current)?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs font-label ${className}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        data-modal-panel
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        tabIndex={-1}
        className={`relative w-full ${maxWidthClass} bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs shadow-xl overflow-hidden max-h-[calc(100dvh-2rem)] flex flex-col min-h-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3.5 border-b border-[#D8D2C5] bg-[#EBE6DC]">
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            {badge && (
              <span className="text-[10px] font-label px-2 py-0.5 rounded-xs bg-[#152A20] text-[#F3EFE6] font-bold uppercase tracking-wider">
                {badge}
              </span>
            )}
            {title && (
              <h3 id={titleId} className="text-xs font-bold text-[#111D16] font-headline uppercase tracking-wide">{title}</h3>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
            className="p-1 rounded-xs bg-[#F8F6F1] text-[#5C665F] hover:text-[#152A20] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto overscroll-contain min-h-0 p-4 sm:p-5 flex-1 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 p-4 border-t border-[#D8D2C5] bg-[#EBE6DC]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
