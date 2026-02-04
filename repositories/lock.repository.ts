import { ref, set, get, remove } from 'firebase/database';
import { database } from '@/lib/firebase/config';
import { Lock } from '@/types';

export class LockRepository {
  private LOCK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Acquire lock for a record
   * @returns true if lock acquired, false if already locked by another user
   */
  async acquireLock(
    recordType: string,
    recordId: string,
    user: { uid: string; displayName: string; email: string }
  ): Promise<boolean> {
    const lockKey = `${recordType}_${recordId}`;
    const lockRef = ref(database, `locks/${lockKey}`);
    
    try {
      const snapshot = await get(lockRef);

      if (snapshot.exists()) {
        const existingLock = snapshot.val() as Lock;
        const now = Date.now();

        // Check if lock has expired
        if (now > existingLock.expiresAt) {
          // Lock expired, remove it
          await this.releaseLock(recordType, recordId);
        } else if (existingLock.userId !== user.uid) {
          // Lock held by another user and not expired
          return false;
        }
        // If lock is owned by same user, allow re-acquisition
      }

      // Acquire/renew lock
      const lockData: Lock = {
        userId: user.uid,
        userName: user.displayName || 'Unknown User',
        userEmail: user.email || '',
        lockedAt: Date.now(),
        expiresAt: Date.now() + this.LOCK_DURATION,
      };

      await set(lockRef, lockData);
      return true;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return false;
    }
  }

  /**
   * Release lock for a record
   */
  async releaseLock(recordType: string, recordId: string): Promise<void> {
    const lockKey = `${recordType}_${recordId}`;
    const lockRef = ref(database, `locks/${lockKey}`);

    try {
      await remove(lockRef);
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }

  /**
   * Check current lock status for a record
   * @returns Lock object if locked, null if available
   */
  async checkLock(recordType: string, recordId: string): Promise<Lock | null> {
    const lockKey = `${recordType}_${recordId}`;
    const lockRef = ref(database, `locks/${lockKey}`);

    try {
      const snapshot = await get(lockRef);

      if (snapshot.exists()) {
        const lock = snapshot.val() as Lock;
        const now = Date.now();

        // Check if lock has expired
        if (now > lock.expiresAt) {
          // Auto-remove expired lock
          await this.releaseLock(recordType, recordId);
          return null;
        }

        return lock;
      }

      return null;
    } catch (error) {
      console.error('Error checking lock:', error);
      return null;
    }
  }

  /**
   * Extend lock expiry time (for active users)
   */
  async extendLock(
    recordType: string,
    recordId: string,
    userId: string
  ): Promise<boolean> {
    const lockKey = `${recordType}_${recordId}`;
    const lockRef = ref(database, `locks/${lockKey}`);

    try {
      const snapshot = await get(lockRef);

      if (snapshot.exists()) {
        const lock = snapshot.val() as Lock;

        // Only extend if owned by same user
        if (lock.userId === userId) {
          lock.expiresAt = Date.now() + this.LOCK_DURATION;
          await set(lockRef, lock);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error extending lock:', error);
      return false;
    }
  }
}
