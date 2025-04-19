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
import {
  loadGoalsFromDB,
  saveGoal,
  deleteGoalDB,
  saveGoalOrder,
} from "~/lib/indexedDB"
import { defaultColumns } from "./kanbanBoard";
import { GoalItem } from "./goalPath";
import { useDebouncedCallback } from "use-debounce";

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
    let isMounted = true
    async function loadData() {
      console.log("Attempting to load goals from DB...")
      try {
        const loadedGoals = await loadGoalsFromDB()
        if (isMounted) {
          setGoals(loadedGoals)
          console.log("Finished loading goals.", loadedGoals)
        }
      } catch (error) {
        console.error("Failed to load goals:", error)
        // Handle error state if needed
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  // --- Effect for Saving Changes (Debounced) ---
  const debouncedSaveGoal = useDebouncedCallback(async (goal: Goal) => {
    console.log(`Debounced save for goal ${goal.id}`)
    try {
      await saveGoal(goal)
    } catch (error) {
      console.error(`Failed to save goal ${goal.id}:`, error)
      // Handle save error (e.g., show notification)
    }
  }, SAVE_DEBOUNCE_MS)

  // Debounce saving goal order changes
  const debouncedSaveOrder = useDebouncedCallback(async (orderedIds: string[]) => {
    console.log("Debounced save for goal order")
    try {
      await saveGoalOrder(orderedIds)
    } catch (error) {
      console.error("Failed to save goal order:", error)
      // Handle save error
    }
  }, SAVE_DEBOUNCE_MS)

  // --- All handlers now live here ---

 // --- Handlers calling specific DB functions ---
 const addGoal = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!newTitle.trim() || !canAddGoal) return

  const newGoal: Goal = {
    id: uuidv4(),
    title: newTitle.trim(),
    color: newColor,
    columns: defaultColumns, // Use your default structure
  }

  const newGoals = [...goals, newGoal]
  setGoals(newGoals) // Update state first for UI responsiveness

  try {
    await saveGoal(newGoal) // Save the new goal immediately
    await saveGoalOrder(newGoals.map((g) => g.id)) // Update the order immediately
    console.log(`Goal ${newGoal.id} added and order saved.`)
  } catch (error) {
    console.error("Failed to save new goal or order:", error)
    // Optionally revert state or show error
  }

  setNewTitle("")
  setNewColor("gray")
}

// Called when columns within a goal change (tasks added/moved/edited, column renamed etc.)
const updateGoalColumns = (goalId: string, newColumns: Column[]) => {
  let updatedGoal: Goal | undefined
  setGoals((currentGoals) =>
    currentGoals.map((goal) => {
      if (goal.id === goalId) {
        updatedGoal = { ...goal, columns: newColumns }
        return updatedGoal
      }
      return goal
    })
  )

  // Debounce the save for this specific goal
  if (updatedGoal) {
    debouncedSaveGoal(updatedGoal)
  }
}

// Called when a goal's top-level properties (title, color) change
const updateGoalDetails = (
  goalId: string,
  updates: Partial<Pick<Goal, "title" | "color">>
) => {
  let updatedGoal: Goal | undefined
  setGoals((gs) =>
    gs.map((g) => {
      if (g.id === goalId) {
        updatedGoal = { ...g, ...updates }
        return updatedGoal
      }
      return g
    })
  )
  if (updatedGoal) {
    debouncedSaveGoal(updatedGoal) // Debounce save
  }
}

// --- Goal Edit Handlers ---
const handleStartEditGoal = (id: string) => setEditingGoalId(id)
const handleCancelEditGoal = () => setEditingGoalId(null)
const handleSaveEditGoal = (id: string, newTitle: string) => {
  updateGoalDetails(id, { title: newTitle }) // Use the generalized update function
  setEditingGoalId(null)
}
const updateGoalColorHandler = (id: string, colorKey: ColorKey) => {
  updateGoalDetails(id, { color: colorKey }) // Use the generalized update function
}

// --- Goal Delete Handlers ---
const handleDeleteGoalRequest = (id: string) => {
  setDeletingGoalId(id)
  setIsDeleteModalOpen(true)
}
const handleCancelDeleteGoal = () => {
  setIsDeleteModalOpen(false)
  setDeletingGoalId(null)
}
const handleConfirmDeleteGoal = async () => {
  if (!deletingGoalId) return

  const goalToDeleteId = deletingGoalId
  const newGoals = goals.filter((g) => g.id !== goalToDeleteId)

  setGoals(newGoals) // Update state first
  handleCancelDeleteGoal() // Close modal

  try {
    await deleteGoalDB(goalToDeleteId) // Delete from DB immediately
    await saveGoalOrder(newGoals.map((g) => g.id)) // Update order immediately
    console.log(`Goal ${goalToDeleteId} deleted and order saved.`)
  } catch (error) {
    console.error("Failed to delete goal or save order:", error)
    // Optionally revert state or show error
  }
}

// --- Goal Drag Handlers ---
const handleGoalDragStart = (event: DragStartEvent) => {
  const { active } = event
  const goal = goals.find((g) => g.id === active.id)
  if (goal) setActiveGoal(goal)
}
const handleGoalDragEnd = (event: DragEndEvent) => {
  const { active, over } = event
  setActiveGoal(null)

  if (over && active.id !== over.id) {
    const oldIndex = goals.findIndex((item) => item.id === active.id)
    const newIndex = goals.findIndex((item) => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderedGoals = arrayMove(goals, oldIndex, newIndex)
      setGoals(newOrderedGoals) // Update state immediately

      // Debounce saving the new order
      debouncedSaveOrder(newOrderedGoals.map((g) => g.id))
    }
  }
}
  const updateGoalColor = (id: string, colorKey: ColorKey) => {
    setGoals((gs) =>
      gs.map((g) => (g.id === id ? { ...g, color: colorKey } : g)),
    );
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
