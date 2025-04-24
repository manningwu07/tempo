// src/app/goals/calendar/calendarView.tsx
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { COLORS, type ColorKey } from "~/components/colorPicker";
import { cn } from "~/lib/utils";
import type { CalendarEvent } from "~/types/calendar";

// --- Constants ---
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TOTAL_MINUTES_IN_DAY = 24 * 60;
const GRID_ROWS = 24 * 4; // 96 rows for 15-minute intervals
const MIN_EVENT_DURATION_MINUTES = 15;
const DEFAULT_TASK_COLOR: ColorKey = "blue";
const SCROLL_TO_HOUR = 8; // Hour to scroll to on load (e.g., 8 for 8 AM)

// --- Props Type ---
type Props = {
  events: CalendarEvent[];
  currentDate: Date;
  onOpenPopover: (
    start: Date,
    end: Date,
    position: { x: number; y: number },
  ) => void;
  onEdit: (evt: CalendarEvent) => void;
  onDelete: (id: string) => void;
  // weekStartsOn prop is no longer needed if current day is always first
  // weekStartsOn?: 0 | 1;
};

// --- Date/Time Helpers ---
const getStartRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return Math.floor(minutes / 15) + 1; // 1-based index for grid-row-start
};

const getEndRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  // If end time is exactly on the interval, it should end *before* the next line starts
  return Math.floor(minutes / 15) + 1;
};

// Gets the exact start time of the 15-min interval corresponding to the rowIndex
const getDateFromCell = (
  dayIndex: number, // 0-6 relative to weekDays array
  rowIndex: number, // 0-95, representing the 15-min slot index
  weekDays: Date[],
): Date => {
  const baseDate = new Date(weekDays[dayIndex]!); // Get the correct day
  const totalMinutes = rowIndex * 15; // Calculate minutes from start of day (00:00)
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  baseDate.setHours(hour, minute, 0, 0); // Set time on the correct day
  return baseDate;
};
// --- End Helpers ---

