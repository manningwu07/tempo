// src/app/goals/calendar/useCalendarEvents.ts
import { useState, useCallback } from "react";
import type { CalendarEvent } from "./calendarView";
import type { ColorKey } from "~/components/colorPicker";

// Type for popover data including position
type PopoverDataType = {
  start: Date;
  end: Date;
  position: { x: number; y: number }; // Added position
  // Initial color can be passed if needed, otherwise defaults below
  initialTaskColor?: ColorKey;
};

// Type for data passed to the full modal (can include colors)
type ModalDataType = (Partial<CalendarEvent> | { start: Date; end: Date }) & {
  taskColor?: ColorKey;
  goalColor?: ColorKey;
};

const DEFAULT_TASK_COLOR: ColorKey = "blue"; // Default to saturated blue

export function useCalendarEvents(initialEvents: CalendarEvent[] = []) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Popover State ---
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverData, setPopoverData] = useState<PopoverDataType | null>(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEventData, setModalEventData] = useState<ModalDataType | null>(
    null,
  );

  // --- Event Creation Flow ---

  // 1. Called by CalendarView - Opens Popover with position
  const requestOpenPopover = useCallback(
    (start: Date, end: Date, position: { x: number; y: number }) => {
      setPopoverData({ start, end, position }); // Store position
      setIsPopoverOpen(true);
      setIsModalOpen(false);
      setModalEventData(null);
    },
    [],
  );

  // 2. Called by Popover "More Options" - Opens Modal with data from popover
  const requestOpenFullModal = useCallback(
    (
      eventData: Partial<Omit<CalendarEvent, "id">> & {
        start: Date;
        end: Date;
      },
    ) => {
      setModalEventData({
        ...eventData,
        // Ensure colors have defaults if not set in popover
        taskColor: eventData.taskColor ?? DEFAULT_TASK_COLOR,
      });
      setIsModalOpen(true);
      setIsPopoverOpen(false);
      setPopoverData(null);
    },
    [],
  );

  // 3. Called by Popover "Save" - Saves directly
  const saveFromPopover = useCallback(
    (eventData: {
      title: string;
      start: Date;
      end: Date;
      taskColor: ColorKey;
    }) => {
      setEvents((prevEvents) => {
        const newEvent: CalendarEvent = {
          description: "",
          ...eventData,
          id: Date.now().toString(),
          taskColor: eventData.taskColor ?? DEFAULT_TASK_COLOR, // Default blue
        };
        return [...prevEvents, newEvent];
      });
      setIsPopoverOpen(false);
      setPopoverData(null);
    },
    [],
  );

  // --- Editing Flow ---

  // Called when an existing event is clicked - Opens Modal directly
  const requestEditEvent = useCallback((event: CalendarEvent) => {
    setModalEventData(event); // Pass the full event data
    setIsModalOpen(true);
    setIsPopoverOpen(false);
    setPopoverData(null);
  }, []);

  // Called from the *full modal* on save
  const saveFromModal = useCallback(
    (
      eventData: Omit<CalendarEvent, "id" | "taskColor"> & {
        id?: string;
        taskColor?: ColorKey;
      },
    ) => {
      setEvents((prevEvents) => {
        if (eventData.id) {
          // Update existing event
          return prevEvents.map((ev) =>
            ev.id === eventData.id
              ? ({
                  ...ev,
                  ...eventData,
                  // Ensure taskColor has a value if somehow unset
                  taskColor:
                    eventData.taskColor ?? ev.taskColor ?? DEFAULT_TASK_COLOR,
                } as CalendarEvent)
              : ev,
          );
        } else {
          // Create new event (modal opened directly or via popover)
          const newEvent: CalendarEvent = {
            ...eventData, // Spread the rest
            id: Date.now().toString(),
            taskColor: eventData.taskColor ?? DEFAULT_TASK_COLOR,
          };
          return [...prevEvents, newEvent];
        }
      });
      setIsModalOpen(false);
      setModalEventData(null);
    },
    [],
  );

  // --- Deletion ---
  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prevEvents) => prevEvents.filter((e) => e.id !== id));
      if (
        modalEventData &&
        "id" in modalEventData &&
        modalEventData.id === id
      ) {
        setIsModalOpen(false);
        setModalEventData(null);
      }
    },
    [modalEventData],
  );

  // --- Close Handlers ---
  const closePopover = useCallback(() => {
    setIsPopoverOpen(false);
    setPopoverData(null);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalEventData(null);
  }, []);

  // --- Date Handling ---
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return {
    events,
    selectedDate,
    isPopoverOpen,
    popoverData, // Includes position now
    requestOpenPopover,
    saveFromPopover,
    closePopover,
    isModalOpen,
    modalEventData,
    requestOpenFullModal,
    requestEditEvent,
    saveFromModal,
    closeModal,
    deleteEvent,
    handleDateChange,
  };
}
