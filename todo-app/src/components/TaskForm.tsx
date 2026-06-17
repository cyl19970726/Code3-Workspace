import { useState, forwardRef, useEffect } from 'react';
import { validateTaskDescription } from '../utils/validation';
import { parseTimeInput, validateTimeInput } from '../utils/timeUtils';
import type { Task } from '../types';

interface TaskFormProps {
  onAddTask: (description: string, priority: Task['priority'], estimatedMinutes: number | null) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

const TaskForm = forwardRef<HTMLInputElement, TaskFormProps>(
  ({ onAddTask, readOnly = false, isLoading = false }, ref) => {
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('Unassigned');
    const [timeInput, setTimeInput] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [timeError, setTimeError] = useState<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate description
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
      onAddTask(description.trim(), priority, validTime);

      // Clear input
      setDescription('');
      setPriority('Unassigned');
      setTimeInput('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (value.length > 500) {
        value = value.slice(0, 500);
      }
      setDescription(value);
      setError(null);
    };

    return (
      <form onSubmit={handleSubmit} className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col gap-3">
          <div>
            <input
              ref={ref}
              type="text"
              value={description}
              onChange={handleChange}
              placeholder="Add a new task (press 'n' to focus)..."
              disabled={readOnly}
              maxLength={500}
              className="input-field w-full"
              aria-label="Task description"
            />
            {error && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 items-start">
            <div className="flex-1 min-w-[150px]">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                disabled={readOnly}
                className="input-field w-full"
                aria-label="Task priority"
              >
                <option value="Unassigned">Priority: Unassigned</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <input
                type="text"
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="Time (e.g. 90, 1.5h, 90m)"
                disabled={readOnly}
                className={`input-field w-full ${timeError ? 'border-red-500' : ''}`}
                aria-label="Estimated time"
              />
              {timeError && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {timeError}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={readOnly || isLoading || !!timeError}
              className="btn-primary flex items-center gap-2 whitespace-nowrap h-[42px] px-6"
              aria-label="Add task"
            >
              {isLoading && <span className="spinner w-4 h-4"></span>}
              <span>{isLoading ? 'Adding...' : 'Add Task'}</span>
            </button>
          </div>
        </div>
      </form>
    );
  }
);

TaskForm.displayName = 'TaskForm';

export default TaskForm;
