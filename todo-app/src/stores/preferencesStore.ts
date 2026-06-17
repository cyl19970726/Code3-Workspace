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
  sortByPriority: boolean;
  showTimeWarnings: boolean;

  // Actions
  setLastViewedDate: (date: string) => Promise<void>;
  setSortOrder: (sortOrder: SortOrder) => Promise<void>;
  setSortByPriority: (sortByPriority: boolean) => Promise<void>;
  setShowTimeWarnings: (showTimeWarnings: boolean) => Promise<void>;
  loadPreferences: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      // Initial state
      lastViewedDate: getTodayISO(),
      sortOrder: 'newest-first',
      sortByPriority: false,
      showTimeWarnings: true,

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
              sortByPriority: initialData.preferences.sortByPriority,
              showTimeWarnings: initialData.preferences.showTimeWarnings,
            });
            return;
          }

          set({
            lastViewedDate: data.preferences.lastViewedDate,
            sortOrder: data.preferences.sortOrder,
            sortByPriority: data.preferences.sortByPriority,
            showTimeWarnings: data.preferences.showTimeWarnings,
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

      setSortByPriority: async (sortByPriority: boolean) => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const updatedData = {
            ...currentData,
            preferences: {
              ...currentData.preferences,
              sortByPriority,
            },
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
            },
          };

          await atomicWrite(updatedData);
          set({ sortByPriority });
        } catch (error) {
          console.error('Failed to save sortByPriority:', error);
        }
      },

      setShowTimeWarnings: async (showTimeWarnings: boolean) => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const updatedData = {
            ...currentData,
            preferences: {
              ...currentData.preferences,
              showTimeWarnings,
            },
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
            },
          };

          await atomicWrite(updatedData);
          set({ showTimeWarnings });
        } catch (error) {
          console.error('Failed to save showTimeWarnings:', error);
        }
      },
    }),
    {
      name: 'todo-app-preferences',
      skipHydration: true,
    }
  )
);
