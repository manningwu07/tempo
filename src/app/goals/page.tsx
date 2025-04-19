"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
// DnD Imports for Goal Reordering
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
  useSortable, // Hook for individual goal items
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities"; // For transform styles

import { KanbanBoard, defaultColumns } from "./kanbanBoard/kanbanBoard";
import type { Goal, Column } from "~/types/kanbanBoard";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ColorPicker, COLORS, type ColorKey } from "~/components/colorPicker";
import {
  Plus,
  GripVertical,
  Trash2,
  Check,
  X as CancelIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { ConfirmationModal } from "./kanbanBoard/confirmationModal";
import { Navbar } from "../navBar";

const MAX_GOALS = 10;

// New Component for rendering a single Goal (makes DnD easier)
interface GoalItemProps {
  goal: Goal;
  isEditing: boolean;
  isDragging?: boolean; // Style when dragging
  onStartEdit: (id: string) => void;
  onSaveEdit: (id: string, newTitle: string) => void;
  onCancelEdit: () => void;
  onDeleteRequest: (id: string) => void;
  onUpdateGoalColor: (id: string, color: ColorKey) => void;
  onUpdateGoalColumns: (id: string, columns: Column[]) => void;
}

function GoalItem({
  goal,
  isEditing,
  isDragging,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteRequest,
  onUpdateGoalColor,
  onUpdateGoalColumns,
}: GoalItemProps) {
  const [editTitle, setEditTitle] = useState(goal.title);

  const {
    attributes, // For a11y
    listeners, // For drag handle
    setNodeRef, // Ref for the sortable element
    transform,
    transition,
    isSorting, // Different from isDragging in DndContext
  } = useSortable({ id: goal.id, data: { type: "Goal", goal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 250ms ease", // Add default transition
    opacity: isSorting ? 0.5 : 1,
    zIndex: isSorting ? 10 : "auto", // Bring dragged item forward
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      onSaveEdit(goal.id, editTitle.trim());
    } else {
      // Revert if title is empty on save attempt
      setEditTitle(goal.title);
      onCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditTitle(goal.title); // Revert on escape
      onCancelEdit();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-white shadow transition-shadow duration-200",
        isDragging && "shadow-xl", // Style for the overlay clone
      )}
    >
      {/* Goal Header */}
      <div
        className="flex items-center justify-between border-b border-l-4 px-4 py-2"
        style={{
          borderLeftColor: COLORS[goal.color as ColorKey]?.saturated ?? "#ccc",
        }}
      >
        {/* Drag Handle */}
        <button
          {...listeners}
          className="absolute top-0 bottom-0 -left-0 z-10 flex cursor-grab items-center px-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          aria-label="Drag goal"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Title / Edit Input */}
        <div className="flex-1 pl-4">
          {" "}
          {/* Add padding to avoid handle overlap */}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-lg font-bold"
                autoFocus
                onBlur={handleSave} // Save on blur as well
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={handleSave}
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setEditTitle(goal.title);
                  onCancelEdit();
                }}
              >
                <CancelIcon className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <h2
              className="cursor-pointer text-lg font-bold hover:text-blue-600"
              onClick={() => {
                setEditTitle(goal.title);
                onStartEdit(goal.id);
              }}
              title="Click to rename"
            >
              {goal.title}
            </h2>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <ColorPicker
            variant="saturated"
            value={goal.color}
            onChange={(colorKey) => onUpdateGoalColor(goal.id, colorKey)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:bg-red-100 hover:text-red-600"
            onClick={() => onDeleteRequest(goal.id)}
            aria-label="Delete goal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* Kanban Board */}
      <KanbanBoard
        goalId={goal.id}
        initialColumns={goal.columns}
        onColumnsChange={(newColumns) =>
          onUpdateGoalColumns(goal.id, newColumns)
        }
      />
    </div>
  );
}

// Main Page Component
export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState<ColorKey>("gray");

  // State for Goal Editing
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // State for Goal Deletion Modal
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State for Dragging Goal
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);

  const canAddGoal = goals.length < MAX_GOALS;

  // Sensors for Goal Dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require slightly more movement to drag a whole goal
      },
    }),
  );

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

  // --- Goal Editing Handlers ---
  const handleStartEditGoal = (id: string) => {
    setEditingGoalId(id);
  };

  const handleSaveEditGoal = (id: string, newTitle: string) => {
    setGoals((gs) =>
      gs.map((g) => (g.id === id ? { ...g, title: newTitle } : g)),
    );
    setEditingGoalId(null); // Exit edit mode
  };

  const handleCancelEditGoal = () => {
    setEditingGoalId(null);
  };

  // --- Goal Deletion Handlers ---
  const handleDeleteGoalRequest = (id: string) => {
    setDeletingGoalId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteGoal = () => {
    if (deletingGoalId) {
      setGoals((gs) => gs.filter((g) => g.id !== deletingGoalId));
    }
    setIsDeleteModalOpen(false);
    setDeletingGoalId(null);
  };

  const handleCancelDeleteGoal = () => {
    setIsDeleteModalOpen(false);
    setDeletingGoalId(null);
  };

  // --- Goal Dragging Handlers ---
  const handleGoalDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const goal = goals.find((g) => g.id === active.id);
    if (goal) {
      setActiveGoal(goal);
    }
  };

  const handleGoalDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveGoal(null); // Clear active goal display

    if (over && active.id !== over.id) {
      setGoals((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items; // Should not happen
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 p-6">
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

        {/* Goals List - Wrapped in DnD Context */}
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

          {/* Drag Overlay for Goals */}
          <DragOverlay>
            {activeGoal ? (
              <GoalItem
                goal={activeGoal}
                isEditing={false} // Never show editing state in overlay
                isDragging={true} // Apply dragging styles
                // Pass dummy handlers for overlay
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
      </div>
    </>
  );
}
