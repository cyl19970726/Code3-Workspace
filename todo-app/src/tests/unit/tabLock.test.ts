import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// These tests will fail until tabLock.ts is implemented (TDD Red phase)
describe('Tab Lock Utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('acquireTabLock', () => {
    it('should successfully acquire lock when none exists', async () => {
      const { acquireTabLock } = await import('../../utils/tabLock');

      const result = await acquireTabLock();
      expect(result.acquired).toBe(true);
      expect(result.lockId).toBeTruthy();

      const lockKey = localStorage.getItem('todo-app-lock');
      expect(lockKey).not.toBeNull();
    });

    it('should fail to acquire lock when already held by another tab', async () => {
      const { acquireTabLock } = await import('../../utils/tabLock');

      // Simulate existing lock
      const existingLockId = crypto.randomUUID();
      localStorage.setItem(
        'todo-app-lock',
        JSON.stringify({
          lockId: existingLockId,
          timestamp: Date.now(),
        })
      );

      const result = await acquireTabLock();
      expect(result.acquired).toBe(false);
      expect(result.lockId).toBeNull();
    });

    it('should acquire lock after zombie tab timeout', async () => {
      const { acquireTabLock } = await import('../../utils/tabLock');

      // Simulate stale lock (5 minutes old)
      const staleLockId = crypto.randomUUID();
      localStorage.setItem(
        'todo-app-lock',
        JSON.stringify({
          lockId: staleLockId,
          timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        })
      );

      const result = await acquireTabLock();
      expect(result.acquired).toBe(true);
      expect(result.lockId).not.toBe(staleLockId);
    });
  });

  describe('releaseTabLock', () => {
    it('should release held lock', async () => {
      const { acquireTabLock, releaseTabLock } = await import(
        '../../utils/tabLock'
      );

      const { lockId } = await acquireTabLock();
      expect(lockId).toBeTruthy();

      await releaseTabLock(lockId!);

      const lockKey = localStorage.getItem('todo-app-lock');
      expect(lockKey).toBeNull();
    });

    it('should not release lock held by different tab', async () => {
      const { releaseTabLock } = await import('../../utils/tabLock');

      const existingLockId = crypto.randomUUID();
      localStorage.setItem(
        'todo-app-lock',
        JSON.stringify({
          lockId: existingLockId,
          timestamp: Date.now(),
        })
      );

      const differentLockId = crypto.randomUUID();
      await releaseTabLock(differentLockId);

      const lockKey = localStorage.getItem('todo-app-lock');
      expect(lockKey).not.toBeNull();
    });
  });

  describe('isLockActive', () => {
    it('should detect active lock', async () => {
      const { isLockActive } = await import('../../utils/tabLock');

      const lockId = crypto.randomUUID();
      localStorage.setItem(
        'todo-app-lock',
        JSON.stringify({
          lockId,
          timestamp: Date.now(),
        })
      );

      const result = isLockActive();
      expect(result).toBe(true);
    });

    it('should detect no active lock', async () => {
      const { isLockActive } = await import('../../utils/tabLock');

      const result = isLockActive();
      expect(result).toBe(false);
    });

    it('should detect stale lock as inactive', async () => {
      const { isLockActive } = await import('../../utils/tabLock');

      localStorage.setItem(
        'todo-app-lock',
        JSON.stringify({
          lockId: crypto.randomUUID(),
          timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
        })
      );

      const result = isLockActive();
      expect(result).toBe(false);
    });
  });

  describe('setupTabLockListener', () => {
    it('should setup BroadcastChannel listener', async () => {
      const { setupTabLockListener } = await import('../../utils/tabLock');

      const callback = vi.fn();
      const cleanup = setupTabLockListener(callback);

      expect(cleanup).toBeInstanceOf(Function);

      // Cleanup
      cleanup();
    });

    it('should call callback when lock status changes', async () => {
      const { setupTabLockListener } = await import('../../utils/tabLock');

      const callback = vi.fn();
      const cleanup = setupTabLockListener(callback);

      // Simulate lock status change
      const event = new StorageEvent('storage', {
        key: 'todo-app-lock',
        newValue: JSON.stringify({
          lockId: crypto.randomUUID(),
          timestamp: Date.now(),
        }),
      });

      window.dispatchEvent(event);

      // Should have called callback
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(callback).toHaveBeenCalled();

      cleanup();
    });
  });

  describe('zombie tab cleanup', () => {
    it('should clean up zombie tabs on beforeunload', async () => {
      const { acquireTabLock } = await import('../../utils/tabLock');

      const { lockId } = await acquireTabLock();
      expect(lockId).toBeTruthy();

      // Simulate window unload
      const beforeUnloadEvent = new Event('beforeunload');
      window.dispatchEvent(beforeUnloadEvent);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const lockKey = localStorage.getItem('todo-app-lock');
      // Lock should be released
      expect(lockKey).toBeNull();
    });
  });
});
