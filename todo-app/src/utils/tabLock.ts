/**
 * Tab lock utility for detecting and preventing multi-tab conflicts
 * Uses localStorage + BroadcastChannel for cross-tab communication
 */

const LOCK_KEY = 'todo-app-lock';
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes (zombie tab cleanup)
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

interface LockData {
  lockId: string;
  timestamp: number;
}

let currentLockId: string | null = null;
let heartbeatTimer: number | null = null;
let broadcastChannel: BroadcastChannel | null = null;

/**
 * Attempt to acquire tab lock
 * @returns {acquired: boolean, lockId: string | null}
 */
export async function acquireTabLock(): Promise<{
  acquired: boolean;
  lockId: string | null;
}> {
  try {
    const existingLock = getLockData();

    // Check if lock is stale (zombie tab)
    if (existingLock) {
      const age = Date.now() - existingLock.timestamp;
      if (age < LOCK_TIMEOUT) {
        // Lock is active, cannot acquire
        return { acquired: false, lockId: null };
      }
      // Lock is stale, clean it up
      console.log('Cleaning up stale lock from zombie tab');
    }

    // Acquire new lock
    const lockId = crypto.randomUUID();
    const lockData: LockData = {
      lockId,
      timestamp: Date.now(),
    };

    localStorage.setItem(LOCK_KEY, JSON.stringify(lockData));

    // Verify lock was acquired
    const verified = getLockData();
    if (verified?.lockId !== lockId) {
      return { acquired: false, lockId: null };
    }

    // Set current lock ID and start heartbeat
    currentLockId = lockId;
    startHeartbeat();

    // Setup cleanup on window close
    window.addEventListener('beforeunload', () => {
      releaseTabLock(lockId);
    });

    return { acquired: true, lockId };
  } catch (error) {
    console.error('Failed to acquire tab lock:', error);
    return { acquired: false, lockId: null };
  }
}

/**
 * Release tab lock
 */
export async function releaseTabLock(lockId: string): Promise<void> {
  try {
    const existingLock = getLockData();

    // Only release if we own the lock
    if (existingLock?.lockId === lockId) {
      localStorage.removeItem(LOCK_KEY);
      currentLockId = null;
      stopHeartbeat();

      // Notify other tabs
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'lock-released' });
      }
    }
  } catch (error) {
    console.error('Failed to release tab lock:', error);
  }
}

/**
 * Check if lock is currently active
 */
export function isLockActive(): boolean {
  const lock = getLockData();
  if (!lock) {
    return false;
  }

  const age = Date.now() - lock.timestamp;
  return age < LOCK_TIMEOUT;
}

/**
 * Get current lock data
 */
function getLockData(): LockData | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as LockData;
  } catch {
    return null;
  }
}

/**
 * Update lock timestamp (heartbeat)
 */
function updateHeartbeat(): void {
  if (!currentLockId) {
    return;
  }

  try {
    const lockData: LockData = {
      lockId: currentLockId,
      timestamp: Date.now(),
    };

    localStorage.setItem(LOCK_KEY, JSON.stringify(lockData));
  } catch (error) {
    console.error('Heartbeat update failed:', error);
  }
}

/**
 * Start heartbeat timer
 */
function startHeartbeat(): void {
  stopHeartbeat(); // Clear any existing timer

  heartbeatTimer = window.setInterval(() => {
    updateHeartbeat();
  }, HEARTBEAT_INTERVAL);
}

/**
 * Stop heartbeat timer
 */
function stopHeartbeat(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/**
 * Setup listener for lock status changes
 * @param callback Function to call when lock status changes
 * @returns Cleanup function
 */
export function setupTabLockListener(
  callback: () => void
): () => void {
  // Listen for storage events (cross-tab)
  const storageListener = (event: StorageEvent) => {
    if (event.key === LOCK_KEY) {
      callback();
    }
  };

  window.addEventListener('storage', storageListener);

  // Setup BroadcastChannel for better cross-tab communication
  try {
    broadcastChannel = new BroadcastChannel('todo-app-lock-channel');

    broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'lock-acquired' || event.data.type === 'lock-released') {
        callback();
      }
    };
  } catch (error) {
    // BroadcastChannel not supported, fallback to storage events only
    console.warn('BroadcastChannel not supported, using storage events only');
  }

  // Cleanup function
  return () => {
    window.removeEventListener('storage', storageListener);
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
  };
}

/**
 * Notify other tabs that lock was acquired
 */
export function notifyLockAcquired(): void {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: 'lock-acquired' });
  }
}
