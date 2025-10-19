import { create } from 'zustand';
import { getTodayISO } from '../utils/dateUtils';
import { validateStorage } from '../utils/storage';
import { acquireTabLock, isLockActive } from '../utils/tabLock';

interface AppStore {
  // State
  selectedDate: string; // YYYY-MM-DD
  isReadOnlyMode: boolean;
  readOnlyReason: string | null;
  hasTabLock: boolean;
  lockId: string | null;
  isInitialized: boolean;

  // Actions
  setSelectedDate: (date: string) => void;
  initializeApp: () => Promise<void>;
  enterReadOnlyMode: (reason: string) => void;
  exitReadOnlyMode: () => void;
  attemptAcquireTabLock: () => Promise<boolean>;
}

export const useAppStore = create<AppStore>()((set, get) => ({
  // Initial state
  selectedDate: getTodayISO(),
  isReadOnlyMode: false,
  readOnlyReason: null,
  hasTabLock: false,
  lockId: null,
  isInitialized: false,

  // Set selected date (for navigation)
  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },

  // Initialize app (check storage, tab lock, etc.)
  initializeApp: async () => {
    try {
      // Check storage integrity
      const storageValid = validateStorage();
      if (!storageValid) {
        set({
          isReadOnlyMode: true,
          readOnlyReason: 'Storage corrupted. Please reset or export your data.',
        });
        return;
      }

      // Check if another tab already has the lock
      const lockActive = isLockActive();
      if (lockActive) {
        set({
          isReadOnlyMode: true,
          readOnlyReason: 'Another tab is already open. Please close other tabs to edit tasks.',
        });
        return;
      }

      // Try to acquire tab lock
      const { acquired, lockId } = await acquireTabLock();
      if (!acquired) {
        set({
          isReadOnlyMode: true,
          readOnlyReason: 'Could not acquire tab lock. Multiple tabs detected.',
          hasTabLock: false,
        });
        return;
      }

      // Successfully initialized
      set({
        hasTabLock: true,
        lockId,
        isReadOnlyMode: false,
        readOnlyReason: null,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({
        isReadOnlyMode: true,
        readOnlyReason: 'Initialization failed. Please refresh the page.',
      });
    }
  },

  // Enter read-only mode (e.g., storage quota exceeded)
  enterReadOnlyMode: (reason: string) => {
    set({
      isReadOnlyMode: true,
      readOnlyReason: reason,
    });
  },

  // Exit read-only mode (e.g., after recovery)
  exitReadOnlyMode: () => {
    set({
      isReadOnlyMode: false,
      readOnlyReason: null,
    });
  },

  // Attempt to acquire tab lock
  attemptAcquireTabLock: async () => {
    const { acquired, lockId } = await acquireTabLock();

    if (acquired) {
      set({
        hasTabLock: true,
        lockId,
        isReadOnlyMode: false,
        readOnlyReason: null,
      });
      return true;
    }

    return false;
  },
}));
