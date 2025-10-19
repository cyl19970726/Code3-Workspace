import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { validateTaskDescription } from '../utils/validation';
import type { Task } from '../types';

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  task: Task | null;
}

export default function EditTaskDialog({
  isOpen,
  onClose,
  onSave,
  task,
}: EditTaskDialogProps) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      setError(null);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validationError = validateTaskDescription(description);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Clear error and submit
    setError(null);
    onSave(description.trim());
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    // Enforce max length
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Edit Task
                </Dialog.Title>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
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
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {description.length}/500 characters
                    </p>
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
