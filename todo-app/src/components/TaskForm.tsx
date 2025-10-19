import { useState, forwardRef } from 'react';
import { validateTaskDescription } from '../utils/validation';

interface TaskFormProps {
  onAddTask: (description: string) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

const TaskForm = forwardRef<HTMLInputElement, TaskFormProps>(
  ({ onAddTask, readOnly = false, isLoading = false }, ref) => {
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate
      const validationError = validateTaskDescription(description);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Clear error and submit
      setError(null);
      onAddTask(description.trim());

      // Clear input
      setDescription('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      // Enforce max length at input level
      if (value.length > 500) {
        value = value.slice(0, 500);
      }

      setDescription(value);
      setError(null); // Clear error on typing
    };

    return (
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
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
          <button
            type="submit"
            disabled={readOnly || isLoading}
            className="btn-primary flex items-center gap-2"
            aria-label="Add task"
          >
            {isLoading && <span className="spinner w-4 h-4"></span>}
            <span>{isLoading ? 'Adding...' : 'Add Task'}</span>
          </button>
        </div>
      </form>
    );
  }
);

TaskForm.displayName = 'TaskForm';

export default TaskForm;
