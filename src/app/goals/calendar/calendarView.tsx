"use client"

import React, { useEffect, useMemo, useState, useCallback } from "react"
import { cn } from "~/lib/utils" 

export type CalendarEvent = {
  id: string
  title: string
  description: string
  start: Date
  end: Date
  notifications?: Date[]
  goalId?: string
  taskId?: string
  type?: "goal" | "task"
}

type Props = {
  events: CalendarEvent[]
  onCreate: (start: Date, end: Date, dayIndex: number) => void // Pass dayIndex too
  onEdit: (evt: CalendarEvent) => void
  onDelete: (id: string) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const TOTAL_MINUTES_IN_DAY = 24 * 60
const GRID_ROWS = 24 * 4 // 96 rows for 15-minute intervals

// Helper to get the start row index (1-based) for a date in a 96-row grid
const getStartRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes()
  return Math.floor(minutes / 15) + 1 // +1 because grid rows are 1-based
}

// Helper to get the end row index (1-based) for a date in a 96-row grid
const getEndRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes()
  // If end time is exactly on the hour/interval, it should end *before* the next line
  // Otherwise, use ceil to span the full interval. +1 for 1-based index.
  return minutes % 15 === 0 && minutes > 0
    ? Math.floor(minutes / 15) + 1
    : Math.ceil(minutes / 15) + 1
}

