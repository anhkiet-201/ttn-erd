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
      // Try to acquire lock when modal opens
      acquireLock();
    }

    // Release lock when modal closes
    return () => {
      if (isOwnLock) {
        releaseLock();
      }
    };
  }, [isOpen, isOwnLock, acquireLock, releaseLock]);

  if (!isOpen) return null;

  // Show warning if locked by another user
  if (isLocked && !isOwnLock) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Đang được chỉnh sửa
            </h3>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">{lock?.userName}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">({lock?.userEmail})</p>
            <p className="text-sm text-gray-600 mb-6">
              đang chỉnh sửa mục này. Vui lòng thử lại sau.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render edit form
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
