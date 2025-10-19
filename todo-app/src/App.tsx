import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTaskStore } from './stores/taskStore';
import { useAppStore } from './stores/appStore';
import { usePreferencesStore } from './stores/preferencesStore';
import { isToday, addDays, getTodayISO } from './utils/dateUtils';
import { exportRawData, clearStorage } from './utils/storage';
import { createInitialAppData } from './utils/validation';
import { atomicWrite } from './utils/storage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import DatePicker from './components/DatePicker';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import EmptyState from './components/EmptyState';
import ErrorBanner from './components/ErrorBanner';

// Lazy-loaded dialog components (code splitting)
const DeleteConfirmDialog = lazy(() => import('./components/DeleteConfirmDialog'));
const EditTaskDialog = lazy(() => import('./components/EditTaskDialog'));

import type { Task } from './types';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stores
  const {
    tasks,
    isLoading,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    getTasksByDate,
    getTaskCounts,
  } = useTaskStore();

  const {
    selectedDate,
    setSelectedDate,
    initializeApp,
    isReadOnlyMode,
    readOnlyReason,
  } = useAppStore();

  const { setLastViewedDate, loadPreferences } = usePreferencesStore();

  // Initialize app on mount
  useEffect(() => {
    const initialize = async () => {
      await initializeApp();
      await loadPreferences();
      await loadTasks();
      setIsInitialized(true);
    };

    initialize();
  }, [initializeApp, loadPreferences, loadTasks]);

  // Update last viewed date when selected date changes
  useEffect(() => {
    if (isInitialized) {
      setLastViewedDate(selectedDate);
    }
  }, [selectedDate, setLastViewedDate, isInitialized]);

  // Keyboard shortcuts
  useKeyboardShortcuts(
    [
      {
        key: 'n',
        description: 'Focus task input',
        handler: () => {
          if (inputRef.current && !isReadOnlyMode) {
            inputRef.current.focus();
          }
        },
      },
      {
        key: 'ArrowLeft',
        description: 'Previous day',
        handler: () => {
          const prevDate = addDays(selectedDate, -1);
          setSelectedDate(prevDate);
        },
      },
      {
        key: 'ArrowRight',
        description: 'Next day',
        handler: () => {
          const today = getTodayISO();
          if (selectedDate < today) {
            const nextDate = addDays(selectedDate, 1);
            setSelectedDate(nextDate);
          }
        },
      },
      {
        key: 't',
        description: 'Go to today',
        handler: () => {
          setSelectedDate(getTodayISO());
        },
      },
      {
        key: 'Escape',
        description: 'Close dialogs',
        handler: () => {
          setDeleteTaskId(null);
          setEditTask(null);
        },
      },
      {
        key: 'e',
        ctrlKey: true,
        description: 'Export data',
        handler: () => {
          handleExportData();
        },
      },
    ],
    isInitialized && !isReadOnlyMode
  );

  // Handlers
  const handleAddTask = (description: string) => {
    addTask(description, selectedDate);
  };

  const handleToggleTask = (id: string) => {
    toggleTaskCompletion(id);
  };

  const handleEditTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      setEditTask(task);
    }
  };

  const handleSaveEdit = (description: string) => {
    if (editTask) {
      updateTask(editTask.id, { description });
    }
  };

  const handleDeleteTask = (id: string) => {
    setDeleteTaskId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteTaskId) {
      deleteTask(deleteTaskId);
      setDeleteTaskId(null);
    }
  };

  const handleExportData = () => {
    const rawData = exportRawData();
    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-app-backup-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetStorage = async () => {
    if (
      confirm('This will delete all your tasks. Are you sure?')
    ) {
      clearStorage();
      const initialData = createInitialAppData();
      await atomicWrite(initialData);
      window.location.reload();
    }
  };

  // Get tasks for selected date
  const currentTasks = getTasksByDate(selectedDate);
  const taskCounts = getTaskCounts();
  const isSelectedToday = isToday(selectedDate);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 border-4 text-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Daily Todo</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your tasks day by day
          </p>
        </header>

        {/* Error Banner (Read-Only Mode) */}
        {isReadOnlyMode && readOnlyReason && (
          <ErrorBanner
            message={readOnlyReason}
            onExport={handleExportData}
            onReset={handleResetStorage}
          />
        )}

        {/* Date Picker */}
        <DatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          taskCounts={taskCounts}
        />

        {/* Task Form */}
        <TaskForm
          ref={inputRef}
          onAddTask={handleAddTask}
          readOnly={isReadOnlyMode}
          isLoading={isLoading}
        />

        {/* Task List or Empty State */}
        {currentTasks.length === 0 ? (
          <EmptyState date={selectedDate} isToday={isSelectedToday} />
        ) : (
          <TaskList
            tasks={currentTasks}
            onToggle={handleToggleTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            readOnly={isReadOnlyMode}
          />
        )}

        {/* Delete Confirm Dialog */}
        <Suspense fallback={null}>
          <DeleteConfirmDialog
            isOpen={deleteTaskId !== null}
            onClose={() => setDeleteTaskId(null)}
            onConfirm={handleConfirmDelete}
            taskDescription={
              deleteTaskId ? tasks.find((t) => t.id === deleteTaskId)?.description : undefined
            }
          />
        </Suspense>

        {/* Edit Task Dialog */}
        <Suspense fallback={null}>
          <EditTaskDialog
            isOpen={editTask !== null}
            onClose={() => setEditTask(null)}
            onSave={handleSaveEdit}
            task={editTask}
          />
        </Suspense>

        {/* Toast Notifications */}
        <Toaster position="top-right" />
      </div>
    </div>
  );
}

export default App;
