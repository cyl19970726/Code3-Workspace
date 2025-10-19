import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import {
  formatDate,
  addDays,
  getTodayISO,
  isToday as checkIsToday,
  isFuture,
  getDatesInMonth,
  getDayName,
  getMonthName,
  parseISO,
} from '../utils/dateUtils';
import type { TaskCounts } from '../types';

interface DatePickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  taskCounts?: TaskCounts;
  locale?: string;
}

export default function DatePicker({
  selectedDate,
  onDateChange,
  taskCounts = {},
  locale = 'en-US',
}: DatePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);

  const today = getTodayISO();
  const isSelectedToday = selectedDate === today;
  const isNextDisabled = isSelectedToday;

  const handlePrevDay = () => {
    const prevDate = addDays(selectedDate, -1);
    onDateChange(prevDate);
  };

  const handleNextDay = () => {
    if (!isNextDisabled) {
      const nextDate = addDays(selectedDate, 1);
      onDateChange(nextDate);
    }
  };

  const handleDateSelect = (date: string) => {
    onDateChange(date);
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => {
    const date = parseISO(calendarMonth);
    date.setMonth(date.getMonth() - 1);
    setCalendarMonth(formatDate(date, 'yyyy-MM-dd'));
  };

  const handleNextMonth = () => {
    const date = parseISO(calendarMonth);
    date.setMonth(date.getMonth() + 1);
    setCalendarMonth(formatDate(date, 'yyyy-MM-dd'));
  };

  const handleTodayClick = () => {
    onDateChange(today);
    setCalendarMonth(today);
    setIsCalendarOpen(false);
  };

  // Generate calendar dates
  const monthDates = getDatesInMonth(calendarMonth);
  const firstDate = parseISO(monthDates[0]);
  const startDay = firstDate.getDay(); // 0 = Sunday

  // Pad with empty cells for alignment
  const paddedDates = [
    ...Array(startDay).fill(null),
    ...monthDates,
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Previous day button */}
      <button
        type="button"
        onClick={handlePrevDay}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
      </button>

      {/* Date display (opens calendar) */}
      <button
        type="button"
        onClick={() => setIsCalendarOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Pick date"
      >
        <CalendarIcon className="h-5 w-5 text-gray-600" />
        <span className="text-lg font-medium text-gray-900">
          {formatDate(selectedDate, 'MMMM d, yyyy')}
        </span>
      </button>

      {/* Next day button */}
      <button
        type="button"
        onClick={handleNextDay}
        disabled={isNextDisabled}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
      </button>

      {/* Calendar Dialog */}
      <Transition appear show={isCalendarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCalendarOpen(false)}>
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
                    Select Date
                  </Dialog.Title>

                  {/* Month navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label="Previous month"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <span className="font-medium">
                      {getMonthName(calendarMonth)} {formatDate(calendarMonth, 'yyyy')}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label="Next month"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Day names */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {paddedDates.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} />;
                      }

                      const isSelected = date === selectedDate;
                      const isTodayDate = checkIsToday(date);
                      const isFutureDate = isFuture(date);
                      const taskCount = taskCounts[date] || 0;
                      const dayNum = formatDate(date, 'd');

                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => handleDateSelect(date)}
                          disabled={isFutureDate}
                          className={`
                            relative p-2 text-sm rounded-lg transition-colors
                            ${isSelected ? 'bg-primary-600 text-white selected active' : ''}
                            ${isTodayDate && !isSelected ? 'border-2 border-primary-600 today' : ''}
                            ${isFutureDate ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                            ${!isSelected && !isFutureDate ? 'text-gray-900' : ''}
                          `}
                          aria-label={`${dayNum}${isTodayDate ? ' today' : ''}${isSelected ? ' selected' : ''}${taskCount > 0 ? ` ${taskCount} tasks` : ''}`}
                        >
                          <span>{dayNum}</span>
                          {taskCount > 0 && (
                            <span className={`block text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                              {taskCount} task{taskCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick actions */}
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleTodayClick}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Today
                    </button>
                    <p className="text-xs text-gray-500">
                      Arrow keys to navigate
                    </p>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
