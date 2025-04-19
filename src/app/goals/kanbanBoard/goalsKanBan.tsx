"use client";

// All the imports needed for goals management, DnD, DB, etc.
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import type { Goal, Column } from "~/types/kanbanBoard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ColorPicker, COLORS, type ColorKey } from "~/components/colorPicker";
import { Plus } from "lucide-react";
import { ConfirmationModal } from "./confirmationModal";
import { loadGoalsFromDB, saveGoalsToDB } from "~/lib/indexedDB";
import { defaultColumns } from "./kanbanBoard";
import { GoalItem } from "./goalPath";

const MAX_GOALS = 10;
const SAVE_DEBOUNCE_MS = 750;

export function GoalsKanbanView() {
  // All state related to goals lives here now
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState<ColorKey>("gray");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  const canAddGoal = goals.length < MAX_GOALS;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Effect for Initial Loading ---
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      console.log("Attempting to load goals from DB...");
      const loadedGoals = await loadGoalsFromDB();
      if (isMounted) {
        setGoals(loadedGoals);
        setIsLoading(false);
        console.log("Finished loading goals.");
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 0);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // --- Effect for Saving Changes (Debounced) ---
  useEffect(() => {
    if (isLoading || isInitialLoad.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    console.log("Goal state changed, scheduling save...");
    saveTimeoutRef.current = setTimeout(() => {
      console.log("Debounce timer elapsed, saving goals...");
      saveGoalsToDB(goals);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [goals, isLoading]);

  // --- All handlers now live here ---
  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !canAddGoal) return;
    setGoals((gs) => [
      ...gs,
      {
        id: uuidv4(),
        title: newTitle.trim(),
        color: newColor,
        columns: defaultColumns,
      },
    ]);
    setNewTitle("");
    setNewColor("gray");
  };

  const updateGoalColor = (id: string, colorKey: ColorKey) => {
    setGoals((gs) =>
      gs.map((g) => (g.id === id ? { ...g, color: colorKey } : g)),
    );
  };

  const updateGoalColumns = (goalId: string, newColumns: Column[]) => {
    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === goalId ? { ...goal, columns: newColumns } : goal,
      ),
    );
  };

  const handleStartEditGoal = (id: string) => setEditingGoalId(id);
  const handleCancelEditGoal = () => setEditingGoalId(null);
  const handleSaveEditGoal = (id: string, newTitle: string) => {
    setGoals((gs) =>
      gs.map((g) => (g.id === id ? { ...g, title: newTitle } : g)),
    );
    setEditingGoalId(null);
  };

  const handleDeleteGoalRequest = (id: string) => {
    setDeletingGoalId(id);
    setIsDeleteModalOpen(true);
  };
  const handleCancelDeleteGoal = () => {
    setIsDeleteModalOpen(false);
    setDeletingGoalId(null);
  };
  const handleConfirmDeleteGoal = () => {
    if (deletingGoalId) {
      setGoals((gs) => gs.filter((g) => g.id !== deletingGoalId));
    }
    handleCancelDeleteGoal();
  };

  const handleGoalDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const goal = goals.find((g) => g.id === active.id);
    if (goal) setActiveGoal(goal);
  };
  const handleGoalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGoal(null);
    if (over && active.id !== over.id) {
      setGoals((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // --- Render Logic ---
  if (isLoading) {
    return <div className="p-6 text-center">Loading goals...</div>;
  }

  return (
    <>
      {/* Add Goal Form */}
      <form
        onSubmit={addGoal}
        className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-white p-4 shadow-sm"
      >
        <Input
          placeholder="New goal title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1"
          disabled={!canAddGoal}
        />
        <ColorPicker
          variant="saturated"
          value={newColor}
          onChange={(c: string) => setNewColor(c as ColorKey)}
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

      {/* Goals List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleGoalDragStart}
        onDragEnd={handleGoalDragEnd}
      >
        <SortableContext
          items={goals.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-8">
            {goals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                isEditing={editingGoalId === goal.id}
                onStartEdit={handleStartEditGoal}
                onSaveEdit={handleSaveEditGoal}
                onCancelEdit={handleCancelEditGoal}
                onDeleteRequest={handleDeleteGoalRequest}
                onUpdateGoalColor={updateGoalColor}
                onUpdateGoalColumns={updateGoalColumns}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeGoal ? (
            <GoalItem
              goal={activeGoal}
              isDragging={true}
              isEditing={false}
              onStartEdit={() => {}}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
              onDeleteRequest={() => {}}
              onUpdateGoalColor={() => {}}
              onUpdateGoalColumns={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Goal Deletion Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDeleteGoal}
        onConfirm={handleConfirmDeleteGoal}
        title="Delete Goal?"
        description={`Are you sure you want to delete the goal "${goals.find((g) => g.id === deletingGoalId)?.title ?? ""}" and all its columns/tasks? This action cannot be undone.`}
      />
    </>
  );
}
