"use client";

import { useState } from "react";
import { Navbar } from "../navBar";
import type { CalendarEvent } from "./calendar/calendarView";
import { GoalsKanbanView } from "./kanbanBoard/goalsKanBan";
import CalendarView from "./calendar/calendarView";
import { KanbanSlider } from "./kanbanBoard/kanbanSlider";

export default function GoalsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

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

  return (
    <div className="flex h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar with Goals */}
        <KanbanSlider className="border-r">
          <div className="h-full overflow-y-auto p-4">
            <GoalsKanbanView />
          </div>
        </KanbanSlider>

        {/* Calendar Main Area */}
        <div className="flex-1 overflow-hidden">
          <CalendarView
            events={events}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
}
