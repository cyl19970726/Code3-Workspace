import { useState, memo } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Task } from '../types';
import { getRelativeTime } from '../utils/dateUtils';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const TaskItem = memo(function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  readOnly = false,
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongDescription = task.description.length > 200;
  const displayDescription = isExpanded || !isLongDescription
    ? task.description
    : task.description.slice(0, 200) + '...';

  return (
    <div
      className={`group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
        task.completed ? 'opacity-75' : ''
      }`}
      data-task-id={task.id}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        disabled={readOnly}
        className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
        aria-label={`Mark ${task.description} as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm text-gray-900 break-words ${
            task.completed ? 'line-through text-gray-500' : ''
          }`}
        >
          {displayDescription}
        </p>

        {isLongDescription && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary-600 hover:text-primary-700 mt-1"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}

        {/* Timestamps */}
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span>Created at {getRelativeTime(task.createdAt)}</span>
          {task.completed && task.completedAt && (
            <span className="text-green-600">
              Completed at {getRelativeTime(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(task.id)}
          disabled={readOnly}
          className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-50 transition-colors"
          aria-label="Edit task"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          disabled={readOnly}
          className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
          aria-label="Delete task"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

export default TaskItem;