export default function CalendarView({
  events,
  currentDate,
  onOpenPopover,
  onEdit,
  onDelete,
}: Props) {
  const [now, setNow] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  // Ref for the scrollable container (parent of the grid)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [dragDayIndex, setDragDayIndex] = useState<number | null>(null);

  // Update "now" indicator every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Scroll to ~8 AM on initial load
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const rowToGo = SCROLL_TO_HOUR * 4; // Row index for the target hour
      const scrollToPosition =
        (rowToGo / GRID_ROWS) * container.scrollHeight;
      // Add a small offset to show the hour line itself
      const offset = -20; // Adjust as needed
      container.scrollTop = Math.max(0, scrollToPosition + offset);
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate week days starting from the *currentDate*
  const weekDays = useMemo(() => {
    const startDay = new Date(currentDate);
    startDay.setHours(0, 0, 0, 0); // Normalize start day

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i); // Add days sequentially from startDay
      return d;
    });
  }, [currentDate]); // Recalculate when currentDate changes

  // --- Event Rendering (Colors applied, no functional change needed) ---
  const renderEvent = useCallback(
    (evt: CalendarEvent) => {
      const startDay = new Date(evt.start);
      startDay.setHours(0, 0, 0, 0);

      const dayIndex = weekDays.findIndex(
        (d) => d.getTime() === startDay.getTime(),
      );

      if (dayIndex === -1) return null;

      const gridColumnStart = dayIndex + 1;
      const gridRowStart = getStartRow(evt.start);
      let gridRowEnd = getEndRow(evt.end);
      if (gridRowEnd <= gridRowStart) {
        gridRowEnd = gridRowStart + 1;
      }

      const taskColorKey = evt.taskColor ?? DEFAULT_TASK_COLOR;
      const goalColorKey = evt.goalColor;
      const taskBgColor =
        COLORS[taskColorKey]?.saturated ?? COLORS.blue.saturated;
      const goalStripeColor = goalColorKey
        ? COLORS[goalColorKey]?.saturated
        : "transparent";

      return (
        <div
          key={evt.id}
          className={cn(
            "relative z-10 cursor-pointer overflow-hidden rounded border border-black/10 p-1 text-xs text-white shadow",
            "border-l-4",
          )}
          style={{
            gridColumnStart,
            gridColumnEnd: gridColumnStart + 1,
            gridRowStart,
            gridRowEnd,
            backgroundColor: taskBgColor,
            borderLeftColor: goalStripeColor,
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
            <strong className="truncate">{evt.title}</strong>
          </div>
        </div>
      );
    },
    [weekDays, onEdit],
  );

  // --- Drag and Click Handling ---
  // Calculates cell based on mouse event relative to the scrollable grid
  const getCellFromMouseEvent = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): { dayIndex: number; rowIndex: number } | null => {
    const gridElement = gridRef.current;
    // Use the scrollable container ref
    const scrollContainer = scrollContainerRef.current;
    if (!gridElement || !scrollContainer) return null;

    const gridRect = gridElement.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    // Calculate X relative to grid container
    const x = e.clientX - gridRect.left;

    // Calculate Y relative to grid container, accounting for scroll
    // clientY is viewport relative. Subtract container top, add scroll amount.
    const y = e.clientY - containerRect.top + scrollContainer.scrollTop;

    // Calculate day index (0-6)
    const dayWidth = gridRect.width / 7;
    const dayIndex = Math.floor(x / dayWidth);
    if (dayIndex < 0 || dayIndex > 6) return null;

    // Calculate row index (0-95) based on grid's total scroll height
    const totalGridHeight = gridElement.scrollHeight;
    // Ensure row index is calculated correctly based on the Y within the grid
    const clickedRow = Math.floor((y / totalGridHeight) * GRID_ROWS);

    // Clamp row index to valid range
    const clampedRowIndex = Math.max(0, Math.min(GRID_ROWS - 1, clickedRow));

    // console.log(`Click Y: ${e.clientY}, Container Top: ${containerRect.top}, ScrollTop: ${scrollContainer.scrollTop}, Adjusted Y: ${y}, Row: ${clampedRowIndex}`); // Debugging

    return { dayIndex, rowIndex: clampedRowIndex };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const cell = getCellFromMouseEvent(e);
    if (!cell) return;

    // Use the calculated cell's start time directly
    const startDate = getDateFromCell(cell.dayIndex, cell.rowIndex, weekDays);
    // console.log("Mouse Down Start Date:", startDate); // Debugging

    setIsDragging(true);
    setDragStartDate(startDate);
    setDragEndDate(startDate);
    setDragDayIndex(cell.dayIndex);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !dragStartDate || dragDayIndex === null) return;

    const cell = getCellFromMouseEvent(e);
    if (!cell || cell.dayIndex !== dragDayIndex) {
      // Optional: Clamp to end of start day if needed, or just return
      return;
    }

    // Get the time for the *current* cell being hovered over
    const currentHoverDate = getDateFromCell(
      cell.dayIndex,
      cell.rowIndex,
      weekDays,
    );

    // The end date should represent the *end* of the interval being dragged *to*.
    // So, add 15 minutes to the start time of the cell being hovered over.
    const endDate = new Date(currentHoverDate);
    endDate.setMinutes(endDate.getMinutes() + MIN_EVENT_DURATION_MINUTES);

    // Ensure end date is always after start date
    if (endDate > dragStartDate) {
      setDragEndDate(endDate);
    } else {
      // If dragging upwards, make end = start + min duration
      const minEndDate = new Date(dragStartDate);
      minEndDate.setMinutes(
        minEndDate.getMinutes() + MIN_EVENT_DURATION_MINUTES,
      );
      setDragEndDate(minEndDate);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !dragStartDate || !dragEndDate || dragDayIndex === null) {
      setIsDragging(false);
      setDragDayIndex(null);
      return;
    }

    setIsDragging(false);
    setDragDayIndex(null);

    let finalStartDate = dragStartDate;
    let finalEndDate = dragEndDate;

    // If it was essentially a click (start and end are very close)
    // ensure minimum duration from the *start* time.
    const durationMinutes =
      (finalEndDate.getTime() - finalStartDate.getTime()) / (1000 * 60);

    if (durationMinutes < MIN_EVENT_DURATION_MINUTES) {
      finalEndDate = new Date(finalStartDate);
      finalEndDate.setMinutes(
        finalStartDate.getMinutes() + MIN_EVENT_DURATION_MINUTES,
      );
    }
    // No need to snap end time here, popover/modal can handle final adjustments if needed

    // console.log("Mouse Up Final Start:", finalStartDate); // Debugging
    // console.log("Mouse Up Final End:", finalEndDate); // Debugging

    const position = { x: e.clientX, y: e.clientY };
    onOpenPopover(finalStartDate, finalEndDate, position);

    setDragStartDate(null);
    setDragEndDate(null);
  };

  // --- "Now" Indicator Logic (Adjusted for current day first) ---
  const todayIndex = weekDays.findIndex(
    (d) => d.toDateString() === now.toDateString(),
  ); // Will be 0 if today is the first day
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTopPercent = (nowMinutes / TOTAL_MINUTES_IN_DAY) * 100;
  const nowIndicatorVisible =
    todayIndex !== -1 && nowTopPercent >= 0 && nowTopPercent <= 100;
  // Left position is based on todayIndex (which is now 0 if current day is first)
  const nowIndicatorLeftPercent = todayIndex * (100 / 7);
  const nowIndicatorWidthPercent = 100 / 7;

  // --- Drag Preview Calculation (No change needed) ---
  const dragPreview = useMemo(() => {
    if (!isDragging || !dragStartDate || !dragEndDate || dragDayIndex === null) {
      return null;
    }
    // Find the column index based on the *actual date* being dragged on
    const currentDragDayIndex = weekDays.findIndex(d => d.toDateString() === dragStartDate.toDateString());
    if (currentDragDayIndex === -1) return null; // Should not happen if dragDayIndex is set

    const gridColumnStart = currentDragDayIndex + 1;
    const gridRowStart = getStartRow(dragStartDate);
    let gridRowEnd = getEndRow(dragEndDate);
    if (gridRowEnd <= gridRowStart) {
      gridRowEnd = gridRowStart + 1;
    }

    return { gridColumnStart, gridRowStart, gridRowEnd };
  }, [isDragging, dragStartDate, dragEndDate, dragDayIndex, weekDays]); // Add weekDays dependency

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-gray-200">
      {/* Header Row - Uses updated weekDays */}
      <div className="grid flex-none grid-cols-[auto_1fr] border-b border-gray-200 bg-white">
        <div className="w-14 border-r border-gray-200"></div> {/* Time gutter */}
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
                  "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full",
                  // Highlight based on comparing with *actual* today, not just index 0
                  d.toDateString() === new Date().toDateString()
                    ? "bg-blue-600 font-semibold text-white"
                    : "text-gray-700",
                )}
              >
                {d.getDate()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Body - Add ref here */}
      <div
        ref={scrollContainerRef}
        className="grid flex-1 grid-cols-[auto_1fr] overflow-y-auto"
      >
        {/* Time Column */}
        <div className="sticky top-0 z-20 w-14 flex-none border-r border-gray-200 bg-white">
          <div className="relative h-full">
            {HOURS.map((h) => {
              const rowNumber = h * 4;
              const topPosition = (rowNumber / GRID_ROWS) * 100;
              return (
                <div
                  key={h}
                  className="absolute w-full pr-1 text-right text-xs text-gray-500"
                  style={{ top: `${topPosition}%` }}
                >
                  {h > 0 && (
                    <>
                      {h % 12 === 0 ? 12 : h % 12}
                      <span className="text-[10px]">
                        {h < 12 ? " AM" : " PM"}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar Grid Area - Add ref here */}
        <div
          ref={gridRef}
          className="relative grid cursor-crosshair grid-cols-7"
          style={{
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(12px, 1fr))`,
            // Set height based on rows * min height (adjust 12px if needed)
            height: `${GRID_ROWS * 12}px`, // e.g., 96 * 12 = 1152px
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDragging) {
              setIsDragging(false);
              setDragStartDate(null);
              setDragEndDate(null);
              setDragDayIndex(null);
            }
          }}
        >
          {/* REMOVED 15-min Horizontal Grid Lines */}
          {/* <Array.from({ length: GRID_ROWS -1 }).map((_, i) => ( ... ))} */}

          {/* Hour Lines (darker) - KEEP THESE */}
          {HOURS.slice(1).map((h) => (
            <div
              key={`h-line-hour-${h}`}
              className="pointer-events-none col-span-full border-b border-gray-200" // Hour lines
              style={{ gridRow: h * 4 + 1 }}
            ></div>
          ))}

          {/* Vertical Grid Lines */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`v-line-${i}`}
              className="pointer-events-none row-span-full border-r border-gray-100" // Lighter vertical lines
              style={{ gridColumn: i + 1, gridRow: `1 / ${GRID_ROWS + 1}` }}
            ></div>
          ))}

          {/* Render Existing Events */}
          {events.map(renderEvent)}

          {/* Real-time Drag Preview */}
          {dragPreview && (
            <div
              className="pointer-events-none absolute z-5 rounded border border-blue-400 bg-blue-200/50"
              style={{
                gridColumnStart: dragPreview.gridColumnStart,
                gridColumnEnd: dragPreview.gridColumnStart + 1,
                gridRowStart: dragPreview.gridRowStart,
                gridRowEnd: dragPreview.gridRowEnd,
              }}
            />
          )}

          {/* "Now" Indicator Line */}
          {nowIndicatorVisible && (
            <div
              className="pointer-events-none absolute z-20 h-0 border-t-2 border-red-500"
              style={{
                top: `${nowTopPercent}%`,
                left: `${nowIndicatorLeftPercent}%`,
                width: `${nowIndicatorWidthPercent}%`,
              }}
            >
              <span className="absolute -left-1 -top-[3px] h-[6px] w-[6px] rounded-full bg-red-500"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
