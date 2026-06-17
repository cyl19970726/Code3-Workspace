import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Task } from '../types';
import TaskItem from './TaskItem';
import { usePreferencesStore } from '../stores/preferencesStore';
import { formatTime } from '../utils/timeUtils';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRequestComplete: (task: Task) => void;
  readOnly?: boolean;
}

interface VirtualTaskSectionProps {
  tasks: Task[];
  title: string;
  count: number;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRequestComplete: (task: Task) => void;
  readOnly: boolean;
}

function VirtualTaskSection({
  tasks,
  title,
  count,
  onToggle,
  onEdit,
  onDelete,
  onRequestComplete,
  readOnly,
}: VirtualTaskSectionProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Use virtualizer only if we have many tasks (50+)
  const useVirtualization = tasks.length >= 50;

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated height of each task item
    overscan: 5, // Render 5 extra items above and below viewport
    enabled: useVirtualization,
  });

  if (!useVirtualization) {
    // For small lists, render normally without virtualization
    return (
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {title} ({count})
        </h3>
        <ul className="space-y-1" role="list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskItem
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onRequestComplete={onRequestComplete}
                readOnly={readOnly}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Virtual scrolling for large lists
  const items = virtualizer.getVirtualItems();

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {title} ({count})
      </h3>
      <div
        ref={parentRef}
        className="overflow-y-auto scrollbar-thin"
        style={{
          maxHeight: '400px', // Max height before scrolling
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <ul
            role="list"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
            }}
          >
            {items.map((virtualRow) => {
              const task = tasks[virtualRow.index];
              return (
                <li
                  key={task.id}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <TaskItem
                    task={task}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRequestComplete={onRequestComplete}
                    readOnly={readOnly}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

const priorityWeights = {
  High: 3,
  Medium: 2,
  Low: 1,
  Unassigned: 0,
};

export default function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onRequestComplete,
  readOnly = false,
}: TaskListProps) {
  const { sortOrder, sortByPriority, showTimeWarnings, setSortByPriority, setShowTimeWarnings, setSortOrder } = usePreferencesStore();

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (sortByPriority) {
        const aWeight = priorityWeights[a.priority || 'Unassigned'];
        const bWeight = priorityWeights[b.priority || 'Unassigned'];
        if (aWeight !== bWeight) {
          return bWeight - aWeight; // Higher weight comes first
        }
      }
      // Secondary sort: chronological
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest-first' ? timeB - timeA : timeA - timeB;
    });
    return sorted;
  }, [tasks, sortOrder, sortByPriority]);

  const pendingTasks = sortedTasks.filter((task) => !task.completed);
  const completedTasks = sortedTasks.filter((task) => task.completed);

  // Calculate totals
  const totalEstimated = pendingTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0);
  const totalActual = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
  const isOvertime = totalActual > totalEstimated && totalEstimated > 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sortByPriority}
              onChange={(e) => setSortByPriority(e.target.checked)}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Sort by Priority</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showTimeWarnings}
              onChange={(e) => setShowTimeWarnings(e.target.checked)}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-700 dark:text-gray-300">Show Time Warnings</span>
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="input-field text-sm py-1"
          >
            <option value="newest-first">Newest First</option>
            <option value="oldest-first">Oldest First</option>
          </select>
        </div>

        {/* Time Summary */}
        <div className="flex gap-4 text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            Pending: <span className="font-semibold text-gray-900 dark:text-white">{formatTime(totalEstimated) || '0m'}</span>
          </div>
          <div className={`text-gray-600 dark:text-gray-400 ${showTimeWarnings && isOvertime ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
            Actual: <span className="font-semibold text-gray-900 dark:text-white">{formatTime(totalActual) || '0m'}</span>
          </div>
        </div>
      </div>

      {/* Time Warning Banner */}
      {showTimeWarnings && isOvertime && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-lg text-sm flex items-center gap-2">
          ⚠️ <span>You have spent more time than originally estimated for today's tasks!</span>
        </div>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <VirtualTaskSection
          tasks={pendingTasks}
          title="Pending"
          count={pendingTasks.length}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onRequestComplete={onRequestComplete}
          readOnly={readOnly}
        />
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <VirtualTaskSection
          tasks={completedTasks}
          title="Completed"
          count={completedTasks.length}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onRequestComplete={onRequestComplete}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
