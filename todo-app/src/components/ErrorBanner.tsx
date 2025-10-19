import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorBannerProps {
  message: string;
  onReset?: () => void;
  onExport?: () => void;
}

export default function ErrorBanner({ message, onReset, onExport }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Read-Only Mode</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {(onReset || onExport) && (
            <div className="mt-4 flex space-x-3">
              {onExport && (
                <button
                  type="button"
                  onClick={onExport}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Export Raw Data
                </button>
              )}
              {onReset && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Reset Storage
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
