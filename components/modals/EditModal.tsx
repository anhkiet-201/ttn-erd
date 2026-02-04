'use client';

import { useEditLock } from '@/hooks/useEditLock';
import { useEffect } from 'react';

interface EditModalProps {
  recordType: string;
  recordId: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

import GlassModal from '../glass/GlassModal';
import GlassButton from '../glass/GlassButton';

export function EditModal({
  recordType,
  recordId,
  isOpen,
  onClose,
  children,
}: EditModalProps) {
  const { lock, isLocked, isOwnLock, acquireLock, releaseLock } = useEditLock(
    recordType,
    recordId
  );

  useEffect(() => {
    if (isOpen) {
      acquireLock();
    }

    return () => {
      if (isOwnLock) {
        releaseLock();
      }
    };
  }, [isOpen, isOwnLock, acquireLock, releaseLock]);

  if (!isOpen) return null;

  if (isLocked && !isOwnLock) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="absolute inset-0 z-0" onClick={onClose} />
        <div className="relative z-10 w-full max-w-sm bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 mb-6">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
              Đang chỉnh sửa
            </h3>
            <div className="space-y-1 mb-8">
              <p className="text-sm font-bold text-gray-700">{lock?.userName}</p>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{lock?.userEmail}</p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-8">
              Mục này đang được người dùng khác chỉnh sửa. Vui lòng quay lại sau khi họ hoàn tất.
            </p>
            <GlassButton onClick={onClose} className="w-full">
              Đóng cửa sổ
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0 z-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-500 flex flex-col">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
