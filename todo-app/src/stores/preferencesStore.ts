import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SortOrder } from '../types';
import { getTodayISO } from '../utils/dateUtils';
import { readStorage, atomicWrite } from '../utils/storage';
import { createInitialAppData } from '../utils/validation';

interface PreferencesStore {
  // State
  lastViewedDate: string; // YYYY-MM-DD
  sortOrder: SortOrder;

  // Actions
  setLastViewedDate: (date: string) => Promise<void>;
  setSortOrder: (sortOrder: SortOrder) => Promise<void>;
  loadPreferences: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      // Initial state
      lastViewedDate: getTodayISO(),
      sortOrder: 'newest-first',

      // Load preferences from storage
      loadPreferences: async () => {
        try {
          const data = readStorage();

          if (!data) {
            const initialData = createInitialAppData();
            await atomicWrite(initialData);
            set({
              lastViewedDate: initialData.preferences.lastViewedDate,
              sortOrder: initialData.preferences.sortOrder,
            });
            return;
          }

          set({
            lastViewedDate: data.preferences.lastViewedDate,
            sortOrder: data.preferences.sortOrder,
          });
        } catch (error) {
          console.error('Failed to load preferences:', error);
        }
      },

      // Set last viewed date
      setLastViewedDate: async (date: string) => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const updatedData = {
            ...currentData,
            preferences: {
              ...currentData.preferences,
              lastViewedDate: date,
            },
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
            },
          };

          await atomicWrite(updatedData);
          set({ lastViewedDate: date });
        } catch (error) {
          console.error('Failed to save last viewed date:', error);
        }
      },

      // Set sort order
      setSortOrder: async (sortOrder: SortOrder) => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const updatedData = {
            ...currentData,
            preferences: {
              ...currentData.preferences,
              sortOrder,
            },
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
            },
          };

          await atomicWrite(updatedData);
          set({ sortOrder });
        } catch (error) {
          console.error('Failed to save sort order:', error);
        }
      },
    }),
    {
      name: 'todo-app-preferences',
      skipHydration: true,
    }
  )
);
