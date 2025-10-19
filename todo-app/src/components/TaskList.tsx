import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Task } from '../types';
import TaskItem from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

interface VirtualTaskSectionProps {
  tasks: Task[];
  title: string;
  count: number;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly: boolean;
}

function VirtualTaskSection({
  tasks,
  title,
  count,
  onToggle,
  onEdit,
  onDelete,
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
        <h3 className="text-sm font-medium text-gray-700 mb-3">
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
      <h3 className="text-sm font-medium text-gray-700 mb-3">
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
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TaskItem
                    task={task}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
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

export default function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  readOnly = false,
}: TaskListProps) {
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="space-y-6">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <VirtualTaskSection
          tasks={pendingTasks}
          title="Pending"
          count={pendingTasks.length}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
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
          readOnly={readOnly}
        />
      )}
    </div>
  );
}
