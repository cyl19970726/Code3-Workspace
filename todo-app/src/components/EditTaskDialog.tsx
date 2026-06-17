import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { validateTaskDescription } from '../utils/validation';
import { parseTimeInput, validateTimeInput, formatTime } from '../utils/timeUtils';
import type { Task } from '../types';

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string, priority: Task['priority'], estimatedMinutes: number | null) => void;
  task: Task | null;
}

export default function EditTaskDialog({
  isOpen,
  onClose,
  onSave,
  task,
}: EditTaskDialogProps) {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('Unassigned');
  const [timeInput, setTimeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setPriority(task.priority || 'Unassigned');
      setTimeInput(formatTime(task.estimatedMinutes));
      setError(null);
      setTimeError(null);
    }
  }, [task, isOpen]);

  useEffect(() => {
    if (!timeInput.trim()) {
      setTimeError(null);
      return;
    }
    const timer = setTimeout(() => {
      const parsed = parseTimeInput(timeInput);
      const valError = validateTimeInput(parsed);
      setTimeError(valError);
    }, 100);
    return () => clearTimeout(timer);
  }, [timeInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateTaskDescription(description);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (timeError) {
      return;
    }

    const parsedTime = parseTimeInput(timeInput);
    const validTime = parsedTime !== null && !isNaN(parsedTime) ? parsedTime : null;

    // Clear error and submit
    setError(null);
    onSave(description.trim(), priority, validTime);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (value.length > 500) {
      value = value.slice(0, 500);
    }
    setDescription(value);
    setError(null);
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleCancel}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-6 text-left align-middle shadow-xl transition-all border border-slate-200 dark:border-slate-700">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  Edit Task
                </Dialog.Title>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Task Description
                    </label>
                    <textarea
                      id="task-description"
                      rows={4}
                      value={description}
                      onChange={handleChange}
                      maxLength={500}
                      className="input-field w-full resize-none"
                      placeholder="Enter task description..."
                      aria-label="Task description"
                    />
                    {error && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                        {error}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {description.length}/500 characters
                    </p>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      id="task-priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Task['priority'])}
                      className="input-field w-full"
                      aria-label="Task priority"
                    >
                      <option value="Unassigned">Priority: Unassigned</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="task-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Time
                    </label>
                    <input
                      id="task-time"
                      type="text"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      placeholder="Time (e.g. 90, 1.5h, 90m)"
                      className={`input-field w-full ${timeError ? 'border-red-500' : ''}`}
                      aria-label="Estimated time"
                    />
                    {timeError && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                        {timeError}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCancel}
                      aria-label="Cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!!timeError}
                      className="btn-primary"
                      aria-label="Save"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
