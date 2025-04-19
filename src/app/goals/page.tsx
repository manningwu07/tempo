"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { KanbanBoard, defaultColumns } from "./kanbanBoard/kanbanBoard";
import type { Column, Goal } from "~/types/kanbanBoard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ColorPicker, COLORS, type ColorKey } from "~/components/colorPicker";
import { Plus } from "lucide-react";
import { Navbar } from "../navBar";

const MAX_GOALS = 10;

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState<ColorKey>("gray");

  const canAddGoal = goals.length < MAX_GOALS;

  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !canAddGoal) return; // Prevent adding if limit reached
    setGoals((gs) => [
      ...gs,
      {
        id: uuidv4(),
        title: newTitle.trim(),
        color: newColor,
        // Ensure columns get unique IDs if needed, though default might be fine
        columns: defaultColumns.map((c) => ({
          ...c,
          id: `${c.id}-${uuidv4()}`,
          tasks: [],
        })),
      },
    ]);
    setNewTitle("");
    setNewColor("gray");
  };

  const updateGoalColumns = (goalId: string, newColumns: Column[]) => {
    setGoals((currentGoals) =>
      currentGoals.map((goal) => {
        if (goal.id === goalId) {
          return { ...goal, columns: newColumns }; // Update the columns for the matched goal
        }
        return goal; // Return other goals unchanged
      }),
    );
  };

  const updateGoalColor = (id: string, colorKey: string) => {
    setGoals((gs) =>
      gs.map((g) => (g.id === id ? { ...g, color: colorKey } : g)),
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 p-6">
        <form
          onSubmit={addGoal}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <Input
            placeholder="New goal title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1"
            disabled={!canAddGoal} // Disable input if limit reached
          />
          <ColorPicker
            variant="saturated"
            value={newColor}
            onChange={setNewColor}
          />
          <Button
            type="submit"
            className="flex items-center gap-2"
            disabled={!canAddGoal}
          >
            <Plus className="h-4 w-4" /> Add Goal{" "}
            {canAddGoal ? "" : `(Max ${MAX_GOALS})`}
          </Button>
        </form>

        <div className="space-y-8">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="rounded-lg border-l-4 bg-white"
              style={{
                borderLeftColor: COLORS[goal.color as ColorKey].saturated,
              }}
            >
              <div className="flex items-center justify-between border-b px-4 py-2">
                <h2 className="text-lg font-bold">{goal.title}</h2>
                <ColorPicker
                  variant="saturated"
                  value={goal.color}
                  onChange={(colorKey) => updateGoalColor(goal.id, colorKey)}
                />
              </div>
              <div className="p-4">
                <KanbanBoard
                  key={goal.id} // Use goal.id for key here too
                  goalId={goal.id} // Pass goalId for context
                  initialColumns={goal.columns}
                  onColumnsChange={(newColumns) =>
                    updateGoalColumns(goal.id, newColumns)
                  } // Callback to update state here
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
