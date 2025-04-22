"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../navBar";
import type { CalendarEvent } from "./calendar/calendarView";
import { GoalsKanbanView } from "./kanbanBoard/goalsKanBan";
import CalendarView from "./calendar/calendarView";
import { KanbanSlider, SliderDirection } from "./kanbanBoard/kanbanSlider";
import { MiniCalendar } from "./calendar/miniMonthCalendar";
import { cn } from "~/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "~/components/ui/button"; // Assuming you use shadcn/ui Button

export default function GoalsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isKanbanCollapsed, setIsKanbanCollapsed] = useState(false);
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false);
  const [isMiniCalendarVisible, setIsMiniCalendarVisible] = useState(true); // New state

  // Handle Keyboard Shortcuts centrally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + E: Toggle Kanban (Left Panel)
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setIsKanbanCollapsed((prev) => !prev);
      }
      
      // Ctrl/Cmd + G: Toggle Calendar (Right Panel)
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setIsCalendarCollapsed((prev) => !prev);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsMiniCalendarVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array ensures this runs once

  // Update page title to reflect state - optional
  useEffect(() => {
    document.title = `Goals ${isKanbanCollapsed ? '(K)' : ''} ${isCalendarCollapsed ? '(C)' : ''}`;
  }, [isKanbanCollapsed, isCalendarCollapsed]);

  const handleCreate = (start: Date, end: Date, dayIndex: number) => {
    const newEvt: CalendarEvent = {
      id: Date.now().toString(),
      title: "New Event",
      description: "",
      start,
      end,
    };
    setEvents((ev) => [...ev, newEvt]);
  };

  const handleEdit = (evt: CalendarEvent) => {
    // Modal logic here
  };

  const handleDelete = (id: string) => {
    setEvents((ev) => ev.filter((e) => e.id !== id));
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // If calendar is collapsed, expand it when a date is clicked? Optional UX choice.
    // if (isCalendarCollapsed) {
    //   setIsCalendarCollapsed(false);
    // }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar with Goals and Mini Calendar */}
        <KanbanSlider 
          className="border-r" 
          direction={SliderDirection.Left}
          isCollapsed={isKanbanCollapsed}
          isCalendarCollapsed={isCalendarCollapsed}
        >
          <div className="flex h-full flex-col">
            {/* Mini Calendar Section - Conditionally render based on main calendar visibility */}
            
              <div className={cn(
                "transition-[max-height,padding] duration-300 ease-in-out overflow-hidden",
                isMiniCalendarVisible ? "max-h-[200px] p-2" : "max-h-0 p-0 pt-2" // Adjust max-h
              )}>
                <MiniCalendar 
                  selectedDate={selectedDate} 
                  onDateChange={handleDateChange}
                />
              </div>

            {/* Mini Calendar Toggle Button - Only show if main calendar is visible */}
            {!isCalendarCollapsed && (
              <div className="px-2 pb-1 border-b border-gray-200">
                 <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs text-gray-500 hover:bg-gray-100"
                    onClick={() => setIsMiniCalendarVisible((v) => !v)}
                  >
                    {isMiniCalendarVisible ? (
                      <>Hide Calendar <ChevronUp className="ml-1 h-3 w-3" /></>
                    ) : (
                      <>Show Calendar <ChevronDown className="ml-1 h-3 w-3" /></>
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

        {/* Calendar Main Area - Conditionally render */}
        {!isCalendarCollapsed && (
          <div className="flex-1 overflow-hidden">
            <CalendarView
              events={events}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>
    </div>
  );
}
