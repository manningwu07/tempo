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

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  notifications?: Date[];
  goalId?: string;
  goalColor?: ColorKey;
  taskId?: string;
  taskColor?: ColorKey;
  type?: "goal" | "task";
};

type Props = {
  events: CalendarEvent[];
  currentDate: Date;
  // Updated handler signature to include position
  onOpenPopover: (
    start: Date,
    end: Date,
    position: { x: number; y: number },
  ) => void;
  onEdit: (evt: CalendarEvent) => void;
  onDelete: (id: string) => void;
  weekStartsOn?: 0 | 1;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TOTAL_MINUTES_IN_DAY = 24 * 60;
const GRID_ROWS = 24 * 4; // 96 rows for 15-minute intervals
const MIN_EVENT_DURATION_MINUTES = 15;
const DEFAULT_TASK_COLOR: ColorKey = "blue"; // Default blue

// --- Date/Time Helpers ---
const getStartRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return Math.floor(minutes / 15) + 1; // 1-based index for grid-row-start
};

const getEndRow = (date: Date): number => {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return Math.floor(minutes / 15) + 1;
};

const getDateFromCell = (
  dayIndex: number,
  rowIndex: number, // 0-based row index from calculation
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
  currentDate,
  onOpenPopover, // Updated prop name/signature
  onEdit,
  onDelete,
  weekStartsOn = 0,
}: Props) {
  const [now, setNow] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [dragEndDate, setDragEndDate] = useState<Date | null>(null);
  const [dragDayIndex, setDragDayIndex] = useState<number | null>(null); // Track drag day

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Calculate week days based on currentDate prop, not internal 'now' state
  const weekDays = useMemo(() => {
    const startDay = new Date(currentDate);
    startDay.setHours(0, 0, 0, 0);
    const dayOfWeek = startDay.getDay(); // 0 = Sunday, 1 = Monday...
    const diff = startDay.getDate() - dayOfWeek + (weekStartsOn === 1 ? 1 : 0); // Adjust based on week start
    const firstDayOfWeek = new Date(startDay.setDate(diff));

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(firstDayOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate, weekStartsOn]);

  // --- Event Rendering with Colors ---
  const renderEvent = useCallback(
    (evt: CalendarEvent) => {
      const startDay = new Date(evt.start);
      startDay.setHours(0, 0, 0, 0);

      const dayIndex = weekDays.findIndex(
        (d) => d.getTime() === startDay.getTime(),
      );

      if (dayIndex === -1) return null; // Event not in this week view

      const gridColumnStart = dayIndex + 1; // 1-based index
      const gridRowStart = getStartRow(evt.start);
      // Calculate end row - ensure it spans at least one cell even if duration is short
      let gridRowEnd = getEndRow(evt.end);
      if (gridRowEnd <= gridRowStart) {
          gridRowEnd = gridRowStart + 1; // Minimum 1 row span
      }


      // Determine colors
      const taskColorKey = evt.taskColor ?? DEFAULT_TASK_COLOR;
      const goalColorKey = evt.goalColor;

      const taskBgColor = COLORS[taskColorKey]?.saturated ?? COLORS.blue.saturated;
      const goalStripeColor = goalColorKey
        ? COLORS[goalColorKey]?.saturated
        : "transparent"; // No stripe if no goal color

      return (
        <div
          key={evt.id}
          className={cn(
            "relative z-10 cursor-pointer overflow-hidden rounded border border-black/10 p-1 text-xs text-white shadow",
            "border-l-4", // Add left border for the stripe
          )}
          style={{
            gridColumnStart,
            gridColumnEnd: gridColumnStart + 1,
            gridRowStart,
            gridRowEnd,
            backgroundColor: taskBgColor,
            borderLeftColor: goalStripeColor, // Apply goal color to left border
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
            {/* Consider moving delete to popover/modal */}
            {/* <button
              className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-black/20 text-center text-xs leading-none text-white hover:bg-black/40"
              onClick={(e) => { e.stopPropagation(); onDelete(evt.id); }}
            > × </button> */}
          </div>
        </div>
      );
    },
    [weekDays, onEdit /* onDelete */], // Remove onDelete if button removed
  );

  // --- Drag and Click Handling ---
  const getCellFromMouseEvent = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ): { dayIndex: number; rowIndex: number } | null => {
    const gridElement = gridRef.current;
    if (!gridElement) return null;

    const rect = gridElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top; // Use clientY relative to viewport

    // Adjust y for scroll position of the grid container
    const scrollableParent = gridElement.parentElement; // Assuming parent scrolls
    const adjustedY = y + (scrollableParent?.scrollTop ?? 0);


    // Calculate day index (0-6)
    const dayWidth = rect.width / 7;
    const dayIndex = Math.floor(x / dayWidth);
    if (dayIndex < 0 || dayIndex > 6) return null;

    // Calculate row index (0-95) based on grid's total height
    const totalGridHeight = gridElement.scrollHeight; // Use scrollHeight for actual content height
    const clickedRow = Math.floor((adjustedY / totalGridHeight) * GRID_ROWS);

    if (clickedRow < 0 || clickedRow >= GRID_ROWS) return null;

    return { dayIndex, rowIndex: clickedRow };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const cell = getCellFromMouseEvent(e);
    if (!cell) return;

    const startDate = getDateFromCell(cell.dayIndex, cell.rowIndex, weekDays);
    setIsDragging(true);
    setDragStartDate(startDate);
    setDragEndDate(startDate); // Initially, start and end are the same
    setDragDayIndex(cell.dayIndex); // Store the day index where drag started
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !dragStartDate || dragDayIndex === null) return;

    const cell = getCellFromMouseEvent(e);
    // If mouse moves outside grid or to a different day, stop updating end date?
    // Or allow multi-day drag? For now, constrain to start day.
    if (!cell || cell.dayIndex !== dragDayIndex) {
        // Optionally clamp to end of start day if mouse moves out?
        // Or just stop updating:
        return;
    }


    const currentDragDate = getDateFromCell(
      cell.dayIndex,
      cell.rowIndex,
      weekDays,
    );

    // Update End Date: Ensure end is always >= start
    // Add minimum duration visually during drag? Maybe not necessary yet.
    if (currentDragDate >= dragStartDate) {
      setDragEndDate(currentDragDate);
    } else {
      // If dragging upwards past start, keep end = start
      setDragEndDate(dragStartDate);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging || !dragStartDate || !dragEndDate || dragDayIndex === null) {
      setIsDragging(false); // Reset just in case
      setDragDayIndex(null);
      return;
    }

    setIsDragging(false);
    setDragDayIndex(null);

    // Use the final drag dates
    let finalStartDate = dragStartDate;
    let finalEndDate = dragEndDate;

    // Ensure minimum duration on mouse up
    const durationMinutes =
      (finalEndDate.getTime() - finalStartDate.getTime()) / (1000 * 60);

    if (durationMinutes < MIN_EVENT_DURATION_MINUTES) {
      finalEndDate = new Date(finalStartDate);
      finalEndDate.setMinutes(
        finalStartDate.getMinutes() + MIN_EVENT_DURATION_MINUTES,
      );
    } else {
      // Snap end time to the next 15-minute interval boundary for cleaner events
      const endMinutes = finalEndDate.getMinutes();
      const remainder = endMinutes % 15;
      if (remainder !== 0) {
        // Set minutes to the start of the *next* interval
        finalEndDate.setMinutes(endMinutes - remainder + 15);
      }
       // If end time is exactly on an interval, it's already snapped.
    }


    // Get mouse coordinates for popover positioning
    const position = { x: e.clientX, y: e.clientY };

    // Call the popover handler with final dates and position
    onOpenPopover(finalStartDate, finalEndDate, position);

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
    todayIndex !== -1 && nowTopPercent >= 0 && nowTopPercent <= 100; // Allow 0 and 100
  const nowIndicatorLeftPercent = todayIndex * (100 / 7);
  const nowIndicatorWidthPercent = 100 / 7;

  // --- Drag Preview Calculation ---
  const dragPreview = useMemo(() => {
    if (!isDragging || !dragStartDate || !dragEndDate || dragDayIndex === null) {
      return null;
    }
    const gridColumnStart = dragDayIndex + 1;
    const gridRowStart = getStartRow(dragStartDate);
    // Calculate end row for preview, snap to *next* interval visually during drag
    let gridRowEnd = getEndRow(dragEndDate);
     const endMinutes = dragEndDate.getMinutes();
     const remainder = endMinutes % 15;
     if (remainder !== 0) {
         // Make preview visually snap to the end of the interval being dragged into
         gridRowEnd = Math.floor(endMinutes / 15) + 1 + 1; // +1 for floor, +1 for end row index
     }
     // Ensure minimum height for preview
     if (gridRowEnd <= gridRowStart) {
         gridRowEnd = gridRowStart + 1;
     }


    return { gridColumnStart, gridRowStart, gridRowEnd };
  }, [isDragging, dragStartDate, dragEndDate, dragDayIndex]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-t border-gray-200">
      {/* Header Row */}
      <div className="grid flex-none grid-cols-[auto_1fr] border-b border-gray-200 bg-white">
        <div className="w-14 border-r border-gray-200"></div> {/* Time gutter */}
        <div className="grid grid-cols-7">
          {weekDays.map((d, index) => (
            <div
              key={d.toISOString()}
              className={cn(
                "border-r border-gray-200 p-2 text-center text-sm font-medium",
                index === 6 && "border-r-0", // No border on last day
              )}
            >
              <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
              <div
                className={cn(
                  "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full",
                  d.toDateString() === new Date().toDateString()
                    ? "bg-blue-600 font-semibold text-white" // Highlight today
                    : "text-gray-700",
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
        <div className="sticky top-0 z-20 w-14 flex-none border-r border-gray-200 bg-white"> {/* Sticky time */}
          <div className="relative h-full">
            {HOURS.map((h) => {
              // Position hour labels accurately based on GRID_ROWS
              const rowNumber = h * 4; // 0, 4, 8, ...
              const topPosition = (rowNumber / GRID_ROWS) * 100;
              return (
                <div
                  key={h}
                  className="absolute w-full pr-1 text-right text-xs text-gray-500 my-3"
                  style={{
                    top: `${topPosition}%`,
                    // Adjust vertical alignment slightly if needed
                    // transform: 'translateY(-50%)',
                  }}
                >
                  {/* Show time only if not 0 */}
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

        {/* Calendar Grid Area */}
        <div
          ref={gridRef}
          className="relative grid cursor-crosshair grid-cols-7"
          style={{
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(12px, 1fr))`, // Min height for rows
            // Set a large height to ensure rows render, or calculate based on row height * GRID_ROWS
             height: `${GRID_ROWS * 15}px`, // Example: 96 rows * 15px = 1440px
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            // Cancel drag if mouse leaves grid
            if (isDragging) {
              setIsDragging(false);
              setDragStartDate(null);
              setDragEndDate(null);
              setDragDayIndex(null);
            }
          }}
        >
          {/* Horizontal Grid Lines (15 min intervals) */}
          {Array.from({ length: GRID_ROWS -1 }).map((_, i) => (
            <div
              key={`h-line-${i}`}
              className="pointer-events-none col-span-full border-b border-gray-100"
              style={{ gridRow: i + 1 }} // Line starts *after* row i
            ></div>
          ))}
          {/* Hour Lines (darker) */}
           {HOURS.slice(1).map((h) => (
            <div
              key={`h-line-hour-${h}`}
              className="pointer-events-none col-span-full border-b border-gray-200" // Darker hour lines
              style={{ gridRow: h * 4 + 1 }} // Place on the hour mark
            ></div>
          ))}


          {/* Vertical Grid Lines */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`v-line-${i}`}
              className="pointer-events-none row-span-full border-r border-gray-100"
              style={{ gridColumn: i + 1, gridRow: `1 / ${GRID_ROWS + 1}` }} // Span all rows
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
              {/* Small circle at the start of the line */}
              <span className="absolute -left-1 -top-[3px] h-[6px] w-[6px] rounded-full bg-red-500"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}