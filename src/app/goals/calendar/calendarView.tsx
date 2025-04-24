// src/app/goals/calendar/calendarView.tsx
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { cn } from "~/lib/utils";

// Make sure CalendarEvent type is accessible here
export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  notifications?: Date[];
  goalId?: string;
  taskId?: string;
  type?: "goal" | "task";
};

type Props = {
  events: CalendarEvent[];
  currentDate: Date; // Use a more specific prop for the reference date
  onCreate: (start: Date, end: Date) => void; // Simpler signature now
  onEdit: (evt: CalendarEvent) => void;
  onDelete: (id: string) => void;
  weekStartsOn?: 0 | 1; // 0 for Sunday, 1 for Monday
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TOTAL_MINUTES_IN_DAY = 24 * 60;
const GRID_ROWS = 24 * 4; // 96 rows for 15-minute intervals
const MIN_EVENT_DURATION_MINUTES = 15; // Minimum duration for a click

// --- Date/Time Helpers ---
const getStartRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return Math.floor(minutes / 15) + 1;
};

const getEndRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes % 15 === 0 && minutes > 0
    ? Math.floor(minutes / 15) + 1
    : Math.ceil(minutes / 15) + 1;
};

const getDateFromCell = (
  dayIndex: number,
  rowIndex: number, // 0-based row index
  weekDays: Date[],
): Date => {
  const baseDate = new Date(weekDays[dayIndex]!);
  const totalMinutes = rowIndex * 15;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  baseDate.setHours(hour, minute, 0, 0);
  return baseDate;
};
// --- End Helpers ---

