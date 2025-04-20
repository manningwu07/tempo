"use client";

import { useState } from "react";
import { Navbar } from "../navBar";
import type { CalendarEvent } from "./calendar/calendarView";
import { GoalsKanbanView } from "./kanbanBoard/goalsKanBan";
import CalendarView from "./calendar/calendarView";

export default function GoalsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const handleCreate = (start: any, end: any) => {
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
    // open modal → update title/desc/dates/goal/task/type → then:
    // setEvents(ev => ev.map(e => e.id===evt.id ? updatedEvt : e))
  };

  const handleDelete = (id: string) => {
    setEvents((ev) => ev.filter((e) => e.id !== id));
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-6">
        <div style={{ display: "flex" }}>
          {/* <GoalsKanbanView /> */}
          <CalendarView
            events={events}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </>
  );
}
