"use client";
import { Navbar } from "../navBar";
import { useGoalsView } from "~/context/goalsViewContext";
import KanbanBoard, { defaultColumns } from "./kanbanBoard/kanbanBoard";
import type { Goal } from "~/types/kanbanBoard";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

export default function Goals() {
  const { view } = useGoalsView();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    const id = uuidv4();
    setGoals((gs) => [
      ...gs,
      {
        id,
        title: newGoalTitle.trim(),
        color: "gray-500",
        columns: defaultColumns.map((c) => ({ ...c, tasks: [] })),
      },
    ]);
    setNewGoalTitle("");
  }

  return (
    <div>
      <nav>
        <Navbar />
        <h1>{view === "short" ? "Short-Term Goals" : "Long-Term Goals"}</h1>
      </nav>

      <div className="min-h-screen bg-gray-100 p-6">
        <form onSubmit={addGoal} className="flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2"
            placeholder="New Goal Title"
            value={newGoalTitle}
            onChange={(e) => setNewGoalTitle(e.target.value)}
          />
          <button
            type="submit"
            className="rounded bg-green-600 px-4 py-2 text-white"
          >
            Add Goal
          </button>
        </form>

        <div className="mt-6 space-y-8">
          {goals.map((goal: Goal) => (
            <KanbanBoard
              key={goal.id}
              title={goal.title}
              initialColumns={goal.columns}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
