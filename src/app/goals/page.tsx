"use client";

import { Navbar } from "../navBar";
import { GoalsKanbanView } from "./kanbanBoard/goalsKanBan";

export default function GoalsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-6">
        <GoalsKanbanView />

        {/* Later, you might add the Calendar component here */}
        {/* <CalendarView /> */}
      </div>
    </>
  );
}
