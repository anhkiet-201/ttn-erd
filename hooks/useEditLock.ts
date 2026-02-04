'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { LockRepository } from '@/repositories/lock.repository';
import { Lock } from '@/types';
import { useAuth } from './useAuth';

export function useEditLock(recordType: string, recordId: string | null) {
  const { user } = useAuth();
  const [lock, setLock] = useState<Lock | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isOwnLock, setIsOwnLock] = useState(false);
  const lockRepoRef = useRef(new LockRepository());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check lock status
  const checkLockStatus = useCallback(async () => {
    if (!recordId || !user) return;

    const currentLock = await lockRepoRef.current.checkLock(recordType, recordId);
    setLock(currentLock);
    setIsLocked(!!currentLock);
    setIsOwnLock(currentLock?.userId === user.uid);
  }, [recordType, recordId, user]);

  // Acquire lock
  const acquireLock = useCallback(async () => {
    if (!recordId || !user) {
      console.warn('Cannot acquire lock: missing recordId or user');
      return false;
    }

    const success = await lockRepoRef.current.acquireLock(recordType, recordId, {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
    });

    if (success) {
      setIsLocked(true);
      setIsOwnLock(true);
      
      // Update lock state immediately
      await checkLockStatus();
    }

    return success;
  }, [recordType, recordId, user, checkLockStatus]);

  // Release lock
  const releaseLock = useCallback(async () => {
    if (!recordId) return;

    await lockRepoRef.current.releaseLock(recordType, recordId);
    setIsLocked(false);
    setIsOwnLock(false);
    setLock(null);
  }, [recordType, recordId]);

  // Extend lock (keep alive)
  const extendLock = useCallback(async () => {
    if (!recordId || !user) return false;

    return await lockRepoRef.current.extendLock(recordType, recordId, user.uid);
  }, [recordType, recordId, user]);

  // Setup lock checking interval
  useEffect(() => {
    if (!recordId || !user) return;

    // Initial check
    checkLockStatus();

    // Poll lock status every 10 seconds
    checkIntervalRef.current = setInterval(checkLockStatus, 10000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [recordType, recordId, user, checkLockStatus]);

  // Auto-extend lock for own locks every 2 minutes
  useEffect(() => {
    if (!isOwnLock || !recordId) return;

    const extendInterval = setInterval(() => {
      extendLock();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(extendInterval);
  }, [isOwnLock, recordId, extendLock]);

  return {
    lock,
    isLocked,
    isOwnLock,
    acquireLock,
    releaseLock,
    extendLock,
    checkLockStatus,
  };
}