export default function CalendarView({
  events,
  currentDate, // Changed from 'now' prop
  onCreate,
  onEdit,
  onDelete,
  weekStartsOn = 0, // Default to Sunday
}: Props) {
  const [now, setNow] = useState(new Date()); // For the "now" indicator
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);

  // Update "now" indicator every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const weekDays = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [now]);

  // --- Event Rendering (mostly unchanged) ---
  const renderEvent = useCallback(
    (evt: CalendarEvent) => {
      const startDay = new Date(evt.start);
      startDay.setHours(0, 0, 0, 0);

      const dayIndex = weekDays.findIndex(
        (d) => d.getTime() === startDay.getTime(),
      );

      if (dayIndex === -1) return null; // Event not in this week view

      const gridColumnStart = dayIndex + 1;
      const gridRowStart = getStartRow(evt.start);
      const gridRowEnd = getEndRow(evt.end);

      const colorClasses =
        evt.type === "goal"
          ? "bg-orange-400 border-orange-500"
          : evt.type === "task"
            ? "bg-blue-400 border-blue-500"
            : "bg-purple-400 border-purple-500";

      return (
        <div
          key={evt.id}
          className={cn(
            "relative z-10 cursor-pointer overflow-hidden rounded border p-1 text-xs text-white shadow",
            colorClasses,
          )}
          style={{
            gridColumnStart,
            gridColumnEnd: gridColumnStart + 1, // <-- force one day
            gridRowStart,
            gridRowEnd,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(evt);
          }}
          title={`${evt.title}\n${evt.start.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })} - ${evt.end.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}`}
        >
          <div className="flex h-full flex-col justify-between">
            <strong>{evt.title}</strong>
            <button
              className="ml-auto h-4 w-4 rounded-full bg-black/20 text-center text-xs leading-none text-white hover:bg-black/40"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(evt.id);
              }}
            >
              ×
            </button>
          </div>
        </div>
      );
    },
    [weekDays, onEdit, onDelete],
  );

  // --- Drag and Click Handling ---
  const getCellFromMouseEvent = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): { dayIndex: number; rowIndex: number } | null => {
    const gridElement = gridRef.current;
    if (!gridElement) return null;

    const { top, left, height, width } = gridElement.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    // Calculate day index (0-6)
    const dayIndex = Math.floor((x / width) * 7);
    if (dayIndex < 0 || dayIndex > 6) return null; // Clicked outside day columns

    // Calculate row index (0-95)
    const clickedRow = Math.floor((y / height) * GRID_ROWS);
    if (clickedRow < 0 || clickedRow >= GRID_ROWS) return null; // Clicked outside rows

    return { dayIndex, rowIndex: clickedRow };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const cell = getCellFromMouseEvent(e);
    if (!cell) return;

    const startDate = getDateFromCell(cell.dayIndex, cell.rowIndex, weekDays);
    setIsDragging(true);
    setDragStartDate(startDate);
    setDragEndDate(startDate); // Initially, start and end are the same
    // Prevent text selection during drag
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !dragStartDate) return;

    const cell = getCellFromMouseEvent(e);
    if (!cell) return; // Ignore if mouse moves outside grid boundaries during drag

    // Ensure drag stays within the same day for simplicity
    const startDayIndex = weekDays.findIndex(
      (d) => d.toDateString() === dragStartDate.toDateString(),
    );
    if (cell.dayIndex !== startDayIndex) return;

    const endDate = getDateFromCell(cell.dayIndex, cell.rowIndex, weekDays);

    // Ensure end date is always after start date
    if (endDate >= dragStartDate) {
      setDragEndDate(endDate);
    } else {
      // If dragging upwards past the start, set end = start
      setDragEndDate(dragStartDate);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !dragStartDate || !dragEndDate) {
      setIsDragging(false); // Reset just in case
      return;
    }

    setIsDragging(false);

    // Determine final start and end
    let finalStartDate = dragStartDate;
    let finalEndDate = dragEndDate;

    // If end is before start (shouldn't happen with current mouseMove logic, but safety check)
    if (finalEndDate < finalStartDate) {
      finalEndDate = new Date(finalStartDate);
      finalEndDate.setMinutes(
        finalStartDate.getMinutes() + MIN_EVENT_DURATION_MINUTES,
      );
    }

    // Check if it was a click (start and end are the same cell)
    const durationMinutes =
      (finalEndDate.getTime() - finalStartDate.getTime()) / (1000 * 60);

    if (durationMinutes < MIN_EVENT_DURATION_MINUTES) {
      // Treat as a click, create a default duration event
      finalEndDate = new Date(finalStartDate);
      finalEndDate.setMinutes(
        finalStartDate.getMinutes() + MIN_EVENT_DURATION_MINUTES,
      );
    } else {
      // It was a drag, round end time to the next 15min interval boundary
      const endMinutes = finalEndDate.getMinutes();
      const remainder = endMinutes % 15;
      if (remainder !== 0) {
        finalEndDate.setMinutes(endMinutes + (15 - remainder));
      }
      // If rounding pushes it to the next hour/day, Date object handles it.
    }

    // Call the creation handler (which now opens the modal)
    onCreate(finalStartDate, finalEndDate);

    // Reset drag state
    setDragStartDate(null);
    setDragEndDate(null);
  };

  // --- "Now" Indicator Logic ---
  const todayIndex = weekDays.findIndex(
    (d) => d.toDateString() === now.toDateString(),
  );
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTopPercent = (nowMinutes / TOTAL_MINUTES_IN_DAY) * 100;
  const nowIndicatorVisible =
    todayIndex !== -1 && nowTopPercent > 0 && nowTopPercent < 100;
  const nowIndicatorLeftPercent = todayIndex * (100 / 7);
  const nowIndicatorWidthPercent = 100 / 7;

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-gray-200">
      {/* Header Row (Unchanged) */}
      <div className="grid flex-none grid-cols-[auto_1fr] border-b border-gray-200">
        <div className="w-14 border-r border-gray-200"></div>
        <div className="grid grid-cols-7">
          {weekDays.map((d, index) => (
            <div
              key={d.toISOString()}
              className={cn(
                "border-r border-gray-200 p-2 text-center text-sm font-medium",
                index === 6 && "border-r-0",
              )}
            >
              <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div
                className={cn(
                  "mt-1 flex h-8 w-8 items-center justify-center rounded-full",
                  d.toDateString() === new Date().toDateString()
                    ? "bg-blue-600 text-white"
                    : "",
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
        {/* Time Column (Unchanged) */}
        <div className="w-14 flex-none border-r border-gray-200">
          <div className="relative h-full">
            {HOURS.map((h) => {
              const topPercent = (h / 24) * 100;
              return (
                <div
                  key={h}
                  className="absolute my-3 w-full pr-1 text-right text-xs text-gray-500" // Use padding for spacing from edge
                  style={{
                    top: `${topPercent}%`,
                    transform: "translateY(-50%)",
                  }} // Center vertically
                >
                  {h === 0 ? "" : h % 12 === 0 ? "12" : h % 12}
                  {h !== 0 && h < 12 ? " AM" : ""}
                  {h !== 0 && h >= 12 ? " PM" : ""}
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar Grid Area - Added Mouse Handlers */}
        <div
          ref={gridRef} // Add ref here
          className="relative grid cursor-crosshair grid-cols-7" // Add cursor
          style={{
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(12px, 1fr))`,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            // If mouse leaves grid while dragging, cancel the drag
            if (isDragging) {
              setIsDragging(false);
              setDragStartDate(null);
              setDragEndDate(null);
            }
          }}
        >
          {/* Horizontal Grid Lines (Unchanged) */}
          {HOURS.slice(1).map((h) => (
            <div
              key={`h-line-${h}`}
              className="pointer-events-none col-span-full border-b border-gray-100" // Make lines non-interactive
              style={{ gridRow: h * 4 + 1 }}
            ></div>
          ))}

          {/* Vertical Grid Lines (Unchanged) */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`v-line-${i}`}
              className="pointer-events-none row-span-full border-r border-gray-100" // Make lines non-interactive
              style={{ gridColumn: i + 1, gridRow: "1 / -1" }}
            ></div>
          ))}

          {/* Render Existing Events */}
          {events.map(renderEvent)}

          {isDragging && dragStartDate && dragEndDate && (
            <div
              className="pointer-events-none absolute z-5 rounded border border-blue-400 bg-blue-200/50"
              style={{
                gridColumnStart:
                  weekDays.findIndex(
                    (d) => d.toDateString() === dragStartDate.toDateString(),
                  ) + 1,
                gridColumnEnd:
                  weekDays.findIndex(
                    (d) => d.toDateString() === dragStartDate.toDateString(),
                  ) +
                  1 +
                  1,
                gridRowStart: getStartRow(dragStartDate),
                gridRowEnd: getEndRow(dragEndDate),
              }}
            />
          )}

          {/* "Now" Indicator Line */}
          {nowIndicatorVisible && (
            <div
              className="pointer-events-none absolute z-20 border-t-2 border-red-500"
              style={{
                top: `${nowTopPercent}%`,
                left: `${nowIndicatorLeftPercent}%`,
                width: `${nowIndicatorWidthPercent}%`,
              }}
            >
              <span className="absolute top-[-5px] -left-1 h-2 w-2 rounded-full bg-red-500"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
