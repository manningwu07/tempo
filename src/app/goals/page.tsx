"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../navBar";
import type { CalendarEvent } from "./calendar/calendarView";
import { GoalsKanbanView } from "./kanbanBoard/goalsKanBan";
import CalendarView from "./calendar/calendarView";
import { KanbanSlider } from "./kanbanBoard/kanbanSlider";
import MiniMonthCalendar from "./calendar/miniMonthCalendar";

export default function GoalsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Handle panel collapse state changes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setLeftCollapsed(prev => !prev);
      }
      
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setRightCollapsed(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    console.log("Edit event:", evt);
  };

  const handleDelete = (id: string) => {
    setEvents((ev) => ev.filter((e) => e.id !== id));
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // You could also scroll the calendar to that date
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Left Kanban Panel */}
        <KanbanSlider 
          className="border-r" 
          side="left"
          otherPanelCollapsed={rightCollapsed}
        >
          <div className="h-full flex flex-col">
            {/* Mini Calendar at the top */}
            <div className="p-4 border-b">
              <MiniMonthCalendar 
                currentDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>
            
            {/* Kanban Board */}
            <div className="flex-1 overflow-y-auto p-4">
              <GoalsKanbanView />
            </div>
          </div>
        </KanbanSlider>

        {/* Main Calendar Area */}
        <div className="flex-1 overflow-hidden">
          <CalendarView
            events={events}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Right Panel (can be used later for event details or another view) */}
        <KanbanSlider 
          className="border-l" 
          side="right"
          otherPanelCollapsed={leftCollapsed}
        >
          <div className="h-full p-4">
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            <p className="text-gray-500">Select an event to view details</p>
          </div>
        </KanbanSlider>
      </main>
    </div>
  );
}
