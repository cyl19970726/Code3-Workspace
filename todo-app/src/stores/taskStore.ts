import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, AppData } from '../types';
import { atomicWrite, readStorage, clearStorage } from '../utils/storage';
import { createInitialAppData } from '../utils/validation';
import { getTodayISO } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface TaskStore {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTasks: () => Promise<void>;
  addTask: (description: string, date?: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  getTasksByDate: (date: string) => Task[];
  getTaskCounts: () => Record<string, number>;
  bulkDeleteCompleted: () => Promise<void>;
  clearAllTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      isLoading: false,
      error: null,

      // Load tasks from storage
      loadTasks: async () => {
        set({ isLoading: true, error: null });

        try {
          const data = readStorage();

          if (!data) {
            // Initialize with empty data
            const initialData = createInitialAppData();
            await atomicWrite(initialData);
            set({ tasks: [], isLoading: false });
            return;
          }

          set({ tasks: data.tasks, isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
          set({ error: errorMessage, isLoading: false });
          console.error('Failed to load tasks:', error);
        }
      },

      // Add new task
      addTask: async (description: string, date?: string) => {
        const trimmedDescription = description.trim();

        if (trimmedDescription.length === 0) {
          toast.error('Task description cannot be empty');
          return;
        }

        if (trimmedDescription.length > 500) {
          toast.error('Task description must be 500 characters or less');
          return;
        }

        try {
          const newTask: Task = {
            id: crypto.randomUUID(),
            description: trimmedDescription,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            date: date || getTodayISO(),
          };

          const currentData = readStorage() || createInitialAppData();
          const updatedTasks = [...currentData.tasks, newTask];

          const updatedData: AppData = {
            ...currentData,
            tasks: updatedTasks,
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
              totalTaskCount: updatedTasks.length,
              newestTaskDate: newTask.date,
              oldestTaskDate: currentData.metadata.oldestTaskDate || newTask.date,
            },
          };

          await atomicWrite(updatedData);
          set({ tasks: updatedTasks });
          toast.success('Task added');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add task';
          toast.error(errorMessage);
          console.error('Failed to add task:', error);
        }
      },

      // Update existing task
      updateTask: async (id: string, updates: Partial<Task>) => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const updatedTasks = currentData.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          );

          const updatedData: AppData = {
            ...currentData,
            tasks: updatedTasks,
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
            },
          };

          await atomicWrite(updatedData);
          set({ tasks: updatedTasks });
          toast.success('Task updated');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
          toast.error(errorMessage);
          console.error('Failed to update task:', error);
        }
      },

      // Delete task
      deleteTask: async (id: string) => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const updatedTasks = currentData.tasks.filter((task) => task.id !== id);

          const updatedData: AppData = {
            ...currentData,
            tasks: updatedTasks,
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
              totalTaskCount: updatedTasks.length,
            },
          };

          await atomicWrite(updatedData);
          set({ tasks: updatedTasks });
          toast.success('Task deleted');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
          toast.error(errorMessage);
          console.error('Failed to delete task:', error);
        }
      },

      // Toggle task completion
      toggleTaskCompletion: async (id: string) => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const updatedTasks = currentData.tasks.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                completed: !task.completed,
                completedAt: !task.completed ? new Date().toISOString() : null,
              };
            }
            return task;
          });

          const updatedData: AppData = {
            ...currentData,
            tasks: updatedTasks,
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
            },
          };

          await atomicWrite(updatedData);
          set({ tasks: updatedTasks });

          const task = updatedTasks.find((t) => t.id === id);
          if (task?.completed) {
            toast.success('Task completed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to toggle task';
          toast.error(errorMessage);
          console.error('Failed to toggle task:', error);
        }
      },

      // Get tasks for a specific date
      getTasksByDate: (date: string) => {
        const { tasks } = get();
        return tasks.filter((task) => task.date === date);
      },

      // Get task counts per date
      getTaskCounts: () => {
        const { tasks } = get();
        const counts: Record<string, number> = {};

        tasks.forEach((task) => {
          counts[task.date] = (counts[task.date] || 0) + 1;
        });

        return counts;
      },

      // Bulk delete completed tasks
      bulkDeleteCompleted: async () => {
        try {
          const currentData = readStorage();
          if (!currentData) {
            throw new Error('No data found');
          }

          const completedCount = currentData.tasks.filter((t) => t.completed).length;
          const updatedTasks = currentData.tasks.filter((task) => !task.completed);

          const updatedData: AppData = {
            ...currentData,
            tasks: updatedTasks,
            metadata: {
              ...currentData.metadata,
              lastModified: new Date().toISOString(),
              totalTaskCount: updatedTasks.length,
            },
          };

          await atomicWrite(updatedData);
          set({ tasks: updatedTasks });
          toast.success(`${completedCount} completed tasks deleted`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete tasks';
          toast.error(errorMessage);
          console.error('Failed to bulk delete:', error);
        }
      },

      // Clear all tasks
      clearAllTasks: async () => {
        try {
          clearStorage();
          const initialData = createInitialAppData();
          await atomicWrite(initialData);
          set({ tasks: [] });
          toast.success('All tasks cleared');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to clear tasks';
          toast.error(errorMessage);
          console.error('Failed to clear tasks:', error);
        }
      },
    }),
    {
      name: 'todo-app-tasks',
      skipHydration: true, // We'll manually hydrate in the App component
    }
  )
);