export default function CalendarView({
  events,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const [now, setNow] = useState(new Date())

  // tick every minute for "now" indicator update
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // days Mon–Sun, starting today’s week
  const weekDays = useMemo(() => {
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [now])

  const renderEvent = useCallback(
    (evt: CalendarEvent) => {
      const startDay = new Date(evt.start)
      startDay.setHours(0, 0, 0, 0)

      const dayIndex = weekDays.findIndex(
        (d) => d.getTime() === startDay.getTime()
      )

      // Don't render events outside the current week view
      if (dayIndex === -1) return null

      const gridColumnStart = dayIndex + 1 // Grid columns are 1-based
      const gridRowStart = getStartRow(evt.start)
      const gridRowEnd = getEndRow(evt.end)

      // Basic color mapping - replace with your logic
      const colorClasses =
        evt.type === "goal"
          ? "bg-orange-400 border-orange-500"
          : evt.type === "task"
            ? "bg-blue-400 border-blue-500"
            : "bg-purple-400 border-purple-500"

      return (
        <div
          key={evt.id}
          className={cn(
            "absolute inset-0 z-10 overflow-hidden rounded border p-1 text-xs text-white shadow",
            colorClasses
          )}
          style={{
            gridColumnStart,
            gridRowStart,
            gridRowEnd,
            // Use inset for positioning within the grid cell area if needed,
            // but gridRowEnd should handle height mostly.
            // Add margin/padding as needed for visual spacing
            marginTop: "1px",
            marginLeft: "1px",
            marginRight: "1px",
            marginBottom: "1px",
          }}
          onClick={() => onEdit(evt)}
          title={`${evt.title}\n${evt.start.toLocaleTimeString()} - ${evt.end.toLocaleTimeString()}`}
        >
          <div className="flex h-full flex-col justify-between">
            <strong>{evt.title}</strong>
            <button
              className="ml-auto h-4 w-4 rounded-full bg-black/20 text-center text-xs leading-none text-white hover:bg-black/40"
              onClick={(e) => {
                e.stopPropagation() // Prevent onEdit when clicking delete
                onDelete(evt.id)
              }}
            >
              ×
            </button>
          </div>
        </div>
      )
    },
    [weekDays, onEdit, onDelete]
  ) // Dependencies for useCallback

  const handleGridClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const gridElement = e.currentTarget
    const { top, left, height, width } = gridElement.getBoundingClientRect()
    const x = e.clientX - left
    const y = e.clientY - top

    // Calculate day index based on click position
    const dayIndex = Math.floor((x / width) * 7)
    if (dayIndex < 0 || dayIndex > 6) return // Clicked outside day columns

    // Calculate row index based on click position
    const totalRows = GRID_ROWS
    const clickedRow = Math.floor((y / height) * totalRows) // 0-based row index

    // Calculate start time based on the row clicked (15-min intervals)
    const startMinutes = clickedRow * 15
    const startHour = Math.floor(startMinutes / 60)
    const startMinute = startMinutes % 60

    // Get the date for the clicked day
    const clickedDate = new Date(weekDays[dayIndex]!)
    clickedDate.setHours(startHour, startMinute, 0, 0)

    // Default end time (e.g., 1 hour later)
    const endDate = new Date(clickedDate)
    endDate.setMinutes(endDate.getMinutes() + 60)

    onCreate(clickedDate, endDate, dayIndex)
  }

  // Calculate the top percentage for the "now" indicator line
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTopPercent = (nowMinutes / TOTAL_MINUTES_IN_DAY) * 100

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-gray-200">
      {/* Header Row */}
      <div className="grid flex-none grid-cols-[auto_1fr] border-b border-gray-200">
        {/* Spacer for time column */}
        <div className="w-14 border-r border-gray-200"></div>
        {/* Day Headers */}
        <div className="grid grid-cols-7">
          {weekDays.map((d, index) => (
            <div
              key={d.toISOString()}
              className={cn(
                "border-r border-gray-200 p-2 text-center text-sm font-medium",
                index === 6 && "border-r-0" // No right border for the last day
              )}
            >
              <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div
                className={cn(
                  "mt-1 flex h-8 w-8 items-center justify-center rounded-full",
                  d.toDateString() === new Date().toDateString() // Check if it's today
                    ? "bg-blue-600 text-white"
                    : ""
                )}
              >
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="grid flex-1 grid-cols-[auto_1fr] overflow-y-auto">
        {/* Time Column */}
        <div className="w-14 flex-none border-r border-gray-200">
          {/* Use relative positioning context for hour labels */}
          <div className="relative h-full">
            {HOURS.map((h) => {
              // Position each label absolutely based on its hour
              const topPercent = (h / 24) * 100
              return (
                <div
                  key={h}
                  className="absolute right-0 mr-1 mt-[-8px] text-right text-xs text-gray-500" // Negative margin to center vertically against the line
                  style={{ top: `${topPercent}%`, right: "4px" }} // Position relative to the parent
                >
                  {h === 0 ? "" : h % 12 === 0 ? "12" : h % 12}
                  {h !== 0 && h < 12 ? " AM" : ""}
                  {h !== 0 && h >= 12 ? " PM" : ""}
                </div>
              )
            })}
          </div>
        </div>

        {/* Calendar Grid Area */}
        <div
          className="relative grid grid-cols-7"
          style={{ gridTemplateRows: `repeat(${GRID_ROWS}, minmax(12px, 1fr))` }} // Min height for rows
          onDoubleClick={handleGridClick} // Use double click to create
        >
          {/* Horizontal Grid Lines (hourly) */}
          {HOURS.slice(1).map((h) => (
            <div
              key={`h-line-${h}`}
              className="col-span-full border-b border-gray-100"
              style={{ gridRow: h * 4 + 1 }} // Place line at the start of each hour (every 4 rows)
            ></div>
          ))}

          {/* Vertical Grid Lines (daily) */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`v-line-${i}`}
              className="row-span-full border-r border-gray-100"
              style={{ gridColumn: i + 1, gridRow: "1 / -1" }} // Span all rows
            ></div>
          ))}

          {/* Render Events */}
          {events.map(renderEvent)}

          {/* "Now" Indicator Line - Positioned absolutely relative to the grid area */}
          {nowTopPercent > 0 && nowTopPercent < 100 && (
            <div
              className="pointer-events-none absolute z-20 border-t-2 border-red-500"
              style={{ 
                top: `${nowTopPercent}%`,
                // Only span the width of today's column
                left: "0%",
                right: "85.7%", // 6/7 columns to the right (only show in first column)
                // If you need it on a different day of the week, calculate the proper grid column
              }}
            >
              <span className="absolute -left-1 top-[-5px] h-2 w-2 rounded-full bg-red-500"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}