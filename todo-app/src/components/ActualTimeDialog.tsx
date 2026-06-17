import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { parseTimeInput, validateTimeInput } from '../utils/timeUtils';

interface ActualTimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (actualMinutes: number) => void;
  onSkip: () => void;
  taskDescription: string;
}

export default function ActualTimeDialog({
  isOpen,
  onClose,
  onSave,
  onSkip,
  taskDescription,
}: ActualTimeDialogProps) {
  const [timeInput, setTimeInput] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeInput('');
      setTimeError(null);
    }
  }, [isOpen]);

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

    if (timeError) {
      return;
    }

    const parsedTime = parseTimeInput(timeInput);
    if (parsedTime !== null && !isNaN(parsedTime)) {
      onSave(parsedTime);
      onClose();
    } else {
      // if they hit save with empty input, just skip or enforce?
      // the spec says "Skip" button is for bypassing. So Save should require a valid input.
      setTimeError('Please enter a valid time or click Skip.');
    }
  };

  const handleSkip = () => {
    onSkip();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleSkip}>
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
                  Enter actual time
                </Dialog.Title>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  How long did it actually take to complete: <br />
                  <strong>{taskDescription}</strong>?
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <input
                      type="text"
                      value={timeInput}
                      onChange={(e) => setTimeInput(e.target.value)}
                      placeholder="Time (e.g. 90, 1.5h, 90m)"
                      className={`input-field w-full ${timeError ? 'border-red-500' : ''}`}
                      aria-label="Actual time"
                      autoFocus
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
                      onClick={handleSkip}
                      aria-label="Skip"
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      disabled={!!timeError || !timeInput.trim()}
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
