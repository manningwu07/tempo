"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "~/lib/utils";

type MiniCalendarProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
};

export function MiniCalendar({
  selectedDate,
  onDateChange,
  className,
}: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    const startOffset = firstDay.getDay();
    
    // Array of day numbers to display
    const daysArray: Array<{
      date: Date | null;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Add previous month's days
    for (let i = 0; i < startOffset; i++) {
      const prevDate = new Date(year, month, -startOffset + i + 1);
      daysArray.push({
        date: prevDate,
        isCurrentMonth: false,
        isToday: isSameDay(prevDate, new Date()),
        isSelected: isSameDay(prevDate, selectedDate),
      });
    }

    // Add current month's days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      daysArray.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: isSameDay(currentDate, new Date()),
        isSelected: isSameDay(currentDate, selectedDate),
      });
    }

    // Calculate how many days from next month are needed to complete the grid
    const totalCells = Math.ceil(daysArray.length / 7) * 7;
    const remainingCells = totalCells - daysArray.length;
    
    // Add next month's days
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      daysArray.push({
        date: nextDate,
        isCurrentMonth: false,
        isToday: isSameDay(nextDate, new Date()),
        isSelected: isSameDay(nextDate, selectedDate),
      });
    }

    return daysArray;
  }, [viewDate, selectedDate]);

  // Helper for date comparison
  function isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // Navigate to previous month
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Handle day selection
  const handleDayClick = (date: Date | null) => {
    if (date) {
      onDateChange(date);
    }
  };

  return (
    <div className={cn("w-full bg-white rounded-md", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-1 px-1">
        <h2 className="text-base font-medium">
          {viewDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div className="flex space-x-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="h-5 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayInfo, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(dayInfo.date)}
            className={cn(
              "h-6 w-6 flex items-center justify-center text-xs rounded-full mx-auto",
              !dayInfo.isCurrentMonth && "text-gray-400",
              dayInfo.isToday && !dayInfo.isSelected && "bg-blue-100",
              dayInfo.isSelected && "bg-blue-600 text-white",
              !dayInfo.isSelected && "hover:bg-gray-100"
            )}
          >
            {dayInfo.date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}
