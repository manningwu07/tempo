// src/app/goals/calendar/useCalendarEvents.ts
import { useState, useCallback } from "react";
import type { CalendarEvent } from "./calendarView"; // Assuming types are here or imported

export function useCalendarEvents(initialEvents: CalendarEvent[] = []) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Store the event being edited, or the initial dates for creation
  const [editingEvent, setEditingEvent] = useState<
    Partial<CalendarEvent> | { start: Date; end: Date } | null
  >(null);

  // --- CRUD Operations ---

  // Called when drag finishes or click happens - prepares data for modal
  const requestCreateEvent = useCallback((start: Date, end: Date) => {
    setEditingEvent({ start, end }); // Set initial times for the modal
    setIsModalOpen(true);
  }, []);

  // Called when an existing event is clicked
  const requestEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  }, []);

  // Called from the modal on save
  const saveEvent = useCallback(
    (eventData: Omit<CalendarEvent, "id"> & { id?: string }) => {
      setEvents((prevEvents) => {
        if (eventData.id) {
          // Update existing event
          return prevEvents.map((ev) =>
            ev.id === eventData.id ? { ...ev, ...eventData } : ev
          );
        } else {
          // Create new event
          const newEvent: CalendarEvent = {
            ...eventData,
            id: Date.now().toString(), // Simple ID generation
          };
          return [...prevEvents, newEvent];
        }
      });
      setIsModalOpen(false); // Close modal after save
      setEditingEvent(null);
    },
    []
  );

  const deleteEvent = useCallback((id: string) => {
    setEvents((prevEvents) => prevEvents.filter((e) => e.id !== id));
    // Optional: Close modal if the deleted event was being edited
    if (editingEvent && "id" in editingEvent && editingEvent.id === id) {
      setIsModalOpen(false);
      setEditingEvent(null);
    }
  }, [editingEvent]);

  // --- Modal and Date Handling ---

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingEvent(null);
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
    // Optional: Add logic if needed when date changes, e.g., fetch new events
  }, []);

  return {
    events,
    selectedDate,
    isModalOpen,
    editingEvent,
    requestCreateEvent,
    requestEditEvent,
    saveEvent,
    deleteEvent,
    closeModal,
    handleDateChange,
  };
}
