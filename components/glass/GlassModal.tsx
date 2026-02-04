'use client';

import React, { useEffect } from 'react';

interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export default function GlassModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-md',
}: GlassModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Backdrop for closing */}
      <div 
        className="absolute inset-0 z-0" 
        onClick={onClose}
      />
      
      <div className={`
        relative z-10 w-full ${maxWidth} 
        bg-white rounded-[32px] 
        shadow-[0_20px_50px_rgba(0,0,0,0.2)] 
        border border-gray-100/50 
        overflow-hidden 
        animate-in slide-in-from-bottom-8 fade-in duration-500 ease-out
      `}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none mb-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">
                {subtitle}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-600 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar bg-white">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
