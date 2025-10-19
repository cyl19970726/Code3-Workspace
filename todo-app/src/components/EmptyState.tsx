import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  date: string;
  isToday: boolean;
}

export default function EmptyState({ date, isToday }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <ClipboardDocumentListIcon
        className="mx-auto h-12 w-12 text-gray-400"
        role="img"
        aria-label="Empty state"
      />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {isToday ? 'No tasks for today' : 'No tasks for this date'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {isToday
          ? 'Add your first task to get started'
          : 'No tasks were added for this date'}
      </p>
    </div>
  );
}
