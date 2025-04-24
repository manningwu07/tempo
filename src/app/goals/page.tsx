// src/app/goals/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../navBar";
import { GoalsKanbanView } from "./kanbanBoard/goalsKanBan";
import CalendarView, { type CalendarEvent } from "./calendar/calendarView";
import { KanbanSlider, SliderDirection } from "./kanbanBoard/kanbanSlider";
import { MiniCalendar } from "./calendar/miniMonthCalendar";
import { cn } from "~/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useCalendarEvents } from "./calendar/useCalendarEvents";
import { EventEditModal } from "./calendar/eventModal";
import { EventQuickAddPopover } from "./calendar/eventQuickAddPopover";
import { COLORS } from "~/components/colorPicker";

const initialCalendarEvents: CalendarEvent[] | undefined = [
  {
    id: "1",
    title: "Team Meeting",
    start: new Date(2025, 3, 24, 10, 0),
    end: new Date(2025, 3, 24, 11, 0),
    goalColor: "blue",
    description: "",
  },
  {
    id: "2",
    title: "Code Review",
    start: new Date(2025, 3, 25, 14, 0),
    end: new Date(2025, 3, 25, 15, 30),
    taskColor: "blue",
    description: "Review PR #123",
  },
];

// Use the hook to manage calendar state and logic
export default function GoalsPage() {
  const {
    events,
    selectedDate,
    isPopoverOpen,
    popoverData, // Includes position: {x, y}
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
    // Destructure other Kanban/Goal state/handlers if they exist in the hook
  } = useCalendarEvents(initialCalendarEvents);

  const [isKanbanCollapsed, setIsKanbanCollapsed] = useState(false);
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false);
  const [isMiniCalendarVisible, setIsMiniCalendarVisible] = useState(true);

  // Keyboard shortcuts remain the same
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        setIsKanbanCollapsed((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        setIsCalendarCollapsed((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsMiniCalendarVisible((prev) => !prev);
      }
      // Optional: Close modal on Escape key
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeModal]); // Add closeModal dependency

  // Test for whether shortcuts still work
  // useEffect(() => {
  //   document.title = `Goals ${isKanbanCollapsed ? "(K)" : ""} ${
  //     isCalendarCollapsed ? "(C)" : ""
  //   }`;
  // }, [isKanbanCollapsed, isCalendarCollapsed]);

  return (
    <div className="flex h-screen flex-col bg-white">
      <Navbar />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <KanbanSlider
          className="border-r"
          direction={SliderDirection.Left}
          isCollapsed={isKanbanCollapsed}
          isCalendarCollapsed={isCalendarCollapsed}
        >
          <div className="flex h-full flex-col">
            {/* Mini Calendar Section */}
            <div
              className={cn(
                "overflow-hidden transition-[max-height,padding] duration-300 ease-in-out",
                isMiniCalendarVisible
                  ? "max-h-[200px] p-2" // Adjust max-h
                  : "max-h-0 p-0 pt-2",
              )}
            >
              <MiniCalendar
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>

            {/* Mini Calendar Toggle Button */}
            {!isCalendarCollapsed && (
              <div className="border-b border-gray-200 px-2 pb-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs text-gray-500 hover:bg-gray-100"
                  onClick={() => setIsMiniCalendarVisible((v) => !v)}
                >
                  {isMiniCalendarVisible ? (
                    <>
                      Hide Calendar <ChevronUp className="ml-1 h-3 w-3" />
                    </>
                  ) : (
                    <>
                      Show Calendar <ChevronDown className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Kanban Board */}
            <div className="flex-1 overflow-y-auto p-4">
              <GoalsKanbanView />
            </div>
          </div>
        </KanbanSlider>

        {/* Calendar Main Area */}
        {!isCalendarCollapsed && (
          <div className="flex-1 overflow-hidden">
            <CalendarView
              events={events}
              currentDate={selectedDate}
              onOpenPopover={requestOpenPopover} // Now expects position
              onEdit={requestEditEvent}
              onDelete={deleteEvent}
            />
          </div>
        )}
      </main>

      {/* Event Edit Modal */}
      {popoverData && (
        <EventQuickAddPopover
          isOpen={isPopoverOpen}
          onOpenChange={(open) => !open && closePopover()}
          initialData={popoverData} // Contains start/end passed from the hook
          onSave={saveFromPopover} // Hook's handler for saving from popover
          onOpenFullModal={requestOpenFullModal} // Hook's handler to escalate to modal
          // Pass anchor info here if you implement positioning
        />
      )}

      {/* Render the Modal - Controlled by state */}
      <EventEditModal
        isOpen={isModalOpen}
        eventData={modalEventData} // Contains full event or data from popover
        onClose={closeModal}
        onSave={saveFromModal} // Hook's handler for saving from modal
        onDelete={deleteEvent} // Pass delete handler
      />
    </div>
  );
}
