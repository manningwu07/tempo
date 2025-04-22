"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "~/lib/utils"

type MiniMonthCalendarProps = {
  currentDate: Date
  onDateSelect?: (date: Date) => void
}

export default function MiniMonthCalendar({
  currentDate,
  onDateSelect,
}: MiniMonthCalendarProps) {
  const [viewDate, setViewDate] = useState(new Date(currentDate))

  // Get month information
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  
  // Generate dates for the month grid
  const dates = getDatesForMonth(viewDate)
  
  // Navigate to previous/next month
  const prevMonth = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setViewDate(newDate)
  }
  
  const nextMonth = () => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setViewDate(newDate)
  }
  
  // Format month and year for display
  const monthYearDisplay = viewDate.toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  })
  
  return (
    <div className="w-full p-2 bg-white rounded">
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">{monthYearDisplay}</h3>
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
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="font-medium">{day}</div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date, i) => {
          const isCurrentMonth = date.getMonth() === month
          const isToday = isSameDay(date, new Date())
          const isSelected = isSameDay(date, currentDate)
          
          // Highlight dates from current week (next 7 days from today)
          const isInCurrentWeek = isDateInNext7Days(date, currentDate)
          
          return (
            <button
              key={i}
              onClick={() => onDateSelect?.(date)}
              disabled={!isCurrentMonth}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs",
                !isCurrentMonth && "text-gray-300",
                isToday && "bg-blue-600 text-white",
                isSelected && !isToday && "border-2 border-blue-600",
                isInCurrentWeek && !isToday && !isSelected && "bg-blue-100",
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Helper function to generate dates for the month view (including prev/next month dates)
function getDatesForMonth(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  
  // First day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  
  // Last day of the month
  const lastDayOfMonth = new Date(year, month + 1, 0)
  
  // Day of week for the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  
  // Calculate how many days we need from the previous month
  const daysFromPrevMonth = firstDayOfWeek
  
  // Start date will be the first date shown in the calendar (can be from prev month)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(1 - daysFromPrevMonth)
  
  // We'll always show 6 weeks (42 days) for consistency
  const dates: Date[] = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    dates.push(date)
  }
  
  return dates
}

// Helper function to check if two dates are the same day
function isSameDay(date1: Date, date2: Date) {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear()
}

// Helper function to check if a date is within the next 7 days
function isDateInNext7Days(date: Date, startDate: Date) {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  
  const compareDate = new Date(date)
  compareDate.setHours(12, 0, 0, 0)
  
  return compareDate >= start && compareDate <= end
}
